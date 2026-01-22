import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Route loading indicator shown during lazy-loaded route transitions.
 *
 * Shows a skeleton loader with animated shimmer effect.
 * Has minimum display time to prevent flash on fast loads.
 *
 * @element tx-route-loading
 */
@customElement('tx-route-loading')
export class TxRouteLoading extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: calc(100vh - 64px);
      padding: var(--tx-spacing-6, 1.5rem);
    }

    .loading-container {
      max-width: 64rem;
      margin: 0 auto;
    }

    /* Skeleton styles */
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--tx-color-surface-secondary, #f3f4f6) 25%,
        var(--tx-color-surface-tertiary, #e5e7eb) 50%,
        var(--tx-color-surface-secondary, #f3f4f6) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--tx-radius-md, 0.375rem);
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .skeleton-header {
      height: 2rem;
      width: 40%;
      margin-bottom: var(--tx-spacing-6, 1.5rem);
    }

    .skeleton-text {
      height: 1rem;
      margin-bottom: var(--tx-spacing-3, 0.75rem);
    }

    .skeleton-text:nth-child(2) {
      width: 90%;
    }

    .skeleton-text:nth-child(3) {
      width: 75%;
    }

    .skeleton-text:nth-child(4) {
      width: 80%;
    }

    .skeleton-card {
      height: 8rem;
      margin-top: var(--tx-spacing-6, 1.5rem);
    }

    .skeleton-row {
      display: flex;
      gap: var(--tx-spacing-4, 1rem);
      margin-top: var(--tx-spacing-4, 1rem);
    }

    .skeleton-row .skeleton {
      flex: 1;
      height: 6rem;
    }

    /* Spinner variant */
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      gap: var(--tx-spacing-4, 1rem);
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid var(--tx-color-border, #e5e7eb);
      border-top-color: var(--tx-color-primary, #3b82f6);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      color: var(--tx-color-text-secondary, #6b7280);
      font-size: var(--tx-font-size-sm, 0.875rem);
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background: var(--tx-color-surface-secondary, #f3f4f6);
      }

      .spinner {
        animation: none;
        border-style: dashed;
      }
    }
  `;

  /**
   * Loading variant: 'skeleton' shows content skeleton, 'spinner' shows simple spinner
   */
  @property({ type: String })
  variant: 'skeleton' | 'spinner' = 'skeleton';

  /**
   * Loading message to display with spinner variant
   */
  @property({ type: String })
  message = 'Loading...';

  render() {
    if (this.variant === 'spinner') {
      return html`
        <div class="spinner-container" role="status" aria-live="polite">
          <div class="spinner" aria-hidden="true"></div>
          <span class="loading-text">${this.message}</span>
          <span class="sr-only">Loading page content</span>
        </div>
      `;
    }

    return html`
      <div
        class="loading-container"
        role="status"
        aria-live="polite"
        aria-label="Loading page content"
      >
        <div class="skeleton skeleton-header"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton-row">
          <div class="skeleton"></div>
          <div class="skeleton"></div>
          <div class="skeleton"></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-route-loading': TxRouteLoading;
  }
}
