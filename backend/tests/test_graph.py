"""
Unit tests for Transaction Graph and Subgraph Extraction.
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.database.models import Account, Transaction, Customer
from app.graph.builder import GraphBuilder
from app.graph.analysis import GraphAnalyzer
from app.graph.subgraph import SubgraphExtractor


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    # Seed 4 accounts in a chain
    accs = [
        Account(account_id=f"ACC-{i}", account_type="SAVINGS", created_at=datetime.utcnow())
        for i in range(1, 5)
    ]
    session.add_all(accs)

    txs = [
        Transaction(transaction_id="T1", sender_account="ACC-1", receiver_account="ACC-2", amount=10000.0, timestamp=datetime.utcnow()),
        Transaction(transaction_id="T2", sender_account="ACC-2", receiver_account="ACC-3", amount=9500.0, timestamp=datetime.utcnow()),
        Transaction(transaction_id="T3", sender_account="ACC-3", receiver_account="ACC-4", amount=9000.0, timestamp=datetime.utcnow()),
        Transaction(transaction_id="T4", sender_account="ACC-4", receiver_account="ACC-1", amount=8500.0, timestamp=datetime.utcnow())
    ]
    session.add_all(txs)
    session.commit()

    yield session
    session.close()


def test_graph_builder_and_metrics(db_session):
    builder = GraphBuilder(db_session)
    graph = builder.build_transaction_graph()

    assert graph.number_of_nodes() == 4
    assert graph.number_of_edges() == 4

    analyzer = GraphAnalyzer(graph)
    features = analyzer.calculate_graph_features("ACC-2")

    assert features["in_degree"] == 1
    assert features["out_degree"] == 1
    assert features["total_incoming_amount"] == 10000.0
    assert features["total_outgoing_amount"] == 9500.0
    assert features["unique_counterparties"] == 2


def test_k_hop_subgraph_extraction(db_session):
    builder = GraphBuilder(db_session)
    graph = builder.build_transaction_graph()
    extractor = SubgraphExtractor(graph)

    subgraph_data = extractor.get_k_hop_subgraph("ACC-1", k=1)
    # ACC-1 connects directly to ACC-2 and ACC-4 in 1 hop
    node_ids = {n.id for n in subgraph_data.nodes}
    assert "ACC-1" in node_ids
    assert "ACC-2" in node_ids
    assert "ACC-4" in node_ids
