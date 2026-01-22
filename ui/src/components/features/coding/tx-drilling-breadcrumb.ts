import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DrillingPathEntry } from '../../../state/contexts/session-context.js';

/**
 * Drilling breadcrumb component - shows current position in SNOMED hierarchy.
 *
 * Displays the drilling path as clickable breadcrumbs:
 * "Headache → Frontal headache → Acute frontal headache"
 *
 * @element tx-drilling-breadcrumb
 * @fires drill-back - Fired when user clicks a breadcrumb to go back
 */
@customElement('tx-drilling-breadcrumb')
export class TxDrillingBreadcrumb extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .breadcrumb-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg, 12px);
    }

    .breadcrumb-label {
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .breadcrumb-path {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-1, 4px);
    }

    .breadcrumb-item {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
    }

    .breadcrumb-link {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--color-primary);
      text-decoration: none;
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      border: none;
      background: transparent;
      transition: background-color var(--duration-fast) var(--easing-default);
    }

    .breadcrumb-link:hover {
      background-color: var(--color-primary-light);
    }

    .breadcrumb-link:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .breadcrumb-current {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary);
      background-color: var(--color-background);
      border-radius: var(--radius-sm, 4px);
    }

    .breadcrumb-separator {
      color: var(--color-text-muted);
      font-size: var(--text-sm, 14px);
    }

    .depth-indicator {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      margin-left: auto;
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted);
      background-color: var(--color-background);
      border-radius: var(--radius-sm, 4px);
    }

    .depth-indicator svg {
      width: 14px;
      height: 14px;
    }

    .empty-state {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted);
      font-style: italic;
    }
  `;

  /**
   * The drilling path entries
   */
  @property({ type: Array })
  path: DrillingPathEntry[] = [];

  /**
   * Current depth in the hierarchy
   */
  @property({ type: Number })
  currentDepth = 0;

  /**
   * Maximum allowed depth
   */
  @property({ type: Number })
  maxDepth = 10;

  /**
   * Handle breadcrumb click - drill back to that level
   */
  private _handleBreadcrumbClick(depth: number): void {
    if (depth < this.currentDepth) {
      this.dispatchEvent(
        new CustomEvent('drill-back', {
          detail: { depth },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Render the depth indicator icon
   */
  private _renderDepthIcon() {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    `;
  }

  /**
   * Render the arrow separator
   */
  private _renderSeparator() {
    return html`<span class="breadcrumb-separator">→</span>`;
  }

  render() {
    if (this.path.length === 0) {
      return html`
        <div class="breadcrumb-container">
          <span class="breadcrumb-label">Drilling Path</span>
          <span class="empty-state">No concept selected</span>
        </div>
      `;
    }

    return html`
      <div class="breadcrumb-container">
        <span class="breadcrumb-label">Path</span>
        <div class="breadcrumb-path">
          ${this.path.map((entry, index) => {
            const isLast = index === this.path.length - 1;
            const isClickable = !isLast && entry.depth < this.currentDepth;

            return html`
              <span class="breadcrumb-item">
                ${isClickable
                  ? html`
                      <button
                        class="breadcrumb-link"
                        @click=${() => this._handleBreadcrumbClick(entry.depth)}
                        title="Go back to ${entry.term}"
                      >
                        ${entry.term}
                      </button>
                    `
                  : html`<span class="breadcrumb-current">${entry.term}</span>`}
                ${!isLast ? this._renderSeparator() : ''}
              </span>
            `;
          })}
        </div>
        <span class="depth-indicator">
          ${this._renderDepthIcon()}
          Depth: ${this.currentDepth}/${this.maxDepth}
        </span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-drilling-breadcrumb': TxDrillingBreadcrumb;
  }
}
