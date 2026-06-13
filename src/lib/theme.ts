export type Theme = 'light' | 'dark';

const THEME_KEY = 'omnipost:theme';

export function loadTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const stored = window.localStorage.getItem(THEME_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // ignore
  }

  // Fall back to the OS preference on first run.
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}
