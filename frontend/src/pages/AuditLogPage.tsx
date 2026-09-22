import React, { useEffect, useState } from 'react';
import { Clock, Shield, Search, RefreshCw, FileClock } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { AuditTimeline } from '../components/AuditTimeline';

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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
            <FileClock className="w-6 h-6 text-purple-400" />
            <span>Compliance Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable forensic record of all algorithmic triggers, data ingestions, agent executions, and human investigator determinations.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Action, Actor, Case ID, or Details..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono"
          />
        </div>
        <div className="text-slate-400 font-mono text-xs hidden sm:block">
          Showing {filteredLogs.length} events
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading audit ledger...</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <AuditTimeline logs={filteredLogs} />
        </div>
      )}
    </div>
  );
};
