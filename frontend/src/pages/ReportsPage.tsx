import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Building,
  CreditCard,
  SlidersHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { getNeutralAccountId, cleanCustomerName } from '../utils/complianceNaming';
import { ComplianceTerm } from '../components/ComplianceTerm';

interface SARReportItem {
  report_id: string;
  case_id: string;
  account_id: string;
  customer_name: string;
  risk_score: number;
  risk_level: string;
  status: string;
  summary: string;
  created_at?: string;
  updated_at?: string;
}

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<SARReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getAllReports();
      setReports(res || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpand = (reportId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const getSarFilingStatus = (rawStatus: string) => {
    switch (rawStatus?.toUpperCase()) {
      case 'APPROVED':
        return {
          label: 'Approved for Regulatory Filing',
          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dotClass: 'bg-emerald-500'
        };
      case 'PENDING_REVIEW':
      case 'REPORT_DRAFTED':
        return {
          label: 'Pending Review',
          badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dotClass: 'bg-amber-500'
        };
      case 'REJECTED':
        return {
          label: 'Closed — False Positive',
          badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          dotClass: 'bg-rose-500'
        };
      case 'DRAFT':
      default:
        return {
          label: 'Draft',
          badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          dotClass: 'bg-slate-400'
        };
    }
  };

  const getRiskScoreDetails = (score: number, level?: string) => {
    const rounded = Math.round(score || 0);
    const effLevel = level?.toUpperCase() || (rounded >= 80 ? 'CRITICAL' : rounded >= 60 ? 'HIGH' : rounded >= 40 ? 'MEDIUM' : 'LOW');

    if (rounded >= 80 || effLevel === 'CRITICAL') {
      return {
        textColor: 'text-rose-600 dark:text-rose-400',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        label: effLevel
      };
    }
    if (rounded >= 60 || effLevel === 'HIGH') {
      return {
        textColor: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        label: effLevel
      };
    }
    if (rounded >= 40 || effLevel === 'MEDIUM') {
      return {
        textColor: 'text-blue-600 dark:text-blue-400',
        badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        label: effLevel
      };
    }
    return {
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      label: effLevel
    };
  };

  // Filtered reports calculation
  const filteredReports = reports.filter((r) => {
    const neutralId = getNeutralAccountId(r.account_id || '').toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (r.report_id && r.report_id.toLowerCase().includes(query)) ||
      (r.case_id && r.case_id.toLowerCase().includes(query)) ||
      (r.account_id && r.account_id.toLowerCase().includes(query)) ||
      neutralId.includes(query) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(query)) ||
      (r.summary && r.summary.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'DRAFT' && r.status === 'DRAFT') ||
      (statusFilter === 'PENDING_REVIEW' && (r.status === 'PENDING_REVIEW' || r.status === 'REPORT_DRAFTED')) ||
      (statusFilter === 'APPROVED' && r.status === 'APPROVED') ||
      (statusFilter === 'REJECTED' && r.status === 'REJECTED');

    return matchesSearch && matchesStatus;
  });

  // Filter tab counts
  const statusCounts = {
    ALL: reports.length,
    DRAFT: reports.filter((r) => r.status === 'DRAFT').length,
    PENDING_REVIEW: reports.filter((r) => r.status === 'PENDING_REVIEW' || r.status === 'REPORT_DRAFTED').length,
    APPROVED: reports.filter((r) => r.status === 'APPROVED').length,
    REJECTED: reports.filter((r) => r.status === 'REJECTED').length
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="pulse-badge">
              <span className="pulse-beacon" />
              <span>REGULATORY REPORTS</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent-text)]">
              <FileText className="w-3.5 h-3.5" />
              <span>Draft Reports</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Suspicious Activity Reports (<ComplianceTerm term="SAR" />)
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Standardized <ComplianceTerm term="FIU-IND" /> reports prepared from verified transaction proof, awaiting investigator review and official sign-off.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="btn-secondary h-9 px-4 text-xs font-semibold rounded-full shadow-2xs self-start sm:self-auto shrink-0 inline-flex items-center gap-2"
          title="Refresh regulatory reports"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* 2. CONFIDENTIALITY BANNER */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] flex items-start sm:items-center space-x-3 text-[var(--color-warning-text)] text-xs shadow-2xs transition-colors">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--color-warning)] mt-0.5 sm:mt-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-[var(--text-primary)]">CONFIDENTIAL DRAFT — REQUIRES INVESTIGATOR SIGN-OFF</span>: Reports in this section are initial drafts. No report is filed without explicit investigator review, edits, and final approval.
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-default)] shadow-2xs transition-colors">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          {[
            { id: 'ALL', label: 'All Reports', count: statusCounts.ALL },
            { id: 'DRAFT', label: 'Draft', count: statusCounts.DRAFT },
            { id: 'PENDING_REVIEW', label: 'Pending Review', count: statusCounts.PENDING_REVIEW },
            { id: 'APPROVED', label: 'Approved for Filing', count: statusCounts.APPROVED },
            { id: 'REJECTED', label: 'Closed / Rejected', count: statusCounts.REJECTED }
          ].map((st) => {
            const isActive = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--color-blue)] text-white shadow-2xs font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white font-bold' : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative shrink-0 w-full lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report ID, case, subject..."
            className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. ENTERPRISE SAR REPORTS TABLE (Desktop & Tablet) */}
      <div className="hidden md:block bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1310px] table-fixed">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[210px]" />
              <col className="w-[210px]" />
              <col className="w-[120px]" />
              <col className="w-[230px]" />
              <col className="w-[290px]" />
            </colgroup>

            <thead className="bg-[var(--bg-table-alt)] border-b border-[var(--border-default)] text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap align-middle">Report ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap align-middle">Case Reference</th>
                <th className="py-3.5 px-4 align-middle">Subject & Account</th>
                <th className="py-3.5 px-4 whitespace-nowrap align-middle">Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap align-middle">Risk Level</th>
                <th className="py-3.5 px-4 align-middle">Summary</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-default)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[var(--text-muted)]">
                    <div className="w-7 h-7 border-2 border-[var(--color-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Loading regulatory reports repository...</span>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[var(--text-muted)]">
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-1 stroke-1" />
                      <p className="text-xs font-semibold text-[var(--text-primary)]">No SAR reports found</p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {searchQuery || statusFilter !== 'ALL'
                          ? 'No reports match your current filter or search criteria. Try clearing filters.'
                          : 'No drafted reports currently exist. Generated SARs from the Investigation Pipeline will appear here.'}
                      </p>
                      {(searchQuery || statusFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                          }}
                          className="mt-2 text-xs text-[var(--color-accent-text)] hover:underline font-medium"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const statusInfo = getSarFilingStatus(r.status);
                  const riskInfo = getRiskScoreDetails(r.risk_score, r.risk_level);
                  const isExpanded = expandedRows.has(r.report_id);
                  const customerName = cleanCustomerName(r.customer_name);
                  const neutralAccountId = getNeutralAccountId(r.account_id);

                  return (
                    <React.Fragment key={r.report_id}>
                      <tr className="hover:bg-[var(--bg-table-hover)] transition-colors group align-middle">
                        {/* 1. Report ID */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Link
                            to={`/reports/${r.report_id}`}
                            className="font-mono text-xs font-semibold text-[var(--color-accent-text)] hover:underline inline-flex items-center gap-1 transition-colors"
                            title={`Inspect SAR Draft ${r.report_id}`}
                          >
                            <span>{r.report_id}</span>
                          </Link>
                        </td>

                        {/* 2. Case Reference */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Link
                            to={`/cases/${r.case_id}`}
                            className="font-mono text-xs font-medium text-[var(--text-primary)] hover:text-[var(--color-accent-text)] hover:underline transition-colors"
                            title={`Open Case Dossier ${r.case_id}`}
                          >
                            {r.case_id}
                          </Link>
                        </td>

                        {/* 3. Subject & Account */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span
                              className="font-semibold text-xs text-[var(--text-primary)] leading-snug break-words"
                              title={r.customer_name}
                            >
                              {customerName}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5 tracking-tight flex items-center gap-1">
                              {neutralAccountId}
                            </span>
                          </div>
                        </td>

                        {/* 4. Current Filing Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium leading-none border shadow-2xs whitespace-nowrap ${statusInfo.badgeClass}`}
                            title={statusInfo.label}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dotClass}`} />
                            <span className="whitespace-nowrap">{statusInfo.label}</span>
                          </span>
                        </td>

                        {/* 5. Risk Rating */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs font-bold ${riskInfo.textColor}`}>
                              {Math.round(r.risk_score || 0)} / 100
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${riskInfo.badgeClass}`}
                            >
                              {riskInfo.label}
                            </span>
                          </div>
                        </td>

                        {/* 6. Executive Summary */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-between gap-2 max-w-[245px]">
                            <span
                              className="text-xs text-[var(--text-secondary)] truncate block"
                              title={r.summary}
                            >
                              {r.summary || 'Draft SAR summary generated.'}
                            </span>
                            {r.summary && r.summary.length > 50 && (
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(r.report_id)}
                                className="shrink-0 text-[11px] font-medium text-[var(--color-accent-text)] hover:underline focus:outline-none flex items-center gap-0.5 cursor-pointer"
                                title={isExpanded ? 'Collapse executive summary' : 'Read full executive summary'}
                              >
                                <span>{isExpanded ? 'Less' : 'More'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 7. Next Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/reports/${r.report_id}`}
                              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-white bg-[var(--color-blue)] hover:opacity-90 shadow-2xs transition-colors shrink-0"
                              title="Inspect SAR Draft"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>Inspect SAR Draft</span>
                            </Link>
                            <Link
                              to={`/cases/${r.case_id}`}
                              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[var(--text-primary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-default)] hover:border-[var(--border-strong)] shadow-2xs transition-colors shrink-0"
                              title="Open Case Dossier"
                            >
                              <span>Open Case Dossier</span>
                              <ExternalLink className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Executive Summary Narrative Row */}
                      {isExpanded && (
                        <tr className="bg-[var(--bg-table-alt)] border-b border-[var(--border-default)]">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-default)] shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[var(--color-accent-text)]" />
                                  <span className="text-xs font-bold text-[var(--text-primary)]">
                                    Full Executive Narrative — {r.report_id}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                                  Case Reference: {r.case_id}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                {r.summary}
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                                <span>Subject: {customerName} ({neutralAccountId})</span>
                                <Link
                                  to={`/reports/${r.report_id}`}
                                  className="text-[var(--color-accent-text)] hover:underline font-medium inline-flex items-center gap-1"
                                >
                                  Open full regulatory report editor →
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MOBILE RESPONSIVE CARDS VIEW (< 768px) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center text-[var(--text-muted)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)]">
            <div className="w-6 h-6 border-2 border-[var(--color-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs font-medium text-[var(--text-secondary)]">Loading reports...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] p-6">
            <p className="text-xs font-semibold text-[var(--text-primary)]">No SAR reports found</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Try clearing your filters or search query.</p>
          </div>
        ) : (
          filteredReports.map((r) => {
            const statusInfo = getSarFilingStatus(r.status);
            const riskInfo = getRiskScoreDetails(r.risk_score, r.risk_level);
            const isExpanded = expandedRows.has(r.report_id);
            const customerName = cleanCustomerName(r.customer_name);
            const neutralAccountId = getNeutralAccountId(r.account_id);

            return (
              <div
                key={r.report_id}
                className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] p-4 shadow-2xs space-y-3"
              >
                {/* Card Header: IDs & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/reports/${r.report_id}`}
                      className="font-mono text-xs font-bold text-[var(--color-accent-text)] hover:underline block"
                    >
                      {r.report_id}
                    </Link>
                    <Link
                      to={`/cases/${r.case_id}`}
                      className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] block mt-0.5"
                    >
                      Ref: {r.case_id}
                    </Link>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none border shrink-0 ${statusInfo.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dotClass}`} />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* Subject & Risk Info */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block tracking-wider">
                      Subject & Account
                    </span>
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug break-words mt-0.5">
                      {customerName}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                      {neutralAccountId}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block tracking-wider">
                      Risk Rating
                    </span>
                    <span className={`font-mono text-xs font-bold ${riskInfo.textColor} block mt-0.5`}>
                      {Math.round(r.risk_score || 0)} / 100
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border uppercase tracking-wider inline-block mt-0.5 ${riskInfo.badgeClass}`}
                    >
                      {riskInfo.label}
                    </span>
                  </div>
                </div>

                {/* Summary Preview */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block tracking-wider mb-1">
                    Executive Summary
                  </span>
                  <p className={`text-xs text-[var(--text-secondary)] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {r.summary || 'Draft SAR summary generated.'}
                  </p>
                  {r.summary && r.summary.length > 80 && (
                    <button
                      type="button"
                      onClick={() => toggleRowExpand(r.report_id)}
                      className="text-[11px] font-medium text-[var(--color-accent-text)] hover:underline mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Show less' : 'Read full summary'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Actions Stack */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row gap-2">
                  <Link
                    to={`/reports/${r.report_id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white bg-[var(--color-blue)] hover:opacity-90 shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect SAR Draft</span>
                  </Link>
                  <Link
                    to={`/cases/${r.case_id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-[var(--text-primary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-default)] shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Open Case Dossier</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
