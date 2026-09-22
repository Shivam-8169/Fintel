import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Cpu, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                FINTEL
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Autonomous AML/CFT
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Explainable Multi-Agent Financial Crime Investigation System
            </p>
          </div>
        </Link>
      </div>

      {/* Center Status Badges */}
      <div className="hidden lg:flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine: <strong className="text-emerald-400">Online</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mode: <strong className="text-cyan-400">Demo/Mock AI Active</strong></span>
        </div>
        <div className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          ACADEMIC PBL PROTOTYPE
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">{user.name}</p>
              <p className="text-xs text-cyan-400 uppercase tracking-wider">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-300">
              <UserIcon className="w-5 h-5" />
            </div>
            <button
              onClick={() => {
                onLogout();
                navigate('/login');
              }}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
