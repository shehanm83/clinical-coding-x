import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CcxFocusConcept } from '../../../state/contexts/session-context.js';

/**
 * Focus panel component - shows the current focus concept prominently.
 *
 * Displays:
 * - Current concept term and ID
 * - Semantic tag with color coding
 * - Drilling depth indicator
 * - Parent concept if depth > 0
 *
 * @element tx-focus-panel
 * @fires view-in-explorer - Fired when user clicks "View in Explorer"
 * @fires bookmark - Fired when user clicks bookmark
 */
@customElement('tx-focus-panel')
export class TxFocusPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .focus-panel {
      padding: var(--space-4, 16px);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg, 12px);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3, 12px);
    }

    .panel-title {
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .panel-actions {
      display: flex;
      gap: var(--space-1, 4px);
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      border-radius: var(--radius-sm, 4px);
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all var(--duration-fast) var(--easing-default);
    }

    .action-btn:hover {
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .action-btn:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .concept-main {
      margin-bottom: var(--space-3, 12px);
    }

    .concept-term {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary);
      line-height: 1.4;
      margin-bottom: var(--space-2, 8px);
    }

    .concept-id {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      font-size: var(--text-xs, 12px);
      font-family: var(--font-mono, monospace);
      color: var(--color-text-muted);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      background-color: var(--color-background);
      border-radius: var(--radius-sm, 4px);
    }

    .concept-id svg {
      width: 12px;
      height: 12px;
    }

    .semantic-tag {
      display: inline-flex;
      align-items: center;
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
      text-transform: capitalize;
    }

    /* Semantic tag colors */
    .semantic-tag.finding {
      background-color: rgba(37, 99, 235, 0.1);
      color: #2563eb;
    }

    .semantic-tag.disorder {
      background-color: rgba(220, 38, 38, 0.1);
      color: #dc2626;
    }

    .semantic-tag.procedure {
      background-color: rgba(22, 163, 74, 0.1);
      color: #16a34a;
    }

    .semantic-tag.body-structure {
      background-color: rgba(234, 88, 12, 0.1);
      color: #ea580c;
    }

    .semantic-tag.substance {
      background-color: rgba(202, 138, 4, 0.1);
      color: #ca8a04;
    }

    .semantic-tag.qualifier {
      background-color: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .concept-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .divider {
      height: 1px;
      background-color: var(--color-border);
      margin: var(--space-3, 12px) 0;
    }

    .drilling-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    .drilling-row {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
    }

    .drilling-label {
      color: var(--color-text-muted);
      min-width: 80px;
    }

    .drilling-value {
      color: var(--color-text-primary);
    }

    .parent-link {
      color: var(--color-primary);
      text-decoration: none;
      cursor: pointer;
    }

    .parent-link:hover {
      text-decoration: underline;
    }

    .depth-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      border-radius: var(--radius-sm, 4px);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-6, 24px);
      color: var(--color-text-muted);
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: var(--space-3, 12px);
      opacity: 0.5;
    }

    .empty-text {
      font-size: var(--text-sm, 14px);
    }
  `;

  /**
   * Current focus concept
   */
  @property({ type: Object })
  focusConcept: CcxFocusConcept | null = null;

  /**
   * Parent concept term (if drilling from a parent)
   */
  @property({ type: String })
  parentTerm: string | null = null;

  /**
   * Handle view in explorer click
   */
  private _handleViewInExplorer(): void {
    if (this.focusConcept) {
      this.dispatchEvent(
        new CustomEvent('view-in-explorer', {
          detail: { conceptId: this.focusConcept.conceptId },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Handle bookmark click
   */
  private _handleBookmark(): void {
    if (this.focusConcept) {
      this.dispatchEvent(
        new CustomEvent('bookmark', {
          detail: {
            conceptId: this.focusConcept.conceptId,
            term: this.focusConcept.conceptTerm,
            semanticTag: this.focusConcept.semanticTag,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Get normalized semantic tag class
   */
  private _getSemanticTagClass(tag: string): string {
    return tag.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Render icons
   */
  private _renderIcon(name: string) {
    const icons: Record<string, unknown> = {
      search: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>`,
      bookmark: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>`,
      hash: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" x2="20" y1="9" y2="9" />
        <line x1="4" x2="20" y1="15" y2="15" />
        <line x1="10" x2="8" y1="3" y2="21" />
        <line x1="16" x2="14" y1="3" y2="21" />
      </svg>`,
      target: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>`,
    };
    return icons[name] || html``;
  }

  render() {
    if (!this.focusConcept) {
      return html`
        <div class="focus-panel">
          <div class="empty-state">
            <div class="empty-icon">${this._renderIcon('target')}</div>
            <p class="empty-text">Enter clinical text to start coding</p>
          </div>
        </div>
      `;
    }

    return html`
      <div class="focus-panel">
        <div class="panel-header">
          <span class="panel-title">Current Focus</span>
          <div class="panel-actions">
            <button
              class="action-btn"
              @click=${this._handleViewInExplorer}
              title="View in Explorer"
            >
              ${this._renderIcon('search')}
            </button>
            <button
              class="action-btn"
              @click=${this._handleBookmark}
              title="Bookmark concept"
            >
              ${this._renderIcon('bookmark')}
            </button>
          </div>
        </div>

        <div class="concept-main">
          <div class="concept-term">${this.focusConcept.conceptTerm}</div>
          <div class="concept-meta">
            <span class="concept-id">
              ${this._renderIcon('hash')}
              ${this.focusConcept.conceptId}
            </span>
            <span class="semantic-tag ${this._getSemanticTagClass(this.focusConcept.semanticTag)}">
              ${this.focusConcept.semanticTag}
            </span>
          </div>
        </div>

        ${this.focusConcept.depth > 0
          ? html`
              <div class="divider"></div>
              <div class="drilling-info">
                <div class="drilling-row">
                  <span class="drilling-label">Depth:</span>
                  <span class="depth-badge">Level ${this.focusConcept.depth}</span>
                </div>
                ${this.focusConcept.parentConceptId
                  ? html`
                      <div class="drilling-row">
                        <span class="drilling-label">From:</span>
                        <span class="drilling-value">
                          ${this.parentTerm || this.focusConcept.parentConceptId}
                        </span>
                      </div>
                    `
                  : ''}
                <div class="drilling-row">
                  <span class="drilling-label">Original:</span>
                  <span class="drilling-value">"${this.focusConcept.originalPhrase}"</span>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-focus-panel': TxFocusPanel;
  }
}
