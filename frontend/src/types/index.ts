export interface User {
  id?: number;
  user_id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Lead Investigator' | 'Investigator' | string;
  status?: 'Active' | 'Invited' | 'Deactivated' | string;
  invited_by?: string;
  invited_at?: string;
  last_login_at?: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
  email: string;
  user_id?: string;
  status?: string;
}

export interface Invite {
  invite_id: string;
  email: string;
  role: string;
  token: string;
  status: 'Pending' | 'Accepted' | 'Expired' | string;
  created_by: string;
  created_at: string;
  expires_at: string;
  invite_link?: string;
}

export interface ValidateInviteResponse {
  valid: boolean;
  email: string;
  role: string;
  name?: string;
  expires_at: string;
}

export interface Customer {
  customer_id: string;
  name: string;
  country: string;
  occupation: string;
  risk_level: string;
}

export interface Account {
  account_id: string;
  customer_id?: string;
  account_type: string;
  created_at: string;
}

export interface IndicatorResult {
  name: string;
  score: number;
  explanation: string;
  evidence_ids?: string[];
  relevant_transactions?: string[];
  graph_features?: Record<string, any>;
}

export interface EvidenceItem {
  evidence_id: string;
  case_id?: string;
  evidence_type: string;
  source_id: string;
  description: string;
}

export interface TransactionItem {
  transaction_id: string;
  sender_account: string;
  receiver_account: string;
  amount: number;
  timestamp: string;
  transaction_type: string;
  detection_flag?: string;
  evidence_id?: string;
  is_suspicious?: boolean;
}

export interface InvestigatorNote {
  note_id: string;
  case_id: string;
  note_text: string;
  created_at: string;
  author_name?: string;
  author_role?: string;
}

export interface CaseListItem {
  case_id: string;
  account_id: string;
  customer_name: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'UNDER_INVESTIGATION' | 'REPORT_DRAFTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  indicator_count: number;
  evidence_count: number;
  primary_typology?: string;
  total_amount?: number;
}

export interface CaseDetail {
  case_id: string;
  account_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'UNDER_INVESTIGATION' | 'REPORT_DRAFTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  account?: Account;
  customer?: Customer;
  indicators: IndicatorResult[];
  evidence: EvidenceItem[];
  notes: InvestigatorNote[];
  transactions?: TransactionItem[];
  has_investigation: boolean;
  has_report: boolean;
  report_status?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  is_focal: boolean;
  is_suspicious: boolean;
  account_type: string;
  customer_id?: string;
  customer_name?: string;
  risk_level?: string;
  risk_score?: number;
  in_degree: number;
  out_degree: number;
  total_in: number;
  total_out: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  transaction_type: string;
  is_suspicious: boolean;
}

export interface GraphData {
  account_id: string;
  k_hops: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  metrics: Record<string, any>;
}

export interface SuspiciousPattern {
  pattern_name: string;
  description: string;
  evidence_ids: string[];
  confidence: string;
}

export interface ReasoningStep {
  step_number: number;
  observation: string;
  analytical_interpretation: string;
  referenced_evidence_ids: string[];
}

export interface InvestigationResponse {
  investigation_id: string;
  case_id: string;
  summary: string;
  suspicious_patterns: SuspiciousPattern[];
  reasoning: ReasoningStep[];
  uncertainty: string[];
  questions_for_investigator: string[];
  is_mock_ai: boolean;
  created_at: string;
}

export interface StructuredSARReport {
  disclaimer: string;
  case_information: {
    case_id: string;
    filing_type: string;
    watermark: string;
    date_drafted: string;
    investigating_entity: string;
    human_status: string;
  };
  subject_information: {
    account_id: string;
    account_type: string;
    customer_id: string;
    customer_name: string;
    country: string;
    occupation: string;
    customer_risk_rating: string;
  };
  suspicious_activity_summary: {
    narrative_summary: string;
    typologies_detected: string[];
    total_suspicious_volume: number;
    timeframe_start: string;
    timeframe_end: string;
  };
  transaction_analysis: {
    total_transactions_analyzed: number;
    rapid_movement_flagged: boolean;
    high_value_transactions_count: number;
    structuring_evidence_count: number;
    key_transactions: Array<{ evidence_id: string; detail: string }>;
  };
  graph_analysis: {
    fan_in_ratio: number;
    fan_out_ratio: number;
    immediate_counterparties_count: number;
    network_role: string;
    subgraph_summary: string;
  };
  investigation_findings: {
    core_reasoning_points: string[];
    factual_observations: string[];
    analytical_interpretations: string[];
    uncertainties_and_gaps: string[];
  };
  risk_indicators: {
    composite_risk_score: number;
    risk_level: string;
    contributing_indicators: Array<{ indicator: string; score: number; explanation: string }>;
  };
  supporting_evidence: {
    evidence_table: Array<{ evidence_id: string; type: string; source: string; description: string }>;
  };
  investigator_review_section: {
    reviewer_notes?: string;
    approval_status: string;
    reviewed_by?: string;
    reviewed_at?: string;
    decision_reasoning?: string;
  };
}

export interface ReportResponse {
  report_id: string;
  case_id: string;
  status: string;
  report_content: StructuredSARReport;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  case_id?: string;
  actor_type: string;
  actor_id: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface DashboardSummary {
  total_cases: number;
  critical_cases: number;
  high_risk_cases: number;
  medium_risk_cases: number;
  low_risk_cases: number;
  pending_review: number;
  approved_cases: number;
  under_investigation: number;
  total_customers: number;
  total_transactions: number;
  top_flagged_cases: Array<{
    case_id: string;
    account_id: string;
    risk_score: number;
    risk_level: string;
    status: string;
  }>;
}

export interface StatementColumnMapping {
  date?: string | null;
  description?: string | null;
  amount?: string | null;
  debit?: string | null;
  credit?: string | null;
  account_id?: string | null;
  counterparty?: string | null;
  balance?: string | null;
}

export interface StatementPreviewResponse {
  filename: string;
  file_size_bytes: number;
  total_rows: number;
  columns: string[];
  sample_rows: Record<string, string>[];
  suggested_mapping: StatementColumnMapping;
}

export interface SuspiciousFinding {
  finding_id: string;
  case_id?: string | null;
  account_id: string;
  typology: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
  triggers: string[];
  supporting_evidence_ids: string[];
  key_metrics: Record<string, any>;
}

export interface PipelineStage {
  stage: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  details: string;
}

export interface StatementAnalysisResult {
  status: string;
  transactions_analyzed: number;
  potentially_suspicious_transactions: number;
  potentially_suspicious_accounts: number;
  cases_generated: number;
  evidence_items: number;
  pipeline_stages: PipelineStage[];
  findings: SuspiciousFinding[];
  generated_case_ids: string[];
}

export interface NormalizedTransaction {
  transaction_id: string;
  account_id: string;
  timestamp: string;
  amount: number;
  counterparty: string;
  notes?: string;
  direction?: 'DEBIT' | 'CREDIT';
  is_suspicious?: boolean;
  flags?: string[];
  anomaly_score?: number;
}

export interface EntityRiskBreakdown {
  indicator: string;
  score: number;
  rationale: string;
}

export interface EntityRiskScore {
  entityId: string;
  accountType?: string;
  customerName?: string;
  compositeScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: EntityRiskBreakdown[];
}

export interface EvidenceMatrixItem {
  evidenceId: string;
  transactionId: string;
  sourceRecord: NormalizedTransaction;
  findingClaim: string;
  indicatorType: string;
  timestamp: string;
}

export interface FIU_IND_SARDraft {
  report_ref: string;
  reporting_entity: {
    institution_name: string;
    institution_code: string;
    reporting_officer: string;
    filing_date: string;
  };
  suspect_details: {
    account_number: string;
    customer_id: string;
    full_name: string;
    pan_or_identifier: string;
    kyc_risk_rating: string;
    jurisdiction: string;
  };
  suspicious_summary: {
    gross_turnover: number;
    suspicious_volume: number;
    transaction_count: number;
    detection_window: string;
    fiu_typology_code: string;
    typology_description: string;
  };
  narrative_of_suspicion: string;
  grounded_reasoning_points: string[];
  uncertainty_disclosures: string[];
  recommended_action: string;
}

export interface PipelineState {
  currentStep: number;
  maxCompletedStep: number;
  file: File | null;
  fileName: string;
  fileSize: number;
  ingestedRecords: NormalizedTransaction[];
  totalRecords: number;
  accountCount: number;
  flaggedTransactions: NormalizedTransaction[];
  entityRisk: EntityRiskScore | null;
  graphData: GraphData | null;
  investigationNarrative: {
    summary: string;
    findings: string[];
    typologies: string[];
    reasoning: string[];
    uncertainties: string[];
    citedEvidenceIds: string[];
  } | null;
  evidenceItems: EvidenceMatrixItem[];
  fiuSarDraft: FIU_IND_SARDraft | null;
  humanReview: {
    status: 'DRAFT' | 'APPROVED' | 'REJECTED';
    reviewedBy: string;
    timestamp?: string;
    investigatorNotes: string;
    checklist: {
      suspectKycVerified: boolean;
      evidenceValidated: boolean;
      typologyConfirmed: boolean;
      narrativeApproved: boolean;
    };
  };
  generatedCaseId?: string;
}


