/**
 * tx-alert - Inline Alert Component
 *
 * An inline alert for displaying contextual feedback messages.
 * Supports info, success, warning, and error variants.
 *
 * @fires close - Fired when the alert is dismissed (if dismissible)
 *
 * @slot title - Optional title for the alert
 * @slot - Default slot for alert message content
 *
 * @example
 * ```html
 * <tx-alert variant="success" ?dismissible=${true}>
 *   <span slot="title">Success!</span>
 *   Your expression has been validated.
 * </tx-alert>
 *
 * <tx-alert variant="error">
 *   <span slot="title">Validation Error</span>
 *   The expression contains invalid MRCM constraints.
 * </tx-alert>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

@customElement('tx-alert')
export class TxAlert extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-radius: var(--radius-md, 8px);
      border: 1px solid;
      opacity: 1;
      transition: opacity 200ms var(--easing-default);
    }

    .alert.dismissing {
      opacity: 0;
    }

    /* Info variant */
    .alert.variant-info {
      background-color: color-mix(in srgb, var(--color-info, #0284C7) 10%, transparent);
      border-color: var(--color-info, #0284C7);
    }

    .alert.variant-info .icon {
      color: var(--color-info, #0284C7);
    }

    /* Success variant */
    .alert.variant-success {
      background-color: color-mix(in srgb, var(--color-success, #16A34A) 10%, transparent);
      border-color: var(--color-success, #16A34A);
    }

    .alert.variant-success .icon {
      color: var(--color-success, #16A34A);
    }

    /* Warning variant */
    .alert.variant-warning {
      background-color: color-mix(in srgb, var(--color-warning, #CA8A04) 10%, transparent);
      border-color: var(--color-warning, #CA8A04);
    }

    .alert.variant-warning .icon {
      color: var(--color-warning, #CA8A04);
    }

    /* Error variant */
    .alert.variant-error {
      background-color: color-mix(in srgb, var(--color-error, #DC2626) 10%, transparent);
      border-color: var(--color-error, #DC2626);
    }

    .alert.variant-error .icon {
      color: var(--color-error, #DC2626);
    }

    .icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      margin-top: 2px;
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    .title {
      display: block;
      font-weight: var(--font-weight-semibold, 600);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #111827);
      margin-bottom: var(--space-1, 4px);
    }

    .title:empty {
      display: none;
    }

    .message {
      font-size: var(--text-sm, 14px);
      line-height: var(--line-height-normal, 1.5);
      color: var(--color-text-secondary, #4B5563);
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
      background-color: rgba(0, 0, 0, 0.1);
      color: var(--color-text-primary, #111827);
    }

    .close-button:focus-visible {
      outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, var(--color-primary));
      outline-offset: var(--focus-ring-offset, 2px);
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .alert {
        transition: none;
      }
    }
  `;

  /**
   * Alert variant for styling
   */
  @property({ type: String, reflect: true })
  variant: AlertVariant = 'info';

  /**
   * Whether the alert can be dismissed
   */
  @property({ type: Boolean })
  dismissible = false;

  /**
   * Dismissing animation state
   */
  @state()
  private _dismissing = false;

  /**
   * Dismiss the alert with animation
   */
  dismiss() {
    this._dismissing = true;

    setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('close', {
          bubbles: true,
          composed: true,
        })
      );
      // Hide the element after animation
      this.hidden = true;
    }, 200);
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
    const alertClasses = {
      alert: true,
      [`variant-${this.variant}`]: true,
      dismissing: this._dismissing,
    };

    return html`
      <div class=${classMap(alertClasses)} role="alert">
        <span class="icon" aria-hidden="true">${this._getIcon()}</span>
        <div class="content">
          <span class="title"><slot name="title"></slot></span>
          <div class="message"><slot></slot></div>
        </div>
        ${this.dismissible
          ? html`
              <button
                class="close-button"
                @click=${this.dismiss}
                aria-label="Dismiss alert"
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
    'tx-alert': TxAlert;
  }
}
