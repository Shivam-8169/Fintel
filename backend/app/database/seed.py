"""
Database Seed and Initialization Script for Fintel.
Creates tables, seeds demo investigator and admin accounts, ingests synthetic datasets,
runs the detection pipeline to produce rich immediate demo cases, and attaches investigator notes to valid cases.
"""

import os
import sys
import pandas as pd
from datetime import datetime

# Add backend directory and workspace root to sys.path so app and scripts can be imported
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.database import engine, SessionLocal, Base, init_db_schema
from app.database.models import User, Customer, Account, Transaction, Case, InvestigatorNote
from app.utils.security import hash_password
from app.utils.datetime_utils import utcnow
from app.agents.ingestion_agent import IngestionAgent
from app.services.detection_service import DetectionService
from app.agents.investigation_agent import InvestigationAgent
from app.agents.reporting_agent import ReportingAgent
from scripts.generate_synthetic_data import generate_synthetic_data, OUTPUT_DIR


def seed_database():
    """Initializes schema and populates demo data in an idempotent manner."""
    print("=== Fintel Database Seeding ===")
    
    # 1. Schema Initialization
    print("1. Creating database schema and verifying tables...")
    try:
        init_db_schema()
        print("   -> Schema verified.")
    except Exception as e:
        print(f"   [!] Error initializing schema: {e}")
        raise

    db = SessionLocal()
    try:
        # 2. Demo Users Setup
        print("2. Ensuring default system users exist...")
        admin_user = db.query(User).filter(User.email == "admin@fintel.local").first()
        if not admin_user:
            admin_user = User(
                name="System Administrator",
                email="admin@fintel.local",
                password_hash=hash_password("admin123"),
                role="Admin",
                status="Active",
                created_at=utcnow()
            )
            db.add(admin_user)
            print("   -> Created admin@fintel.local (password: admin123, role: Admin)")
        else:
            admin_user.role = "Admin"
            admin_user.status = "Active"
            print("   -> Account admin@fintel.local already exists.")

        lead_user = db.query(User).filter(User.email == "investigator@fintel.local").first()
        if not lead_user:
            lead_user = User(
                name="Shivam Sharma",
                email="investigator@fintel.local",
                password_hash=hash_password("investigator123"),
                role="Lead Investigator",
                status="Active",
                created_at=utcnow()
            )
            db.add(lead_user)
            print("   -> Created investigator@fintel.local (password: investigator123, role: Lead Investigator)")
        else:
            lead_user.role = "Lead Investigator"
            lead_user.status = "Active"
            lead_user.name = "Shivam Sharma"
            print("   -> Account investigator@fintel.local already exists.")

        investigator_user = db.query(User).filter(User.email == "priya.patel@fintel.local").first()
        if not investigator_user:
            investigator_user = User(
                name="Priya Patel",
                email="priya.patel@fintel.local",
                password_hash=hash_password("investigator123"),
                role="Investigator",
                status="Active",
                created_at=utcnow()
            )
            db.add(investigator_user)
            print("   -> Created priya.patel@fintel.local (password: investigator123, role: Investigator)")
        else:
            investigator_user.role = "Investigator"
            investigator_user.status = "Active"
            print("   -> Account priya.patel@fintel.local already exists.")

        db.commit()

        # 3. Synthetic Entities & Transactions Ingestion
        tx_count = db.query(Transaction).count()
        if tx_count == 0:
            print("3. Ingesting synthetic AML entity and transaction datasets...")
            cust_csv_path = os.path.join(OUTPUT_DIR, "customers.csv")
            if not os.path.exists(cust_csv_path):
                generate_synthetic_data()

            agent = IngestionAgent(db)

            with open(os.path.join(OUTPUT_DIR, "customers.csv"), "rb") as f:
                c_sum = agent.ingest_customers_csv(f.read(), "customers.csv")
            print(f"   -> Customers ingested: {c_sum.records_valid} valid, {c_sum.records_rejected} rejected.")

            with open(os.path.join(OUTPUT_DIR, "accounts.csv"), "rb") as f:
                a_sum = agent.ingest_accounts_csv(f.read(), "accounts.csv")
            print(f"   -> Accounts ingested: {a_sum.records_valid} valid, {a_sum.records_rejected} rejected.")

            with open(os.path.join(OUTPUT_DIR, "transactions.csv"), "rb") as f:
                t_sum = agent.ingest_transactions_csv(f.read(), "transactions.csv")
            print(f"   -> Transactions ingested: {t_sum.records_valid} valid, {t_sum.records_rejected} rejected.")
        else:
            print(f"3. Data already loaded: database contains {tx_count} transactions.")

        # 4. Detection & Risk Scoring Pipeline (Creates Cases FIRST)
        print("4. Executing Detection & Risk Scoring pipeline across all entities...")
        detection_service = DetectionService(db)
        detection_results = detection_service.run_detection_pipeline()
        cases_created = [r for r in detection_results if r.case_created]
        total_cases = db.query(Case).count()
        print(f"   -> Detection complete. {len(cases_created)} new cases created; total cases: {total_cases}.")

        # 5. Investigator Notes Ingestion (Runs AFTER Cases have been generated)
        print("5. Ingesting investigator notes associated with valid cases...")
        notes_csv_path = os.path.join(OUTPUT_DIR, "investigator_notes.csv")
        if os.path.exists(notes_csv_path):
            df_notes = pd.read_csv(notes_csv_path)
            notes_added = 0
            notes_skipped = 0
            
            for _, row in df_notes.iterrows():
                note_id = str(row["note_id"]).strip()
                existing = db.query(InvestigatorNote).filter(InvestigatorNote.note_id == note_id).first()
                if existing:
                    continue

                # Locate matching case created by detection pipeline
                target_case = None
                target_account = row.get("target_account")
                if pd.notna(target_account) and str(target_account).strip():
                    target_case = db.query(Case).filter(Case.account_id == str(target_account).strip()).first()
                
                if not target_case and row.get("case_id") and pd.notna(row.get("case_id")):
                    target_case = db.query(Case).filter(Case.case_id == str(row["case_id"]).strip()).first()

                if not target_case:
                    # Fallback to highest risk score case if available
                    target_case = db.query(Case).order_by(Case.risk_score.desc()).first()

                if target_case:
                    note = InvestigatorNote(
                        note_id=note_id,
                        case_id=target_case.case_id,
                        note_text=str(row["note_text"]),
                        created_at=utcnow()
                    )
                    db.add(note)
                    notes_added += 1
                else:
                    notes_skipped += 1
                    print(f"   [!] Warning: Skipping note '{note_id}' — no matching cases found in database.")

            db.commit()
            print(f"   -> Investigator notes processed: {notes_added} added, {notes_skipped} skipped/already existing.")
        else:
            print("   -> No investigator_notes.csv file found.")

        # 6. Pre-generate Sample AI Investigation & SAR Report
        print("6. Pre-generating sample AI Investigation and SAR Draft for top suspicious case...")
        top_case = db.query(Case).order_by(Case.risk_score.desc()).first()
        if top_case:
            inv_agent = InvestigationAgent(db)
            rep_agent = ReportingAgent(db)
            inv_agent.investigate_case(top_case.case_id)
            rep_agent.generate_draft_report(top_case.case_id)
            print(f"   -> Case {top_case.case_id} (Account: {top_case.account_id}, Score: {top_case.risk_score}) ready with full AI investigation narrative and SAR Draft!")
        else:
            print("   -> No suspicious cases thresholded; skipping sample AI investigation synthesis.")

        print("\n=== Seeding Completed Successfully! ===")

    except Exception as e:
        db.rollback()
        print(f"\n[!] SEED ERROR: Database seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

