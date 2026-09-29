import React, { useState } from 'react';
import { FileSearch, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { EvidenceMatrixItem } from '../../../types';
import LABELS from '../../../constants/labels';

interface Stage8EvidenceProps {
  evidenceItems: EvidenceMatrixItem[];
  highlightedEvidenceId?: string | null;
  onProceed: () => void;
  onBack: () => void;
}

export const Stage8Evidence: React.FC<Stage8EvidenceProps> = ({
  evidenceItems,
  highlightedEvidenceId,
  onProceed,
  onBack
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(highlightedEvidenceId || null);

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="section-tag block mb-1">
          Stage 8 of 10 • {LABELS.pipeline.stage8.name}
        </span>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
          {LABELS.pipeline.stage8.title} ({evidenceItems.length})
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {LABELS.pipeline.stage8.subtitle}
        </p>
      </div>

      {/* Evidence Ledger Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-[var(--color-accent)]" />
            {LABELS.pipeline.stage8.claimMapTitle}
          </h3>
          <span className="text-xs font-mono text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4" /> {LABELS.pipeline.stage8.coverageBadge}
          </span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {evidenceItems.map((ev) => {
            const isSelected = selectedId === ev.evidenceId;

            return (
              <div
                key={ev.evidenceId}
                onClick={() => setSelectedId(isSelected ? null : ev.evidenceId)}
                className={`p-5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--color-accent-subtle)] border-l-4 border-[var(--color-accent)] ring-1 ring-[var(--color-accent-border)]'
                    : 'hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] font-mono font-bold text-xs">
                      {ev.evidenceId}
                    </span>
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                      {LABELS.pipeline.stage8.sourceTx}: <span className="text-[var(--color-accent)]">{ev.transactionId}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                      {ev.indicatorType}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-[var(--text-muted)]">{ev.timestamp}</span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card-subtle)] p-3 rounded-xl border border-[var(--border-default)] mb-3">
                  <strong className="text-[var(--text-muted)] block text-[11px] mb-0.5">{LABELS.pipeline.stage8.whatAiSaid}</strong>
                  {ev.findingClaim}
                </p>

                {/* Expanded Raw Transaction Record */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[var(--bg-card-subtle)] p-3.5 rounded-xl border border-[var(--border-default)] font-mono">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">{LABELS.pipeline.stage8.transactedAmount}</span>
                    <span className="font-bold text-emerald-500 dark:text-emerald-400 text-sm">
                      ${ev.sourceRecord.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">{LABELS.pipeline.stage8.mainAccount}</span>
                    <span className="text-[var(--text-primary)]">{ev.sourceRecord.account_id}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">{LABELS.pipeline.stage8.otherParty}</span>
                    <span className="text-[var(--text-primary)]">{ev.sourceRecord.counterparty}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">{LABELS.pipeline.stage8.directionMethod}</span>
                    <span className="text-[var(--color-accent)]">
                      {ev.sourceRecord.direction || 'DEBIT'} • WIRE
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{LABELS.pipeline.stage8.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="btn-primary"
        >
          <span>{LABELS.pipeline.stage8.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
