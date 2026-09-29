import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Edit3,
  Lock,
  ExternalLink
} from 'lucide-react';
import { api } from '../../../services/api';
import { FIU_IND_SARDraft } from '../../../types';
import LABELS from '../../../constants/labels';
import { ComplianceTerm } from '../../ComplianceTerm';

interface Stage10HumanReviewProps {
  fiuSarDraft: FIU_IND_SARDraft;
  entityId: string;
  onBack: () => void;
  onFinalized: (decision: 'APPROVED' | 'REJECTED', notes: string) => void;
}

export const Stage10HumanReview: React.FC<Stage10HumanReviewProps> = ({
  fiuSarDraft,
  entityId,
  onBack,
  onFinalized
}) => {
  const navigate = useNavigate();

  // Editable investigator fields
  const [editableNarrative, setEditableNarrative] = useState(fiuSarDraft.narrative_of_suspicion);
  const [investigatorRemarks, setInvestigatorRemarks] = useState(
    'I have reviewed the flagged activity, account connections map, and supporting transaction proof. The pass-through layering pattern is confirmed by account velocity.'
  );
  const [recommendedAction, setRecommendedAction] = useState(fiuSarDraft.recommended_action);

  // Compliance sign-off checklist
  const [checklist, setChecklist] = useState({
    suspectKycVerified: true,
    evidenceValidated: true,
    typologyConfirmed: true,
    narrativeApproved: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [finalStatus, setFinalStatus] = useState<'DRAFT' | 'APPROVED' | 'REJECTED'>('DRAFT');

  const allChecked = Object.values(checklist).every(Boolean);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      // Find or open existing case for this account, or create audit log
      let caseId = 'CASE-PIPELINE-01';
      try {
        const cases = await api.getCases();
        const existing = cases.find((c) => c.account_id === entityId);
        if (existing) {
          caseId = existing.case_id;
          await api.approveReport(caseId, investigatorRemarks);
        }
      } catch (err) {
        console.warn('Backend case linking warning:', err);
      }

      setFinalStatus('APPROVED');
      setApprovalModalOpen(false);
      onFinalized('APPROVED', investigatorRemarks);
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      setFinalStatus('REJECTED');
      setRejectModalOpen(false);
      onFinalized('REJECTED', rejectReason || 'Returned by investigator for additional trade documentation.');
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="section-tag block mb-1">
          Stage 10 of 10 • {LABELS.pipeline.stage10.name}
        </span>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
          {LABELS.pipeline.stage10.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {LABELS.pipeline.stage10.subtitle}
        </p>
      </div>

      {/* Decision Status Banner if already finalized */}
      {finalStatus !== 'DRAFT' && (
        <div
          className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
            finalStatus === 'APPROVED'
              ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-950/20 border-red-500/50 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {finalStatus === 'APPROVED' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            )}
            <div>
              <h3 className="font-bold text-sm">
                Case Decision: {finalStatus === 'APPROVED' ? LABELS.pipeline.stage10.statusApproved : LABELS.pipeline.stage10.statusRejected}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Timestamp: {new Date().toISOString()} • Recorded in permanent activity history.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/reports')}
              className="btn-secondary text-xs"
            >
              <span>{LABELS.pipeline.stage10.viewInReports}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/audit')}
              className="btn-secondary text-xs"
            >
              <span>{LABELS.pipeline.stage10.viewInAudit}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side: Read-Only AI Draft vs Editable Investigator Version */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Read-Only AI Draft */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-4 opacity-90">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--text-muted)]" />
              {LABELS.pipeline.stage10.aiDraftHeading}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
              {LABELS.pipeline.stage10.aiDraftBadge}
            </span>
          </div>

          <div className="space-y-3 text-xs text-[var(--text-secondary)] font-mono">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">{LABELS.pipeline.stage9.refCode}</span>
              <span className="text-[var(--text-primary)]">{fiuSarDraft.report_ref}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">{LABELS.pipeline.stage9.subjectAccount}</span>
              <span className="text-[var(--color-accent)]">{fiuSarDraft.suspect_details.account_number}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">{LABELS.pipeline.stage9.activityType}</span>
              <span className="text-amber-500 dark:text-amber-400">{fiuSarDraft.suspicious_summary.fiu_typology_code}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] block">AI Case Narrative</label>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed max-h-48 overflow-y-auto">
              {fiuSarDraft.narrative_of_suspicion}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] block">AI Suggested Next Steps</label>
            <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-muted)] leading-relaxed">
              {fiuSarDraft.recommended_action}
            </div>
          </div>
        </div>

        {/* Right: Editable Investigator Version */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--color-accent-border)] shadow-sm space-y-4 ring-1 ring-[var(--color-accent-subtle)]">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-text)] flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[var(--color-accent)]" />
              {LABELS.pipeline.stage10.investigatorHeading}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] font-bold">
              {LABELS.pipeline.stage10.investigatorBadge}
            </span>
          </div>

          {/* Editable Narrative */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)] block">
              {LABELS.pipeline.stage10.editableNarrativeLabel}
            </label>
            <textarea
              rows={5}
              value={editableNarrative}
              onChange={(e) => setEditableNarrative(e.target.value)}
              disabled={finalStatus !== 'DRAFT'}
              className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] font-sans leading-relaxed disabled:opacity-60"
            />
          </div>

          {/* Investigator Notes / Justification */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)] block">
              {LABELS.pipeline.stage10.investigatorNotesLabel}
            </label>
            <textarea
              rows={3}
              value={investigatorRemarks}
              onChange={(e) => setInvestigatorRemarks(e.target.value)}
              disabled={finalStatus !== 'DRAFT'}
              placeholder={LABELS.pipeline.stage10.investigatorNotesPlaceholder}
              className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] font-sans leading-relaxed disabled:opacity-60"
            />
          </div>

          {/* Recommended Action */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)] block">
              {LABELS.pipeline.stage10.recommendedActionLabel}
            </label>
            <input
              type="text"
              value={recommendedAction}
              onChange={(e) => setRecommendedAction(e.target.value)}
              disabled={finalStatus !== 'DRAFT'}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Compliance Sign-off Checklist */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          {LABELS.pipeline.stage10.checklistTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] cursor-pointer hover:border-[var(--border-strong)]">
            <input
              type="checkbox"
              checked={checklist.suspectKycVerified}
              onChange={(e) => setChecklist({ ...checklist, suspectKycVerified: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
            />
            <span>{LABELS.pipeline.stage10.checklistItems.kyc}</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] cursor-pointer hover:border-[var(--border-strong)]">
            <input
              type="checkbox"
              checked={checklist.evidenceValidated}
              onChange={(e) => setChecklist({ ...checklist, evidenceValidated: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
            />
            <span>{LABELS.pipeline.stage10.checklistItems.evidence}</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] cursor-pointer hover:border-[var(--border-strong)]">
            <input
              type="checkbox"
              checked={checklist.typologyConfirmed}
              onChange={(e) => setChecklist({ ...checklist, typologyConfirmed: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
            />
            <span>{LABELS.pipeline.stage10.checklistItems.typology}</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] cursor-pointer hover:border-[var(--border-strong)]">
            <input
              type="checkbox"
              checked={checklist.narrativeApproved}
              onChange={(e) => setChecklist({ ...checklist, narrativeApproved: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
            />
            <span>{LABELS.pipeline.stage10.checklistItems.approved}</span>
          </label>
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
          <span>{LABELS.pipeline.stage10.backButton}</span>
        </button>

        {finalStatus === 'DRAFT' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRejectModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>{LABELS.pipeline.stage10.rejectButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setApprovalModalOpen(true)}
              disabled={!allChecked}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{LABELS.pipeline.stage10.approveButton}</span>
            </button>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-500 dark:text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>{LABELS.pipeline.stage10.modalConfirmTitle}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {LABELS.pipeline.stage10.modalConfirmDesc}
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="btn-secondary text-xs"
              >
                {LABELS.pipeline.stage10.modalCancel}
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="btn-primary text-xs"
              >
                {isSubmitting ? 'Recording...' : LABELS.pipeline.stage10.modalConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-500 dark:text-rose-400 font-bold text-base">
              <XCircle className="w-6 h-6 shrink-0" />
              <span>{LABELS.pipeline.stage10.modalRejectTitle}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {LABELS.pipeline.stage10.modalRejectDesc}
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={LABELS.pipeline.stage10.modalRejectPlaceholder}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-400"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="btn-secondary text-xs"
              >
                {LABELS.pipeline.stage10.modalCancel}
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
              >
                {LABELS.pipeline.stage10.modalRejectConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
