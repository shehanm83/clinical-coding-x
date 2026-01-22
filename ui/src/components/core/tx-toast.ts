/**
 * tx-toast - Toast Notification Component
 *
 * Individual toast notification with variant styling and auto-dismiss.
 * Usually managed by tx-toast-container, but can be used standalone.
 *
 * @fires close - Fired when toast is dismissed (manually or auto)
 *
 * @example
 * ```html
 * <tx-toast variant="success" message="Saved successfully!" duration="3000"></tx-toast>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

@customElement('tx-toast')
export class TxToast extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-radius: var(--radius-md, 8px);
      background-color: var(--color-surface, #ffffff);
      box-shadow: var(--shadow-lg);
      border-left: 4px solid;
      min-width: 280px;
      max-width: 400px;
      opacity: 0;
      transform: translateX(100%);
      transition:
        opacity var(--duration-normal, 250ms) var(--easing-default),
        transform 300ms var(--easing-default);
    }

    .toast.visible {
      opacity: 1;
      transform: translateX(0);
    }

    .toast.dismissing {
      opacity: 0;
      transform: translateX(100%);
      transition:
        opacity 200ms var(--easing-default),
        transform 200ms var(--easing-default);
    }

    /* Position-based slide direction */
    :host([position='top-left']) .toast,
    :host([position='bottom-left']) .toast {
      transform: translateX(-100%);
    }

    :host([position='top-left']) .toast.visible,
    :host([position='bottom-left']) .toast.visible {
      transform: translateX(0);
    }

    :host([position='top-left']) .toast.dismissing,
    :host([position='bottom-left']) .toast.dismissing {
      transform: translateX(-100%);
    }

    /* Variant colors */
    .toast.variant-info {
      border-left-color: var(--color-info, #0284C7);
    }

    .toast.variant-success {
      border-left-color: var(--color-success, #16A34A);
    }

    .toast.variant-warning {
      border-left-color: var(--color-warning, #CA8A04);
    }

    .toast.variant-error {
      border-left-color: var(--color-error, #DC2626);
    }

    .icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .icon.variant-info {
      color: var(--color-info, #0284C7);
    }

    .icon.variant-success {
      color: var(--color-success, #16A34A);
    }

    .icon.variant-warning {
      color: var(--color-warning, #CA8A04);
    }

    .icon.variant-error {
      color: var(--color-error, #DC2626);
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    .message {
      font-size: var(--text-sm, 14px);
      line-height: var(--line-height-normal, 1.5);
      color: var(--color-text-primary, #111827);
      word-wrap: break-word;
    }

    .close-button {
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
      color: var(--color-text-muted, #9CA3AF);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) var(--easing-default);
    }

    .close-button:hover {
      background-color: var(--color-border, #E5E7EB);
      color: var(--color-text-primary, #111827);
    }

    .close-button:focus-visible {
      outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, var(--color-primary));
      outline-offset: var(--focus-ring-offset, 2px);
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .toast {
        transform: none;
        transition: opacity var(--duration-fast, 150ms) var(--easing-default);
      }

      .toast.dismissing {
        transform: none;
      }
    }
  `;

  /**
   * Toast message content
   */
  @property({ type: String })
  message = '';

  /**
   * Toast variant for styling
   */
  @property({ type: String, reflect: true })
  variant: ToastVariant = 'info';

  /**
   * Auto-dismiss duration in milliseconds (0 for persistent)
   */
  @property({ type: Number })
  duration = 3000;

  /**
   * Position hint for animation direction
   */
  @property({ type: String, reflect: true })
  position: ToastPosition = 'top-right';

  /**
   * Show dismiss button
   */
  @property({ type: Boolean })
  dismissible = true;

  /**
   * Internal visibility state
   */
  @state()
  private _visible = false;

  /**
   * Dismissing animation state
   */
  @state()
  private _dismissing = false;

  private _dismissTimer: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    // Trigger entrance animation after mount
    requestAnimationFrame(() => {
      this._visible = true;
    });
    this._startDismissTimer();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._clearDismissTimer();
  }

  private _startDismissTimer() {
    if (this.duration > 0) {
      this._dismissTimer = window.setTimeout(() => {
        this.dismiss();
      }, this.duration);
    }
  }

  private _clearDismissTimer() {
    if (this._dismissTimer !== null) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
  }

  /**
   * Dismiss the toast with exit animation
   */
  dismiss() {
    this._clearDismissTimer();
    this._dismissing = true;

    // Wait for exit animation to complete
    setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('close', {
          bubbles: true,
          composed: true,
        })
      );
    }, 200);
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.dismiss();
    }
  }

  private _getIcon(): string {
    switch (this.variant) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  }

  render() {
    const toastClasses = {
      toast: true,
      [`variant-${this.variant}`]: true,
      visible: this._visible && !this._dismissing,
      dismissing: this._dismissing,
    };

    const iconClasses = {
      icon: true,
      [`variant-${this.variant}`]: true,
    };

    return html`
      <div
        class=${classMap(toastClasses)}
        role="alert"
        aria-live="polite"
        @keydown=${this._handleKeyDown}
      >
        <span class=${classMap(iconClasses)} aria-hidden="true">${this._getIcon()}</span>
        <div class="content">
          <p class="message">${this.message}</p>
        </div>
        ${this.dismissible
          ? html`
              <button
                class="close-button"
                @click=${this.dismiss}
                aria-label="Dismiss notification"
                type="button"
              >
                ✕
              </button>
            `
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-toast': TxToast;
  }
}
