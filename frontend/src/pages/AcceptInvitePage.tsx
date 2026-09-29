import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  KeyRound,
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType, ValidateInviteResponse } from '../types';
import { FintelLogo } from '../components/FintelLogo';
import { ComplianceTerm } from '../components/ComplianceTerm';
import { LABELS } from '../constants/labels';

interface AcceptInvitePageProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const AcceptInvitePage: React.FC<AcceptInvitePageProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [inviteData, setInviteData] = useState<ValidateInviteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided. Please click the full invitation link sent by your administrator.');
      setLoading(false);
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.validateInvite(token);
      setInviteData(data);
      if (data.name) {
        setName(data.name);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'This invitation link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim()) {
      setSubmitError('Please enter your full institutional display name.');
      return;
    }

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.acceptInvite({
        token,
        name: name.trim(),
        password
      });

      localStorage.setItem('fintel_token', res.access_token);
      const currentUser = await api.getCurrentUser();
      onLoginSuccess(currentUser, res.access_token);
      navigate('/');
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Failed to complete invitation setup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('admin')) {
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
    if (r.includes('lead')) {
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col justify-center items-center px-4 py-12 select-none transition-colors duration-200">
      <div className="w-full max-w-[460px] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-7 sm:p-9 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <FintelLogo variant="mark" size="xl" useAccentColor={true} />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-wider text-[var(--text-primary)] font-sans">
                {LABELS.app.name}
              </h1>
              <ComplianceTerm term="AML/CFT" />
            </div>
            <p className="text-xs font-semibold text-[var(--color-accent)] mt-1.5 uppercase tracking-wide">
              Investigator Onboarding Portal
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Secure Role-Based Access Invitation Verification
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--border-default)] border-t-[var(--color-accent)] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[var(--text-muted)]">Verifying cryptographic invitation token...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Invitation Verification Failed</span>
                <p className="text-[11px] leading-relaxed text-rose-400/90">{error}</p>
              </div>
            </div>
            <Link
              to="/login"
              className="btn-secondary w-full py-2.5 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-2"
            >
              <span>Return to Institutional Sign-In</span>
            </Link>
          </div>
        )}

        {/* Valid Invite Form */}
        {!loading && !error && inviteData && (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Invitation Details Banner */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Assigned Clearance Role
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeClass(inviteData.role)}`}>
                  {inviteData.role}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span className="font-mono">{inviteData.email}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Valid invitation link • Single-use cryptographic token</span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Full Institutional Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shivam Sharma"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>
            </div>

            {/* Set Security Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Set Security Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Confirm Security Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5 rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Setting up Account...' : 'Accept Invitation & Sign In'}</span>
                {!submitting && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            </div>
          </form>
        )}

        <div className="pt-1 text-center text-[10px] text-[var(--text-muted)]">
          Fintel Autonomous Financial Crime Unit • Strict Admin-Invite RBAC
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
