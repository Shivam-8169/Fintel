import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  RefreshCw,
  Sparkles,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { CaseListItem } from '../types';

export const InvestigationPage: React.FC = () => {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [investigatingId, setInvestigatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getCases();
      setCases(res);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunInvestigation = async (caseId: string) => {
    try {
      setInvestigatingId(caseId);
      setStatusMsg(null);
      await api.investigateCase(caseId);
      setStatusMsg(`AI Investigation Agent successfully completed analysis for ${caseId} with grounded evidence.`);
      await fetchCases();
    } catch (err: any) {
      console.error('Investigation failed:', err);
      setStatusMsg(err.response?.data?.detail || err.message || 'Investigation failed');
    } finally {
      setInvestigatingId(null);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'INVESTIGATED') return c.status !== 'NEW';
    if (filterStatus === 'NEW') return c.status === 'NEW';
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span>AI Review & Case Explanation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            AI Case Review & Analysis
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
            Automated case review tool. Links every finding directly to supporting transactions, analyzes suspicious behavior patterns, and clearly highlights any uncertainties.
          </p>
        </div>

        <button
          onClick={fetchCases}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] inline-flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center space-x-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Grounding & Evidence Notice */}
      <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start space-x-4">
        <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] space-y-1 leading-relaxed">
          <span className="font-bold text-cyan-700 dark:text-cyan-300 block">Supporting Proof & Accuracy Rules</span>
          <p>
            The AI Review assistant evaluates connected accounts and verified transaction records. Every claim is tagged with linked proof (`EVD-XXXX`). Hypotheses and limitations are explicitly highlighted in the Uncertainties section so investigators have clear visibility.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-[var(--border-default)] pb-3 text-xs font-semibold">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterStatus === 'ALL'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          All Cases ({cases.length})
        </button>
        <button
          onClick={() => setFilterStatus('NEW')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterStatus === 'NEW'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Awaiting AI Review ({cases.filter((c) => c.status === 'NEW').length})
        </button>
        <button
          onClick={() => setFilterStatus('INVESTIGATED')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterStatus === 'INVESTIGATED'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Completed Reviews ({cases.filter((c) => c.status !== 'NEW').length})
        </button>
      </div>

      {/* Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCases.map((c) => {
          const isInvestigatingThis = investigatingId === c.case_id;
          const isDone = c.status !== 'NEW';

          return (
            <div
              key={c.case_id}
              className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--border-focus)] transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{c.case_id}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      c.risk_score >= 80
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}
                  >
                    Risk Level: {c.risk_score} / 100
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{c.customer_name}</h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Account: {c.account_id}</p>
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)] pt-1">
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{c.indicator_count} Flagged Signals</span>
                  <span>•</span>
                  <span className="font-mono text-[var(--text-secondary)]">{c.evidence_count} Supporting Transactions</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <Link
                  to={`/cases/${c.case_id}`}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Open Case</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

                <button
                  onClick={() => handleRunInvestigation(c.case_id)}
                  disabled={isInvestigatingThis}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
                    isDone
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20'
                  }`}
                >
                  <BrainCircuit className={`w-3.5 h-3.5 ${isInvestigatingThis ? 'animate-spin' : ''}`} />
                  <span>{isInvestigatingThis ? 'Reviewing...' : isDone ? 'Re-Run AI Review' : 'Run AI Review'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
