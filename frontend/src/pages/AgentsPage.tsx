import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Bot,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  Search,
  FileText,
  UserCheck,
  RefreshCw,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { ComplianceTerm } from '../components/ComplianceTerm';

export const AgentsPage: React.FC = () => {
  const [agentData, setAgentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStatus();
  }, []);

  const fetchAgentStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getAgentStatus();
      setAgentData(res);
    } catch (err) {
      console.error('Failed to load agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAgentDescription = (id: string, defaultRole: string) => {
    switch (id) {
      case 'agent-ingestion':
        return 'Validates bank statements, normalizes transaction columns, and builds the database graph of accounts and customers.';
      case 'agent-detection':
        return 'Scans transaction paths across 7 AML typologies (structuring, layering, circular loops) and flags high-risk accounts exceeding composite thresholds.';
      case 'agent-investigation':
        return "Reads the flagged account's history, traces multi-hop counterparties, and drafts an evidence-grounded suspicion summary.";
      case 'agent-reporting':
        return 'Compiles verified evidence and suspicion findings into official FIU-IND Suspicious Activity Report (SAR) dossiers ready for compliance review.';
      case 'agent-human-review':
        return 'Enables compliance officers to inspect evidence, adjust narratives, and provide mandatory legal sign-off before regulatory submission.';
      default:
        return defaultRole;
    }
  };

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'agent-ingestion':
        return Database;
      case 'agent-detection':
        return Search;
      case 'agent-investigation':
        return Bot;
      case 'agent-reporting':
        return FileText;
      case 'agent-human-review':
        return UserCheck;
      default:
        return Cpu;
    }
  };

  const getAgentGradient = (id: string) => {
    switch (id) {
      case 'agent-ingestion':
        return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400';
      case 'agent-detection':
        return 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400';
      case 'agent-investigation':
        return 'from-cyan-500/20 to-indigo-500/10 border-cyan-500/30 text-cyan-400';
      case 'agent-reporting':
        return 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400';
      case 'agent-human-review':
        return 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'from-slate-800 to-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Automated Intelligence & Analysis</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Automated AI Assistants
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
            Real-time status for the automated tools handling data intake, suspicious pattern detection, account connection analysis, and <ComplianceTerm term="SAR" /> draft generation.
          </p>
        </div>

        <button
          onClick={fetchAgentStatus}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Assistant Status</span>
        </button>
      </div>

      {/* Visual Pipeline Progression Ribbon */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            Execution Progression Flow
          </h2>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">5 Pipeline Stages Active</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
          {(agentData?.agents || []).map((agent: any, idx: number) => {
            const Icon = getAgentIcon(agent.id);
            return (
              <div
                key={agent.id}
                className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3 relative group hover:border-[var(--color-accent)] transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">STAGE 0{idx + 1}</span>
                  <span className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-500 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{agent.status}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg border ${getAgentGradient(agent.id)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">{agent.name}</span>
                </div>

                <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span>Latency:</span>
                  <span className="font-mono text-[var(--color-accent)] font-semibold">
                    {typeof agent.execution_avg_sec === 'number' ? `${agent.execution_avg_sec}s` : 'Human'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Agent Telemetry Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Agent Telemetry & Operating Profiles</h2>
          <span className="text-xs text-[var(--text-muted)]">Auto-monitored every 30s</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(agentData?.agents || []).map((agent: any) => {
            const Icon = getAgentIcon(agent.id);
            return (
              <div
                key={agent.id}
                className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] space-y-4 hover:border-[var(--border-hover)] transition-all shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl border ${getAgentGradient(agent.id)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{agent.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                        {getAgentDescription(agent.id, agent.role)}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-semibold shrink-0">
                    {agent.health}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block uppercase font-mono">Inputs Processed</span>
                    <span className="font-mono text-[var(--text-primary)] font-semibold block mt-0.5">
                      {agent.inputs_processed}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block uppercase font-mono">Outputs Produced</span>
                    <span className="font-mono text-[var(--color-accent)] font-semibold block mt-0.5">
                      {agent.outputs_produced}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block uppercase font-mono">Avg Execution Time</span>
                    <span className="font-mono text-[var(--text-primary)] font-semibold block mt-0.5">
                      {typeof agent.execution_avg_sec === 'number' ? `${agent.execution_avg_sec} seconds` : agent.execution_avg_sec}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block uppercase font-mono">Reliability</span>
                    <span className="font-mono text-emerald-500 font-semibold block mt-0.5">
                      {agent.error_rate_pct}% Error Rate
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Last Active:</span>
                  <span className="font-mono text-[var(--text-secondary)]">
                    {agent.last_execution ? new Date(agent.last_execution).toLocaleString() : 'Awaiting Action'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
