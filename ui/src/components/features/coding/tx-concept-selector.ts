/**
 * tx-concept-selector - Concept Selection Modal Component
 *
 * A modal dialog for selecting SNOMED CT concepts when multiple matches exist.
 * Provides search functionality, keyboard navigation, and explanations for each option.
 *
 * @fires select - Fired when a concept is selected
 * @fires search - Fired when search query is submitted (debounced)
 * @fires skip - Fired when "No good match" is selected
 * @fires close - Fired when modal is closed
 *
 * @example
 * ```html
 * <tx-concept-selector
 *   .open=${true}
 *   .term=${{ text: 'chest pain', type: 'finding' }}
 *   .matches=${conceptMatches}
 *   .explanations=${explanationMap}
 *   @select=${this.handleSelect}
 *   @search=${this.handleSearch}
 *   @skip=${this.handleSkip}
 *   @close=${this.handleClose}
 * ></tx-concept-selector>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// Import core components
import '../../core/tx-modal.js';
import '../../core/tx-input.js';
import '../../core/tx-button.js';

/**
 * Extracted term interface
 */
export interface ExtractedTerm {
  text: string;
  normalized?: string;
  type: 'finding' | 'body_site' | 'procedure' | 'substance' | 'qualifier';
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
}

/**
 * Concept explanation interface
 */
export interface ConceptExplanation {
  conceptId: string;
  explanation: string;
  differentiatingFactors?: string[];
}

@customElement('tx-concept-selector')
export class TxConceptSelector extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    /* ===== SEARCH SECTION ===== */

    .search-section {
      margin-bottom: var(--space-4, 16px);
    }

    .search-input-wrapper {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3, 12px);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted, #9ca3af);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: var(--space-3, 12px) var(--space-3, 12px) var(--space-3, 12px) var(--space-10, 40px);
      font-size: var(--text-base, 16px);
      border: 2px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      outline: none;
      transition: border-color var(--duration-fast, 150ms) ease;
    }

    .search-input:focus {
      border-color: var(--color-primary, #2563eb);
      box-shadow: 0 0 0 3px var(--color-primary-light, #dbeafe);
    }

    .search-input::placeholder {
      color: var(--color-text-muted, #9ca3af);
    }

    /* ===== SECTION LABEL ===== */

    .section-label {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
      margin-bottom: var(--space-2, 8px);
    }

    /* ===== CONCEPT LIST ===== */

    .concept-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
      max-height: 400px;
      overflow-y: auto;
      padding-right: var(--space-2, 8px);
    }

    /* ===== CONCEPT OPTION ===== */

    .concept-option {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border: 2px solid transparent;
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .concept-option:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .concept-option.focused {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #dbeafe);
    }

    .concept-option.selected {
      border-color: var(--color-success, #16a34a);
      background: var(--color-success-light, #dcfce7);
    }

    .concept-option input[type="radio"] {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      margin-top: 2px;
      accent-color: var(--color-primary, #2563eb);
    }

    .concept-content {
      flex: 1;
      min-width: 0;
    }

    .concept-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-1, 4px);
    }

    .concept-term {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    .similarity-badge {
      flex-shrink: 0;
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
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

    .concept-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    .concept-id {
      font-size: var(--text-sm, 14px);
      font-family: var(--font-mono, ui-monospace, monospace);
      color: var(--color-text-muted, #6b7280);
    }

    .concept-fsn {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .semantic-tag {
      display: inline-block;
      padding: var(--space-0-5, 2px) var(--space-1-5, 6px);
      font-size: var(--text-xs, 12px);
      background: var(--color-background, #f3f4f6);
      color: var(--color-text-secondary, #4b5563);
      border-radius: var(--radius-sm, 4px);
    }

    /* ===== EXPLANATION SECTION ===== */

    .explanation-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-1, 4px);
      margin-top: var(--space-2, 8px);
      padding: 0;
      font-size: var(--text-sm, 14px);
      color: var(--color-primary, #2563eb);
      background: none;
      border: none;
      cursor: pointer;
    }

    .explanation-toggle:hover {
      text-decoration: underline;
    }

    .explanation-content {
      margin-top: var(--space-2, 8px);
      padding: var(--space-3, 12px);
      background: var(--color-surface, #ffffff);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
      line-height: 1.5;
    }

    .differentiating-factors {
      margin-top: var(--space-2, 8px);
      padding-left: var(--space-4, 16px);
    }

    .differentiating-factors li {
      margin-bottom: var(--space-1, 4px);
    }

    /* ===== DIVIDER ===== */

    .divider {
      height: 1px;
      background: var(--color-border, #e5e7eb);
      margin: var(--space-4, 16px) 0;
    }

    /* ===== SKIP OPTION ===== */

    .skip-option {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border: 2px dashed var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .skip-option:hover {
      background: var(--color-background-hover, #f3f4f6);
      border-color: var(--color-text-muted, #9ca3af);
    }

    .skip-option.focused {
      border-color: var(--color-warning, #f59e0b);
      background: #fef3c7;
    }

    .skip-option input[type="radio"] {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      accent-color: var(--color-warning, #f59e0b);
    }

    .skip-text {
      font-size: var(--text-base, 16px);
      color: var(--color-text-secondary, #4b5563);
    }

    /* ===== LOADING STATE ===== */

    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4, 16px);
      color: var(--color-text-muted, #9ca3af);
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border, #e5e7eb);
      border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: var(--space-2, 8px);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ===== SEARCH RESULTS SECTION ===== */

    .search-results-section {
      margin-top: var(--space-4, 16px);
    }

    /* ===== FOOTER ===== */

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
    }

    /* ===== EMPTY STATE ===== */

    .empty-state {
      text-align: center;
      padding: var(--space-6, 24px);
      color: var(--color-text-muted, #9ca3af);
    }

    /* ===== KEYBOARD HINT ===== */

    .keyboard-hint {
      display: flex;
      gap: var(--space-4, 16px);
      margin-top: var(--space-4, 16px);
      padding: var(--space-2, 8px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #9ca3af);
    }

    .keyboard-hint kbd {
      padding: var(--space-0-5, 2px) var(--space-1, 4px);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-xs, 2px);
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: var(--text-xs, 12px);
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
   * Whether the modal is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * The term being matched
   */
  @property({ type: Object })
  term?: ExtractedTerm;

  /**
   * Initial concept matches
   */
  @property({ type: Array })
  conceptMatches: ConceptMatch[] = [];

  /**
   * Search results from API
   */
  @property({ type: Array })
  searchResults: ConceptMatch[] = [];

  /**
   * Explanations keyed by concept ID
   */
  @property({ type: Object })
  explanations: Record<string, ConceptExplanation> = {};

  /**
   * Loading state for search
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * Currently selected concept ID
   */
  @state()
  private _selectedId: string | null = null;

  /**
   * Currently focused option index
   */
  @state()
  private _focusedIndex = 0;

  /**
   * Search query
   */
  @state()
  private _searchQuery = '';

  /**
   * Expanded explanation concept IDs
   */
  @state()
  private _expandedExplanations = new Set<string>();

  /**
   * Search debounce timer
   */
  private _searchDebounce?: ReturnType<typeof setTimeout>;

  @query('.search-input')
  private _searchInput!: HTMLInputElement;

  @query('.concept-list')
  private _conceptList!: HTMLElement;

  /**
   * Get all options (matches + search results + skip)
   */
  private _getAllOptions(): (ConceptMatch | 'skip')[] {
    const options: (ConceptMatch | 'skip')[] = [...this.conceptMatches];
    if (this.searchResults.length > 0) {
      // Add search results that aren't already in matches
      const existingIds = new Set(this.conceptMatches.map((m) => m.id));
      this.searchResults.forEach((r) => {
        if (!existingIds.has(r.id)) {
          options.push(r);
        }
      });
    }
    options.push('skip');
    return options;
  }

  /**
   * Get similarity level for styling
   */
  private _getSimilarityLevel(similarity: number): string {
    if (similarity >= 85) return 'high';
    if (similarity >= 65) return 'medium';
    return 'low';
  }

  /**
   * Handle search input
   */
  private _handleSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._searchQuery = input.value;

    // Clear previous debounce
    if (this._searchDebounce) {
      clearTimeout(this._searchDebounce);
    }

    // Debounce search
    this._searchDebounce = setTimeout(() => {
      if (this._searchQuery.trim()) {
        this.dispatchEvent(
          new CustomEvent('search', {
            bubbles: true,
            composed: true,
            detail: { query: this._searchQuery.trim() },
          })
        );
      }
    }, 300);
  }

  /**
   * Handle keyboard navigation
   */
  private _handleKeyDown(e: KeyboardEvent) {
    const options = this._getAllOptions();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._focusedIndex = Math.min(this._focusedIndex + 1, options.length - 1);
        this._scrollToFocused();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this._focusedIndex = Math.max(this._focusedIndex - 1, 0);
        this._scrollToFocused();
        break;

      case 'Enter':
        e.preventDefault();
        this._selectFocused();
        break;

      case '/':
        e.preventDefault();
        this._searchInput?.focus();
        break;
    }
  }

  /**
   * Scroll to keep focused option in view
   */
  private _scrollToFocused() {
    requestAnimationFrame(() => {
      const focusedOption = this.shadowRoot?.querySelector('.focused');
      focusedOption?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  /**
   * Select the currently focused option
   */
  private _selectFocused() {
    const options = this._getAllOptions();
    const option = options[this._focusedIndex];

    if (option === 'skip') {
      this._handleSkip();
    } else if (option) {
      this._handleSelect(option.id);
    }
  }

  /**
   * Handle concept selection
   */
  private _handleSelect(conceptId: string) {
    this._selectedId = conceptId;
  }

  /**
   * Handle skip
   */
  private _handleSkip() {
    this.dispatchEvent(
      new CustomEvent('skip', {
        bubbles: true,
        composed: true,
      })
    );
    this._close();
  }

  /**
   * Confirm selection
   */
  private _confirmSelection() {
    if (this._selectedId) {
      this.dispatchEvent(
        new CustomEvent('select', {
          bubbles: true,
          composed: true,
          detail: { conceptId: this._selectedId },
        })
      );
      this._close();
    }
  }

  /**
   * Close the modal
   */
  private _close() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Toggle explanation expansion
   */
  private _toggleExplanation(conceptId: string) {
    const newSet = new Set(this._expandedExplanations);
    if (newSet.has(conceptId)) {
      newSet.delete(conceptId);
    } else {
      newSet.add(conceptId);
    }
    this._expandedExplanations = newSet;
  }

  /**
   * Handle modal open
   */
  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open') && this.open) {
      // Reset state when opening
      this._focusedIndex = 0;
      this._selectedId = null;
      this._searchQuery = '';
      this._expandedExplanations = new Set();

      // Focus search input
      requestAnimationFrame(() => {
        this._searchInput?.focus();
      });
    }
  }

  /**
   * Render concept option
   */
  private _renderConceptOption(match: ConceptMatch, index: number) {
    const isFocused = this._focusedIndex === index;
    const isSelected = this._selectedId === match.id;
    const similarityLevel = this._getSimilarityLevel(match.similarity);
    const explanation = this.explanations[match.id];
    const isExpanded = this._expandedExplanations.has(match.id);

    const optionClasses = {
      'concept-option': true,
      focused: isFocused,
      selected: isSelected,
    };

    return html`
      <label
        class=${classMap(optionClasses)}
        @click=${() => {
          this._focusedIndex = index;
          this._handleSelect(match.id);
        }}
      >
        <input
          type="radio"
          name="concept-selection"
          .value=${match.id}
          .checked=${isSelected}
          @change=${() => this._handleSelect(match.id)}
        />
        <div class="concept-content">
          <div class="concept-header">
            <span class="concept-term">${match.term}</span>
            <span class="similarity-badge similarity-${similarityLevel}">
              ${Math.round(match.similarity)}%
            </span>
          </div>
          <div class="concept-details">
            <span class="concept-id">${match.id}</span>
            <span class="concept-fsn">${match.fsn}</span>
            <span class="semantic-tag">${match.semanticTag}</span>
          </div>
          ${explanation
            ? html`
                <button
                  class="explanation-toggle"
                  type="button"
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    this._toggleExplanation(match.id);
                  }}
                >
                  Why this match? ${isExpanded ? '▲' : '▼'}
                </button>
                ${isExpanded
                  ? html`
                      <div class="explanation-content">
                        ${explanation.explanation}
                        ${explanation.differentiatingFactors?.length
                          ? html`
                              <ul class="differentiating-factors">
                                ${explanation.differentiatingFactors.map(
                                  (factor) => html`<li>${factor}</li>`
                                )}
                              </ul>
                            `
                          : nothing}
                      </div>
                    `
                  : nothing}
              `
            : nothing}
        </div>
      </label>
    `;
  }

  /**
   * Render skip option
   */
  private _renderSkipOption(index: number) {
    const isFocused = this._focusedIndex === index;

    const optionClasses = {
      'skip-option': true,
      focused: isFocused,
    };

    return html`
      <label
        class=${classMap(optionClasses)}
        @click=${() => {
          this._focusedIndex = index;
        }}
      >
        <input
          type="radio"
          name="concept-selection"
          value="skip"
          @change=${this._handleSkip}
        />
        <span class="skip-text">No good match - skip this term</span>
      </label>
    `;
  }

  render() {
    const options = this._getAllOptions();
    const skipIndex = options.length - 1;

    return html`
      <tx-modal
        ?open=${this.open}
        size="md"
        @close=${this._close}
      >
        <span slot="header">
          Select SNOMED CT Concept for "${this.term?.text || 'term'}"
        </span>

        <div @keydown=${this._handleKeyDown}>
          <!-- Search Section -->
          <div class="search-section">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input
                class="search-input"
                type="text"
                placeholder="Search for alternative concepts..."
                .value=${this._searchQuery}
                @input=${this._handleSearchInput}
                aria-label="Search for concepts"
              />
            </div>
          </div>

          <!-- Loading Indicator -->
          ${this.loading
            ? html`
                <div class="loading-indicator">
                  <div class="spinner"></div>
                  Searching...
                </div>
              `
            : nothing}

          <!-- Suggested Matches -->
          ${this.conceptMatches.length > 0
            ? html`
                <div class="section-label">Suggested matches:</div>
                <fieldset>
                  <legend class="visually-hidden">
                    Select a concept for "${this.term?.text || 'term'}"
                  </legend>
                  <div class="concept-list" role="radiogroup">
                    ${this.conceptMatches.map((match, i) =>
                      this._renderConceptOption(match, i)
                    )}
                  </div>
                </fieldset>
              `
            : html`
                <div class="empty-state">
                  No suggested matches. Try searching above.
                </div>
              `}

          <!-- Search Results -->
          ${this.searchResults.length > 0
            ? html`
                <div class="search-results-section">
                  <div class="section-label">Search results:</div>
                  <div class="concept-list">
                    ${this.searchResults
                      .filter((r) => !this.conceptMatches.some((m) => m.id === r.id))
                      .map((match, i) =>
                        this._renderConceptOption(match, this.conceptMatches.length + i)
                      )}
                  </div>
                </div>
              `
            : nothing}

          <div class="divider"></div>

          <!-- Skip Option -->
          ${this._renderSkipOption(skipIndex)}

          <!-- Keyboard Hints -->
          <div class="keyboard-hint">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select</span>
            <span><kbd>/</kbd> Search</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
        </div>

        <div slot="footer" class="modal-footer">
          <tx-button variant="secondary" @click=${this._close}>
            Cancel
          </tx-button>
          <tx-button
            variant="primary"
            ?disabled=${!this._selectedId}
            @click=${this._confirmSelection}
          >
            Select
          </tx-button>
        </div>
      </tx-modal>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-concept-selector': TxConceptSelector;
  }
}
