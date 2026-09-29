import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { LABELS } from '../constants/labels';

export interface FintelLogoProps {
  variant?: 'mark' | 'full' | 'image' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  useAccentColor?: boolean;
}

export const FintelLogo: React.FC<FintelLogoProps> = ({
  variant = 'mark',
  size = 'md',
  className = '',
  useAccentColor = false
}) => {
  const { accentConfig } = useTheme();

  // Size mapping
  const markSizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-16 h-16 sm:w-18 sm:h-18 drop-shadow-md'
  };

  const fullSizeMap = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16'
  };

  // Primary accent or default brand cyan-blue
  const primaryColor = useAccentColor ? accentConfig.primary : '#38BDF8';
  const secondaryColor = useAccentColor ? accentConfig.hover : '#2563EB';

  if (variant === 'image') {
    return (
      <img
        src="/fintel-logo.jpg"
        alt="Fintel - Financial Crime Investigation Platform"
        className={`rounded-lg object-contain ${className}`}
      />
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Shield Emblem */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            className={markSizeMap[size]}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`markShieldGrad-${size}`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="60%" stopColor={secondaryColor} />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>

              <linearGradient id={`markFieldGrad-${size}`} x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              <linearGradient id={`markBarGrad-${size}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="100%" stopColor={primaryColor} />
              </linearGradient>

              <linearGradient id={`markWaveGrad-${size}`} x1="20" y1="80" x2="80" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
                <stop offset="50%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>

            {/* Shield Outline */}
            <path
              d="M 50 6 L 88 20 C 88 56, 76 80, 50 94 C 24 80, 12 56, 12 20 Z"
              fill={`url(#markShieldGrad-${size})`}
              stroke="#60A5FA"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Dark Shield Field */}
            <path
              d="M 50 11 L 83 23 C 83 54, 72 75, 50 88 C 28 75, 17 54, 17 23 Z"
              fill={`url(#markFieldGrad-${size})`}
              stroke="#1E3A8A"
              strokeWidth="1"
            />

            {/* Subtle Right Shade */}
            <path
              d="M 50 11 L 83 23 C 83 54, 72 75, 50 88 Z"
              fill="#000000"
              fillOpacity="0.25"
            />

            {/* Ascending Bars */}
            <g fill={`url(#markBarGrad-${size})`}>
              <rect x="23" y="58" width="4.5" height="15" rx="1.2" />
              <rect x="30" y="47" width="4.5" height="26" rx="1.2" />
              <rect x="37" y="36" width="4.5" height="37" rx="1.2" />
              <rect x="44" y="24" width="4.5" height="49" rx="1.2" />
            </g>

            {/* Transaction Graph Nodes & Edges */}
            <g stroke={primaryColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85">
              <line x1="59" y1="33" x2="71" y2="44" />
              <line x1="59" y1="33" x2="57" y2="58" />
              <line x1="71" y1="44" x2="77" y2="65" />
              <line x1="57" y1="58" x2="77" y2="65" />
              <line x1="57" y1="58" x2="65" y2="76" />
            </g>

            <g fill={primaryColor}>
              <circle cx="59" cy="33" r="3.2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1" />
              <circle cx="71" cy="44" r="3" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" />
              <circle cx="57" cy="58" r="3.5" fill={primaryColor} stroke="#0369A1" strokeWidth="1" />
              <circle cx="77" cy="65" r="3.5" fill={primaryColor} stroke="#0369A1" strokeWidth="1" />
              <circle cx="65" cy="76" r="2.8" fill="#0284C7" stroke={primaryColor} strokeWidth="1" />
            </g>

            {/* Dynamic Upward Intelligence Trajectory */}
            <path
              d="M 17 76 C 26 73, 33 63, 44 56 C 54 49, 64 42, 75 34 C 68 40, 56 50, 47 58 C 36 67, 28 77, 20 81 Z"
              fill={`url(#markWaveGrad-${size})`}
              opacity="0.95"
            />
            <path
              d="M 19 75 C 31 71, 44 58, 75 34"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Wordmark Typography */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-[var(--text-primary)] text-base leading-none font-sans">
              {LABELS.app.name}
            </span>
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider text-white cursor-help"
              style={{ backgroundColor: primaryColor }}
              title={LABELS.app.amlCftTooltip}
            >
              {LABELS.app.amlCftBadge}
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-tight text-[var(--text-muted)] leading-tight mt-0.5 truncate">
            {LABELS.app.title}
          </span>
        </div>
      </div>
    );
  }

  // Variant: 'mark' (Standalone Shield Emblem)
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        className={markSizeMap[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`markOnlyShield-${size}`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="60%" stopColor={secondaryColor} />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id={`markOnlyField-${size}`} x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id={`markOnlyBar-${size}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>

          <linearGradient id={`markOnlyWave-${size}`} x1="20" y1="80" x2="80" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>

        {/* Shield Outline */}
        <path
          d="M 50 6 L 88 20 C 88 56, 76 80, 50 94 C 24 80, 12 56, 12 20 Z"
          fill={`url(#markOnlyShield-${size})`}
          stroke="#60A5FA"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Dark Shield Field */}
        <path
          d="M 50 11 L 83 23 C 83 54, 72 75, 50 88 C 28 75, 17 54, 17 23 Z"
          fill={`url(#markOnlyField-${size})`}
          stroke="#1E3A8A"
          strokeWidth="1"
        />

        {/* Subtle Right Shade */}
        <path
          d="M 50 11 L 83 23 C 83 54, 72 75, 50 88 Z"
          fill="#000000"
          fillOpacity="0.25"
        />

        {/* Ascending Bars */}
        <g fill={`url(#markOnlyBar-${size})`}>
          <rect x="23" y="58" width="4.5" height="15" rx="1.2" />
          <rect x="30" y="47" width="4.5" height="26" rx="1.2" />
          <rect x="37" y="36" width="4.5" height="37" rx="1.2" />
          <rect x="44" y="24" width="4.5" height="49" rx="1.2" />
        </g>

        {/* Transaction Graph Nodes & Edges */}
        <g stroke={primaryColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85">
          <line x1="59" y1="33" x2="71" y2="44" />
          <line x1="59" y1="33" x2="57" y2="58" />
          <line x1="71" y1="44" x2="77" y2="65" />
          <line x1="57" y1="58" x2="77" y2="65" />
          <line x1="57" y1="58" x2="65" y2="76" />
        </g>

        <g fill={primaryColor}>
          <circle cx="59" cy="33" r="3.2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1" />
          <circle cx="71" cy="44" r="3" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" />
          <circle cx="57" cy="58" r="3.5" fill={primaryColor} stroke="#0369A1" strokeWidth="1" />
          <circle cx="77" cy="65" r="3.5" fill={primaryColor} stroke="#0369A1" strokeWidth="1" />
          <circle cx="65" cy="76" r="2.8" fill="#0284C7" stroke={primaryColor} strokeWidth="1" />
        </g>

        {/* Dynamic Upward Intelligence Trajectory */}
        <path
          d="M 17 76 C 26 73, 33 63, 44 56 C 54 49, 64 42, 75 34 C 68 40, 56 50, 47 58 C 36 67, 28 77, 20 81 Z"
          fill={`url(#markOnlyWave-${size})`}
          opacity="0.95"
        />
        <path
          d="M 19 75 C 31 71, 44 58, 75 34"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default FintelLogo;
