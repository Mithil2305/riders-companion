/**
 * Color palette for the app
 */

export const BaseColors = {
  primary: '#D84040',
  primaryDark: '#A31D1D',
  backgroundDark: '#181515',
  surfaceDark: '#2B2525',
  textPrimaryDark: '#F8F2DE',
  textSecondaryDark: '#ECDCBF',
  success: '#4CAF50',
  danger: '#D84040',
  white: '#FFFFFF',
  black: '#000000',
};

export const baseColors = {
  primary: BaseColors.primary,
  secondary: BaseColors.primaryDark,
  success: BaseColors.success,
  white: BaseColors.white,
  black: BaseColors.black,
};

export const colors = {
  // Brand colors (strict)
  primary: '#D84040',
  secondary: '#A31D1D',
  background: '#181515',
  card: '#2B2525',
  textPrimary: '#F8F2DE',
  textSecondary: '#ECDCBF',
  success: '#4CAF50',

  // Extended brand shades
  primaryDark: '#8B1515',
  primaryLight: '#E46868',
  secondaryDark: '#6F1212',
  secondaryLight: '#BF4A4A',
  
  // Semantic colors
  warning: '#FFB74D',
  error: '#FF6B6B',
  info: '#84A9FF',

  // Utility colors
  black: '#000000',
  white: '#FFFFFF',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#C7C7CC',
  gray400: '#8E8E93',
  gray500: '#636366',
  gray600: '#48484A',
  gray700: '#3A3A3C',
  gray800: '#2C2C2E',
  gray900: '#1C1C1E',

  // Surface colors
  surface: '#231D1D',
  surfaceDark: '#171313',

  // Text and border
  textTertiary: '#B9AA93',
  textInverse: '#FFFFFF',
  border: 'rgba(236, 220, 191, 0.22)',
  borderDark: 'rgba(236, 220, 191, 0.12)',

  // Overlay
  overlay: 'rgba(10, 7, 7, 0.66)',
  overlayLight: 'rgba(248, 242, 222, 0.12)',

  // Legacy aliases kept for compatibility
  backgroundLight: '#F5F5F5',
  danger: '#FF6B6B',
  accent: '#D84040',

  // Backward compatibility aliases
  infoLegacy: '#5AC8FA',
  warningLegacy: '#FF9500',
  errorLegacy: '#FF3B30',

  // Deprecated aliases retained for old imports
  primaryLegacy: '#007AFF',
  secondaryLegacy: '#5856D6',

  // Standard semantic aliases
  successText: '#4CAF50',
  errorText: '#FF6B6B',
};

export default colors;
