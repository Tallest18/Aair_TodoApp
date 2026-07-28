export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  secondary: string;
  primaryText: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  overdue: string;
  fabShadow: string;
  /** Background gradient behind the whole screen. */
  backgroundGradient: [string, string, string];
  /** Gradient used on the hero/stats header card and the primary CTA. */
  heroGradient: [string, string];
  /** Colors for the two decorative background blobs. */
  blobColors: [string, string];
  /** Translucent fill for frosted-glass cards, layered over a BlurView. */
  glassFill: string;
  /** Translucent border for frosted-glass cards. */
  glassBorder: string;
  /** Blur tint passed to expo-blur's <BlurView tint=...>. */
  blurTint: 'light' | 'dark';
  /** Shadow color for elevated cards (glass cards, task rows). */
  cardShadow: string;
}

export const lightColors: ThemeColors = {
  background: '#F4F5FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F1F9',
  primary: '#4F46E5',
  secondary: '#DB2777',
  primaryText: '#FFFFFF',
  text: '#161726',
  textSecondary: '#4B4D5C',
  textMuted: '#7A7D8E',
  border: '#E3E5EE',
  success: '#16A34A',
  danger: '#DC2626',
  overdue: '#EA580C',
  fabShadow: 'rgba(79, 70, 229, 0.45)',
  backgroundGradient: ['#EEF1FF', '#F6EEFE', '#FFEFF6'],
  heroGradient: ['#4F46E5', '#DB2777'],
  blobColors: ['#818CF8', '#F472B6'],
  glassFill: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  blurTint: 'light',
  cardShadow: 'rgba(79, 70, 229, 0.18)',
};

export const darkColors: ThemeColors = {
  background: '#0B0C18',
  surface: '#20223A',
  surfaceAlt: '#2A2C46',
  primary: '#8B87FF',
  secondary: '#FF6FB5',
  primaryText: '#12131A',
  text: '#F5F6FC',
  textSecondary: '#C7C9DC',
  textMuted: '#9294AC',
  border: '#3A3C5A',
  success: '#4ADE80',
  danger: '#FB7185',
  overdue: '#FB923C',
  fabShadow: 'rgba(139, 135, 255, 0.5)',
  backgroundGradient: ['#0B0C18', '#1E1B4B', '#4C0F5C'],
  heroGradient: ['#6D28D9', '#DB2777'],
  blobColors: ['#8B87FF', '#FF6FB5'],
  glassFill: 'rgba(42, 44, 70, 0.78)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  blurTint: 'dark',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
};
