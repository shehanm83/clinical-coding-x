import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * FAB action configuration
 */
export interface FabAction {
  id: string;
  icon: string;
  label: string;
  disabled?: boolean;
}

/**
 * Floating Action Button (FAB) component.
 *
 * Provides a primary action button fixed at the bottom-right of the screen,
 * with optional expandable secondary actions menu.
 *
 * @element tx-fab
 * @fires click - Fired when primary FAB is clicked
 * @fires action - Fired when a secondary action is clicked (detail: { actionId })
 *
 * @example
 * ```html
 * <tx-fab
 *   icon="✓"
 *   label="Confirm"
 *   ?disabled=${!canConfirm}
 *   @click=${handleConfirm}
 * ></tx-fab>
 * ```
 *
 * @example With secondary actions
 * ```html
 * <tx-fab
 *   icon="✓"
 *   label="Confirm & Save"
 *   .secondaryActions=${[
 *     { id: 'save-draft', icon: '💾', label: 'Save Draft' },
 *     { id: 'copy', icon: '📋', label: 'Copy Expression' }
 *   ]}
 *   @click=${handleConfirm}
 *   @action=${(e) => handleAction(e.detail.actionId)}
 * ></tx-fab>
 * ```
 */
@customElement('tx-fab')
export class TxFab extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 80px; /* Above mobile nav/tab bar */
      right: var(--space-4, 16px);
      z-index: var(--z-sticky, 200);
    }

    .fab-container {
      position: relative;
    }

    /* Secondary actions menu */
    .secondary-actions {
      position: absolute;
      bottom: 100%;
      right: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
      padding-bottom: var(--space-3, 12px);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all var(--duration-normal, 250ms) var(--easing-default);
    }

    .secondary-actions.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .secondary-action {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-full, 9999px);
      box-shadow: var(--shadow-md);
      cursor: pointer;
      white-space: nowrap;
      font-family: inherit;
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #111827);
      transition: all var(--duration-fast, 150ms);
    }

    .secondary-action:hover {
      background: var(--color-background, #f9fafb);
      transform: translateX(-4px);
    }

    .secondary-action:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: 2px;
    }

    .secondary-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .secondary-action-icon {
      font-size: var(--text-lg, 18px);
      line-height: 1;
    }

    /* Main FAB button */
    .fab {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      padding: 0;
      background: var(--color-primary, #2563eb);
      color: white;
      border: none;
      border-radius: 50%;
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      font-family: inherit;
      font-size: var(--text-xl, 20px);
      transition: all var(--duration-fast, 150ms) var(--easing-default);
    }

    .fab:hover:not(:disabled) {
      background: var(--color-primary-hover, #1d4ed8);
      transform: scale(1.05);
      box-shadow: var(--shadow-xl);
    }

    .fab:active:not(:disabled) {
      transform: scale(0.95);
    }

    .fab:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: 4px;
    }

    .fab:disabled {
      background: var(--color-text-muted, #9ca3af);
      cursor: not-allowed;
      box-shadow: none;
    }

    .fab.expanded {
      transform: rotate(45deg);
      background: var(--color-text-secondary, #6b7280);
    }

    .fab.hidden {
      transform: translateY(100px);
      opacity: 0;
      pointer-events: none;
    }

    /* Extended FAB (with label) */
    .fab.extended {
      width: auto;
      padding: 0 var(--space-5, 20px);
      border-radius: var(--radius-full, 9999px);
      gap: var(--space-2, 8px);
    }

    .fab-label {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
    }

    /* Loading state */
    .fab.loading {
      pointer-events: none;
    }

    .fab.loading .fab-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Touch ripple effect */
    .fab {
      position: relative;
      overflow: hidden;
    }

    .fab::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      opacity: 0;
      transform: scale(0);
      transition: transform 0.3s, opacity 0.3s;
    }

    .fab:active::after {
      opacity: 1;
      transform: scale(2);
      transition: transform 0s, opacity 0s;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .fab,
      .secondary-actions,
      .secondary-action {
        transition: none;
      }

      .fab::after {
        display: none;
      }

      .fab.loading .fab-icon {
        animation: none;
      }
    }
  `;

  /**
   * Icon to display in the FAB
   */
  @property({ type: String })
  icon = '✓';

  /**
   * Label for extended FAB (optional)
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the FAB is disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the FAB is in loading state
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * Whether to hide the FAB (e.g., when keyboard is open)
   */
  @property({ type: Boolean })
  hidden = false;

  /**
   * Secondary actions to show in expandable menu
   */
  @property({ type: Array })
  secondaryActions: FabAction[] = [];

  /**
   * Accessible label for the FAB
   */
  @property({ type: String })
  ariaLabel = '';

  @state()
  private _expanded = false;

  private _handleClick(e: Event): void {
    if (this.disabled || this.loading) return;

    if (this.secondaryActions.length > 0) {
      // Toggle menu
      this._expanded = !this._expanded;
      e.stopPropagation();
    } else {
      // Dispatch click event (handled by parent)
      this.dispatchEvent(new CustomEvent('click', { bubbles: true, composed: true }));
    }
  }

  private _handleActionClick(actionId: string): void {
    this._expanded = false;
    this.dispatchEvent(
      new CustomEvent('action', {
        detail: { actionId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleOutsideClick = (e: Event): void => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._expanded = false;
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
  }

  private _renderSecondaryActions() {
    if (this.secondaryActions.length === 0) return nothing;

    return html`
      <div class=${classMap({ 'secondary-actions': true, open: this._expanded })}>
        ${this.secondaryActions.map(
          (action) => html`
            <button
              class="secondary-action"
              ?disabled=${action.disabled}
              @click=${() => this._handleActionClick(action.id)}
              aria-label=${action.label}
            >
              <span class="secondary-action-icon" aria-hidden="true">${action.icon}</span>
              <span>${action.label}</span>
            </button>
          `
        )}
      </div>
    `;
  }

  render() {
    const fabClasses = {
      fab: true,
      extended: !!this.label,
      expanded: this._expanded,
      hidden: this.hidden,
      loading: this.loading,
    };

    const computedAriaLabel =
      this.ariaLabel ||
      this.label ||
      (this.secondaryActions.length > 0 ? 'Open actions menu' : 'Primary action');

    return html`
      <div class="fab-container">
        ${this._renderSecondaryActions()}

        <button
          class=${classMap(fabClasses)}
          ?disabled=${this.disabled}
          @click=${this._handleClick}
          aria-label=${computedAriaLabel}
          aria-expanded=${this.secondaryActions.length > 0 ? this._expanded : nothing}
          aria-haspopup=${this.secondaryActions.length > 0 ? 'true' : nothing}
        >
          <span class="fab-icon" aria-hidden="true">
            ${this.loading ? '⟳' : this._expanded ? '+' : this.icon}
          </span>
          ${this.label ? html`<span class="fab-label">${this.label}</span>` : nothing}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-fab': TxFab;
  }
}
