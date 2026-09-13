"use client";

import React, { useEffect, useSyncExternalStore } from 'react';
import { SegmentedControl } from './SegmentedControl';

type Theme = 'light' | 'dark' | 'system';
const THEME_STORAGE_KEY = 'theme';
const themeListeners = new Set<() => void>();

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : 'system';
}

function getServerThemeSnapshot(): Theme {
  return 'system';
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);

  if (typeof window !== 'undefined') {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) listener();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      themeListeners.delete(listener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  return () => themeListeners.delete(listener);
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const isDark = theme === 'dark'
    || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    themeListeners.forEach((listener) => listener());
  };

  return (
    <div className="w-full flex justify-center mt-4">
      <SegmentedControl
        options={[
          { label: 'Claro', value: 'light' },
          { label: 'Oscuro', value: 'dark' },
          { label: 'Auto', value: 'system' }
        ]}
        value={theme}
        onChange={handleThemeChange}
        className="scale-90 origin-bottom"
      />
    </div>
  );
}
