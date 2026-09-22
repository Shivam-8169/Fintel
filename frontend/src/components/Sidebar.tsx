import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertOctagon,
  FileCheck2,
  FileClock,
  UploadCloud,
  Network
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/cases', label: 'Flagged Cases', icon: AlertOctagon },
    { to: '/audit', label: 'Audit Trail', icon: FileClock },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3">
          Investigation Center
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Pipeline Agents
          </div>
          <div className="space-y-2 px-3 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Ingestion Agent</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">v1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Detection & Rules</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">v1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Investigation Agent</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">LLM/Demo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Reporting Agent</span>
              </span>
              <span className="text-[10px] text-purple-400 font-mono">SAR-v1</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
          <FileCheck2 className="w-4 h-4" />
          <span>Human-in-the-Loop</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          AI drafts are strictly non-authoritative. Final regulatory filings require human investigator sign-off.
        </p>
      </div>
    </aside>
  );
};
