import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  FolderKanban,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { CaseListItem } from '../types';
import { getNeutralAccountId, cleanCustomerName, getCaseStatusLabel } from '../utils/complianceNaming';
import { ComplianceTerm } from '../components/ComplianceTerm';

export const CasesList: React.FC = () => {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCases();
  }, [riskFilter, statusFilter]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (riskFilter) params.risk_level = riskFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getCases(params);
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const neutralId = getNeutralAccountId(c.account_id).toLowerCase();
    return (
      c.case_id.toLowerCase().includes(term) ||
      c.account_id.toLowerCase().includes(term) ||
      neutralId.includes(term) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(term))
    );
  });

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-bold';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold';
      case 'MEDIUM':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-medium';
      default:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium';
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="pulse-badge">
              <span className="pulse-beacon" />
              <span>INVESTIGATION HUB</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Investigation Cases</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Flagged Suspicious Cases
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Accounts flagged during activity scanning that require investigator review, connections map checks, and report sign-offs.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => fetchCases()}
            disabled={loading}
            className="btn-secondary h-9 px-4 text-xs font-semibold rounded-full shadow-2xs inline-flex items-center gap-2"
            title="Refresh cases list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Cases</span>
          </button>
          <Link to="/new-investigation" className="btn-primary h-9 px-5 text-xs font-semibold rounded-full shadow-2xs inline-flex items-center gap-2">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Start New Investigation</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-3 sm:p-4 rounded-xl pulse-card shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID, account number, or customer name..."
            className="w-full h-9 pl-9 pr-9 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full sm:w-auto h-9 px-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-xs font-medium cursor-pointer"
            >
              <option value="">All Risk Levels</option>
              <option value="CRITICAL">Critical (80–100) — Immediate Filing Priority</option>
              <option value="HIGH">High (60–79) — Prioritized Review</option>
              <option value="MEDIUM">Medium (40–59) — Standard Monitoring</option>
              <option value="LOW">Low (0–39) — Low Risk</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto h-9 px-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-xs font-medium cursor-pointer"
            >
              <option value="">All Workflow Statuses</option>
              <option value="NEW">Needs Initial Triage</option>
              <option value="UNDER_INVESTIGATION">Investigation in Progress</option>
              <option value="REPORT_DRAFTED">Report Drafted</option>
              <option value="PENDING_REVIEW">Awaiting Your Review</option>
              <option value="APPROVED">Approved for Regulatory Filing</option>
              <option value="REJECTED">Closed — False Positive</option>
            </select>
          </div>

          <div className="h-9 flex items-center text-[var(--text-muted)] font-mono text-[11px] px-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] shrink-0 ml-auto sm:ml-0">
            <span className="font-semibold text-[var(--text-primary)] mr-1">{filteredCases.length}</span> of {cases.length}
          </div>
        </div>
      </div>

      {/* CASES PRESENTATION: Mobile Cards + Desktop Table */}
      <div className="rounded-xl pulse-card overflow-hidden shadow-xs">
        {/* Mobile Case Cards (< 640px) */}
        <div className="block sm:hidden divide-y divide-[var(--border-subtle)]">
          {loading ? (
            <div className="py-10 text-center text-[var(--text-muted)]">
              <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading cases...</span>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)]">
              <p className="text-xs font-medium text-[var(--text-primary)]">No cases match criteria.</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Try resetting filters or start a new investigation.</p>
            </div>
          ) : (
            filteredCases.map((c) => {
              const statusInfo = getCaseStatusLabel(c.status);
              return (
                <div
                  key={`card-${c.case_id}`}
                  className="p-4 hover:bg-[var(--bg-card-subtle)] transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/cases/${c.case_id}`}
                      className="font-mono font-bold text-xs text-[var(--color-accent-text)] hover:underline truncate"
                    >
                      {c.case_id}
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] border whitespace-nowrap ${getRiskBadge(c.risk_level)}`}>
                        {c.risk_level} ({Math.round(c.risk_score)})
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                      {cleanCustomerName(c.customer_name)}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                      Account: {getNeutralAccountId(c.account_id)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] tracking-wide border whitespace-nowrap ${statusInfo.style}`}>
                        <span className={`w-1 h-1 rounded-full shrink-0 ${statusInfo.dot}`} />
                        <span>{statusInfo.label}</span>
                      </span>
                      {c.assigned_to && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>{c.assigned_to}</span>
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/cases/${c.case_id}`}
                      className="btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Open</span>
                      <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop & Tablet Table (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--border-default)]">
          <table className="w-full text-left text-xs border-collapse min-w-[1140px] table-fixed">
            <colgroup>
              <col className="w-[110px]" /> {/* Case ID */}
              <col className="w-[100px]" /> {/* Account */}
              <col className="w-[190px]" /> {/* Customer / Business */}
              <col className="w-[85px]" />  {/* Risk Score */}
              <col className="w-[95px]" />  {/* Risk Level */}
              <col className="w-[215px]" /> {/* Status */}
              <col className="w-[135px]" /> {/* Assigned To */}
              <col className="w-[100px]" /> {/* Supporting Txns */}
              <col className="w-[110px]" /> {/* Action */}
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] font-semibold text-[11px] uppercase tracking-wider select-none">
                <th className="py-3 px-3 align-middle whitespace-nowrap">Case ID</th>
                <th className="py-3 px-3 align-middle whitespace-nowrap">Account</th>
                <th className="py-3 px-3 align-middle whitespace-nowrap">Customer / Business</th>
                <th className="py-3 px-3 align-middle text-right whitespace-nowrap">Risk Score</th>
                <th className="py-3 px-3 align-middle whitespace-nowrap">Risk Level</th>
                <th className="py-3 px-3 align-middle whitespace-nowrap">Status</th>
                <th className="py-3 px-3 align-middle whitespace-nowrap">Assigned To</th>
                <th className="py-3 px-3 align-middle whitespace-nowrap">Supporting Txns</th>
                <th className="py-3 px-3 align-middle text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--text-muted)] align-middle">
                    <div className="w-7 h-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs">Loading cases list...</span>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--text-muted)] align-middle">
                    <div className="p-4 max-w-sm mx-auto">
                      <p className="text-xs font-medium text-[var(--text-primary)]">No cases match your filter criteria.</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Try clearing your search query or adjusting risk/status filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const statusInfo = getCaseStatusLabel(c.status);
                  return (
                    <tr key={c.case_id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                      {/* 1. Case ID */}
                      <td className="py-3 px-3 align-middle">
                        <Link
                          to={`/cases/${c.case_id}`}
                          className="font-mono font-bold text-xs text-[var(--color-accent-text)] hover:underline whitespace-nowrap block"
                        >
                          {c.case_id}
                        </Link>
                      </td>

                      {/* 2. Account */}
                      <td className="py-3 px-3 align-middle">
                        <span className="font-mono font-medium text-xs text-[var(--text-primary)] whitespace-nowrap block">
                          {getNeutralAccountId(c.account_id)}
                        </span>
                      </td>

                      {/* 3. Customer / Business */}
                      <td className="py-3 px-3 align-middle">
                        <div className="min-w-0 max-w-[175px]">
                          <p className="font-medium text-xs text-[var(--text-primary)] truncate" title={cleanCustomerName(c.customer_name)}>
                            {cleanCustomerName(c.customer_name)}
                          </p>
                        </div>
                      </td>

                      {/* 4. Risk Score */}
                      <td className="py-3 px-3 align-middle text-right">
                        <div className="font-mono font-bold text-xs whitespace-nowrap">
                          <span className={c.risk_score >= 80 ? 'text-rose-600 dark:text-rose-400' : c.risk_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}>
                            {c.risk_score}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-normal"> / 100</span>
                        </div>
                      </td>

                      {/* 5. Risk Level */}
                      <td className="py-3 px-3 align-middle">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap border ${getRiskBadge(c.risk_level)}`}>
                          {c.risk_level}
                        </span>
                      </td>

                      {/* 6. Status Badge */}
                      <td className="py-3 px-3 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] tracking-wide whitespace-nowrap border leading-none ${statusInfo.style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dot}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* 7. Assigned To Pill */}
                      <td className="py-3 px-3 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] whitespace-nowrap leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                          <span className="truncate max-w-[100px]" title={c.assigned_to || 'Unassigned'}>
                            {c.assigned_to || 'Unassigned'}
                          </span>
                        </span>
                      </td>

                      {/* 8. Supporting Transactions */}
                      <td className="py-3 px-3 align-middle">
                        <span className="font-mono text-xs text-[var(--text-muted)] whitespace-nowrap block">
                          {c.evidence_count} {c.evidence_count === 1 ? 'record' : 'records'}
                        </span>
                      </td>

                      {/* 9. Action Button */}
                      <td className="py-3 px-3 align-middle text-right">
                        <div className="flex items-center justify-end">
                          <Link
                            to={`/cases/${c.case_id}`}
                            className="btn-secondary h-8 px-2.5 text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1 rounded-lg shadow-2xs hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent-text)] transition-all shrink-0"
                          >
                            <span>Open Case</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-accent-text)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CasesList;
