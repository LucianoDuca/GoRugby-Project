import React from 'react';

// Each club has its own color identity
export const CLUB_THEMES: Record<string, { primary: string; secondary: string; accent: string }> = {
  mrc: { primary: '#0f4c2a', secondary: '#1a6b3c', accent: '#fbbf24' }, // Mendoza Rugby — deep green + gold
  mar: { primary: '#1e3a8a', secondary: '#2563eb', accent: '#ffffff' }, // Marista RC — royal blue + white
  lot: { primary: '#7f1d1d', secondary: '#991b1b', accent: '#fcd34d' }, // Los Tordos — crimson + amber
  peq: { primary: '#064e3b', secondary: '#065f46', accent: '#6ee7b7' }, // Peumayén RC — forest green + mint
  brc: { primary: '#1e293b', secondary: '#334155', accent: '#93c5fd' }, // Banco RC — navy + light blue
  teq: { primary: '#4c1d95', secondary: '#5b21b6', accent: '#c4b5fd' }, // Teqüe RC — deep purple + lavender
};

interface ClubLogoProps {
  clubId: string;
  initials: string;
  size?: number;
  className?: string;
}

// SVG shield badge with unique colors per club
export function ClubLogo({ clubId, initials, size = 48, className }: ClubLogoProps) {
  const theme = CLUB_THEMES[clubId] ?? { primary: '#065f46', secondary: '#059669', accent: '#ffffff' };
  const id = `club-grad-${clubId}`;
  const fontSize = size * 0.3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      className={className}
      aria-label={initials}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={theme.secondary} />
          <stop offset="100%" stopColor={theme.primary} />
        </linearGradient>
        <filter id={`shadow-${clubId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Shield shape */}
      <path
        d="M50 4 L92 20 L92 58 C92 83 72 96 50 104 C28 96 8 83 8 58 L8 20 Z"
        fill={`url(#${id})`}
        filter={`url(#shadow-${clubId})`}
      />
      {/* Top trim line */}
      <path
        d="M50 4 L92 20 L92 26 L50 10 L8 26 L8 20 Z"
        fill={theme.accent}
        opacity="0.35"
      />
      {/* Bottom trim line */}
      <path
        d="M26 80 C34 92 42 100 50 104 C58 100 66 92 74 80 Z"
        fill={theme.accent}
        opacity="0.25"
      />
      {/* Initials */}
      <text
        x="50"
        y="62"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill={theme.accent}
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        {initials}
      </text>
    </svg>
  );
}

// Compact circular version for match cards
export function ClubBadge({ clubId, initials, size = 44 }: { clubId: string; initials: string; size?: number }) {
  const theme = CLUB_THEMES[clubId] ?? { primary: '#065f46', secondary: '#059669', accent: '#ffffff' };
  const id = `badge-grad-${clubId}-${size}`;
  const fontSize = size * 0.32;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={theme.secondary} />
          <stop offset="100%" stopColor={theme.primary} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="43" fill="none" stroke={theme.accent} strokeWidth="1.5" opacity="0.3" />
      <text
        x="50" y="50"
        textAnchor="middle" dominantBaseline="middle"
        fontSize={fontSize} fontWeight="900"
        fill={theme.accent}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
