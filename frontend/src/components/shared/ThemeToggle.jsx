import React, { useEffect, useState } from 'react';

const THEME_KEY = 'ljt_theme';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-label="Toggle color theme"
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};

export default ThemeToggle;


