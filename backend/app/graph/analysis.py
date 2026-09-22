"""
Graph Analysis and Topological Feature Extraction for Fintel.
Calculates explainable network indicators for accounts.
"""

from typing import Dict, Any, List, Optional
import networkx as nx


class GraphAnalyzer:
    """Calculates network features and graph metrics for suspicious activity detection."""

    def __init__(self, graph: nx.MultiDiGraph):
        self.graph = graph

    def calculate_graph_features(self, account_id: str) -> Dict[str, Any]:
        """Calculates rich, explainable topological features for a given account."""
        if not self.graph.has_node(account_id):
            return {
                "in_degree": 0,
                "out_degree": 0,
                "total_incoming_amount": 0.0,
                "total_outgoing_amount": 0.0,
                "unique_counterparties": 0,
                "in_counterparties": 0,
                "out_counterparties": 0,
                "fan_in_ratio": 0.0,
                "fan_out_ratio": 0.0,
                "net_flow": 0.0,
                "pass_through_ratio": 0.0,
                "page_rank": 0.0
            }

        in_edges = list(self.graph.in_edges(account_id, data=True))
        out_edges = list(self.graph.out_edges(account_id, data=True))

        total_in = sum(e[2].get("amount", 0.0) for e in in_edges)
        total_out = sum(e[2].get("amount", 0.0) for e in out_edges)

        senders = {e[0] for e in in_edges}
        receivers = {e[1] for e in out_edges}
        unique_counterparties = len(senders.union(receivers))

        in_degree = len(in_edges)
        out_degree = len(out_edges)

        # Pass through ratio: min(in, out) / max(in, out) if both exist
        pass_through = 0.0
        if total_in > 0 and total_out > 0:
            pass_through = min(total_in, total_out) / max(total_in, total_out)

        fan_in_ratio = len(senders) / max(1, len(receivers))
        fan_out_ratio = len(receivers) / max(1, len(senders))

        return {
            "in_degree": in_degree,
            "out_degree": out_degree,
            "total_incoming_amount": round(total_in, 2),
            "total_outgoing_amount": round(total_out, 2),
            "unique_counterparties": unique_counterparties,
            "in_counterparties": len(senders),
            "out_counterparties": len(receivers),
            "fan_in_ratio": round(fan_in_ratio, 2),
            "fan_out_ratio": round(fan_out_ratio, 2),
            "net_flow": round(total_in - total_out, 2),
            "pass_through_ratio": round(pass_through, 3)
        }

    def get_transaction_path(self, source: str, destination: str) -> List[List[str]]:
        """Returns shortest transaction paths between source and destination accounts."""
        if not self.graph.has_node(source) or not self.graph.has_node(destination):
            return []
        try:
            # Convert to simple DiGraph to find paths
            simple_digraph = nx.DiGraph(self.graph)
            paths = list(nx.all_shortest_paths(simple_digraph, source, destination))
            return paths[:5]  # Limit to 5 paths
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def detect_cycles(self, max_length: int = 4) -> List[List[str]]:
        """Identifies circular transaction loops up to max_length."""
        simple_digraph = nx.DiGraph(self.graph)
        cycles = []
        try:
            all_cycles = nx.simple_cycles(simple_digraph)
            for c in all_cycles:
                if 2 <= len(c) <= max_length:
                    cycles.append(c)
                if len(cycles) >= 50:
                    break
        except Exception:
            pass
        return cycles
