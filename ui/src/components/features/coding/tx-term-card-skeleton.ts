/**
 * tx-term-card-skeleton - Skeleton Loading Component
 *
 * A placeholder skeleton for term cards shown during loading states.
 * Uses shimmer animation to indicate loading.
 *
 * @example
 * ```html
 * <tx-term-card-skeleton></tx-term-card-skeleton>
 *
 * <!-- Multiple skeletons -->
 * <tx-term-card-skeleton count="3"></tx-term-card-skeleton>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('tx-term-card-skeleton')
export class TxTermCardSkeleton extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== SKELETON CONTAINER ===== */

    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 12px);
    }

    .skeleton-card {
      padding: var(--space-4, 16px);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
    }

    /* ===== SKELETON ELEMENTS ===== */

    .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-gray-100, #f3f4f6) 0%,
        var(--color-gray-50, #f9fafb) 50%,
        var(--color-gray-100, #f3f4f6) 100%
      );
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm, 4px);
    }

    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    /* ===== SKELETON SHAPES ===== */

    .skeleton-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3, 12px);
    }

    .skeleton-title {
      height: 20px;
      width: 60%;
    }

    .skeleton-badge {
      height: 24px;
      width: 80px;
      border-radius: var(--radius-full, 9999px);
    }

    .skeleton-divider {
      height: 1px;
      width: 100%;
      margin: var(--space-3, 12px) 0;
      background: var(--color-border, #e5e7eb);
    }

    .skeleton-modifiers {
      display: flex;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-3, 12px);
    }

    .skeleton-tag {
      height: 20px;
      width: 60px;
      border-radius: var(--radius-full, 9999px);
    }

    .skeleton-confidence {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-4, 16px);
    }

    .skeleton-confidence-text {
      height: 16px;
      width: 100px;
    }

    .skeleton-confidence-bar {
      flex: 1;
      height: 8px;
      border-radius: var(--radius-full, 9999px);
    }

    .skeleton-concepts {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    .skeleton-concept {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .skeleton-radio {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-concept-text {
      height: 16px;
      flex: 1;
    }

    .skeleton-concept-score {
      width: 40px;
      height: 16px;
    }

    /* ===== REDUCED MOTION ===== */

    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background: var(--color-gray-100, #f3f4f6);
      }
    }

    /* ===== ACCESSIBILITY ===== */

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  /**
   * Number of skeleton cards to display
   */
  @property({ type: Number })
  count = 1;

  /**
   * Number of concept rows per card
   */
  @property({ type: Number })
  conceptCount = 3;

  /**
   * Render a single skeleton card
   */
  private _renderSkeletonCard(_index: number) {
    return html`
      <div class="skeleton-card" aria-hidden="true">
        <!-- Header: Title + Type Badge -->
        <div class="skeleton-header">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-badge"></div>
        </div>

        <!-- Modifiers -->
        <div class="skeleton-modifiers">
          <div class="skeleton skeleton-tag"></div>
          <div class="skeleton skeleton-tag"></div>
        </div>

        <!-- Confidence -->
        <div class="skeleton-confidence">
          <div class="skeleton skeleton-confidence-text"></div>
          <div class="skeleton skeleton-confidence-bar"></div>
        </div>

        <div class="skeleton-divider"></div>

        <!-- Concept Options -->
        <div class="skeleton-concepts">
          ${Array.from({ length: this.conceptCount }, (_, i) =>
            this._renderSkeletonConcept(i)
          )}
        </div>
      </div>
    `;
  }

  /**
   * Render a skeleton concept row
   */
  private _renderSkeletonConcept(index: number) {
    // Vary the width for more natural look
    const widths = ['80%', '70%', '90%', '75%', '85%'];
    const width = widths[index % widths.length];

    return html`
      <div class="skeleton-concept">
        <div class="skeleton skeleton-radio"></div>
        <div class="skeleton skeleton-concept-text" style="width: ${width}"></div>
        <div class="skeleton skeleton-concept-score"></div>
      </div>
    `;
  }

  render() {
    const cards = Array.from({ length: this.count }, (_, i) =>
      this._renderSkeletonCard(i)
    );

    return html`
      <div class="skeleton-list" aria-busy="true" aria-label="Loading term cards">
        ${cards}
        <span class="visually-hidden">Loading extracted terms...</span>
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-term-card-skeleton': TxTermCardSkeleton;
  }
}
