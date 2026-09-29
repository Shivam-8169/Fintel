import axios from 'axios';
import {
  AuthResponse,
  User,
  CaseListItem,
  CaseDetail,
  GraphData,
  InvestigationResponse,
  ReportResponse,
  StructuredSARReport,
  AuditLog,
  DashboardSummary,
  StatementPreviewResponse,
  StatementColumnMapping,
  StatementAnalysisResult,
  Invite,
  ValidateInviteResponse
} from '../types';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject stored JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fintel_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Authentication
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  // Cases
  getCases: async (params?: { status?: string; risk_level?: string; search?: string; min_score?: number }): Promise<CaseListItem[]> => {
    const res = await apiClient.get<CaseListItem[]>('/cases', { params });
    return res.data;
  },

  getCaseDetail: async (caseId: string): Promise<CaseDetail> => {
    const res = await apiClient.get<CaseDetail>(`/cases/${caseId}`);
    return res.data;
  },

  addCaseNote: async (caseId: string, noteText: string) => {
    const res = await apiClient.post(`/cases/${caseId}/notes`, { note_text: noteText });
    return res.data;
  },

  updateCaseStatus: async (caseId: string, status: string, reason?: string) => {
    const res = await apiClient.put(`/cases/${caseId}/status`, { status, reason });
    return res.data;
  },

  // Transaction Graph
  getCaseGraph: async (caseId: string, kHops: number = 2): Promise<GraphData> => {
    const res = await apiClient.get<GraphData>(`/graph/case/${caseId}`, { params: { k_hops: kHops } });
    return res.data;
  },

  getAccountGraph: async (accountId: string, kHops: number = 2): Promise<GraphData> => {
    const res = await apiClient.get<GraphData>(`/graph/account/${accountId}`, { params: { k_hops: kHops } });
    return res.data;
  },

  // Investigation Agent
  investigateCase: async (caseId: string): Promise<InvestigationResponse> => {
    const res = await apiClient.post<InvestigationResponse>(`/cases/${caseId}/investigate`);
    return res.data;
  },

  getInvestigation: async (caseId: string): Promise<InvestigationResponse> => {
    const res = await apiClient.get<InvestigationResponse>(`/cases/${caseId}/investigation`);
    return res.data;
  },

  // Reporting Agent & Human Review
  generateReport: async (caseId: string): Promise<ReportResponse> => {
    const res = await apiClient.post<ReportResponse>(`/cases/${caseId}/generate-report`);
    return res.data;
  },

  getReport: async (caseId: string): Promise<ReportResponse> => {
    const res = await apiClient.get<ReportResponse>(`/cases/${caseId}/report`);
    return res.data;
  },

  updateReport: async (caseId: string, reportContent: StructuredSARReport, notes?: string): Promise<ReportResponse> => {
    const res = await apiClient.put<ReportResponse>(`/cases/${caseId}/report`, {
      report_content: reportContent,
      notes
    });
    return res.data;
  },

  approveReport: async (caseId: string, notes?: string, reviewerName: string = 'Demo Investigator') => {
    const res = await apiClient.post(`/cases/${caseId}/approve`, {
      decision: 'APPROVE',
      notes,
      reviewer_name: reviewerName
    });
    return res.data;
  },

  rejectReport: async (caseId: string, notes?: string, reviewerName: string = 'Demo Investigator') => {
    const res = await apiClient.post(`/cases/${caseId}/reject`, {
      decision: 'REJECT',
      notes,
      reviewer_name: reviewerName
    });
    return res.data;
  },

  downloadReportPdf: async (caseId: string): Promise<{ blob: Blob; filename: string }> => {
    const res = await apiClient.get(`/cases/${caseId}/report/pdf`, {
      responseType: 'blob'
    });
    let filename = `FINTEL_${caseId}_SAR-DRAFT.pdf`;
    const disposition = res.headers['content-disposition'];
    const customHeader = res.headers['x-report-filename'];
    if (customHeader) {
      filename = customHeader;
    } else if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    return { blob: res.data, filename };
  },

  downloadReportDocx: async (caseId: string): Promise<{ blob: Blob; filename: string }> => {
    const res = await apiClient.get(`/cases/${caseId}/report/docx`, {
      responseType: 'blob'
    });
    let filename = `FINTEL_${caseId}_SAR-DRAFT.docx`;
    const disposition = res.headers['content-disposition'];
    const customHeader = res.headers['x-report-filename'];
    if (customHeader) {
      filename = customHeader;
    } else if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    return { blob: res.data, filename };
  },

  // Audit Logs
  getCaseAuditLogs: async (caseId: string): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>(`/cases/${caseId}/audit`);
    return res.data;
  },

  getSystemAuditLogs: async (limit: number = 50): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>('/audit', { params: { limit } });
    return res.data;
  },

  // Data Upload & Status
  getDataStatus: async (): Promise<{
    status: string;
    customers_count: number;
    accounts_count: number;
    transactions_count: number;
    database_type: string;
    synthetic_ground_truth_available: boolean;
  }> => {
    const res = await apiClient.get('/data/status');
    return res.data;
  },

  uploadDataset: async (file: File, datasetType: string, runDetection: boolean = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', datasetType);
    formData.append('run_detection_after', String(runDetection));
    const res = await apiClient.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getReportMarkdown: async (caseId: string): Promise<string> => {
    const res = await apiClient.get<string>(`/cases/${caseId}/report/markdown`, {
      responseType: 'text'
    });
    return res.data;
  },

  // Demo Dataset Ingestion
  loadDemoData: async () => {
    const res = await apiClient.post('/data/demo');
    return res.data;
  },

  // Reports Repository
  getAllReports: async () => {
    const res = await apiClient.get('/reports');
    return res.data;
  },

  getReportById: async (reportId: string): Promise<ReportResponse> => {
    const res = await apiClient.get<ReportResponse>(`/reports/${reportId}`);
    return res.data;
  },

  // Detection Engine
  getDetectionResults: async () => {
    const res = await apiClient.get('/detection/results');
    return res.data;
  },

  triggerDetection: async () => {
    const res = await apiClient.post('/detection/run');
    return res.data;
  },

  // Pipeline Agents
  getAgentStatus: async () => {
    const res = await apiClient.get('/agents/status');
    return res.data;
  },

  // Settings & System Governance
  getSettings: async () => {
    const res = await apiClient.get('/settings/status');
    return res.data;
  },

  // Evaluation & Benchmarks
  getEvaluationMetrics: async () => {
    const res = await apiClient.get('/evaluation/metrics');
    return res.data;
  },

  // Bank Statement Ingestion & Analysis Workflow
  parseStatementPreview: async (file: File): Promise<StatementPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/data/statement/parse-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  analyzeStatement: async (
    file: File,
    mapping: StatementColumnMapping,
    defaultAccountId: string = 'ACC-STATEMENT-01'
  ): Promise<StatementAnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('default_account_id', defaultAccountId);
    const res = await apiClient.post('/data/statement/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Invite Acceptance Flow
  validateInvite: async (token: string): Promise<ValidateInviteResponse> => {
    const res = await apiClient.get<ValidateInviteResponse>('/auth/validate-invite', {
      params: { token }
    });
    return res.data;
  },

  acceptInvite: async (data: { token: string; name: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/accept-invite', data);
    return res.data;
  },

  // Team Management (Admin Only)
  getTeamUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/team/users');
    return res.data;
  },

  getTeamInvites: async (): Promise<Invite[]> => {
    const res = await apiClient.get<Invite[]>('/team/invites');
    return res.data;
  },

  inviteTeamMember: async (data: { email: string; name?: string; role: string }): Promise<Invite> => {
    const res = await apiClient.post<Invite>('/team/invite', data);
    return res.data;
  },

  updateUserRole: async (identifier: string, role: string): Promise<User> => {
    const res = await apiClient.put<User>(`/team/users/${encodeURIComponent(identifier)}/role`, { role });
    return res.data;
  },

  updateUserStatus: async (identifier: string, status: string): Promise<User> => {
    const res = await apiClient.put<User>(`/team/users/${encodeURIComponent(identifier)}/status`, { status });
    return res.data;
  },

  // Case Assignment (Lead Investigator or Admin)
  assignCase: async (caseId: string, assignedTo: string): Promise<{ message: string; case_id: string; assigned_to: string }> => {
    const res = await apiClient.put<{ message: string; case_id: string; assigned_to: string }>(`/cases/${caseId}/assign`, {
      assigned_to: assignedTo
    });
    return res.data;
  }
};


