import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('investigator@fintel.local');
  const [password, setPassword] = useState('investigator123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(email, password);
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

  const handleDemoSelect = (role: 'INVESTIGATOR' | 'ADMIN') => {
    if (role === 'INVESTIGATOR') {
      setEmail('investigator@fintel.local');
      setPassword('investigator123');
    } else {
      setEmail('admin@fintel.local');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <ShieldAlert className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">FINTEL AML/CFT</h1>
          <p className="text-xs text-slate-400">
            Autonomous Financial Crime Investigation & SAR Drafting Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel-elevated p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-100">Investigator Portal</h2>
            <p className="text-xs text-slate-400">Sign in to access case triage, graph analysis, and SAR drafts</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Compliance Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  placeholder="name@fintel.local"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Investigation Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
              Quick Academic Demo Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('INVESTIGATOR')}
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 text-[11px] text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Investigator</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('ADMIN')}
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-purple-500/50 text-[11px] text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="text-center text-[11px] text-slate-400">
          <p>Academic PBL Simulation. No live core-banking connections or real PII.</p>
        </div>
      </div>
    </div>
  );
};
