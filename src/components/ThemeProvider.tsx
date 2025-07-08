import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useAppSettings();
  const [theme, setThemeState] = useState<Theme>(() => {
    // Try to get theme from localStorage first, then settings, then default to system
    const localTheme = localStorage.getItem('theme') as Theme;
    return localTheme || settings.theme || 'system';
  });

  // Sync theme from settings
  useEffect(() => {
    if (settings.theme && settings.theme !== theme) {
      setThemeState(settings.theme);
      localStorage.setItem('theme', settings.theme);
    }
  }, [settings.theme, theme]);

  // Update settings and local state
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    updateSettings({ theme: newTheme });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 