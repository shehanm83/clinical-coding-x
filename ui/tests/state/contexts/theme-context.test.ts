/**
 * Theme Context Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  themeContext,
  defaultThemeContext,
  defaultThemeState,
  THEME_STORAGE_KEY,
  getSystemTheme,
  resolveTheme,
  applyTheme,
  loadThemePreference,
  saveThemePreference,
  createInitialThemeState,
  subscribeToSystemTheme,
  type ThemePreference,
  type ResolvedTheme,
  type ThemeState,
} from '../../../src/state/contexts/theme-context.js';

describe('theme-context', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('context creation', () => {
    it('exports themeContext', () => {
      expect(themeContext).toBeDefined();
    });
  });

  describe('THEME_STORAGE_KEY', () => {
    it('is tx-theme', () => {
      expect(THEME_STORAGE_KEY).toBe('tx-theme');
    });
  });

  describe('defaultThemeState', () => {
    it('has system preference', () => {
      expect(defaultThemeState.preference).toBe('system');
    });

    it('has light resolved theme', () => {
      expect(defaultThemeState.resolved).toBe('light');
    });
  });

  describe('defaultThemeContext', () => {
    it('has default state', () => {
      expect(defaultThemeContext.state).toEqual(defaultThemeState);
    });

    it('has action methods that throw when not provided', () => {
      expect(() => defaultThemeContext.setTheme('light')).toThrow('ThemeContext not provided');
      expect(() => defaultThemeContext.toggleTheme()).toThrow('ThemeContext not provided');
    });
  });

  describe('getSystemTheme', () => {
    it('returns light when system prefers light', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('light');

      window.matchMedia = originalMatchMedia;
    });

    it('returns dark when system prefers dark', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('dark');

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('resolveTheme', () => {
    it('returns light for light preference', () => {
      expect(resolveTheme('light')).toBe('light');
    });

    it('returns dark for dark preference', () => {
      expect(resolveTheme('dark')).toBe('dark');
    });

    it('returns system theme for system preference', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(resolveTheme('system')).toBe('dark');

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('applyTheme', () => {
    it('sets data-theme attribute to light', () => {
      applyTheme('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('sets data-theme attribute to dark', () => {
      applyTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('loadThemePreference', () => {
    it('returns system when no preference stored', () => {
      expect(loadThemePreference()).toBe('system');
    });

    it('returns light when light stored', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      expect(loadThemePreference()).toBe('light');
    });

    it('returns dark when dark stored', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      expect(loadThemePreference()).toBe('dark');
    });

    it('returns system when system stored', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'system');
      expect(loadThemePreference()).toBe('system');
    });

    it('returns system for invalid stored value', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'invalid');
      expect(loadThemePreference()).toBe('system');
    });
  });

  describe('saveThemePreference', () => {
    it('saves light preference', () => {
      saveThemePreference('light');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });

    it('saves dark preference', () => {
      saveThemePreference('dark');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('saves system preference', () => {
      saveThemePreference('system');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    });
  });

  describe('createInitialThemeState', () => {
    it('creates state with system preference when nothing stored', () => {
      const state = createInitialThemeState();
      expect(state.preference).toBe('system');
    });

    it('creates state with stored preference', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      const state = createInitialThemeState();
      expect(state.preference).toBe('dark');
      expect(state.resolved).toBe('dark');
    });

    it('creates state with light stored preference', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      const state = createInitialThemeState();
      expect(state.preference).toBe('light');
      expect(state.resolved).toBe('light');
    });
  });

  describe('subscribeToSystemTheme', () => {
    it('returns cleanup function', () => {
      const cleanup = subscribeToSystemTheme(() => {});
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('adds event listener for media query change', () => {
      const originalMatchMedia = window.matchMedia;
      const addEventListenerSpy = vi.fn();

      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      subscribeToSystemTheme(() => {});

      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

      window.matchMedia = originalMatchMedia;
    });

    it('removes event listener on cleanup', () => {
      const originalMatchMedia = window.matchMedia;
      const removeEventListenerSpy = vi.fn();

      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      }));

      const cleanup = subscribeToSystemTheme(() => {});
      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('type definitions', () => {
    it('ThemePreference includes all options', () => {
      const preferences: ThemePreference[] = ['light', 'dark', 'system'];
      expect(preferences).toHaveLength(3);
    });

    it('ResolvedTheme includes light and dark', () => {
      const resolved: ResolvedTheme[] = ['light', 'dark'];
      expect(resolved).toHaveLength(2);
    });

    it('ThemeState has required properties', () => {
      const state: ThemeState = {
        preference: 'system',
        resolved: 'dark',
      };

      expect(state.preference).toBe('system');
      expect(state.resolved).toBe('dark');
    });
  });
});
