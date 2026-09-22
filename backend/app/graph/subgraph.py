"""
Subgraph Extraction for Fintel Investigations.
Extracts ego-networks and k-hop transaction graphs formatted for React Flow.
"""

from typing import Dict, Any, List, Set, Tuple
import networkx as nx
from app.schemas.graph import GraphNode, GraphEdge, GraphDataResponse


class SubgraphExtractor:
    """Extracts localized subgraphs for investigator inspection and AI context."""

    def __init__(self, graph: nx.MultiDiGraph):
        self.graph = graph

    def get_k_hop_subgraph(self, account_id: str, k: int = 2, max_nodes: int = 60) -> GraphDataResponse:
        """
        Extracts k-hop neighborhood around focal account_id.
        Limits total nodes to max_nodes to ensure frontend React Flow responsiveness.
        """
        if not self.graph.has_node(account_id):
            return GraphDataResponse(
                account_id=account_id,
                k_hops=k,
                nodes=[],
                edges=[],
                total_nodes=0,
                total_edges=0,
                metrics={}
            )

        # BFS / k-hop neighborhood search undirected to capture incoming and outgoing hops
        undirected = self.graph.to_undirected()
        subgraph_nodes: Set[str] = {account_id}
        current_layer: Set[str] = {account_id}

        for _ in range(k):
            next_layer: Set[str] = set()
            for node in current_layer:
                neighbors = set(undirected.neighbors(node))
                next_layer.update(neighbors - subgraph_nodes)
            subgraph_nodes.update(next_layer)
            current_layer = next_layer
            if len(subgraph_nodes) >= max_nodes:
                break

        # Subgraph view
        sub_g = self.graph.subgraph(list(subgraph_nodes)[:max_nodes])

        formatted_nodes: List[GraphNode] = []
        for n, attrs in sub_g.nodes(data=True):
            in_deg = self.graph.in_degree(n)
            out_deg = self.graph.out_degree(n)
            in_amt = sum(e[2].get("amount", 0.0) for e in self.graph.in_edges(n, data=True))
            out_amt = sum(e[2].get("amount", 0.0) for e in self.graph.out_edges(n, data=True))

            is_focal = (n == account_id)
            is_suspicious = (attrs.get("risk_level") == "HIGH" or "SUSP" in n)

            formatted_nodes.append(GraphNode(
                id=n,
                label=n,
                is_focal=is_focal,
                is_suspicious=is_suspicious,
                account_type=attrs.get("account_type", "SAVINGS"),
                customer_id=attrs.get("customer_id"),
                customer_name=attrs.get("customer_name", "Unknown Entity"),
                risk_level=attrs.get("risk_level", "LOW"),
                in_degree=in_deg,
                out_degree=out_deg,
                total_in=round(in_amt, 2),
                total_out=round(out_amt, 2)
            ))

        formatted_edges: List[GraphEdge] = []
        for u, v, k_id, edge_data in sub_g.edges(data=True, keys=True):
            formatted_edges.append(GraphEdge(
                id=f"{u}-{v}-{k_id}",
                source=u,
                target=v,
                amount=float(edge_data.get("amount", 0.0)),
                timestamp=str(edge_data.get("timestamp", "")),
                transaction_type=edge_data.get("transaction_type", "WIRE_TRANSFER"),
                is_suspicious=(edge_data.get("amount", 0.0) >= 50000.0)
            ))

        return GraphDataResponse(
            account_id=account_id,
            k_hops=k,
            nodes=formatted_nodes,
            edges=formatted_edges,
            total_nodes=len(formatted_nodes),
            total_edges=len(formatted_edges),
            metrics={
                "density": round(nx.density(sub_g), 4) if len(sub_g) > 1 else 0.0,
                "node_count": len(formatted_nodes),
                "edge_count": len(formatted_edges)
            }
        )
