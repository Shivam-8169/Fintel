import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'twitter' | 'blue' | 'purple' | 'green' | 'orange' | 'red';

export interface AccentColorConfig {
  id: AccentColor;
  label: string;
  primary: string;
  hover: string;
  subtle: string;
  border: string;
  glow: string;
  text: string;
}

export const ACCENT_COLORS: AccentColorConfig[] = [
  {
    id: 'twitter',
    label: 'Twitter Blue (Remix)',
    primary: '#1C9CF0',
    hover: '#1A8CD8',
    subtle: 'rgba(28, 156, 240, 0.12)',
    border: 'rgba(28, 156, 240, 0.3)',
    glow: 'rgba(28, 156, 240, 0.25)',
    text: '#1C9CF0'
  },
  {
    id: 'blue',
    label: 'Cobalt Blue',
    primary: '#3B82F6',
    hover: '#2563EB',
    subtle: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
    glow: 'rgba(59, 130, 246, 0.25)',
    text: '#60A5FA'
  },
  {
    id: 'green',
    label: 'Twitter Green',
    primary: '#00B87A',
    hover: '#009663',
    subtle: 'rgba(0, 184, 122, 0.12)',
    border: 'rgba(0, 184, 122, 0.3)',
    glow: 'rgba(0, 184, 122, 0.25)',
    text: '#00B87A'
  },
  {
    id: 'red',
    label: 'Twitter Pink/Red',
    primary: '#F4212E',
    hover: '#E0245E',
    subtle: 'rgba(244, 33, 46, 0.12)',
    border: 'rgba(244, 33, 46, 0.3)',
    glow: 'rgba(244, 33, 46, 0.25)',
    text: '#F4212E'
  },
  {
    id: 'purple',
    label: 'Electric Purple',
    primary: '#8B5CF6',
    hover: '#7C3AED',
    subtle: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.3)',
    glow: 'rgba(139, 92, 246, 0.25)',
    text: '#A78BFA'
  },
  {
    id: 'orange',
    label: 'Solar Orange',
    primary: '#F97316',
    hover: '#EA580C',
    subtle: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    glow: 'rgba(249, 115, 22, 0.25)',
    text: '#FB923C'
  }
];

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  accent: AccentColor;
  accentConfig: AccentColorConfig;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('fintel_theme_mode') as ThemeMode;
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'dark';
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('fintel_accent_color') as AccentColor;
    return ACCENT_COLORS.some((c) => c.id === saved) ? saved : 'blue';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen to system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'dark' | 'light' = mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;
  const accentConfig = ACCENT_COLORS.find((c) => c.id === accent) || ACCENT_COLORS[1];

  // Apply theme attributes to document.documentElement with smooth transition
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Add transition class momentarily for smooth color change
    root.classList.add('theme-transition');
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    // Set dataset attributes and class toggles for 100% Tailwind and CSS variable compatibility
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-accent', accent);
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.toggle('light', resolvedTheme === 'light');

    if (body) {
      body.setAttribute('data-theme', resolvedTheme);
      body.classList.toggle('dark', resolvedTheme === 'dark');
      body.classList.toggle('light', resolvedTheme === 'light');
    }

    // Directly set CSS variables as well for instant, fail-safe application
    root.style.setProperty('--color-accent', accentConfig.primary);
    root.style.setProperty('--color-accent-hover', accentConfig.hover);
    root.style.setProperty('--color-accent-subtle', accentConfig.subtle);
    root.style.setProperty('--color-accent-border', accentConfig.border);
    root.style.setProperty('--color-accent-glow', accentConfig.glow);
    root.style.setProperty('--color-accent-text', accentConfig.text);

    return () => clearTimeout(timer);
  }, [resolvedTheme, accent, accentConfig]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('fintel_theme_mode', newMode);
  };

  const toggleMode = () => {
    setMode(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    localStorage.setItem('fintel_accent_color', newAccent);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedTheme,
        accent,
        accentConfig,
        setMode,
        setAccent,
        toggleMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
