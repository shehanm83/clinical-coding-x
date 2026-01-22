/**
 * Theme Context (Backward Compatibility)
 *
 * This file re-exports from the new location for backward compatibility.
 * New code should import from '../state/contexts/index.js' instead.
 *
 * @deprecated Import from '../state/contexts/index.js' instead
 */

export {
  themeContext,
  type ThemePreference,
  type ResolvedTheme,
  type ThemeState,
  type ThemeContextValue,
  getSystemTheme,
  resolveTheme,
  applyTheme,
  loadThemePreference,
  saveThemePreference,
  createInitialThemeState,
  subscribeToSystemTheme,
  THEME_STORAGE_KEY,
  defaultThemeContext,
  defaultThemeState,
} from '../state/contexts/theme-context.js';

// Re-export Theme as alias for backward compatibility
export type { ThemePreference as Theme } from '../state/contexts/theme-context.js';
