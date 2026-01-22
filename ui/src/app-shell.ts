import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';
import {
  // Theme context
  themeContext,
  type ThemeContextValue,
  type ThemePreference,
  type ResolvedTheme,
  type ThemeState,
  createInitialThemeState,
  resolveTheme,
  applyTheme,
  saveThemePreference,
  subscribeToSystemTheme,
  // Session context
  sessionContext,
  type SessionContextValue,
  type Session,
  type SessionError,
  type QuestionResponse,
  defaultSessionContext,
  // User context
  userContext,
  type UserContextValue,
  type UserState,
  type UserPreferences,
  type RecentSession,
  type BookmarkedConcept,
  defaultUserState,
  defaultPreferences,
  USER_STORAGE_KEYS,
  MAX_RECENT_SESSIONS,
} from './state/contexts/index.js';
import {
  createRoutes,
  NAV_ROUTES,
  initScrollRestoration,
  saveScrollPosition,
  restoreScrollPosition,
  isRouteLoading,
} from './router.js';
import './components/layout/tx-navbar.js';
import './components/layout/tx-route-loading.js';
import './components/core/tx-toast-container.js';

// Re-export for backward compatibility
export { NAV_ROUTES };
export type { NavRoute } from './router.js';

// Re-export Theme type for backward compatibility
export type Theme = ThemePreference;

/**
 * Root application shell for LLM-Enhanced Clinical Coding.
 *
 * Provides:
 * - Skip-to-content accessibility link
 * - Navigation bar with routing
 * - Theme context (light/dark mode)
 * - Main content area with router outlet
 * - Toast notification container
 * - Lazy loading with loading indicator
 * - Scroll restoration on back/forward navigation
 * - Document title updates per route
 *
 * @element app-shell
 * @fires theme-change - Fired when theme changes
 */
@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--color-background);
      font-family: var(--font-sans);
    }

    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* Skip link - visually hidden until focused */
    .skip-link {
      position: absolute;
      top: -100px;
      left: 0;
      z-index: var(--z-tooltip, 500);
      padding: var(--space-3) var(--space-4);
      background-color: var(--color-primary);
      color: white;
      text-decoration: none;
      font-weight: var(--font-weight-medium);
      border-radius: 0 0 var(--radius-md) 0;
      transition: top var(--duration-fast) var(--easing-default);
    }

    .skip-link:focus {
      top: 0;
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .app-main {
      flex: 1;
      outline: none;
    }

    /* Router outlet container */
    .router-outlet {
      min-height: calc(100vh - 64px);
      position: relative;
    }

    /* Loading overlay */
    .loading-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      opacity: 0;
      visibility: hidden;
      transition: opacity 150ms ease, visibility 150ms ease;
    }

    .loading-overlay.visible {
      opacity: 1;
      visibility: visible;
    }
  `;

  /**
   * Theme context provider - provides theme to all descendants
   */
  @provide({ context: themeContext })
  @state()
  private _themeContext: ThemeContextValue = {
    state: createInitialThemeState(),
    setTheme: this._setTheme.bind(this),
    toggleTheme: this._toggleTheme.bind(this),
  };

  /**
   * Session context provider - provides session state to all descendants
   */
  @provide({ context: sessionContext })
  @state()
  private _sessionContext: SessionContextValue = {
    ...defaultSessionContext,
    createSession: this._createSession.bind(this),
    confirmConcepts: this._confirmConcepts.bind(this),
    submitResponses: this._submitResponses.bind(this),
    skipQuestions: this._skipQuestions.bind(this),
    clearSession: this._clearSession.bind(this),
    refreshSession: this._refreshSession.bind(this),
  };

  /**
   * User context provider - provides user state to all descendants
   */
  @provide({ context: userContext })
  @state()
  private _userContext: UserContextValue = {
    state: this._loadUserState(),
    updatePreferences: this._updatePreferences.bind(this),
    resetPreferences: this._resetPreferences.bind(this),
    addRecentSession: this._addRecentSession.bind(this),
    removeRecentSession: this._removeRecentSession.bind(this),
    clearRecentSessions: this._clearRecentSessions.bind(this),
    addBookmark: this._addBookmark.bind(this),
    removeBookmark: this._removeBookmark.bind(this),
    isBookmarked: this._isBookmarked.bind(this),
  };

  /**
   * Current active route path
   */
  @state()
  private _currentRoute = '/';

  /**
   * Cleanup function for system theme subscription
   */
  private _systemThemeUnsubscribe?: () => void;

  /**
   * Cleanup function for localStorage cross-tab sync
   */
  private _storageHandler?: (e: StorageEvent) => void;

  /**
   * Public getter for current resolved theme (backward compatibility)
   */
  get theme(): ResolvedTheme {
    return this._themeContext.state.resolved;
  }

  /**
   * Whether a route is currently loading
   */
  @state()
  private _isLoading = false;

  /**
   * Router instance for page navigation
   */
  private _router = new Router(this, createRoutes());

  /**
   * Loading check interval
   */
  private _loadingCheckInterval?: ReturnType<typeof setInterval>;

  connectedCallback(): void {
    super.connectedCallback();
    this._initTheme();
    this._setupKeyboardShortcuts();
    this._updateCurrentRoute();
    this._setupStorageSync();
    initScrollRestoration();

    // Listen for popstate to update current route
    window.addEventListener('popstate', this._handlePopstate);

    // Start loading state check
    this._startLoadingCheck();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._handlePopstate);
    window.removeEventListener('keydown', this._handleKeydown);
    this._stopLoadingCheck();
    this._systemThemeUnsubscribe?.();
    if (this._storageHandler) {
      window.removeEventListener('storage', this._storageHandler);
    }
  }

  /**
   * Start periodic check for loading state
   */
  private _startLoadingCheck(): void {
    this._loadingCheckInterval = setInterval(() => {
      const loading = isRouteLoading();
      if (loading !== this._isLoading) {
        this._isLoading = loading;
      }
    }, 50);
  }

  /**
   * Stop loading state check
   */
  private _stopLoadingCheck(): void {
    if (this._loadingCheckInterval) {
      clearInterval(this._loadingCheckInterval);
    }
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private _initTheme(): void {
    // Apply initial theme
    applyTheme(this._themeContext.state.resolved);

    // Subscribe to system theme changes if preference is 'system'
    if (this._themeContext.state.preference === 'system') {
      this._systemThemeUnsubscribe = subscribeToSystemTheme((systemTheme) => {
        if (this._themeContext.state.preference === 'system') {
          this._updateThemeState({
            ...this._themeContext.state,
            resolved: systemTheme,
          });
          applyTheme(systemTheme);
        }
      });
    }
  }

  /**
   * Set theme preference
   */
  private _setTheme(preference: ThemePreference): void {
    const resolved = resolveTheme(preference);

    // Clean up previous system theme subscription
    this._systemThemeUnsubscribe?.();
    this._systemThemeUnsubscribe = undefined;

    // Subscribe to system changes if preference is 'system'
    if (preference === 'system') {
      this._systemThemeUnsubscribe = subscribeToSystemTheme((systemTheme) => {
        this._updateThemeState({
          ...this._themeContext.state,
          resolved: systemTheme,
        });
        applyTheme(systemTheme);
      });
    }

    this._updateThemeState({ preference, resolved });
    saveThemePreference(preference);
    applyTheme(resolved);

    this.dispatchEvent(
      new CustomEvent('theme-change', {
        detail: { preference, resolved },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Toggle between light and dark (sets explicit preference, not system)
   */
  private _toggleTheme(): void {
    const newTheme = this._themeContext.state.resolved === 'light' ? 'dark' : 'light';
    this._setTheme(newTheme);
  }

  /**
   * Update theme context state (triggers re-render)
   */
  private _updateThemeState(state: ThemeState): void {
    this._themeContext = {
      ...this._themeContext,
      state,
    };
  }

  /**
   * Handle theme toggle from navbar (backward compatibility)
   */
  private _handleThemeToggle(): void {
    this._toggleTheme();
  }

  /**
   * Handle navigation from navbar
   */
  private _handleNavigate(e: CustomEvent<{ path: string }>): void {
    const { path } = e.detail;
    if (path !== this._currentRoute) {
      // Save scroll position of current page
      saveScrollPosition(this._currentRoute);

      window.history.pushState({}, '', path);
      this._router.goto(path);
      this._currentRoute = path;

      // Scroll to top for new navigation
      window.scrollTo(0, 0);
    }
  }

  /**
   * Handle browser back/forward navigation
   */
  private _handlePopstate = (): void => {
    this._updateCurrentRoute();
    // Restore scroll position on back/forward
    requestAnimationFrame(() => {
      restoreScrollPosition(this._currentRoute);
    });
  };

  /**
   * Update current route from window location
   */
  private _updateCurrentRoute(): void {
    this._currentRoute = window.location.pathname || '/';
  }

  /**
   * Setup keyboard shortcuts for navigation
   */
  private _setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', this._handleKeydown);
  }

  /**
   * Handle keyboard shortcuts
   */
  private _handleKeydown = (e: KeyboardEvent): void => {
    // Alt+1 through Alt+4 for navigation
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= NAV_ROUTES.length) {
        const route = NAV_ROUTES[num - 1];
        if (route) {
          e.preventDefault();
          this._handleNavigate(
            new CustomEvent('navigate', { detail: { path: route.path } })
          );
        }
      }
    }
  };

  /**
   * Focus main content (for skip link)
   */
  private _focusMain(): void {
    const main = this.shadowRoot?.querySelector<HTMLElement>('#main');
    main?.focus();
  }

  // ============================================
  // User Context Methods
  // ============================================

  /**
   * Load user state from localStorage
   */
  private _loadUserState(): UserState {
    const state = { ...defaultUserState };

    try {
      // Load preferences
      const prefsJson = localStorage.getItem(USER_STORAGE_KEYS.preferences);
      if (prefsJson) {
        state.preferences = { ...defaultPreferences, ...JSON.parse(prefsJson) };
      }

      // Load recent sessions
      const sessionsJson = localStorage.getItem(USER_STORAGE_KEYS.recentSessions);
      if (sessionsJson) {
        state.recentSessions = JSON.parse(sessionsJson);
      }

      // Load bookmarks
      const bookmarksJson = localStorage.getItem(USER_STORAGE_KEYS.bookmarks);
      if (bookmarksJson) {
        state.bookmarkedConcepts = JSON.parse(bookmarksJson);
      }
    } catch (e) {
      console.warn('Failed to load user state from localStorage:', e);
    }

    return state;
  }

  /**
   * Save user preferences to localStorage
   */
  private _saveUserPreferences(): void {
    try {
      localStorage.setItem(
        USER_STORAGE_KEYS.preferences,
        JSON.stringify(this._userContext.state.preferences)
      );
    } catch (e) {
      console.warn('Failed to save user preferences:', e);
    }
  }

  /**
   * Save recent sessions to localStorage
   */
  private _saveRecentSessions(): void {
    try {
      localStorage.setItem(
        USER_STORAGE_KEYS.recentSessions,
        JSON.stringify(this._userContext.state.recentSessions)
      );
    } catch (e) {
      console.warn('Failed to save recent sessions:', e);
    }
  }

  /**
   * Save bookmarks to localStorage
   */
  private _saveBookmarks(): void {
    try {
      localStorage.setItem(
        USER_STORAGE_KEYS.bookmarks,
        JSON.stringify(this._userContext.state.bookmarkedConcepts)
      );
    } catch (e) {
      console.warn('Failed to save bookmarks:', e);
    }
  }

  /**
   * Update user context state (triggers re-render)
   */
  private _updateUserState(state: UserState): void {
    this._userContext = {
      ...this._userContext,
      state,
    };
  }

  /**
   * Update user preferences
   */
  private _updatePreferences(preferences: Partial<UserPreferences>): void {
    this._updateUserState({
      ...this._userContext.state,
      preferences: { ...this._userContext.state.preferences, ...preferences },
    });
    this._saveUserPreferences();
  }

  /**
   * Reset preferences to defaults
   */
  private _resetPreferences(): void {
    this._updateUserState({
      ...this._userContext.state,
      preferences: { ...defaultPreferences },
    });
    this._saveUserPreferences();
  }

  /**
   * Add a session to recent list
   */
  private _addRecentSession(session: RecentSession): void {
    const sessions = this._userContext.state.recentSessions.filter(
      (s) => s.id !== session.id
    );
    sessions.unshift(session);
    if (sessions.length > MAX_RECENT_SESSIONS) {
      sessions.pop();
    }
    this._updateUserState({
      ...this._userContext.state,
      recentSessions: sessions,
    });
    this._saveRecentSessions();
  }

  /**
   * Remove a session from recent list
   */
  private _removeRecentSession(sessionId: string): void {
    this._updateUserState({
      ...this._userContext.state,
      recentSessions: this._userContext.state.recentSessions.filter(
        (s) => s.id !== sessionId
      ),
    });
    this._saveRecentSessions();
  }

  /**
   * Clear all recent sessions
   */
  private _clearRecentSessions(): void {
    this._updateUserState({
      ...this._userContext.state,
      recentSessions: [],
    });
    this._saveRecentSessions();
  }

  /**
   * Add a concept to bookmarks
   */
  private _addBookmark(concept: BookmarkedConcept): void {
    if (this._isBookmarked(concept.id)) {
      return;
    }
    this._updateUserState({
      ...this._userContext.state,
      bookmarkedConcepts: [...this._userContext.state.bookmarkedConcepts, concept],
    });
    this._saveBookmarks();
  }

  /**
   * Remove a concept from bookmarks
   */
  private _removeBookmark(conceptId: string): void {
    this._updateUserState({
      ...this._userContext.state,
      bookmarkedConcepts: this._userContext.state.bookmarkedConcepts.filter(
        (c) => c.id !== conceptId
      ),
    });
    this._saveBookmarks();
  }

  /**
   * Check if concept is bookmarked
   */
  private _isBookmarked(conceptId: string): boolean {
    return this._userContext.state.bookmarkedConcepts.some((c) => c.id === conceptId);
  }

  // ============================================
  // Session Context Methods
  // ============================================

  /**
   * Update session context state (triggers re-render)
   */
  private _updateSessionContext(updates: Partial<SessionContextValue>): void {
    this._sessionContext = {
      ...this._sessionContext,
      ...updates,
    };
  }

  /**
   * Create a new coding session
   * TODO: Implement actual API call in Task 7
   */
  private async _createSession(
    text: string,
    context?: { specialty?: string; setting?: string }
  ): Promise<void> {
    this._updateSessionContext({ loading: true, error: null });

    try {
      // TODO: Call API endpoint POST /api/v1/sessions
      // For now, create a mock session
      const mockSession: Session = {
        id: crypto.randomUUID(),
        state: 'extracting',
        originalText: text,
        context,
        extractedTerms: [],
        termMatches: [],
        pendingQuestions: [],
        responses: [],
        confirmedAttributes: [],
        metrics: { totalTimeMs: 0, llmTokensUsed: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this._updateSessionContext({ session: mockSession, loading: false });

      // Add to recent sessions
      this._addRecentSession({
        id: mockSession.id,
        originalText: text,
        state: mockSession.state,
        createdAt: mockSession.createdAt,
      });
    } catch (e) {
      const error: SessionError = {
        code: 'CREATE_FAILED',
        message: e instanceof Error ? e.message : 'Failed to create session',
      };
      this._updateSessionContext({ loading: false, error });
      throw e;
    }
  }

  /**
   * Confirm concept selections
   * TODO: Implement actual API call in Task 7
   */
  private async _confirmConcepts(
    selections: { termIndex: number; conceptId: string }[]
  ): Promise<void> {
    if (!this._sessionContext.session) {
      throw new Error('No active session');
    }

    this._updateSessionContext({ loading: true, error: null });

    try {
      // TODO: Call API endpoint POST /api/v1/sessions/{id}/confirm
      this._updateSessionContext({ loading: false });
    } catch (e) {
      const error: SessionError = {
        code: 'CONFIRM_FAILED',
        message: e instanceof Error ? e.message : 'Failed to confirm concepts',
      };
      this._updateSessionContext({ loading: false, error });
      throw e;
    }
  }

  /**
   * Submit question responses
   * TODO: Implement actual API call in Task 7
   */
  private async _submitResponses(responses: QuestionResponse[]): Promise<void> {
    if (!this._sessionContext.session) {
      throw new Error('No active session');
    }

    this._updateSessionContext({ loading: true, error: null });

    try {
      // TODO: Call API endpoint POST /api/v1/sessions/{id}/responses
      this._updateSessionContext({ loading: false });
    } catch (e) {
      const error: SessionError = {
        code: 'SUBMIT_FAILED',
        message: e instanceof Error ? e.message : 'Failed to submit responses',
      };
      this._updateSessionContext({ loading: false, error });
      throw e;
    }
  }

  /**
   * Skip remaining questions
   * TODO: Implement actual API call in Task 7
   */
  private async _skipQuestions(questionIds?: string[]): Promise<void> {
    if (!this._sessionContext.session) {
      throw new Error('No active session');
    }

    this._updateSessionContext({ loading: true, error: null });

    try {
      // TODO: Call API endpoint POST /api/v1/sessions/{id}/skip
      this._updateSessionContext({ loading: false });
    } catch (e) {
      const error: SessionError = {
        code: 'SKIP_FAILED',
        message: e instanceof Error ? e.message : 'Failed to skip questions',
      };
      this._updateSessionContext({ loading: false, error });
      throw e;
    }
  }

  /**
   * Clear current session
   */
  private _clearSession(): void {
    this._updateSessionContext({ session: null, error: null });
  }

  /**
   * Refresh session from backend
   * TODO: Implement actual API call in Task 7
   */
  private async _refreshSession(): Promise<void> {
    if (!this._sessionContext.session) {
      return;
    }

    this._updateSessionContext({ loading: true, error: null });

    try {
      // TODO: Call API endpoint GET /api/v1/sessions/{id}
      this._updateSessionContext({ loading: false });
    } catch (e) {
      const error: SessionError = {
        code: 'REFRESH_FAILED',
        message: e instanceof Error ? e.message : 'Failed to refresh session',
      };
      this._updateSessionContext({ loading: false, error });
      throw e;
    }
  }

  // ============================================
  // localStorage Cross-Tab Sync
  // ============================================

  /**
   * Set up localStorage cross-tab synchronization
   */
  private _setupStorageSync(): void {
    this._storageHandler = (e: StorageEvent) => {
      if (!e.key) return;

      try {
        // Theme sync
        if (e.key === 'tx-theme' && e.newValue) {
          const preference = e.newValue as ThemePreference;
          if (preference === 'light' || preference === 'dark' || preference === 'system') {
            const resolved = resolveTheme(preference);
            this._updateThemeState({ preference, resolved });
            applyTheme(resolved);
          }
        }

        // User preferences sync
        if (e.key === USER_STORAGE_KEYS.preferences && e.newValue) {
          const preferences = JSON.parse(e.newValue) as UserPreferences;
          this._updateUserState({
            ...this._userContext.state,
            preferences: { ...defaultPreferences, ...preferences },
          });
        }

        // Recent sessions sync
        if (e.key === USER_STORAGE_KEYS.recentSessions && e.newValue) {
          const sessions = JSON.parse(e.newValue) as RecentSession[];
          this._updateUserState({
            ...this._userContext.state,
            recentSessions: sessions,
          });
        }

        // Bookmarks sync
        if (e.key === USER_STORAGE_KEYS.bookmarks && e.newValue) {
          const bookmarks = JSON.parse(e.newValue) as BookmarkedConcept[];
          this._updateUserState({
            ...this._userContext.state,
            bookmarkedConcepts: bookmarks,
          });
        }
      } catch (err) {
        console.warn('Failed to sync localStorage change:', err);
      }
    };

    window.addEventListener('storage', this._storageHandler);
  }

  render() {
    return html`
      <a
        href="#main"
        class="skip-link"
        @click=${(e: Event) => {
          e.preventDefault();
          this._focusMain();
        }}
      >
        Skip to content
      </a>

      <div class="app-container">
        <tx-navbar
          .activeRoute=${this._currentRoute}
          .theme=${this._themeContext.state.resolved}
          .routes=${NAV_ROUTES}
          @navigate=${this._handleNavigate}
          @theme-toggle=${this._handleThemeToggle}
        ></tx-navbar>

        <main id="main" class="app-main" tabindex="-1">
          <div class="router-outlet">
            ${this._router.outlet()}
            <div class="loading-overlay ${this._isLoading ? 'visible' : ''}">
              <tx-route-loading variant="skeleton"></tx-route-loading>
            </div>
          </div>
        </main>
      </div>

      <tx-toast-container position="top-right"></tx-toast-container>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
