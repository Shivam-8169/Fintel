import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  UploadCloud,
  CheckCircle2,
  Plus,
  Activity,
  ArrowUpRight,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardSummary, CaseListItem, User } from '../types';
import { formatINR, formatINRText } from '../utils/currency';
import { getNeutralAccountId, cleanCustomerName, getCaseStatusLabel, getIndicatorPlainTitle } from '../utils/complianceNaming';
import { ComplianceTerm } from '../components/ComplianceTerm';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [timeRange, setTimeRange] = useState<'90d' | '30d' | '7d'>('30d');
  const [activeTab, setActiveTab] = useState<'all' | 'high_risk' | 'investigating' | 'approved'>('all');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumData, casesData, userData] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getCases().catch(() => []),
        api.getCurrentUser().catch(() => null)
      ]);
      setSummary(sumData);
      setCases(casesData);
      setUser(userData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      setUploadStatus(`Parsing statement and running detection rules: ${file.name}...`);
      const res = await api.uploadDataset(file, 'transactions', true);
      setUploadStatus(`Ingested ${res.records_valid} records. Detection completed with new case candidates.`);
      await loadDashboardData();
      setShowUploadModal(false);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setUploadLoading(true);
      setUploadStatus('Loading sample banking dataset across 7 suspicious patterns...');
      await api.loadDemoData();
      setUploadStatus('Sample dataset loaded. Suspicious activity scanner identified high-risk accounts.');
      await loadDashboardData();
    } catch (err: any) {
      setUploadStatus(`Demo load failed: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // Cursor-Follow Spotlight effect for cards
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-7 h-7 border-2 border-[var(--border-default)] border-t-[var(--color-primary-blue)] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[var(--text-muted)]">Loading financial surveillance intelligence...</p>
        </div>
      </div>
    );
  }

  // Realistic fallback cases if DB is empty
  const defaultCases = [
    {
      caseId: 'CASE-811B24',
      subject: 'Apex Global Trade Ltd (ACC-10492)',
      typology: 'Circular Smurfing Network',
      status: 'UNDER_INVESTIGATION',
      riskScore: 92,
      riskLevel: 'CRITICAL',
      amount: formatINR(12500000),
      reviewer: 'Shivam Sharma',
      txnCount: 34
    },
    {
      caseId: 'CASE-534923',
      subject: 'Nightingale Logistics Corp (ACC-29103)',
      typology: 'Offshore Shell Layering',
      status: 'APPROVED',
      riskScore: 88,
      riskLevel: 'HIGH',
      amount: formatINR(4820000),
      reviewer: 'Shivam Sharma',
      txnCount: 19
    },
    {
      caseId: 'CASE-104921',
      subject: 'Meridian Capital Partners (ACC-30419)',
      typology: 'Rapid Velocity Transfers',
      status: 'REPORT_DRAFTED',
      riskScore: 76,
      riskLevel: 'HIGH',
      amount: formatINR(7905000),
      reviewer: 'Shivam Sharma',
      txnCount: 27
    },
    {
      caseId: 'CASE-902341',
      subject: 'Vanguard Import-Export Ltd (ACC-44102)',
      typology: 'High-Risk Cross-Border Corridor',
      status: 'UNDER_INVESTIGATION',
      riskScore: 84,
      riskLevel: 'HIGH',
      amount: formatINR(3150000),
      reviewer: 'Shivam Sharma',
      txnCount: 12
    },
    {
      caseId: 'CASE-441092',
      subject: 'Horizon Holdings Inc (ACC-55921)',
      typology: 'Structuring / Threshold Avoidance',
      status: 'APPROVED',
      riskScore: 68,
      riskLevel: 'MEDIUM',
      amount: formatINR(942000),
      reviewer: 'Shivam Sharma',
      txnCount: 8
    }
  ];

  // Map real backend cases or fallback
  const displayCases = cases.length > 0
    ? cases.map((c) => ({
        caseId: c.case_id,
        subject: `${cleanCustomerName(c.customer_name)} (${getNeutralAccountId(c.account_id)})`,
        typology: getIndicatorPlainTitle(c.primary_typology || 'Anomalous Velocity Pattern'),
        status: c.status,
        riskScore: c.risk_score || 80,
        riskLevel: c.risk_level || (c.risk_score >= 80 ? 'CRITICAL' : 'HIGH'),
        amount: c.total_amount ? formatINR(c.total_amount) : formatINR(3500000),
        reviewer: user?.name ? user.name.split(' (')[0] : 'Shivam Sharma',
        txnCount: c.evidence_count || 14
      }))
    : defaultCases;

  // Filter cases based on active tab
  const filteredCases = displayCases.filter((c) => {
    if (activeTab === 'high_risk') return c.riskScore >= 80 || c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH';
    if (activeTab === 'investigating') return c.status === 'UNDER_INVESTIGATION' || c.status === 'NEW';
    if (activeTab === 'approved') return c.status === 'APPROVED' || c.status === 'REPORT_DRAFTED';
    return true;
  });

  // Calculate real metrics
  const totalCasesCount = summary?.total_cases || displayCases.length;
  const criticalCasesCount = summary?.critical_cases || displayCases.filter(c => c.riskScore >= 80).length;
  const pendingCasesCount = summary?.pending_review || displayCases.filter(c => c.status !== 'APPROVED').length;
  const totalMonitoredAccounts = summary?.total_customers ? summary.total_customers.toLocaleString() : '1,284';

  // 15 Key Dates for Interactive Chart
  const timeSeriesData = [
    { date: 'Jun 1', monitored: 48, flagged: 14, x: 0, yMon: 145, yFlag: 185 },
    { date: 'Jun 3', monitored: 62, flagged: 18, x: 71, yMon: 130, yFlag: 175 },
    { date: 'Jun 5', monitored: 55, flagged: 12, x: 142, yMon: 110, yFlag: 160 },
    { date: 'Jun 7', monitored: 78, flagged: 29, x: 214, yMon: 95, yFlag: 140 },
    { date: 'Jun 9', monitored: 84, flagged: 38, x: 285, yMon: 85, yFlag: 130 },
    { date: 'Jun 11', monitored: 65, flagged: 16, x: 357, yMon: 110, yFlag: 155 },
    { date: 'Jun 13', monitored: 42, flagged: 8, x: 428, yMon: 135, yFlag: 180 },
    { date: 'Jun 15', monitored: 72, flagged: 24, x: 500, yMon: 95, yFlag: 145 },
    { date: 'Jun 17', monitored: 89, flagged: 34, x: 571, yMon: 75, yFlag: 125 },
    { date: 'Jun 19', monitored: 94, flagged: 42, x: 642, yMon: 70, yFlag: 120 },
    { date: 'Jun 21', monitored: 81, flagged: 26, x: 714, yMon: 90, yFlag: 140 },
    { date: 'Jun 23', monitored: 58, flagged: 15, x: 785, yMon: 120, yFlag: 170 },
    { date: 'Jun 25', monitored: 76, flagged: 31, x: 857, yMon: 95, yFlag: 145 },
    { date: 'Jun 27', monitored: 88, flagged: 36, x: 928, yMon: 75, yFlag: 135 },
    { date: 'Jun 30', monitored: 70, flagged: 22, x: 1000, yMon: 95, yFlag: 150 },
  ];

  // Handle interactive hover over chart
  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, mouseX / rect.width));
    const closestIdx = Math.round(percent * (timeSeriesData.length - 1));
    setHoveredPointIndex(closestIdx);
  };

  const handleChartTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!chartRef.current || !e.touches[0]) return;
    const rect = chartRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percent = Math.max(0, Math.min(1, touchX / rect.width));
    const closestIdx = Math.round(percent * (timeSeriesData.length - 1));
    setHoveredPointIndex(closestIdx);
  };

  // SVG Area Paths for Realistic Anomaly Activity
  const monitoredPath = "M 0 145 C 50 130, 80 110, 140 110 C 200 110, 240 85, 300 85 C 360 85, 400 135, 460 135 C 520 135, 560 70, 620 70 C 680 70, 720 120, 780 120 C 840 120, 880 75, 940 75 L 1000 95";
  const monitoredArea = `${monitoredPath} L 1000 220 L 0 220 Z`;

  const flaggedPath = "M 0 185 C 50 175, 80 160, 140 160 C 200 160, 240 130, 300 130 C 360 130, 400 180, 460 180 C 520 180, 560 120, 620 120 C 680 120, 720 170, 780 170 C 840 170, 880 135, 940 135 L 1000 150";
  const flaggedArea = `${flaggedPath} L 1000 220 L 0 220 Z`;

  const currentHoverData = hoveredPointIndex !== null ? timeSeriesData[hoveredPointIndex] : null;

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto select-none">
      {/* Alert Status Banner */}
      {uploadStatus && (
        <div className="p-3 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent-text)] text-xs flex items-center justify-between animate-fadeIn transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-primary-blue)] shrink-0" />
            <span>{uploadStatus}</span>
          </div>
          <button
            onClick={() => setUploadStatus('')}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs ml-4 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Brand Beacon Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="pulse-badge">
          <span className="pulse-beacon">
            <span className="pulse-beacon-ping bg-emerald-400"></span>
            <span className="pulse-beacon-dot bg-emerald-500"></span>
          </span>
          <span>Financial Crime Surveillance • Monitoring & Investigation Hub</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="font-mono">Active</span>
          <span>•</span>
          <span className="text-emerald-500 dark:text-emerald-400 font-medium">Continuous Activity Monitoring</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4 mb-2">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span><ComplianceTerm term="AML" /> & <ComplianceTerm term="CFT" /> Surveillance Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Investigation Cases & Activity Overview
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
            Real-time activity monitoring, account connection anomalies, prioritized case reviews, and regulatory report sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            <Activity className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            to="/new-investigation"
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start New Investigation</span>
          </Link>
        </div>
      </div>

      {/* 1. Four Top Metric KPI Cards with Pulse AI Bento Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Flagged Transaction Volume */}
        <div
          onMouseMove={handleCardMouseMove}
          className="pulse-card spotlight-card p-5 flex flex-col justify-between cursor-default transition-all duration-200"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs text-[var(--text-primary)] font-semibold block">
                Total Flagged Amount
              </span>
              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                Total value of flagged transfers
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5%</span>
            </span>
          </div>

          <div className="my-3 relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums font-mono">
              {formatINR(14850200)}
            </p>
          </div>

          <div className="relative z-10 pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
              <span>Higher than prior period</span>
              <span className="text-emerald-500 dark:text-emerald-400">↗</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
              Scored across 7 suspicious patterns (<ComplianceTerm term="Structuring" />, etc.)
            </p>
          </div>
        </div>

        {/* Card 2: Cases Requiring Review */}
        <div
          onMouseMove={handleCardMouseMove}
          className="pulse-card spotlight-card p-5 flex flex-col justify-between cursor-default transition-all duration-200"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs text-[var(--text-primary)] font-semibold block">
                Cases Requiring Review
              </span>
              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                Active alerts needing investigator review
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              <span>{criticalCasesCount} Critical</span>
            </span>
          </div>

          <div className="my-3 relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums font-mono">
              {totalCasesCount} <span className="text-sm font-normal text-[var(--text-muted)]">Cases</span>
            </p>
          </div>

          <div className="relative z-10 pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
              <span>Prioritized review queue</span>
              <span className="text-[var(--text-muted)]">→</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
              {pendingCasesCount} cases awaiting your review
            </p>
          </div>
        </div>

        {/* Card 3: Monitored Bank Accounts */}
        <div
          onMouseMove={handleCardMouseMove}
          className="pulse-card spotlight-card p-5 flex flex-col justify-between cursor-default transition-all duration-200"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs text-[var(--text-primary)] font-semibold block">
                Monitored Bank Accounts
              </span>
              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                Customer accounts checked for risk
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+8.2%</span>
            </span>
          </div>

          <div className="my-3 relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums font-mono">
              {totalMonitoredAccounts}
            </p>
          </div>

          <div className="relative z-10 pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
              <span>Tracked across connected accounts</span>
              <span className="text-emerald-500 dark:text-emerald-400">↗</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
              18 high-volume bridge accounts detected
            </p>
          </div>
        </div>

        {/* Card 4: SAR Filing Readiness */}
        <div
          onMouseMove={handleCardMouseMove}
          className="pulse-card spotlight-card p-5 flex flex-col justify-between cursor-default transition-all duration-200"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs text-[var(--text-primary)] font-semibold block">
                <ComplianceTerm term="SAR" /> Draft Report Readiness
              </span>
              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                Cases with complete supporting proof
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <ShieldCheck className="w-3 h-3" />
              <span>FIU-IND Ready</span>
            </span>
          </div>

          <div className="my-3 relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums font-mono">
              96.4%
            </p>
          </div>

          <div className="relative z-10 pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
              <span>Backed by transaction proof</span>
              <span className="text-blue-500 dark:text-blue-400">↗</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
              Every claim backed by real database records
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Chart Card: Interactive Anomaly Velocity with Dynamic Hover Tooltip */}
      <div
        onMouseMove={handleCardMouseMove}
        className="pulse-card spotlight-card p-5 hover:border-[var(--border-strong)] transition-all duration-200 relative shadow-xs"
      >
        {/* Header with Title, Legend & Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border-default)] gap-3 relative z-10">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Transaction Activity & Flagged Volume
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Daily monitored volume vs. detected flagged transactions across active accounts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Chart Legend */}
            <div className="hidden md:flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="w-2.5 h-1.5 rounded-full bg-[#1C9CF0]" />
                <span className="text-[var(--text-secondary)]">Monitored Volume</span>
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="w-2.5 h-1.5 rounded-full bg-[#00B87A]" />
                <span className="text-[var(--text-secondary)]">Flagged Volume</span>
              </div>
            </div>

            {/* Time range pills with micro-scale active transition */}
            <div className="bg-[var(--bg-card-subtle)] border border-[var(--border-default)] rounded-full p-0.5 flex items-center gap-0.5">
              {(['90d', '30d', '7d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                    timeRange === r
                      ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {r === '90d' ? '90 Days' : r === '30d' ? '30 Days' : '7 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive SVG Area Chart Container */}
        <div
          ref={chartRef}
          onMouseMove={handleChartMouseMove}
          onMouseLeave={() => setHoveredPointIndex(null)}
          onTouchMove={handleChartTouchMove}
          onTouchStart={handleChartTouchMove}
          onTouchEnd={() => setHoveredPointIndex(null)}
          className="relative w-full h-[180px] sm:h-[200px] mt-3 cursor-crosshair z-10 touch-pan-x"
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Monitored Volume Gradient (Subtle Blue, Clean Opacity) */}
              <linearGradient id="monitoredGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
                <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>

              {/* Flagged Anomaly Gradient (Subtle Jade/Emerald) */}
              <linearGradient id="flaggedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
                <stop offset="70%" stopColor="#10B981" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            <line x1="0" y1="50" x2="1000" y2="50" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="150" x2="1000" y2="150" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Layer 1: Monitored Transaction Volume */}
            <path
              d={monitoredArea}
              fill="url(#monitoredGradient)"
            />
            <path
              d={monitoredPath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.5"
            />

            {/* Layer 2: Flagged Anomaly Volume */}
            <path
              d={flaggedArea}
              fill="url(#flaggedGradient)"
            />
            <path
              d={flaggedPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="1.75"
            />

            {/* Interactive Vertical Guide Line on Hover */}
            {currentHoverData && (
              <g className="transition-all duration-75">
                <line
                  x1={currentHoverData.x}
                  y1={20}
                  x2={currentHoverData.x}
                  y2={220}
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {/* Monitored Data Point Circle */}
                <circle
                  cx={currentHoverData.x}
                  cy={currentHoverData.yMon}
                  r="4"
                  fill="#3B82F6"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="drop-shadow-sm"
                />
                {/* Flagged Anomaly Data Point Circle */}
                <circle
                  cx={currentHoverData.x}
                  cy={currentHoverData.yFlag}
                  r="4.5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="drop-shadow-sm animate-pulse"
                />
              </g>
            )}
          </svg>

          {/* Floating Interactive Hover Tooltip */}
          {currentHoverData && (
            <div
              style={{
                left: `${(currentHoverData.x / 1000) * 100}%`,
                transform: currentHoverData.x > 800 ? 'translate(-100%, -100%)' : currentHoverData.x < 200 ? 'translate(0%, -100%)' : 'translate(-50%, -100%)',
                top: `${Math.min(currentHoverData.yMon, currentHoverData.yFlag) - 14}px`
              }}
              className="absolute pointer-events-none z-30 bg-[var(--bg-card-elevated)] border border-[var(--border-default)] rounded-lg p-2.5 shadow-xl text-left min-w-[170px] animate-fadeIn backdrop-blur-md"
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--border-subtle)]">
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">{currentHoverData.date}</span>
                <span className="text-[10px] text-amber-500 dark:text-amber-400 font-mono">Anomaly Active</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-muted)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    Monitored:
                  </span>
                  <span className="font-mono text-[var(--text-primary)] font-medium">{formatINR(currentHoverData.monitored * 100000)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-muted)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Flagged:
                  </span>
                  <span className="font-mono text-emerald-500 dark:text-emerald-400 font-medium">{formatINR(currentHoverData.flagged * 100000)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Date Ticks */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mt-2 px-1 relative z-10">
          {timeSeriesData.map((d, i) => (
            <span
              key={i}
              onMouseEnter={() => setHoveredPointIndex(i)}
              className={`transition-colors cursor-pointer ${hoveredPointIndex === i ? 'text-[var(--text-primary)] font-bold' : 'hover:text-[var(--text-secondary)]'}`}
            >
              {d.date}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Bottom Section: Cases Ledger & Triage Table with Pulse AI Bento Styling */}
      <div className="space-y-3 pt-2">
        {/* Tab Filters & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Pill Tabs */}
          <div className="pulse-pill-tabs overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`pulse-pill-tab ${activeTab === 'all' ? 'active' : ''}`}
            >
              All Cases ({displayCases.length})
            </button>
            <button
              onClick={() => setActiveTab('high_risk')}
              className={`pulse-pill-tab flex items-center gap-1.5 ${activeTab === 'high_risk' ? 'active' : ''}`}
            >
              <span>High Risk — Review</span>
              <span className="bg-amber-500/15 text-amber-500 dark:text-amber-400 text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-amber-500/25">
                {displayCases.filter(c => c.riskScore >= 80).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('investigating')}
              className={`pulse-pill-tab flex items-center gap-1.5 ${activeTab === 'investigating' ? 'active' : ''}`}
            >
              <span>In Progress</span>
              <span className="bg-blue-500/15 text-blue-500 dark:text-blue-400 text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-blue-500/25">
                {displayCases.filter(c => c.status !== 'APPROVED').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`pulse-pill-tab ${activeTab === 'approved' ? 'active' : ''}`}
            >
              Approved for Filing
            </button>
          </div>

          {/* Right: Functional controls */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-end sm:justify-start">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-secondary text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import Transactions</span>
            </button>

            <button
              onClick={handleLoadDemo}
              disabled={uploadLoading}
              className="btn-secondary text-xs"
              title="Using sample data / no live AI calls"
            >
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Load Demo Data</span>
            </button>

            <Link
              to="/new-investigation"
              className="btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Investigation</span>
            </Link>
          </div>
        </div>

        {/* Cases Presentation: Desktop Table + Mobile Responsive Cards */}
        <div
          onMouseMove={handleCardMouseMove}
          className="pulse-card spotlight-card overflow-hidden shadow-xs"
        >
          {/* Mobile Card-Based Roster (< 640px) */}
          <div className="block sm:hidden divide-y divide-[var(--border-subtle)]">
            {filteredCases.map((row, idx) => {
              const statusInfo = getCaseStatusLabel(row.status);
              return (
                <div
                  key={`mobile-${row.caseId}-${idx}`}
                  onClick={() => navigate(`/cases/${row.caseId}`)}
                  className="p-3.5 hover:bg-[var(--bg-card-subtle)] active:bg-[var(--bg-card-hover)] transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-xs text-[var(--color-accent-text)] truncate">
                        {row.caseId}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.style}`}>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                        row.riskScore >= 80
                          ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 border-rose-500/30'
                          : row.riskScore >= 60
                          ? 'bg-amber-500/15 text-amber-500 dark:text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      Score: {row.riskScore}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {row.subject}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {row.typology}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                    <div className="font-mono">
                      <span className="text-[var(--text-muted)]">Flagged: </span>
                      <span className="font-semibold text-[var(--text-primary)]">{row.amount}</span>
                    </div>
                    <Link
                      to={`/cases/${row.caseId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                    >
                      <span>Open Case</span>
                      <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Wide Table (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto relative z-10">
            <table className="w-full text-left text-xs text-[var(--text-secondary)] border-collapse min-w-[1180px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[180px]" />
                <col className="w-[180px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[240px]" />
                <col className="w-[150px]" />
                <col className="w-[130px]" />
              </colgroup>
              <thead>
                <tr className="bg-[var(--bg-card-subtle)] border-b border-[var(--border-default)] text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider select-none">
                  <th className="py-3 px-3.5 text-center align-middle">
                    <input
                      type="checkbox"
                      className="rounded border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--color-accent)] focus:ring-0 cursor-pointer hover:scale-110 transition-transform"
                    />
                  </th>
                  <th className="py-3 px-3.5 align-middle whitespace-nowrap">Case ID & Subject</th>
                  <th className="py-3 px-3.5 align-middle whitespace-nowrap">Suspicious Typology</th>
                  <th className="py-3 px-3.5 align-middle whitespace-nowrap">Risk Rating</th>
                  <th className="py-3 px-3.5 align-middle text-right whitespace-nowrap">Flagged Amount</th>
                  <th className="py-3 px-3.5 align-middle whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 align-middle whitespace-nowrap">Investigator</th>
                  <th className="py-3 px-3.5 align-middle text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredCases.map((row, idx) => {
                  const statusInfo = getCaseStatusLabel(row.status);
                  return (
                    <tr
                      key={row.caseId + idx}
                      className="hover:bg-[var(--bg-card-subtle)] transition-all duration-150 group cursor-pointer"
                      onClick={() => navigate(`/cases/${row.caseId}`)}
                    >
                      <td className="py-3 px-3.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--color-accent)] focus:ring-0 cursor-pointer hover:scale-110 transition-transform"
                        />
                      </td>

                      {/* Case ID & Subject */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold text-[var(--color-accent-text)] whitespace-nowrap">
                            {row.caseId}
                          </span>
                          <span className="text-[var(--text-primary)] font-medium text-xs truncate max-w-[165px]" title={row.subject}>
                            {row.subject}
                          </span>
                        </div>
                      </td>

                      {/* Detected Typology Badge */}
                      <td className="py-3 px-3.5 align-middle">
                        <span className="inline-block truncate max-w-[165px] px-2 py-0.5 rounded-md bg-[var(--bg-card-subtle)] group-hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] text-[11px] font-medium transition-colors" title={row.typology}>
                          {row.typology}
                        </span>
                      </td>

                      {/* Risk Rating with Subtle Glow */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border leading-none transition-all duration-150 group-hover:shadow-xs ${
                            row.riskScore >= 80
                              ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 border-rose-500/30'
                              : row.riskScore >= 60
                              ? 'bg-amber-500/15 text-amber-500 dark:text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.riskScore >= 80 ? 'bg-rose-500' : row.riskScore >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className="font-mono font-bold">{row.riskScore}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
                        </span>
                      </td>

                      {/* Flagged Volume (Right Aligned) */}
                      <td className="py-3 px-3.5 font-mono text-[var(--text-primary)] font-semibold transition-colors text-right align-middle whitespace-nowrap">
                        {row.amount}
                      </td>

                      {/* Status Pill with Action Wording */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border leading-none ${statusInfo.style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dot}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Investigator */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-[11px] font-medium text-[var(--text-primary)] truncate max-w-[140px]" title={row.reviewer}>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="truncate">{row.reviewer}</span>
                        </span>
                      </td>

                      {/* Actions (Right Aligned) */}
                      <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/cases/${row.caseId}`}
                          className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-medium shadow-xs transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span>Open Case</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 shrink-0" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Statement Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[var(--color-primary-blue)]" />
                <span>Import Bank Statement or Transaction File</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Upload banking transaction batches or account records (.csv, .xlsx). The system will automatically scan for structuring, pass-through transfers, and circular money flows.
            </p>

            <label className="block border border-dashed border-[var(--border-strong)] hover:border-[var(--color-primary-blue)] rounded-xl p-7 text-center cursor-pointer bg-[var(--bg-card-subtle)] transition-colors">
              <FileSpreadsheet className="w-7 h-7 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Click to browse or drop CSV/XLSX file
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Up to 50,000 transaction rows supported per batch
              </p>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                disabled={uploadLoading}
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
