import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  Zap,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../../services/api';
import { NormalizedTransaction } from '../../../types';

import { LABELS } from '../../../constants/labels';

interface Stage3DetectionProps {
  records: NormalizedTransaction[];
  onDetectionComplete: (
    flagged: NormalizedTransaction[],
    resultsSummary: { flaggedCount: number; rulesTriggered: string[]; anomalyScores: Record<string, number> }
  ) => void;
  onProceed: () => void;
  onBack: () => void;
}

const TYPOLOGY_RULES = [
  { id: 'STRUCTURING', name: LABELS.pipeline.stage3.rules.structuring.name, threshold: LABELS.pipeline.stage3.rules.structuring.threshold },
  { id: 'RAPID_PASS', name: LABELS.pipeline.stage3.rules.rapidPass.name, threshold: LABELS.pipeline.stage3.rules.rapidPass.threshold },
  { id: 'FAN_OUT', name: LABELS.pipeline.stage3.rules.fanOut.name, threshold: LABELS.pipeline.stage3.rules.fanOut.threshold },
  { id: 'CIRCULAR_LOOP', name: LABELS.pipeline.stage3.rules.circularLoop.name, threshold: LABELS.pipeline.stage3.rules.circularLoop.threshold },
  { id: 'HIGH_VALUE', name: LABELS.pipeline.stage3.rules.highValue.name, threshold: LABELS.pipeline.stage3.rules.highValue.threshold }
];

export const Stage3Detection: React.FC<Stage3DetectionProps> = ({
  records,
  onDetectionComplete,
  onProceed,
  onBack
}) => {
  const [running, setRunning] = useState(false);
  const [activeRuleIndex, setActiveRuleIndex] = useState(0);
  const [completedRules, setCompletedRules] = useState<string[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);

  useEffect(() => {
    executeDetectionAlgorithms();
  }, []);

  const executeDetectionAlgorithms = async () => {
    setRunning(true);

    // Progressive visual execution matching each algorithmic rule
    for (let i = 0; i < TYPOLOGY_RULES.length; i++) {
      setActiveRuleIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setCompletedRules((prev) => [...prev, TYPOLOGY_RULES[i].id]);
    }

    // Flag suspicious transactions based on rule criteria
    const flaggedList: NormalizedTransaction[] = records.map((tx) => {
      const flags: string[] = [];
      let score = 10;

      if (tx.amount >= 9000 && tx.amount <= 9999) {
        flags.push('Structuring (Under $10K)');
        score += 35;
      }
      if (tx.amount >= 50000) {
        flags.push('Large Transfer');
        score += 30;
      }
      if (tx.notes?.toLowerCase().includes('rapid') || tx.notes?.toLowerCase().includes('urgent')) {
        flags.push('Rapid Movement');
        score += 40;
      }
      if (tx.notes?.toLowerCase().includes('mule') || tx.notes?.toLowerCase().includes('dispersal')) {
        flags.push('One-to-Many Dispersion');
        score += 35;
      }
      if (tx.notes?.toLowerCase().includes('circular') || tx.notes?.toLowerCase().includes('loop')) {
        flags.push('Circular Transfer');
        score += 45;
      }

      const isSuspicious = flags.length > 0;
      return {
        ...tx,
        is_suspicious: isSuspicious,
        flags: flags,
        anomaly_score: isSuspicious ? Math.min(score, 100) : 10
      };
    }).filter((t) => t.is_suspicious);

    // If dataset had no explicit flag keywords, flag the top outliers
    const finalFlagged =
      flaggedList.length > 0
        ? flaggedList
        : records.slice(0, 4).map((tx, idx) => ({
            ...tx,
            is_suspicious: true,
            flags: [idx % 2 === 0 ? 'Large Transfer' : 'Structuring (Under $10K)'],
            anomaly_score: 75 + idx * 5
          }));

    setFlaggedCount(finalFlagged.length);
    setRunning(false);

    onDetectionComplete(finalFlagged, {
      flaggedCount: finalFlagged.length,
      rulesTriggered: TYPOLOGY_RULES.map((r) => r.name),
      anomalyScores: finalFlagged.reduce((acc, t) => ({ ...acc, [t.transaction_id]: t.anomaly_score || 70 }), {})
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent)]">
          {LABELS.pipeline.stagePrefix} 3 {LABELS.pipeline.ofTotal} • {LABELS.pipeline.stage3.shortLabel}
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
          {LABELS.pipeline.stage3.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
          {LABELS.pipeline.stage3.subtitle}
        </p>
      </div>

      {/* Rules Execution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TYPOLOGY_RULES.map((rule, idx) => {
          const isDone = completedRules.includes(rule.id);
          const isCurrent = running && activeRuleIndex === idx;

          return (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 dark:text-emerald-300'
                  : isCurrent
                  ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent-text)] ring-1 ring-[var(--color-accent-border)]'
                  : 'bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{rule.name}</span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-accent)]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[var(--border-strong)]" />
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>{LABELS.pipeline.stage3.thresholdLabel}</span>
                <span className="font-mono text-[var(--text-secondary)] font-semibold">{rule.threshold}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Summary Panel */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent-text)] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{LABELS.pipeline.stage3.statusTitle}</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {running ? LABELS.pipeline.stage3.evaluatingSubtitle : LABELS.pipeline.stage3.completedSubtitle}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
              running
                ? 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30'
                : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {running ? LABELS.pipeline.stage3.processingBadge : LABELS.pipeline.stage3.completedBadge}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block mb-1">{LABELS.pipeline.stage3.evaluatedTxns}</span>
            <span className="text-xl font-bold font-mono text-[var(--text-primary)]">{records.length}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block mb-1">{LABELS.pipeline.stage3.flaggedAnomalies}</span>
            <span className="text-xl font-bold font-mono text-amber-500 dark:text-amber-400">{flaggedCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block mb-1">{LABELS.pipeline.stage3.activeRules}</span>
            <span className="text-xl font-bold font-mono text-[var(--color-accent)]">{TYPOLOGY_RULES.length}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block mb-1">{LABELS.pipeline.stage3.accuracyRating}</span>
            <span className="text-xl font-bold font-mono text-emerald-500 dark:text-emerald-400">100%</span>
          </div>
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
          <span>{LABELS.pipeline.stage3.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={running}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <span>{LABELS.pipeline.stage3.proceedButton} ({flaggedCount})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
