import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Shield,
  Database,
  Cpu,
  CheckCircle2,
  Lock,
  Sliders,
  AlertTriangle,
  RefreshCw,
  Globe,
  KeyRound,
  ShieldCheck,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme, ThemeMode, AccentColor } from '../context/ThemeContext';
import { TeamManagement } from '../components/TeamManagement';
import { User } from '../types';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'config' | 'team'>(tabParam === 'team' ? 'team' : 'config');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { mode, setMode, accent, setAccent, resolvedTheme } = useTheme();

  useEffect(() => {
    if (tabParam === 'team') {
      setActiveTab('team');
    } else if (tabParam === 'config') {
      setActiveTab('config');
    }
  }, [tabParam]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [res, u] = await Promise.all([
        api.getSettings(),
        api.getCurrentUser().catch(() => null)
      ]);
      setSettingsData(res);
      setCurrentUser(u);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const accents: { id: AccentColor; name: string; color: string }[] = [
    { id: 'twitter', name: 'Twitter Blue (Remix)', color: '#1C9CF0' },
    { id: 'blue', name: 'Cobalt Blue', color: '#3B82F6' },
    { id: 'green', name: 'Twitter Green', color: '#00B87A' },
    { id: 'red', name: 'Twitter Pink/Red', color: '#F4212E' },
    { id: 'purple', name: 'Electric Purple', color: '#8B5CF6' },
    { id: 'orange', name: 'Solar Orange', color: '#F97316' }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 3. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Governance & Configurations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            System Settings & AI Model Controls
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Inspect AI model settings, provider security, database connectivity, display appearance, and institutional screening threshold rules.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Config</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-1">
        <button
          onClick={() => {
            setActiveTab('config');
            setSearchParams({ tab: 'config' });
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'config'
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] border border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Platform Configurations & Models</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('team');
            setSearchParams({ tab: 'team' });
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] border border-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Institutional Team & Access Control</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Admin
          </span>
        </button>
      </div>

      {activeTab === 'team' ? (
        <TeamManagement currentUser={currentUser} />
      ) : (
        <>
          {/* Enterprise Architecture Notice */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] flex items-center space-x-3 text-[var(--text-primary)] text-xs">
            <ShieldCheck className="w-5 h-5 shrink-0 text-[var(--color-accent-text)]" />
            <div className="leading-relaxed">
              <span className="font-bold text-[var(--color-accent-text)]">ENTERPRISE COMPLIANCE PLATFORM</span>: Secure Multi-Agent Financial Crime Investigation Architecture. Operating with strict zero-secret browser exposure and automated audit provenance.
            </div>
          </div>

      {/* 11. THEME & DISPLAY CUSTOMIZER SECTION */}
      <div className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-[var(--border-default)]">
          <div className="p-2.5 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Interface Theme & Appearance Customizer</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]">
                Twitter Remix Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Powered by Twitter Remix design tokens (21st.dev @olga-4011): OLED lights-out dark, clean white, and Twitter blue accents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Mode Switcher */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              Color Mode
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('dark')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center space-x-2 text-xs font-medium transition-all ${
                  mode === 'dark'
                    ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent-text)] font-semibold'
                    : 'bg-[var(--bg-card-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>

              <button
                onClick={() => setMode('light')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center space-x-2 text-xs font-medium transition-all ${
                  mode === 'light'
                    ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent-text)] font-semibold'
                    : 'bg-[var(--bg-card-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>

              <button
                onClick={() => setMode('system')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center space-x-2 text-xs font-medium transition-all ${
                  mode === 'system'
                    ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent-text)] font-semibold'
                    : 'bg-[var(--bg-card-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Accent Color Switcher */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              Brand Accent Palette
            </span>
            <div className="flex items-center space-x-2.5">
              {accents.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setAccent(acc.id)}
                  title={acc.name}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    accent === acc.id
                      ? 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110 shadow-sm'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: acc.color }}
                >
                  {accent === acc.id && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Configuration Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LLM & AI Engine Security */}
        <div className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-[var(--border-default)]">
            <div className="p-2.5 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">AI Engine & Model Governance</h2>
              <p className="text-xs text-[var(--text-muted)]">Zero Secret Exposure Architecture</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">LLM Provider</span>
              <span className="font-semibold text-[var(--text-primary)]">{settingsData?.llm_configuration?.provider || 'Google Gemini / Native Multi-Agent'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">Model Deployment</span>
              <span className="font-mono font-bold text-[var(--color-accent-text)]">{settingsData?.llm_configuration?.model || 'gemini-1.5-pro / deterministic fallback'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">API Integration Status</span>
              <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Configured & Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">Reasoning Engine Mode</span>
              <span className="font-mono font-bold text-emerald-400">
                ACTIVE (Deterministic Evidence-Grounded)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">API Key Masking</span>
              <span className="flex items-center space-x-1.5 font-mono text-emerald-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected (Server-Side Only)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-[var(--border-default)]">
            <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Database & Persistence</h2>
              <p className="text-xs text-[var(--text-muted)]">Persistent Storage Engine</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">Database Engine</span>
              <span className="font-semibold text-[var(--text-primary)]">{settingsData?.database_configuration?.engine || 'SQLite (WAL Mode)'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">Connection State</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{settingsData?.database_configuration?.connection_status || 'CONNECTED'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">Database Location</span>
              <span className="font-mono text-[var(--text-secondary)] text-[11px]">
                {settingsData?.database_configuration?.uri || 'fintel.db'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">Enterprise Migration</span>
              <span className="font-semibold text-[var(--color-accent-text)]">
                PostgreSQL Ready (SQLAlchemy ORM)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
              <span className="text-[var(--text-muted)]">Operational Mode</span>
              <span className="font-mono text-amber-400 font-bold uppercase">
                {settingsData?.environment || 'ENTERPRISE DEMO'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Parameters Overview */}
      <div className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-[var(--border-default)]">
          <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Detection Threshold Parameters</h2>
            <p className="text-xs text-[var(--text-muted)]">Explainable composite risk scoring thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block text-[11px] font-medium">Case Flagging Threshold</span>
            <span className="text-base font-bold text-[var(--color-accent-text)] font-mono mt-1 block">
              {settingsData?.detection_thresholds?.case_creation_score_threshold || 60} / 100
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block text-[11px] font-medium">High-Value Wire Benchmark</span>
            <span className="text-base font-bold text-amber-400 font-mono mt-1 block">
              ${(settingsData?.detection_thresholds?.high_value_wire_threshold_usd || 10000).toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block text-[11px] font-medium">Structuring Reporting Band</span>
            <span className="text-base font-bold text-rose-400 font-mono mt-1 block">
              $8,000 – $9,999
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block text-[11px] font-medium">Temporal Window</span>
            <span className="text-base font-bold text-purple-400 font-mono mt-1 block">
              {settingsData?.detection_thresholds?.temporal_proximity_window_hours || 48} Hours
            </span>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};
export default SettingsPage;
