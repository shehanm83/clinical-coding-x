/**
 * tx-two-tier-results - Two-Tier Results Display Component
 *
 * Displays search results in two tiers:
 * 1. Direct Matches - Primary validated results (90-100% confidence)
 * 2. Related Concepts - Suggestions from embedding search (≤80% confidence)
 *
 * Based on architecture from:
 * - clinical-nlu-analysis.md
 * - embeddings-vs-snomed-analysis.md
 *
 * @fires concept-select - Fired when a concept is selected
 * @fires related-select - Fired when a related concept is selected (needs confirmation)
 *
 * @example
 * ```html
 * <tx-two-tier-results
 *   .validatedMatches=${this.validatedMatches}
 *   .relatedConcepts=${this.relatedConcepts}
 *   .selectedId=${this.selectedConceptId}
 *   @concept-select=${this.handleSelect}
 * ></tx-two-tier-results>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * Validated match from direct lookup (Stages 1-3)
 */
export interface ValidatedMatch {
  conceptId: string;
  term: string;
  fsn: string;
  confidence: number;
  source: 'synonym_lookup' | 'exact_match' | 'lexical_match';
  semanticTag?: string;
  clinicallyValidated: true;
}

/**
 * Related concept from embedding search
 */
export interface RelatedConcept {
  conceptId: string;
  term: string;
  fsn?: string;
  similarity: number;
  source: 'embedding_search';
  clinicalHint?: string;
  isSuggestion: true;
  clinicallyValidated: false;
  semanticTag?: string;
}

/**
 * Selection event detail
 */
export interface ConceptSelectDetail {
  conceptId: string;
  term: string;
  isRelated: boolean;
  confidence: number;
}

@customElement('tx-two-tier-results')
export class TxTwoTierResults extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CONTAINER ===== */

    .results-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 16px);
    }

    /* ===== SECTION STYLES ===== */

    .section {
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-background, #f9fafb);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .section-header.clickable {
      cursor: pointer;
      user-select: none;
    }

    .section-header.clickable:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .section-icon {
      width: 20px;
      height: 20px;
    }

    .section-icon.validated {
      color: var(--color-success, #16a34a);
    }

    .section-icon.related {
      color: var(--color-warning, #f59e0b);
    }

    .section-title {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .count-badge {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-full, 9999px);
    }

    .count-badge.validated {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success-dark, #166534);
    }

    .count-badge.related {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
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

    /* ===== SECTION CONTENT ===== */

    .section-content {
      padding: var(--space-3, 12px);
    }

    .section-content.collapsed {
      display: none;
    }

    /* ===== DISCLAIMER ===== */

    .disclaimer {
      display: flex;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-warning-light, #fef3c7);
      border-radius: var(--radius-md, 8px);
      margin-bottom: var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      color: var(--color-warning-dark, #92400e);
    }

    .disclaimer-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .disclaimer-text {
      line-height: 1.4;
    }

    /* ===== CONCEPT LIST ===== */

    .concept-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    /* ===== CONCEPT ITEM ===== */

    .concept-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px);
      background: var(--color-surface, #ffffff);
      border: 2px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .concept-item:hover {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #eff6ff);
    }

    .concept-item.selected {
      border-color: var(--color-success, #16a34a);
      background: var(--color-success-light, #dcfce7);
    }

    .concept-item.related {
      border-style: dashed;
    }

    .concept-item.related:hover {
      border-color: var(--color-warning, #f59e0b);
      background: var(--color-warning-light, #fef3c7);
    }

    .concept-item.related.selected {
      border-color: var(--color-warning, #f59e0b);
      border-style: solid;
      background: var(--color-warning-light, #fef3c7);
    }

    /* Radio button */
    .radio-indicator {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border-strong, #d1d5db);
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .concept-item:hover .radio-indicator {
      border-color: var(--color-primary, #2563eb);
    }

    .concept-item.selected .radio-indicator {
      border-color: var(--color-success, #16a34a);
      background: var(--color-success, #16a34a);
    }

    .concept-item.related.selected .radio-indicator {
      border-color: var(--color-warning, #f59e0b);
      background: var(--color-warning, #f59e0b);
    }

    .radio-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: var(--radius-full, 9999px);
      opacity: 0;
      transition: opacity var(--duration-fast, 150ms) ease;
    }

    .concept-item.selected .radio-dot {
      opacity: 1;
    }

    /* Concept details */
    .concept-details {
      flex: 1;
      min-width: 0;
    }

    .concept-term {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      margin-bottom: var(--space-1, 4px);
    }

    .concept-fsn {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
      margin-bottom: var(--space-1, 4px);
    }

    .concept-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2, 8px);
      align-items: center;
    }

    .concept-id {
      font-size: var(--text-xs, 12px);
      font-family: var(--font-mono, monospace);
      color: var(--color-text-muted, #6b7280);
    }

    .semantic-tag {
      font-size: var(--text-xs, 12px);
      padding: 2px 6px;
      background: var(--color-background, #f3f4f6);
      color: var(--color-text-secondary, #4b5563);
      border-radius: var(--radius-sm, 4px);
    }

    /* Clinical hint for related concepts */
    .clinical-hint {
      display: flex;
      align-items: flex-start;
      gap: var(--space-1, 4px);
      margin-top: var(--space-2, 8px);
      padding: var(--space-2, 8px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .hint-icon {
      width: 14px;
      height: 14px;
      color: var(--color-warning, #f59e0b);
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Confidence badge */
    .confidence-badge {
      padding: 2px 6px;
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
      flex-shrink: 0;
    }

    .confidence-badge.high {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success-dark, #166534);
    }

    .confidence-badge.medium {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
    }

    .confidence-badge.low {
      background: var(--color-error-light, #fee2e2);
      color: var(--color-error-dark, #991b1b);
    }

    /* ===== EMPTY STATE ===== */

    .empty-state {
      padding: var(--space-4, 16px);
      text-align: center;
      color: var(--color-text-muted, #6b7280);
    }

    .empty-icon {
      width: 40px;
      height: 40px;
      margin: 0 auto var(--space-2, 8px);
      color: var(--color-border, #e5e7eb);
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
   * Validated matches from direct lookup (Stages 1-3)
   */
  @property({ type: Array })
  validatedMatches: ValidatedMatch[] = [];

  /**
   * Related concepts from embedding search
   */
  @property({ type: Array })
  relatedConcepts: RelatedConcept[] = [];

  /**
   * Currently selected concept ID
   */
  @property({ type: String })
  selectedId: string | null = null;

  /**
   * Term text being searched (for context)
   */
  @property({ type: String })
  termText = '';

  /**
   * Whether related concepts section is collapsed
   */
  @state()
  private _relatedCollapsed = true;

  /**
   * Handle concept selection
   */
  private _handleSelect(
    conceptId: string,
    term: string,
    confidence: number,
    isRelated: boolean
  ) {
    const detail: ConceptSelectDetail = {
      conceptId,
      term,
      isRelated,
      confidence,
    };

    this.dispatchEvent(
      new CustomEvent('concept-select', {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Toggle related concepts section
   */
  private _toggleRelated() {
    this._relatedCollapsed = !this._relatedCollapsed;
  }

  /**
   * Get confidence level class
   */
  private _getConfidenceClass(confidence: number): string {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Format confidence as percentage
   */
  private _formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

  /**
   * Render checkmark icon
   */
  private _renderCheckIcon() {
    return html`
      <svg class="section-icon validated" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  /**
   * Render lightbulb icon for related concepts
   */
  private _renderLightbulbIcon() {
    return html`
      <svg class="section-icon related" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18h6M10 22h4M12 2v1M21 12h1M3 12H2M18.36 5.64l.71-.71M5.64 5.64l-.71-.71" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 6a6 6 0 0 0-4 10.5V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.5A6 6 0 0 0 12 6z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  /**
   * Render warning icon
   */
  private _renderWarningIcon() {
    return html`
      <svg class="disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  /**
   * Render toggle icon
   */
  private _renderToggleIcon() {
    const iconClasses = {
      'toggle-icon': true,
      collapsed: this._relatedCollapsed,
    };

    return html`
      <svg
        class=${classMap(iconClasses)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9" stroke-linecap="round" stroke-linejoin="round"></polyline>
      </svg>
    `;
  }

  /**
   * Render hint icon
   */
  private _renderHintIcon() {
    return html`
      <svg class="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke-linecap="round" stroke-linejoin="round"></path>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" stroke-linejoin="round"></line>
      </svg>
    `;
  }

  /**
   * Render a validated match item
   */
  private _renderValidatedMatch(match: ValidatedMatch) {
    const isSelected = this.selectedId === match.conceptId;
    const itemClasses = {
      'concept-item': true,
      selected: isSelected,
    };
    const confidenceClass = this._getConfidenceClass(match.confidence);

    return html`
      <div
        class=${classMap(itemClasses)}
        role="radio"
        aria-checked=${isSelected}
        tabindex="0"
        @click=${() =>
          this._handleSelect(
            match.conceptId,
            match.term,
            match.confidence,
            false
          )}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleSelect(
              match.conceptId,
              match.term,
              match.confidence,
              false
            );
          }
        }}
      >
        <div class="radio-indicator">
          <div class="radio-dot"></div>
        </div>
        <div class="concept-details">
          <div class="concept-term">${match.term}</div>
          ${match.fsn
            ? html`<div class="concept-fsn">${match.fsn}</div>`
            : nothing}
          <div class="concept-meta">
            <span class="concept-id">${match.conceptId}</span>
            ${match.semanticTag
              ? html`<span class="semantic-tag">${match.semanticTag}</span>`
              : nothing}
          </div>
        </div>
        <span class="confidence-badge ${confidenceClass}">
          ${this._formatConfidence(match.confidence)}
        </span>
      </div>
    `;
  }

  /**
   * Render a related concept item
   */
  private _renderRelatedConcept(concept: RelatedConcept) {
    const isSelected = this.selectedId === concept.conceptId;
    const itemClasses = {
      'concept-item': true,
      related: true,
      selected: isSelected,
    };
    const confidenceClass = this._getConfidenceClass(concept.similarity);

    return html`
      <div
        class=${classMap(itemClasses)}
        role="radio"
        aria-checked=${isSelected}
        tabindex="0"
        @click=${() =>
          this._handleSelect(
            concept.conceptId,
            concept.term,
            concept.similarity,
            true
          )}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleSelect(
              concept.conceptId,
              concept.term,
              concept.similarity,
              true
            );
          }
        }}
      >
        <div class="radio-indicator">
          <div class="radio-dot"></div>
        </div>
        <div class="concept-details">
          <div class="concept-term">${concept.term}</div>
          ${concept.fsn
            ? html`<div class="concept-fsn">${concept.fsn}</div>`
            : nothing}
          <div class="concept-meta">
            <span class="concept-id">${concept.conceptId}</span>
            ${concept.semanticTag
              ? html`<span class="semantic-tag">${concept.semanticTag}</span>`
              : nothing}
          </div>
          ${concept.clinicalHint
            ? html`
                <div class="clinical-hint">
                  ${this._renderHintIcon()}
                  <span>${concept.clinicalHint}</span>
                </div>
              `
            : nothing}
        </div>
        <span class="confidence-badge ${confidenceClass}">
          ${this._formatConfidence(concept.similarity)}
        </span>
      </div>
    `;
  }

  /**
   * Render validated matches section
   */
  private _renderValidatedSection() {
    const hasMatches = this.validatedMatches.length > 0;

    return html`
      <div class="section">
        <div class="section-header">
          <div class="header-left">
            ${this._renderCheckIcon()}
            <span class="section-title">Direct Matches</span>
            <span class="count-badge validated">${this.validatedMatches.length}</span>
          </div>
        </div>
        <div class="section-content">
          ${hasMatches
            ? html`
                <div class="concept-list" role="radiogroup" aria-label="Direct matches">
                  ${this.validatedMatches.map((m) => this._renderValidatedMatch(m))}
                </div>
              `
            : html`
                <div class="empty-state">
                  <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <p>No direct matches found</p>
                </div>
              `}
        </div>
      </div>
    `;
  }

  /**
   * Render related concepts section
   */
  private _renderRelatedSection() {
    if (this.relatedConcepts.length === 0) {
      return nothing;
    }

    const contentClasses = {
      'section-content': true,
      collapsed: this._relatedCollapsed,
    };

    return html`
      <div class="section">
        <div
          class="section-header clickable"
          role="button"
          tabindex="0"
          aria-expanded=${!this._relatedCollapsed}
          aria-controls="related-content"
          @click=${this._toggleRelated}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this._toggleRelated();
            }
          }}
        >
          <div class="header-left">
            ${this._renderLightbulbIcon()}
            <span class="section-title">Related Concepts</span>
            <span class="count-badge related">${this.relatedConcepts.length}</span>
          </div>
          ${this._renderToggleIcon()}
        </div>
        <div id="related-content" class=${classMap(contentClasses)}>
          <div class="disclaimer">
            ${this._renderWarningIcon()}
            <span class="disclaimer-text">
              These are suggestions based on medical literature patterns, not direct matches.
              Verify clinical appropriateness for your specific case.
            </span>
          </div>
          <div class="concept-list" role="radiogroup" aria-label="Related concepts">
            ${this.relatedConcepts.map((c) => this._renderRelatedConcept(c))}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="results-container">
        ${this._renderValidatedSection()}
        ${this._renderRelatedSection()}
      </div>

      <span class="visually-hidden" aria-live="polite">
        ${this.validatedMatches.length} direct matches,
        ${this.relatedConcepts.length} related concepts available
      </span>
    `;
  }
}

// TypeScript declaration
declare global {
  interface HTMLElementTagNameMap {
    'tx-two-tier-results': TxTwoTierResults;
  }
}
