"""
Transaction Graph Builder using NetworkX.
Constructs directed multigraphs from database records, preserving transaction attributes.
"""

from typing import List, Optional
import networkx as nx
from sqlalchemy.orm import Session
from app.database.models import Account, Transaction, Customer, Case


class GraphBuilder:
    """Builds and maintains the NetworkX transaction graph."""

    def __init__(self, db: Session):
        self.db = db

    def build_transaction_graph(self) -> nx.MultiDiGraph:
        """Constructs a directed multigraph from accounts and transactions."""
        graph = nx.MultiDiGraph()

        # Load accounts, customers, and active cases
        accounts = self.db.query(Account).all()
        customer_map = {c.customer_id: c for c in self.db.query(Customer).all()}
        cases = self.db.query(Case).all()
        case_map = {c.account_id: c for c in cases}

        for acc in accounts:
            cust = customer_map.get(acc.customer_id)
            case_obj = case_map.get(acc.account_id)

            if case_obj and case_obj.risk_score:
                risk_score = float(case_obj.risk_score)
                risk_lvl = case_obj.risk_level
            elif cust and cust.risk_level:
                risk_lvl = cust.risk_level
                risk_score = 90.0 if risk_lvl == "CRITICAL" else 75.0 if risk_lvl == "HIGH" else 50.0 if risk_lvl == "MEDIUM" else 25.0
            elif "SUSP" in acc.account_id:
                risk_lvl = "HIGH"
                risk_score = 80.0
            else:
                risk_lvl = "LOW"
                risk_score = 20.0

            graph.add_node(
                acc.account_id,
                node_type="account",
                account_type=acc.account_type,
                customer_id=acc.customer_id or "",
                customer_name=cust.name if cust else "Unknown Entity",
                country=cust.country if cust else "IND",
                risk_level=risk_lvl,
                risk_score=risk_score,
                created_at=str(acc.created_at)
            )

        # Load transactions as directed edges
        transactions = self.db.query(Transaction).all()
        for tx in transactions:
            # Ensure endpoints exist
            if not graph.has_node(tx.sender_account):
                case_s = case_map.get(tx.sender_account)
                s_score = float(case_s.risk_score) if (case_s and case_s.risk_score) else (80.0 if "SUSP" in tx.sender_account else 20.0)
                s_lvl = case_s.risk_level if case_s else ("HIGH" if "SUSP" in tx.sender_account else "LOW")
                graph.add_node(tx.sender_account, node_type="account", account_type="SAVINGS", customer_name="External Sender", risk_level=s_lvl, risk_score=s_score)
            if not graph.has_node(tx.receiver_account):
                case_r = case_map.get(tx.receiver_account)
                r_score = float(case_r.risk_score) if (case_r and case_r.risk_score) else (80.0 if "SUSP" in tx.receiver_account else 20.0)
                r_lvl = case_r.risk_level if case_r else ("HIGH" if "SUSP" in tx.receiver_account else "LOW")
                graph.add_node(tx.receiver_account, node_type="account", account_type="SAVINGS", customer_name="External Receiver", risk_level=r_lvl, risk_score=r_score)

            graph.add_edge(
                tx.sender_account,
                tx.receiver_account,
                key=tx.transaction_id,
                transaction_id=tx.transaction_id,
                amount=float(tx.amount),
                timestamp=str(tx.timestamp),
                transaction_type=tx.transaction_type
            )

        return graph
