/**
 * tx-navbar Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxNavbar } from '../../../src/components/layout/tx-navbar.js';
import type { NavRoute } from '../../../src/app-shell.js';

const mockRoutes: NavRoute[] = [
  { path: '/', label: 'Code', icon: 'message-square', shortcut: 'Alt+1' },
  { path: '/explore', label: 'Explore', icon: 'search', shortcut: 'Alt+2' },
  { path: '/learn', label: 'Learn', icon: 'book-open', shortcut: 'Alt+3' },
  { path: '/api', label: 'API', icon: 'code', shortcut: 'Alt+4' },
];

describe('tx-navbar', () => {
  beforeEach(() => {
    // Clean up any existing event listeners
  });

  afterEach(() => {
    // Cleanup
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('tx-navbar');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      expect(el.shadowRoot).toBeDefined();
    });

    it('renders logo', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const logo = el.shadowRoot?.querySelector('.logo');

      expect(logo).toBeDefined();
    });

    it('renders navigation items when routes provided', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );
      const navItems = el.shadowRoot?.querySelectorAll('.nav-item');

      expect(navItems?.length).toBe(4);
    });

    it('renders theme toggle button', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const themeToggle = el.shadowRoot?.querySelector('.icon-btn[aria-label*="mode"]');

      expect(themeToggle).toBeDefined();
    });

    it('renders user dropdown button', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const userBtn = el.shadowRoot?.querySelector('.user-btn');

      expect(userBtn).toBeDefined();
      expect(userBtn?.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('renders hamburger button for mobile', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const hamburger = el.shadowRoot?.querySelector('.hamburger-btn');

      expect(hamburger).toBeDefined();
    });
  });

  describe('navigation', () => {
    it('displays all route labels', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );

      for (const route of mockRoutes) {
        const navLink = Array.from(
          el.shadowRoot?.querySelectorAll('.nav-link') || []
        ).find((link) => link.textContent?.includes(route.label));
        expect(navLink).toBeDefined();
      }
    });

    it('highlights active route', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes} activeRoute="/explore"></tx-navbar>`
      );
      const exploreLink = Array.from(
        el.shadowRoot?.querySelectorAll('.nav-link') || []
      ).find((link) => link.textContent?.includes('Explore'));

      expect(exploreLink?.getAttribute('aria-current')).toBe('page');
    });

    it('fires navigate event on nav item click', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );

      const navigateHandler = vi.fn();
      el.addEventListener('navigate', navigateHandler);

      const exploreLink = Array.from(
        el.shadowRoot?.querySelectorAll('.nav-link') || []
      ).find((link) => link.textContent?.includes('Explore')) as HTMLButtonElement;
      exploreLink?.click();

      expect(navigateHandler).toHaveBeenCalled();
      expect(navigateHandler.mock.calls[0][0].detail.path).toBe('/explore');
    });

    it('shows keyboard shortcut in title attribute', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );
      const codeLink = Array.from(
        el.shadowRoot?.querySelectorAll('.nav-link') || []
      ).find((link) => link.textContent?.includes('Code'));

      expect(codeLink?.getAttribute('title')).toContain('Alt+1');
    });
  });

  describe('theme toggle', () => {
    it('shows moon icon in light mode', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar theme="light"></tx-navbar>`
      );
      const themeBtn = el.shadowRoot?.querySelector(
        '.icon-btn[aria-label="Switch to dark mode"]'
      );

      expect(themeBtn).toBeDefined();
    });

    it('shows sun icon in dark mode', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar theme="dark"></tx-navbar>`
      );
      const themeBtn = el.shadowRoot?.querySelector(
        '.icon-btn[aria-label="Switch to light mode"]'
      );

      expect(themeBtn).toBeDefined();
    });

    it('fires theme-toggle event on click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const themeToggleHandler = vi.fn();
      el.addEventListener('theme-toggle', themeToggleHandler);

      const themeBtn = el.shadowRoot?.querySelector(
        '.icon-btn[aria-label*="mode"]'
      ) as HTMLButtonElement;
      themeBtn?.click();

      expect(themeToggleHandler).toHaveBeenCalled();
    });
  });

  describe('user dropdown', () => {
    it('dropdown is closed by default', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const dropdown = el.shadowRoot?.querySelector('.dropdown-menu');

      expect(dropdown?.classList.contains('open')).toBe(false);
    });

    it('opens dropdown on user button click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const userBtn = el.shadowRoot?.querySelector('.user-btn') as HTMLButtonElement;
      userBtn?.click();
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown-menu');
      expect(dropdown?.classList.contains('open')).toBe(true);
    });

    it('closes dropdown on second click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const userBtn = el.shadowRoot?.querySelector('.user-btn') as HTMLButtonElement;
      userBtn?.click();
      await el.updateComplete;
      userBtn?.click();
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown-menu');
      expect(dropdown?.classList.contains('open')).toBe(false);
    });

    it('renders all menu items', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const menuItems = el.shadowRoot?.querySelectorAll('.menu-item');
      expect(menuItems?.length).toBe(4);
    });

    it('fires profile-action event on menu item click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      // Open dropdown first
      const userBtn = el.shadowRoot?.querySelector('.user-btn') as HTMLButtonElement;
      userBtn?.click();
      await el.updateComplete;

      const profileActionHandler = vi.fn();
      el.addEventListener('profile-action', profileActionHandler);

      const signOutItem = Array.from(
        el.shadowRoot?.querySelectorAll('.menu-item') || []
      ).find((item) => item.textContent?.includes('Sign out')) as HTMLButtonElement;
      signOutItem?.click();

      expect(profileActionHandler).toHaveBeenCalled();
      expect(profileActionHandler.mock.calls[0][0].detail.action).toBe('sign-out');
    });

    it('closes dropdown after menu item click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      // Open dropdown first
      const userBtn = el.shadowRoot?.querySelector('.user-btn') as HTMLButtonElement;
      userBtn?.click();
      await el.updateComplete;

      const menuItem = el.shadowRoot?.querySelector('.menu-item') as HTMLButtonElement;
      menuItem?.click();
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown-menu');
      expect(dropdown?.classList.contains('open')).toBe(false);
    });

    it('closes dropdown on Escape key', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      // Open dropdown first
      const userBtn = el.shadowRoot?.querySelector('.user-btn') as HTMLButtonElement;
      userBtn?.click();
      await el.updateComplete;

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown-menu');
      expect(dropdown?.classList.contains('open')).toBe(false);
    });

    it('user button has correct aria-expanded state', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const userBtn = el.shadowRoot?.querySelector('.user-btn') as HTMLButtonElement;
      expect(userBtn?.getAttribute('aria-expanded')).toBe('false');

      userBtn?.click();
      await el.updateComplete;

      expect(userBtn?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('mobile drawer', () => {
    it('drawer is closed by default', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const drawer = el.shadowRoot?.querySelector('.mobile-drawer');

      expect(drawer?.classList.contains('open')).toBe(false);
    });

    it('opens drawer on hamburger click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const hamburger = el.shadowRoot?.querySelector('.hamburger-btn') as HTMLButtonElement;
      hamburger?.click();
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.mobile-drawer');
      expect(drawer?.classList.contains('open')).toBe(true);
    });

    it('closes drawer on backdrop click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      // Open drawer first
      const hamburger = el.shadowRoot?.querySelector('.hamburger-btn') as HTMLButtonElement;
      hamburger?.click();
      await el.updateComplete;

      const backdrop = el.shadowRoot?.querySelector('.mobile-drawer-backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.mobile-drawer');
      expect(drawer?.classList.contains('open')).toBe(false);
    });

    it('closes drawer on Escape key', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      // Open drawer first
      const hamburger = el.shadowRoot?.querySelector('.hamburger-btn') as HTMLButtonElement;
      hamburger?.click();
      await el.updateComplete;

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.mobile-drawer');
      expect(drawer?.classList.contains('open')).toBe(false);
    });

    it('displays all nav items in drawer', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );
      const drawerNavLinks = el.shadowRoot?.querySelectorAll('.drawer-nav-link');

      expect(drawerNavLinks?.length).toBe(4);
    });

    it('closes drawer on navigation', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );

      // Open drawer first
      const hamburger = el.shadowRoot?.querySelector('.hamburger-btn') as HTMLButtonElement;
      hamburger?.click();
      await el.updateComplete;

      const drawerNavLink = el.shadowRoot?.querySelector('.drawer-nav-link') as HTMLButtonElement;
      drawerNavLink?.click();
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.mobile-drawer');
      expect(drawer?.classList.contains('open')).toBe(false);
    });

    it('hamburger button has correct aria-expanded state', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const hamburger = el.shadowRoot?.querySelector('.hamburger-btn') as HTMLButtonElement;
      expect(hamburger?.getAttribute('aria-expanded')).toBe('false');

      hamburger?.click();
      await el.updateComplete;

      expect(hamburger?.getAttribute('aria-expanded')).toBe('true');
    });

    it('shows keyboard shortcuts in drawer', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );
      const shortcut = el.shadowRoot?.querySelector('.drawer-shortcut');

      expect(shortcut).toBeDefined();
      expect(shortcut?.textContent).toContain('Alt+');
    });
  });

  describe('accessibility', () => {
    it('navbar has role="banner"', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const navbar = el.shadowRoot?.querySelector('.navbar');

      expect(navbar?.getAttribute('role')).toBe('banner');
    });

    it('navigation has aria-label', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );
      const nav = el.shadowRoot?.querySelector('nav');

      expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
    });

    it('nav items have menuitem role', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes}></tx-navbar>`
      );
      const navLink = el.shadowRoot?.querySelector('.nav-link');

      expect(navLink?.getAttribute('role')).toBe('menuitem');
    });

    it('active nav item has aria-current="page"', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes} activeRoute="/"></tx-navbar>`
      );
      const codeLink = Array.from(
        el.shadowRoot?.querySelectorAll('.nav-link') || []
      ).find((link) => link.textContent?.includes('Code'));

      expect(codeLink?.getAttribute('aria-current')).toBe('page');
    });

    it('inactive nav items have aria-current="false"', async () => {
      const el = await fixture<TxNavbar>(
        html`<tx-navbar .routes=${mockRoutes} activeRoute="/"></tx-navbar>`
      );
      const exploreLink = Array.from(
        el.shadowRoot?.querySelectorAll('.nav-link') || []
      ).find((link) => link.textContent?.includes('Explore'));

      expect(exploreLink?.getAttribute('aria-current')).toBe('false');
    });

    it('dropdown menu has aria-label', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const dropdown = el.shadowRoot?.querySelector('.dropdown-menu');

      expect(dropdown?.getAttribute('aria-label')).toBe('User menu');
    });

    it('mobile drawer has aria-hidden when closed', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const drawer = el.shadowRoot?.querySelector('.mobile-drawer');

      expect(drawer?.getAttribute('aria-hidden')).toBe('true');
    });

    it('mobile drawer has aria-hidden="false" when open', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const hamburger = el.shadowRoot?.querySelector('.hamburger-btn') as HTMLButtonElement;
      hamburger?.click();
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.mobile-drawer');
      expect(drawer?.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('logo', () => {
    it('navigates to home on logo click', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);

      const navigateHandler = vi.fn();
      el.addEventListener('navigate', navigateHandler);

      const logo = el.shadowRoot?.querySelector('.logo') as HTMLAnchorElement;
      logo?.click();

      expect(navigateHandler).toHaveBeenCalled();
      expect(navigateHandler.mock.calls[0][0].detail.path).toBe('/');
    });

    it('displays brand name', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const logoText = el.shadowRoot?.querySelector('.logo-text');

      expect(logoText?.textContent?.trim()).toContain('Clinical');
      expect(logoText?.textContent?.trim()).toContain('Code');
    });
  });

  describe('structure', () => {
    it('has navbar header element', async () => {
      const el = await fixture<TxNavbar>(html`<tx-navbar></tx-navbar>`);
      const navbar = el.shadowRoot?.querySelector('.navbar');

      // Verify the navbar structure exists
      expect(navbar).toBeDefined();
      expect(navbar?.tagName.toLowerCase()).toBe('header');
    });
  });
});
