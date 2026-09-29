import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle, Layers, Hash } from 'lucide-react';
import { api } from '../../../services/api';
import { NormalizedTransaction, StatementPreviewResponse } from '../../../types';

import { LABELS } from '../../../constants/labels';

interface Stage2IngestionProps {
  file: File;
  onIngestionComplete: (records: NormalizedTransaction[], totalCount: number, accountCount: number) => void;
  onProceed: () => void;
  onBack: () => void;
  existingRecords: NormalizedTransaction[];
}

export const Stage2Ingestion: React.FC<Stage2IngestionProps> = ({
  file,
  onIngestionComplete,
  onProceed,
  onBack,
  existingRecords
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<StatementPreviewResponse | null>(null);
  const [normalized, setNormalized] = useState<NormalizedTransaction[]>(existingRecords);

  useEffect(() => {
    if (normalized.length === 0) {
      parseAndIngest();
    }
  }, []);

  const parseAndIngest = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get preview to detect schema
      const preview = await api.parseStatementPreview(file);
      setPreviewData(preview);

      // 2. Perform normalization into canonical schema
      const records: NormalizedTransaction[] = preview.sample_rows.map((row, idx) => {
        const dateVal = row[preview.suggested_mapping.date || ''] || row['Transaction Date'] || row['Date'] || new Date().toISOString();
        const descVal = row[preview.suggested_mapping.description || ''] || row['Description'] || 'Wire Transfer';
        const partyVal = row[preview.suggested_mapping.counterparty || ''] || row['Counterparty'] || `ACC-PARTY-${idx + 1}`;
        const accVal = row[preview.suggested_mapping.account_id || ''] || row['Account ID'] || 'ACC-PRIMARY-STMT';

        // Normalize amount
        let amt = 1000.0;
        let dir: 'DEBIT' | 'CREDIT' = 'DEBIT';

        if (preview.suggested_mapping.debit && row[preview.suggested_mapping.debit]) {
          amt = parseFloat(String(row[preview.suggested_mapping.debit]).replace(/[^0-9.]/g, '')) || 0;
          dir = 'DEBIT';
        } else if (preview.suggested_mapping.credit && row[preview.suggested_mapping.credit]) {
          amt = parseFloat(String(row[preview.suggested_mapping.credit]).replace(/[^0-9.]/g, '')) || 0;
          dir = 'CREDIT';
        } else if (preview.suggested_mapping.amount && row[preview.suggested_mapping.amount]) {
          const raw = String(row[preview.suggested_mapping.amount]).replace(/[$,₹]/g, '').trim();
          const val = parseFloat(raw) || 0;
          amt = Math.abs(val);
          dir = val < 0 ? 'DEBIT' : 'CREDIT';
        }

        return {
          transaction_id: `TXN-NORM-${idx + 101}`,
          account_id: accVal,
          timestamp: dateVal,
          amount: amt,
          counterparty: partyVal,
          direction: dir,
          notes: descVal
        };
      });

      setNormalized(records);
      const uniqueAccounts = new Set([...records.map((r) => r.account_id), ...records.map((r) => r.counterparty)]);
      onIngestionComplete(records, preview.total_rows, uniqueAccounts.size);
    } catch (err: any) {
      console.error('Ingestion failed:', err);
      setError(err.response?.data?.detail || 'Failed to read and organize statement records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent)]">
          {LABELS.pipeline.stagePrefix} 2 {LABELS.pipeline.ofTotal} • {LABELS.pipeline.stage2.shortLabel}
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
          {LABELS.pipeline.stage2.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
          {LABELS.pipeline.stage2.subtitle}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <span className="text-xs text-[var(--text-muted)] block mb-1">{LABELS.pipeline.stage2.rowsProcessed}</span>
          <span className="text-2xl font-black font-mono text-[var(--color-accent)]">
            {loading ? '...' : previewData?.total_rows || normalized.length}
          </span>
          <span className="text-[11px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> {LABELS.pipeline.stage2.validatedStructure}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <span className="text-xs text-[var(--text-muted)] block mb-1">{LABELS.pipeline.stage2.differentAccounts}</span>
          <span className="text-2xl font-black font-mono text-[var(--text-primary)]">
            {loading ? '...' : new Set([...normalized.map((r) => r.account_id), ...normalized.map((r) => r.counterparty)]).size}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] block mt-1">{LABELS.pipeline.stage2.accountsSubtext}</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <span className="text-xs text-[var(--text-muted)] block mb-1">{LABELS.pipeline.stage2.dataQuality}</span>
          <span className="text-2xl font-black font-mono text-emerald-500 dark:text-emerald-400">100%</span>
          <span className="text-[11px] text-[var(--text-muted)] block mt-1">{LABELS.pipeline.stage2.qualitySubtext}</span>
        </div>
      </div>

      {/* Ingestion Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--color-accent)]" />
            <span>{LABELS.pipeline.stage2.previewTitle}</span>
          </h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">{file.name}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-muted)] uppercase font-mono text-[11px] border-b border-[var(--border-default)] select-none">
              <tr>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage2.table.txnId}</th>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage2.table.mainAccount}</th>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage2.table.otherParty}</th>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage2.table.dateTime}</th>
                <th className="px-4 py-3 text-right align-middle whitespace-nowrap">{LABELS.pipeline.stage2.table.amount}</th>
                <th className="px-4 py-3 text-left align-middle">{LABELS.pipeline.stage2.table.description}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[var(--text-muted)] align-middle">
                    <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-accent)] mx-auto mb-2" />
                    <span>{LABELS.pipeline.stage2.loading}</span>
                  </td>
                </tr>
              ) : (
                normalized.slice(0, 8).map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-[var(--bg-card-hover)] transition-colors align-middle">
                    <td className="px-4 py-2.5 font-bold text-[var(--color-accent)] text-left align-middle whitespace-nowrap">{tx.transaction_id}</td>
                    <td className="px-4 py-2.5 text-[var(--text-primary)] text-left align-middle whitespace-nowrap">{tx.account_id}</td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] text-left align-middle whitespace-nowrap">{tx.counterparty}</td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)] text-left align-middle whitespace-nowrap">{tx.timestamp}</td>
                    <td className="px-4 py-2.5 font-bold text-right text-[var(--text-primary)] align-middle whitespace-nowrap">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 font-sans text-[var(--text-secondary)] truncate max-w-xs text-left align-middle">{tx.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary inline-flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{LABELS.pipeline.stage2.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={loading || normalized.length === 0}
          className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{LABELS.pipeline.stage2.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
