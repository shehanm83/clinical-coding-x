/**
 * tx-traversal-question - Tree Traversal Question Component
 *
 * Displays questions for navigating the SNOMED hierarchy tree:
 * 1. Disambiguation questions - Choose between child concepts
 * 2. Attribute questions - Select attribute values (Severity, Laterality, etc.)
 *
 * Features:
 * - [SKIP] button - Accept current concept, don't specify further
 * - [BACK] button - Go to previous question
 * - Single-select options from SNOMED (zero hallucination)
 * - Progress indicator showing traversal depth
 *
 * @fires option-select - Fired when an option is selected
 * @fires skip - Fired when [SKIP] is clicked
 * @fires back - Fired when [BACK] is clicked
 *
 * @example
 * ```html
 * <tx-traversal-question
 *   .question=${currentQuestion}
 *   .canGoBack=${navigationStack.length > 0}
 *   .depth=${traversalDepth}
 *   @option-select=${this.handleSelect}
 *   @skip=${this.handleSkip}
 *   @back=${this.handleBack}
 * ></tx-traversal-question>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * Question types
 */
export type QuestionType = 'disambiguation' | 'attribute';

/**
 * Option for selection
 */
export interface QuestionOption {
  conceptId: string;
  label: string;
  description?: string;
  fsn?: string;
}

/**
 * Question data structure
 */
export interface TraversalQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  targetConcept?: {
    id: string;
    term: string;
  };
  attribute?: {
    id: string;
    name: string;
  };
}

/**
 * Selection event detail
 */
export interface OptionSelectDetail {
  questionId: string;
  questionType: QuestionType;
  selectedConceptId: string;
  selectedLabel: string;
  attributeId?: string;
}

@customElement('tx-traversal-question')
export class TxTraversalQuestion extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CONTAINER ===== */

    .question-container {
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }

    /* ===== HEADER ===== */

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-4, 16px);
      background: var(--color-primary-light, #eff6ff);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .header-content {
      flex: 1;
    }

    .question-type-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: 2px 8px;
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-full, 9999px);
      margin-bottom: var(--space-2, 8px);
    }

    .question-type-badge.disambiguation {
      background: var(--color-info-light, #dbeafe);
      color: var(--color-info-dark, #1e40af);
    }

    .question-type-badge.attribute {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success-dark, #166534);
    }

    .badge-icon {
      width: 12px;
      height: 12px;
    }

    .question-text {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
      line-height: 1.4;
    }

    .target-concept {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-top: var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .target-label {
      color: var(--color-text-muted, #6b7280);
    }

    .target-value {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-primary, #2563eb);
    }

    /* Depth indicator */
    .depth-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-2, 8px);
      background: var(--color-surface, #ffffff);
      border-radius: var(--radius-md, 8px);
      min-width: 60px;
    }

    .depth-value {
      font-size: var(--text-xl, 20px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-primary, #2563eb);
    }

    .depth-label {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #6b7280);
    }

    /* ===== OPTIONS ===== */

    .options-container {
      padding: var(--space-4, 16px);
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    .option-item {
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

    .option-item:hover {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #eff6ff);
    }

    .option-item.selected {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #eff6ff);
    }

    .option-item:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: 2px;
    }

    /* Radio indicator */
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

    .option-item:hover .radio-indicator {
      border-color: var(--color-primary, #2563eb);
    }

    .option-item.selected .radio-indicator {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary, #2563eb);
    }

    .radio-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: var(--radius-full, 9999px);
      opacity: 0;
      transition: opacity var(--duration-fast, 150ms) ease;
    }

    .option-item.selected .radio-dot {
      opacity: 1;
    }

    /* Option content */
    .option-content {
      flex: 1;
      min-width: 0;
    }

    .option-label {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    .option-description {
      margin-top: var(--space-1, 4px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .option-id {
      margin-top: var(--space-1, 4px);
      font-size: var(--text-xs, 12px);
      font-family: var(--font-mono, monospace);
      color: var(--color-text-muted, #6b7280);
    }

    /* ===== ACTIONS ===== */

    .actions-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-background, #f9fafb);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .action-group {
      display: flex;
      gap: var(--space-2, 8px);
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-4, 16px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
      border: none;
    }

    .action-btn:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: 2px;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.back {
      background: var(--color-surface, #ffffff);
      color: var(--color-text-secondary, #4b5563);
      border: 1px solid var(--color-border, #e5e7eb);
    }

    .action-btn.back:hover:not(:disabled) {
      background: var(--color-background, #f3f4f6);
      border-color: var(--color-border-strong, #d1d5db);
    }

    .action-btn.skip {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
    }

    .action-btn.skip:hover:not(:disabled) {
      background: var(--color-warning, #f59e0b);
      color: white;
    }

    .action-btn.confirm {
      background: var(--color-primary, #2563eb);
      color: white;
    }

    .action-btn.confirm:hover:not(:disabled) {
      background: var(--color-primary-dark, #1d4ed8);
    }

    .action-icon {
      width: 16px;
      height: 16px;
    }

    /* ===== HINT ===== */

    .hint-section {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-info-light, #dbeafe);
      border-top: 1px solid var(--color-info, #3b82f6);
    }

    .hint-content {
      display: flex;
      gap: var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--color-info-dark, #1e40af);
    }

    .hint-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 2px;
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
   * The question to display
   */
  @property({ type: Object })
  question: TraversalQuestion | null = null;

  /**
   * Whether user can go back
   */
  @property({ type: Boolean })
  canGoBack = false;

  /**
   * Current traversal depth
   */
  @property({ type: Number })
  depth = 0;

  /**
   * Whether confirm button is loading
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * Currently selected option ID
   */
  @state()
  private _selectedId: string | null = null;

  /**
   * Handle option selection
   */
  private _handleOptionSelect(option: QuestionOption) {
    this._selectedId = option.conceptId;
  }

  /**
   * Handle confirm button click
   */
  private _handleConfirm() {
    if (!this.question || !this._selectedId) return;

    const selectedOption = this.question.options.find(
      (o) => o.conceptId === this._selectedId
    );
    if (!selectedOption) return;

    const detail: OptionSelectDetail = {
      questionId: this.question.id,
      questionType: this.question.type,
      selectedConceptId: this._selectedId,
      selectedLabel: selectedOption.label,
      attributeId: this.question.attribute?.id,
    };

    this.dispatchEvent(
      new CustomEvent('option-select', {
        detail,
        bubbles: true,
        composed: true,
      })
    );

    // Reset selection after dispatch
    this._selectedId = null;
  }

  /**
   * Handle skip button click
   */
  private _handleSkip() {
    if (!this.question) return;

    this.dispatchEvent(
      new CustomEvent('skip', {
        detail: {
          questionId: this.question.id,
          questionType: this.question.type,
          attributeId: this.question.attribute?.id,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle back button click
   */
  private _handleBack() {
    this.dispatchEvent(
      new CustomEvent('back', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Render type badge icon
   */
  private _renderTypeBadgeIcon() {
    if (this.question?.type === 'disambiguation') {
      return html`
        <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      `;
    }
    return html`
      <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" stroke-linecap="round" stroke-linejoin="round"></path>
        <circle cx="12" cy="12" r="4"></circle>
      </svg>
    `;
  }

  /**
   * Render back icon
   */
  private _renderBackIcon() {
    return html`
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  /**
   * Render skip icon
   */
  private _renderSkipIcon() {
    return html`
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 4l10 8-10 8V4zM19 5v14" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  /**
   * Render confirm icon
   */
  private _renderConfirmIcon() {
    return html`
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"></polyline>
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
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  /**
   * Render option item
   */
  private _renderOption(option: QuestionOption) {
    const isSelected = this._selectedId === option.conceptId;
    const itemClasses = {
      'option-item': true,
      selected: isSelected,
    };

    return html`
      <div
        class=${classMap(itemClasses)}
        role="radio"
        aria-checked=${isSelected}
        tabindex="0"
        @click=${() => this._handleOptionSelect(option)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleOptionSelect(option);
          }
        }}
      >
        <div class="radio-indicator">
          <div class="radio-dot"></div>
        </div>
        <div class="option-content">
          <div class="option-label">${option.label}</div>
          ${option.description
            ? html`<div class="option-description">${option.description}</div>`
            : nothing}
          <div class="option-id">${option.conceptId}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render question header
   */
  private _renderHeader() {
    if (!this.question) return nothing;

    const badgeClasses = {
      'question-type-badge': true,
      disambiguation: this.question.type === 'disambiguation',
      attribute: this.question.type === 'attribute',
    };

    const typeLabel =
      this.question.type === 'disambiguation'
        ? 'Select specific type'
        : `Select ${this.question.attribute?.name || 'value'}`;

    return html`
      <div class="question-header">
        <div class="header-content">
          <div class=${classMap(badgeClasses)}>
            ${this._renderTypeBadgeIcon()}
            ${typeLabel}
          </div>
          <div class="question-text">${this.question.text}</div>
          ${this.question.targetConcept
            ? html`
                <div class="target-concept">
                  <span class="target-label">For:</span>
                  <span class="target-value">${this.question.targetConcept.term}</span>
                </div>
              `
            : nothing}
        </div>
        <div class="depth-indicator">
          <div class="depth-value">${this.depth}</div>
          <div class="depth-label">Depth</div>
        </div>
      </div>
    `;
  }

  /**
   * Render actions
   */
  private _renderActions() {
    const canConfirm = this._selectedId !== null && !this.loading;

    return html`
      <div class="actions-container">
        <div class="action-group">
          <button
            class="action-btn back"
            ?disabled=${!this.canGoBack || this.loading}
            @click=${this._handleBack}
            aria-label="Go back to previous question"
          >
            ${this._renderBackIcon()}
            Back
          </button>
        </div>
        <div class="action-group">
          <button
            class="action-btn skip"
            ?disabled=${this.loading}
            @click=${this._handleSkip}
            aria-label="Skip this question and accept current selection"
          >
            ${this._renderSkipIcon()}
            Skip
          </button>
          <button
            class="action-btn confirm"
            ?disabled=${!canConfirm}
            @click=${this._handleConfirm}
            aria-label="Confirm selection"
          >
            ${this._renderConfirmIcon()}
            ${this.loading ? 'Loading...' : 'Confirm'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render hint section
   */
  private _renderHint() {
    const hintText =
      this.question?.type === 'disambiguation'
        ? 'Select a more specific concept to refine your coding, or click Skip to accept the current level.'
        : 'Select the appropriate value for this attribute, or click Skip if not applicable.';

    return html`
      <div class="hint-section">
        <div class="hint-content">
          ${this._renderHintIcon()}
          <span>${hintText}</span>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.question) {
      return nothing;
    }

    return html`
      <div class="question-container">
        ${this._renderHeader()}

        <div class="options-container">
          <div class="options-list" role="radiogroup" aria-label="${this.question.text}">
            ${this.question.options.map((o) => this._renderOption(o))}
          </div>
        </div>

        ${this._renderHint()}
        ${this._renderActions()}
      </div>

      <span class="visually-hidden" aria-live="polite">
        Question: ${this.question.text}.
        ${this.question.options.length} options available.
        ${this._selectedId ? 'Option selected.' : 'No option selected.'}
      </span>
    `;
  }
}

// TypeScript declaration
declare global {
  interface HTMLElementTagNameMap {
    'tx-traversal-question': TxTraversalQuestion;
  }
}
