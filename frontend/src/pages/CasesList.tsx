import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { CaseListItem } from '../types';

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
    return (
      c.case_id.toLowerCase().includes(term) ||
      c.account_id.toLowerCase().includes(term) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'REPORT_DRAFTED':
      case 'PENDING_REVIEW':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'UNDER_INVESTIGATION':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-700 font-bold';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-700 font-bold';
      case 'MEDIUM':
        return 'bg-yellow-950/60 text-yellow-400 border-yellow-700';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Flagged Suspicious Cases
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accounts exceeding composite risk thresholds requiring autonomous agent investigation and human sign-off.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID, Account ID, or Customer name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="">All Workflow Statuses</option>
              <option value="NEW">New</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="REPORT_DRAFTED">Report Drafted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Subject Account</th>
                <th className="py-3.5 px-4">Customer Entity</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Workflow Status</th>
                <th className="py-3.5 px-4">Evidence</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading cases ledger...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No cases matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.case_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      <Link to={`/cases/${c.case_id}`} className="hover:underline">
                        {c.case_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {c.account_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {c.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-red-400">
                      {c.risk_score} / 100
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getRiskBadge(c.risk_level)}`}>
                        {c.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {c.evidence_count} items
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/cases/${c.case_id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                      >
                        <span>Investigate</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
