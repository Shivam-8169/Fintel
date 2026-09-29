import React, { useState } from 'react';
import { LABELS } from '../constants/labels';
import { PipelineStepper } from '../components/pipeline/PipelineStepper';
import { Stage1Upload } from '../components/pipeline/stages/Stage1Upload';
import { Stage2Ingestion } from '../components/pipeline/stages/Stage2Ingestion';
import { Stage3Detection } from '../components/pipeline/stages/Stage3Detection';
import { Stage4SuspiciousTxns } from '../components/pipeline/stages/Stage4SuspiciousTxns';
import { Stage5RiskScore } from '../components/pipeline/stages/Stage5RiskScore';
import { Stage6Graph } from '../components/pipeline/stages/Stage6Graph';
import { Stage7AIInvestigation } from '../components/pipeline/stages/Stage7AIInvestigation';
import { Stage8Evidence } from '../components/pipeline/stages/Stage8Evidence';
import { Stage9SARDraft } from '../components/pipeline/stages/Stage9SARDraft';
import { Stage10HumanReview } from '../components/pipeline/stages/Stage10HumanReview';
import {
  PipelineState,
  NormalizedTransaction,
  EntityRiskScore,
  GraphData,
  EvidenceMatrixItem,
  FIU_IND_SARDraft
} from '../types';

export const InvestigationPipeline: React.FC = () => {
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    currentStep: 1,
    maxCompletedStep: 1,
    file: null,
    fileName: '',
    fileSize: 0,
    ingestedRecords: [],
    totalRecords: 0,
    accountCount: 0,
    flaggedTransactions: [],
    entityRisk: null,
    graphData: null,
    investigationNarrative: null,
    evidenceItems: [],
    fiuSarDraft: null,
    humanReview: {
      status: 'DRAFT',
      reviewedBy: 'Compliance Officer (Lead)',
      investigatorNotes: '',
      checklist: {
        suspectKycVerified: true,
        evidenceValidated: true,
        typologyConfirmed: true,
        narrativeApproved: true
      }
    }
  });

  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState<string | null>(null);

  const goToStep = (step: number) => {
    if (step <= pipelineState.maxCompletedStep + 1) {
      setPipelineState((prev) => ({ ...prev, currentStep: step }));
    }
  };

  const advanceStep = (nextStep: number) => {
    setPipelineState((prev) => ({
      ...prev,
      currentStep: nextStep,
      maxCompletedStep: Math.max(prev.maxCompletedStep, nextStep)
    }));
  };

  // Stage 1 Handlers
  const handleFileValidated = (file: File) => {
    setPipelineState((prev) => ({
      ...prev,
      file,
      fileName: file.name,
      fileSize: file.size
    }));
  };

  // Stage 2 Handlers
  const handleIngestionComplete = (
    records: NormalizedTransaction[],
    totalCount: number,
    accountCount: number
  ) => {
    setPipelineState((prev) => ({
      ...prev,
      ingestedRecords: records,
      totalRecords: totalCount,
      accountCount
    }));
  };

  // Stage 3 Handlers
  const handleDetectionComplete = (flagged: NormalizedTransaction[]) => {
    setPipelineState((prev) => ({
      ...prev,
      flaggedTransactions: flagged
    }));
  };

  // Stage 5 Handlers
  const handleRiskCalculated = (risk: EntityRiskScore) => {
    setPipelineState((prev) => ({
      ...prev,
      entityRisk: risk
    }));
  };

  // Stage 6 Handlers
  const handleGraphReady = (graphData: GraphData) => {
    setPipelineState((prev) => ({
      ...prev,
      graphData
    }));
  };

  // Stage 7 Handlers
  const handleNarrativeGenerated = (narrative: any, evidenceItems: EvidenceMatrixItem[]) => {
    setPipelineState((prev) => ({
      ...prev,
      investigationNarrative: narrative,
      evidenceItems
    }));
  };

  // Stage 8 Selection from Stage 7
  const handleSelectEvidenceChip = (evId: string) => {
    setHighlightedEvidenceId(evId);
    goToStep(8);
  };

  // Stage 9 Handlers
  const handleDraftGenerated = (draft: FIU_IND_SARDraft) => {
    setPipelineState((prev) => ({
      ...prev,
      fiuSarDraft: draft
    }));
  };

  // Stage 10 Handlers
  const handleFinalized = (decision: 'APPROVED' | 'REJECTED', notes: string) => {
    setPipelineState((prev) => ({
      ...prev,
      humanReview: {
        ...prev.humanReview,
        status: decision,
        investigatorNotes: notes,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const primaryEntityId =
    pipelineState.entityRisk?.entityId ||
    pipelineState.flaggedTransactions[0]?.account_id ||
    'ACC-PASS-THROUGH';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Investigation Pipeline Header Badge */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="pulse-badge">
            <span className="pulse-beacon" />
            <span>{LABELS.pipeline.badge}</span>
          </div>
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">• {LABELS.pipeline.badgeSubtitle}</span>
        </div>
      </div>

      {/* Persistent Stepper Component */}
      <PipelineStepper
        currentStep={pipelineState.currentStep}
        maxCompletedStep={pipelineState.maxCompletedStep}
        onSelectStep={goToStep}
      />

      {/* Focused Stage Panel */}
      <div className="pulse-card rounded-2xl p-6 md:p-8 shadow-xs">
        {pipelineState.currentStep === 1 && (
          <Stage1Upload
            currentFile={pipelineState.file}
            onFileValidated={handleFileValidated}
            onProceed={() => advanceStep(2)}
          />
        )}

        {pipelineState.currentStep === 2 && pipelineState.file && (
          <Stage2Ingestion
            file={pipelineState.file}
            existingRecords={pipelineState.ingestedRecords}
            onIngestionComplete={handleIngestionComplete}
            onProceed={() => advanceStep(3)}
            onBack={() => goToStep(1)}
          />
        )}

        {pipelineState.currentStep === 3 && (
          <Stage3Detection
            records={pipelineState.ingestedRecords}
            onDetectionComplete={handleDetectionComplete}
            onProceed={() => advanceStep(4)}
            onBack={() => goToStep(2)}
          />
        )}

        {pipelineState.currentStep === 4 && (
          <Stage4SuspiciousTxns
            flaggedTransactions={pipelineState.flaggedTransactions}
            onProceed={() => advanceStep(5)}
            onBack={() => goToStep(3)}
          />
        )}

        {pipelineState.currentStep === 5 && (
          <Stage5RiskScore
            flaggedTransactions={pipelineState.flaggedTransactions}
            existingRisk={pipelineState.entityRisk}
            onRiskCalculated={handleRiskCalculated}
            onProceed={() => advanceStep(6)}
            onBack={() => goToStep(4)}
          />
        )}

        {pipelineState.currentStep === 6 && (
          <Stage6Graph
            flaggedTransactions={pipelineState.flaggedTransactions}
            entityId={primaryEntityId}
            existingGraphData={pipelineState.graphData}
            onGraphReady={handleGraphReady}
            onProceed={() => advanceStep(7)}
            onBack={() => goToStep(5)}
          />
        )}

        {pipelineState.currentStep === 7 && (
          <Stage7AIInvestigation
            entityId={primaryEntityId}
            flaggedTransactions={pipelineState.flaggedTransactions}
            existingNarrative={pipelineState.investigationNarrative}
            onNarrativeGenerated={handleNarrativeGenerated}
            onSelectEvidence={handleSelectEvidenceChip}
            onProceed={() => advanceStep(8)}
            onBack={() => goToStep(6)}
          />
        )}

        {pipelineState.currentStep === 8 && (
          <Stage8Evidence
            evidenceItems={pipelineState.evidenceItems}
            highlightedEvidenceId={highlightedEvidenceId}
            onProceed={() => advanceStep(9)}
            onBack={() => goToStep(7)}
          />
        )}

        {pipelineState.currentStep === 9 && (
          <Stage9SARDraft
            entityId={primaryEntityId}
            flaggedTransactions={pipelineState.flaggedTransactions}
            existingDraft={pipelineState.fiuSarDraft}
            onDraftGenerated={handleDraftGenerated}
            onProceed={() => advanceStep(10)}
            onBack={() => goToStep(8)}
          />
        )}

        {pipelineState.currentStep === 10 && pipelineState.fiuSarDraft && (
          <Stage10HumanReview
            fiuSarDraft={pipelineState.fiuSarDraft}
            entityId={primaryEntityId}
            onBack={() => goToStep(9)}
            onFinalized={handleFinalized}
          />
        )}
      </div>
    </div>
  );
};
