import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { AuditTimeline } from '../components/AuditTimeline';
import { ComplianceTerm } from '../components/ComplianceTerm';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load system audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.actor_id.toLowerCase().includes(term) ||
      (log.case_id && log.case_id.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--border-default)]">
        <div>
          {/* Eyebrow / Small section label */}
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Accountability & Activity History</span>
          </div>

          {/* Main page title */}
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <span>Activity History</span>
            <ComplianceTerm term="Audit Trail" />
          </h1>

          {/* Description */}
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Permanent, unchangeable record of all user actions, automated scan events, file uploads, and investigator decisions.
          </p>
        </div>

        {/* Secondary Professional Action */}
        <button
          onClick={loadLogs}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto shrink-0"
          title="Refresh activity history log"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="p-3 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actions, users, case IDs..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-[var(--text-muted)] font-mono text-xs hidden sm:flex items-center gap-1.5 shrink-0 px-2 py-1 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
          <span className="font-semibold text-[var(--text-primary)]">{filteredLogs.length}</span>
          <span>{filteredLogs.length === 1 ? 'event' : 'events'}</span>
        </div>
      </div>

      {/* EMPTY / LOADING / ERROR STATES */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[35vh] rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] p-8">
          <div className="text-center space-y-3">
            <div className="w-7 h-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[var(--text-muted)] font-medium">Fetching activity history records...</p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <AuditTimeline logs={filteredLogs} />
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
