"""
Graph Analytics and Network Visualization Router.
Returns React Flow compatible subgraphs and topological metrics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Case, Account
from app.graph.builder import GraphBuilder
from app.graph.subgraph import SubgraphExtractor
from app.graph.analysis import GraphAnalyzer
from app.schemas.graph import GraphDataResponse

router = APIRouter(prefix="/graph", tags=["Transaction Graph"])


@router.get("/case/{case_id}", response_model=GraphDataResponse)
def get_case_graph(
    case_id: str,
    k_hops: int = Query(2, ge=1, le=4),
    max_nodes: int = Query(50, ge=10, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns the k-hop transaction subgraph around the subject account of a case,
    formatted specifically for interactive React Flow graph visualization.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    builder = GraphBuilder(db)
    graph = builder.build_transaction_graph()

    extractor = SubgraphExtractor(graph)
    subgraph_data = extractor.get_k_hop_subgraph(case.account_id, k=k_hops, max_nodes=max_nodes)
    return subgraph_data


@router.get("/account/{account_id}", response_model=GraphDataResponse)
def get_account_graph(
    account_id: str,
    k_hops: int = Query(2, ge=1, le=4),
    max_nodes: int = Query(50, ge=10, le=100),
    db: Session = Depends(get_db)
):
    """Returns the k-hop transaction subgraph for any arbitrary account ID."""
    builder = GraphBuilder(db)
    graph = builder.build_transaction_graph()

    extractor = SubgraphExtractor(graph)
    return extractor.get_k_hop_subgraph(account_id, k=k_hops, max_nodes=max_nodes)


@router.get("/account/{account_id}/features")
def get_account_features(account_id: str, db: Session = Depends(get_db)):
    """Returns raw explainable network topological features for an account."""
    builder = GraphBuilder(db)
    graph = builder.build_transaction_graph()

    analyzer = GraphAnalyzer(graph)
    return analyzer.calculate_graph_features(account_id)
