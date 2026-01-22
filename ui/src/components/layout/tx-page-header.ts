import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Page header component for consistent page titles and actions.
 *
 * Provides slots for:
 * - Title (default slot or title property)
 * - Breadcrumbs (named slot)
 * - Actions (named slot)
 *
 * @element tx-page-header
 * @slot - Default slot for title content
 * @slot breadcrumbs - Slot for breadcrumb navigation
 * @slot actions - Slot for action buttons
 * @fires back - Fired when back button is clicked
 */
@customElement('tx-page-header')
export class TxPageHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: var(--space-6, 24px);
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 12px);
      max-width: 1280px;
      margin: 0 auto;
    }

    /* Breadcrumbs row */
    .breadcrumbs-row {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      min-height: 20px;
    }

    .breadcrumbs-row:empty {
      display: none;
    }

    /* Title row */
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4, 16px);
      flex-wrap: wrap;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
    }

    /* Back button */
    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md, 8px);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition:
        color var(--duration-fast) var(--easing-default),
        border-color var(--duration-fast) var(--easing-default),
        background-color var(--duration-fast) var(--easing-default);
    }

    .back-btn:hover {
      color: var(--color-text-primary);
      border-color: var(--color-text-muted);
      background-color: var(--color-background);
    }

    .back-btn:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .back-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Title */
    .title {
      margin: 0;
      font-size: var(--text-2xl, 24px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight, 1.2);
    }

    /* Subtitle */
    .subtitle {
      margin: var(--space-1, 4px) 0 0;
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary);
    }

    /* Actions */
    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
      :host {
        padding: var(--space-4, 16px);
      }

      .title {
        font-size: var(--text-xl, 20px);
      }

      .title-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .actions {
        width: 100%;
        justify-content: flex-start;
      }
    }
  `;

  /**
   * Page title text (alternative to default slot)
   */
  @property({ type: String })
  pageTitle = '';

  /**
   * Optional subtitle text
   */
  @property({ type: String })
  subtitle = '';

  /**
   * Whether to show back button
   */
  @property({ type: Boolean, attribute: 'show-back' })
  showBack = false;

  /**
   * Handle back button click
   */
  private _handleBack(): void {
    this.dispatchEvent(
      new CustomEvent('back', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Render back button
   */
  private _renderBackButton() {
    if (!this.showBack) return null;

    return html`
      <button
        class="back-btn"
        @click=${this._handleBack}
        aria-label="Go back"
        title="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      </button>
    `;
  }

  render() {
    return html`
      <div class="page-header">
        <div class="breadcrumbs-row">
          <slot name="breadcrumbs"></slot>
        </div>

        <div class="title-row">
          <div class="title-section">
            ${this._renderBackButton()}
            <div>
              <h1 class="title">
                ${this.pageTitle ? this.pageTitle : html`<slot></slot>`}
              </h1>
              ${this.subtitle
                ? html`<p class="subtitle">${this.subtitle}</p>`
                : ''}
            </div>
          </div>

          <div class="actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-page-header': TxPageHeader;
  }
}
