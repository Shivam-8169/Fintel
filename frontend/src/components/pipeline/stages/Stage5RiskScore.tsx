import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, ArrowLeft, ShieldAlert, Award, AlertOctagon, HelpCircle } from 'lucide-react';
import { EntityRiskScore, NormalizedTransaction } from '../../../types';

import { LABELS } from '../../../constants/labels';

interface Stage5RiskScoreProps {
  flaggedTransactions: NormalizedTransaction[];
  existingRisk: EntityRiskScore | null;
  onRiskCalculated: (risk: EntityRiskScore) => void;
  onProceed: () => void;
  onBack: () => void;
}

export const Stage5RiskScore: React.FC<Stage5RiskScoreProps> = ({
  flaggedTransactions,
  existingRisk,
  onRiskCalculated,
  onProceed,
  onBack
}) => {
  const [risk, setRisk] = useState<EntityRiskScore | null>(existingRisk);

  useEffect(() => {
    if (!risk) {
      calculateEntityRisk();
    }
  }, []);

  const calculateEntityRisk = () => {
    // Identify primary focal account from flagged transactions
    const accountCounts: Record<string, number> = {};
    flaggedTransactions.forEach((tx) => {
      accountCounts[tx.account_id] = (accountCounts[tx.account_id] || 0) + 1;
    });

    const focalEntity =
      Object.keys(accountCounts).sort((a, b) => accountCounts[b] - accountCounts[a])[0] || 'ACC-PASS-THROUGH';

    // Construct explainable risk indicator points
    const breakdown = [
      {
        indicator: 'Rapid Fund Pass-Through Velocity',
        score: 35,
        rationale: 'Funds moved through connected counterparties in tranches within a 45-minute temporal window.'
      },
      {
        indicator: 'High-Value Outlier Volume',
        score: 30,
        rationale: 'Gross transfer volume exceeds $50,000 baseline threshold for non-corporate account.'
      },
      {
        indicator: 'Counterparty Fan-Out Dispersion',
        score: 25,
        rationale: 'Disbursements split across 3+ unverified shell accounts in immediate succession.'
      }
    ];

    const composite = Math.min(
      breakdown.reduce((sum, item) => sum + item.score, 0),
      100
    );

    const level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
      composite >= 80 ? 'CRITICAL' : composite >= 60 ? 'HIGH' : composite >= 40 ? 'MEDIUM' : 'LOW';

    const calculated: EntityRiskScore = {
      entityId: focalEntity,
      accountType: 'CURRENT / BUSINESS',
      customerName: 'Global Trade & Logistics Ltd.',
      compositeScore: composite,
      riskLevel: level,
      breakdown
    };

    setRisk(calculated);
    onRiskCalculated(calculated);
  };

  if (!risk) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        {LABELS.pipeline.stage5.computingText}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent)]">
          {LABELS.pipeline.stagePrefix} 5 {LABELS.pipeline.ofTotal} • {LABELS.pipeline.stage5.shortLabel}
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
          {LABELS.pipeline.stage5.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
          {LABELS.pipeline.stage5.subtitle}
        </p>
      </div>

      {/* Hero Score Gauge */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-semibold tracking-wider text-[var(--text-muted)]">
              {LABELS.pipeline.stage5.mainAccountLabel}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]">
              {risk.accountType}
            </span>
          </div>
          <h3 className="text-2xl font-black font-mono text-[var(--text-primary)]">{risk.entityId}</h3>
          <p className="text-xs text-[var(--text-secondary)]">Customer: {risk.customerName}</p>
        </div>

        <div className="flex items-center gap-4 bg-[var(--bg-card-subtle)] p-5 rounded-2xl border border-[var(--border-default)]">
          <div className="text-right">
            <span className="text-xs text-[var(--text-muted)] block">{LABELS.pipeline.stage5.overallRatingLabel}</span>
            <span
              className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block mt-0.5 ${
                risk.riskLevel === 'CRITICAL'
                  ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {risk.riskLevel} RISK
            </span>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border-2 border-rose-500/60 flex flex-col items-center justify-center shadow-lg shadow-rose-950/20">
            <span className="text-3xl font-black font-mono text-rose-500 dark:text-rose-400">{risk.compositeScore}</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{LABELS.pipeline.stage5.scoreOutOf100}</span>
          </div>
        </div>
      </div>

      {/* Contributing Indicators Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--color-accent)]" />
            <span>{LABELS.pipeline.stage5.whyTitle}</span>
          </h3>
          <span className="text-xs text-[var(--text-muted)]">{LABELS.pipeline.stage5.pointsBreakdownLabel}</span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {risk.breakdown.map((item, idx) => (
            <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="space-y-1">
                <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  {item.indicator}
                </span>
                <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">{item.rationale}</p>
              </div>

              <span className="px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 font-mono font-bold text-xs shrink-0">
                +{item.score} pts
              </span>
            </div>
          ))}
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
          <span>{LABELS.pipeline.stage5.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <span>{LABELS.pipeline.stage5.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default Stage5RiskScore;
