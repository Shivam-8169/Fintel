import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { GraphView } from '../../GraphView';
import { GraphData, NormalizedTransaction } from '../../../types';
import LABELS from '../../../constants/labels';
import { ComplianceTerm } from '../../ComplianceTerm';

interface Stage6GraphProps {
  flaggedTransactions: NormalizedTransaction[];
  entityId: string;
  existingGraphData: GraphData | null;
  onGraphReady: (graphData: GraphData) => void;
  onProceed: () => void;
  onBack: () => void;
}

export const Stage6Graph: React.FC<Stage6GraphProps> = ({
  flaggedTransactions,
  entityId,
  existingGraphData,
  onGraphReady,
  onProceed,
  onBack
}) => {
  const [graphData, setGraphData] = useState<GraphData | null>(existingGraphData);

  useEffect(() => {
    if (!graphData) {
      buildLocalGraph();
    }
  }, []);

  const buildLocalGraph = () => {
    const nodesMap: Record<string, any> = {};

    // Focal Subject node
    nodesMap[entityId] = {
      id: entityId,
      label: entityId,
      customer_name: 'Global Trade & Logistics Ltd.',
      risk_level: 'CRITICAL',
      is_focal: true,
      is_suspicious: true,
      in_degree: 1,
      out_degree: 3,
      total_in: 85000,
      total_out: 84000
    };

    // Edge list
    const edges = flaggedTransactions.slice(0, 6).map((tx, idx) => {
      const party = tx.counterparty;
      if (!nodesMap[party]) {
        nodesMap[party] = {
          id: party,
          label: party,
          customer_name: party.includes('OFFSHORE') ? 'Offshore Capital Entity' : `Mule Beneficiary ${idx + 1}`,
          risk_level: tx.amount >= 50000 ? 'HIGH' : 'MEDIUM',
          is_focal: false,
          is_suspicious: true,
          in_degree: 1,
          out_degree: 0,
          total_in: tx.amount,
          total_out: 0
        };
      }

      return {
        id: `EDGE-${tx.transaction_id}`,
        source: tx.direction === 'DEBIT' ? entityId : party,
        target: tx.direction === 'DEBIT' ? party : entityId,
        amount: tx.amount,
        timestamp: tx.timestamp,
        transaction_type: 'WIRE_TRANSFER',
        is_suspicious: true
      };
    });

    const nodeList = Object.values(nodesMap);
    const constructed: GraphData = {
      account_id: entityId,
      k_hops: 2,
      nodes: nodeList,
      edges: edges,
      total_nodes: nodeList.length,
      total_edges: edges.length,
      metrics: {
        page_rank: 0.184,
        hub_score: 0.762,
        density: 0.28
      }
    };

    setGraphData(constructed);
    onGraphReady(constructed);
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="section-tag block mb-1">
          Stage 6 of 10 • {LABELS.pipeline.stage6.name}
        </span>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
          {LABELS.pipeline.stage6.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {LABELS.pipeline.stage6.subtitle}{' '}
          <span className="text-xs text-[var(--text-muted)]">
            (Includes immediate accounts and 2-step connected counterparties)
          </span>
        </p>
      </div>

      {/* React Flow Graph Surface */}
      <div>
        {graphData ? (
          <GraphView graphData={graphData} />
        ) : (
          <div className="h-96 flex items-center justify-center text-xs text-[var(--text-muted)]">
            {LABELS.pipeline.stage6.loadingText}
          </div>
        )}
      </div>

      {/* Action Footer with Standard Primary and Secondary Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{LABELS.pipeline.stage6.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="btn-primary"
        >
          <span>{LABELS.pipeline.stage6.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
