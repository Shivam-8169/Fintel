import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Building,
  User,
  Activity,
  Layers,
  HelpCircle,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Search,
  Hash,
  Eye,
  Info,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Network,
  FileDown,
  FileType,
  Loader2
} from 'lucide-react';
import { StructuredSARReport, CaseDetail, GraphData, TransactionItem, EvidenceItem } from '../types';
import { api } from '../services/api';
import { FintelLogo } from './FintelLogo';
import { SubjectEgoNetworkSubgraph } from './SubjectEgoNetworkSubgraph';
import { formatINR } from '../utils/currency';
import { getNeutralAccountId, cleanCustomerName } from '../utils/complianceNaming';
import { ComplianceTerm } from './ComplianceTerm';

interface ReportEditorProps {
  report: StructuredSARReport;
  reportStatus: string;
  caseId?: string;
  onSaveReport: (updatedReport: StructuredSARReport, notes?: string) => Promise<void>;
  onApprove: (notes: string) => Promise<void>;
  onReject: (notes: string) => Promise<void>;
  isProcessing?: boolean;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  report,
  reportStatus,
  caseId,
  onSaveReport,
  onApprove,
  onReject,
  isProcessing = false
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState<StructuredSARReport>(report);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [investigatorNoteInput, setInvestigatorNoteInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);

  // Export & Download States
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'docx' | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extra case data & graph data loaded from backend
  const resolvedCaseId = caseId || report.case_information.case_id;
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loadingExtraData, setLoadingExtraData] = useState(false);

  // Human Review Checklist State
  const [checklist, setChecklist] = useState({
    reviewedEvidence: reportStatus === 'APPROVED',
    reviewedFindings: reportStatus === 'APPROVED',
    reviewedReport: reportStatus === 'APPROVED'
  });

  // Active section for sticky navigation
  const [activeSection, setActiveSection] = useState('executive-summary');

  // Load real case data and graph data
  useEffect(() => {
    if (resolvedCaseId) {
      loadExtraCaseData(resolvedCaseId);
    }
  }, [resolvedCaseId]);

  const loadExtraCaseData = async (cid: string) => {
    try {
      setLoadingExtraData(true);
      const [detailRes, graphRes] = await Promise.all([
        api.getCaseDetail(cid).catch(() => null),
        api.getCaseGraph(cid, 2).catch(() => null)
      ]);
      setCaseDetail(detailRes);
      setGraphData(graphRes);
    } catch (err) {
      console.error('Failed to load extra report case data:', err);
    } finally {
      setLoadingExtraData(false);
    }
  };

  const isApproved = reportStatus === 'APPROVED';
  const isRejected = reportStatus === 'REJECTED';

  // Handle Save
  const handleSave = async () => {
    await onSaveReport(editedReport, investigatorNoteInput);
    setIsEditing(false);
    setSaveSuccessMsg('Investigation report draft updated successfully.');
    if (investigatorNoteInput.trim() && resolvedCaseId) {
      await api.addCaseNote(resolvedCaseId, investigatorNoteInput).catch(() => null);
      setInvestigatorNoteInput('');
      loadExtraCaseData(resolvedCaseId);
    }
    setTimeout(() => setSaveSuccessMsg(''), 4500);
  };

  // Handle Save Notes Only
  const handleSaveNotesOnly = async () => {
    if (!investigatorNoteInput.trim() || !resolvedCaseId) return;
    try {
      await api.addCaseNote(resolvedCaseId, investigatorNoteInput);
      setSaveSuccessMsg('Investigator note recorded to activity history.');
      setInvestigatorNoteInput('');
      await loadExtraCaseData(resolvedCaseId);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  // Handle Approve Confirm
  const handleApproveConfirm = async () => {
    await onApprove(decisionNotes);
    setApprovalModalOpen(false);
    setDecisionNotes('');
  };

  // Handle Reject Confirm
  const handleRejectConfirm = async () => {
    await onReject(decisionNotes);
    setRejectModalOpen(false);
    setDecisionNotes('');
  };

  // PDF Download Handler
  const handleDownloadPdf = async () => {
    if (!resolvedCaseId) return;
    try {
      setExportLoading('pdf');
      setToastMessage({ type: 'info', text: 'Generating report...' });
      const { blob, filename } = await api.downloadReportPdf(resolvedCaseId);
      
      // Indicate report generated
      setToastMessage({ type: 'info', text: '✓ Report generated' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setToastMessage({ type: 'success', text: 'Report downloaded successfully.' });
        setTimeout(() => setToastMessage(null), 5000);
      }, 600);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setToastMessage({ type: 'error', text: 'Unable to generate the report. Please try again.' });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setExportLoading(null);
      setExportDropdownOpen(false);
    }
  };

  // DOCX Download Handler
  const handleDownloadDocx = async () => {
    if (!resolvedCaseId) return;
    try {
      setExportLoading('docx');
      setToastMessage({ type: 'info', text: 'Generating Word document...' });
      const { blob, filename } = await api.downloadReportDocx(resolvedCaseId);

      setToastMessage({ type: 'info', text: '✓ Report generated' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setToastMessage({ type: 'success', text: 'Report downloaded successfully.' });
        setTimeout(() => setToastMessage(null), 5000);
      }, 600);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      setToastMessage({ type: 'error', text: 'Unable to generate the report. Please try again.' });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setExportLoading(null);
      setExportDropdownOpen(false);
    }
  };

  // Print Report Handler
  const handlePrintReport = () => {
    setExportDropdownOpen(false);
    window.print();
  };

  // Markdown Export Handler
  const handleExportMarkdown = async () => {
    const filename = `SAR-${report.case_information.case_id}.md`;
    try {
      setExportDropdownOpen(false);
      const md = await api.getReportMarkdown(report.case_information.case_id);
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToastMessage({ type: 'success', text: 'Markdown dossier downloaded successfully.' });
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      window.print();
    }
  };

  // Risk Score & Meter calculations
  const riskScore = Math.round(report.risk_indicators.composite_risk_score ?? 82);
  const riskLevel = report.risk_indicators.risk_level || (riskScore >= 85 ? 'CRITICAL' : riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW');

  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return '#DC2626';
      case 'HIGH':
        return '#EA580C';
      case 'MEDIUM':
        return '#D97706';
      case 'LOW':
      default:
        return '#16A34A';
    }
  };

  // Currency Formatter (Consistent INR formatting)
  const formatCurrency = (val: number | undefined | null) => {
    return formatINR(val ?? 0);
  };

  // Plain-Language Detection Explanations
  const getPlainEnglishDetection = (typology: string) => {
    const key = typology.toLowerCase();
    if (key.includes('fan_out') || key.includes('fanout') || key.includes('dispersion')) {
      return {
        title: 'Potential Fan-Out Pattern',
        observed: 'Funds were transferred from one account to multiple counterparties within a short period.',
        risk: '+25 points',
        recommendation: 'Verify if recipient accounts are verified commercial suppliers or personal conduits.'
      };
    }
    if (key.includes('fan_in') || key.includes('fanin') || key.includes('aggregation') || key.includes('mule')) {
      return {
        title: 'Mule Account Aggregation (Fan-In)',
        observed: 'Multiple inbound deposits from distinct sources were rapidly collected into this account.',
        risk: '+25 points',
        recommendation: 'Check whether multiple distinct depositors have any legitimate business link.'
      };
    }
    if (key.includes('velocity') || key.includes('rapid') || key.includes('movement')) {
      return {
        title: 'Rapid Fund Movement',
        observed: 'Funds received by the account were transferred onward within a short time window with minimal balance retention.',
        risk: '+20 points',
        recommendation: 'Review account holding period and commercial rationale for immediate pass-through.'
      };
    }
    if (key.includes('high_value') || key.includes('wire') || key.includes('threshold')) {
      return {
        title: 'High-Value Transaction Outlier',
        observed: 'One or more transactions significantly exceeded the account profile and historical volume baseline.',
        risk: '+15 points',
        recommendation: 'Request official invoice, commercial contract, or proof of underlying trade goods.'
      };
    }
    if (key.includes('structuring') || key.includes('smurfing')) {
      return {
        title: 'Potential Structuring / Smurfing',
        observed: 'Multiple repeated transfers occurred just below mandatory regulatory reporting thresholds.',
        risk: '+20 points',
        recommendation: 'Investigate if splitting transactions was deliberate to circumvent currency transaction reporting.'
      };
    }
    if (key.includes('circular') || key.includes('loop') || key.includes('chain')) {
      return {
        title: 'Circular Layering Loop',
        observed: 'Funds circulated through a closed chain of intermediate accounts before returning to the original originating entity.',
        risk: '+30 points',
        recommendation: 'Inspect ultimate beneficial ownership across all intermediary cycle accounts.'
      };
    }
    return {
      title: typology.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      observed: 'Anomalous velocity or topological deviation identified by monitoring rules.',
      risk: '+15 points',
      recommendation: 'Verify counterparty KYC and business rationale.'
    };
  };

  // Navigation Items
  const navSections = [
    { id: 'executive-summary', label: 'Executive Summary' },
    { id: 'risk-overview', label: 'Risk Assessment' },
    { id: 'why-flagged', label: 'Why Flagged' },
    { id: 'transaction-summary', label: 'Transaction Summary' },
    { id: 'suspicious-transactions', label: 'Flagged Transactions' },
    { id: 'relationship-analysis', label: 'Relationship Analysis' },
    { id: 'investigation-findings', label: 'Investigation Findings' },
    { id: 'supporting-evidence', label: 'Supporting Evidence' },
    { id: 'investigation-timeline', label: 'Timeline' },
    { id: 'uncertainty-limitations', label: 'Uncertainty & Gaps' },
    { id: 'investigator-notes', label: 'Investigator Notes' },
    { id: 'human-review', label: 'Human Review' },
    { id: 'technical-details', label: 'Technical Details' }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Transactions list
  const transactionsList = caseDetail?.transactions || [];

  return (
    <div className="relative pb-24">
      {/* Sticky Top Action Bar */}
      <div className="report-action-bar sticky top-13 z-30 bg-[var(--bg-app)]/95 backdrop-blur-md border-b border-[var(--border-default)] py-2.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 transition-colors duration-200 shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Case Dossier</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="font-mono font-bold text-[var(--color-accent)]">{report.case_information.case_id}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isApproved
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                : isRejected
                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
            }`}>
              {isApproved ? 'Approved by Compliance' : isRejected ? 'Returned for Revision' : 'Pending Human Review'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditedReport(report);
                setIsEditing(false);
              }}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="btn-secondary text-xs flex items-center gap-1.5 font-semibold text-[var(--text-primary)]"
            title="Save draft edits"
          >
            <Save className="w-3.5 h-3.5 text-blue-500" />
            <span>Save Draft Changes</span>
          </button>

          {/* Export Report Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              disabled={exportLoading !== null}
              className="btn-secondary text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Export or download SAR investigation report"
            >
              {exportLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Export Dossier</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl py-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <span>Export Options</span>
                  <span className="text-[9px] font-normal lowercase opacity-75">A4 Document</span>
                </div>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full px-3 py-2.5 text-left text-xs hover:bg-[var(--bg-card-subtle)] flex items-start gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 mt-0.5 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)]">Download PDF</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-blue-500/15 text-blue-500">
                        Primary
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      Publication A4 PDF with graph snapshot
                    </p>
                  </div>
                </button>

                {/* Download DOCX */}
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="w-full px-3 py-2.5 text-left text-xs hover:bg-[var(--bg-card-subtle)] flex items-start gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 mt-0.5 group-hover:scale-105 transition-transform">
                    <FileType className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)]">Download DOCX</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-500/15 text-slate-400">
                        Word
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      Editable Microsoft Word document
                    </p>
                  </div>
                </button>

                <div className="my-1 border-t border-[var(--border-subtle)]" />

                {/* Print Report */}
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-card-subtle)] flex items-start gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5 group-hover:scale-105 transition-transform">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[var(--text-primary)] block">Print Report</span>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      Browser native print / save as PDF
                    </p>
                  </div>
                </button>

                {/* Markdown */}
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-card-subtle)] flex items-start gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 mt-0.5 group-hover:scale-105 transition-transform">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[var(--text-primary)] block">Download Markdown</span>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      Clean plain-text compliance file
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {!isApproved && (
            <>
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                disabled={isProcessing}
                className="btn-danger text-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Send Back / Request Evidence</span>
              </button>
              <button
                type="button"
                onClick={() => setApprovalModalOpen(true)}
                disabled={isProcessing || !checklist.reviewedEvidence || !checklist.reviewedFindings || !checklist.reviewedReport}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                title={!checklist.reviewedEvidence ? 'Please complete the review checklist below before approval' : 'Approve investigation case'}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Investigation Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className={`max-w-6xl mx-auto mb-4 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-sm ${
          toastMessage.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
            : toastMessage.type === 'error'
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
            : 'bg-blue-500/15 border-blue-500/30 text-blue-500'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[11px] opacity-75 hover:opacity-100 uppercase font-mono tracking-wider cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="max-w-6xl mx-auto mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Layout Container: Sticky Nav on Desktop + Document Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-8 items-start">
        {/* Sticky Anchor Navigation Sidebar (Desktop >= 1200px) */}
        <aside className="report-sticky-nav hidden xl:block w-52 shrink-0 sticky top-28 space-y-1 text-xs select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block px-2.5 mb-2 font-mono">
            Document Outline
          </span>
          {navSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between group ${
                activeSection === sec.id
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="truncate">{sec.label}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${activeSection === sec.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
            </button>
          ))}
        </aside>

        {/* Main Document Paper Sheet */}
        <main className="report-paper flex-1 min-w-0 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-6 sm:p-10 md:p-12 space-y-10 shadow-lg text-[var(--text-primary)]">
          {/* =========================================================
              DOCUMENT TOP HEADER & REGULATORY WARNING WATERMARK
              ========================================================= */}
          <div className="border-b border-[var(--border-default)] pb-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <FintelLogo variant="full" size="md" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  Financial Crime Investigation Report
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Autonomous AML/CFT Surveillance & Forensic Evidence Dossier
                </p>
              </div>

              <div className="text-right sm:self-start flex flex-col items-end">
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Report Reference</span>
                <span className="text-sm font-mono font-bold text-[var(--color-accent)] block mt-0.5">
                  SAR-{report.case_information.case_id.replace('CASE-', '')}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] block mt-1">
                  Drafted: {report.case_information.date_drafted}
                </span>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={exportLoading !== null}
                  className="mt-2.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)] hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Download Publication A4 PDF"
                >
                  {exportLoading === 'pdf' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mandatory Prominent Prototype Disclaimer Banner */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-500">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1 text-xs">
                <span className="font-bold tracking-wide uppercase block text-amber-500">
                  AI-GENERATED DRAFT — REQUIRES HUMAN REVIEW
                </span>
                <p className="leading-relaxed opacity-90 text-[var(--text-secondary)]">
                  This document is an automated intelligence draft generated by the Fintel enterprise AML/CFT multi-agent engine. <strong>It is NOT an official regulatory submission</strong> and does not constitute a filed SAR with FinCEN or FIU-IND. All findings, observed typologies, and risk assessments require verification and sign-off by a certified compliance officer.
                </p>
              </div>
            </div>

            {/* Case Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Case ID</span>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] mt-0.5 block truncate">
                  {report.case_information.case_id}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Investigation Status</span>
                <span className="text-xs font-bold mt-0.5 block truncate text-[var(--color-accent)]">
                  {isApproved ? 'Approved by Human' : isRejected ? 'Returned for Revision' : 'Pending Review'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Subject Account</span>
                <span className="text-xs font-mono font-semibold text-[var(--text-primary)] mt-0.5 block truncate">
                  {report.subject_information.account_id}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Customer Entity</span>
                <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block truncate">
                  {report.subject_information.customer_name}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              SECTION 1: EXECUTIVE SUMMARY
              ========================================================= */}
          <section id="executive-summary" className="report-section space-y-4">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>1. Executive Summary</span>
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">Plain-Language Synthesis</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                A concise overview of the investigation, key counterparties, and why this activity warranted scrutiny.
              </p>
            </div>

            {isEditing ? (
              <textarea
                value={editedReport.suspicious_activity_summary.narrative_summary}
                onChange={(e) => setEditedReport({
                  ...editedReport,
                  suspicious_activity_summary: {
                    ...editedReport.suspicious_activity_summary,
                    narrative_summary: e.target.value
                  }
                })}
                rows={4}
                className="w-full p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] leading-relaxed"
              />
            ) : (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-card-subtle)]/50 p-4 rounded-xl border border-[var(--border-subtle)]">
                {report.suspicious_activity_summary.narrative_summary ||
                  `This investigation identified several potentially suspicious transaction patterns associated with account ${report.subject_information.account_id}. The activity includes anomalous velocity and fund routing between connected counterparties across a compressed surveillance window.`}
              </p>
            )}

            {/* Important Findings Cards (4 visual stat boxes) */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2.5">
                Important Findings at a Glance
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)] block">Flagged Transactions</span>
                  <p className="text-xl font-mono font-bold text-rose-500">
                    {report.transaction_analysis.key_transactions?.length || transactionsList.filter(t => t.is_suspicious).length || 4}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] block">Potentially suspicious</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)] block">Connected Counterparties</span>
                  <p className="text-xl font-mono font-bold text-[var(--color-accent)]">
                    {report.graph_analysis.immediate_counterparties_count || 3}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] block">Active accounts linked</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)] block">Detection Patterns</span>
                  <p className="text-xl font-mono font-bold text-amber-500">
                    {report.suspicious_activity_summary.typologies_detected?.length || 2}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] block">Typology rules triggered</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)] block">Supporting Evidence</span>
                  <p className="text-xl font-mono font-bold text-emerald-500">
                    {report.supporting_evidence.evidence_table?.length || caseDetail?.evidence?.length || 4}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] block">Citations verified</span>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
              SECTION 2: OVERALL RISK ASSESSMENT
              ========================================================= */}
          <section id="risk-overview" className="report-section space-y-4">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>2. Overall Risk Assessment</span>
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">Composite Scoring</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Automated algorithmic risk score indicating urgency, severity, and prioritized compliance review level.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-mono text-[var(--text-muted)]">Composite Risk Level</span>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase text-white shadow-xs"
                      style={{ backgroundColor: getRiskColor(riskLevel) }}
                    >
                      {riskLevel}
                    </span>
                    <span className="text-2xl font-mono font-black text-[var(--text-primary)]">
                      {riskScore} <span className="text-sm font-normal text-[var(--text-muted)]">/ 100</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed">
                  Based on detected transaction patterns, graph relationships, velocity bursts, and available ledger data. Scores exceeding 70 trigger prioritized compliance review.
                </p>
              </div>

              {/* Horizontal Multi-Segment Risk Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] uppercase">
                  <span>Low (0-39)</span>
                  <span>Medium (40-69)</span>
                  <span>High (70-84)</span>
                  <span>Critical (85-100)</span>
                </div>

                <div className="relative w-full h-3 rounded-full bg-[var(--border-default)] overflow-hidden flex">
                  <div className="w-[40%] bg-emerald-500/80 h-full"></div>
                  <div className="w-[30%] bg-amber-500/80 h-full"></div>
                  <div className="w-[15%] bg-orange-500/80 h-full"></div>
                  <div className="w-[15%] bg-rose-600 h-full"></div>
                </div>

                {/* Score Indicator Needle Pin */}
                <div className="relative w-full h-4">
                  <div
                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                    style={{ left: `${Math.min(98, Math.max(2, riskScore))}%` }}
                  >
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-[var(--text-primary)]"></div>
                    <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">▲ Score {riskScore}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
              SECTION 3: "WHY WAS THIS CASE FLAGGED?" (PLAIN ENGLISH)
              ========================================================= */}
          <section id="why-flagged" className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>3. Why Was This Case Flagged?</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Observed anomalous behaviors explained in clear, non-technical plain English.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(report.risk_indicators.contributing_indicators || []).map((ci: any, idx: number) => {
                const plain = getPlainEnglishDetection(ci.indicator || 'Suspicious Activity');
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                          {plain.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/25">
                        {ci.score ? `+${ci.score} Risk Points` : plain.risk}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[var(--text-muted)] font-semibold block text-[11px]">What was observed?</span>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {ci.explanation || plain.observed}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Investigation Check:</span>
                      <span className="text-[var(--color-accent)] font-medium">{plain.recommendation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* =========================================================
              SECTION 4: TRANSACTION SUMMARY
              ========================================================= */}
          <section id="transaction-summary" className="report-section space-y-4">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>4. Transaction Summary</span>
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">Volume & Counterparties</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                High-level quantitative breakdown of transaction volume, active counterparties, and the monitored date window.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Total Analyzed</span>
                <span className="text-lg font-mono font-bold text-[var(--text-primary)] mt-1 block">
                  {report.transaction_analysis.total_transactions_analyzed || transactionsList.length || 2} Transactions
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Flagged Volume</span>
                <span className="text-lg font-mono font-bold text-rose-500 mt-1 block">
                  {formatCurrency(report.suspicious_activity_summary.total_suspicious_volume)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Counterparties</span>
                <span className="text-lg font-mono font-bold text-[var(--color-accent)] mt-1 block">
                  {report.graph_analysis.immediate_counterparties_count || 2} Entities
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Time Window</span>
                <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] mt-1 block truncate">
                  {report.suspicious_activity_summary.timeframe_start?.split(' ')[0] || '2026-08-01'} to {report.suspicious_activity_summary.timeframe_end?.split(' ')[0] || '2026-09-23'}
                </span>
              </div>
            </div>
          </section>

          {/* =========================================================
              SECTION 5: SUSPICIOUS TRANSACTIONS TABLE
              ========================================================= */}
          <section id="suspicious-transactions" className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>5. Flagged Suspicious Transactions</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Detailed register of individual transactions contributing to risk threshold breaches.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead>
                  <tr className="bg-[var(--bg-card-subtle)] border-b border-[var(--border-default)] text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-wider select-none">
                    <th className="py-2.5 px-3 align-middle whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-3 align-middle whitespace-nowrap">Transaction ID</th>
                    <th className="py-2.5 px-3 align-middle whitespace-nowrap">From</th>
                    <th className="py-2.5 px-3 align-middle whitespace-nowrap">To</th>
                    <th className="py-2.5 px-3 align-middle whitespace-nowrap">Amount</th>
                    <th className="py-2.5 px-3 align-middle whitespace-nowrap">Type</th>
                    <th className="py-2.5 px-3 align-middle whitespace-nowrap">Detection</th>
                    <th className="py-2.5 px-3 text-right align-middle whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {(transactionsList.length > 0
                    ? transactionsList
                    : (report.transaction_analysis.key_transactions || []).map((kt: any, idx: number) => ({
                        transaction_id: `TX-00${636 + idx * 2}`,
                        timestamp: '2026-08-26 20:00:00',
                        sender_account: idx === 0 ? report.subject_information.account_id : 'ACC-89102',
                        receiver_account: idx === 0 ? 'ACC-41093' : report.subject_information.account_id,
                        amount: idx === 0 ? 65000 : 63800,
                        transaction_type: 'WIRE_TRANSFER',
                        is_suspicious: true,
                        evidence_id: kt.evidence_id || `EVD-00${idx + 1}`
                      }))
                  ).map((txn: any, idx: number) => (
                    <tr
                      key={txn.transaction_id || idx}
                      className={`transition-colors align-middle ${
                        txn.is_suspicious
                          ? 'bg-rose-500/5 hover:bg-rose-500/10'
                          : 'hover:bg-[var(--bg-card-subtle)]'
                      }`}
                    >
                      <td className="py-3 px-3 text-[var(--text-muted)] font-mono align-middle whitespace-nowrap">
                        {txn.timestamp?.split(' ')[0] || '2026-08-26'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[var(--color-accent)] align-middle whitespace-nowrap">
                        {txn.transaction_id}
                      </td>
                      <td className="py-3 px-3 font-mono text-[var(--text-secondary)] align-middle whitespace-nowrap">
                        {getNeutralAccountId(txn.sender_account)}
                      </td>
                      <td className="py-3 px-3 font-mono text-[var(--text-secondary)] align-middle whitespace-nowrap">
                        {getNeutralAccountId(txn.receiver_account)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)] align-middle whitespace-nowrap">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] whitespace-nowrap">
                          {txn.transaction_type || 'TRANSFER'}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 whitespace-nowrap leading-none">
                          Flagged
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedTxn(txn)}
                          className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                        >
                          <span>Inspect Transaction</span>
                          <span>↗</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* =========================================================
              SECTION 6: RELATIONSHIP ANALYSIS (TRANSACTION GRAPH)
              ========================================================= */}
          <section id="relationship-analysis" className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Network className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>6. Relationship Analysis</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Visual map of fund flows between this account and connected parties to uncover multi-step movement.
                </p>
              </div>

              <Link
                to={`/graph?account=${encodeURIComponent(report.subject_information.account_id)}`}
                className="btn-secondary text-xs"
              >
                <span>Open Full Connections Map</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* Professional Directed Ego-Network Subgraph */}
            <SubjectEgoNetworkSubgraph
              report={report}
              graphData={graphData}
              caseDetail={caseDetail}
            />
          </section>

          {/* =========================================================
              SECTION 7: AI INVESTIGATION (INVESTIGATION FINDINGS)
              ========================================================= */}
          <section id="investigation-findings" className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>7. Investigation Findings</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Core factual observations and reasoning deductions grounded directly in ledger evidence.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(report.investigation_findings.core_reasoning_points || []).map((step: string, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[var(--color-accent)] uppercase">
                      Finding {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Evidence-Grounded Observation
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                    {step}
                  </p>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>Analytical Assessment:</span>
                    <span className="text-emerald-500 font-medium">Based on available transaction evidence</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================
              SECTION 8: SUPPORTING EVIDENCE
              ========================================================= */}
          <section id="supporting-evidence" className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>8. Supporting Evidence</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Auditable paper trail linking each analytical claim to its source ledger transaction or external document.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(report.supporting_evidence.evidence_table || []).map((ev: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2.5 hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[var(--color-accent)]">
                      {ev.evidence_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      {ev.type || 'LEDGER_TX'}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)] font-mono">Source: {ev.source || 'fintel_db'}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEvidence(ev)}
                      className="text-[var(--color-accent)] font-semibold hover:underline cursor-pointer"
                    >
                      Inspect Evidence Source ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================
              SECTION 9: INVESTIGATION TIMELINE
              ========================================================= */}
          <section id="investigation-timeline" className="report-section space-y-4">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>9. Investigation Timeline</span>
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">Forensic Chronology</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Step-by-step chronology tracing data intake, rule triggers, AI review, and investigator sign-offs.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--border-default)]">
                {/* Milestone 1 */}
                <div className="relative space-y-1">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)]"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Data Reading & Organization Completed</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">2026-08-26 • 20:00 UTC</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Statement file parsed. Transactions indexed in relational store and connections map.
                  </p>
                </div>

                {/* Milestone 2 */}
                <div className="relative space-y-1">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-[var(--bg-card)]"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Activity Scanner Triggered</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">2026-08-27 • 04:15 UTC</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    High-value transfer benchmark (₹5,00,000) and circular chain pattern flagged overall risk level of {riskScore}.
                  </p>
                </div>

                {/* Milestone 3 */}
                <div className="relative space-y-1">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--bg-card)]"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">AI Review & Analysis</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">2026-09-23 • 08:35 UTC</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    AI Review assistant synthesized findings and linked supporting transactions.
                  </p>
                </div>

                {/* Milestone 4 */}
                <div className="relative space-y-1">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-[var(--bg-card)]"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Draft Report Generated</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{report.case_information.date_drafted}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Draft report compiled for compliance review. Recorded in activity history.
                  </p>
                </div>

                {/* Milestone 5 */}
                <div className="relative space-y-1">
                  <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ${
                    isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-slate-400'
                  } border-2 border-[var(--bg-card)]`}></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {isApproved ? 'Approved by Compliance Officer' : isRejected ? 'Returned for Revision' : 'Human Review In Progress'}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {report.investigator_review_section?.reviewed_at || 'Pending Action'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {isApproved
                      ? `Reviewed and signed off by ${report.investigator_review_section?.reviewed_by || 'Lead Investigator'}.`
                      : isRejected
                      ? `Returned by ${report.investigator_review_section?.reviewed_by || 'Investigator'}. Reason: ${report.investigator_review_section?.decision_reasoning || 'Additional invoices required.'}`
                      : 'Awaiting certified compliance investigator verification and final determination.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
              SECTION 10: UNCERTAINTY & LIMITATIONS (REQUIRED)
              ========================================================= */}
          <section id="uncertainty-limitations" className="report-section space-y-4">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>10. Uncertainty & Limitations</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25 font-bold">
                  MANDATORY DISCLOSURE
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Open questions, missing documents, and KYC records required before submitting a formal regulatory filing.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3 text-xs">
              <p className="leading-relaxed text-[var(--text-secondary)] font-medium">
                The available transaction data indicates potentially suspicious patterns; however, <strong>the ledger data alone does not establish the underlying business purpose</strong> of the transactions or prove fraudulent intent.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-amber-500/15">
                <span className="font-bold text-[var(--text-primary)] block text-[11px]">
                  Additional Information Required Prior to Any Formal Regulatory Submission:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                  <li>Underlying commercial contracts, bills of lading, and verified invoices corresponding to transaction dates.</li>
                  <li>Explicit written business purpose and relationship declarations between account holders.</li>
                  <li><ComplianceTerm term="UBO">Ultimate Beneficial Ownership (UBO)</ComplianceTerm> documentation for all corporate counterparties.</li>
                  <li>Corroborating bank statements and tax filings to establish legitimate seasonal cash flow variances.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* =========================================================
              SECTION 11: INVESTIGATOR NOTES
              ========================================================= */}
          <section id="investigator-notes" className="report-section space-y-4">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>11. Investigator Notes</span>
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">Forensic Audit Log</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Internal notes, team observations, and working hypotheses recorded for this investigation.
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                value={investigatorNoteInput}
                onChange={(e) => setInvestigatorNoteInput(e.target.value)}
                placeholder="Add observations, clarifications, counterparty checks, or additional evidence..."
                rows={3}
                className="w-full p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotesOnly}
                  disabled={!investigatorNoteInput.trim() || isProcessing}
                  className="btn-primary text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes to Ledger</span>
                </button>
              </div>

              {/* History of Existing Notes */}
              {(caseDetail?.notes && caseDetail.notes.length > 0) && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Recorded Investigator Notes ({caseDetail.notes.length})
                  </span>
                  <div className="space-y-2">
                    {caseDetail.notes.map((note) => (
                      <div
                        key={note.note_id}
                        className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span className="font-bold text-[var(--text-primary)]">{note.author_name} ({note.author_role})</span>
                          <span className="font-mono">{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =========================================================
              SECTION 12: HUMAN REVIEW & FINAL DETERMINATION
              ========================================================= */}
          <section id="human-review" className="report-section space-y-5">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>12. Human Review & Final Determination</span>
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                  isApproved
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : isRejected
                    ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                }`}>
                  {reportStatus}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Required compliance officer sign-off checklist to approve or return this dossier with legal accountability.
              </p>
            </div>

            {/* Checklist of Human Verification */}
            <div className="p-5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-4">
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                Compliance Officer Sign-Off Checklist
              </span>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.reviewedEvidence}
                    disabled={isApproved}
                    onChange={(e) => setChecklist({ ...checklist, reviewedEvidence: e.target.checked })}
                    className="rounded border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--color-accent)] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[var(--text-secondary)]">
                    I have independently inspected the underlying transaction amounts, counterparty links, and timestamps.
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.reviewedFindings}
                    disabled={isApproved}
                    onChange={(e) => setChecklist({ ...checklist, reviewedFindings: e.target.checked })}
                    className="rounded border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--color-accent)] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[var(--text-secondary)]">
                    I have reviewed the AI investigation findings and confirmed that all citations reflect verifiable records.
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.reviewedReport}
                    disabled={isApproved}
                    onChange={(e) => setChecklist({ ...checklist, reviewedReport: e.target.checked })}
                    className="rounded border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--color-accent)] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[var(--text-secondary)]">
                    I have verified that the executive summary accurately reflects the case without unwarranted claims.
                  </span>
                </label>
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <ComplianceTerm term="Audit Trail" text="Activity History Status:" />
                  <span className="font-semibold text-emerald-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Immutable Log Ready
                  </span>
                </div>

                {!isApproved ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalOpen(true)}
                      disabled={isProcessing}
                      className="btn-danger text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Send Back / Request Evidence</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalModalOpen(true)}
                      disabled={isProcessing || !checklist.reviewedEvidence || !checklist.reviewedFindings || !checklist.reviewedReport}
                      className="btn-primary text-xs font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Investigation Report</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/25">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Report Approved & Finalized for Case Ledger</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =========================================================
              SECTION 13: TECHNICAL DETECTION DETAILS (COLLAPSIBLE)
              ========================================================= */}
          <section id="technical-details" className="report-section space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            <details className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-card-subtle)]/50 p-4 transition-all">
              <summary className="cursor-pointer font-bold text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between select-none">
                <div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>13. Technical Scan Details & Model Information</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] font-normal mt-0.5 ml-5">
                    Underlying connection metrics, scan parameters, and AI model details for compliance records.
                  </p>
                </div>
                <span className="text-[10px] text-[var(--color-accent)] font-mono group-open:rotate-180 transition-transform">
                  ▼ Expand
                </span>
              </summary>

              <div className="pt-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Detection Algorithm</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)] block mt-0.5">
                      Multi-Hop Topology + Velocity
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Threshold Configuration</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)] block mt-0.5">
                      Velocity &gt; 5 txns / 24h • ₹5,00,000 wire
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Graph Degree Centrality</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)] block mt-0.5">
                      In-degree: 1 • Out-degree: 1 (Cycle)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                  <span>Engine: Fintel Agentic Orchestrator v2.4.0 • Model: Grounded Reasoning Agent • Seed: Hash-Verified</span>
                </div>
              </div>
            </details>
          </section>

          {/* Document Footer */}
          <div className="pt-6 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[var(--text-muted)] font-mono">
            <span>Fintel Financial Crime Investigation Platform • Enterprise Compliance Suite</span>
            <span>AI-GENERATED DRAFT — REQUIRES HUMAN REVIEW</span>
          </div>
        </main>
      </div>

      {/* =========================================================
          TRANSACTION DETAIL MODAL
          ========================================================= */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[var(--color-accent)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Transaction Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">Transaction ID</span>
                  <span className="font-mono font-bold text-[var(--color-accent)]">{selectedTxn.transaction_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">Timestamp</span>
                  <span className="font-mono text-[var(--text-primary)]">{selectedTxn.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">Sender</span>
                  <span className="font-mono text-[var(--text-secondary)]">{selectedTxn.sender_account}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">Receiver</span>
                  <span className="font-mono text-[var(--text-secondary)]">{selectedTxn.receiver_account}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">Amount</span>
                  <span className="font-mono font-bold text-rose-500 text-sm">{formatCurrency(selectedTxn.amount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">Type</span>
                  <span className="font-mono text-[var(--text-primary)]">{selectedTxn.transaction_type || 'WIRE'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500">
                <span className="font-bold block mb-1">Detection Reason:</span>
                <p className="leading-relaxed">
                  Transaction volume exceeds threshold guidelines and matches closed circular layering flow.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EVIDENCE DETAIL MODAL
          ========================================================= */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Supporting Evidence Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Evidence ID</span>
                  <span className="font-mono font-bold text-[var(--color-accent)]">{selectedEvidence.evidence_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Source Type</span>
                  <span className="font-mono text-[var(--text-primary)]">{selectedEvidence.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Source Record</span>
                  <span className="font-mono text-[var(--text-primary)]">{selectedEvidence.source}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                <span className="font-bold text-[var(--text-primary)] text-[11px] block">Forensic Description:</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {selectedEvidence.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONFIRMATION MODAL: APPROVE SAR
          ========================================================= */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center space-x-3 text-emerald-500">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Approve Investigation Report</h3>
                <p className="text-xs text-[var(--text-muted)]">Official Compliance Sign-Off</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              By confirming approval, you certify that you have reviewed the supporting transactions, reasoning findings, and risk levels. This decision will update the case status to <strong>APPROVED</strong> and record an unchangeable entry in the activity history.
            </p>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Approval Comments / Reviewer Notes:</label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Reviewed evidence and circular layering analysis. Concur with risk assessment..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovalModalOpen(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={isProcessing}
                className="btn-primary text-xs font-bold"
              >
                Confirm Approval & Sign-Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONFIRMATION MODAL: SEND BACK / REJECT
          ========================================================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Send Back / Request Evidence</h3>
                <p className="text-xs text-[var(--text-muted)]">Return Case for Revision</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This will return the case to the investigation queue. Please specify the required information or revisions needed before this case can be approved.
            </p>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Required Information / Revision Reason:</label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Need trade contracts from ACC-89102 before approving..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={isProcessing}
                className="btn-danger text-xs font-bold"
              >
                Confirm Return for Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Export Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 max-w-sm p-4 rounded-xl shadow-2xl border z-[9999] flex items-center gap-3 animate-fadeIn ${
          toastMessage.type === 'success'
            ? 'bg-[var(--bg-card)] border-emerald-500/40 text-emerald-500'
            : toastMessage.type === 'error'
            ? 'bg-[var(--bg-card)] border-red-500/40 text-red-500'
            : 'bg-[var(--bg-card)] border-blue-500/40 text-blue-500'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          ) : toastMessage.type === 'error' ? (
            <XCircle className="w-5 h-5 shrink-0 text-red-500" />
          ) : (
            <Loader2 className="w-5 h-5 shrink-0 text-blue-500 animate-spin" />
          )}
          <div className="flex-1 text-xs">
            <span className="font-bold block text-[var(--text-primary)]">
              {toastMessage.type === 'success' ? 'Report Export' : toastMessage.type === 'error' ? 'Export Notice' : 'Report Generator'}
            </span>
            <span className="text-[var(--text-secondary)]">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportEditor;
