/**
 * tx-term-card - Term Card Component
 *
 * Displays a single extracted term with type badge, modifiers,
 * confidence score, and concept selection options.
 *
 * @fires concept-select - Fired when a concept is selected
 * @fires manual-search - Fired when manual search is requested
 * @fires skip-term - Fired when term is skipped
 *
 * @example
 * ```html
 * <tx-term-card
 *   .term=${term}
 *   .matches=${matches}
 *   .selectedId=${selectedConceptId}
 *   .index=${0}
 *   @concept-select=${this.handleSelect}
 * ></tx-term-card>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * Extracted term interface
 */
export interface ExtractedTerm {
  text: string;
  normalized: string;
  type: 'finding' | 'body_site' | 'procedure' | 'substance' | 'qualifier';
  confidence: number;
  modifiers: { type: string; value: string }[];
  negated: boolean;
  span?: { start: number; end: number };
}

/**
 * Concept match interface
 */
export interface ConceptMatch {
  id: string;
  term: string;
  fsn: string;
  semanticTag: string;
  similarity: number;
  /** Match type: validated (direct/lexical) or related (embedding) */
  matchType?: 'validated' | 'related' | string;
  /** Clinical hint for related concepts */
  clinicalHint?: string;
}

/**
 * Term type display info
 */
const TYPE_INFO: Record<string, { label: string; colorClass: string }> = {
  finding: { label: 'Finding', colorClass: 'type-finding' },
  body_site: { label: 'Body Site', colorClass: 'type-body-site' },
  procedure: { label: 'Procedure', colorClass: 'type-procedure' },
  substance: { label: 'Substance', colorClass: 'type-substance' },
  qualifier: { label: 'Qualifier', colorClass: 'type-qualifier' },
};

@customElement('tx-term-card')
export class TxTermCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CARD CONTAINER ===== */

    .term-card {
      padding: var(--space-3, 12px);
      background: var(--color-surface, #ffffff);
      border: 2px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      transition: border-color var(--duration-fast, 150ms) ease;
    }

    /* Card states */
    .term-card.pending {
      border-color: var(--color-warning, #f59e0b);
    }

    .term-card.selected {
      border-color: var(--color-success, #16a34a);
    }

    .term-card.auto-selected {
      border-color: var(--color-primary, #2563eb);
    }

    .term-card.negated {
      border-style: dashed;
      opacity: 0.75;
    }

    .term-card.error {
      border-color: var(--color-error, #dc2626);
    }

    /* ===== HEADER ===== */

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-2, 8px);
    }

    .term-text {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .term-text.negated {
      text-decoration: line-through;
      color: var(--color-text-muted, #6b7280);
    }

    /* Type Badge */
    .type-badge {
      padding: 2px 6px;
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
      flex-shrink: 0;
    }

    .type-finding {
      background-color: #e8f4fd;
      color: #2c5aa0;
    }

    .type-body-site {
      background-color: #fde8e8;
      color: #a02c2c;
    }

    .type-procedure {
      background-color: #e8fde8;
      color: #2ca02c;
    }

    .type-substance {
      background-color: #fdf4e8;
      color: #a07c2c;
    }

    .type-qualifier {
      background-color: #f4e8fd;
      color: #7c2ca0;
    }

    /* ===== MODIFIERS ===== */

    .modifiers {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1, 4px);
      margin-bottom: var(--space-2, 8px);
    }

    .modifier-tag {
      padding: 2px 6px;
      font-size: var(--text-xs, 12px);
      background: var(--color-background, #f9fafb);
      color: var(--color-text-secondary, #4b5563);
      border-radius: var(--radius-sm, 4px);
    }

    .negated-label {
      color: var(--color-error, #dc2626);
      font-weight: var(--font-weight-medium, 500);
    }

    /* ===== CONFIDENCE ===== */

    .confidence-section {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-2, 8px);
    }

    .confidence-label {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #4b5563);
      white-space: nowrap;
    }

    .confidence-bar {
      flex: 1;
      height: 6px;
      background: var(--color-background, #f3f4f6);
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      transition: width var(--duration-normal, 200ms) ease;
    }

    .confidence-fill.high {
      background: var(--color-success, #16a34a);
    }

    .confidence-fill.medium {
      background: var(--color-warning, #f59e0b);
    }

    .confidence-fill.low {
      background: var(--color-error, #dc2626);
    }

    /* ===== DIVIDER ===== */

    .divider {
      height: 1px;
      background: var(--color-border, #e5e7eb);
      margin: var(--space-2, 8px) 0;
    }

    /* ===== CONCEPTS SECTION ===== */

    .concepts-section {
      margin-top: 0;
    }

    .concepts-label {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #4b5563);
      margin-bottom: var(--space-1, 4px);
    }

    .concept-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    /* Concept Option */
    .concept-option {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      transition: background var(--duration-fast, 150ms) ease;
    }

    .concept-option:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .concept-option.selected {
      background: var(--color-success-light, #dcfce7);
    }

    .concept-option input[type="radio"] {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
      accent-color: var(--color-primary, #2563eb);
    }

    .concept-info {
      flex: 1;
      min-width: 0;
      line-height: 1.3;
    }

    .concept-term {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    .concept-id {
      font-size: 10px;
      color: var(--color-text-muted, #6b7280);
      font-family: var(--font-mono, ui-monospace, monospace);
    }

    .concept-tag {
      font-size: 10px;
      color: var(--color-text-muted, #6b7280);
    }

    /* Similarity Badge */
    .similarity-badge {
      padding: 2px 6px;
      font-size: 10px;
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
      flex-shrink: 0;
    }

    .similarity-high {
      background: #d4edda;
      color: #155724;
    }

    .similarity-medium {
      background: #fff3cd;
      color: #856404;
    }

    .similarity-low {
      background: #f8d7da;
      color: #721c24;
    }

    /* Auto-selected Badge */
    .auto-badge {
      font-size: 10px;
      color: var(--color-primary, #2563eb);
      font-weight: var(--font-weight-medium, 500);
      margin-left: var(--space-1, 4px);
    }

    /* ===== ACTION BUTTONS ===== */

    .actions {
      display: flex;
      gap: var(--space-3, 12px);
      margin-top: var(--space-2, 8px);
    }

    .action-link {
      font-size: var(--text-xs, 12px);
      color: var(--color-primary, #2563eb);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }

    .action-link:hover {
      color: var(--color-primary-dark, #1d4ed8);
    }

    .action-link.skip {
      color: var(--color-text-muted, #6b7280);
    }

    /* ===== CHANGE DROPDOWN ===== */

    .change-section {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-top: var(--space-1, 4px);
    }

    /* ===== NO MATCHES ===== */

    .no-matches {
      padding: var(--space-2, 8px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-sm, 4px);
      text-align: center;
      color: var(--color-text-muted, #6b7280);
      font-size: var(--text-sm, 14px);
    }

    /* ===== TWO-TIER DISPLAY ===== */

    .tier-section {
      margin-bottom: var(--space-3, 12px);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }

    .tier-section.validated {
      border-color: var(--color-success-light, #bbf7d0);
    }

    .tier-section.related {
      border-color: var(--color-warning-light, #fde68a);
      border-style: dashed;
    }

    .tier-header {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .tier-section.validated .tier-header {
      background: var(--color-success-light, #dcfce7);
    }

    .tier-section.related .tier-header {
      background: var(--color-warning-light, #fef3c7);
    }

    .tier-icon {
      display: flex;
      align-items: center;
    }

    .tier-section.validated .tier-icon {
      color: var(--color-success, #16a34a);
    }

    .tier-section.related .tier-icon {
      color: var(--color-warning, #f59e0b);
    }

    .tier-title {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .tier-count {
      padding: 2px 6px;
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-background-hover, #e5e7eb);
      color: var(--color-text-secondary, #4b5563);
    }

    .tier-disclaimer {
      padding: var(--space-2, 8px);
      background: var(--color-warning-light, #fef3c7);
      font-size: var(--text-xs, 12px);
      color: var(--color-warning-dark, #92400e);
      border-bottom: 1px solid var(--color-warning, #f59e0b);
    }

    .tier-section .concept-list {
      padding: var(--space-2, 8px);
    }

    .concept-option.related {
      border-style: dashed;
    }

    .concept-option.related:hover {
      border-color: var(--color-warning, #f59e0b);
      background: var(--color-warning-light, #fef3c7);
    }

    .concept-option.related.selected {
      border-color: var(--color-warning, #f59e0b);
      border-style: solid;
      background: var(--color-warning-light, #fef3c7);
    }

    .clinical-hint {
      margin-top: var(--space-1, 4px);
      font-size: var(--text-xs, 12px);
      color: var(--color-warning-dark, #92400e);
      font-style: italic;
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
   * The extracted term data
   */
  @property({ type: Object })
  term?: ExtractedTerm;

  /**
   * Concept matches for this term
   */
  @property({ type: Array })
  conceptMatches: ConceptMatch[] = [];

  /**
   * Currently selected concept ID
   */
  @property({ type: String })
  selectedId: string | null = null;

  /**
   * Index of this term in the list
   */
  @property({ type: Number })
  index = 0;

  /**
   * Whether this term was auto-selected
   */
  @property({ type: Boolean })
  autoSelected = false;

  /**
   * Show all matches (used when changing auto-selected)
   */
  @state()
  private _showAllMatches = false;

  /**
   * Get card state class
   */
  private _getCardState(): string {
    if (!this.term) return '';
    if (this.term.negated) return 'negated';
    if (this.autoSelected && this.selectedId) return 'auto-selected';
    if (this.selectedId) return 'selected';
    if (this.conceptMatches.length === 0) return 'error';
    return 'pending';
  }

  /**
   * Get confidence level
   */
  private _getConfidenceLevel(confidence: number): string {
    if (confidence >= 85) return 'high';
    if (confidence >= 65) return 'medium';
    return 'low';
  }

  /**
   * Get similarity level
   */
  private _getSimilarityLevel(similarity: number): string {
    if (similarity >= 85) return 'high';
    if (similarity >= 65) return 'medium';
    return 'low';
  }

  /**
   * Handle concept selection
   */
  private _handleSelect(conceptId: string) {
    this.dispatchEvent(
      new CustomEvent('concept-select', {
        bubbles: true,
        composed: true,
        detail: {
          termIndex: this.index,
          conceptId,
        },
      })
    );
  }

  /**
   * Handle manual search request
   */
  private _handleManualSearch() {
    this.dispatchEvent(
      new CustomEvent('manual-search', {
        bubbles: true,
        composed: true,
        detail: {
          termIndex: this.index,
          termText: this.term?.text,
        },
      })
    );
  }

  /**
   * Handle skip term
   */
  private _handleSkip() {
    this.dispatchEvent(
      new CustomEvent('skip-term', {
        bubbles: true,
        composed: true,
        detail: {
          termIndex: this.index,
        },
      })
    );
  }

  /**
   * Toggle show all matches
   */
  private _toggleShowAllMatches() {
    this._showAllMatches = !this._showAllMatches;
  }

  /**
   * Check if a match is a validated (direct) match
   */
  private _isValidatedMatch(match: ConceptMatch): boolean {
    const matchType = match.matchType || 'validated';
    return ['validated', 'synonym_lookup', 'exact_match', 'lexical_match'].includes(matchType);
  }

  /**
   * Get validated matches (direct/lexical)
   */
  private _getValidatedMatches(): ConceptMatch[] {
    return this.conceptMatches.filter(m => this._isValidatedMatch(m));
  }

  /**
   * Get related matches (embedding/vector)
   */
  private _getRelatedMatches(): ConceptMatch[] {
    return this.conceptMatches.filter(m => !this._isValidatedMatch(m));
  }

  /**
   * Get matches to display
   */
  private _getDisplayMatches(): ConceptMatch[] {
    if (this.autoSelected && !this._showAllMatches) {
      // Show only selected when auto-selected
      const selected = this.conceptMatches.find((m) => m.id === this.selectedId);
      return selected ? [selected] : this.conceptMatches.slice(0, 1);
    }

    // Show up to 5 matches
    return this.conceptMatches.slice(0, 5);
  }

  /**
   * Render type badge
   */
  private _renderTypeBadge() {
    if (!this.term) return nothing;

    const info = TYPE_INFO[this.term.type] || { label: this.term.type, colorClass: '' };

    return html`
      <span class="type-badge ${info.colorClass}">${info.label}</span>
    `;
  }

  /**
   * Render modifiers
   */
  private _renderModifiers() {
    if (!this.term?.modifiers?.length) return nothing;

    return html`
      <div class="modifiers">
        ${this.term.modifiers.map(
          (mod) => html`
            <span class="modifier-tag">${mod.value} (${mod.type})</span>
          `
        )}
        ${this.term.negated
          ? html`<span class="modifier-tag negated-label">(excluded)</span>`
          : nothing}
      </div>
    `;
  }

  /**
   * Render confidence bar
   */
  private _renderConfidence() {
    if (!this.term) return nothing;

    // API returns confidence as 0.0-1.0, convert to percentage for display
    const confidencePercent = this.term.confidence <= 1
      ? this.term.confidence * 100
      : this.term.confidence;
    const level = this._getConfidenceLevel(confidencePercent);

    return html`
      <div class="confidence-section">
        <span class="confidence-label">
          Confidence: ${Math.round(confidencePercent)}%
        </span>
        <div class="confidence-bar">
          <div
            class="confidence-fill ${level}"
            style="width: ${confidencePercent}%"
          ></div>
        </div>
      </div>
    `;
  }

  /**
   * Render concept option
   */
  private _renderConceptOption(match: ConceptMatch, isRelated: boolean = false) {
    const isSelected = match.id === this.selectedId;
    // API returns similarity as 0.0-1.0, convert to percentage for display
    const similarityPercent = match.similarity <= 1
      ? match.similarity * 100
      : match.similarity;
    const similarityLevel = this._getSimilarityLevel(similarityPercent);

    const optionClasses = {
      'concept-option': true,
      selected: isSelected,
      related: isRelated,
    };

    return html`
      <label class=${classMap(optionClasses)}>
        <input
          type="radio"
          name="concept-${this.index}"
          .value=${match.id}
          .checked=${isSelected}
          @change=${() => this._handleSelect(match.id)}
        />
        <div class="concept-info">
          <div class="concept-term">${match.term}</div>
          <div class="concept-id">${match.id}</div>
          <div class="concept-tag">${match.semanticTag}</div>
          ${match.clinicalHint && isRelated
            ? html`<div class="clinical-hint">${match.clinicalHint}</div>`
            : nothing}
        </div>
        <span class="similarity-badge similarity-${similarityLevel}">
          ${Math.round(similarityPercent)}%
        </span>
        ${isSelected && this.autoSelected
          ? html`<span class="auto-badge">Auto-selected</span>`
          : nothing}
      </label>
    `;
  }

  /**
   * Render a tier section
   */
  private _renderTierSection(
    title: string,
    matches: ConceptMatch[],
    isRelated: boolean = false
  ) {
    if (matches.length === 0) return nothing;

    return html`
      <div class="tier-section ${isRelated ? 'related' : 'validated'}">
        <div class="tier-header">
          <span class="tier-icon">
            ${isRelated
              ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>`
              : html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`
            }
          </span>
          <span class="tier-title">${title}</span>
          <span class="tier-count">${matches.length}</span>
        </div>
        ${isRelated
          ? html`
              <div class="tier-disclaimer">
                Suggestions based on medical literature patterns - verify clinical appropriateness
              </div>
            `
          : nothing}
        <div class="concept-list">
          ${matches.map((match) => this._renderConceptOption(match, isRelated))}
        </div>
      </div>
    `;
  }

  /**
   * Render concepts section
   */
  private _renderConcepts() {
    if (this.term?.negated) {
      return html`
        <div class="no-matches">
          This term is negated and excluded from the expression.
        </div>
      `;
    }

    if (this.conceptMatches.length === 0) {
      return html`
        <div class="no-matches">
          No strong matches found.
          <button class="action-link" @click=${this._handleManualSearch}>
            Search manually
          </button>
        </div>
      `;
    }

    // Split matches into two tiers
    const validatedMatches = this._getValidatedMatches();
    const relatedMatches = this._getRelatedMatches();

    // If auto-selected and not showing all, just show the display matches
    if (this.autoSelected && !this._showAllMatches) {
      const displayMatches = this._getDisplayMatches();
      return html`
        <div class="concepts-section">
          <fieldset>
            <legend class="visually-hidden">
              Concept options for "${this.term?.text}"
            </legend>
            <div class="concept-list">
              ${displayMatches.map((match) => this._renderConceptOption(match))}
            </div>
          </fieldset>

          <div class="change-section">
            <button class="action-link" @click=${this._toggleShowAllMatches}>
              Change selection
            </button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="concepts-section">
        <div class="concepts-label">
          Select matching SNOMED CT concept:
        </div>
        <fieldset>
          <legend class="visually-hidden">
            Concept options for "${this.term?.text}"
          </legend>

          ${this._renderTierSection('Direct Matches', validatedMatches.slice(0, 5), false)}
          ${this._renderTierSection('Related Concepts', relatedMatches.slice(0, 3), true)}
        </fieldset>

        <div class="actions">
          <button class="action-link" @click=${this._handleManualSearch}>
            Search for different concept...
          </button>
          <button class="action-link skip" @click=${this._handleSkip}>
            No good match
          </button>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.term) return nothing;

    const cardClasses = {
      'term-card': true,
      [this._getCardState()]: true,
    };

    const textClasses = {
      'term-text': true,
      negated: this.term.negated,
    };

    return html`
      <div class=${classMap(cardClasses)}>
        <div class="card-header">
          <span class=${classMap(textClasses)}>${this.term.text}</span>
          ${this._renderTypeBadge()}
        </div>

        ${this._renderModifiers()}
        ${this._renderConfidence()}

        <div class="divider"></div>

        ${this._renderConcepts()}
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-term-card': TxTermCard;
  }
}
