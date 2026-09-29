import React from 'react';
import {
  UploadCloud,
  FileCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Network,
  Bot,
  FileSearch,
  FileText,
  UserCheck,
  Check,
  ChevronRight
} from 'lucide-react';

import { LABELS } from '../../constants/labels';

export interface StepDefinition {
  id: number;
  name: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PIPELINE_STEPS: StepDefinition[] = [
  { id: 1, name: LABELS.pipeline.stage1.name, shortLabel: LABELS.pipeline.stage1.shortLabel, icon: UploadCloud },
  { id: 2, name: LABELS.pipeline.stage2.name, shortLabel: LABELS.pipeline.stage2.shortLabel, icon: FileCheck },
  { id: 3, name: LABELS.pipeline.stage3.name, shortLabel: LABELS.pipeline.stage3.shortLabel, icon: ShieldAlert },
  { id: 4, name: LABELS.pipeline.stage4.name, shortLabel: LABELS.pipeline.stage4.shortLabel, icon: AlertTriangle },
  { id: 5, name: LABELS.pipeline.stage5.name, shortLabel: LABELS.pipeline.stage5.shortLabel, icon: Activity },
  { id: 6, name: LABELS.pipeline.stage6.name, shortLabel: LABELS.pipeline.stage6.shortLabel, icon: Network },
  { id: 7, name: LABELS.pipeline.stage7.name, shortLabel: LABELS.pipeline.stage7.shortLabel, icon: Bot },
  { id: 8, name: LABELS.pipeline.stage8.name, shortLabel: LABELS.pipeline.stage8.shortLabel, icon: FileSearch },
  { id: 9, name: LABELS.pipeline.stage9.name, shortLabel: LABELS.pipeline.stage9.shortLabel, icon: FileText },
  { id: 10, name: LABELS.pipeline.stage10.name, shortLabel: LABELS.pipeline.stage10.shortLabel, icon: UserCheck },
];

interface PipelineStepperProps {
  currentStep: number;
  maxCompletedStep: number;
  onSelectStep: (stepId: number) => void;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStep,
  maxCompletedStep,
  onSelectStep
}) => {
  const currentStepDef = PIPELINE_STEPS.find((s) => s.id === currentStep) || PIPELINE_STEPS[0];
  const progressPercent = Math.round((currentStep / PIPELINE_STEPS.length) * 100);

  return (
    <div className="w-full pulse-card rounded-2xl shadow-xs transition-colors duration-200">
      {/* 1. Mobile & Tablet Compact View (< 1024px) */}
      <div className="lg:hidden p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] font-semibold">
              {LABELS.pipeline.stagePrefix} {currentStep} {LABELS.pipeline.ofTotal}
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{currentStepDef.name}</span>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{progressPercent}% {LABELS.pipeline.progressCompleted}</span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[var(--color-accent)] h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Stepper Pills on Narrow */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1 pb-0.5 scrollbar-thin">
          {PIPELINE_STEPS.map((step) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id <= maxCompletedStep && step.id !== currentStep;
            const isLocked = step.id > maxCompletedStep + 1;
            const canClick = step.id <= maxCompletedStep + 1;

            return (
              <button
                key={step.id}
                type="button"
                disabled={isLocked}
                onClick={() => canClick && onSelectStep(step.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-[var(--color-accent)] text-white shadow-xs font-bold'
                    : isCompleted
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : isLocked
                    ? 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                {step.id}. {step.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Desktop Full Horizontal Stepper (>= 1024px) */}
      <div className="hidden lg:block p-6">
        <div className="flex items-center justify-between relative">
          {PIPELINE_STEPS.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isLocked = step.id > maxCompletedStep + 1;
            const canClick = step.id <= maxCompletedStep + 1;
            const isLast = index === PIPELINE_STEPS.length - 1;

            return (
              <div key={step.id} className="flex-1 flex flex-col items-center relative group">
                {/* Connecting Line between steps */}
                {!isLast && (
                  <div
                    className={`absolute top-4 left-[50%] right-[-50%] h-[2px] transition-colors duration-200 z-0 ${
                      step.id < currentStep ? 'bg-emerald-500' : 'bg-[var(--border-subtle)]'
                    }`}
                  />
                )}

                {/* Step Circle Button */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => canClick && onSelectStep(step.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition-all ${
                    isCurrent
                      ? 'bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent-subtle)] shadow-sm scale-110'
                      : isCompleted
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : isLocked
                      ? 'bg-[var(--bg-card-subtle)] border-2 border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                      : 'bg-[var(--bg-card)] border-2 border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                  }`}
                  title={`${step.id}. ${step.name}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-2.5 text-center px-1">
                  <span
                    className={`block text-[11px] leading-tight transition-colors ${
                      isCurrent
                        ? 'font-bold text-[var(--text-primary)]'
                        : isCompleted
                        ? 'font-medium text-emerald-500'
                        : isLocked
                        ? 'text-[var(--text-muted)] font-normal'
                        : 'text-[var(--text-secondary)] font-medium group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {step.shortLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default PipelineStepper;
