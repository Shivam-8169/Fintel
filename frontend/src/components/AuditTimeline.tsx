import React from 'react';
import { Clock, Shield, User, Bot, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-xs">
        No audit events recorded yet for this scope.
      </div>
    );
  }

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'AI_AGENT':
        return <Bot className="w-4 h-4 text-cyan-400" />;
      case 'INVESTIGATOR':
      case 'ADMIN':
        return <User className="w-4 h-4 text-emerald-400" />;
      default:
        return <Shield className="w-4 h-4 text-purple-400" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (action.includes('REJECTED')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (action.includes('INVESTIGATION')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (action.includes('REPORT')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
        <span className="font-semibold uppercase tracking-wider">Immutable Forensic Log ({logs.length} events)</span>
        <span>Chronological Descent</span>
      </div>

      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
        {logs.map((log) => (
          <div key={log.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow">
              {getActorIcon(log.actor_type)}
            </div>

            <div className="p-3.5 rounded-xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border ${getActionBadgeColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-slate-300 font-medium">
                    by <strong className="text-slate-100">{log.actor_id}</strong> ({log.actor_type})
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {log.details && (
                <p className="text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-850">
                  {log.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
