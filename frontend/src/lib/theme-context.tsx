'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveTheme(t: Theme): 'light' | 'dark' {
  if (t !== 'system') return t;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = (localStorage.getItem('escola-theme') as Theme | null) || 'light';
    setThemeState(stored);
    setResolved(resolveTheme(stored));

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const cur = (localStorage.getItem('escola-theme') as Theme | null) || 'light';
      if (cur === 'system') setResolved(mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  const setTheme = (t: Theme) => {
    localStorage.setItem('escola-theme', t);
    setThemeState(t);
    setResolved(resolveTheme(t));
  };

  const toggle = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
