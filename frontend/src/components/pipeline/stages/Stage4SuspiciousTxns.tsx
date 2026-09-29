import React from 'react';
import { AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { NormalizedTransaction } from '../../../types';
import { LABELS } from '../../../constants/labels';

interface Stage4SuspiciousTxnsProps {
  flaggedTransactions: NormalizedTransaction[];
  onProceed: () => void;
  onBack: () => void;
}

export const Stage4SuspiciousTxns: React.FC<Stage4SuspiciousTxnsProps> = ({
  flaggedTransactions,
  onProceed,
  onBack
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent)]">
          {LABELS.pipeline.stagePrefix} 4 {LABELS.pipeline.ofTotal} • {LABELS.pipeline.stage4.shortLabel}
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
          {LABELS.pipeline.stage4.title} ({flaggedTransactions.length})
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
          {LABELS.pipeline.stage4.subtitle}
        </p>
      </div>

      {/* Flagged Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>{LABELS.pipeline.stage4.tableTitle}</span>
          </h3>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
            {flaggedTransactions.length} {LABELS.pipeline.stage4.flaggedCountBadge}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-muted)] uppercase font-mono text-[11px] border-b border-[var(--border-default)] select-none">
              <tr>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage4.table.txnId}</th>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage4.table.mainAccount}</th>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage4.table.otherParty}</th>
                <th className="px-4 py-3 text-right align-middle whitespace-nowrap">{LABELS.pipeline.stage4.table.amount}</th>
                <th className="px-4 py-3 text-left align-middle whitespace-nowrap">{LABELS.pipeline.stage4.table.dateTime}</th>
                <th className="px-4 py-3 text-left align-middle">{LABELS.pipeline.stage4.table.reason}</th>
                <th className="px-4 py-3 text-right align-middle whitespace-nowrap">{LABELS.pipeline.stage4.table.riskLevel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
              {flaggedTransactions.map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-[var(--bg-card-hover)] transition-colors align-middle">
                  <td className="px-4 py-3 font-bold text-[var(--color-accent)] align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>{tx.transaction_id}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)] text-left align-middle whitespace-nowrap">{tx.account_id}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-left align-middle whitespace-nowrap">{tx.counterparty}</td>
                  <td className="px-4 py-3 font-bold text-right text-[var(--text-primary)] align-middle whitespace-nowrap">
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-left align-middle whitespace-nowrap">{tx.timestamp}</td>
                  <td className="px-4 py-3 font-sans text-left align-middle">
                    <div className="flex flex-wrap gap-1">
                      {tx.flags && tx.flags.length > 0 ? (
                        tx.flags.map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 whitespace-nowrap"
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 whitespace-nowrap">
                          High Risk Anomaly
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-black align-middle whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-mono leading-none ${
                        (tx.anomaly_score || 70) >= 80
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {tx.anomaly_score || 75}/100
                    </span>
                  </td>
                </tr>
              ))}
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
          <span>{LABELS.pipeline.stage4.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <span>{LABELS.pipeline.stage4.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default Stage4SuspiciousTxns;
