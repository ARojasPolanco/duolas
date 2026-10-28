import { useId } from 'react';

const PALETTES = {
  iron: {
    light: '#d3d7de',
    mid: '#7f8792',
    dark: '#3d434d',
    edge: '#252a32',
    inner: '#5b626d',
    gemLight: '#f4f6f9',
    gemDark: '#8d95a1',
    glow: '#aab2bf',
  },
  bronze: {
    light: '#f3bb8d',
    mid: '#bd704a',
    dark: '#6b3522',
    edge: '#452217',
    inner: '#8f4b30',
    gemLight: '#ffe0c2',
    gemDark: '#a85a36',
    glow: '#d98152',
  },
  silver: {
    light: '#f4f8fc',
    mid: '#b8c2cf',
    dark: '#626c7b',
    edge: '#3e4653',
    inner: '#8a96a7',
    gemLight: '#ffffff',
    gemDark: '#91a2b7',
    glow: '#cfd8e3',
  },
  gold: {
    light: '#ffe89b',
    mid: '#e2aa32',
    dark: '#8c5b0b',
    edge: '#5e3b04',
    inner: '#b87c18',
    gemLight: '#fff5bf',
    gemDark: '#d89a17',
    glow: '#f5c451',
  },
  platinum: {
    light: '#c3fff7',
    mid: '#3ec5bd',
    dark: '#0f6f6c',
    edge: '#074b4a',
    inner: '#168e88',
    gemLight: '#e7fffc',
    gemDark: '#23aaa3',
    glow: '#4fd1c5',
  },
  emerald: {
    light: '#c4ffdd',
    mid: '#2fc47a',
    dark: '#0a5c3a',
    edge: '#043d27',
    inner: '#108352',
    gemLight: '#ecfff4',
    gemDark: '#19aa68',
    glow: '#34d399',
  },
  diamond: {
    light: '#e2f7ff',
    mid: '#62b0ff',
    dark: '#184da3',
    edge: '#0b2e69',
    inner: '#2e77d2',
    gemLight: '#f4fcff',
    gemDark: '#3e92ea',
    glow: '#60a5fa',
  },
  master: {
    light: '#f1caff',
    mid: '#b45cf7',
    dark: '#5c149e',
    edge: '#3b0871',
    inner: '#8226d1',
    gemLight: '#fcecff',
    gemDark: '#9638ec',
    glow: '#a855f7',
  },
  grandmaster: {
    light: '#ffcbb8',
    mid: '#f05252',
    dark: '#8e1118',
    edge: '#58070d',
    inner: '#bc2022',
    gemLight: '#ffe6df',
    gemDark: '#e02f2f',
    glow: '#ef4444',
  },
  challenger: {
    light: '#ddf8ff',
    mid: '#42c7ff',
    dark: '#0b519e',
    edge: '#06346d',
    inner: '#1775ca',
    gemLight: '#fff1b8',
    gemDark: '#f5c451',
    glow: '#f5c451',
  },
};

const HORNED_TIERS = ['grandmaster', 'challenger'];

export default function RankIcon({ tier, size = 24, className = '' }) {
  const palette = PALETTES[tier];
  const uid = useId().replace(/:/g, '');

  if (!palette) return null;

  const bodyId = `${uid}-body`;
  const innerId = `${uid}-inner`;
  const gemId = `${uid}-gem`;
  const glowId = `${uid}-glow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={bodyId} x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={palette.light} />
          <stop offset="0.45" stopColor={palette.mid} />
          <stop offset="1" stopColor={palette.dark} />
        </linearGradient>
        <linearGradient id={innerId} x1="22" y1="16" x2="42" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={palette.inner} />
          <stop offset="1" stopColor={palette.dark} />
        </linearGradient>
        <linearGradient id={gemId} x1="26" y1="20" x2="38" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={palette.gemLight} />
          <stop offset="0.55" stopColor={palette.mid} />
          <stop offset="1" stopColor={palette.gemDark} />
        </linearGradient>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor={palette.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="32" cy="49" rx="19" ry="8" fill={`url(#${glowId})`} />

      <path
        d="M32 4 L44 8 L57 5 L54 21 L47 35 L40 45 L32 60 L24 45 L17 35 L10 21 L7 5 L20 8 Z"
        fill={`url(#${bodyId})`}
        stroke={palette.edge}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      <path
        d="M32 12 L42 16 L48 27 L42 37 L32 50 L22 37 L16 27 L22 16 Z"
        fill={`url(#${innerId})`}
        stroke={palette.edge}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      <path d="M14 10 L16 22 L22 34 L21 18 Z" fill="#ffffff" opacity="0.16" />
      <path d="M50 10 L48 22 L42 34 L43 18 Z" fill="#000000" opacity="0.18" />
      <path d="M25 13 L32 9 L39 13 L32 18 Z" fill={palette.light} opacity="0.35" />

      <path
        d="M32 20 L39 31 L32 44 L25 31 Z"
        fill={`url(#${gemId})`}
        stroke={palette.edge}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M32 22 L32 42 M26 31 L38 31"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
      <path d="M32 48 L35 54 L32 58 L29 54 Z" fill={palette.light} opacity="0.34" />

      {HORNED_TIERS.includes(tier) ? (
        <>
          <path
            d="M20 8 L16 1 L14 11"
            fill="none"
            stroke={palette.light}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 8 L48 1 L50 11"
            fill="none"
            stroke={palette.light}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {tier === 'grandmaster' || tier === 'challenger' ? (
        <path
          d="M27 7 L32 0 L37 7"
          fill="none"
          stroke={palette.light}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {tier === 'challenger' ? (
        <circle
          cx="32"
          cy="5"
          r="2.4"
          fill={palette.gemLight}
          stroke={palette.edge}
          strokeWidth="0.8"
        />
      ) : null}
    </svg>
  );
}
