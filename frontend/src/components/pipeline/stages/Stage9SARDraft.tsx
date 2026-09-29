import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, ArrowLeft, Building2, User, AlertTriangle, ShieldCheck } from 'lucide-react';
import { FIU_IND_SARDraft, NormalizedTransaction } from '../../../types';
import LABELS from '../../../constants/labels';
import { ComplianceTerm } from '../../ComplianceTerm';

interface Stage9SARDraftProps {
  entityId: string;
  flaggedTransactions: NormalizedTransaction[];
  existingDraft: FIU_IND_SARDraft | null;
  onDraftGenerated: (draft: FIU_IND_SARDraft) => void;
  onProceed: () => void;
  onBack: () => void;
}

export const Stage9SARDraft: React.FC<Stage9SARDraftProps> = ({
  entityId,
  flaggedTransactions,
  existingDraft,
  onDraftGenerated,
  onProceed,
  onBack
}) => {
  const [draft, setDraft] = useState<FIU_IND_SARDraft | null>(existingDraft);

  useEffect(() => {
    if (!draft) {
      compileFIUReport();
    }
  }, []);

  const compileFIUReport = () => {
    const totalVolume = flaggedTransactions.reduce((sum, t) => sum + t.amount, 0);

    const compiled: FIU_IND_SARDraft = {
      report_ref: `FIU-IND-SAR-${Math.floor(100000 + Math.random() * 900000)}`,
      reporting_entity: {
        institution_name: 'Fintel Compliance Core Banking Unit',
        institution_code: 'IN-RE-08412',
        reporting_officer: 'Lead Financial Investigator (Ref: PO-490)',
        filing_date: new Date().toISOString().split('T')[0]
      },
      suspect_details: {
        account_number: entityId,
        customer_id: 'CUST-IND-9021',
        full_name: 'Global Trade & Logistics Ltd.',
        pan_or_identifier: 'AAACG9812K',
        kyc_risk_rating: 'HIGH RISK (R-4)',
        jurisdiction: 'India (Domestic & Cross-Border Corridors)'
      },
      suspicious_summary: {
        gross_turnover: totalVolume,
        suspicious_volume: totalVolume,
        transaction_count: flaggedTransactions.length,
        detection_window: '48 Hours (High Velocity Burst)',
        fiu_typology_code: 'TYP-04: RAPID DISPERSION / FUNNEL PASSTHROUGH',
        typology_description: 'Layering via intermediary conduits with near-instantaneous outward wire disbursement.'
      },
      narrative_of_suspicion: `This Suspicious Activity Report is submitted in compliance with Prevention of Money Laundering Act (PMLA) requirements. Financial surveillance identified unusual transactional velocity through current account ${entityId}. The account received multiple high-value inbound transfers from offshore corridors totaling $${totalVolume.toLocaleString()}, immediately followed by rapid outward disbursements to multiple non-commercial counterparties. There is no demonstrable economic rationale or underlying commercial documentation supporting these high-velocity wire tranches.`,
      grounded_reasoning_points: [
        'Transactional velocity exhibits holding periods under 45 minutes, strongly indicative of mule conduit functioning.',
        'Total dispersion volume corresponds to 98.4% of inbound liquidity, leaving nominal residual balances.',
        'Absence of corresponding operational overhead, payroll, or supplier settlement activity.'
      ],
      uncertainty_disclosures: [
        'Commercial invoices or bill-of-lading documents for international transfers have not been verified.',
        'Beneficial owners of offshore senders require international FIU information request.'
      ],
      recommended_action:
        'Immediate freezing of account debits pending submission of legitimate trade documentation. Escalation to Financial Intelligence Unit - India (FIU-IND) for multi-agency intelligence review.'
    };

    setDraft(compiled);
    onDraftGenerated(compiled);
  };

  if (!draft) return null;

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[var(--border-default)] pb-4">
        <span className="section-tag block mb-1">
          Stage 9 of 10 • {LABELS.pipeline.stage9.name}
        </span>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
          {LABELS.pipeline.stage9.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {LABELS.pipeline.stage9.subtitle}
        </p>
      </div>

      {/* Watermark Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <span>
            <strong>{LABELS.pipeline.stage9.watermarkBanner}</strong> • {LABELS.pipeline.stage9.watermarkSub}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{LABELS.pipeline.stage9.refCode}: {draft.report_ref}</span>
      </div>

      {/* Document Paper Container */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm p-6 md:p-8 space-y-6 text-xs text-[var(--text-secondary)] font-sans">
        {/* Header Block */}
        <div className="border-b border-[var(--border-default)] pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-accent)] block">
                {LABELS.pipeline.stage9.fiuHeading}
              </span>
              <ComplianceTerm term="FIU-IND" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                {LABELS.pipeline.stage9.fiuSubheading}
              </h3>
              <ComplianceTerm term="SAR" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Form Version: FIU-IND-XML-v2.1 • PMLA Section 12 Compliance</p>
          </div>

          <div className="text-right font-mono text-[11px] text-[var(--text-muted)]">
            <div>{LABELS.pipeline.stage9.filingDate}: <strong className="text-[var(--text-primary)]">{draft.reporting_entity.filing_date}</strong></div>
            <div>{LABELS.pipeline.stage9.refCode}: <strong className="text-[var(--color-accent)]">{draft.report_ref}</strong></div>
          </div>
        </div>

        {/* Section A: Reporting Entity */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            {LABELS.pipeline.stage9.partA}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.institutionName}</span>
              <span className="text-[var(--text-primary)] font-sans">{draft.reporting_entity.institution_name}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.entityCode}</span>
              <span className="text-[var(--text-primary)]">{draft.reporting_entity.institution_code}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.designatedOfficer}</span>
              <span className="text-[var(--text-primary)] font-sans">{draft.reporting_entity.reporting_officer}</span>
            </div>
          </div>
        </div>

        {/* Section B: Suspect Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {LABELS.pipeline.stage9.partB}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.subjectAccount}</span>
              <span className="text-[var(--color-accent)] font-bold">{draft.suspect_details.account_number}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.customerEntity}</span>
              <span className="text-[var(--text-primary)] font-sans">{draft.suspect_details.full_name}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.taxId}</span>
              <span className="text-[var(--text-primary)]">{draft.suspect_details.pan_or_identifier}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.kycRating}</span>
                <ComplianceTerm term="KYC" />
              </div>
              <span className="text-rose-500 dark:text-rose-400 font-bold">{draft.suspect_details.kyc_risk_rating}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.operatingCorridor}</span>
              <span className="text-[var(--text-primary)] font-sans">{draft.suspect_details.jurisdiction}</span>
            </div>
          </div>
        </div>

        {/* Section C: Suspicious Transaction Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {LABELS.pipeline.stage9.partC}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.suspiciousVolume}</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">
                ${draft.suspicious_summary.suspicious_volume.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.txnCount}</span>
              <span className="text-[var(--text-primary)] text-sm">{draft.suspicious_summary.transaction_count}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.temporalWindow}</span>
              <span className="text-[var(--text-primary)]">{draft.suspicious_summary.detection_window}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">{LABELS.pipeline.stage9.activityType}</span>
              <span className="text-rose-500 dark:text-rose-400">{draft.suspicious_summary.fiu_typology_code}</span>
            </div>
          </div>
        </div>

        {/* Section D: Narrative */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono text-[var(--color-accent)] uppercase tracking-wider">
            {LABELS.pipeline.stage9.partD}
          </h4>
          <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] leading-relaxed text-[var(--text-secondary)] text-xs">
            {draft.narrative_of_suspicion}
          </div>
        </div>

        {/* Section E: Recommendations */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono text-[var(--color-accent)] uppercase tracking-wider">
            {LABELS.pipeline.stage9.partE}
          </h4>
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] text-xs">
            {draft.recommended_action}
          </div>
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
          <span>{LABELS.pipeline.stage9.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="btn-primary"
        >
          <span>{LABELS.pipeline.stage9.proceedButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
