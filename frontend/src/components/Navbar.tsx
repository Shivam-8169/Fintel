import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, LogOut, PanelLeft, X, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import { ThemeCustomizer } from './ThemeCustomizer';
import { FintelLogo } from './FintelLogo';
import { useTheme } from '../context/ThemeContext';

import { LABELS } from '../constants/labels';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onToggleSidebar,
  isSidebarOpen = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, toggleMode } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/cases?search=${encodeURIComponent(searchValue.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  const getBreadcrumbTitle = () => {
    const p = location.pathname;
    if (p === '/' || p === '/dashboard' || p === '/overview') return LABELS.nav.overview;
    if (p.includes('/pipeline') || p.includes('/new-investigation')) return LABELS.nav.investigationPipeline;
    if (p.includes('/cases')) return LABELS.nav.casesLedger;
    if (p.includes('/detection')) return LABELS.nav.detectionEngineShort;
    if (p.includes('/graph')) return LABELS.nav.transactionGraph;
    if (p.includes('/agents')) return LABELS.nav.autonomousAgents;
    if (p.includes('/data')) return LABELS.nav.dataManagement;
    if (p.includes('/reports')) return LABELS.nav.sarReports;
    if (p.includes('/audit')) return LABELS.nav.auditTrail;
    if (p.includes('/settings')) return LABELS.nav.platformSettings;
    if (p.includes('/evaluation')) return 'Performance & Accuracy';
    return LABELS.app.title;
  };

  return (
    <header className="app-header h-14 bg-[var(--bg-header)]/95 backdrop-blur-md border-b border-[var(--border-default)] px-3 sm:px-5 lg:px-7 flex items-center justify-between sticky top-0 z-30 select-none transition-colors duration-250">
      {/* Left side: Panel Toggle & Context Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Close Navigation' : 'Open Navigation'}
          aria-label={isSidebarOpen ? 'Close Navigation' : 'Open Navigation'}
          className="p-1.5 sm:p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors flex items-center justify-center cursor-pointer shrink-0"
        >
          {isSidebarOpen ? <X className="w-5 h-5 text-[var(--color-accent)]" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="w-[1px] h-4 bg-[var(--border-default)] hidden sm:block shrink-0" />

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
          <FintelLogo variant="mark" size="xs" useAccentColor={true} className="shrink-0 hidden xs:block" />
          <span className="text-[var(--text-muted)] font-bold tracking-wide hidden md:inline">{LABELS.app.name}</span>
          <span className="text-[var(--text-muted)] opacity-50 hidden md:inline">/</span>
          <span className="font-semibold text-[var(--text-primary)] px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-default)] truncate text-[11px] sm:text-xs">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Right Controls: Search, Live Ledger Status, Theme Customizer, Bell, User */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setMobileSearchOpen(!mobileSearchOpen);
            setTimeout(() => mobileSearchRef.current?.focus(), 100);
          }}
          title="Search"
          className="p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] md:hidden flex items-center justify-center cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Global Search Input with ⌘K Badge & Clear Button */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center w-56 lg:w-76">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            id="global-search-input"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search cases, accounts..."
            className="w-full pl-8.5 pr-9 py-1.5 text-xs bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] focus:bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent-subtle)] rounded-full text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all duration-200"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                searchInputRef.current?.focus();
              }}
              title="Clear search"
              className="absolute right-2.5 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--text-muted)] bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-full pointer-events-none hidden lg:inline">
              ⌘K
            </kbd>
          )}
        </form>

        {/* Pulse Live Activity Monitoring Beacon */}
        <div className="hidden xl:inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 backdrop-blur-sm shrink-0">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>{LABELS.app.surveillanceLive}</span>
        </div>

        {/* Theme Mode Quick Toggle (Sun / Moon) */}
        <button
          type="button"
          onClick={toggleMode}
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          className="relative p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors flex items-center justify-center cursor-pointer shrink-0"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform active:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:text-slate-900 transition-transform active:-rotate-45" />
          )}
        </button>

        {/* Theme Customizer Popover Trigger */}
        <ThemeCustomizer />

        {/* Notifications Bell */}
        <button
          type="button"
          title="System Notifications"
          onClick={() => navigate('/audit')}
          className="relative p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span
            className="w-1.5 h-1.5 rounded-full absolute top-1 right-1"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
        </button>

        <div className="h-3.5 w-[1px] bg-[var(--border-default)] hidden sm:block" />

        {/* User Identity or Sign In */}
        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate max-w-[160px]">
                {user.name}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                    user.role?.toLowerCase().includes('admin')
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      : user.role?.toLowerCase().includes('lead')
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
            <div
              className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                user.role?.toLowerCase().includes('admin')
                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  : user.role?.toLowerCase().includes('lead')
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
              title={`${user.name} (${user.role}) - ${user.email}`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => {
                onLogout();
                navigate('/login');
              }}
              title="Sign Out"
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-xs font-medium text-[var(--text-primary)] hover:text-white px-3 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--color-accent)] border border-[var(--border-default)] transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile Search Dropdown Bar */}
      {mobileSearchOpen && (
        <div className="absolute top-14 left-0 right-0 p-2.5 bg-[var(--bg-header)] border-b border-[var(--border-default)] shadow-lg md:hidden animate-fadeIn z-40">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
            <input
              ref={mobileSearchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search cases, accounts..."
              className="w-full pl-8.5 pr-8 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="absolute right-2.5 p-1 text-[var(--text-muted)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </form>
        </div>
      )}
    </header>
  );
};
export default Navbar;
