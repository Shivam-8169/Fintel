import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { LABELS } from '../constants/labels';

const COMPLIANCE_DEFINITIONS: Record<string, { title: string; desc: string }> = {
  SAR: {
    title: 'Suspicious Activity Report (SAR)',
    desc: LABELS.terms.sar.plain
  },
  PEP: {
    title: 'Politically Exposed Person (PEP)',
    desc: LABELS.terms.pep.plain
  },
  KYC: {
    title: 'Know Your Customer (KYC)',
    desc: LABELS.terms.kyc.plain
  },
  UBO: {
    title: 'Ultimate Beneficial Owner (UBO)',
    desc: LABELS.terms.ubo.plain
  },
  'FIU-IND': {
    title: 'Financial Intelligence Unit - India (FIU-IND)',
    desc: LABELS.terms.fiuInd.plain
  },
  AML: {
    title: 'Anti-Money Laundering (AML)',
    desc: LABELS.terms.aml.plain
  },
  CFT: {
    title: 'Counter-Terror Financing (CFT)',
    desc: LABELS.terms.cft.plain
  },
  Structuring: {
    title: 'Structuring (Smurfing)',
    desc: LABELS.terms.structuring.plain
  },
  Layering: {
    title: 'Layering',
    desc: LABELS.terms.layering.plain
  },
  'Round-Tripping': {
    title: 'Round-Tripping',
    desc: LABELS.terms.roundTripping.plain
  },
  'Audit Trail': {
    title: 'Audit Trail (Activity History)',
    desc: LABELS.terms.auditTrail.plain
  }
};

interface ComplianceTermProps {
  term: string;
  text?: string;
  customText?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const ComplianceTerm: React.FC<ComplianceTermProps> = ({ term, text, customText, showIcon = false, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const info = COMPLIANCE_DEFINITIONS[term] || {
    title: term,
    desc: `Compliance concept: ${term}`
  };

  return (
    <span
      className="relative inline-flex items-center gap-0.5 cursor-help border-b border-dotted border-current/60 hover:border-current transition-colors align-baseline"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={`${info.title}: ${info.desc}`}
    >
      <span>{children || text || customText || term}</span>
      {showIcon && <Info className="w-3 h-3 text-[var(--text-muted)] shrink-0 inline-block opacity-80 hover:opacity-100" />}
      {showTooltip && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl text-[11px] leading-relaxed text-[var(--text-secondary)] font-normal text-left pointer-events-none animate-in fade-in duration-100">
          <strong className="text-[var(--text-primary)] block font-semibold mb-1 text-xs">
            {info.title}
          </strong>
          {info.desc}
        </span>
      )}
    </span>
  );
};

