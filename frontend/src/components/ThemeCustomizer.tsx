import React, { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode, AccentColor, ACCENT_COLORS } from '../context/ThemeContext';

export const ThemeCustomizer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, resolvedTheme, accent, accentConfig, setMode, setAccent } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const modeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      {/* Navbar Trigger Button with Current Accent Dot */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Customize Theme & Accent"
        aria-label="Customize Theme & Accent"
        className={`relative p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-[var(--bg-card-hover)] border-[var(--border-strong)] text-[var(--text-primary)] shadow-xs'
            : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
        }`}
      >
        <Palette className="w-4 h-4" />
        {/* Dynamic accent color indicator dot */}
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--bg-app)] shadow-xs animate-pulse"
          style={{ backgroundColor: accentConfig.primary }}
        />
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-3.5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-elevated z-50 animate-fadeIn backdrop-blur-md text-left select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                style={{ backgroundColor: accentConfig.primary }}
              >
                <Palette className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Theme Settings</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono capitalize">
              {resolvedTheme} • {accentConfig.id}
            </span>
          </div>

          {/* Section 1: Interface Mode */}
          <div className="space-y-1.5 mb-3.5">
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block">
              Display Mode
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-card-subtle)] border border-[var(--border-default)] rounded-xl">
              {modeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-strong)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Accent Color Palette */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block">
                Accent Color
              </span>
              <span className="text-[10px] text-[var(--color-accent-text)] font-medium">
                {accentConfig.label}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {ACCENT_COLORS.map((col) => {
                const isSelected = accent === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setAccent(col.id)}
                    title={col.label}
                    className={`group relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-card-hover)] border-[var(--border-strong)] shadow-xs'
                        : 'bg-[var(--bg-card-subtle)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <span
                      className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: col.primary }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className="text-[8px] font-medium text-[var(--text-muted)] mt-1 truncate capitalize max-w-full">
                      {col.id === 'twitter' ? 'Twitter' : col.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Live Application Preview */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)]">Saved in preferences</span>
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: accentConfig.subtle,
                borderColor: accentConfig.border,
                color: accentConfig.text
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentConfig.primary }} />
              <span>Theme Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeCustomizer;
