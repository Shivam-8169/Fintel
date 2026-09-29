import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Sparkles, FileText } from 'lucide-react';

import { LABELS } from '../../../constants/labels';

interface Stage1UploadProps {
  currentFile: File | null;
  onFileValidated: (file: File) => void;
  onProceed: () => void;
}

export const Stage1Upload: React.FC<Stage1UploadProps> = ({
  currentFile,
  onFileValidated,
  onProceed
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a CSV (.csv) or Excel spreadsheet (.xlsx, .xls).');
      return;
    }
    if (file.size === 0) {
      setError('Uploaded file is empty (0 bytes).');
      return;
    }

    setError(null);
    onFileValidated(file);
  };

  const loadSampleStatement = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      const res = await fetch('/data/sample_bank_statement.csv');
      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const sampleCsv = `Transaction Date,Description,Debit Amount,Credit Amount,Account ID,Counterparty
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
        blob = new Blob([sampleCsv], { type: 'text/csv' });
      }

      const file = new File([blob], 'synthetic_aml_bank_statement.csv', { type: 'text/csv' });
      processFile(file);
    } catch (err) {
      setError('Could not load sample statement file.');
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="section-tag block mb-1">
              {LABELS.pipeline.stagePrefix} 1 {LABELS.pipeline.ofTotal}
            </span>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              {LABELS.pipeline.stage1.title}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {LABELS.pipeline.stage1.subtitle}
            </p>
          </div>
          {currentFile && (
            <span className="badge-risk-low inline-flex items-center gap-1.5 shadow-xs self-start sm:self-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{LABELS.pipeline.stage1.fileValidated}</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)] text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Centered Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all ${
          dragActive
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
            : currentFile
            ? 'border-[var(--color-success)] bg-[var(--color-success-bg)]'
            : 'border-[var(--border-default)] bg-[var(--bg-card-subtle)] hover:border-[var(--color-accent)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm flex items-center justify-center mx-auto text-[var(--color-accent)] mb-4">
          {currentFile ? (
            <CheckCircle2 className="w-7 h-7 text-[var(--color-success)]" />
          ) : (
            <UploadCloud className="w-7 h-7 text-[var(--color-accent)]" />
          )}
        </div>

        {currentFile ? (
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="data-value text-base">{currentFile.name}</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              <span className="data-value">{(currentFile.size / 1024).toFixed(1)} KB</span> • {LABELS.pipeline.stage1.verifiedReady}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary inline-flex items-center justify-center gap-1.5"
              >
                {LABELS.pipeline.stage1.changeFile}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {LABELS.pipeline.stage1.dropzoneTitle}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {LABELS.pipeline.stage1.dropzoneSubtitle}
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary inline-flex items-center justify-center gap-1.5"
              >
                {LABELS.pipeline.stage1.browseFiles}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="px-2.5 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-default)] font-mono text-[11px]">.CSV</span>
          <span className="px-2.5 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-default)] font-mono text-[11px]">.XLSX</span>
          <span className="px-2.5 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-default)] font-mono text-[11px]">.XLS</span>
        </div>
      </div>

      {/* Sample Statement Benchmark Card */}
      <div className="p-4 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="section-tag mb-0.5">
              {LABELS.pipeline.stage1.sampleSectionTitle}
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              {LABELS.pipeline.stage1.sampleSectionSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSampleStatement}
          disabled={loadingSample}
          className="btn-secondary shrink-0 inline-flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span>{loadingSample ? LABELS.pipeline.stage1.sampleLoading : LABELS.pipeline.stage1.sampleButton}</span>
        </button>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-[var(--border-default)]">
        <button
          type="button"
          onClick={onProceed}
          disabled={!currentFile}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <span>{LABELS.pipeline.stage1.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default Stage1Upload;
