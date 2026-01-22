import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { NavRoute } from '../../app-shell.js';
import type { Theme } from '../../contexts/theme-context.js';

/**
 * User profile menu item
 */
interface ProfileMenuItem {
  id: string;
  label: string;
  icon: string;
  dividerAfter?: boolean;
}

/**
 * Profile menu items configuration
 */
const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  { id: 'account', label: 'Account settings', icon: 'settings' },
  { id: 'history', label: 'Coding history', icon: 'history' },
  { id: 'api-keys', label: 'API keys', icon: 'key', dividerAfter: true },
  { id: 'sign-out', label: 'Sign out', icon: 'log-out' },
];

/**
 * Navigation bar component for the application shell.
 *
 * Features:
 * - Logo/branding
 * - Navigation items with active state
 * - User profile dropdown
 * - Dark mode toggle
 * - Mobile hamburger menu with drawer
 *
 * @element tx-navbar
 * @fires navigate - Fired when navigation item is clicked
 * @fires theme-toggle - Fired when theme toggle is clicked
 * @fires profile-action - Fired when profile menu item is clicked
 */
@customElement('tx-navbar')
export class TxNavbar extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: var(--z-sticky, 200);
    }

    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 var(--space-6, 24px);
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }

    /* Left section: Logo */
    .navbar-left {
      display: flex;
      align-items: center;
      gap: var(--space-8, 32px);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      text-decoration: none;
      color: var(--color-text-primary);
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      color: var(--color-primary);
    }

    .logo-text {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      letter-spacing: -0.025em;
    }

    .logo-text-highlight {
      color: var(--color-primary);
    }

    /* Center section: Navigation */
    .nav-items {
      display: none;
      align-items: center;
      gap: var(--space-1, 4px);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    @media (min-width: 768px) {
      .nav-items {
        display: flex;
      }
    }

    .nav-item {
      position: relative;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-4, 16px);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-md, 8px);
      transition:
        color var(--duration-fast) var(--easing-default),
        background-color var(--duration-fast) var(--easing-default);
      cursor: pointer;
      border: none;
      background: none;
    }

    .nav-link:hover {
      color: var(--color-text-primary);
      background-color: var(--color-background);
    }

    .nav-link:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .nav-link[aria-current='page'] {
      color: var(--color-primary);
    }

    .nav-link[aria-current='page']::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: var(--space-4, 16px);
      right: var(--space-4, 16px);
      height: 2px;
      background-color: var(--color-primary);
      border-radius: 1px 1px 0 0;
    }

    .nav-icon {
      width: 18px;
      height: 18px;
    }

    /* Right section: Actions */
    .navbar-right {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    /* Icon button base */
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: var(--radius-md, 8px);
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition:
        color var(--duration-fast) var(--easing-default),
        background-color var(--duration-fast) var(--easing-default);
    }

    .icon-btn:hover {
      color: var(--color-text-primary);
      background-color: var(--color-background);
    }

    .icon-btn:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .icon-btn svg {
      width: 20px;
      height: 20px;
    }

    /* User dropdown */
    .user-dropdown {
      position: relative;
    }

    .user-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-background);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition:
        border-color var(--duration-fast) var(--easing-default),
        box-shadow var(--duration-fast) var(--easing-default);
    }

    .user-btn:hover {
      border-color: var(--color-primary);
    }

    .user-btn:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .user-btn[aria-expanded='true'] {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }

    .user-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Dropdown menu */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + var(--space-2, 8px));
      right: 0;
      min-width: 200px;
      padding: var(--space-2, 8px);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-lg);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition:
        opacity var(--duration-fast) var(--easing-default),
        transform var(--duration-fast) var(--easing-default),
        visibility var(--duration-fast);
      z-index: var(--z-dropdown, 100);
    }

    .dropdown-menu.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
      width: 100%;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border: none;
      border-radius: var(--radius-md, 8px);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      text-align: left;
      cursor: pointer;
      transition:
        color var(--duration-fast) var(--easing-default),
        background-color var(--duration-fast) var(--easing-default);
    }

    .menu-item:hover {
      color: var(--color-text-primary);
      background-color: var(--color-background);
    }

    .menu-item:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: -2px;
    }

    .menu-item svg {
      width: 16px;
      height: 16px;
    }

    .menu-divider {
      height: 1px;
      margin: var(--space-2, 8px) 0;
      background-color: var(--color-border);
    }

    /* Mobile hamburger */
    .hamburger-btn {
      display: flex;
    }

    @media (min-width: 768px) {
      .hamburger-btn {
        display: none;
      }
    }

    /* Mobile drawer */
    .mobile-drawer-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgb(0 0 0 / 0.5);
      opacity: 0;
      visibility: hidden;
      transition:
        opacity var(--duration-normal) var(--easing-default),
        visibility var(--duration-normal);
      z-index: var(--z-modal, 300);
    }

    .mobile-drawer-backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .mobile-drawer {
      position: fixed;
      top: 0;
      left: 0;
      width: 280px;
      max-width: calc(100vw - 64px);
      height: 100vh;
      padding: var(--space-6, 24px);
      background-color: var(--color-surface);
      box-shadow: var(--shadow-xl);
      transform: translateX(-100%);
      transition: transform var(--duration-normal) var(--easing-default);
      z-index: var(--z-modal, 300);
      overflow-y: auto;
    }

    .mobile-drawer.open {
      transform: translateX(0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6, 24px);
      padding-bottom: var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border);
    }

    .drawer-nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    .drawer-nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-md, 8px);
      border: none;
      background: none;
      cursor: pointer;
      transition:
        color var(--duration-fast) var(--easing-default),
        background-color var(--duration-fast) var(--easing-default);
      width: 100%;
      text-align: left;
    }

    .drawer-nav-link:hover {
      color: var(--color-text-primary);
      background-color: var(--color-background);
    }

    .drawer-nav-link:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .drawer-nav-link[aria-current='page'] {
      color: var(--color-primary);
      background-color: var(--color-primary-light);
    }

    .drawer-nav-link svg {
      width: 20px;
      height: 20px;
    }

    .drawer-shortcut {
      margin-left: auto;
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted);
    }
  `;

  /**
   * Current active route path
   */
  @property({ type: String })
  activeRoute = '/';

  /**
   * Current theme
   */
  @property({ type: String })
  theme: Theme = 'light';

  /**
   * Navigation routes
   */
  @property({ type: Array })
  routes: NavRoute[] = [];

  /**
   * Whether user dropdown is open
   */
  @state()
  private _userDropdownOpen = false;

  /**
   * Whether mobile drawer is open
   */
  @state()
  private _mobileDrawerOpen = false;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
    document.addEventListener('keydown', this._handleEscape);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleEscape);
  }

  /**
   * Handle clicks outside dropdowns to close them
   */
  private _handleOutsideClick = (e: MouseEvent): void => {
    const path = e.composedPath();
    const navbar = this.shadowRoot?.querySelector('.navbar');

    if (navbar && !path.includes(navbar)) {
      this._userDropdownOpen = false;
    }
  };

  /**
   * Handle Escape key to close dropdowns and drawer
   */
  private _handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this._userDropdownOpen = false;
      this._mobileDrawerOpen = false;
    }
  };

  /**
   * Toggle user dropdown
   */
  private _toggleUserDropdown(): void {
    this._userDropdownOpen = !this._userDropdownOpen;
  }

  /**
   * Toggle mobile drawer
   */
  private _toggleMobileDrawer(): void {
    this._mobileDrawerOpen = !this._mobileDrawerOpen;
  }

  /**
   * Close mobile drawer
   */
  private _closeMobileDrawer(): void {
    this._mobileDrawerOpen = false;
  }

  /**
   * Handle navigation click
   */
  private _handleNavClick(path: string): void {
    this._closeMobileDrawer();
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { path },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle theme toggle
   */
  private _handleThemeToggle(): void {
    this.dispatchEvent(
      new CustomEvent('theme-toggle', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle profile menu item click
   */
  private _handleProfileAction(actionId: string): void {
    this._userDropdownOpen = false;
    this.dispatchEvent(
      new CustomEvent('profile-action', {
        detail: { action: actionId },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Check if route is active
   */
  private _isActiveRoute(routePath: string): boolean {
    if (routePath === '/') {
      return this.activeRoute === '/' || this.activeRoute.startsWith('/code');
    }
    return this.activeRoute.startsWith(routePath);
  }

  /**
   * Get icon SVG for a given icon name
   */
  private _getIcon(name: string) {
    const icons: Record<string, unknown> = {
      'message-square': html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>`,
      search: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>`,
      'book-open': html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>`,
      code: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>`,
      sun: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>`,
      moon: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>`,
      user: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>`,
      menu: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </svg>`,
      x: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>`,
      settings: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>`,
      history: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>`,
      key: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="7.5" cy="15.5" r="5.5" />
        <path d="m21 2-9.6 9.6" />
        <path d="m15.5 7.5 3 3L22 7l-3-3" />
      </svg>`,
      'log-out': html`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>`,
    };
    return icons[name] || html``;
  }

  /**
   * Render logo
   */
  private _renderLogo() {
    return html`
      <a
        href="/"
        class="logo"
        @click=${(e: Event) => {
          e.preventDefault();
          this._handleNavClick('/');
        }}
      >
        <svg
          class="logo-icon"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="8" fill="currentColor" />
          <path
            d="M8 16h16M16 8v16"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
        <span class="logo-text">
          <span class="logo-text-highlight">CCX</span>
        </span>
      </a>
    `;
  }

  /**
   * Render desktop navigation items
   */
  private _renderNavItems() {
    return html`
      <nav aria-label="Main navigation">
        <ul class="nav-items" role="menubar">
          ${this.routes.map(
            (route) => html`
              <li class="nav-item" role="none">
                <button
                  class="nav-link"
                  role="menuitem"
                  aria-current=${this._isActiveRoute(route.path) ? 'page' : 'false'}
                  @click=${() => this._handleNavClick(route.path)}
                  title="${route.label} (${route.shortcut})"
                >
                  <span class="nav-icon">${this._getIcon(route.icon)}</span>
                  ${route.label}
                </button>
              </li>
            `
          )}
        </ul>
      </nav>
    `;
  }

  /**
   * Render theme toggle button
   */
  private _renderThemeToggle() {
    const isDark = this.theme === 'dark';
    return html`
      <button
        class="icon-btn"
        @click=${this._handleThemeToggle}
        aria-label=${isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title=${isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        ${isDark ? this._getIcon('sun') : this._getIcon('moon')}
      </button>
    `;
  }

  /**
   * Render user dropdown
   */
  private _renderUserDropdown() {
    return html`
      <div class="user-dropdown">
        <button
          class="user-btn"
          @click=${this._toggleUserDropdown}
          aria-expanded=${this._userDropdownOpen}
          aria-haspopup="menu"
          aria-label="User menu"
        >
          ${this._getIcon('user')}
        </button>
        <div
          class=${classMap({
            'dropdown-menu': true,
            open: this._userDropdownOpen,
          })}
          role="menu"
          aria-label="User menu"
        >
          ${PROFILE_MENU_ITEMS.map(
            (item) => html`
              <button
                class="menu-item"
                role="menuitem"
                @click=${() => this._handleProfileAction(item.id)}
              >
                ${this._getIcon(item.icon)}
                ${item.label}
              </button>
              ${item.dividerAfter ? html`<div class="menu-divider"></div>` : ''}
            `
          )}
        </div>
      </div>
    `;
  }

  /**
   * Render hamburger button (mobile)
   */
  private _renderHamburgerButton() {
    return html`
      <button
        class="icon-btn hamburger-btn"
        @click=${this._toggleMobileDrawer}
        aria-expanded=${this._mobileDrawerOpen}
        aria-controls="mobile-drawer"
        aria-label=${this._mobileDrawerOpen ? 'Close menu' : 'Open menu'}
      >
        ${this._mobileDrawerOpen ? this._getIcon('x') : this._getIcon('menu')}
      </button>
    `;
  }

  /**
   * Render mobile drawer
   */
  private _renderMobileDrawer() {
    return html`
      <div
        class=${classMap({
          'mobile-drawer-backdrop': true,
          open: this._mobileDrawerOpen,
        })}
        @click=${this._closeMobileDrawer}
        aria-hidden="true"
      ></div>
      <aside
        id="mobile-drawer"
        class=${classMap({
          'mobile-drawer': true,
          open: this._mobileDrawerOpen,
        })}
        aria-label="Mobile navigation"
        aria-hidden=${!this._mobileDrawerOpen}
      >
        <div class="drawer-header">
          ${this._renderLogo()}
          <button
            class="icon-btn"
            @click=${this._closeMobileDrawer}
            aria-label="Close menu"
          >
            ${this._getIcon('x')}
          </button>
        </div>
        <nav class="drawer-nav" aria-label="Mobile navigation">
          ${this.routes.map(
            (route) => html`
              <button
                class="drawer-nav-link"
                aria-current=${this._isActiveRoute(route.path) ? 'page' : 'false'}
                @click=${() => this._handleNavClick(route.path)}
              >
                ${this._getIcon(route.icon)}
                ${route.label}
                <span class="drawer-shortcut">${route.shortcut}</span>
              </button>
            `
          )}
        </nav>
      </aside>
    `;
  }

  render() {
    return html`
      <header class="navbar" role="banner">
        <div class="navbar-left">
          ${this._renderHamburgerButton()} ${this._renderLogo()}
        </div>

        ${this._renderNavItems()}

        <div class="navbar-right">
          ${this._renderThemeToggle()} ${this._renderUserDropdown()}
        </div>
      </header>

      ${this._renderMobileDrawer()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-navbar': TxNavbar;
  }
}
