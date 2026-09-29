import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Layers,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { GraphData, GraphNode, GraphEdge } from '../types';
import { formatINR } from '../utils/currency';
import {
  getNeutralAccountId,
  getAccountRoleBadge,
  cleanCustomerName
} from '../utils/complianceNaming';

interface GraphViewProps {
  graphData: GraphData;
  onSelectNode?: (nodeId: string) => void;
}

interface AccountNodeData extends GraphNode {
  isSelected?: boolean;
}

// Custom Node Component for Accounts styled by Semantic Risk Tokens
const AccountNode: React.FC<{ data: AccountNodeData; selected?: boolean }> = ({ data, selected }) => {
  const isFocal = data.is_focal;
  const isSelected = selected || data.isSelected;
  const neutralId = getNeutralAccountId(data.id);
  const roleBadge = getAccountRoleBadge(data.id);
  const customerName = cleanCustomerName(data.customer_name);

  const rawScore = data.risk_score;
  const score = (rawScore !== undefined && rawScore !== null && rawScore > 0)
    ? Math.round(rawScore)
    : (data.risk_level === 'CRITICAL' ? 90 : data.risk_level === 'HIGH' ? 75 : data.risk_level === 'MEDIUM' ? 50 : (data.is_suspicious ? 80 : 25));

  const tier = score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Moderate' : 'Low';
  const isHighRisk = score >= 60 || data.risk_level === 'HIGH' || data.risk_level === 'CRITICAL' || data.is_suspicious;
  const isMedRisk = score >= 40 && score < 60;

  // Semantic 3-tier colors for risk score badge (red reserved exclusively for risk-score)
  const badgeClass = isHighRisk
    ? 'badge-risk-high'
    : isMedRisk
    ? 'badge-risk-medium'
    : 'badge-risk-low';

  // Border color based on selection / role / risk
  const borderColor = isSelected
    ? '#3B82F6'
    : isFocal
    ? '#2563EB'
    : isHighRisk
    ? '#DC2626'
    : isMedRisk
    ? '#D97706'
    : '#16A34A';

  return (
    <div
      style={{ borderColor }}
      className={`px-3.5 py-3 rounded-xl border-2 text-xs shadow-xs transition-all bg-[var(--bg-card)] ${
        isSelected
          ? 'ring-4 ring-blue-500 shadow-lg shadow-blue-500/25 min-w-[225px]'
          : isFocal
          ? 'ring-2 ring-blue-400/50 min-w-[225px]'
          : isHighRisk
          ? 'min-w-[205px]'
          : 'min-w-[190px]'
      }`}
    >
      {/* Handles on all 4 borders so edges connect cleanly to borders without cutting through boxes */}
      <Handle type="target" position={Position.Top} id="target-top" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />
      <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />
      <Handle type="target" position={Position.Bottom} id="target-bottom" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />
      <Handle type="target" position={Position.Left} id="target-left" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />
      <Handle type="target" position={Position.Right} id="target-right" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-blue-500/40 !border-0" />

      {/* Top Header: Neutral ID & Plain Language Badges */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="font-mono font-bold text-xs text-[var(--text-primary)] truncate" title={`${neutralId} (${data.id})`}>
          {neutralId}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {/* Distinct electric blue badge for account under investigation */}
          {isFocal ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40 tracking-wider">
              SUBJECT
            </span>
          ) : roleBadge ? (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
              roleBadge.isFlagged
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
            }`}>
              {roleBadge.label}
            </span>
          ) : null}
        </div>
      </div>

      {/* Customer Entity Name */}
      <div className="text-xs font-semibold text-[var(--text-secondary)] truncate mb-1" title={customerName}>
        {customerName}
      </div>

      {/* Clear Risk Score: "Risk Score: 100/100 (Critical)" */}
      <div className="mb-2">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${badgeClass}`}>
          Risk Score: {score}/100 ({tier})
        </span>
      </div>

      {/* Volume Summary: Stacked separate lines with clear spacing */}
      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1 text-[11px] font-mono">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--text-muted)]">Inflow:</span>
          <strong className="text-emerald-400 font-semibold">{formatINR(data.total_in || 0)}</strong>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--text-muted)]">Outflow:</span>
          <strong className="text-amber-400 font-semibold">{formatINR(data.total_out || 0)}</strong>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  accountNode: AccountNode
};

interface ConsolidatedFlowEdge {
  id: string;
  source: string;
  target: string;
  totalAmount: number;
  count: number;
  isSuspicious: boolean;
  transactions: GraphEdge[];
}

// Auto-Fit Controller to frame graph cleanly on load
const AutoFitController: React.FC<{ triggerKey: string }> = ({ triggerKey }) => {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.16, duration: 250 });
    }, 100);
    return () => clearTimeout(timer);
  }, [triggerKey, fitView]);
  return null;
};

const GraphViewInner: React.FC<GraphViewProps> = ({ graphData, onSelectNode }) => {
  const focalNode = useMemo(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) return null;
    return graphData.nodes.find((n) => n.is_focal) || graphData.nodes[0];
  }, [graphData]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(focalNode?.id || null);
  const [selectedEdge, setSelectedEdge] = useState<ConsolidatedFlowEdge | null>(null);

  // Keep selected node synced when focal node or graphData changes
  useEffect(() => {
    if (focalNode) {
      setSelectedNodeId(focalNode.id);
      setSelectedEdge(null);
      if (onSelectNode) onSelectNode(focalNode.id);
    }
  }, [focalNode?.id, onSelectNode]);

  // Position nodes in an elliptical layout tailored to 16:9 canvas dimensions
  const { initialNodes, nodePosMap } = useMemo(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return { initialNodes: [], nodePosMap: new Map<string, { x: number; y: number }>() };
    }

    const nodes = graphData.nodes;
    const focal = nodes.find((n) => n.is_focal) || nodes[0];
    const otherNodes = nodes.filter((n) => n.id !== focal.id);

    const posMap = new Map<string, { x: number; y: number }>();
    const centerX = 460;
    const centerY = 260;
    // Elliptical layout preventing overlapping or touching
    const rx = Math.max(280, otherNodes.length * 52);
    const ry = Math.max(180, otherNodes.length * 36);

    posMap.set(focal.id, { x: centerX, y: centerY });

    const result: Node<any>[] = [
      {
        id: focal.id,
        type: 'accountNode',
        position: { x: centerX, y: centerY },
        data: {
          ...focal,
          isSelected: (selectedNodeId ? selectedNodeId === focal.id : true)
        }
      }
    ];

    const angleStep = (2 * Math.PI) / Math.max(1, otherNodes.length);

    otherNodes.forEach((node, idx) => {
      const angle = idx * angleStep;
      const x = Math.round(centerX + rx * Math.cos(angle));
      const y = Math.round(centerY + ry * Math.sin(angle));
      posMap.set(node.id, { x, y });

      result.push({
        id: node.id,
        type: 'accountNode',
        position: { x, y },
        data: {
          ...node,
          isSelected: selectedNodeId === node.id
        }
      });
    });

    return { initialNodes: result, nodePosMap: posMap };
  }, [graphData, selectedNodeId]);

  // Consolidated directional edges with varied weights and visible labels
  const { initialEdges, consolidatedEdges } = useMemo(() => {
    if (!graphData.edges || graphData.edges.length === 0) {
      return { initialEdges: [], consolidatedEdges: [] };
    }

    const edgeMap = new Map<string, ConsolidatedFlowEdge>();
    graphData.edges.forEach((e) => {
      const key = `${e.source}->${e.target}`;
      const existing = edgeMap.get(key);
      const amt = Number(e.amount || 0);
      if (existing) {
        existing.totalAmount += amt;
        existing.count += 1;
        existing.isSuspicious = existing.isSuspicious || !!e.is_suspicious;
        existing.transactions.push(e);
      } else {
        edgeMap.set(key, {
          id: `flow-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          totalAmount: amt,
          count: 1,
          isSuspicious: !!e.is_suspicious,
          transactions: [e]
        });
      }
    });

    const flows = Array.from(edgeMap.values());
    const amounts = flows.map((f) => f.totalAmount);
    const minAmt = amounts.length > 0 ? Math.min(...amounts) : 0;
    const maxAmt = amounts.length > 0 ? Math.max(...amounts) : 1;

    const edgesList: Edge[] = flows.map((flow) => {
      const ratio = maxAmt > minAmt ? (flow.totalAmount - minAmt) / (maxAmt - minAmt) : 0.5;
      // Line weight visibly ranges from 2.0px to 6.0px based on transfer volume
      const strokeWidth = Number((2.0 + ratio * 4.0).toFixed(1));
      const strokeColor = flow.totalAmount >= 50000 ? '#DC2626' : flow.totalAmount >= 25000 ? '#D97706' : '#2563EB';

      // Connect between the two closest facing handles on node borders
      const sPos = nodePosMap.get(flow.source) || { x: 0, y: 0 };
      const tPos = nodePosMap.get(flow.target) || { x: 0, y: 0 };
      const dx = tPos.x - sPos.x;
      const dy = tPos.y - sPos.y;

      let sourceHandle = 'source-right';
      let targetHandle = 'target-left';

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx >= 0) {
          sourceHandle = 'source-right';
          targetHandle = 'target-left';
        } else {
          sourceHandle = 'source-left';
          targetHandle = 'target-right';
        }
      } else {
        if (dy >= 0) {
          sourceHandle = 'source-bottom';
          targetHandle = 'target-top';
        } else {
          sourceHandle = 'source-top';
          targetHandle = 'target-bottom';
        }
      }

      // Display transfer amount on every edge
      const labelText = flow.count > 1
        ? `${formatINR(flow.totalAmount)} (${flow.count}x)`
        : formatINR(flow.totalAmount);

      return {
        id: flow.id,
        source: flow.source,
        target: flow.target,
        sourceHandle,
        targetHandle,
        animated: flow.isSuspicious,
        label: labelText,
        labelStyle: {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          fontWeight: 700,
          fill: 'var(--text-primary)'
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6,
        labelBgStyle: {
          fill: 'var(--bg-card)',
          fillOpacity: 0.95,
          stroke: strokeColor,
          strokeWidth: 1.5
        },
        style: {
          stroke: strokeColor,
          strokeWidth
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14 + Math.round(strokeWidth),
          height: 14 + Math.round(strokeWidth)
        },
        data: flow as any
      };
    });

    return { initialEdges: edgesList, consolidatedEdges: flows };
  }, [graphData, nodePosMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when data or selection changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Click on node updates selection and keeps detail panel in sync
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdge(null);
    setMobileInspectorOpen(true);
    if (onSelectNode) onSelectNode(node.id);
  }, [onSelectNode]);

  // Click on edge inspects flow telemetry
  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    const rawEdge = consolidatedEdges.find((e) => e.id === edge.id);
    if (rawEdge) {
      setSelectedEdge(rawEdge);
      setMobileInspectorOpen(true);
    }
  }, [consolidatedEdges]);

  // Active node currently inspected in right drawer
  const activeNode = useMemo(() => {
    if (!graphData.nodes) return null;
    if (selectedNodeId) {
      return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
    }
    return focalNode;
  }, [graphData.nodes, selectedNodeId, focalNode]);

  const activeNeutralId = activeNode ? getNeutralAccountId(activeNode.id) : '';
  const activeCustomerName = activeNode ? cleanCustomerName(activeNode.customer_name) : '';
  const activeRoleBadge = activeNode ? getAccountRoleBadge(activeNode.id) : null;
  const activeScore = activeNode?.risk_score !== undefined ? Math.round(activeNode.risk_score) : 75;
  const activeTier = activeScore >= 80 ? 'Critical' : activeScore >= 60 ? 'High' : activeScore >= 40 ? 'Moderate' : 'Low';

  const renderInspectorContent = (isMobile: boolean = false) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            {selectedEdge ? 'Transfer Route Summary' : 'Account Details'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {selectedEdge && (
            <button
              onClick={() => setSelectedEdge(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs px-1.5 py-0.5 rounded border border-[var(--border-subtle)]"
              title="Back to selected account"
            >
              Back
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileInspectorOpen(false)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Node Inspector - Always Synced with the Selected/Focal Node */}
      {!selectedEdge && activeNode && (
        <div className="space-y-2 text-[var(--text-secondary)]">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">Account Identifier</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="data-value text-sm font-bold text-blue-400 block font-mono">
                {activeNeutralId}
              </span>
              {activeNode.is_focal ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  UNDER INVESTIGATION
                </span>
              ) : activeRoleBadge ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  {activeRoleBadge.label}
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">Customer or Entity Name</span>
            <span className="font-semibold text-[var(--text-primary)] block truncate" title={activeCustomerName}>
              {activeCustomerName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-subtle)]">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Risk Score</span>
              <span className="data-value font-bold text-rose-400">
                {activeScore} / 100
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Risk Tier</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {activeTier}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-subtle)]">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Total Inflow</span>
              <span className="data-value font-bold text-emerald-400 font-mono">
                {formatINR(activeNode.total_in || 0)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Total Outflow</span>
              <span className="data-value font-bold text-amber-400 font-mono">
                {formatINR(activeNode.total_out || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edge Inspector */}
      {selectedEdge && (
        <div className="space-y-2 text-[var(--text-secondary)]">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">Transfer Origin (Sender)</span>
            <span className="data-value text-xs font-bold text-[var(--text-primary)] block font-mono">
              {getNeutralAccountId(selectedEdge.source)}
            </span>
          </div>
          <div className="flex items-center justify-center my-1 text-blue-400">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">Transfer Destination (Receiver)</span>
            <span className="data-value text-xs font-bold text-blue-400 block font-mono">
              {getNeutralAccountId(selectedEdge.target)}
            </span>
          </div>
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">Cumulative Volume:</span>
              <span className="data-value text-sm font-bold text-emerald-400 font-mono">
                {formatINR(selectedEdge.totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">Transfer Count:</span>
              <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                {selectedEdge.count} wire transfer{selectedEdge.count > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] pt-1 leading-snug">
              {selectedEdge.isSuspicious
                ? `${formatINR(selectedEdge.totalAmount)} transferred across ${selectedEdge.count} payments, flagged for rapid pass-through volume.`
                : `${formatINR(selectedEdge.totalAmount)} transferred across ${selectedEdge.count} payments.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card-console overflow-hidden relative h-[420px] sm:h-[480px] lg:h-[560px] bg-[var(--bg-app)] border border-[var(--border-default)] rounded-xl">
      {/* 1. React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.35}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border-default)" gap={24} size={1} />
        <Controls position="bottom-right" className="!bottom-3 !right-3 !bg-[var(--bg-card)] !border !border-[var(--border-default)] !rounded-lg !shadow-xs text-[var(--text-primary)]" />
        <AutoFitController triggerKey={`${graphData.account_id}-${graphData.nodes?.length}`} />
      </ReactFlow>

      {/* 2. Top-Left Console Header with Plain Language Caption */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 bg-[var(--bg-card)]/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-lg border border-[var(--border-default)] shadow-xs text-xs text-[var(--text-primary)] space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          <Layers className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="truncate">Transaction Flow Network:</span>
          <span className="data-value text-blue-400 font-mono font-bold shrink-0">
            {getNeutralAccountId(graphData.account_id)}
          </span>
          <span className="text-[var(--text-muted)] hidden sm:inline">•</span>
          <span className="text-xs text-[var(--text-muted)] font-normal hidden sm:inline">
            {graphData.total_nodes} Accounts, {consolidatedEdges.length} Routes
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-tight hidden sm:block">
          This map shows how money moved between this account and its counterparties — thicker lines mean larger transfers.
        </p>
      </div>

      {/* 3. Bottom-Left Legend explaining node colors & edge sizing in Plain English */}
      <div className="absolute bottom-3 left-3 z-10 bg-[var(--bg-card)]/95 backdrop-blur-xs rounded-lg border border-[var(--border-default)] shadow-xs text-[11px] max-w-xs overflow-hidden">
        <button
          onClick={() => setIsLegendExpanded(!isLegendExpanded)}
          className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider font-sans hover:bg-[var(--bg-card-hover)]"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Topology Legend</span>
          </div>
          <span className="text-[var(--text-muted)]">
            {isLegendExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </span>
        </button>
        <div className={`${isLegendExpanded ? 'block' : 'hidden sm:block'} px-3 pb-2.5 space-y-1.5 pt-1 border-t border-[var(--border-subtle)]`}>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-400 shrink-0" />
            <span className="truncate">Account Under Investigation</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">High Risk (Score 60–100)</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">Moderate Risk (Score 40–59)</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Low Risk (Score 0–39)</span>
          </div>
          <div className="pt-1 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] leading-tight">
            Line weight indicates transfer volume.
          </div>
        </div>
      </div>

      {/* 4. Desktop Synced Node / Edge Inspector Drawer (Right Side, lg screens) */}
      {(activeNode || selectedEdge) && (
        <div className="hidden lg:block absolute top-4 right-4 z-10 w-72 bg-[var(--bg-card)]/98 backdrop-blur-sm border border-[var(--border-default)] rounded-xl shadow-md p-4 text-xs animate-in fade-in duration-150">
          {renderInspectorContent(false)}
        </div>
      )}

      {/* 5. Mobile Inspector Toggle Button (when closed on mobile) */}
      {!mobileInspectorOpen && (activeNode || selectedEdge) && (
        <button
          onClick={() => setMobileInspectorOpen(true)}
          className="lg:hidden absolute top-3 right-3 z-10 bg-[var(--bg-card)]/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] shadow-xs text-xs font-semibold text-blue-500 flex items-center gap-1.5 touch-target"
          aria-label="View inspector details"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      )}

      {/* 6. Mobile / Tablet Bottom Sheet Inspector */}
      {mobileInspectorOpen && (activeNode || selectedEdge) && (
        <div className="lg:hidden absolute bottom-0 inset-x-0 z-20 max-h-[55%] overflow-y-auto bg-[var(--bg-card)]/98 backdrop-blur-md border-t border-[var(--border-default)] rounded-t-2xl shadow-2xl p-4 text-xs animate-in slide-in-from-bottom duration-200">
          {renderInspectorContent(true)}
        </div>
      )}
    </div>
  );
};

export const GraphView: React.FC<GraphViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphViewInner {...props} />
    </ReactFlowProvider>
  );
};

export default GraphView;
