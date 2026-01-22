/**
 * tx-session-history - Session History Sidebar Component
 *
 * Displays list of previous coding sessions with search, filter, and pagination.
 * Allows loading, deleting, and managing session history.
 *
 * @fires load-session - Fired when a session is selected to load
 * @fires delete-session - Fired when a session deletion is confirmed
 * @fires load-more - Fired when more sessions should be loaded
 *
 * @example
 * ```html
 * <tx-session-history
 *   .sessions=${this.recentSessions}
 *   .activeSessionId=${this.currentSessionId}
 *   .loading=${false}
 *   .hasMore=${true}
 *   @load-session=${this.handleLoadSession}
 *   @delete-session=${this.handleDeleteSession}
 *   @load-more=${this.handleLoadMore}
 * ></tx-session-history>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

// Import core components
import '../../core/tx-button.js';
import '../../core/tx-input.js';
import '../../core/tx-modal.js';

/**
 * Session status type
 */
export type SessionStatus = 'draft' | 'completed' | 'error';

/**
 * Session summary interface
 */
export interface SessionSummary {
  id: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  preview: {
    inputText?: string;
    firstTerm?: string;
    expressionSnippet?: string;
    termCount: number;
  };
}

/**
 * Status filter type
 */
type StatusFilter = 'all' | SessionStatus;

@customElement('tx-session-history')
export class TxSessionHistory extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== SIDEBAR CONTAINER ===== */

    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }

    /* ===== HEADER ===== */

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .sidebar-title {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
      margin: 0;
    }

    .collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: var(--radius-sm, 4px);
      background: transparent;
      color: var(--color-text-muted, #9ca3af);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .collapse-btn:hover {
      background: var(--color-border, #e5e7eb);
      color: var(--color-text-primary, #111827);
    }

    /* ===== SEARCH ===== */

    .search-container {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .search-input {
      width: 100%;
    }

    /* ===== FILTERS ===== */

    .filter-container {
      display: flex;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .filter-btn {
      flex: 1;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
      background: transparent;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .filter-btn:hover {
      background: var(--color-background, #f9fafb);
    }

    .filter-btn.active {
      background: var(--color-primary-light, #dbeafe);
      border-color: var(--color-primary, #2563eb);
      color: var(--color-primary, #2563eb);
    }

    /* ===== SESSION LIST ===== */

    .session-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-3, 12px);
    }

    .date-group {
      margin-bottom: var(--space-4, 16px);
    }

    .date-label {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-muted, #9ca3af);
      margin: 0 0 var(--space-2, 8px);
      padding: 0 var(--space-2, 8px);
    }

    /* ===== SESSION CARD ===== */

    .session-card {
      position: relative;
      padding: var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border: 2px solid transparent;
      border-radius: var(--radius-md, 8px);
      margin-bottom: var(--space-2, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .session-card:hover {
      background: var(--color-background-hover, #f3f4f6);
      border-color: var(--color-border, #e5e7eb);
    }

    .session-card.active {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #dbeafe);
    }

    .session-card.loading {
      opacity: 0.7;
      pointer-events: none;
    }

    .session-header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-2, 8px);
    }

    .session-status-icon {
      flex-shrink: 0;
      font-size: var(--text-base, 16px);
    }

    .session-title {
      flex: 1;
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .delete-btn {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: var(--radius-sm, 4px);
      background: transparent;
      color: var(--color-text-muted, #9ca3af);
      cursor: pointer;
      opacity: 0;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .session-card:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      background: var(--color-error-light, #fef2f2);
      color: var(--color-error, #dc2626);
    }

    .session-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #9ca3af);
    }

    .session-meta-divider {
      width: 3px;
      height: 3px;
      background: currentColor;
      border-radius: 50%;
    }

    /* ===== STATUS BADGES ===== */

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: 2px 8px;
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-full, 9999px);
    }

    .status-badge.draft {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
    }

    .status-badge.completed {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success, #16a34a);
    }

    .status-badge.error {
      background: var(--color-error-light, #fef2f2);
      color: var(--color-error, #dc2626);
    }

    /* ===== EXPRESSION SNIPPET ===== */

    .expression-snippet {
      margin-top: var(--space-2, 8px);
      padding: var(--space-2, 8px);
      background: var(--color-code-bg, #1e293b);
      border-radius: var(--radius-sm, 4px);
      font-family: var(--font-mono, monospace);
      font-size: var(--text-xs, 12px);
      color: var(--color-code-text, #e2e8f0);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ===== LOAD MORE ===== */

    .load-more-container {
      padding: var(--space-3, 12px);
      text-align: center;
    }

    /* ===== EMPTY STATE ===== */

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-8, 32px) var(--space-4, 16px);
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--space-3, 12px);
    }

    .empty-title {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
      margin: 0 0 var(--space-2, 8px);
    }

    .empty-description {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
      margin: 0;
    }

    /* ===== LOADING SPINNER ===== */

    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4, 16px);
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--color-border, #e5e7eb);
      border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ===== MODAL ===== */

    .modal-body {
      font-size: var(--text-base, 16px);
      color: var(--color-text-secondary, #4b5563);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
    }

    /* ===== COLLAPSED STATE ===== */

    :host([collapsed]) .sidebar {
      width: 48px;
    }

    :host([collapsed]) .sidebar-title,
    :host([collapsed]) .search-container,
    :host([collapsed]) .filter-container,
    :host([collapsed]) .session-list {
      display: none;
    }
  `;

  /**
   * List of sessions
   */
  @property({ type: Array })
  sessions: SessionSummary[] = [];

  /**
   * Currently active session ID
   */
  @property({ type: String })
  activeSessionId: string | null = null;

  /**
   * Loading state
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * Whether more sessions are available
   */
  @property({ type: Boolean })
  hasMore = false;

  /**
   * Collapsed state
   */
  @property({ type: Boolean, reflect: true })
  collapsed = false;

  /**
   * Search query
   */
  @state()
  private _searchQuery = '';

  /**
   * Status filter
   */
  @state()
  private _statusFilter: StatusFilter = 'all';

  /**
   * Session to delete (for confirmation modal)
   */
  @state()
  private _sessionToDelete: string | null = null;

  /**
   * Loading session ID
   */
  @state()
  private _loadingSessionId: string | null = null;

  /**
   * Debounce timer for search
   */
  private _searchDebounce: ReturnType<typeof setTimeout> | null = null;

  /**
   * Format date in human-readable format
   */
  private _formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  /**
   * Format time
   */
  private _formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Get grouped sessions by date
   */
  private _getGroupedSessions(): Map<string, SessionSummary[]> {
    const filtered = this._getFilteredSessions();
    const groups = new Map<string, SessionSummary[]>();

    filtered.forEach((session) => {
      const dateKey = this._formatDate(session.updatedAt);
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, session]);
    });

    return groups;
  }

  /**
   * Get filtered sessions
   */
  private _getFilteredSessions(): SessionSummary[] {
    let filtered = [...this.sessions];

    // Status filter
    if (this._statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === this._statusFilter);
    }

    // Search filter
    if (this._searchQuery.trim()) {
      const query = this._searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.preview.inputText?.toLowerCase().includes(query) ||
          s.preview.firstTerm?.toLowerCase().includes(query) ||
          s.preview.expressionSnippet?.toLowerCase().includes(query)
      );
    }

    // Sort by most recent first
    return filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Handle search input
   */
  private _handleSearch(e: CustomEvent) {
    const value = e.detail.value;

    // Debounce search
    if (this._searchDebounce) {
      clearTimeout(this._searchDebounce);
    }

    this._searchDebounce = setTimeout(() => {
      this._searchQuery = value;
    }, 300);
  }

  /**
   * Handle status filter change
   */
  private _handleFilterChange(filter: StatusFilter) {
    this._statusFilter = filter;
  }

  /**
   * Handle session click - load session
   */
  private _handleSessionClick(session: SessionSummary) {
    if (session.id === this.activeSessionId) return;

    this._loadingSessionId = session.id;

    this.dispatchEvent(
      new CustomEvent('load-session', {
        bubbles: true,
        composed: true,
        detail: { sessionId: session.id },
      })
    );

    // Reset loading after delay (parent should update activeSessionId)
    setTimeout(() => {
      this._loadingSessionId = null;
    }, 1000);
  }

  /**
   * Handle delete button click
   */
  private _handleDeleteClick(e: Event, sessionId: string) {
    e.stopPropagation();

    // Prevent deleting active session
    if (sessionId === this.activeSessionId) {
      return;
    }

    this._sessionToDelete = sessionId;
  }

  /**
   * Confirm session deletion
   */
  private _confirmDelete() {
    if (!this._sessionToDelete) return;

    this.dispatchEvent(
      new CustomEvent('delete-session', {
        bubbles: true,
        composed: true,
        detail: { sessionId: this._sessionToDelete },
      })
    );

    this._sessionToDelete = null;
  }

  /**
   * Cancel session deletion
   */
  private _cancelDelete() {
    this._sessionToDelete = null;
  }

  /**
   * Handle load more
   */
  private _handleLoadMore() {
    this.dispatchEvent(
      new CustomEvent('load-more', {
        bubbles: true,
        composed: true,
        detail: { offset: this.sessions.length },
      })
    );
  }

  /**
   * Toggle collapsed state
   */
  private _toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  /**
   * Get status icon
   */
  private _getStatusIcon(status: SessionStatus): string {
    switch (status) {
      case 'completed':
        return '✓';
      case 'draft':
        return '●';
      case 'error':
        return '✕';
      default:
        return '●';
    }
  }

  /**
   * Render session card
   */
  private _renderSessionCard(session: SessionSummary) {
    const isActive = session.id === this.activeSessionId;
    const isLoading = session.id === this._loadingSessionId;

    const cardClasses = {
      'session-card': true,
      active: isActive,
      loading: isLoading,
    };

    return html`
      <div
        class=${classMap(cardClasses)}
        @click=${() => this._handleSessionClick(session)}
        role="button"
        tabindex="0"
        aria-selected=${isActive}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleSessionClick(session);
          }
        }}
      >
        <div class="session-header">
          <span class="session-status-icon">
            ${this._getStatusIcon(session.status)}
          </span>
          <span class="session-title">
            ${session.preview.firstTerm ||
            session.preview.inputText ||
            'Untitled Session'}
          </span>
          ${session.id !== this.activeSessionId
            ? html`
                <button
                  class="delete-btn"
                  @click=${(e: Event) => this._handleDeleteClick(e, session.id)}
                  aria-label="Delete session"
                  title="Delete session"
                >
                  🗑
                </button>
              `
            : nothing}
        </div>

        <div class="session-meta">
          <span class="status-badge ${session.status}">
            ${session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
          ${session.preview.termCount > 0
            ? html`
                <span class="session-meta-divider"></span>
                <span>${session.preview.termCount} terms</span>
              `
            : nothing}
          <span class="session-meta-divider"></span>
          <span>${this._formatTime(session.updatedAt)}</span>
        </div>

        ${session.status === 'completed' && session.preview.expressionSnippet
          ? html`
              <div class="expression-snippet">
                ${session.preview.expressionSnippet}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  /**
   * Render empty state
   */
  private _renderEmptyState() {
    const hasFilters = this._searchQuery || this._statusFilter !== 'all';

    return html`
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <h4 class="empty-title">
          ${hasFilters ? 'No matching sessions' : 'No sessions yet'}
        </h4>
        <p class="empty-description">
          ${hasFilters
            ? 'Try adjusting your search or filters'
            : 'Your coding sessions will appear here'}
        </p>
      </div>
    `;
  }

  /**
   * Render delete confirmation modal
   */
  private _renderDeleteConfirmation() {
    return html`
      <tx-modal
        .open=${!!this._sessionToDelete}
        size="sm"
        @close=${this._cancelDelete}
      >
        <span slot="header">Delete Session?</span>

        <div class="modal-body">
          <p>This session will be permanently deleted. This action cannot be undone.</p>
        </div>

        <div slot="footer" class="modal-footer">
          <tx-button variant="secondary" @click=${this._cancelDelete}>
            Cancel
          </tx-button>
          <tx-button variant="destructive" @click=${this._confirmDelete}>
            Delete
          </tx-button>
        </div>
      </tx-modal>
    `;
  }

  render() {
    const groupedSessions = this._getGroupedSessions();
    const filteredSessions = this._getFilteredSessions();

    return html`
      <div class="sidebar">
        <!-- Header -->
        <div class="sidebar-header">
          <h3 class="sidebar-title">Session History</h3>
          <button
            class="collapse-btn"
            @click=${this._toggleCollapse}
            aria-label=${this.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            ${this.collapsed ? '→' : '✕'}
          </button>
        </div>

        <!-- Search -->
        <div class="search-container">
          <tx-input
            class="search-input"
            type="search"
            placeholder="Search sessions..."
            @input=${this._handleSearch}
          >
            <span slot="prefix">🔍</span>
          </tx-input>
        </div>

        <!-- Filters -->
        <div class="filter-container">
          <button
            class="filter-btn ${this._statusFilter === 'all' ? 'active' : ''}"
            @click=${() => this._handleFilterChange('all')}
          >
            All
          </button>
          <button
            class="filter-btn ${this._statusFilter === 'draft' ? 'active' : ''}"
            @click=${() => this._handleFilterChange('draft')}
          >
            Drafts
          </button>
          <button
            class="filter-btn ${this._statusFilter === 'completed' ? 'active' : ''}"
            @click=${() => this._handleFilterChange('completed')}
          >
            Completed
          </button>
        </div>

        <!-- Session List -->
        <div class="session-list">
          ${filteredSessions.length === 0
            ? this._renderEmptyState()
            : html`
                ${repeat(
                  Array.from(groupedSessions.entries()),
                  ([dateKey]) => dateKey,
                  ([dateKey, sessions]) => html`
                    <div class="date-group">
                      <p class="date-label">${dateKey}</p>
                      ${repeat(
                        sessions,
                        (session) => session.id,
                        (session) => this._renderSessionCard(session)
                      )}
                    </div>
                  `
                )}

                <!-- Load More -->
                ${this.hasMore
                  ? html`
                      <div class="load-more-container">
                        ${this.loading
                          ? html`
                              <div class="loading-spinner">
                                <div class="spinner"></div>
                              </div>
                            `
                          : html`
                              <tx-button
                                variant="secondary"
                                @click=${this._handleLoadMore}
                              >
                                Load More Sessions
                              </tx-button>
                            `}
                      </div>
                    `
                  : nothing}
              `}
        </div>
      </div>

      ${this._renderDeleteConfirmation()}
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-session-history': TxSessionHistory;
  }
}
