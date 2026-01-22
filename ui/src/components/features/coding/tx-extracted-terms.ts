/**
 * tx-extracted-terms - Extracted Terms Panel Component
 *
 * A collapsible panel that displays all extracted clinical terms
 * with their SNOMED CT concept matches.
 *
 * @fires concept-select - Fired when a concept is selected
 * @fires manual-search - Fired when manual search is requested
 * @fires skip-term - Fired when a term is skipped
 *
 * @example
 * ```html
 * <tx-extracted-terms
 *   .terms=${this.extractedTerms}
 *   .matches=${this.termMatches}
 *   @concept-select=${this.handleConceptSelect}
 *   @manual-search=${this.handleManualSearch}
 * ></tx-extracted-terms>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// Import term card component
import './tx-term-card.js';
import type { ExtractedTerm, ConceptMatch } from './tx-term-card.js';

/**
 * Term match result interface
 */
export interface TermMatchResult {
  termIndex: number;
  matches: ConceptMatch[];
  selectedId: string | null;
  needsConfirmation?: boolean;
}

/**
 * Auto-selection confidence threshold
 */
const _AUTO_SELECT_THRESHOLD = 90;

@customElement('tx-extracted-terms')
export class TxExtractedTerms extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== PANEL CONTAINER ===== */

    .panel {
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }

    /* ===== PANEL HEADER ===== */

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-background, #f9fafb);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      cursor: pointer;
      user-select: none;
    }

    .panel-header:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .panel-title {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .count-badge {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      background: var(--color-primary, #2563eb);
      color: var(--color-text-inverse, #ffffff);
      border-radius: var(--radius-full, 9999px);
    }

    .toggle-icon {
      width: 20px;
      height: 20px;
      color: var(--color-text-muted, #6b7280);
      transition: transform var(--duration-fast, 150ms) ease;
    }

    .toggle-icon.collapsed {
      transform: rotate(-90deg);
    }

    /* ===== PANEL CONTENT ===== */

    .panel-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px);
      max-height: 600px;
      overflow-y: auto;
    }

    .panel-content.collapsed {
      display: none;
    }

    /* ===== SUMMARY BAR ===== */

    .summary-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
    }

    .summary-stats {
      display: flex;
      gap: var(--space-4, 16px);
    }

    .stat {
      display: flex;
      align-items: center;
      gap: var(--space-1, 4px);
      color: var(--color-text-secondary, #4b5563);
    }

    .stat-value {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    .stat.pending .stat-value {
      color: var(--color-warning, #f59e0b);
    }

    .stat.selected .stat-value {
      color: var(--color-success, #16a34a);
    }

    .stat.excluded .stat-value {
      color: var(--color-text-muted, #6b7280);
    }

    /* ===== EMPTY STATE ===== */

    .empty-state {
      padding: var(--space-6, 24px);
      text-align: center;
      color: var(--color-text-muted, #6b7280);
    }

    .empty-state-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto var(--space-3, 12px);
      color: var(--color-border, #e5e7eb);
    }

    .empty-state-title {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
      margin-bottom: var(--space-1, 4px);
    }

    /* ===== SCROLL INDICATOR ===== */

    .scroll-indicator {
      padding: var(--space-2, 8px);
      text-align: center;
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #6b7280);
      background: linear-gradient(
        to top,
        var(--color-surface, #ffffff),
        transparent
      );
      position: sticky;
      bottom: 0;
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
   * Array of extracted terms
   */
  @property({ type: Array })
  terms: ExtractedTerm[] = [];

  /**
   * Array of term match results
   */
  @property({ type: Array })
  termMatches: TermMatchResult[] = [];

  /**
   * Whether the panel is collapsed
   */
  @state()
  private _collapsed = false;

  /**
   * Get term count
   */
  private get _termCount(): number {
    return this.terms.length;
  }

  /**
   * Get pending count (terms needing selection)
   */
  private get _pendingCount(): number {
    return this.terms.filter((term, index) => {
      if (term.negated) return false;
      const match = this.termMatches.find((m) => m.termIndex === index);
      return !match?.selectedId;
    }).length;
  }

  /**
   * Get selected count
   */
  private get _selectedCount(): number {
    return this.termMatches.filter((m) => m.selectedId).length;
  }

  /**
   * Get negated/excluded count
   */
  private get _excludedCount(): number {
    return this.terms.filter((t) => t.negated).length;
  }

  /**
   * Toggle collapsed state
   */
  private _toggleCollapsed() {
    this._collapsed = !this._collapsed;
  }

  /**
   * Get matches for a term
   */
  private _getMatchesForTerm(termIndex: number): ConceptMatch[] {
    const result = this.termMatches.find((m) => m.termIndex === termIndex);
    return result?.matches || [];
  }

  /**
   * Get selected ID for a term
   */
  private _getSelectedId(termIndex: number): string | null {
    const result = this.termMatches.find((m) => m.termIndex === termIndex);
    return result?.selectedId || null;
  }

  /**
   * Check if term is auto-selected (selected and doesn't need confirmation)
   */
  private _isAutoSelected(termIndex: number): boolean {
    const result = this.termMatches.find((m) => m.termIndex === termIndex);
    // Auto-selected if has selection and doesn't need confirmation
    return result?.selectedId != null && result?.needsConfirmation === false;
  }

  /**
   * Render collapse/expand icon
   */
  private _renderToggleIcon() {
    const iconClasses = {
      'toggle-icon': true,
      collapsed: this._collapsed,
    };

    return html`
      <svg
        class=${classMap(iconClasses)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
  }

  /**
   * Render summary bar
   */
  private _renderSummary() {
    return html`
      <div class="summary-bar">
        <div class="summary-stats">
          <div class="stat pending">
            <span class="stat-value">${this._pendingCount}</span>
            <span>pending</span>
          </div>
          <div class="stat selected">
            <span class="stat-value">${this._selectedCount}</span>
            <span>selected</span>
          </div>
          ${this._excludedCount > 0
            ? html`
                <div class="stat excluded">
                  <span class="stat-value">${this._excludedCount}</span>
                  <span>excluded</span>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  private _renderEmptyState() {
    return html`
      <div class="empty-state">
        <svg
          class="empty-state-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <div class="empty-state-title">No terms extracted yet</div>
        <p>Enter clinical text and start coding to see extracted terms.</p>
      </div>
    `;
  }

  /**
   * Render term cards
   */
  private _renderTermCards() {
    return this.terms.map(
      (term, index) => html`
        <tx-term-card
          .term=${term}
          .conceptMatches=${this._getMatchesForTerm(index)}
          .selectedId=${this._getSelectedId(index)}
          .index=${index}
          .autoSelected=${this._isAutoSelected(index)}
        ></tx-term-card>
      `
    );
  }

  render() {
    const contentClasses = {
      'panel-content': true,
      collapsed: this._collapsed,
    };

    return html`
      <div class="panel">
        <div
          class="panel-header"
          role="button"
          tabindex="0"
          aria-expanded=${!this._collapsed}
          aria-controls="panel-content"
          @click=${this._toggleCollapsed}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this._toggleCollapsed();
            }
          }}
        >
          <div class="header-left">
            <span class="panel-title">Extracted Terms</span>
            <span class="count-badge">${this._termCount}</span>
          </div>
          ${this._renderToggleIcon()}
        </div>

        <div
          id="panel-content"
          class=${classMap(contentClasses)}
          role="region"
          aria-label="Extracted terms list"
        >
          ${this._termCount > 0
            ? html`
                ${this._renderSummary()}
                ${this._renderTermCards()}
              `
            : this._renderEmptyState()}
        </div>

        <span class="visually-hidden" aria-live="polite">
          ${this._collapsed
            ? 'Panel collapsed'
            : `Panel expanded, ${this._termCount} terms, ${this._pendingCount} pending selection`}
        </span>
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-extracted-terms': TxExtractedTerms;
  }
}
