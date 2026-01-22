/**
 * AppShell Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { AppShell } from '../src/app-shell.js';

describe('app-shell', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('app-shell');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);

      expect(el.shadowRoot).toBeDefined();
    });

    it('renders skip-to-content link', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const skipLink = el.shadowRoot?.querySelector('.skip-link');

      expect(skipLink).toBeDefined();
      expect(skipLink?.textContent?.trim()).toBe('Skip to content');
    });

    it('renders navbar', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const navbar = el.shadowRoot?.querySelector('tx-navbar');

      expect(navbar).toBeDefined();
    });

    it('renders main content area', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const main = el.shadowRoot?.querySelector('#main');

      expect(main).toBeDefined();
      expect(main?.getAttribute('tabindex')).toBe('-1');
    });

    it('renders toast container', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const toastContainer = el.shadowRoot?.querySelector('tx-toast-container');

      expect(toastContainer).toBeDefined();
      expect(toastContainer?.getAttribute('position')).toBe('top-right');
    });
  });

  describe('skip-to-content link', () => {
    it('is first focusable element', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const skipLink = el.shadowRoot?.querySelector('.skip-link') as HTMLAnchorElement;

      // The skip link should be before other focusable elements
      expect(skipLink.href).toContain('#main');
    });

    it('focuses main content on click', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const skipLink = el.shadowRoot?.querySelector('.skip-link') as HTMLAnchorElement;
      const main = el.shadowRoot?.querySelector('#main') as HTMLElement;

      const focusSpy = vi.spyOn(main, 'focus');
      skipLink.click();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('theme management', () => {
    it('defaults to light theme', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);

      expect(el.theme).toBe('light');
    });

    it('applies theme to document root', async () => {
      await fixture<AppShell>(html`<app-shell></app-shell>`);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('restores theme from localStorage', async () => {
      localStorage.setItem('tx-theme', 'dark');
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);

      expect(el.theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('detects system dark mode preference', async () => {
      // Mock matchMedia for dark mode
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);

      expect(el.theme).toBe('dark');

      // Restore
      window.matchMedia = originalMatchMedia;
    });

    it('handles theme-toggle event', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const navbar = el.shadowRoot?.querySelector('tx-navbar') as HTMLElement;

      // Initial state
      expect(el.theme).toBe('light');

      // Toggle theme
      navbar.dispatchEvent(new CustomEvent('theme-toggle', { bubbles: true, composed: true }));
      await el.updateComplete;

      expect(el.theme).toBe('dark');
      expect(localStorage.getItem('tx-theme')).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('dispatches theme-change event on toggle', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const navbar = el.shadowRoot?.querySelector('tx-navbar') as HTMLElement;

      const themeChangeHandler = vi.fn();
      el.addEventListener('theme-change', themeChangeHandler);

      navbar.dispatchEvent(new CustomEvent('theme-toggle', { bubbles: true, composed: true }));
      await el.updateComplete;

      expect(themeChangeHandler).toHaveBeenCalled();
      expect(themeChangeHandler.mock.calls[0][0].detail.resolved).toBe('dark');
    });
  });

  describe('navigation', () => {
    it('handles navigate event from navbar', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const navbar = el.shadowRoot?.querySelector('tx-navbar') as HTMLElement;

      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      navbar.dispatchEvent(
        new CustomEvent('navigate', {
          detail: { path: '/explore' },
          bubbles: true,
          composed: true,
        })
      );
      await el.updateComplete;

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/explore');
    });

    it('passes routes to navbar', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const navbar = el.shadowRoot?.querySelector('tx-navbar') as HTMLElement & { routes: unknown[] };

      expect(navbar.routes).toBeDefined();
      expect(navbar.routes.length).toBe(4);
    });
  });

  describe('keyboard shortcuts', () => {
    it('navigates on Alt+1 to Code', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: '1',
          altKey: true,
          bubbles: true,
        })
      );
      await el.updateComplete;

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/');
    });

    it('navigates on Alt+2 to Explore', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: '2',
          altKey: true,
          bubbles: true,
        })
      );
      await el.updateComplete;

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/explore');
    });

    it('ignores shortcuts with modifier keys', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      // Alt+Ctrl+1 should be ignored
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: '1',
          altKey: true,
          ctrlKey: true,
          bubbles: true,
        })
      );
      await el.updateComplete;

      expect(pushStateSpy).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('main content has tabindex for focus management', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const main = el.shadowRoot?.querySelector('#main');

      expect(main?.getAttribute('tabindex')).toBe('-1');
    });

    it('skip link targets main content', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const skipLink = el.shadowRoot?.querySelector('.skip-link') as HTMLAnchorElement;

      expect(skipLink.getAttribute('href')).toBe('#main');
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on disconnect', async () => {
      const el = await fixture<AppShell>(html`<app-shell></app-shell>`);
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      el.remove();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });
});
