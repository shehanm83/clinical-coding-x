/**
 * tx-ccx-question-card - CCX Question Card Component
 *
 * Displays a single question in the CCX drilling workflow with support for:
 * - SPECIFICITY questions (drilling deeper into hierarchy)
 * - Pre-selected options from text modifiers
 * - Various question types (specificity, severity, laterality, temporal, attribute)
 *
 * @fires answer - Fired when an answer is submitted
 * @fires skip - Fired when question is skipped
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type {
  CcxQuestion,
  CcxQuestionOption,
} from '../../../state/contexts/session-context.js';

import '../../core/tx-button.js';

/**
 * Answer event detail
 */
export interface CcxQuestionAnswer {
  questionId: string;
  selectedOptionIds: string[];
  skipped: boolean;
}

@customElement('tx-ccx-question-card')
export class TxCcxQuestionCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CARD CONTAINER ===== */

    .question-card {
      padding: var(--space-5, 20px);
      background: var(--color-surface, #ffffff);
      border: 2px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      transition: all var(--duration-fast, 150ms) ease;
    }

    .question-card.specificity {
      border-color: var(--color-primary, #2563eb);
      border-style: dashed;
    }

    .question-card.answered {
      border-color: var(--color-success, #16a34a);
      background: var(--color-success-light, #dcfce7);
    }

    /* ===== HEADER ===== */

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      margin-bottom: var(--space-4, 16px);
    }

    .header-left {
      flex: 1;
    }

    .question-type-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
      margin-bottom: var(--space-2, 8px);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .question-type-badge.specificity {
      background: var(--color-primary-light, #dbeafe);
      color: var(--color-primary, #2563eb);
    }

    .question-type-badge.severity {
      background: rgba(220, 38, 38, 0.1);
      color: #dc2626;
    }

    .question-type-badge.laterality {
      background: rgba(22, 163, 74, 0.1);
      color: #16a34a;
    }

    .question-type-badge.temporal {
      background: rgba(202, 138, 4, 0.1);
      color: #ca8a04;
    }

    .question-type-badge.attribute {
      background: var(--color-background, #f3f4f6);
      color: var(--color-text-secondary, #4b5563);
    }

    .question-type-badge svg {
      width: 14px;
      height: 14px;
    }

    .question-text {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
      line-height: 1.4;
    }

    .source-concept {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-top: var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
    }

    .source-concept-term {
      color: var(--color-text-secondary, #4b5563);
      font-weight: var(--font-weight-medium, 500);
    }

    /* ===== DRILLING INDICATOR ===== */

    .drilling-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-primary-light, #dbeafe);
      color: var(--color-primary, #2563eb);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
      margin-bottom: var(--space-4, 16px);
    }

    .drilling-indicator svg {
      width: 18px;
      height: 18px;
    }

    /* ===== OPTIONS ===== */

    .options-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-4, 16px);
    }

    .option-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-background, #f9fafb);
      border: 2px solid transparent;
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .option-item:hover {
      background: var(--color-background-hover, #f3f4f6);
      border-color: var(--color-border, #e5e7eb);
    }

    .option-item.selected {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #dbeafe);
    }

    .option-item.pre-selected {
      border-color: var(--color-success, #16a34a);
      background: var(--color-success-light, #dcfce7);
    }

    .option-item input[type="radio"],
    .option-item input[type="checkbox"] {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      margin-top: 2px;
      accent-color: var(--color-primary, #2563eb);
    }

    .option-content {
      flex: 1;
    }

    .option-label {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      margin-bottom: var(--space-1, 4px);
    }

    .option-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #9ca3af);
    }

    .option-concept-id {
      font-family: var(--font-mono, monospace);
    }

    .semantic-tag {
      padding: var(--space-1, 4px) var(--space-1, 4px);
      border-radius: var(--radius-xs, 2px);
      background: var(--color-background, #f3f4f6);
      text-transform: capitalize;
    }

    .pre-selected-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success, #16a34a);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
    }

    .pre-selected-badge svg {
      width: 12px;
      height: 12px;
    }

    /* ===== ACTIONS ===== */

    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-3, 12px);
      padding-top: var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .skip-btn {
      color: var(--color-text-muted, #9ca3af);
    }

    .action-buttons {
      display: flex;
      gap: var(--space-2, 8px);
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
   * The question data
   */
  @property({ type: Object })
  question?: CcxQuestion;

  /**
   * Current selected option IDs
   */
  @state()
  private _selectedIds: string[] = [];

  /**
   * Track the last question ID to detect changes
   */
  private _lastQuestionId: string | null = null;

  /**
   * Reset internal state when question changes
   */
  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('question')) {
      const newQuestionId = this.question?.id ?? null;
      if (newQuestionId !== this._lastQuestionId) {
        // Question changed - pre-select options if applicable
        this._lastQuestionId = newQuestionId;
        this._initializeSelection();
      }
    }
  }

  /**
   * Initialize selection with pre-selected options
   */
  private _initializeSelection(): void {
    if (!this.question) {
      this._selectedIds = [];
      return;
    }

    // Find pre-selected options
    const preSelected = this.question.options
      .filter((opt) => opt.preSelected)
      .map((opt) => opt.conceptId);

    this._selectedIds = preSelected;
  }

  /**
   * Handle option selection
   */
  private _handleOptionSelect(conceptId: string, checked: boolean): void {
    if (this.question?.multiSelect) {
      // Multi-select: toggle in array
      if (checked) {
        if (!this._selectedIds.includes(conceptId)) {
          this._selectedIds = [...this._selectedIds, conceptId];
        }
      } else {
        this._selectedIds = this._selectedIds.filter((id) => id !== conceptId);
      }
    } else {
      // Single-select: replace
      this._selectedIds = [conceptId];
    }
    this.requestUpdate();
  }

  /**
   * Check if submit should be enabled
   */
  private _canSubmit(): boolean {
    return this._selectedIds.length > 0;
  }

  /**
   * Submit the answer
   */
  private _submitAnswer(): void {
    if (!this.question || !this._canSubmit()) return;

    const answer: CcxQuestionAnswer = {
      questionId: this.question.id,
      selectedOptionIds: [...this._selectedIds],
      skipped: false,
    };

    this.dispatchEvent(
      new CustomEvent('answer', {
        bubbles: true,
        composed: true,
        detail: answer,
      })
    );
  }

  /**
   * Skip the question
   */
  private _handleSkip(): void {
    if (!this.question) return;

    const answer: CcxQuestionAnswer = {
      questionId: this.question.id,
      selectedOptionIds: [],
      skipped: true,
    };

    this.dispatchEvent(
      new CustomEvent('skip', {
        bubbles: true,
        composed: true,
        detail: answer,
      })
    );
  }

  /**
   * Get icon for question type
   */
  private _getTypeIcon(type: string) {
    const icons: Record<string, unknown> = {
      specificity: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3v18m0 0-4-4m4 4 4-4" />
      </svg>`,
      severity: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>`,
      laterality: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
      </svg>`,
      temporal: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>`,
      attribute: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>`,
    };
    return icons[type] || icons.attribute;
  }

  /**
   * Render the drilling indicator for specificity questions
   */
  private _renderDrillingIndicator() {
    if (this.question?.questionType !== 'specificity') return nothing;

    return html`
      <div class="drilling-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v18m0 0-4-4m4 4 4-4" />
        </svg>
        <span>Selecting an option will <strong>drill deeper</strong> into the SNOMED hierarchy</span>
      </div>
    `;
  }

  /**
   * Render a single option
   */
  private _renderOption(option: CcxQuestionOption) {
    const isSelected = this._selectedIds.includes(option.conceptId);
    const inputType = this.question?.multiSelect ? 'checkbox' : 'radio';

    const optionClasses = {
      'option-item': true,
      selected: isSelected,
      'pre-selected': option.preSelected && !isSelected,
    };

    return html`
      <label class=${classMap(optionClasses)}>
        <input
          type=${inputType}
          name="question-${this.question?.id}"
          .value=${option.conceptId}
          .checked=${isSelected}
          @change=${(e: Event) =>
            this._handleOptionSelect(
              option.conceptId,
              (e.target as HTMLInputElement).checked
            )}
        />
        <div class="option-content">
          <div class="option-label">${option.displayText}</div>
          <div class="option-meta">
            <span class="option-concept-id">${option.conceptId}</span>
            ${option.semanticTag
              ? html`<span class="semantic-tag">${option.semanticTag}</span>`
              : nothing}
            ${option.preSelected
              ? html`
                  <span class="pre-selected-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    From text: ${option.preSelectionSource}
                  </span>
                `
              : nothing}
          </div>
        </div>
      </label>
    `;
  }

  render() {
    if (!this.question) return nothing;

    const cardClasses = {
      'question-card': true,
      specificity: this.question.questionType === 'specificity',
    };

    return html`
      <div class=${classMap(cardClasses)}>
        <!-- Header -->
        <div class="card-header">
          <div class="header-left">
            <span class="question-type-badge ${this.question.questionType}">
              ${this._getTypeIcon(this.question.questionType)}
              ${this.question.questionType}
            </span>
            <div class="question-text">${this.question.text}</div>
            <div class="source-concept">
              <span>For:</span>
              <span class="source-concept-term">${this.question.sourceConceptTerm}</span>
              ${this.question.attributeName
                ? html`<span>→ ${this.question.attributeName}</span>`
                : nothing}
            </div>
          </div>
        </div>

        <!-- Drilling indicator for specificity questions -->
        ${this._renderDrillingIndicator()}

        <!-- Options -->
        <fieldset>
          <legend class="visually-hidden">${this.question.text}</legend>
          <div class="options-container">
            ${this.question.options.map((opt) => this._renderOption(opt))}
          </div>
        </fieldset>

        <!-- Actions -->
        <div class="actions">
          ${this.question.skipOption
            ? html`
                <tx-button
                  variant="ghost"
                  class="skip-btn"
                  @click=${this._handleSkip}
                >
                  Skip this question
                </tx-button>
              `
            : html`<span></span>`}
          <div class="action-buttons">
            <tx-button
              variant="primary"
              ?disabled=${!this._canSubmit()}
              @click=${this._submitAnswer}
            >
              ${this.question.questionType === 'specificity'
                ? 'Select & Continue'
                : 'Submit Answer'}
            </tx-button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-ccx-question-card': TxCcxQuestionCard;
  }
}
