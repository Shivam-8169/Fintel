import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Clock,
  ArrowUpRight,
  UploadCloud,
  CheckCircle2,
  Users,
  CreditCard,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardSummary } from '../types';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      setUploadStatus(`Ingesting and validating ${file.name}...`);
      const res = await api.uploadDataset(file, type, true);
      setUploadStatus(`Success: ${res.records_valid} records ingested, ${res.records_rejected} rejected.`);
      await loadDashboard();
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading Fintel AML Intelligence Suite...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Flagged Cases',
      value: summary?.total_cases || 0,
      icon: ShieldAlert,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Active Ledger'
    },
    {
      label: 'Critical Risk (80-100)',
      value: summary?.critical_cases || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
      badge: 'Immediate Triage'
    },
    {
      label: 'High Risk (60-79)',
      value: summary?.high_risk_cases || 0,
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-600',
      badge: 'Elevated'
    },
    {
      label: 'Pending Human Review',
      value: summary?.pending_review || 0,
      icon: Clock,
      color: 'from-purple-500 to-pink-600',
      badge: 'Action Needed'
    },
    {
      label: 'Approved SARs',
      value: summary?.approved_cases || 0,
      icon: FileCheck2,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Human Signed'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Financial Crime Triage & Investigation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explainable Multi-Agent Pipeline: Autonomous Ingestion, Graph Topology Detection, AI Investigation, and SAR Drafting.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/cases"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition-all font-bold"
          >
            <span>Review Flagged Cases</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{kpi.label}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {kpi.badge}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono tracking-tight text-slate-100">
                  {kpi.value}
                </span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Layout: Top Cases & Synthetic Data Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Flagged Entities */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Top Flagged Entities Exceeding Detection Threshold
              </h2>
            </div>
            <Link to="/cases" className="text-xs text-cyan-400 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {summary?.top_flagged_cases && summary.top_flagged_cases.length > 0 ? (
              summary.top_flagged_cases.map((c) => (
                <div key={c.case_id} className="py-3 flex items-center justify-between hover:bg-slate-900/40 px-2 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <Link
                        to={`/cases/${c.case_id}`}
                        className="font-mono text-xs font-bold text-cyan-400 hover:underline"
                      >
                        {c.case_id}
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">({c.account_id})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.risk_level === 'CRITICAL'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {c.risk_level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Workflow Status: <strong className="text-slate-300 font-semibold">{c.status}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-red-400">
                        {c.risk_score} / 100
                      </div>
                      <div className="text-[10px] text-slate-400">Composite Score</div>
                    </div>
                    <Link
                      to={`/cases/${c.case_id}`}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Investigate Case"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No cases currently flagged.</p>
            )}
          </div>
        </div>

        {/* Data Ingestion & System Statistics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Data Ingestion Agent
            </h2>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>Total Entities (KYC):</span>
              </span>
              <strong className="font-mono text-slate-100">{summary?.total_customers || 0}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 text-slate-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transactions Ingested:</span>
              </span>
              <strong className="font-mono text-slate-100">{summary?.total_transactions || 0}</strong>
            </div>
          </div>

          {/* Upload Buttons */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 block">
              Ingest Custom Synthetic CSV:
            </span>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors text-xs text-slate-300">
              <span>Upload Transactions CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                disabled={uploadLoading}
                onChange={(e) => handleFileUpload(e, 'transactions')}
              />
              <UploadCloud className="w-4 h-4 text-cyan-400" />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors text-xs text-slate-300">
              <span>Upload Customers CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                disabled={uploadLoading}
                onChange={(e) => handleFileUpload(e, 'customers')}
              />
              <UploadCloud className="w-4 h-4 text-cyan-400" />
            </label>
          </div>

          {uploadStatus && (
            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs">
              {uploadStatus}
            </div>
          )}

          <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
            Synthetic AML dataset includes 7 benchmark typologies: Rapid Movement, Structuring, Fan-in Mules, Fan-out Dispersion, High Velocity Bursts, and Circular Layering Loops.
          </div>
        </div>
      </div>
    </div>
  );
};
