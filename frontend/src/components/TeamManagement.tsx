import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  UserCheck,
  UserX,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Clock,
  Mail,
  ShieldAlert,
  ChevronDown,
  X,
  Info,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { User, Invite } from '../types';

interface TeamManagementProps {
  currentUser: User | null;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Investigator' | 'Lead Investigator' | 'Admin'>('Investigator');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);

  // Role Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('Investigator');
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Action status message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, invitesData] = await Promise.all([
        api.getTeamUsers(),
        api.getTeamInvites()
      ]);
      setUsers(usersData);
      setInvites(invitesData);
    } catch (err: any) {
      console.error('Failed to load team data:', err);
      setError(err.response?.data?.detail || 'Failed to retrieve institutional team records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteLoading(true);

    try {
      const invite = await api.inviteTeamMember({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole
      });
      setGeneratedInvite(invite);
      setSuccessMessage(`Invitation link generated for ${invite.email}`);
      await fetchTeamData();
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || 'Failed to generate invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRoleUpdate = async () => {
    if (!editingUser) return;
    try {
      setRoleUpdating(true);
      const targetId = editingUser.user_id || String(editingUser.id) || editingUser.email;
      await api.updateUserRole(targetId, selectedRole);
      setSuccessMessage(`Successfully updated ${editingUser.name}'s role to ${selectedRole}.`);
      setEditingUser(null);
      await fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user role.');
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'Deactivated' ? 'Active' : 'Deactivated';
    const actionWord = newStatus === 'Deactivated' ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionWord} ${user.name}? ${newStatus === 'Deactivated' ? 'Their login access will be blocked immediately while historical audit records remain intact.' : 'They will regain access to the platform.'}`)) {
      return;
    }

    try {
      const targetId = user.user_id || String(user.id) || user.email;
      await api.updateUserStatus(targetId, newStatus);
      setSuccessMessage(`User ${user.name} is now ${newStatus}.`);
      await fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${actionWord} user.`);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('admin')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 whitespace-nowrap leading-none">
          <KeyRound className="w-3 h-3 shrink-0" />
          <span>Admin</span>
        </span>
      );
    }
    if (r.includes('lead')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25 whitespace-nowrap leading-none">
          <Shield className="w-3 h-3 shrink-0" />
          <span>Lead Investigator</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 whitespace-nowrap leading-none">
        <UserCheck className="w-3 h-3 shrink-0" />
        <span>Investigator</span>
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'Active').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 whitespace-nowrap leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span>Active</span>
        </span>
      );
    }
    if (s === 'invited') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 whitespace-nowrap leading-none">
          <Clock className="w-3 h-3 shrink-0" />
          <span>Invited</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25 whitespace-nowrap leading-none">
        <UserX className="w-3 h-3 shrink-0" />
        <span>Deactivated</span>
      </span>
    );
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Never logged in';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Guard for Admin Only
  const isAdmin = currentUser?.role?.toLowerCase().includes('admin');
  if (!isAdmin) {
    return (
      <div className="p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto opacity-75" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">Administrator Access Required</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
          The Institutional Team Management and RBAC Directory is restricted to users with the <strong className="text-[var(--text-primary)]">Admin</strong> role. Your current role is <strong className="text-[var(--color-accent)]">{currentUser?.role || 'Investigator'}</strong>.
        </p>
      </div>
    );
  }

  const activeCount = users.filter((u) => u.status === 'Active').length;
  const adminCount = users.filter((u) => u.role?.toLowerCase().includes('admin')).length;
  const leadCount = users.filter((u) => u.role?.toLowerCase().includes('lead')).length;
  const investigatorCount = users.filter((u) => !u.role?.toLowerCase().includes('admin') && !u.role?.toLowerCase().includes('lead')).length;
  const pendingInvites = invites.filter((i) => i.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Notifications / Success Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Institutional Team & Access Control</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Investigator Directory & RBAC Governance
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
            Manage investigators, assign role permissions, generate 7-day onboarding invitation links, and review account activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchTeamData}
            disabled={loading}
            className="btn-secondary text-xs"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setGeneratedInvite(null);
              setInviteEmail('');
              setInviteName('');
              setInviteRole('Investigator');
              setShowInviteModal(true);
            }}
            className="btn-primary text-xs flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Investigator</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
          <span className="text-[11px] text-[var(--text-muted)] font-medium block">Total Members</span>
          <span className="text-lg font-bold text-[var(--text-primary)] font-mono mt-1 block">
            {users.length}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
          <span className="text-[11px] text-emerald-400/90 font-medium block">Active Users</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
            {activeCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
          <span className="text-[11px] text-purple-400 font-medium block">Administrators</span>
          <span className="text-lg font-bold text-purple-400 font-mono mt-1 block">
            {adminCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
          <span className="text-[11px] text-blue-400 font-medium block">Lead Investigators</span>
          <span className="text-lg font-bold text-blue-400 font-mono mt-1 block">
            {leadCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] col-span-2 sm:col-span-1">
          <span className="text-[11px] text-amber-400 font-medium block">Pending Invites</span>
          <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
            {pendingInvites}
          </span>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Institutional Roster ({users.length} Records)
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Role-Based Access Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs table-fixed">
            <colgroup>
              <col className="w-[180px]" />
              <col className="w-[200px]" />
              <col className="w-[140px]" />
              <col className="w-[110px]" />
              <col className="w-[130px]" />
              <col className="w-[140px]" />
              <col className="w-[170px]" />
            </colgroup>
            <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--border-default)] select-none">
              <tr>
                <th className="py-3 px-4 font-semibold align-middle whitespace-nowrap">User</th>
                <th className="py-3 px-4 font-semibold align-middle whitespace-nowrap">Email</th>
                <th className="py-3 px-4 font-semibold align-middle whitespace-nowrap">Role</th>
                <th className="py-3 px-4 font-semibold align-middle whitespace-nowrap">Status</th>
                <th className="py-3 px-4 font-semibold align-middle whitespace-nowrap">Last Login</th>
                <th className="py-3 px-4 font-semibold align-middle whitespace-nowrap">Invited By</th>
                <th className="py-3 px-4 font-semibold text-right align-middle whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {users.map((u) => {
                const isSelf = u.email === currentUser?.email;
                return (
                  <tr
                    key={u.id || u.user_id || u.email}
                    className="hover:bg-[var(--bg-card-hover)] transition-colors align-middle"
                  >
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role?.toLowerCase().includes('admin')
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                              : u.role?.toLowerCase().includes('lead')
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5 truncate">
                            <span className="truncate">{u.name}</span>
                            {isSelf && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] block truncate">
                            {u.user_id || `USR-${u.id}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)] align-middle whitespace-nowrap truncate" title={u.email}>
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {getStatusBadge(u.status)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-muted)] align-middle whitespace-nowrap">
                      {formatTimestamp(u.last_login_at)}
                    </td>

                    <td className="py-3.5 px-4 text-[var(--text-muted)] align-middle whitespace-nowrap truncate" title={u.invited_by || 'System Initializer'}>
                      {u.invited_by || 'System Initializer'}
                    </td>

                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Change Role Button */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedRole(u.role);
                          }}
                          className="px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--color-accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer whitespace-nowrap shrink-0"
                          title="Change Role Permissions"
                        >
                          Change Role
                        </button>

                        {/* Deactivate / Reactivate Button */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                              u.status === 'Deactivated'
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}
                            title={u.status === 'Deactivated' ? 'Reactivate Account' : 'Deactivate Account (Block login)'}
                          >
                            {u.status === 'Deactivated' ? 'Reactivate' : 'Deactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs space-y-0">
          <div className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Pending Onboarding Invitations ({invites.length})
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Token Expiration: 7 Days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[160px]" />
                <col className="w-[110px]" />
                <col className="w-[150px]" />
                <col className="w-[120px]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--border-default)] select-none">
                <tr>
                  <th className="py-2.5 px-4 font-semibold align-middle whitespace-nowrap">Invited Email</th>
                  <th className="py-2.5 px-4 font-semibold align-middle whitespace-nowrap">Assigned Role</th>
                  <th className="py-2.5 px-4 font-semibold align-middle whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-4 font-semibold align-middle whitespace-nowrap">Created By</th>
                  <th className="py-2.5 px-4 font-semibold align-middle whitespace-nowrap">Expires</th>
                  <th className="py-2.5 px-4 font-semibold text-right align-middle whitespace-nowrap">Copy Invite Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {invites.map((inv) => (
                  <tr key={inv.invite_id} className="hover:bg-[var(--bg-card-hover)] transition-colors align-middle">
                    <td className="py-3 px-4 font-mono text-[var(--text-primary)] align-middle whitespace-nowrap truncate" title={inv.email}>
                      {inv.email}
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      {getRoleBadge(inv.role)}
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border leading-none whitespace-nowrap ${
                        inv.status === 'Accepted'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                          : inv.status === 'Expired'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)] align-middle whitespace-nowrap truncate" title={inv.created_by}>
                      {inv.created_by}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-muted)] align-middle whitespace-nowrap">
                      {formatTimestamp(inv.expires_at)}
                    </td>
                    <td className="py-3 px-4 text-right align-middle whitespace-nowrap">
                      {inv.status === 'Pending' ? (
                        <button
                          onClick={() => handleCopyLink(inv.token)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--color-accent-text)] hover:border-[var(--color-accent)] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Copy className="w-3 h-3 shrink-0" />
                          <span>Copy Link</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Investigator Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Invite Team Member</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Generate a cryptographically signed 7-day onboarding link</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!generatedInvite ? (
              <form onSubmit={handleCreateInvite} className="space-y-4 text-left">
                {inviteError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Corporate Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="investigator.name@financial-institution.com"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Full Name (Optional placeholder)
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Assigned Clearance Role <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Investigator', 'Lead Investigator', 'Admin'] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          inviteRole === r
                            ? r === 'Admin'
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                              : r === 'Lead Investigator'
                              ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-[var(--bg-card-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>{r}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] pt-1">
                    {inviteRole === 'Admin' && '• Administrator: Team management, platform configuration, and full case approval permissions.'}
                    {inviteRole === 'Lead Investigator' && '• Lead Investigator: Can work cases, approve reports, and reassign cases between team members.'}
                    {inviteRole === 'Investigator' && '• Investigator: Can work cases, view graph, and review/approve assigned SAR reports.'}
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="btn-primary text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{inviteLoading ? 'Generating...' : 'Generate Invite Link'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-left">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-bold block">Invitation Successfully Created!</span>
                    <span className="text-[11px] text-emerald-400/90">
                      Copy the unique onboarding link below and provide it to {generatedInvite.email}.
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Single-Use Onboarding Link (Valid for 7 Days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/accept-invite?token=${generatedInvite.token}`}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyLink(generatedInvite.token)}
                      className="btn-primary shrink-0 py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                      title="Copy to Clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-[11px] text-[var(--text-muted)] space-y-1 leading-relaxed">
                  <p className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
                    <Info className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Role Assignment: <strong className="text-[var(--text-primary)]">{generatedInvite.role}</strong></span>
                  </p>
                  <p>• The recipient will use this link to set their account password and activate their clearance.</p>
                  <p>• Simulated institutional email notification has also been logged to the forensic audit trail.</p>
                </div>

                <div className="pt-2 flex justify-between items-center gap-2">
                  <a
                    href={`/accept-invite?token=${generatedInvite.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[var(--color-accent-text)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Link in New Tab (Test)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setGeneratedInvite(null);
                    }}
                    className="btn-secondary text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Change Role: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-left">
              <p className="text-[var(--text-muted)]">
                Select the new clearance role for <strong className="text-[var(--text-primary)]">{editingUser.email}</strong>. This update will be logged in the immutable audit trail.
              </p>

              <div className="space-y-2">
                {[
                  { id: 'Investigator', title: 'Investigator', desc: 'Can review cases, graph entities, and approve SAR drafts.' },
                  { id: 'Lead Investigator', title: 'Lead Investigator', desc: 'Investigator permissions + reassign cases across team.' },
                  { id: 'Admin', title: 'Administrator', desc: 'Full system governance, platform settings, and user management.' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === item.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--text-primary)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <input
                        type="radio"
                        name="role"
                        value={item.id}
                        checked={selectedRole === item.id}
                        onChange={() => setSelectedRole(item.id)}
                        className="accent-[var(--color-accent)]"
                      />
                      <span>{item.title}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] pl-5 block mt-0.5">
                      {item.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                disabled={roleUpdating}
                className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{roleUpdating ? 'Saving...' : 'Confirm Role Change'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
