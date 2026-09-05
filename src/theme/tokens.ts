import { Platform } from 'react-native';

/**
 * Design tokens for Receipt Scanner.
 *
 * Direction: dark navy canvas, one electric-violet accent used sparingly,
 * monospace reserved for numeric/technical data (prices, dates, raw OCR text).
 * There is currently only a dark theme — the scanner glow and card surfaces
 * are the whole visual identity, so a bolted-on light mode would dilute it
 * rather than extend it. See README for the reasoning.
 */

export const colors = {
  // Canvas — near-black with a faint blue-violet undertone, not pure #000.
  background: '#0A0A14',
  backgroundElevated: '#0F0F1C',

  // Surfaces — cards and sheets sit one or two steps above the canvas.
  surface: '#13131F',
  surfaceRaised: '#1B1B2E',
  surfaceOverlay: 'rgba(10, 10, 20, 0.88)',

  // Hairlines — always subtle, never a hard white/gray border.
  border: '#24243A',
  borderStrong: '#33334D',

  // Text
  textPrimary: '#F4F4FB',
  textSecondary: '#9C9CB8',
  textTertiary: '#65657F',
  textOnAccent: '#0A0A14',

  // Primary accent — electric violet. Used for the hero CTA, the scanner
  // glow, active states, and links. Not smeared across every element.
  accent: '#7C5CFF',
  accentMuted: '#4A3A8F',
  accentSoft: 'rgba(124, 92, 255, 0.16)',
  accentGlow: 'rgba(124, 92, 255, 0.45)',

  // Semantic — desaturated so they sit quietly next to the accent.
  success: '#4ADE94',
  successSoft: 'rgba(74, 222, 148, 0.14)',
  error: '#F0637A',
  errorSoft: 'rgba(240, 99, 122, 0.14)',
  warning: '#F0B45C',
  warningSoft: 'rgba(240, 180, 92, 0.14)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

// iOS needs a real font name for monospace; Android accepts the generic
// family name. Both resolve to the platform's built-in mono face — no
// custom font assets to bundle or risk mis-loading.
const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const typography = {
  fontFamily: {
    sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    sansMedium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    mono: monoFamily,
  },
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  mono: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  monoLarge: { fontSize: 28, lineHeight: 34, fontWeight: '600' as const },
} as const;

// Neutral elevation shadow (iOS) — Android uses `elevation` instead.
export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  // Violet glow for the scanner frame / primary CTA — a real accent shadow,
  // not a generic gray drop-shadow, used only on the one or two elements
  // meant to feel alive.
  accentGlow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
  scannerPulse: 1600,
} as const;

export const gradients = {
  heroGlow: [colors.accentMuted, 'transparent'] as const,
  scanFrame: ['rgba(124, 92, 255, 0.9)', 'rgba(124, 92, 255, 0.2)'] as const,
  cardSheen: ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0)'] as const,
};

export type Colors = typeof colors;
