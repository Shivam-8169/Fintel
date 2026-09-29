import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Users,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { LABELS } from '../constants/labels';
import { ComplianceTerm } from '../components/ComplianceTerm';

interface DataStatus {
  status: string;
  customers_count: number;
  accounts_count: number;
  transactions_count: number;
  database_type: string;
  synthetic_ground_truth_available: boolean;
}

interface IngestionFeedback {
  dataset_name: string;
  records_received: number;
  records_valid: number;
  records_rejected: number;
  customers_added: number;
  accounts_added: number;
  transactions_added: number;
  warnings: Array<{ row: number; field: string; message: string; rejected: boolean }>;
}

export const DataManagement: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [runningDetection, setRunningDetection] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<IngestionFeedback | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getDataStatus();
      setDataStatus(res);
    } catch (err: any) {
      console.error('Failed to fetch data status:', err);
      setErrorMsg('Failed to fetch data status from backend API.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoData = async () => {
    try {
      setLoadingDemo(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.loadDemoData();
      setSuccessMsg(`Demo dataset loaded successfully: ${res.customers_added} customers, ${res.accounts_added} accounts, ${res.transactions_added} transactions. Flagged ${res.cases_flagged} suspicious cases.`);
      await fetchStatus();
    } catch (err: any) {
      console.error('Failed to load demo data:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to load demo dataset');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleRunDetection = async () => {
    try {
      setRunningDetection(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.triggerDetection();
      setSuccessMsg(`Detection pipeline completed: Evaluated ${res.accounts_evaluated} accounts, flagged ${res.suspicious_cases_flagged} suspicious cases exceeding threshold ${res.threshold}.`);
      await fetchStatus();
    } catch (err: any) {
      console.error('Failed to trigger detection:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to execute detection pipeline');
    } finally {
      setRunningDetection(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, datasetType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingType(datasetType);
      setErrorMsg(null);
      setFeedback(null);
      const res = await api.uploadDataset(file, datasetType, true);
      setFeedback(res);
      await fetchStatus();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'File upload failed');
    } finally {
      setUploadingType(null);
      e.target.value = '';
    }
  };

  const datasetCards = [
    {
      id: 'customers',
      title: LABELS.dataManagement.customerCard.title,
      description: LABELS.dataManagement.customerCard.description,
      requiredCols: ['customer_id', 'name', 'country', 'occupation', 'risk_level'],
      count: dataStatus?.customers_count ?? 0,
      icon: Users,
      badgeColor: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20'
    },
    {
      id: 'accounts',
      title: LABELS.dataManagement.accountCard.title,
      description: LABELS.dataManagement.accountCard.description,
      requiredCols: ['account_id', 'customer_id', 'account_type', 'created_at'],
      count: dataStatus?.accounts_count ?? 0,
      icon: CreditCard,
      badgeColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20'
    },
    {
      id: 'transactions',
      title: LABELS.dataManagement.txnCard.title,
      description: LABELS.dataManagement.txnCard.description,
      requiredCols: ['transaction_id', 'sender_account', 'receiver_account', 'amount', 'timestamp'],
      count: dataStatus?.transactions_count ?? 0,
      icon: Database,
      badgeColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{LABELS.dataManagement.eyebrow}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {LABELS.dataManagement.title}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            {LABELS.dataManagement.subtitle}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={handleLoadDemoData}
            disabled={loadingDemo}
            className="btn-primary inline-flex items-center justify-center gap-1.5"
            title={LABELS.app.demoModeTooltip}
          >
            <Database className={`w-3.5 h-3.5 ${loadingDemo ? 'animate-spin' : ''}`} />
            <span>{loadingDemo ? LABELS.dataManagement.loadDemoLoading : LABELS.dataManagement.loadDemoButton}</span>
          </button>

          <button
            onClick={handleRunDetection}
            disabled={runningDetection}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${runningDetection ? 'animate-spin' : ''}`} />
            <span>{runningDetection ? LABELS.dataManagement.runDetectionLoading : LABELS.dataManagement.runDetectionButton}</span>
          </button>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="btn-secondary inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
            <span>{LABELS.dataManagement.refreshButton}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold uppercase mb-2">
            <span>{LABELS.dataManagement.metrics.totalCustomers}</span>
            <Users className="w-4 h-4 text-[var(--color-accent-text)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {loading ? '...' : (dataStatus?.customers_count ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--color-accent-text)] mt-1 block font-medium">
            <ComplianceTerm term="KYC" text={LABELS.dataManagement.metrics.verifiedProfiles} />
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold uppercase mb-2">
            <span>{LABELS.dataManagement.metrics.activeAccounts}</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {loading ? '...' : (dataStatus?.accounts_count ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-purple-400 mt-1 block font-medium">
            {LABELS.dataManagement.metrics.connectedAccounts}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold uppercase mb-2">
            <span>{LABELS.dataManagement.metrics.totalTxns}</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {loading ? '...' : (dataStatus?.transactions_count ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
            {LABELS.dataManagement.metrics.recordedTransfers}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold uppercase mb-2">
            <span>{LABELS.dataManagement.metrics.scannerStatus}</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{LABELS.dataManagement.metrics.scannerActive}</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            {LABELS.dataManagement.metrics.realtimeCheck}
          </span>
        </div>
      </div>

      {/* Upload Cards */}
      <div>
        <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-[var(--color-accent-text)]" />
          <span>{LABELS.dataManagement.uploadCardsTitle}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {datasetCards.map((card) => {
            const Icon = card.icon;
            const isCurrentUploading = uploadingType === card.id;

            return (
              <div
                key={card.id}
                className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs hover:border-[var(--color-accent-border)] transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-card-subtle)] text-[var(--color-accent-text)] border border-[var(--border-subtle)]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-primary)] border border-[var(--border-default)]">
                      {card.count.toLocaleString()} {LABELS.dataManagement.recordsLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{card.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                      {LABELS.dataManagement.requiredHeaders}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {card.requiredCols.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-2xs ${
                      isCurrentUploading
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border-[var(--color-accent-border)] cursor-wait'
                        : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--color-accent-border)]'
                    }`}
                  >
                    <UploadCloud className={`w-4 h-4 text-[var(--color-accent-text)] ${isCurrentUploading ? 'animate-bounce' : ''}`} />
                    <span>{isCurrentUploading ? LABELS.dataManagement.readingFile : LABELS.dataManagement.selectCsv}</span>
                    <input
                      type="file"
                      accept=".csv"
                      disabled={isCurrentUploading}
                      onChange={(e) => handleFileUpload(e, card.id)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ingestion Feedback & Status Banners */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 flex items-start space-x-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">
            <span className="font-bold block mb-0.5">{LABELS.dataManagement.feedbackSuccess}</span>
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/15 flex items-start space-x-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">
            <span className="font-bold block mb-0.5">{LABELS.dataManagement.feedbackError}</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {feedback && (
        <div className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  {LABELS.dataManagement.fileProcessed}: {feedback.dataset_name}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {feedback.records_valid} {LABELS.dataManagement.recordsCommitted}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-emerald-400 font-bold">
                {LABELS.dataManagement.validLabel}: {feedback.records_valid}
              </span>
              {feedback.records_rejected > 0 && (
                <span className="text-rose-400 font-bold">
                  {LABELS.dataManagement.rejectedLabel}: {feedback.records_rejected}
                </span>
              )}
            </div>
          </div>

          {/* Warnings list if any */}
          {feedback.warnings && feedback.warnings.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{LABELS.dataManagement.diagnosticsTitle} ({feedback.warnings.length})</span>
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                {feedback.warnings.slice(0, 15).map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs flex items-center justify-between"
                  >
                    <span className="text-[var(--text-secondary)]">
                      Row <span className="font-mono text-[var(--color-accent-text)] font-bold">{w.row}</span> ({w.field}): {w.message}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        w.rejected
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]'
                      }`}
                    >
                      {w.rejected ? 'SKIPPED' : 'AUTO-FIXED'}
                    </span>
                  </div>
                ))}
                {feedback.warnings.length > 15 && (
                  <p className="text-[11px] text-[var(--text-muted)] text-center pt-1">
                    + {feedback.warnings.length - 15} more diagnostics captured in activity history.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ground Truth & Dataset Architecture Note */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-start space-x-3.5">
        <Info className="w-5 h-5 text-[var(--color-accent-text)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] space-y-1 leading-relaxed">
          <span className="font-bold text-[var(--text-primary)] block">
            {LABELS.dataManagement.scenariosTitle}
          </span>
          <p>
            {LABELS.dataManagement.scenariosDescription}
          </p>
        </div>
      </div>
    </div>
  );
};
export default DataManagement;
