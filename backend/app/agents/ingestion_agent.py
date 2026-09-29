"""
Data Ingestion Agent for Fintel.
Handles parsing, schema validation, data type normalization, referential integrity,
duplicate detection, error isolation, and database insertion.
"""

import io
import re
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.database.models import Customer, Account, Transaction, InvestigatorNote
from app.schemas.data import IngestionSummary, IngestionWarning
from app.utils.datetime_utils import utcnow


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
                phantom_sender = Account(account_id=sender, account_type="SAVINGS", created_at=utcnow())
                self.db.add(phantom_sender)
                existing_aids.add(sender)
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="sender_account",
                    message=f"Sender account '{sender}' auto-provisioned into system.",
                    rejected=False
                ))

            if receiver not in existing_aids:
                phantom_receiver = Account(account_id=receiver, account_type="SAVINGS", created_at=utcnow())
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

    def parse_statement_preview(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Parses CSV or Excel statement file and suggests column mappings."""
        is_excel = filename.lower().endswith((".xlsx", ".xls"))
        try:
            if is_excel:
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            raise ValueError(f"Could not parse file '{filename}': {str(e)}")

        columns = [str(col).strip() for col in df.columns]
        total_rows = len(df)

        # Build column suggestions based on naming patterns
        suggested: Dict[str, Optional[str]] = {
            "date": None,
            "description": None,
            "amount": None,
            "debit": None,
            "credit": None,
            "account_id": None,
            "counterparty": None,
            "balance": None
        }

        for col in columns:
            clow = col.lower().replace("_", " ").replace("-", " ")
            if not suggested["date"] and any(k in clow for k in ["date", "time", "timestamp", "value date", "txn date"]):
                suggested["date"] = col
            elif not suggested["description"] and any(k in clow for k in ["desc", "narrat", "detail", "particul", "remark", "memo"]):
                suggested["description"] = col
            elif not suggested["debit"] and any(k in clow for k in ["debit", "withdrawal", "dr", "paid out", "outflow"]):
                suggested["debit"] = col
            elif not suggested["credit"] and any(k in clow for k in ["credit", "deposit", "cr", "paid in", "inflow"]):
                suggested["credit"] = col
            elif not suggested["amount"] and any(k in clow for k in ["amount", "txn amt", "value", "net"]):
                suggested["amount"] = col
            elif not suggested["account_id"] and any(k in clow for k in ["account", "acc id", "acc no", "acc num", "from account"]):
                suggested["account_id"] = col
            elif not suggested["counterparty"] and any(k in clow for k in ["beneficiar", "counterparty", "receiver", "to account", "party", "payee"]):
                suggested["counterparty"] = col
            elif not suggested["balance"] and any(k in clow for k in ["balance", "closing bal", "run bal"]):
                suggested["balance"] = col

        # First 5 sample rows as clean serializable dicts
        sample_rows = []
        for _, row in df.head(5).iterrows():
            clean_row = {}
            for col in columns:
                val = row.get(col)
                if pd.isna(val):
                    clean_row[col] = ""
                elif isinstance(val, (datetime, pd.Timestamp)):
                    clean_row[col] = val.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    clean_row[col] = str(val)
            sample_rows.append(clean_row)

        return {
            "filename": filename,
            "file_size_bytes": len(file_content),
            "total_rows": total_rows,
            "columns": columns,
            "sample_rows": sample_rows,
            "suggested_mapping": suggested
        }

    def ingest_bank_statement(
        self,
        file_content: bytes,
        filename: str,
        mapping: Dict[str, Optional[str]],
        default_account_id: str = "ACC-STMT-PRIMARY"
    ) -> IngestionSummary:
        """
        Normalizes and ingests a bank statement using user-confirmed column mapping.
        Handles debit/credit columns, unified amounts, auto-provisioning counterparty accounts,
        and transaction direction.
        """
        summary = IngestionSummary(
            dataset_name=filename,
            records_received=0,
            records_valid=0,
            records_rejected=0
        )

        is_excel = filename.lower().endswith((".xlsx", ".xls"))
        try:
            if is_excel:
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            summary.warnings.append(IngestionWarning(
                row=0, field="file", message=f"Could not parse file: {str(e)}", rejected=True
            ))
            return summary

        summary.records_received = len(df)
        existing_aids = {a[0] for a in self.db.query(Account.account_id).all()}
        existing_txs = {t[0] for t in self.db.query(Transaction.transaction_id).all()}

        # Ensure default statement primary account exists
        if default_account_id not in existing_aids:
            primary_acc = Account(
                account_id=default_account_id,
                account_type="CHECKING",
                created_at=utcnow()
            )
            self.db.add(primary_acc)
            existing_aids.add(default_account_id)
            summary.accounts_added += 1

        date_col = mapping.get("date")
        desc_col = mapping.get("description")
        amt_col = mapping.get("amount")
        debit_col = mapping.get("debit")
        credit_col = mapping.get("credit")
        acc_col = mapping.get("account_id")
        party_col = mapping.get("counterparty")

        for row_idx, (_, row) in enumerate(df.iterrows(), start=1):
            row_num = row_idx

            # Determine primary account
            primary_acc_val = default_account_id
            if acc_col and acc_col in row and pd.notna(row[acc_col]):
                cand_acc = str(row[acc_col]).strip()
                if cand_acc and cand_acc.lower() not in ("nan", "none", ""):
                    primary_acc_val = cand_acc

            if primary_acc_val not in existing_aids:
                new_acc = Account(account_id=primary_acc_val, account_type="SAVINGS", created_at=utcnow())
                self.db.add(new_acc)
                existing_aids.add(primary_acc_val)
                summary.accounts_added += 1

            # Determine counterparty
            party_val = f"ACC-PARTY-{row_num:03d}"
            if party_col and party_col in row and pd.notna(row[party_col]):
                cand_party = str(row[party_col]).strip()
                if cand_party and cand_party.lower() not in ("nan", "none", ""):
                    party_val = cand_party
            elif desc_col and desc_col in row and pd.notna(row[desc_col]):
                # Extract plausible counterparty from description if available
                raw_desc = str(row[desc_col]).strip()
                words = re.findall(r'[A-Za-z0-9\-]+', raw_desc)
                if words:
                    party_val = f"ACC-{words[0].upper()[:12]}"

            if party_val not in existing_aids:
                new_party = Account(account_id=party_val, account_type="SAVINGS", created_at=utcnow())
                self.db.add(new_party)
                existing_aids.add(party_val)
                summary.accounts_added += 1

            # Determine amount and direction
            amt = 0.0
            sender = primary_acc_val
            receiver = party_val
            is_valid_amount = False

            # Case A: Separate Debit and Credit columns
            if debit_col and debit_col in row and pd.notna(row[debit_col]):
                d_str = str(row[debit_col]).replace("$", "").replace("₹", "").replace(",", "").strip()
                try:
                    d_val = float(d_str)
                    if d_val > 0:
                        amt = d_val
                        sender = primary_acc_val
                        receiver = party_val
                        is_valid_amount = True
                except ValueError:
                    pass

            if not is_valid_amount and credit_col and credit_col in row and pd.notna(row[credit_col]):
                c_str = str(row[credit_col]).replace("$", "").replace("₹", "").replace(",", "").strip()
                try:
                    c_val = float(c_str)
                    if c_val > 0:
                        amt = c_val
                        sender = party_val
                        receiver = primary_acc_val
                        is_valid_amount = True
                except ValueError:
                    pass

            # Case B: Single Amount column with possible +/- or description indicators
            if not is_valid_amount and amt_col and amt_col in row and pd.notna(row[amt_col]):
                a_str = str(row[amt_col]).replace("$", "").replace("₹", "").replace(",", "").strip()
                try:
                    a_val = float(a_str)
                    if a_val < 0:
                        amt = abs(a_val)
                        sender = primary_acc_val
                        receiver = party_val
                    else:
                        amt = a_val
                        # If description indicates outflow/payment/transfer out
                        desc_str = str(row.get(desc_col, "")).lower() if desc_col else ""
                        if any(w in desc_str for w in ["dr", "debit", "withdrawal", "payment", "wire out", "transfer to"]):
                            sender = primary_acc_val
                            receiver = party_val
                        else:
                            sender = party_val
                            receiver = primary_acc_val
                    is_valid_amount = True
                except ValueError:
                    pass

            if not is_valid_amount or amt <= 0.0:
                summary.records_rejected += 1
                summary.warnings.append(IngestionWarning(
                    row=row_num, field="amount", message="Unable to determine valid transaction amount", rejected=True
                ))
                continue

            # Ensure sender != receiver
            if sender == receiver:
                receiver = f"{party_val}-EXT"
                if receiver not in existing_aids:
                    self.db.add(Account(account_id=receiver, account_type="SAVINGS", created_at=utcnow()))
                    existing_aids.add(receiver)
                    summary.accounts_added += 1

            # Parse date
            tx_time = utcnow()
            if date_col and date_col in row and pd.notna(row[date_col]):
                tx_time = self._parse_datetime(row[date_col])

            # Transaction ID
            tx_id = f"TXN-STMT-{row_num:05d}"
            # Check if there is an existing explicit txn_id column
            for id_cand in ["transaction_id", "txn_id", "reference_no", "ref_no"]:
                if id_cand in row and pd.notna(row[id_cand]):
                    custom_id = str(row[id_cand]).strip()
                    if custom_id and custom_id.lower() not in ("nan", "none", ""):
                        tx_id = custom_id
                        break

            # Deduplicate
            base_tx_id = tx_id
            counter = 1
            while tx_id in existing_txs:
                tx_id = f"{base_tx_id}-{counter}"
                counter += 1

            # Determine transaction type from description or amount
            tx_type = "WIRE_TRANSFER"
            if desc_col and desc_col in row and pd.notna(row[desc_col]):
                d_str = str(row[desc_col]).upper()
                if "UPI" in d_str or "IMPS" in d_str:
                    tx_type = "INSTANT_PAYMENT"
                elif "ATM" in d_str or "CASH" in d_str:
                    tx_type = "CASH_TRANSACTION"
                elif "CARD" in d_str or "POS" in d_str:
                    tx_type = "CARD_PURCHASE"

            new_tx = Transaction(
                transaction_id=tx_id,
                sender_account=sender,
                receiver_account=receiver,
                amount=round(amt, 2),
                timestamp=tx_time,
                transaction_type=tx_type
            )
            self.db.add(new_tx)
            existing_txs.add(tx_id)
            summary.records_valid += 1
            summary.transactions_added += 1

        self.db.commit()
        return summary

    def _parse_datetime(self, val: Any) -> datetime:
        """Safely parses dates in various common formats."""
        if not val or pd.isna(val):
            return utcnow()
        if isinstance(val, datetime):
            return val
        s = str(val).strip()
        for fmt in (
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y %H:%M:%S",
            "%d-%m-%Y %H:%M:%S",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%m/%d/%Y",
            "%Y/%m/%d"
        ):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                pass
        return utcnow()

