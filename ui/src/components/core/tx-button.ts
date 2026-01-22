/**
 * tx-button - Core Button Component
 *
 * A fully-featured button component with all variants, states, and accessibility support.
 *
 * @fires click - Fired when button is clicked (if not disabled/loading)
 *
 * @example
 * ```html
 * <tx-button variant="primary" size="md">Submit</tx-button>
 * <tx-button variant="ghost" iconOnly><svg>...</svg></tx-button>
 * <tx-button variant="primary" loading>Processing...</tx-button>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@customElement('tx-button')
export class TxButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2, 8px);
      border: none;
      border-radius: var(--radius-sm, 4px);
      font-family: inherit;
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
      position: relative;
      white-space: nowrap;
      user-select: none;
      outline: none;
      text-decoration: none;
      line-height: 1;
    }

    /* ===== SIZE VARIANTS ===== */

    button.size-sm {
      padding: 6px 12px;
      font-size: var(--text-sm, 14px);
      min-height: 32px;
    }

    button.size-md {
      padding: 10px 20px;
      font-size: var(--text-base, 16px);
      min-height: 40px;
    }

    button.size-lg {
      padding: 12px 24px;
      font-size: var(--text-lg, 18px);
      min-height: 48px;
    }

    /* ===== ICON-ONLY MODE ===== */

    button.icon-only {
      padding: 0;
      aspect-ratio: 1;
    }

    button.icon-only.size-sm {
      width: 32px;
      height: 32px;
    }

    button.icon-only.size-md {
      width: 40px;
      height: 40px;
    }

    button.icon-only.size-lg {
      width: 48px;
      height: 48px;
    }

    /* Icon sizing within icon-only buttons */
    button.icon-only ::slotted(svg),
    button.icon-only ::slotted(img) {
      width: auto;
      height: auto;
    }

    button.icon-only.size-sm ::slotted(svg),
    button.icon-only.size-sm ::slotted(img) {
      width: 16px;
      height: 16px;
    }

    button.icon-only.size-md ::slotted(svg),
    button.icon-only.size-md ::slotted(img) {
      width: 20px;
      height: 20px;
    }

    button.icon-only.size-lg ::slotted(svg),
    button.icon-only.size-lg ::slotted(img) {
      width: 24px;
      height: 24px;
    }

    /* ===== PRIMARY VARIANT ===== */

    button.variant-primary {
      background-color: var(--color-primary, #2563EB);
      color: white;
    }

    button.variant-primary:hover:not(:disabled) {
      background-color: var(--color-primary-hover, #1D4ED8);
    }

    button.variant-primary:active:not(:disabled) {
      transform: scale(0.98);
    }

    /* ===== SECONDARY VARIANT ===== */

    button.variant-secondary {
      background-color: transparent;
      color: var(--color-primary, #2563EB);
      border: 2px solid var(--color-primary, #2563EB);
    }

    button.variant-secondary:hover:not(:disabled) {
      background-color: var(--color-primary-light, #DBEAFE);
    }

    button.variant-secondary:active:not(:disabled) {
      transform: scale(0.98);
    }

    /* ===== GHOST VARIANT ===== */

    button.variant-ghost {
      background-color: transparent;
      color: var(--color-text-primary, #111827);
    }

    button.variant-ghost:hover:not(:disabled) {
      background-color: var(--color-border, #E5E7EB);
    }

    button.variant-ghost:active:not(:disabled) {
      transform: scale(0.98);
    }

    /* ===== DESTRUCTIVE VARIANT ===== */

    button.variant-destructive {
      background-color: var(--color-error, #DC2626);
      color: white;
    }

    button.variant-destructive:hover:not(:disabled) {
      background-color: #B91C1C;
    }

    button.variant-destructive:active:not(:disabled) {
      transform: scale(0.98);
    }

    /* ===== DISABLED STATE ===== */

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ===== FOCUS STYLING ===== */

    button:focus-visible {
      outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, var(--color-primary, #2563EB));
      outline-offset: var(--focus-ring-offset, 2px);
    }

    /* ===== LOADING STATE ===== */

    button.loading {
      pointer-events: none;
    }

    button.loading .button-content {
      visibility: hidden;
    }

    .spinner {
      position: absolute;
      width: 1em;
      height: 1em;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .button-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: inherit;
    }
  `;

  /**
   * Visual style variant
   */
  @property({ type: String })
  variant: ButtonVariant = 'primary';

  /**
   * Button size
   */
  @property({ type: String })
  size: ButtonSize = 'md';

  /**
   * Disabled state
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Loading state with spinner
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * Icon-only mode (square aspect ratio)
   */
  @property({ type: Boolean })
  iconOnly = false;

  /**
   * Button type attribute
   */
  @property({ type: String })
  type: ButtonType = 'button';

  /**
   * Handle click events - prevent if disabled or loading
   */
  private _handleClick(e: MouseEvent) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Dispatch a custom click event that bubbles through shadow DOM
    this.dispatchEvent(
      new CustomEvent('click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }

  /**
   * Handle keyboard events for accessibility
   */
  private _handleKeyDown(e: KeyboardEvent) {
    if (this.disabled || this.loading) {
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._handleClick(e as unknown as MouseEvent);
    }
  }

  render() {
    const classes = {
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      'icon-only': this.iconOnly,
      loading: this.loading,
    };

    const isDisabled = this.disabled || this.loading;

    return html`
      <button
        type=${this.type}
        class=${classMap(classes)}
        ?disabled=${isDisabled}
        aria-disabled=${isDisabled}
        aria-busy=${this.loading}
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
      >
        ${this.loading ? html`<span class="spinner" aria-hidden="true"></span>` : null}
        <span class="button-content">
          <slot></slot>
        </span>
      </button>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-button': TxButton;
  }
}
