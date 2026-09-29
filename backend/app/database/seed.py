"""
Database Seed and Initialization Script for Fintel.
Creates tables, seeds demo investigator and admin accounts, ingests synthetic datasets,
and runs the detection pipeline to produce rich, immediate demo cases.
"""

import os
import sys
from datetime import datetime

# Add backend directory and workspace root to sys.path so app and scripts can be imported
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.database import engine, SessionLocal, Base
from app.database.models import User, Customer, Account, Transaction, InvestigatorNote
from app.utils.security import hash_password
from app.utils.datetime_utils import utcnow
from app.agents.ingestion_agent import IngestionAgent
from app.services.detection_service import DetectionService
from app.agents.investigation_agent import InvestigationAgent
from app.agents.reporting_agent import ReportingAgent
from scripts.generate_synthetic_data import generate_synthetic_data, OUTPUT_DIR


from app.database.database import engine, SessionLocal, Base, init_db_schema


def seed_database():
    """Initializes schema and populates demo data."""
    print("=== Fintel Database Seeding ===")
    print("1. Creating database schema and running migrations...")
    init_db_schema()

    db = SessionLocal()
    try:
        # Check / Create Demo Users
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

        db.commit()

        # Check if transactions already exist
        tx_count = db.query(Transaction).count()
        if tx_count == 0:
            print("3. Generating and ingesting synthetic AML data...")
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

            # Ingest investigator notes
            notes_csv_path = os.path.join(OUTPUT_DIR, "investigator_notes.csv")
            if os.path.exists(notes_csv_path):
                import pandas as pd
                df_notes = pd.read_csv(notes_csv_path)
                for _, row in df_notes.iterrows():
                    note = InvestigatorNote(
                        note_id=str(row["note_id"]),
                        case_id=str(row.get("case_id", "CASE-DEMO")),
                        note_text=str(row["note_text"]),
                        created_at=utcnow()
                    )
                    db.add(note)
                db.commit()
        else:
            print(f"3. Database already contains {tx_count} transactions.")

        print("4. Executing Detection & Risk Scoring pipeline across all entities...")
        detection_service = DetectionService(db)
        detection_results = detection_service.run_detection_pipeline()
        cases_created = [r for r in detection_results if r.case_created]
        print(f"   -> Detection complete. Flagged {len(cases_created)} suspicious cases exceeding threshold.")

        print("5. Pre-generating sample AI Investigation and SAR Draft for top suspicious case...")
        from app.database.models import Case
        top_case = db.query(Case).order_by(Case.risk_score.desc()).first()
        if top_case:
            inv_agent = InvestigationAgent(db)
            rep_agent = ReportingAgent(db)
            inv_agent.investigate_case(top_case.case_id)
            rep_agent.generate_draft_report(top_case.case_id)
            print(f"   -> Case {top_case.case_id} (Account: {top_case.account_id}, Score: {top_case.risk_score}) ready with full AI investigation narrative and SAR Draft!")

        print("\n=== Seeding Completed Successfully! ===")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
