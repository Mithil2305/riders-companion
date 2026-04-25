/**
 * Centralized fixed palette and semantic theme tokens.
 *
 * The application color system is intentionally restricted to:
 * - #B32624
 * - #121212
 * - #212121
 * - #FFFFFF
 * - #000000
 *
 * Any softer states are produced only through opacity variants of those colors.
 */

export const FIXED_PALETTE = {
  primary: '#B32624',
  backgroundDark: '#121212',
  surfaceDark: '#212121',
  white: '#FFFFFF',
  black: '#000000',
} as const;

function toRgba(hexColor: string, alpha: number) {
  const sanitized = hexColor.replace('#', '');

  if (sanitized.length !== 6) {
    return hexColor;
  }

  const red = Number.parseInt(sanitized.slice(0, 2), 16);
  const green = Number.parseInt(sanitized.slice(2, 4), 16);
  const blue = Number.parseInt(sanitized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function alpha(hexColor: string, opacity: number) {
  return toRgba(hexColor, opacity);
}

export const BaseColors = {
  primary: FIXED_PALETTE.primary,
  primaryDark: FIXED_PALETTE.primary,
  backgroundDark: FIXED_PALETTE.backgroundDark,
  surfaceDark: FIXED_PALETTE.surfaceDark,
  textPrimaryDark: FIXED_PALETTE.white,
  textSecondaryDark: alpha(FIXED_PALETTE.white, 0.78),
  success: FIXED_PALETTE.primary,
  danger: FIXED_PALETTE.primary,
  white: FIXED_PALETTE.white,
  black: FIXED_PALETTE.black,
} as const;

export const baseColors = {
  primary: FIXED_PALETTE.primary,
  secondary: FIXED_PALETTE.surfaceDark,
  success: FIXED_PALETTE.primary,
  white: FIXED_PALETTE.white,
  black: FIXED_PALETTE.black,
} as const;

export function createThemeColors(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  const background = isDark ? FIXED_PALETTE.backgroundDark : FIXED_PALETTE.white;
  const surface = isDark ? FIXED_PALETTE.surfaceDark : alpha(FIXED_PALETTE.black, 0.04);
  const card = isDark ? FIXED_PALETTE.surfaceDark : FIXED_PALETTE.white;
  const elevatedSurface = isDark
    ? alpha(FIXED_PALETTE.white, 0.08)
    : alpha(FIXED_PALETTE.black, 0.06);
  const textPrimary = isDark ? FIXED_PALETTE.white : FIXED_PALETTE.black;
  const textSecondary = isDark
    ? alpha(FIXED_PALETTE.white, 0.78)
    : alpha(FIXED_PALETTE.black, 0.72);
  const textTertiary = isDark
    ? alpha(FIXED_PALETTE.white, 0.58)
    : alpha(FIXED_PALETTE.black, 0.56);
  const border = isDark
    ? alpha(FIXED_PALETTE.white, 0.14)
    : alpha(FIXED_PALETTE.black, 0.12);
  const borderStrong = isDark
    ? alpha(FIXED_PALETTE.white, 0.22)
    : alpha(FIXED_PALETTE.black, 0.18);
  const overlay = alpha(FIXED_PALETTE.black, isDark ? 0.68 : 0.48);
  const overlayLight = alpha(FIXED_PALETTE.primary, isDark ? 0.2 : 0.14);
  const primarySoft = alpha(FIXED_PALETTE.primary, isDark ? 0.22 : 0.12);
  const neutralSoft = isDark
    ? alpha(FIXED_PALETTE.white, 0.08)
    : alpha(FIXED_PALETTE.black, 0.05);
  const neutralStrong = isDark
    ? alpha(FIXED_PALETTE.white, 0.14)
    : alpha(FIXED_PALETTE.black, 0.1);

  return {
    primary: FIXED_PALETTE.primary,
    secondary: FIXED_PALETTE.surfaceDark,
    background,
    backgroundLight: FIXED_PALETTE.white,
    surface,
    surfaceDark: FIXED_PALETTE.surfaceDark,
    surfaceRaised: card,
    surfaceMuted: neutralSoft,
    card,
    textPrimary,
    textSecondary,
    textTertiary,
    textInverse: FIXED_PALETTE.white,
    border,
    borderDark: borderStrong,
    overlay,
    overlayLight,
    success: FIXED_PALETTE.primary,
    error: FIXED_PALETTE.primary,
    warning: FIXED_PALETTE.primary,
    info: FIXED_PALETTE.primary,
    icon: textSecondary,
    shadow: FIXED_PALETTE.black,
    tabBarActive: FIXED_PALETTE.primary,
    tabBarInactive: textTertiary,
    spinnerTrack: neutralStrong,
    spinnerHead: FIXED_PALETTE.primary,
    chatListBackground: background,
    chatCardBackground: card,
    chatMetaRed: FIXED_PALETTE.primary,
    chatOnline: FIXED_PALETTE.primary,
    chatActiveBadgeBg: primarySoft,
    chatActiveBadgeBorder: alpha(FIXED_PALETTE.primary, isDark ? 0.34 : 0.22),
    chatActiveBadgeText: FIXED_PALETTE.primary,
    chatEndedBadgeBg: neutralSoft,
    chatEndedBadgeBorder: neutralStrong,
    chatEndedBadgeText: textSecondary,
    chatSearchBg: elevatedSurface,
    chatIncomingBubbleBg: elevatedSurface,
    chatOutgoingBubbleBg: FIXED_PALETTE.primary,
    chatComposerBg: elevatedSurface,
    chatComposerButtonBg: neutralSoft,
    chatTabInactiveBg: elevatedSurface,
    chatHeaderBackground: background,
    chatRouteBadgeBackground: card,
    chatDateBadgeBg: elevatedSurface,
    chatDateBadgeText: textTertiary,
    chatDanger: FIXED_PALETTE.primary,
    buttonPrimaryBg: FIXED_PALETTE.primary,
    buttonPrimaryText: FIXED_PALETTE.white,
    buttonPrimaryGlow: FIXED_PALETTE.primary,
    buttonPrimaryActive: alpha(FIXED_PALETTE.primary, 0.9),
    buttonDisabledBg: neutralStrong,
    buttonDisabledText: isDark
      ? alpha(FIXED_PALETTE.white, 0.48)
      : alpha(FIXED_PALETTE.black, 0.42),
    inputBackground: elevatedSurface,
    focusRing: alpha(FIXED_PALETTE.primary, isDark ? 0.34 : 0.24),
    pressedOverlay: isDark
      ? alpha(FIXED_PALETTE.white, 0.08)
      : alpha(FIXED_PALETTE.black, 0.08),
    primarySoft,
    neutralSoft,
    neutralStrong,
    accent: FIXED_PALETTE.primary,
    danger: FIXED_PALETTE.primary,
    primaryDark: FIXED_PALETTE.primary,
    primaryLight: FIXED_PALETTE.primary,
    secondaryDark: FIXED_PALETTE.surfaceDark,
    secondaryLight: alpha(FIXED_PALETTE.black, 0.14),
    gray100: alpha(FIXED_PALETTE.black, 0.04),
    gray200: alpha(FIXED_PALETTE.black, 0.08),
    gray300: alpha(FIXED_PALETTE.black, 0.12),
    gray400: alpha(FIXED_PALETTE.black, 0.2),
    gray500: alpha(FIXED_PALETTE.black, 0.32),
    gray600: alpha(FIXED_PALETTE.black, 0.44),
    gray700: alpha(FIXED_PALETTE.black, 0.56),
    gray800: alpha(FIXED_PALETTE.black, 0.72),
    gray900: alpha(FIXED_PALETTE.black, 0.88),
    infoLegacy: FIXED_PALETTE.primary,
    warningLegacy: FIXED_PALETTE.primary,
    errorLegacy: FIXED_PALETTE.primary,
    primaryLegacy: FIXED_PALETTE.primary,
    secondaryLegacy: FIXED_PALETTE.surfaceDark,
    successText: FIXED_PALETTE.primary,
    errorText: FIXED_PALETTE.primary,
    white: FIXED_PALETTE.white,
    black: FIXED_PALETTE.black,
  } as const;
}

export type ThemeColors = ReturnType<typeof createThemeColors>;

export const colors = createThemeColors('dark');

export default colors;
