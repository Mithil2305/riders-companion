import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'react-native';
import { darkTheme } from '../theme/dark';
import { lightTheme } from '../theme/light';

const THEME_MODE_KEY = 'theme_mode_preference';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  colors: (typeof lightTheme)['colors'];
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const restoreThemePreference = async () => {
      const savedMode = await SecureStore.getItemAsync(THEME_MODE_KEY);
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode);
      }
    };

    void restoreThemePreference();
  }, []);

  const resolvedMode: ResolvedThemeMode =
    mode === 'system' ? (deviceTheme === 'dark' ? 'dark' : 'light') : mode;

  const palette = resolvedMode === 'dark' ? darkTheme.colors : lightTheme.colors;

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await SecureStore.setItemAsync(THEME_MODE_KEY, nextMode);
  };

  const toggleMode = async () => {
    const nextMode: ThemeMode = resolvedMode === 'dark' ? 'light' : 'dark';
    await setMode(nextMode);
  };

  const value = useMemo(
    () => ({ mode, resolvedMode, colors: palette, setMode, toggleMode }),
    [mode, resolvedMode, palette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }

  return context;
}
