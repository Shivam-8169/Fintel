"""
Data Ingestion Agent for Fintel.
Handles parsing, schema validation, data type normalization, referential integrity,
duplicate detection, error isolation, and database insertion.
"""

import io
import re
from datetime import datetime
from typing import Dict, Any, List, Tuple
import pandas as pd
from sqlalchemy.orm import Session

from app.database.models import Customer, Account, Transaction, InvestigatorNote
from app.schemas.data import IngestionSummary, IngestionWarning


class IngestionAgent:
    """Agent responsible for ingesting, validating, and normalizing AML datasets."""

    REQUIRED_CUSTOMER_COLUMNS = {"customer_id", "name"}
    REQUIRED_ACCOUNT_COLUMNS = {"account_id"}
    REQUIRED_TRANSACTION_COLUMNS = {"transaction_id", "sender_account", "receiver_account", "amount"}
    REQUIRED_NOTE_COLUMNS = {"note_id", "note_text"}

    def __init__(self, db: Session):
        self.db = db

    def ingest_customers_csv(self, file_content: bytes, filename: str = "customers.csv") -> IngestionSummary:
        """Ingests and validates customer records from CSV."""
        summary = IngestionSummary(
            dataset_name=filename,
            records_received=0,
            records_valid=0,
            records_rejected=0
        )

        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            summary.warnings.append(IngestionWarning(
                row=0,
                field="file",
                message=f"Could not parse CSV: {str(e)}",
                rejected=True
            ))
            return summary

        summary.records_received = len(df)
        missing_cols = self.REQUIRED_CUSTOMER_COLUMNS - set(df.columns)
        if missing_cols:
            summary.records_rejected = len(df)
            summary.warnings.append(IngestionWarning(
                row=0,
                field="columns",
                message=f"Missing required columns: {list(missing_cols)}",
                rejected=True
            ))
            return summary

        seen_ids = set()
        existing_ids = {c[0] for c in self.db.query(Customer.customer_id).all()}

        for row_idx, (_, row) in enumerate(df.iterrows(), start=2):
            row_num = row_idx
            cid = str(row.get("customer_id", "")).strip()
            name = str(row.get("name", "")).strip()

            if not cid or cid.lower() in ("nan", "none", ""):
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="customer_id", message="Empty customer_id", rejected=True
                ))
                continue

            if cid in seen_ids or cid in existing_ids:
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="customer_id", message=f"Duplicate customer_id '{cid}'", rejected=True
                ))
                continue

            if not name or name.lower() in ("nan", "none", ""):
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="name", message="Customer name is required", rejected=True
                ))
                continue

            country = str(row.get("country", "IND")).strip().upper()
            if country in ("NAN", "NONE", ""):
                country = "IND"
            occupation = str(row.get("occupation", "")).strip()
            if occupation.lower() in ("nan", "none", ""):
                occupation = "Unknown"

            risk_level = str(row.get("risk_level", "LOW")).strip().upper()
            if risk_level not in ("LOW", "MEDIUM", "HIGH"):
                risk_level = "LOW"

            new_customer = Customer(
                customer_id=cid,
                name=name,
                country=country,
                occupation=occupation,
                risk_level=risk_level
            )
            self.db.add(new_customer)
            seen_ids.add(cid)
            summary.records_valid += 1
            summary.customers_added += 1

        self.db.commit()
        return summary

    def ingest_accounts_csv(self, file_content: bytes, filename: str = "accounts.csv") -> IngestionSummary:
        """Ingests and validates account records from CSV."""
        summary = IngestionSummary(
            dataset_name=filename,
            records_received=0,
            records_valid=0,
            records_rejected=0
        )

        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            summary.warnings.append(IngestionWarning(
                row=0, field="file", message=f"Could not parse CSV: {str(e)}", rejected=True
            ))
            return summary

        summary.records_received = len(df)
        missing_cols = self.REQUIRED_ACCOUNT_COLUMNS - set(df.columns)
        if missing_cols:
            summary.records_rejected = len(df)
            summary.warnings.append(IngestionWarning(
                row=0, field="columns", message=f"Missing required columns: {list(missing_cols)}", rejected=True
            ))
            return summary

        existing_cids = {c[0] for c in self.db.query(Customer.customer_id).all()}
        existing_aids = {a[0] for a in self.db.query(Account.account_id).all()}
        seen_aids = set()

        for row_idx, (_, row) in enumerate(df.iterrows(), start=2):
            row_num = row_idx
            aid = str(row.get("account_id", "")).strip()

            if not aid or aid.lower() in ("nan", "none", ""):
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="account_id", message="Empty account_id", rejected=True
                ))
                continue

            if aid in seen_aids or aid in existing_aids:
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="account_id", message=f"Duplicate account_id '{aid}'", rejected=True
                ))
                continue

            cid = str(row.get("customer_id", "")).strip()
            if cid.lower() in ("nan", "none", ""):
                cid = None
            elif cid not in existing_cids:
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="customer_id",
                    message=f"Customer '{cid}' not found in database; account registered without customer link.",
                    rejected=False
                ))
                cid = None

            acc_type = str(row.get("account_type", "SAVINGS")).strip().upper()
            if acc_type not in ("SAVINGS", "CURRENT", "BUSINESS"):
                acc_type = "SAVINGS"

            created_raw = row.get("created_at")
            created_at = self._parse_datetime(created_raw)

            new_acc = Account(
                account_id=aid,
                customer_id=cid,
                account_type=acc_type,
                created_at=created_at
            )
            self.db.add(new_acc)
            seen_aids.add(aid)
            summary.records_valid += 1
            summary.accounts_added += 1

        self.db.commit()
        return summary

    def ingest_transactions_csv(self, file_content: bytes, filename: str = "transactions.csv") -> IngestionSummary:
        """Ingests, validates, and normalizes transaction records from CSV."""
        summary = IngestionSummary(
            dataset_name=filename,
            records_received=0,
            records_valid=0,
            records_rejected=0
        )

        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            summary.warnings.append(IngestionWarning(
                row=0, field="file", message=f"Could not parse CSV: {str(e)}", rejected=True
            ))
            return summary

        summary.records_received = len(df)
        missing_cols = self.REQUIRED_TRANSACTION_COLUMNS - set(df.columns)
        if missing_cols:
            summary.records_rejected = len(df)
            summary.warnings.append(IngestionWarning(
                row=0, field="columns", message=f"Missing required columns: {list(missing_cols)}", rejected=True
            ))
            return summary

        existing_aids = {a[0] for a in self.db.query(Account.account_id).all()}
        existing_txs = {t[0] for t in self.db.query(Transaction.transaction_id).all()}
        seen_txs = set()

        for row_idx, (_, row) in enumerate(df.iterrows(), start=2):
            row_num = row_idx
            tx_id = str(row.get("transaction_id", "")).strip()

            if not tx_id or tx_id.lower() in ("nan", "none", ""):
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="transaction_id", message="Empty transaction_id", rejected=True
                ))
                continue

            if tx_id in seen_txs or tx_id in existing_txs:
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="transaction_id", message=f"Duplicate transaction_id '{tx_id}'", rejected=True
                ))
                continue

            sender = str(row.get("sender_account", "")).strip()
            receiver = str(row.get("receiver_account", "")).strip()

            if not sender or not receiver or sender == receiver:
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="accounts",
                    message="Invalid sender/receiver account or self-transaction",
                    rejected=True
                ))
                continue

            # Auto-create phantom account if unreferenced so system doesn't lose graph connectivity
            if sender not in existing_aids:
                phantom_sender = Account(account_id=sender, account_type="SAVINGS", created_at=datetime.utcnow())
                self.db.add(phantom_sender)
                existing_aids.add(sender)
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="sender_account",
                    message=f"Sender account '{sender}' auto-provisioned into system.",
                    rejected=False
                ))

            if receiver not in existing_aids:
                phantom_receiver = Account(account_id=receiver, account_type="SAVINGS", created_at=datetime.utcnow())
                self.db.add(phantom_receiver)
                existing_aids.add(receiver)
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="receiver_account",
                    message=f"Receiver account '{receiver}' auto-provisioned into system.",
                    rejected=False
                ))

            # Amount validation and normalization
            try:
                raw_amt = str(row.get("amount", "")).replace("$", "").replace(",", "").strip()
                amt = float(raw_amt)
                if amt <= 0.0:
                    raise ValueError("Amount must be positive")
            except Exception:
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="amount",
                    message=f"Invalid monetary amount '{row.get('amount')}'",
                    rejected=True
                ))
                continue

            # Timestamp parsing
            timestamp = self._parse_datetime(row.get("timestamp"))
            tx_type = str(row.get("transaction_type", "WIRE_TRANSFER")).strip().upper()
            if not tx_type or tx_type.lower() in ("nan", "none"):
                tx_type = "WIRE_TRANSFER"

            new_tx = Transaction(
                transaction_id=tx_id,
                sender_account=sender,
                receiver_account=receiver,
                amount=round(amt, 2),
                timestamp=timestamp,
                transaction_type=tx_type
            )
            self.db.add(new_tx)
            seen_txs.add(tx_id)
            summary.records_valid += 1
            summary.transactions_added += 1

        self.db.commit()
        return summary

    def _parse_datetime(self, val: Any) -> datetime:
        """Safely parses dates in various common formats."""
        if not val or pd.isna(val):
            return datetime.utcnow()
        if isinstance(val, datetime):
            return val
        s = str(val).strip()
        for fmt in (
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y %H:%M:%S",
            "%d-%m-%Y %H:%M:%S",
            "%m/%d/%Y"
        ):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                pass
        return datetime.utcnow()
