import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Shield,
  User,
  Bot,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  FileEdit,
  Database,
  LogIn,
  ShieldAlert,
  FileCheck2,
  Activity,
  KeyRound,
  UserPlus,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';
import { AuditLog } from '../types';
import { formatAuditAction } from '../utils/complianceNaming';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
        <Shield className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
        <p className="text-xs font-medium text-[var(--text-primary)]">No audit events found.</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          No records match your search query or no audit provenance recorded yet.
        </p>
      </div>
    );
  }

  // Consistent Semantic Event Configuration
  const getEventConfig = (action: string, actorType: string) => {
    const act = action.toUpperCase();

    // Team & RBAC Events
    if (act.includes('INVITE')) {
      return {
        icon: UserPlus,
        badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
        nodeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
        category: 'Team & RBAC'
      };
    }

    if (act.includes('ROLE')) {
      return {
        icon: UserCheck,
        badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
        nodeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        category: 'Team & RBAC'
      };
    }

    if (act.includes('DEACTIVAT')) {
      return {
        icon: UserX,
        badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
        nodeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        category: 'Critical'
      };
    }

    if (act.includes('REASSIGN')) {
      return {
        icon: Users,
        badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
        nodeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        category: 'Assignment'
      };
    }

    // 1. User Authentication
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return {
        icon: KeyRound,
        badgeClass: 'badge-event-info',
        nodeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        category: 'Information'
      };
    }

    // 2. Report Approved
    if (act.includes('APPROVED')) {
      return {
        icon: CheckCircle2,
        badgeClass: 'badge-event-success',
        nodeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        category: 'Success'
      };
    }

    // 3. Case Created
    if (act.includes('CREATED') || act.includes('OPENED')) {
      return {
        icon: FolderPlus,
        badgeClass: 'badge-event-info',
        nodeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        category: 'Information'
      };
    }

    // 4. Agent Execution
    if (act.includes('AGENT') || act.includes('INVESTIGATION') || actorType === 'AI_AGENT') {
      return {
        icon: Bot,
        badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
        nodeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
        category: 'Intelligence'
      };
    }

    // 5. Data Ingestion
    if (act.includes('INGEST') || act.includes('DATA') || act.includes('UPLOAD')) {
      return {
        icon: Database,
        badgeClass: 'badge-event-success',
        nodeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        category: 'Success'
      };
    }

    // 6. Case Updated
    if (act.includes('UPDATE') || act.includes('MODIFY') || act.includes('STATUS')) {
      return {
        icon: FileEdit,
        badgeClass: 'badge-event-warning',
        nodeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        category: 'Warning'
      };
    }

    // 7. Alert Generated / Rejected
    if (act.includes('ALERT') || act.includes('REJECTED') || act.includes('FLAGGED')) {
      return {
        icon: ShieldAlert,
        badgeClass: 'badge-event-critical',
        nodeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        category: 'Critical'
      };
    }

    // Fallback Neutral
    return {
      icon: Shield,
      badgeClass: 'badge-event-neutral',
      nodeClass: 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]',
      category: 'System'
    };
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const datePart = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      const timePart = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${datePart} · ${timePart}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Timeline Header Info */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-[var(--border-default)]">
        <span className="font-semibold text-[var(--text-primary)]">
          Audit Records ({logs.length} logged events)
        </span>
        <span className="text-[11px] text-[var(--text-muted)] font-mono">
          Chronological Descent
        </span>
      </div>

      {/* Vertical Timeline Structure */}
      <div className="relative pt-1 pl-2 space-y-4">
        {logs.map((log, index) => {
          const config = getEventConfig(log.action, log.actor_type);
          const EventIcon = config.icon;
          const isLast = index === logs.length - 1;

          return (
            <div key={log.id || index} className="relative pl-8 pb-5 group last:pb-0">
              {/* Continuous Timeline Connector Line */}
              {!isLast && (
                <div className="absolute left-[11px] top-6 bottom-0 w-[1px] bg-[var(--border-default)] group-hover:bg-[var(--border-strong)] transition-colors" />
              )}

              {/* Event Icon Circle Node */}
              <div
                className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-110 z-10 ${config.nodeClass}`}
              >
                <EventIcon className="w-3.5 h-3.5" />
              </div>

              {/* Event Card Container */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--color-accent-border)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5">
                {/* Readable Event Sentence Headline */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] leading-snug">
                      {formatAuditAction(log.action, log.actor_id, log.details)}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </p>
                  </div>
                  {log.case_id && (
                    <Link
                      to={`/cases/${log.case_id}`}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] hover:underline shrink-0"
                    >
                      {log.case_id}
                    </Link>
                  )}
                </div>

                {/* Secondary Provenance Metadata */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px]">
                  <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] tracking-wider border ${config.badgeClass}`}>
                    {log.action}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    Actor: <strong className="text-[var(--text-primary)] font-semibold">{log.actor_id}</strong>
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                    log.actor_type?.toLowerCase().includes('admin')
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      : log.actor_type?.toLowerCase().includes('lead')
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {log.actor_type}
                  </span>
                  {log.details && (
                    <span className="text-[var(--text-muted)] text-[11px] truncate max-w-md">
                      • {log.details}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AuditTimeline;
