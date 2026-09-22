"""
Explainable Detection Rules for Fintel AML Engine.
Each rule evaluates transaction and graph evidence, returning score contributions,
plain-text explanations, and cited Evidence/Transaction IDs.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import networkx as nx
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.models import Transaction, Account, Customer
from app.schemas.detection import IndicatorResult, EvidenceItemSchema


class RuleEvaluator:
    """Evaluates rules against an account given transactions and transaction graph."""

    def __init__(self, db: Session, graph: nx.MultiDiGraph):
        self.db = db
        self.graph = graph

    def evaluate_account(self, account_id: str) -> Tuple[List[IndicatorResult], List[EvidenceItemSchema]]:
        """Executes all detection rules for account_id and returns indicators with evidence."""
        indicators: List[IndicatorResult] = []
        evidence_items: List[EvidenceItemSchema] = []

        # Pull transactions for account
        incoming_txs = self.db.query(Transaction).filter(Transaction.receiver_account == account_id).all()
        outgoing_txs = self.db.query(Transaction).filter(Transaction.sender_account == account_id).all()
        all_txs = sorted(incoming_txs + outgoing_txs, key=lambda t: t.timestamp)

        if not all_txs:
            return indicators, evidence_items

        # 1. High-Value Transactions Rule
        ind1, ev1 = self._check_high_value(account_id, all_txs)
        if ind1:
            indicators.append(ind1)
            evidence_items.extend(ev1)

        # 2. Rapid Movement of Funds (Pass-Through)
        ind2, ev2 = self._check_rapid_movement(account_id, incoming_txs, outgoing_txs)
        if ind2:
            indicators.append(ind2)
            evidence_items.extend(ev2)

        # 3. Structuring / Smurfing Rule
        ind3, ev3 = self._check_structuring(account_id, all_txs)
        if ind3:
            indicators.append(ind3)
            evidence_items.extend(ev3)

        # 4. Many-to-One Mule Aggregation (Fan-In)
        ind4, ev4 = self._check_many_to_one(account_id, incoming_txs)
        if ind4:
            indicators.append(ind4)
            evidence_items.extend(ev4)

        # 5. One-to-Many Dispersion (Fan-Out)
        ind5, ev5 = self._check_one_to_many(account_id, outgoing_txs, incoming_txs)
        if ind5:
            indicators.append(ind5)
            evidence_items.extend(ev5)

        # 6. High Velocity Burst
        ind6, ev6 = self._check_velocity_burst(account_id, all_txs)
        if ind6:
            indicators.append(ind6)
            evidence_items.extend(ev6)

        # 7. Circular Chain Movement
        ind7, ev7 = self._check_circular_chain(account_id)
        if ind7:
            indicators.append(ind7)
            evidence_items.extend(ev7)

        return indicators, evidence_items

    def _check_high_value(self, account_id: str, txs: List[Transaction]):
        hv_txs = [t for t in txs if t.amount >= settings.HIGH_VALUE_THRESHOLD]
        if not hv_txs:
            return None, []

        ev_list = []
        ev_ids = []
        total_vol = sum(t.amount for t in hv_txs)

        for t in hv_txs:
            ev_id = f"EVD-HV-{t.transaction_id}"
            ev_ids.append(ev_id)
            ev_list.append(EvidenceItemSchema(
                evidence_id=ev_id,
                evidence_type="TRANSACTION",
                source_id=t.transaction_id,
                description=f"Transaction {t.transaction_id} of ${t.amount:,.2f} exceeds high-value threshold of ${settings.HIGH_VALUE_THRESHOLD:,.2f} on {t.timestamp.strftime('%Y-%m-%d %H:%M')}."
            ))

        score = min(35.0, 15.0 + (len(hv_txs) * 8.0))
        indicator = IndicatorResult(
            name="high_value_transfers",
            score=score,
            explanation=f"Identified {len(hv_txs)} transactions exceeding high-value threshold (${settings.HIGH_VALUE_THRESHOLD:,.2f}) with cumulative volume of ${total_vol:,.2f}.",
            evidence_ids=ev_ids,
            relevant_transactions=[t.transaction_id for t in hv_txs],
            graph_features={"high_value_tx_count": len(hv_txs), "total_high_value_volume": total_vol}
        )
        return indicator, ev_list

    def _check_rapid_movement(self, account_id: str, in_txs: List[Transaction], out_txs: List[Transaction]):
        if not in_txs or not out_txs:
            return None, []

        rapid_pairs = []
        for in_t in in_txs:
            for out_t in out_txs:
                if out_t.timestamp > in_t.timestamp:
                    diff_hours = (out_t.timestamp - in_t.timestamp).total_seconds() / 3600.0
                    if 0 < diff_hours <= settings.RAPID_MOVEMENT_WINDOW_HOURS:
                        ratio = min(in_t.amount, out_t.amount) / max(in_t.amount, out_t.amount)
                        if ratio >= 0.70 and in_t.amount >= 10000:
                            rapid_pairs.append((in_t, out_t, diff_hours, ratio))

        if not rapid_pairs:
            return None, []

        ev_list = []
        ev_ids = []
        rel_txs = set()

        for in_t, out_t, diff_h, ratio in rapid_pairs[:3]:
            rel_txs.add(in_t.transaction_id)
            rel_txs.add(out_t.transaction_id)
            e_id = f"EVD-RAPID-{in_t.transaction_id}-{out_t.transaction_id}"
            ev_ids.append(e_id)
            ev_list.append(EvidenceItemSchema(
                evidence_id=e_id,
                evidence_type="TRANSACTION",
                source_id=f"{in_t.transaction_id},{out_t.transaction_id}",
                description=f"Inflow ${in_t.amount:,.2f} ({in_t.transaction_id}) swiftly transferred out ${out_t.amount:,.2f} ({out_t.transaction_id}) within {diff_h:.1f} hours ({ratio*100:.1f}% volume retained)."
            ))

        score = min(30.0, 20.0 + len(rapid_pairs) * 5.0)
        indicator = IndicatorResult(
            name="rapid_fund_movement",
            score=score,
            explanation=f"Detected rapid fund pass-through pattern: incoming capital routed out within {settings.RAPID_MOVEMENT_WINDOW_HOURS} hours with over 70% capital matching.",
            evidence_ids=ev_ids,
            relevant_transactions=list(rel_txs),
            graph_features={"rapid_pair_count": len(rapid_pairs)}
        )
        return indicator, ev_list

    def _check_structuring(self, account_id: str, txs: List[Transaction]):
        structuring_txs = [
            t for t in txs
            if settings.STRUCTURING_LOWER_BOUND <= t.amount <= settings.STRUCTURING_THRESHOLD
        ]
        if len(structuring_txs) < 3:
            return None, []

        ev_list = []
        ev_ids = []
        for t in structuring_txs:
            e_id = f"EVD-STRUCT-{t.transaction_id}"
            ev_ids.append(e_id)
            ev_list.append(EvidenceItemSchema(
                evidence_id=e_id,
                evidence_type="TRANSACTION",
                source_id=t.transaction_id,
                description=f"Transaction {t.transaction_id} of ${t.amount:,.2f} is positioned right below the $10,000 regulatory filing threshold."
            ))

        score = min(30.0, 15.0 + len(structuring_txs) * 4.0)
        indicator = IndicatorResult(
            name="structuring_smurfing",
            score=score,
            explanation=f"Detected {len(structuring_txs)} transactions intentionally structured between ${settings.STRUCTURING_LOWER_BOUND:,.0f} and ${settings.STRUCTURING_THRESHOLD:,.0f} to avoid mandatory filing triggers.",
            evidence_ids=ev_ids,
            relevant_transactions=[t.transaction_id for t in structuring_txs],
            graph_features={"structuring_tx_count": len(structuring_txs)}
        )
        return indicator, ev_list

    def _check_many_to_one(self, account_id: str, in_txs: List[Transaction]):
        unique_senders = {t.sender_account for t in in_txs}
        if len(unique_senders) < settings.FAN_OUT_IN_DEGREE_THRESHOLD:
            return None, []

        ev_id = f"EVD-FANIN-{account_id}"
        total_inflow = sum(t.amount for t in in_txs)
        ev_item = EvidenceItemSchema(
            evidence_id=ev_id,
            evidence_type="GRAPH_METRIC",
            source_id=account_id,
            description=f"Account received funds from {len(unique_senders)} distinct counterparty sources accumulating ${total_inflow:,.2f} in total deposits."
        )

        score = min(25.0, 12.0 + len(unique_senders) * 2.5)
        indicator = IndicatorResult(
            name="many_to_one_aggregation",
            score=score,
            explanation=f"Fan-in mule aggregation topology observed: incoming payments from {len(unique_senders)} distinct entities converging into this account.",
            evidence_ids=[ev_id],
            relevant_transactions=[t.transaction_id for t in in_txs[:10]],
            graph_features={"in_degree_counterparties": len(unique_senders), "total_inflow": total_inflow}
        )
        return indicator, [ev_item]

    def _check_one_to_many(self, account_id: str, out_txs: List[Transaction], in_txs: List[Transaction]):
        unique_receivers = {t.receiver_account for t in out_txs}
        if len(unique_receivers) < settings.FAN_OUT_IN_DEGREE_THRESHOLD:
            return None, []

        ev_id = f"EVD-FANOUT-{account_id}"
        total_outflow = sum(t.amount for t in out_txs)
        ev_item = EvidenceItemSchema(
            evidence_id=ev_id,
            evidence_type="GRAPH_METRIC",
            source_id=account_id,
            description=f"Account dispersed funds outward to {len(unique_receivers)} unique beneficiary accounts totaling ${total_outflow:,.2f}."
        )

        score = min(25.0, 12.0 + len(unique_receivers) * 2.5)
        indicator = IndicatorResult(
            name="one_to_many_dispersion",
            score=score,
            explanation=f"Fan-out dispersion topology observed: outward payments rapidly divided and routed to {len(unique_receivers)} target entities.",
            evidence_ids=[ev_id],
            relevant_transactions=[t.transaction_id for t in out_txs[:10]],
            graph_features={"out_degree_counterparties": len(unique_receivers), "total_outflow": total_outflow}
        )
        return indicator, [ev_item]

    def _check_velocity_burst(self, account_id: str, txs: List[Transaction]):
        if len(txs) < settings.HIGH_VELOCITY_TX_COUNT:
            return None, []

        burst_found = False
        burst_txs = []
        window = timedelta(hours=settings.HIGH_VELOCITY_WINDOW_HOURS)

        for i in range(len(txs) - settings.HIGH_VELOCITY_TX_COUNT + 1):
            sub_txs = txs[i : i + settings.HIGH_VELOCITY_TX_COUNT]
            time_span = sub_txs[-1].timestamp - sub_txs[0].timestamp
            if time_span <= window:
                burst_found = True
                burst_txs = sub_txs
                break

        if not burst_found:
            return None, []

        ev_id = f"EVD-BURST-{account_id}"
        ev_item = EvidenceItemSchema(
            evidence_id=ev_id,
            evidence_type="ANOMALY",
            source_id=account_id,
            description=f"Velocity anomaly: Account executed {len(burst_txs)} transactions within a {(burst_txs[-1].timestamp - burst_txs[0].timestamp).total_seconds()/3600:.1f} hour interval."
        )

        indicator = IndicatorResult(
            name="high_velocity_burst",
            score=20.0,
            explanation=f"High transaction frequency burst: {len(burst_txs)} transactions clustered within {settings.HIGH_VELOCITY_WINDOW_HOURS} hours.",
            evidence_ids=[ev_id],
            relevant_transactions=[t.transaction_id for t in burst_txs],
            graph_features={"burst_count": len(burst_txs)}
        )
        return indicator, [ev_item]

    def _check_circular_chain(self, account_id: str):
        if not self.graph.has_node(account_id):
            return None, []

        # Localized bounded search for cycles containing account_id (length 2 to 5)
        # Look for paths from account_id's successors back to account_id with cutoff <= 4
        successors = list(self.graph.successors(account_id))
        if not successors:
            return None, []

        found_cycle = None
        for succ in successors:
            if succ == account_id:
                continue
            # Look for a path from succ back to account_id in <= 4 hops
            try:
                # Use simple DiGraph restricted to 4-hop ego network
                ego_nodes = set(nx.single_source_shortest_path_length(self.graph, account_id, cutoff=4).keys())
                ego_nodes.update(nx.single_source_shortest_path_length(self.graph.reverse(), account_id, cutoff=4).keys())
                sub_dg = nx.DiGraph(self.graph.subgraph(ego_nodes))
                if sub_dg.has_node(succ) and sub_dg.has_node(account_id):
                    for path in nx.all_simple_paths(sub_dg, source=succ, target=account_id, cutoff=4):
                        found_cycle = [account_id] + path[:-1]
                        break
                if found_cycle:
                    break
            except Exception:
                continue

        if not found_cycle:
            return None, []

        cycle = found_cycle
        ev_id = f"EVD-CYCLE-{account_id}"
        cycle_str = " -> ".join(cycle) + f" -> {cycle[0]}"
        ev_item = EvidenceItemSchema(
            evidence_id=ev_id,
            evidence_type="GRAPH_METRIC",
            source_id=account_id,
            description=f"Circular layering loop identified in transaction graph: {cycle_str}."
        )

        indicator = IndicatorResult(
            name="circular_chain_movement",
            score=35.0,
            explanation=f"Identified closed circular fund loop: {cycle_str}. Circular topology strongly correlates with layering to obscure origins of illicit capital.",
            evidence_ids=[ev_id],
            relevant_transactions=[],
            graph_features={"cycle_nodes": cycle, "cycle_length": len(cycle)}
        )
        return indicator, [ev_item]
