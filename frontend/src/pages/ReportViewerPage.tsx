import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ShieldCheck,
  Building,
  User,
  Activity,
  Layers,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { ReportResponse, StructuredSARReport } from '../types';
import { ReportEditor } from '../components/ReportEditor';

export const ReportViewerPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getReportById(reportId!);
      setReportData(res);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Report not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (updatedReport: StructuredSARReport, notes?: string) => {
    if (!reportData) return;
    try {
      setIsProcessing(true);
      const res = await api.updateReport(reportData.case_id, updatedReport, notes);
      setReportData(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (notes: string) => {
    if (!reportData) return;
    try {
      setIsProcessing(true);
      await api.approveReport(reportData.case_id, notes);
      await fetchReport();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (notes: string) => {
    if (!reportData) return;
    try {
      setIsProcessing(true);
      await api.rejectReport(reportData.case_id, notes);
      await fetchReport();
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-7 h-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[var(--text-muted)]">Loading SAR Regulatory Report...</p>
      </div>
    );
  }

  if (errorMsg || !reportData) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/reports')}
          className="text-xs text-[var(--color-accent-text)] hover:underline flex items-center space-x-1 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to SAR Reports Directory</span>
        </button>
        <div className="p-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
          <span className="font-bold block mb-1">Error Loading Report</span>
          <span>{errorMsg || 'We could not locate this SAR report. It may have been relocated or archived.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-[var(--color-accent-text)] font-bold">{reportData.report_id}</span>
              <span className="text-[var(--text-muted)]">•</span>
              <Link to={`/cases/${reportData.case_id}`} className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--color-accent-text)]">
                Case: {reportData.case_id}
              </Link>
            </div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Suspicious Activity Report Dossier
            </h1>
          </div>
        </div>

        <Link
          to={`/cases/${reportData.case_id}`}
          className="btn-secondary"
        >
          Open Case Dossier & Graph
        </Link>
      </div>

      {/* Embedded Document Editor & Approval Workflow */}
      <ReportEditor
        report={reportData.report_content}
        reportStatus={reportData.status}
        caseId={reportData.case_id}
        onSaveReport={handleSaveReport}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </div>
  );
};
export default ReportViewerPage;
