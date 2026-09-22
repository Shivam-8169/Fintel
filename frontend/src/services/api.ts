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
  DashboardSummary
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

  // Audit Logs
  getCaseAuditLogs: async (caseId: string): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>(`/cases/${caseId}/audit`);
    return res.data;
  },

  getSystemAuditLogs: async (limit: number = 50): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>('/audit', { params: { limit } });
    return res.data;
  },

  // Data Upload
  uploadDataset: async (file: File, datasetType: string, runDetection: boolean = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', datasetType);
    formData.append('run_detection_after', String(runDetection));
    const res = await apiClient.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
