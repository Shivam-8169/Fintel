import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  Bot,
  FileText,
  Network,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  FileCheck2,
  Plus,
  Building,
  User,
  Activity,
  Layers,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Users,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { api } from '../services/api';
import {
  CaseDetail as ICaseDetail,
  GraphData,
  InvestigationResponse,
  ReportResponse,
  StructuredSARReport,
  AuditLog,
  User as IUserType
} from '../types';
import { GraphView } from '../components/GraphView';
import { ReportEditor } from '../components/ReportEditor';
import { AuditTimeline } from '../components/AuditTimeline';
import { formatINRText } from '../utils/currency';
import {
  getNeutralAccountId,
  getIndicatorPlainTitle,
  getCaseStatusLabel,
  cleanCustomerName
} from '../utils/complianceNaming';
import { ComplianceTerm } from '../components/ComplianceTerm';

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<ICaseDetail | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedGraphAccount, setSelectedGraphAccount] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<IUserType | null>(null);

  // Reassignment state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [candidateInvestigators, setCandidateInvestigators] = useState<string[]>([
    'Shivam Sharma',
    'Priya Patel',
    'System Administrator'
  ]);
  const [selectedInvestigator, setSelectedInvestigator] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const [activeTab, setActiveTab] = useState<'graph' | 'investigation' | 'report' | 'evidence' | 'audit' | 'notes'>('graph');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (caseId) {
      loadAllCaseData(caseId);
    }
  }, [caseId]);

  const loadAllCaseData = async (id: string) => {
    try {
      setLoading(true);
      const detail = await api.getCaseDetail(id);
      setCaseData(detail);

      // Load graph
      try {
        const g = await api.getCaseGraph(id, 2);
        setGraphData(g);
      } catch (err) {
        console.error('Failed to load graph:', err);
      }

      // Load investigation if available
      if (detail.has_investigation) {
        try {
          const inv = await api.getInvestigation(id);
          setInvestigation(inv);
        } catch (err) {
          console.error('No investigation on file:', err);
        }
      }

      // Load report if available
      if (detail.has_report) {
        try {
          const rep = await api.getReport(id);
          setReport(rep);
        } catch (err) {
          console.error('No report on file:', err);
        }
      }

      // Load audit logs
      try {
        const logs = await api.getCaseAuditLogs(id);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }

      // Fetch current authenticated user & team roster
      try {
        const u = await api.getCurrentUser();
        setCurrentUser(u);
      } catch {}

      try {
        const team = await api.getTeamUsers();
        if (team && team.length > 0) {
          const names = team.filter((t) => t.status === 'Active').map((t) => t.name);
          if (names.length > 0) {
            setCandidateInvestigators(names);
          }
        }
      } catch {}
    } catch (err: any) {
      setStatusMessage({ text: 'Error loading case details: ' + (err.message || 'Unknown error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReassignCase = async () => {
    if (!caseId || !selectedInvestigator) return;
    try {
      setReassigning(true);
      await api.assignCase(caseId, selectedInvestigator);
      setStatusMessage({ text: `Case successfully reassigned to ${selectedInvestigator}.`, type: 'success' });
      setReassignModalOpen(false);
      await refreshCaseDetail();
      const logs = await api.getCaseAuditLogs(caseId);
      setAuditLogs(logs);
    } catch (err: any) {
      setStatusMessage({ text: 'Reassignment failed: ' + (err.response?.data?.detail || err.message), type: 'error' });
    } finally {
      setReassigning(false);
    }
  };

  const handleRunInvestigation = async () => {
    if (!caseId) return;
    try {
      setActionLoading(true);
      setStatusMessage({ text: 'Investigation Agent running cross-typology analysis...', type: 'success' });
      const res = await api.investigateCase(caseId);
      setInvestigation(res);
      await refreshCaseDetail();
      setActiveTab('investigation');
      setStatusMessage({ text: 'AI Investigation narrative & reasoning completed.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: 'Investigation failed: ' + (err.response?.data?.detail || err.message), type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!caseId) return;
    try {
      setActionLoading(true);
      setStatusMessage({ text: 'Compiling structured SAR draft...', type: 'success' });
      const rep = await api.generateReport(caseId);
      setReport(rep);
      await refreshCaseDetail();
      setActiveTab('report');
      setStatusMessage({ text: 'SAR draft compiled. Ready for human compliance sign-off.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: 'Report generation failed: ' + (err.response?.data?.detail || err.message), type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveReportEdits = async (content: StructuredSARReport, notes?: string) => {
    if (!caseId) return;
    try {
      setActionLoading(true);
      const updated = await api.updateReport(caseId, content, notes);
      setReport(updated);
      await refreshCaseDetail();
      setStatusMessage({ text: 'Report draft saved successfully.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: 'Failed to save report: ' + (err.response?.data?.detail || err.message), type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReport = async (notes: string) => {
    if (!caseId) return;
    try {
      setActionLoading(true);
      await api.approveReport(caseId, notes);
      await refreshCaseDetail();
      if (report) {
        const refreshedRep = await api.getReport(caseId);
        setReport(refreshedRep);
      }
      setStatusMessage({ text: 'Report approved by compliance investigator. Case marked APPROVED.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: 'Approval failed: ' + (err.response?.data?.detail || err.message), type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReport = async (notes: string) => {
    if (!caseId) return;
    try {
      setActionLoading(true);
      await api.rejectReport(caseId, notes);
      await refreshCaseDetail();
      if (report) {
        const refreshedRep = await api.getReport(caseId);
        setReport(refreshedRep);
      }
      setStatusMessage({ text: 'Report sent back for revision / rejected.', type: 'error' });
    } catch (err: any) {
      setStatusMessage({ text: 'Action failed: ' + (err.response?.data?.detail || err.message), type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !newNoteText.trim()) return;
    try {
      await api.addCaseNote(caseId, newNoteText);
      setNewNoteText('');
      await refreshCaseDetail();
      setStatusMessage({ text: 'Investigator note recorded to activity history.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: 'Failed to add note: ' + err.message, type: 'error' });
    }
  };

  const refreshCaseDetail = async () => {
    if (!caseId) return;
    const updated = await api.getCaseDetail(caseId);
    setCaseData(updated);
    const logs = await api.getCaseAuditLogs(caseId);
    setAuditLogs(logs);
  };

  if (loading || !caseData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#64748B]">Loading Case Dossier...</p>
        </div>
      </div>
    );
  }

  const isApproved = caseData.status === 'APPROVED';
  const canReassign =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Lead Investigator' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'LEAD_INVESTIGATOR';

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            to="/cases"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--color-accent-text)] flex items-center space-x-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Case Ledger</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
              {caseData.case_id}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                caseData.risk_level === 'CRITICAL'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : caseData.risk_level === 'HIGH'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}
            >
              Risk Score: {Math.round(caseData.risk_score)}/100 ({caseData.risk_level})
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCaseStatusLabel(caseData.status).style}`}>
              {getCaseStatusLabel(caseData.status).label}
            </span>
          </div>
        </div>

        {/* Primary Agent Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {canReassign && (
            <button
              onClick={() => {
                setSelectedInvestigator(caseData.assigned_to || candidateInvestigators[0] || '');
                setReassignModalOpen(true);
              }}
              className="btn-secondary flex items-center space-x-1.5"
              title="Reassign this case to another investigator (Lead / Admin)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Reassign</span>
            </button>
          )}
          <button
            onClick={handleRunInvestigation}
            disabled={actionLoading}
            className="btn-primary"
            title="Run AI review to evaluate transaction patterns and explain findings"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Run AI Review</span>
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={actionLoading}
            className="btn-secondary"
            title="Compile findings into official draft report for your review"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Create Draft Report</span>
          </button>
          {!isApproved && report && (
            <button
              onClick={() => handleApproveReport('Approved by investigator after connections map & report review.')}
              disabled={actionLoading}
              className="btn-primary flex items-center space-x-1.5"
              title="Authorize report for official filing"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Sign Off</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-500 dark:text-rose-400'
          }`}
        >
          <span className="font-medium">{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {/* Subject Entity Card */}
      <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 text-xs">
        <div>
          <span className="text-[var(--text-muted)] block font-medium">Main Account Flagged</span>
          <span className="font-mono font-bold text-blue-500 dark:text-blue-400 text-sm">
            {getNeutralAccountId(caseData.account_id)}
          </span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] block font-medium">Account Type</span>
          <span className="font-semibold text-[var(--text-primary)]">{caseData.account?.account_type || 'CURRENT'} Account</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] block font-medium">Customer / Business Name</span>
          <span className="font-semibold text-[var(--text-primary)]">{cleanCustomerName(caseData.customer?.name)}</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] block font-medium">Jurisdiction</span>
          <span className="font-mono font-bold text-[var(--text-primary)]">{caseData.customer?.country || 'IND'} (India)</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] block font-medium">Stated Business / Occupation</span>
          <span className="text-[var(--text-secondary)]">{caseData.customer?.occupation || 'Merchant / Trade'}</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] block font-medium">
            <ComplianceTerm term="KYC">Baseline KYC Risk</ComplianceTerm>
          </span>
          <span className="font-bold text-amber-500 dark:text-amber-400">{caseData.customer?.risk_level || 'LOW'} Baseline</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] block font-medium">Assigned Investigator</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="font-semibold text-[var(--text-primary)] truncate">
              {caseData.assigned_to || 'Unassigned'}
            </span>
            {canReassign && (
              <button
                onClick={() => {
                  setSelectedInvestigator(caseData.assigned_to || candidateInvestigators[0] || '');
                  setReassignModalOpen(true);
                }}
                className="text-[var(--color-accent-text)] hover:underline font-bold text-[11px] ml-1 inline-flex items-center"
                title="Change assignee"
              >
                Change
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-2 shadow-xs flex items-center space-x-1 overflow-x-auto no-scrollbar py-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('graph')}
          className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'graph'
              ? 'border-[var(--color-accent)] text-[var(--color-accent-text)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Network className="w-4 h-4 shrink-0" />
          <span>Account Connections Map</span>
        </button>

        <button
          onClick={() => setActiveTab('investigation')}
          className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'investigation'
              ? 'border-[var(--color-accent)] text-[var(--color-accent-text)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Bot className="w-4 h-4 shrink-0" />
          <span>AI Review & Explanation</span>
          {caseData.has_investigation && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'report'
              ? 'border-[var(--color-accent)] text-[var(--color-accent-text)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Draft Report & Sign-off</span>
          {caseData.has_report && (
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-[var(--color-accent)] text-[var(--color-accent-text)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>Supporting Transactions ({caseData.evidence.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[var(--color-accent)] text-[var(--color-accent-text)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Activity History ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-[var(--color-accent)] text-[var(--color-accent-text)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Investigator Notes ({caseData.notes.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Transaction Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between text-xs text-[var(--text-muted)] gap-2">
            <p>
              Interactive account connections map centered on <strong className="text-blue-500 dark:text-blue-400 font-mono font-bold">{getNeutralAccountId(caseData.account_id)}</strong>. Click any account circle or connection line to inspect details.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-400"></span>
                <span className="text-[var(--text-primary)] font-medium">Main Account Flagged</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-[var(--text-primary)] font-medium">High Risk Connected Account</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-[var(--text-primary)] font-medium">Routine Connected Account</span>
              </span>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-xs overflow-hidden p-1.5">
            {graphData ? (
              <GraphView
                graphData={graphData}
                onSelectNode={(nodeId) => setSelectedGraphAccount(nodeId)}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--text-muted)] text-xs space-y-2">
                <Network className="w-8 h-8 text-[var(--text-muted)]" />
                <p>No account connections generated yet for this account.</p>
                <p className="text-[11px] text-[var(--text-muted)]">Run the investigation pipeline to reconstruct connections.</p>
              </div>
            )}
          </div>

          {/* Why This Account Was Flagged Panel */}
          <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  <span>Main Account Flagged:</span>
                  <strong className="text-blue-500 dark:text-blue-400 font-bold">{getNeutralAccountId(caseData.account_id)}</strong>
                  <span>•</span>
                  <span>Case Reference:</span>
                  <strong className="text-[var(--text-primary)] font-bold">{caseData.case_id}</strong>
                  {selectedGraphAccount && selectedGraphAccount !== caseData.account_id && (
                    <>
                      <span>•</span>
                      <span className="text-blue-500 dark:text-blue-400 font-semibold">(Selected Account: {getNeutralAccountId(selectedGraphAccount)})</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1">
                  Why This Account Was Given This Risk Level ({caseData.indicators.length} Risk Indicators)
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  The automated scanner detected unusual transfer patterns that breached safety thresholds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/25">
                  Overall Risk Level: {Math.round(caseData.risk_score)} / 100
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                  {caseData.risk_level} Priority
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {caseData.indicators.map((ind, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--text-primary)] text-xs">
                      {getIndicatorPlainTitle(ind.name)}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-500/15 text-rose-500 dark:text-rose-400 text-[10px] border border-rose-500/25 shrink-0">
                      +{ind.score} pts
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                    {formatINRText(ind.explanation)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: AI Investigation Agent Findings */}
      {activeTab === 'investigation' && (
        <div className="space-y-6">
          {!investigation ? (
            <div className="p-12 text-center bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] shadow-xs space-y-4">
              <Bot className="w-12 h-12 text-[var(--color-accent-text)] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">AI Review Required</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  Run the AI review to evaluate transaction patterns, check supporting transactions, and generate clear plain-language reasoning.
                </p>
              </div>
              <button
                onClick={handleRunInvestigation}
                disabled={actionLoading}
                className="btn-primary mx-auto"
              >
                Run AI Review Now
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-xs text-[var(--text-primary)]">
              {/* Executive Summary */}
              <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[var(--color-accent-text)] font-bold uppercase tracking-wider text-xs">
                    <Bot className="w-4 h-4" />
                    <span>AI Review & Case Explanation</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-card-subtle)] text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    Mode: {investigation.is_mock_ai ? 'Demo Mode (Sample Data)' : 'Live AI'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] p-4 rounded-lg border border-[var(--border-default)]">
                  {investigation.summary}
                </p>
              </div>

              {/* Suspicious Typology Patterns */}
              <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Types of Suspicious Activity Detected
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {investigation.suspicious_patterns.map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-primary)] font-mono">{p.pattern_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                          {p.confidence} CONFIDENCE
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">{p.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.evidence_ids.map((evId, eIdx) => (
                          <span key={eIdx} className="px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] font-mono text-[10px] border border-[var(--color-accent-border)]">
                            {evId}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Analytical Reasoning */}
              <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  How the AI Reached This Conclusion (Step-by-Step Proof)
                </h3>
                <div className="space-y-3">
                  {investigation.reasoning.map((step) => (
                    <div key={step.step_number} className="p-3.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--color-accent-text)] font-mono text-[11px]">
                          Step {step.step_number}: Observation & Deduction
                        </span>
                        <div className="flex items-center space-x-1">
                          {step.referenced_evidence_ids.map((eid, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] font-mono text-[10px] border border-[var(--color-accent-border)]">
                              {eid}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--text-muted)]">Observed Fact:</strong> {step.observation}</p>
                      <p className="text-[var(--text-secondary)] leading-relaxed"><strong className="text-[var(--text-muted)]">Explanation:</strong> {step.analytical_interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncertainties & Questions for Investigator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-2">
                  <div className="flex items-center space-x-2 text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider text-xs">
                    <HelpCircle className="w-4 h-4" />
                    <span>Unconfirmed Details & Questions to Check</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 text-[var(--text-muted)] text-[11px] leading-relaxed">
                    {investigation.uncertainty.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-2">
                  <div className="flex items-center space-x-2 text-[var(--color-accent-text)] font-bold uppercase tracking-wider text-xs">
                    <Activity className="w-4 h-4" />
                    <span>Recommended Next Steps to Verify</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 text-[var(--text-muted)] text-[11px] leading-relaxed">
                    {investigation.questions_for_investigator.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: SAR Draft & Human Review */}
      {activeTab === 'report' && (
        <div>
          {!report ? (
            <div className="p-12 text-center bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] shadow-xs space-y-4">
              <FileText className="w-12 h-12 text-purple-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Draft Report Not Created Yet</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  Assemble scan results, account connections, and AI review into an editable official draft report.
                </p>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={actionLoading}
                className="btn-primary mx-auto"
              >
                Create Draft Report
              </button>
            </div>
          ) : (
            <ReportEditor
              report={report.report_content}
              reportStatus={caseData.status}
              caseId={caseData.case_id}
              onSaveReport={handleSaveReportEdits}
              onApprove={handleApproveReport}
              onReject={handleRejectReport}
              isProcessing={actionLoading}
            />
          )}
        </div>
      )}

      {/* Tab Content 4: Evidence Ledger */}
      {activeTab === 'evidence' && (
        <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-2 border-b border-[var(--border-default)]">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-primary)]">Supporting Transactions & Proof ({caseData.evidence.length} records)</span>
            <span>Every claim is backed by a transaction record</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[160px]" />
                <col className="w-[150px]" />
                <col className="w-[auto]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] font-semibold text-[11px] uppercase">
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle">Evidence ID</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle">Classification</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle">Source Transaction</th>
                  <th className="py-2.5 px-3 align-middle">Factual Detail & Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {caseData.evidence.map((ev) => (
                  <tr key={ev.evidence_id} className="hover:bg-[var(--bg-card-hover)] text-[11px] transition-colors align-middle">
                    <td className="py-3 px-3 font-mono font-bold text-[var(--color-accent-text)] whitespace-nowrap align-middle">{ev.evidence_id}</td>
                    <td className="py-3 px-3 text-[var(--text-primary)] font-medium align-middle">{ev.evidence_type}</td>
                    <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap align-middle">{ev.source_id}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)] leading-relaxed align-middle">{ev.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 5: Audit History */}
      {activeTab === 'audit' && (
        <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-default)] shadow-xs">
          <AuditTimeline logs={auditLogs} />
        </div>
      )}

      {/* Tab Content 6: Investigator Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <form onSubmit={handleAddNote} className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[var(--color-accent-text)] uppercase tracking-wider">
              <Plus className="w-4 h-4" />
              <span>Add Investigator Note</span>
            </div>
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="e.g. Inquired with local trade branch regarding high-volume pass-through. Pending certified bill of lading."
              className="w-full p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="btn-primary"
              >
                Save Note
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {caseData.notes.map((note) => (
              <div key={note.note_id} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px] font-mono">
                  <span className="font-bold text-[var(--text-primary)]">{note.note_id}</span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">{note.note_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent-text)]">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Reassign Case Dossier</h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">{caseData.case_id}</p>
                </div>
              </div>
              <button
                onClick={() => setReassignModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[var(--text-muted)] block font-medium mb-1">Current Assignee</span>
                <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold">
                  {caseData.assigned_to || 'Unassigned'}
                </div>
              </div>

              <div>
                <label className="text-[var(--text-muted)] block font-medium mb-1">
                  New Assigned Investigator <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedInvestigator}
                  onChange={(e) => setSelectedInvestigator(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="">Select team member...</option>
                  {candidateInvestigators.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                  Only Lead Investigators and Administrators have permission to reassign open case files.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignCase}
                disabled={reassigning || !selectedInvestigator || selectedInvestigator === caseData.assigned_to}
                className="btn-primary text-xs px-4 py-1.5 flex items-center space-x-1.5"
              >
                {reassigning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reassigning...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Confirm Reassignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CaseDetail;
