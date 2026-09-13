"use client";

import React, { useState, useEffect } from 'react';
import { SegmentedControl } from './SegmentedControl';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) setTheme(stored);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
