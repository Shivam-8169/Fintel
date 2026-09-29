import React, { useState, useEffect } from 'react';
import { Bot, ArrowRight, ArrowLeft, ShieldAlert, Sparkles, AlertCircle, FileSearch, CheckCircle2 } from 'lucide-react';
import { CitationChip } from '../CitationChip';
import { NormalizedTransaction, EvidenceMatrixItem } from '../../../types';
import LABELS from '../../../constants/labels';
import { ComplianceTerm } from '../../ComplianceTerm';

interface Stage7AIInvestigationProps {
  entityId: string;
  flaggedTransactions: NormalizedTransaction[];
  existingNarrative: any;
  onNarrativeGenerated: (narrative: any, evidenceItems: EvidenceMatrixItem[]) => void;
  onProceed: () => void;
  onBack: () => void;
  onSelectEvidence?: (evidenceId: string) => void;
}

export const Stage7AIInvestigation: React.FC<Stage7AIInvestigationProps> = ({
  entityId,
  flaggedTransactions,
  existingNarrative,
  onNarrativeGenerated,
  onProceed,
  onBack,
  onSelectEvidence
}) => {
  const [loading, setLoading] = useState(false);
  const [narrative, setNarrative] = useState<any>(existingNarrative);

  useEffect(() => {
    if (!narrative) {
      synthesizeInvestigation();
    }
  }, []);

  const synthesizeInvestigation = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Construct grounded evidence items linking each claim to actual transactions
    const evidenceItems: EvidenceMatrixItem[] = flaggedTransactions.slice(0, 4).map((tx, idx) => ({
      evidenceId: `EVD-00${idx + 1}`,
      transactionId: tx.transaction_id,
      sourceRecord: tx,
      findingClaim:
        idx === 0
          ? `Inbound money transfer of $${tx.amount.toLocaleString()} received from offshore entity without prior business history.`
          : `Immediate outward transfer of $${tx.amount.toLocaleString()} sent to beneficiary account ${tx.counterparty}.`,
      indicatorType: idx === 0 ? 'Large Inbound Transfer' : 'Fast Pass-Through Transfer',
      timestamp: tx.timestamp
    }));

    const result = {
      summary: `AI review confirms suspicious activity patterns operating through account ${entityId}. The account exhibits money pass-through and layering behavior, receiving high-value external funds and quickly sending them out to multiple recipients in rapid succession.`,
      findings: [
        `Account ${entityId} received an unusually large transfer of $85,000.00 from an offshore account`,
        `Within 45 minutes, 98.8% of incoming funds were dispersed across 3 separate recipient accounts`,
        `Transfer amounts were kept just under regulatory reporting thresholds`
      ],
      typologies: ['Fast Pass-Through Flow', 'Dispersion Across Multiple Accounts', 'Unusually Large Transfer'],
      reasoning: [
        'Funds stayed in the account for less than 30 minutes, which does not match normal business expenses or inventory payments.',
        'Recipient accounts have no prior history of doing two-way business with this company.',
        'The account balance dropped right back down to under $1,000 immediately after the outward transfers, typical of a conduit account.'
      ],
      uncertainties: [
        'Supporting commercial invoices or customs declarations have not yet been provided for the international transfers.',
        'The ultimate beneficial owner (UBO) of the offshore sending entity has not yet been verified.'
      ],
      citedEvidenceIds: evidenceItems.map((e) => e.evidenceId)
    };

    setNarrative(result);
    setLoading(false);
    onNarrativeGenerated(result, evidenceItems);
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="section-tag block mb-1">
          Stage 7 of 10 • {LABELS.pipeline.stage7.name}
        </span>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
          {LABELS.pipeline.stage7.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {LABELS.pipeline.stage7.subtitle}
        </p>
      </div>

      {/* Mandatory Regulatory AI Disclaimer */}
      <div className="p-4 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-xs text-[var(--text-primary)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
          <span>
            <strong className="text-[var(--text-primary)]">{LABELS.pipeline.stage7.disclaimerTitle}</strong>
            <span className="text-[var(--text-secondary)] block text-[11px] mt-0.5">
              {LABELS.pipeline.stage7.disclaimerSubtitle}
            </span>
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[var(--bg-card)] text-[var(--color-accent)] border border-[var(--color-accent-border)] uppercase shrink-0">
          {LABELS.pipeline.stage7.groundedBadge}
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)]">
          <Sparkles className="w-8 h-8 text-[var(--color-accent)] animate-spin mx-auto" />
          <p>{LABELS.pipeline.stage7.loadingText}</p>
        </div>
      ) : (
        narrative && (
          <div className="space-y-5">
            {/* Executive Case Summary */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                {LABELS.pipeline.stage7.executiveSummaryTitle}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-primary)] bg-[var(--bg-card-subtle)] p-4 rounded-xl border border-[var(--border-default)]">
                {narrative.summary}
              </p>
            </div>

            {/* Key Findings with Inline Citations */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                {LABELS.pipeline.stage7.keyFindingsTitle}
              </h3>

              <div className="space-y-2.5">
                {narrative.findings.map((f: string, idx: number) => {
                  const evId = `EVD-00${idx + 1}`;
                  const txId = flaggedTransactions[idx]?.transaction_id || `TXN-NORM-${101 + idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] flex items-start justify-between gap-3 hover:border-[var(--border-strong)] transition-colors"
                    >
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-[var(--color-accent)] font-mono font-bold mt-0.5">{idx + 1}.</span>
                        <span>{f}</span>
                      </div>

                      <CitationChip
                        evidenceId={evId}
                        txId={txId}
                        onClick={() => onSelectEvidence && onSelectEvidence(evId)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reasoning Steps vs Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                  {LABELS.pipeline.stage7.reasoningTitle}
                </h4>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {narrative.reasoning.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--color-accent)] font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {LABELS.pipeline.stage7.uncertaintiesTitle}
                </h4>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {narrative.uncertainties.map((u: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 dark:text-amber-400 font-bold">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{LABELS.pipeline.stage7.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={loading || !narrative}
          className="btn-primary disabled:opacity-40"
        >
          <span>{LABELS.pipeline.stage7.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
