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
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import {
  CaseDetail as ICaseDetail,
  GraphData,
  InvestigationResponse,
  ReportResponse,
  StructuredSARReport,
  AuditLog
} from '../types';
import { GraphView } from '../components/GraphView';
import { ReportEditor } from '../components/ReportEditor';
import { AuditTimeline } from '../components/AuditTimeline';

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<ICaseDetail | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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
    } catch (err: any) {
      setStatusMessage({ text: 'Error loading case details: ' + (err.message || 'Unknown error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunInvestigation = async () => {
    if (!caseId) return;
    try {
      setActionLoading(true);
      setStatusMessage({ text: 'Autonomous Investigation Agent executing...', type: 'success' });
      const res = await api.investigateCase(caseId);
      setInvestigation(res);
      setActiveTab('investigation');
      await refreshCaseDetail();
      setStatusMessage({ text: 'Investigation generated with evidence citations.', type: 'success' });
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
      setStatusMessage({ text: 'Reporting Agent synthesizing SAR draft...', type: 'success' });
      const res = await api.generateReport(caseId);
      setReport(res);
      setActiveTab('report');
      await refreshCaseDetail();
      setStatusMessage({ text: 'SAR draft successfully generated. Watermarked for human review.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: 'Report generation failed: ' + (err.response?.data?.detail || err.message), type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveReportEdits = async (updatedContent: StructuredSARReport, notes?: string) => {
    if (!caseId) return;
    const res = await api.updateReport(caseId, updatedContent, notes);
    setReport(res);
    await refreshCaseDetail();
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
      setStatusMessage({ text: 'Report approved by human investigator. Status set to APPROVED.', type: 'success' });
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
      setStatusMessage({ text: 'Report rejected/returned by human investigator.', type: 'error' });
    } catch (err: any) {
      setStatusMessage({ text: 'Rejection failed: ' + (err.response?.data?.detail || err.message), type: 'error' });
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
      setStatusMessage({ text: 'Qualitative investigator note recorded.', type: 'success' });
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
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading Case Intelligence Suite...</p>
        </div>
      </div>
    );
  }

  const isApproved = caseData.status === 'APPROVED';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back Link & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/cases"
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Case Ledger</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black font-mono tracking-tight text-slate-100">
              {caseData.case_id}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                caseData.risk_level === 'CRITICAL'
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : caseData.risk_level === 'HIGH'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              }`}
            >
              {caseData.risk_level} RISK ({caseData.risk_score}/100)
            </span>
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {caseData.status}
            </span>
          </div>
        </div>

        {/* Primary Agent Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunInvestigation}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 flex items-center space-x-1.5 shadow-md shadow-cyan-600/25 transition-all font-bold disabled:opacity-50"
          >
            <Bot className="w-4 h-4" />
            <span>Run Investigation Agent</span>
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center space-x-1.5 shadow-md shadow-purple-600/25 transition-all font-bold disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Generate SAR Draft</span>
          </button>
          {!isApproved && report && (
            <button
              onClick={() => handleApproveReport('Approved by lead compliance investigator after graph and narrative review.')}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1.5 shadow-md shadow-emerald-500/25 transition-all font-bold disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Case</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/60 border-red-500/50 text-red-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Subject Entity Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block">Flagged Account</span>
          <span className="font-mono font-bold text-cyan-300 text-sm">{caseData.account_id}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Account Classification</span>
          <span className="font-semibold text-slate-200">{caseData.account?.account_type || 'CURRENT'}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Customer Entity</span>
          <span className="font-semibold text-slate-100">{caseData.customer?.name || 'Unknown Subject'}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Jurisdiction / Country</span>
          <span className="font-mono font-bold text-slate-200">{caseData.customer?.country || 'IND'}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Stated Occupation</span>
          <span className="text-slate-300">{caseData.customer?.occupation || 'Merchant Exporter'}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Baseline KYC Rating</span>
          <span className="font-bold text-amber-400">{caseData.customer?.risk_level || 'LOW'}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('graph')}
          className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'graph'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Transaction Graph (React Flow)</span>
        </button>

        <button
          onClick={() => setActiveTab('investigation')}
          className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'investigation'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Investigation Findings</span>
          {caseData.has_investigation && (
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'report'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>SAR Draft & Human Review</span>
          {caseData.has_report && (
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'evidence'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Evidence Items ({caseData.evidence.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'audit'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Log ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'notes'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Investigator Notes ({caseData.notes.length})</span>
        </button>
      </div>

      {/* Tab Content 1: React Flow Transaction Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>
              Interactive ego-network centered on subject account <strong className="text-cyan-400 font-mono">{caseData.account_id}</strong>. Click any node or edge to inspect details.
            </p>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                <span>Focal Account</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>Suspicious Counterparty</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                <span>Normal Counterparty</span>
              </span>
            </div>
          </div>

          {graphData ? (
            <GraphView graphData={graphData} />
          ) : (
            <div className="h-64 flex items-center justify-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No graph data generated for this account.
            </div>
          )}

          {/* Triggered Indicators below graph */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Triggered Algorithmic Risk Indicators ({caseData.indicators.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {caseData.indicators.map((ind, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 font-mono">{ind.name}</span>
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-red-950 text-red-400 text-[10px]">
                      +{ind.score} pts
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{ind.explanation}</p>
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
            <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 space-y-4">
              <Bot className="w-12 h-12 text-cyan-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">Autonomous Investigation Required</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Execute the Investigation Agent to correlate evidence IDs, detect typologies, and construct step-by-step reasoning narratives.
                </p>
              </div>
              <button
                onClick={handleRunInvestigation}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25"
              >
                Run Investigation Agent Now
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-xs text-slate-200">
              {/* Executive Summary */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                    <Bot className="w-4 h-4" />
                    <span>Investigative Narrative Summary</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                    Engine: {investigation.is_mock_ai ? 'Deterministic Demo Engine' : 'Live LLM'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  {investigation.summary}
                </p>
              </div>

              {/* Suspicious Typology Patterns */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Identified AML Typologies & Patterns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {investigation.suspicious_patterns.map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 font-mono">{p.pattern_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          {p.confidence} CONFIDENCE
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{p.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.evidence_ids.map((evId, eIdx) => (
                          <span key={eIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">
                            {evId}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Analytical Reasoning */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Step-by-Step Evidence-Grounded Reasoning
                </h3>
                <div className="space-y-3">
                  {investigation.reasoning.map((step) => (
                    <div key={step.step_number} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-400 font-mono text-[11px]">
                          Step {step.step_number}: Observation & Deduction
                        </span>
                        <div className="flex items-center space-x-1">
                          {step.referenced_evidence_ids.map((eid, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800/60">
                              {eid}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed"><strong className="text-slate-400">Observed Fact:</strong> {step.observation}</p>
                      <p className="text-slate-300 leading-relaxed"><strong className="text-slate-400">Interpretation:</strong> {step.analytical_interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncertainties & Questions for Human Investigator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
                    <HelpCircle className="w-4 h-4" />
                    <span>Explicit Gaps & Uncertainties</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-400 text-[11px] leading-relaxed">
                    {investigation.uncertainty.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                    <Activity className="w-4 h-4" />
                    <span>Recommended Investigator Inquiries</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-400 text-[11px] leading-relaxed">
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
            <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 space-y-4">
              <FileText className="w-12 h-12 text-purple-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">SAR Draft Not Compiled Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Assemble detection metrics, topological graph indicators, and AI investigation into a 9-section SAR draft.
                </p>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25"
              >
                Generate SAR-Style Draft Report
              </button>
            </div>
          ) : (
            <ReportEditor
              report={report.report_content}
              reportStatus={caseData.status}
              onSaveReport={handleSaveReportEdits}
              onApprove={handleApproveReport}
              onReject={handleRejectReport}
              isProcessing={actionLoading}
            />
          )}
        </div>
      )}

      {/* Tab Content 4: Evidence & Ledger */}
      {activeTab === 'evidence' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-semibold uppercase tracking-wider">Ground Truth Evidence Catalog ({caseData.evidence.length} records)</span>
            <span>Supports Explicit Explainability & Grounding</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">Evidence ID</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Source Identifier</th>
                  <th className="py-2.5 px-3">Factual Detail & Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {caseData.evidence.map((ev) => (
                  <tr key={ev.evidence_id} className="hover:bg-slate-900/50 font-mono text-[11px]">
                    <td className="py-3 px-3 font-bold text-cyan-400">{ev.evidence_id}</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">{ev.evidence_type}</td>
                    <td className="py-3 px-3 text-amber-400">{ev.source_id}</td>
                    <td className="py-3 px-3 font-sans text-slate-300 leading-relaxed">{ev.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 5: Audit History */}
      {activeTab === 'audit' && (
        <AuditTimeline logs={auditLogs} />
      )}

      {/* Tab Content 6: Investigator Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <form onSubmit={handleAddNote} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Plus className="w-4 h-4" />
              <span>Record Qualitative Investigator Observation</span>
            </div>
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="e.g. Inquired with local trade branch regarding high-volume pass-through. Pending certified bill of lading."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-40"
              >
                Log Qualitative Note
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {caseData.notes.map((note) => (
              <div key={note.note_id} className="p-4 rounded-xl glass-panel border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span className="font-bold text-slate-200">{note.note_id}</span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{note.note_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
