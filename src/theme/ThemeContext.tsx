import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';
import { ThemeMode } from '../types/Task';

const THEME_STORAGE_KEY = '@aair_todo/theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isHydrating: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to the device's current appearance until we know the user's saved preference.
  const [mode, setModeState] = useState<ThemeMode>(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
  const [isHydrating, setIsHydrating] = useState(true);

  // Load any previously saved theme preference on mount.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setModeState(saved);
        }
      } catch (error) {
        console.warn('Failed to load theme preference', error);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  const persistMode = async (next: ThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.warn('Failed to save theme preference', error);
    }
  };

  const toggleTheme = () => persistMode(mode === 'light' ? 'dark' : 'light');
  const setMode = (next: ThemeMode) => persistMode(next);

  const colors = useMemo(() => (mode === 'dark' ? darkColors : lightColors), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setMode, isHydrating }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
