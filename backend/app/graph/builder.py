"""
Transaction Graph Builder using NetworkX.
Constructs directed multigraphs from database records, preserving transaction attributes.
"""

from typing import List, Optional
import networkx as nx
from sqlalchemy.orm import Session
from app.database.models import Account, Transaction, Customer


class GraphBuilder:
    """Builds and maintains the NetworkX transaction graph."""

    def __init__(self, db: Session):
        self.db = db

    def build_transaction_graph(self) -> nx.MultiDiGraph:
        """Constructs a directed multigraph from accounts and transactions."""
        graph = nx.MultiDiGraph()

        # Load accounts with customer details
        accounts = self.db.query(Account).all()
        customer_map = {c.customer_id: c for c in self.db.query(Customer).all()}

        for acc in accounts:
            cust = customer_map.get(acc.customer_id)
            graph.add_node(
                acc.account_id,
                node_type="account",
                account_type=acc.account_type,
                customer_id=acc.customer_id or "",
                customer_name=cust.name if cust else "Unknown Entity",
                country=cust.country if cust else "IND",
                risk_level=cust.risk_level if cust else "LOW",
                created_at=str(acc.created_at)
            )

        # Load transactions as directed edges
        transactions = self.db.query(Transaction).all()
        for tx in transactions:
            # Ensure endpoints exist
            if not graph.has_node(tx.sender_account):
                graph.add_node(tx.sender_account, node_type="account", account_type="SAVINGS", customer_name="External Sender")
            if not graph.has_node(tx.receiver_account):
                graph.add_node(tx.receiver_account, node_type="account", account_type="SAVINGS", customer_name="External Receiver")

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
