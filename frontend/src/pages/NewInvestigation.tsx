import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Search,
  ExternalLink,
  Info,
  Network,
  Eye,
  Database,
  RefreshCw,
  Play,
  FileText,
  Clock,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../services/api';
import {
  StatementPreviewResponse,
  StatementColumnMapping,
  StatementAnalysisResult,
  SuspiciousFinding,
  PipelineStage
} from '../types';

export const NewInvestigation: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<StatementPreviewResponse | null>(null);

  // Mapping state
  const [mapping, setMapping] = useState<StatementColumnMapping>({});
  const [defaultAccount, setDefaultAccount] = useState('ACC-PRIMARY-STMT');

  // Analysis execution state
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<StatementAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Modal states for "Why Suspicious?" and "Evidence"
  const [selectedFindingForExplanation, setSelectedFindingForExplanation] = useState<SuspiciousFinding | null>(null);
  const [selectedEvidenceFinding, setSelectedEvidenceFinding] = useState<SuspiciousFinding | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  // Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setAnalysisError('Unsupported file format. Please upload a CSV (.csv) or Excel spreadsheet (.xlsx, .xls).');
      return;
    }

    setFile(selectedFile);
    setAnalysisError(null);
    setAnalysisResult(null);
    setLoadingPreview(true);

    try {
      const data = await api.parseStatementPreview(selectedFile);
      setPreview(data);
      setMapping(data.suggested_mapping || {});
    } catch (err: any) {
      console.error('Failed to parse preview:', err);
      setAnalysisError(err.response?.data?.detail || 'Unable to parse statement file.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadSampleDatasetFile = async () => {
    try {
      setLoadingPreview(true);
      setAnalysisError(null);
      // Fetch synthetic statement file from backend/data
      const res = await fetch('/data/sample_bank_statement.csv');
      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        // Fallback embedded sample CSV if static serve path differs
        const sampleText = `Transaction Date,Description,Debit Amount,Credit Amount,Account ID,Counterparty
2026-09-01 09:15:00,Offshore Inbound Wire,,85000.00,ACC-PASS-THROUGH,ACC-OFFSHORE-GLOBAL
2026-09-01 09:30:00,Rapid Pass Outflow 1,28000.00,,ACC-PASS-THROUGH,ACC-SHELL-BENEFICIARY-01
2026-09-01 09:45:00,Rapid Pass Outflow 2,28000.00,,ACC-PASS-THROUGH,ACC-SHELL-BENEFICIARY-02
2026-09-01 10:00:00,Rapid Pass Outflow 3,28000.00,,ACC-PASS-THROUGH,ACC-SHELL-BENEFICIARY-03
2026-09-02 11:00:00,Capital Inflow,,120000.00,ACC-FANOUT-HUB,ACC-VENTURE-HOLDINGS
2026-09-02 11:20:00,Mule Dispersal 1,22000.00,,ACC-FANOUT-HUB,ACC-MULE-01
2026-09-02 11:38:00,Mule Dispersal 2,22000.00,,ACC-FANOUT-HUB,ACC-MULE-02
2026-09-02 11:55:00,Mule Dispersal 3,22000.00,,ACC-FANOUT-HUB,ACC-MULE-03
2026-09-02 12:12:00,Mule Dispersal 4,22000.00,,ACC-FANOUT-HUB,ACC-MULE-04
2026-09-02 12:30:00,Mule Dispersal 5,22000.00,,ACC-FANOUT-HUB,ACC-MULE-05
2026-09-03 14:00:00,Smurfing Cash Placement,,9800.00,ACC-STRUCT-SUSPECT,ACC-CASH-VAULT
2026-09-03 17:20:00,Smurfing Cash Placement,,9500.00,ACC-STRUCT-SUSPECT,ACC-CASH-VAULT
2026-09-04 10:00:00,Smurfing Cash Placement,,9900.00,ACC-STRUCT-SUSPECT,ACC-CASH-VAULT
2026-09-04 13:40:00,Smurfing Cash Placement,,9400.00,ACC-STRUCT-SUSPECT,ACC-CASH-VAULT
2026-09-04 16:30:00,Smurfing Cash Placement,,9750.00,ACC-STRUCT-SUSPECT,ACC-CASH-VAULT
2026-09-05 08:00:00,Circular Layering Alpha to Beta,65000.00,,ACC-LOOP-ALPHA,ACC-LOOP-BETA
2026-09-05 14:00:00,Circular Layering Beta to Gamma,64200.00,,ACC-LOOP-BETA,ACC-LOOP-GAMMA
2026-09-05 20:00:00,Circular Layering Gamma to Alpha,63800.00,,ACC-LOOP-GAMMA,ACC-LOOP-ALPHA`;
        blob = new Blob([sampleText], { type: 'text/csv' });
      }

      const sampleFile = new File([blob], 'sample_bank_statement.csv', { type: 'text/csv' });
      await handleFileSelected(sampleFile);
    } catch (err: any) {
      console.error('Error loading sample statement:', err);
      setAnalysisError('Could not load sample dataset.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!file || !preview) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setActiveStageIndex(0);

    // Simulate multi-stage visual progression matching the backend pipeline
    const stageTimer = setInterval(() => {
      setActiveStageIndex((prev) => (prev < 5 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await api.analyzeStatement(file, mapping, defaultAccount);
      clearInterval(stageTimer);
      setActiveStageIndex(5);
      setAnalysisResult(res);
    } catch (err: any) {
      clearInterval(stageTimer);
      console.error('Analysis failed:', err);
      setAnalysisError(err.response?.data?.detail || 'Pipeline execution failed during analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseDemoDataset = async () => {
    setDemoLoading(true);
    setAnalysisError(null);
    try {
      await api.loadDemoData();
      // Redirect to cases or reload overview
      navigate('/cases');

    } catch (err: any) {
      console.error('Demo dataset failed:', err);
      setAnalysisError('Failed to load demo dataset.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Autonomous AML/CFT Investigation Workflow
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Start a New Investigation
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Upload a bank statement or transaction dataset. Fintel’s dual-layer engine performs real-time
            normalization, graph construction, AML typology analysis, explainable reasoning, and SAR drafting.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={loadSampleDatasetFile}
              disabled={loadingPreview || analyzing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Load Synthetic Sample Statement
            </button>

            <button
              onClick={handleUseDemoDataset}
              disabled={demoLoading || analyzing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] font-medium text-sm border border-[var(--border-default)] transition-all active:scale-95 shadow-xs"
            >
              {demoLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <Database className="w-4 h-4 text-cyan-400" />
              )}
              Use Complete Demo Repository
            </button>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {analysisError && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-200">Error encountered:</p>
            <p className="mt-0.5">{analysisError}</p>
          </div>
          <button onClick={() => setAnalysisError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Upload and Mapping Area */}
      {!analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* File Dropzone */}
          <div className={`${preview ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-6 transition-all`}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-[var(--color-cyan)] bg-[var(--color-accent-subtle)] scale-[1.01]'
                  : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center text-[var(--color-accent-text)] mb-4 shadow-inner">
                {loadingPreview ? (
                  <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-cyan)]" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {file ? file.name : 'Upload Bank Statement / Transaction File'}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                Drag and drop your file here, or{' '}
                <span className="text-[var(--color-cyan)] underline font-medium">browse files</span>
              </p>

              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:text-emerald-400"></span> CSV (.csv)
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:text-emerald-400"></span> Excel (.xlsx)
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-[var(--text-muted)]">
                  PDF (Use CSV export for precision)
                </span>
              </div>
            </div>

            {/* Uploaded File Validation Card */}
            {preview && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{preview.filename}</h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        {(preview.file_size_bytes / 1024).toFixed(1)} KB • {preview.total_rows} records detected
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                    Validated
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
                    <span className="text-[var(--text-muted)] block mb-0.5">Total Rows</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{preview.total_rows}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
                    <span className="text-[var(--text-muted)] block mb-0.5">Detected Headers</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{preview.columns.length} columns</span>
                  </div>
                </div>

                {/* Sample Records Table */}
                <div>
                  <h5 className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                    Data Preview (First 5 Rows)
                  </h5>
                  <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
                    <table className="w-full text-left text-[11px] text-[var(--text-secondary)]">
                      <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-muted)] uppercase font-mono">
                        <tr>
                          {preview.columns.slice(0, 5).map((col) => (
                            <th key={col} className="px-3 py-2 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                        {preview.sample_rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-card-hover)]">
                            {preview.columns.slice(0, 5).map((col) => (
                              <td key={col} className="px-3 py-1.5 whitespace-nowrap text-[var(--text-secondary)]">
                                {row[col] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column Mapping & Configuration Section */}
          {preview && (
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[var(--color-cyan)]" />
                    Confirm Column Mapping
                  </h3>
                  <span className="text-xs text-[var(--text-muted)]">Step 2 of 3</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Bank statements vary by financial institution. Confirm or adjust which columns represent standard
                  transaction attributes.
                </p>

                <div className="space-y-4">
                  {/* Date Column */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between mb-1.5">
                      <span>Transaction Date / Timestamp *</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Normalized to UTC</span>
                    </label>
                    <select
                      value={mapping.date || ''}
                      onChange={(e) => setMapping({ ...mapping, date: e.target.value || null })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="">-- Select Date Column --</option>
                      {preview.columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description Column */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                      Description / Narration / Particulars
                    </label>
                    <select
                      value={mapping.description || ''}
                      onChange={(e) => setMapping({ ...mapping, description: e.target.value || null })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="">-- Select Description Column --</option>
                      {preview.columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dual Debit / Credit vs Unified Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Debit Amount (Outflow)
                      </label>
                      <select
                        value={mapping.debit || ''}
                        onChange={(e) => setMapping({ ...mapping, debit: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">-- None / Unified --</option>
                        {preview.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Credit Amount (Inflow)
                      </label>
                      <select
                        value={mapping.credit || ''}
                        onChange={(e) => setMapping({ ...mapping, credit: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">-- None / Unified --</option>
                        {preview.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Unified Amount Column if not using Debit/Credit */}
                  {(!mapping.debit || !mapping.credit) && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Unified Amount (if single column with +/-)
                      </label>
                      <select
                        value={mapping.amount || ''}
                        onChange={(e) => setMapping({ ...mapping, amount: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">-- Select Amount Column --</option>
                        {preview.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Primary Account & Counterparty Columns */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Primary Account ID
                      </label>
                      <select
                        value={mapping.account_id || ''}
                        onChange={(e) => setMapping({ ...mapping, account_id: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">-- Use Default Account --</option>
                        {preview.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Counterparty / Beneficiary
                      </label>
                      <select
                        value={mapping.counterparty || ''}
                        onChange={(e) => setMapping({ ...mapping, counterparty: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">-- Auto-infer from Description --</option>
                        {preview.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!mapping.account_id && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                        Statement Account Identifier
                      </label>
                      <input
                        type="text"
                        value={defaultAccount}
                        onChange={(e) => setDefaultAccount(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-sm font-mono text-[var(--color-cyan)] focus:outline-none focus:border-[var(--color-accent)]"
                        placeholder="ACC-PRIMARY-STMT"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={handleStartAnalysis}
                    disabled={analyzing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Executing Multi-Stage Investigation Pipeline...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Analyze Statement & Run AML Engine
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stepped Analysis Progress Screen */}
      {analyzing && (
        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl space-y-6 animate-pulse">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Live Autonomous Investigation Pipeline</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Executing multi-agent verification and dual-layer graph detection on SQLite database...
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30">
              Processing...
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: '1. Data Ingestion', desc: 'Validating records & referential links' },
              { title: '2. Transaction Normalization', desc: 'Debits, credits, timestamps & amounts' },
              { title: '3. Graph Construction', desc: 'NetworkX directed multigraph mapping' },
              { title: '4. Rule Analysis', desc: '7 AML typology detection algorithms' },
              { title: '5. Graph Analysis', desc: 'PageRank, cycle detection & flow centrality' },
              { title: '6. Risk Scoring & Case Generation', desc: 'Generating explainable compliance dossiers' }
            ].map((step, idx) => {
              const isDone = idx < activeStageIndex;
              const isCurrent = idx === activeStageIndex;
              return (
                <div
                  key={step.title}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent-text)] ring-1 ring-[var(--color-accent-border)]'
                      : 'bg-[var(--bg-card-subtle)] border-[var(--border-default)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-[var(--text-primary)]">{step.title}</span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-cyan)]" />
                    ) : (
                      <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <p className="text-[11px] leading-tight text-[var(--text-muted)]">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {analysisResult && (
        <div className="space-y-8 animate-fadeIn">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-md">
              <span className="text-xs text-[var(--text-muted)] block mb-1">Transactions Analyzed</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[var(--text-primary)]">
                {analysisResult.transactions_analyzed.toLocaleString()}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-md">
              <span className="text-xs text-[var(--text-muted)] block mb-1">Suspicious Transactions</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-500 dark:text-amber-400">
                {analysisResult.potentially_suspicious_transactions}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-md">
              <span className="text-xs text-[var(--text-muted)] block mb-1">Flagged Accounts</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-500 dark:text-rose-400">
                {analysisResult.potentially_suspicious_accounts}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-md">
              <span className="text-xs text-[var(--text-muted)] block mb-1">Cases Generated</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[var(--color-cyan)]">
                {analysisResult.cases_generated}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-md col-span-2 sm:col-span-1">
              <span className="text-xs text-[var(--text-muted)] block mb-1">Evidence Records</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-indigo-500 dark:text-indigo-400">
                {analysisResult.evidence_items}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:text-emerald-400 animate-pulse"></span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Analysis complete. Grounded detection generated {analysisResult.findings.length} findings.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setFile(null);
                  setPreview(null);
                }}
                className="pulse-btn-secondary text-xs"
              >
                Upload Another Statement
              </button>
              <button
                onClick={() => navigate('/cases')}
                className="pulse-btn-primary text-xs"
              >
                <span>Open Flagged Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Suspicious Activity Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />
              Detected Suspicious Patterns & Typologies
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.findings.map((f, idx) => {
                const isCritical = f.risk_level === 'CRITICAL' || f.risk_score >= 80;
                return (
                  <div
                    key={`${f.finding_id}-${idx}`}
                    className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--border-strong)] shadow-xl space-y-4 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isCritical
                                ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {f.risk_level} • Score {f.risk_score}
                          </span>
                          <span className="text-xs font-mono text-[var(--text-muted)]">ID: {f.account_id}</span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">{f.typology}</h3>
                      </div>

                      {f.case_id && (
                        <button
                          onClick={() => navigate(`/cases/${f.case_id}`)}
                          className="pulse-btn-primary text-xs shrink-0"
                        >
                          <span>Open Case</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card-subtle)] p-3 rounded-lg border border-[var(--border-default)]">
                      {f.explanation}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-default)] text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedFindingForExplanation(f)}
                          className="inline-flex items-center gap-1 text-[var(--color-cyan)] hover:opacity-80 font-semibold"
                        >
                          <Info className="w-3.5 h-3.5" />
                          Why Suspicious?
                        </button>

                        <span className="text-[var(--text-muted)]">•</span>

                        <button
                          onClick={() => setSelectedEvidenceFinding(f)}
                          className="inline-flex items-center gap-1 text-indigo-500 dark:text-indigo-400 hover:opacity-80 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Evidence ({f.supporting_evidence_ids.length})
                        </button>
                      </div>

                      {f.case_id && (
                        <button
                          onClick={() => navigate(`/cases/${f.case_id}`)}
                          className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Network className="w-3.5 h-3.5" />
                          View Graph
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: "WHY WAS THIS FLAGGED?" */}
      {selectedFindingForExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-xl w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2 text-[var(--color-cyan)] font-bold text-sm">
                <Info className="w-4 h-4" />
                Explainable AML Detection Breakdown
              </div>
              <button
                onClick={() => setSelectedFindingForExplanation(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-[var(--text-muted)]">Typology Rule</span>
              <h3 className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                {selectedFindingForExplanation.typology}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Account Target: {selectedFindingForExplanation.account_id}</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-cyan)] uppercase tracking-wider">
                Why was this pattern flagged?
              </h4>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {selectedFindingForExplanation.triggers.map((trig, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[var(--color-cyan)] font-bold">•</span>
                    <span>{trig}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
                <span className="text-[var(--text-muted)] block mb-0.5">Risk Contribution</span>
                <span className="font-mono font-bold text-rose-500 dark:text-rose-400">
                  +{selectedFindingForExplanation.risk_score} Points
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
                <span className="text-[var(--text-muted)] block mb-0.5">Linked Evidence Items</span>
                <span className="font-mono font-bold text-indigo-500 dark:text-indigo-400">
                  {selectedFindingForExplanation.supporting_evidence_ids.length} Registered Records
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setSelectedFindingForExplanation(null)}
                className="pulse-btn-secondary text-xs"
              >
                Close
              </button>
              {selectedFindingForExplanation.case_id && (
                <button
                  onClick={() => {
                    const cid = selectedFindingForExplanation.case_id;
                    setSelectedFindingForExplanation(null);
                    navigate(`/cases/${cid}`);
                  }}
                  className="pulse-btn-primary text-xs"
                >
                  <span>Open Full Case Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: "VIEW EVIDENCE" */}
      {selectedEvidenceFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-2xl w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold text-sm">
                <FileText className="w-4 h-4" />
                Claim to Evidence Audit Trail
              </div>
              <button
                onClick={() => setSelectedEvidenceFinding(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Supporting Evidence for {selectedEvidenceFinding.typology}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Every detection finding is strictly cited from immutable SQLite transaction records.
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedEvidenceFinding.supporting_evidence_ids.length > 0 ? (
                selectedEvidenceFinding.supporting_evidence_ids.map((evId, idx) => (
                  <div
                    key={evId}
                    className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[var(--color-cyan)]">{evId}</span>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Transaction verification record for {selectedEvidenceFinding.account_id}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-mono">
                      CONFIRMED
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                  Evidence items are attached to Case {selectedEvidenceFinding.case_id}.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setSelectedEvidenceFinding(null)}
                className="pulse-btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
