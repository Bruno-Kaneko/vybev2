// VYBE Color System — based on official brand palette
export const Colors = {
  // Backgrounds
  background: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1C1C1C',
  border: '#222222',

  // Primary — Purple
  primary: '#9B5DE5',
  primaryShade: '#B89AF5',      // lighter lavender (Primary Shade)
  primaryDim: '#7A3FC0',
  primaryGlow: 'rgba(155, 93, 229, 0.35)',

  // Secondary — Hot Pink
  secondary: '#F43F8B',
  secondaryShade: '#C0145A',    // deep magenta (Secondary Shade)
  secondaryDim: '#D4307A',
  secondaryGlow: 'rgba(244, 63, 139, 0.35)',

  // Accent — White (used for highlights/icons)
  accent: '#FFFFFF',

  // Semantic
  error: '#F47070',             // coral red
  errorGlow: 'rgba(244, 112, 112, 0.35)',
  success: '#8EF040',           // lime green
  successGlow: 'rgba(142, 240, 64, 0.3)',

  // Gradients (LinearGradient color arrays)
  gradientPrimary: ['#FF5CAD', '#C96FFF'] as [string, string],   // Primary Gradient (pink → purple)
  gradientBrand: ['#F43F8B', '#9B5DE5'] as [string, string],     // secondary → primary
  gradientDark: ['#0A0A0A', '#141414'] as [string, string],
  gradientFeed: ['transparent', 'rgba(10, 10, 10, 0.92)'] as [string, string],
  gradientCard: ['rgba(20, 20, 20, 0)', 'rgba(20, 20, 20, 0.96)'] as [string, string],

  // Text
  text: '#FFFFFF',
  textDim: '#777777',           // Text (Dim)
  textMuted: '#555555',
  textDisabled: '#333333',

  // Misc
  gold: '#FFD700',
  goldGlow: 'rgba(255, 215, 0, 0.3)',
  urgent: '#F47070',
  urgentGlow: 'rgba(244, 112, 112, 0.4)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(0, 0, 0, 0.35)',
} as const;

export type ColorKey = keyof typeof Colors;
