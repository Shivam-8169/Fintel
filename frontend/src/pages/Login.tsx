import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UserCheck, KeyRound, ArrowRight, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

import { FintelLogo } from '../components/FintelLogo';
import { ComplianceTerm } from '../components/ComplianceTerm';
import { LABELS } from '../constants/labels';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('investigator@fintel.local');
  const [password, setPassword] = useState('investigator123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setError('');
    setLoading(true);

    try {
      const res = await api.login(loginEmail, loginPass);
      localStorage.setItem('fintel_token', res.access_token);
      const user = await api.getCurrentUser();
      onLoginSuccess(user, res.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  const handleQuickLogin = (role: 'LEAD' | 'ADMIN' | 'INVESTIGATOR') => {
    if (role === 'LEAD') {
      setEmail('investigator@fintel.local');
      setPassword('investigator123');
      executeLogin('investigator@fintel.local', 'investigator123');
    } else if (role === 'INVESTIGATOR') {
      setEmail('priya.patel@fintel.local');
      setPassword('investigator123');
      executeLogin('priya.patel@fintel.local', 'investigator123');
    } else {
      setEmail('admin@fintel.local');
      setPassword('admin123');
      executeLogin('admin@fintel.local', 'admin123');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col justify-center items-center px-4 py-12 select-none transition-colors duration-200">
      <div className="w-full max-w-[420px] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-7 sm:p-9 shadow-2xl space-y-5">
        {/* Brand Icon & Heading */}
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
              {LABELS.app.title}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {LABELS.app.subtitle}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Corporate Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@financial-institution.com"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Security Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
            />
          </div>

          {/* Primary Action Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Fintel'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-default)]" />
          </div>
          <span className="relative px-2.5 bg-[var(--bg-card)] text-[11px] text-[var(--text-muted)]">
            Quick Sign-In by Role
          </span>
        </div>

        {/* Role Quick Switch Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('LEAD')}
            className="w-full py-2 px-3.5 rounded-lg border border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] text-xs font-medium text-[var(--text-secondary)] flex items-center justify-center relative transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400 absolute left-3.5" />
            <span>Sign in as Lead Investigator (Shivam Sharma)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('INVESTIGATOR')}
            className="w-full py-2 px-3.5 rounded-lg border border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] text-xs font-medium text-[var(--text-secondary)] flex items-center justify-center relative transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 absolute left-3.5" />
            <span>Sign in as Investigator (Priya Patel)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('ADMIN')}
            className="w-full py-2 px-3.5 rounded-lg border border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] text-xs font-medium text-[var(--text-secondary)] flex items-center justify-center relative transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-400 absolute left-3.5" />
            <span>Sign in as Administrator (Compliance Officer)</span>
          </button>
        </div>

        {/* Admin-invite notice */}
        <div className="p-2.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
          <span className="font-semibold text-[var(--text-secondary)]">Strict Admin-Invite Access:</span> Public self-registration is disabled. New accounts are provisioned via Administrator invitation links.
        </div>

        {/* Security watermark */}
        <div className="pt-1 text-center text-[10px] text-[var(--text-muted)]">
          Fintel • Financial Crime Investigation Tool
        </div>
      </div>
    </div>
  );
};

export default Login;
