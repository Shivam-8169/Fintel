import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GitFork,
  AlertOctagon,
  ScanSearch,
  Network,
  Bot,
  FileText,
  ShieldCheck,
  Database,
  Settings,
  BookOpen,
  Plus,
  Bell,
  ChevronDown,
  MoreVertical,
  LogOut,
  UserCheck,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import { FintelLogo } from './FintelLogo';
import { LABELS } from '../constants/labels';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { accentConfig } = useTheme();

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const coreNav = [
    { to: '/', label: LABELS.nav.dashboard, icon: LayoutDashboard },
    { to: '/pipeline', label: LABELS.nav.investigationPipeline, icon: GitFork },
    { to: '/cases', label: LABELS.nav.casesLedger, icon: AlertOctagon },
    { to: '/detection', label: LABELS.nav.detectionEngineShort, icon: ScanSearch },
    { to: '/graph', label: LABELS.nav.transactionGraph, icon: Network },
  ];

  const intelligenceNav = [
    { to: '/agents', label: LABELS.nav.autonomousAgents, icon: Bot },
    { to: '/reports', label: LABELS.nav.sarReports, icon: FileText },
    { to: '/audit', label: LABELS.nav.auditTrail, icon: ShieldCheck },
    { to: '/data', label: LABELS.nav.dataManagement, icon: Database },
  ];

  const systemNav = [
    { to: '/settings', label: LABELS.nav.platformSettings, icon: Settings, isExternal: false },
    { to: '/settings?tab=team', label: 'Institutional Team', icon: Users, isExternal: false },
    { to: '/data-dictionary', label: LABELS.nav.dataDictionary, icon: BookOpen, isExternal: false },
  ];

  const handleLogout = () => {
    localStorage.removeItem('fintel_token');
    navigate('/login');
    window.location.reload();
  };

  return (
    <aside
      className={`app-sidebar w-[250px] sm:w-[240px] bg-[var(--bg-sidebar)] text-[var(--text-secondary)] flex flex-col justify-between shrink-0 border-r border-[var(--border-default)] select-none h-screen sticky top-0 transition-colors duration-250 ${
        isOpen ? 'open' : ''
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Workspace Header */}
        <div className="p-3 pb-2">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all group shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FintelLogo variant="mark" size="md" useAccentColor={true} className="shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold tracking-wider text-[var(--text-primary)] block leading-none font-sans">
                    {LABELS.app.name}
                  </span>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <span>AI</span>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] block mt-1 leading-none truncate">
                  Investigation Suite
                </span>
              </div>
            </div>

            {/* Mobile Close Drawer Button */}
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] lg:hidden shrink-0 cursor-pointer"
                title="Close Navigation"
                aria-label="Close navigation drawer"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors shrink-0" />
            )}
          </div>

          {/* Quick Create Button & Alert Trigger */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <NavLink
              to="/new-investigation"
              onClick={handleNavClick}
              className="flex-1 pulse-btn-primary text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{LABELS.nav.newInvestigation}</span>
            </NavLink>
            <button
              type="button"
              title="Audit Alerts & Notifications"
              onClick={() => {
                navigate('/audit');
                handleNavClick();
              }}
              className="w-8.5 h-8.5 rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. CORE WORKFLOW Section */}
        <div className="px-2 mt-2">
          <p className="px-3 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
            {LABELS.nav.coreWorkflow}
          </p>
          <nav className="space-y-0.5">
            {coreNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === '/' ? location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/overview' : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--text-primary)] font-semibold border-l-2'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                  style={isActive ? { borderLeftColor: accentConfig.primary } : {}}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: isActive ? accentConfig.primary : undefined }}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* 2. INTELLIGENCE & REPORTS Section */}
        <div className="px-2 mt-4">
          <p className="px-3 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
            {LABELS.nav.intelligenceReports}
          </p>
          <nav className="space-y-0.5">
            {intelligenceNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--text-primary)] font-semibold border-l-2'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                  style={isActive ? { borderLeftColor: accentConfig.primary } : {}}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: isActive ? accentConfig.primary : undefined }}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* 3. SYSTEM Section */}
        <div className="px-2 mt-4">
          <p className="px-3 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
            {LABELS.nav.system}
          </p>
          <nav className="space-y-0.5">
            {systemNav.map((item) => {
              const Icon = item.icon;
              if (item.isExternal) {
                return (
                  <a
                    key={item.to}
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleNavClick}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                );
              }

              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--text-primary)] font-semibold border-l-2'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                  style={isActive ? { borderLeftColor: accentConfig.primary } : {}}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: isActive ? accentConfig.primary : undefined }}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Pulse AI Telemetry Status Widget */}
      <div className="mx-2 mb-2 p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-[var(--text-primary)]">System Active</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">100% OK</span>
        </div>
        <div className="w-full bg-[var(--bg-app)] rounded-full h-1 overflow-hidden">
          <div className="bg-[var(--color-accent)] h-full w-full rounded-full animate-pulse" />
        </div>
        <span className="text-[9px] text-[var(--text-muted)] block mt-1.5">
          AI Analysis Active
        </span>
      </div>

      {/* User Profile Footer Card */}
      <div className="p-2 border-t border-[var(--border-default)]">
        <div className="relative">
          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-card-subtle)] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-full border border-[var(--border-default)] flex items-center justify-center font-medium text-xs shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                  borderColor: 'var(--color-accent-border)'
                }}
              >
                SS
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-[var(--text-primary)] leading-tight truncate">
                  Shivam Sharma
                </p>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight truncate">
                  {LABELS.app.leadInvestigatorRole}
                </p>
              </div>
            </div>
            <MoreVertical className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          </div>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-1 right-1 mb-2 p-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 animate-fadeIn space-y-0.5">
              <div className="px-3 py-1.5 border-b border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                Signed in as <strong className="text-[var(--text-primary)]">Shivam Sharma</strong>
              </div>
              <NavLink
                to="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Account Profile</span>
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
