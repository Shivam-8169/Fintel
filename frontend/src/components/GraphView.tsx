import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ShieldAlert, ArrowRight, DollarSign, Calendar, X, Building, AlertTriangle } from 'lucide-react';
import { GraphData, GraphNode, GraphEdge } from '../types';

interface GraphViewProps {
  graphData: GraphData;
  onSelectNode?: (nodeId: string) => void;
}

// Custom Node Component for Accounts
const AccountNode: React.FC<{ data: GraphNode }> = ({ data }) => {
  const isFocal = data.is_focal;
  const isHighRisk = data.risk_level === 'HIGH' || data.risk_level === 'CRITICAL' || data.is_suspicious;

  return (
    <div
      className={`px-3 py-2.5 rounded-xl border text-xs shadow-lg transition-all min-w-[170px] ${
        isFocal
          ? 'bg-cyan-950/90 border-cyan-400 text-cyan-100 ring-2 ring-cyan-400/40 shadow-cyan-500/20'
          : isHighRisk
          ? 'bg-red-950/80 border-red-500/80 text-red-100 ring-1 ring-red-500/30'
          : 'bg-slate-900/90 border-slate-700 text-slate-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-cyan-400" />
      
      <div className="flex items-center justify-between space-x-2 mb-1.5">
        <span className="font-mono font-bold text-[11px] truncate max-w-[110px]" title={data.id}>
          {data.id}
        </span>
        {isFocal && (
          <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider">
            Subject
          </span>
        )}
        {!isFocal && isHighRisk && (
          <span className="px-1 py-0.2 rounded bg-red-500 text-white font-bold text-[9px] uppercase">
            Flagged
          </span>
        )}
      </div>

      <div className="text-[11px] text-slate-400 truncate max-w-[150px]" title={data.customer_name}>
        {data.customer_name || 'External Account'}
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
        <span>In: <strong className="text-emerald-400 font-mono">${(data.total_in || 0).toLocaleString()}</strong></span>
        <span>Out: <strong className="text-amber-400 font-mono">${(data.total_out || 0).toLocaleString()}</strong></span>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-cyan-400" />
    </div>
  );
};

const nodeTypes = {
  accountNode: AccountNode
};

export const GraphView: React.FC<GraphViewProps> = ({ graphData, onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Compute node positions using a circular/force layout around the focal node
  const initialNodes: Node<any>[] = useMemo(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) return [];

    const nodes = graphData.nodes;
    const focalNode = nodes.find((n) => n.is_focal) || nodes[0];
    const otherNodes = nodes.filter((n) => n.id !== focalNode.id);

    const result: Node<any>[] = [
      {
        id: focalNode.id,
        type: 'accountNode',
        position: { x: 350, y: 250 },
        data: focalNode as any
      }
    ];

    const radius = 260;
    const angleStep = (2 * Math.PI) / Math.max(1, otherNodes.length);

    otherNodes.forEach((node, idx) => {
      const angle = idx * angleStep;
      // Add slight jitter for multi-hop
      const r = radius + (idx % 2 === 0 ? 0 : 50);
      result.push({
        id: node.id,
        type: 'accountNode',
        position: {
          x: 350 + r * Math.cos(angle),
          y: 250 + r * Math.sin(angle)
        },
        data: node as any
      });
    });

    return result;
  }, [graphData]);

  const initialEdges: Edge<any>[] = useMemo(() => {
    if (!graphData.edges) return [];
    return graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: `$${e.amount.toLocaleString()}`,
      labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
      labelBgPadding: [4, 2] as [number, number],
      animated: e.is_suspicious,
      style: {
        stroke: e.is_suspicious ? '#ef4444' : '#38bdf8',
        strokeWidth: e.is_suspicious ? 2.5 : 1.5
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.is_suspicious ? '#ef4444' : '#38bdf8'
      },
      data: e as any
    }));
  }, [graphData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.data as any as GraphNode);
      setSelectedEdge(null);
      if (onSelectNode) onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.data as any as GraphEdge);
    setSelectedNode(null);
  }, []);

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        className="bg-slate-950"
      >
        <Background color="#1e293b" gap={18} size={1} />
        <Controls className="!bg-slate-900 !border-slate-700 !text-slate-200" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any as GraphNode;
            if (data?.is_focal) return '#06b6d4';
            if (data?.is_suspicious) return '#ef4444';
            return '#334155';
          }}
          className="!bg-slate-900/90 !border-slate-800 rounded-xl"
        />
      </ReactFlow>

      {/* Floating Info Drawer for Selected Node */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 glass-panel-elevated p-4 rounded-xl text-xs space-y-3 z-30 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-100 font-mono">{selectedNode.id}</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Account Type:</span>
              <span className="font-semibold text-slate-200">{selectedNode.account_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Customer Name:</span>
              <span className="font-semibold text-slate-200">{selectedNode.customer_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Level:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                selectedNode.risk_level === 'HIGH' || selectedNode.risk_level === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {selectedNode.risk_level || 'LOW'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Total Inflow</div>
              <div className="text-xs font-bold text-emerald-400 font-mono">
                ${(selectedNode.total_in || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Total Outflow</div>
              <div className="text-xs font-bold text-amber-400 font-mono">
                ${(selectedNode.total_out || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>In-degree: <strong className="text-slate-200">{selectedNode.in_degree}</strong></span>
            <span>Out-degree: <strong className="text-slate-200">{selectedNode.out_degree}</strong></span>
          </div>
        </div>
      )}

      {/* Floating Info Drawer for Selected Edge */}
      {selectedEdge && (
        <div className="absolute top-4 right-4 w-80 glass-panel-elevated p-4 rounded-xl text-xs space-y-3 z-30 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-100 font-mono">Transaction Ledger</span>
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
              <span className="text-slate-400">{selectedEdge.source}</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">{selectedEdge.target}</span>
            </div>

            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-slate-400">Amount:</span>
              <span className="font-bold text-base text-emerald-400 font-mono">
                ${selectedEdge.amount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Transaction Type:</span>
              <span className="text-slate-200 font-mono">{selectedEdge.transaction_type}</span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Timestamp:</span>
              <span className="text-slate-300 font-mono">{selectedEdge.timestamp}</span>
            </div>

            {selectedEdge.is_suspicious && (
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[11px]">Exceeds institutional high-value reporting threshold.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
