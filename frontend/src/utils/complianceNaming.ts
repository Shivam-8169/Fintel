/**
 * Plain-language compliance helpers, display neutralizers, and terminology mappings.
 */

// Neutral display ID map for synthetic accounts to avoid baking investigative conclusions into account numbers
const NEUTRAL_ID_MAP: Record<string, { neutralId: string; roleLabel: string; roleType: 'focal' | 'suspicious' | 'normal' }> = {
  'ACC-CLIENT-01': { neutralId: 'ACC-10492', roleLabel: 'Primary Target Account', roleType: 'focal' },
  'ACC-TEST-STMT': { neutralId: 'ACC-82014', roleLabel: 'Commercial Counterparty', roleType: 'suspicious' },
  'ACC-MULE-01': { neutralId: 'ACC-30419', roleLabel: 'Possible Mule Account', roleType: 'suspicious' },
  'ACC-MULE-02': { neutralId: 'ACC-30420', roleLabel: 'Possible Mule Account', roleType: 'suspicious' },
  'ACC-MULE-03': { neutralId: 'ACC-30421', roleLabel: 'Possible Mule Account', roleType: 'suspicious' },
  'ACC-PASS-THROUGH': { neutralId: 'ACC-74892', roleLabel: 'Pass-Through Intermediary', roleType: 'suspicious' },
  'ACC-OFFSHORE-GLOBAL': { neutralId: 'ACC-91204', roleLabel: 'Offshore Remitter', roleType: 'suspicious' },
  'ACC-MULE-BENEFICIARY-01': { neutralId: 'ACC-51203', roleLabel: 'Dispersal Beneficiary', roleType: 'suspicious' },
  'ACC-SUSP-CHAIN01': { neutralId: 'ACC-61021', roleLabel: 'Suspected Layering Intermediary', roleType: 'suspicious' },
  'ACC-SUSP-CHAIN02': { neutralId: 'ACC-61022', roleLabel: 'Suspected Layering Intermediary', roleType: 'suspicious' },
  'ACC-SUSP-CHAIN03': { neutralId: 'ACC-61023', roleLabel: 'Suspected Layering Intermediary', roleType: 'suspicious' },
};

/**
 * Replace internal or conclusion-heavy account IDs with realistic neutral IDs.
 */
export function getNeutralAccountId(rawId: string): string {
  if (!rawId) return rawId;
  if (NEUTRAL_ID_MAP[rawId]) {
    return NEUTRAL_ID_MAP[rawId].neutralId;
  }
  if (rawId.includes('MULE') || rawId.includes('SUSP') || rawId.includes('PASS')) {
    let hash = 0;
    for (let i = 0; i < rawId.length; i++) {
      hash = (hash * 31 + rawId.charCodeAt(i)) % 90000;
    }
    return `ACC-${10000 + Math.abs(hash)}`;
  }
  return rawId;
}

/**
 * Returns a descriptive role label rather than baking suspicion into the ID.
 */
export function getAccountRoleBadge(rawId: string): { label: string; isFlagged: boolean } | null {
  if (NEUTRAL_ID_MAP[rawId]) {
    const item = NEUTRAL_ID_MAP[rawId];
    return { label: item.roleLabel, isFlagged: item.roleType === 'suspicious' };
  }
  if (rawId.includes('MULE')) {
    return { label: 'Possible Mule Account', isFlagged: true };
  }
  if (rawId.includes('SUSP')) {
    return { label: 'Flagged Counterparty', isFlagged: true };
  }
  return null;
}

/**
 * Replace ambiguous "Unknown Entity" with clear data-gap labels.
 */
export function cleanCustomerName(name: string | null | undefined): string {
  if (!name || name === 'Unknown Entity' || name.toLowerCase().includes('unknown')) {
    return 'No Name on File (Unverified Customer)';
  }
  return name;
}

/**
 * Map algorithmic rule codes to plain English titles for investigators.
 */
export function getIndicatorPlainTitle(rawCode: string): string {
  const map: Record<string, string> = {
    high_value_transfers: 'High-Value Wire Transfers',
    high_velocity_burst: 'Sudden Spike in Transfer Speed (Burst)',
    rapid_fund_movement: 'Rapid Pass-Through Fund Movement',
    structuring_smurfing: 'Transactions Just Below Regulatory Limit (Structuring)',
    many_to_one_aggregation: 'Multiple Senders Funneling to One Account (Mule Aggregation)',
    one_to_many_dispersion: 'Single Account Dispersing to Many Receivers (Layering Dispersion)',
    circular_chain_movement: 'Circular Flow of Funds (Round-Tripping Loop)',
  };
  return map[rawCode] || rawCode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Plain-language case status labels phrased as clear next actions.
 */
export function getCaseStatusLabel(rawStatus: string): { label: string; style: string; dot: string } {
  switch (rawStatus?.toUpperCase()) {
    case 'NEW':
      return {
        label: 'Needs Initial Triage',
        style: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        dot: 'bg-amber-500'
      };
    case 'UNDER_INVESTIGATION':
      return {
        label: 'Investigation in Progress',
        style: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        dot: 'bg-blue-500'
      };
    case 'REPORT_DRAFTED':
    case 'PENDING_REVIEW':
      return {
        label: 'Awaiting Your Review',
        style: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
        dot: 'bg-purple-500'
      };
    case 'APPROVED':
      return {
        label: 'Approved for Regulatory Filing',
        style: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-500'
      };
    case 'REJECTED':
      return {
        label: 'Closed — False Positive',
        style: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
        dot: 'bg-zinc-500'
      };
    case 'CLOSED':
      return {
        label: 'Resolved & Archived',
        style: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
        dot: 'bg-zinc-500'
      };
    default:
      return {
        label: rawStatus || 'Unknown Status',
        style: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
        dot: 'bg-zinc-500'
      };
  }
}

/**
 * Format audit log event codes into plain-language human-readable sentences.
 */
export function formatAuditAction(action: string, user: string = 'Investigator', details?: string): string {
  const normAction = action?.toUpperCase() || '';
  if (normAction.includes('USER_INVITED')) {
    return details || `${user} generated an institutional onboarding invitation`;
  }
  if (normAction.includes('INVITE_ACCEPTED')) {
    return details || `${user} accepted invitation and activated account`;
  }
  if (normAction.includes('ROLE_CHANGED') || normAction.includes('USER_ROLE')) {
    return details || `${user} modified user role permissions`;
  }
  if (normAction.includes('DEACTIVATED')) {
    return details || `${user} deactivated user account (access revoked)`;
  }
  if (normAction.includes('REACTIVATED')) {
    return details || `${user} reactivated user account`;
  }
  if (normAction.includes('CASE_REASSIGNED') || normAction.includes('REASSIGN')) {
    return details || `${user} reassigned case investigator`;
  }
  if (normAction.includes('APPROVE')) {
    return details || `${user} approved this case for official regulatory filing`;
  }
  if (normAction.includes('REJECT')) {
    return details || `${user} closed this case as a false positive`;
  }
  if (normAction.includes('INVESTIGAT')) {
    return details || `${user} ran automated AI case review`;
  }
  if (normAction.includes('REPORT_GEN') || normAction.includes('DRAFT')) {
    return details || `${user} generated draft report (SAR format)`;
  }
  if (normAction.includes('REPORT_EDIT') || normAction.includes('UPDATE')) {
    return details || `${user} edited report narrative and case findings`;
  }
  if (normAction.includes('NOTE')) {
    return details || `${user} logged an investigative case note`;
  }
  if (normAction.includes('INGEST')) {
    return `System read and organized transaction records`;
  }
  if (normAction.includes('DETECT')) {
    return `System scanned 7 suspicious patterns and flagged high-risk activity`;
  }
  return details || `${user} performed ${action.replace(/_/g, ' ').toLowerCase()}`;
}
