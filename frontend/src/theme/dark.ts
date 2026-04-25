import { createThemeColors } from './colors';

export const darkTheme = {
  mode: 'dark' as const,
  colors: createThemeColors('dark'),
};
