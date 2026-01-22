/**
 * Theme Context
 *
 * Provides theme state (light/dark/system) to descendant components via Lit Context API.
 * Supports system preference detection and localStorage persistence.
 */

import { createContext } from '@lit/context';

/**
 * Theme preference options
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Resolved theme (actual applied theme)
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Complete theme state
 */
export interface ThemeState {
  /** User's theme preference */
  preference: ThemePreference;
  /** Actual resolved theme (light or dark) */
  resolved: ResolvedTheme;
}

/**
 * Theme context value including state and actions
 */
export interface ThemeContextValue {
  /** Current theme state */
  state: ThemeState;
  /** Set theme preference */
  setTheme: (theme: ThemePreference) => void;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
}

/**
 * localStorage key for theme persistence
 */
export const THEME_STORAGE_KEY = 'tx-theme';

/**
 * Detect system theme preference
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve theme preference to actual theme
 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

/**
 * Apply theme to document root element
 */
export function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Load theme preference from localStorage
 */
export function loadThemePreference(): ThemePreference {
  if (typeof localStorage === 'undefined') {
    return 'system';
  }
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * Save theme preference to localStorage
 */
export function saveThemePreference(preference: ThemePreference): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}

/**
 * Create initial theme state
 */
export function createInitialThemeState(): ThemeState {
  const preference = loadThemePreference();
  return {
    preference,
    resolved: resolveTheme(preference),
  };
}

/**
 * Default theme state
 */
export const defaultThemeState: ThemeState = {
  preference: 'system',
  resolved: 'light',
};

/**
 * Default theme context value
 */
export const defaultThemeContext: ThemeContextValue = {
  state: defaultThemeState,
  setTheme: () => {
    throw new Error('ThemeContext not provided');
  },
  toggleTheme: () => {
    throw new Error('ThemeContext not provided');
  },
};

/**
 * Theme context key for providing/consuming theme state
 */
export const themeContext = createContext<ThemeContextValue>('theme');

/**
 * Subscribe to system theme changes
 * Returns cleanup function
 */
export function subscribeToSystemTheme(callback: (theme: ResolvedTheme) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {
      /* noop for SSR */
    };
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
