/**
 * tx-question-card - Question Card Component
 *
 * Displays a single clarifying question with various input types
 * (single select, multiple select, free text, boolean).
 *
 * @fires answer - Fired when an answer is submitted
 * @fires skip - Fired when question is skipped
 *
 * @example
 * ```html
 * <tx-question-card
 *   .question=${question}
 *   @answer=${this.handleAnswer}
 *   @skip=${this.handleSkip}
 * ></tx-question-card>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// Import core components
import '../../core/tx-input.js';
import '../../core/tx-textarea.js';
import '../../core/tx-button.js';

/**
 * Question option interface
 */
export interface QuestionOption {
  label: string;
  value: string;
  conceptId?: string;
}

/**
 * Question interface
 */
export interface Question {
  id: string;
  text: string;
  attributeId: string;
  attributeName: string;
  inputType: 'single_select' | 'multiple_select' | 'free_text' | 'boolean';
  options: QuestionOption[];
  required: boolean;
  relatedTermIndex: number;
  hint?: string;
  relatedTermText?: string;
  relatedTermId?: string;
}

/**
 * Question answer interface
 */
export interface QuestionAnswer {
  questionId: string;
  value: string | string[];
  conceptId?: string;
}

@customElement('tx-question-card')
export class TxQuestionCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CARD CONTAINER ===== */

    .question-card {
      padding: var(--space-4, 16px);
      background: var(--color-surface, #ffffff);
      border: 2px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      transition: all var(--duration-fast, 150ms) ease;
    }

    .question-card.answered {
      border-color: var(--color-success, #16a34a);
      background: var(--color-success-light, #dcfce7);
    }

    .question-card.skipped {
      border-color: var(--color-text-muted, #9ca3af);
      opacity: 0.7;
    }

    /* ===== HEADER ===== */

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      margin-bottom: var(--space-3, 12px);
    }

    .question-text {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      line-height: 1.4;
    }

    .required-badge {
      flex-shrink: 0;
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      background: var(--color-error-light, #fef2f2);
      color: var(--color-error, #dc2626);
      border-radius: var(--radius-sm, 4px);
    }

    /* ===== RELATED TERM ===== */

    .related-term {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .related-term-label {
      color: var(--color-text-muted, #9ca3af);
    }

    .term-badge {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      background: var(--color-primary-light, #dbeafe);
      color: var(--color-primary, #2563eb);
      border-radius: var(--radius-sm, 4px);
      font-weight: var(--font-weight-medium, 500);
    }

    .attribute-badge {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      background: var(--color-background, #f3f4f6);
      color: var(--color-text-secondary, #4b5563);
      border-radius: var(--radius-sm, 4px);
    }

    /* ===== DIVIDER ===== */

    .divider {
      height: 1px;
      background: var(--color-border, #e5e7eb);
      margin: var(--space-3, 12px) 0;
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
      align-items: center;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border: 2px solid transparent;
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .option-item:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .option-item.selected {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #dbeafe);
    }

    .option-item input[type="radio"],
    .option-item input[type="checkbox"] {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      accent-color: var(--color-primary, #2563eb);
    }

    .option-label {
      font-size: var(--text-base, 16px);
      color: var(--color-text-primary, #111827);
    }

    /* ===== BOOLEAN BUTTONS ===== */

    .boolean-buttons {
      display: flex;
      gap: var(--space-3, 12px);
    }

    .boolean-btn {
      flex: 1;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      background: var(--color-background, #f9fafb);
      border: 2px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .boolean-btn:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .boolean-btn.selected {
      border-color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #dbeafe);
      color: var(--color-primary, #2563eb);
    }

    .boolean-btn.yes.selected {
      border-color: var(--color-success, #16a34a);
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success, #16a34a);
    }

    .boolean-btn.no.selected {
      border-color: var(--color-error, #dc2626);
      background: var(--color-error-light, #fef2f2);
      color: var(--color-error, #dc2626);
    }

    /* ===== TEXT INPUT ===== */

    .text-input-container {
      margin-bottom: var(--space-4, 16px);
    }

    /* ===== HINT ===== */

    .hint {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
      font-style: italic;
      margin-bottom: var(--space-4, 16px);
    }

    .hint-icon {
      flex-shrink: 0;
    }

    /* ===== ACTIONS ===== */

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
    }

    /* ===== ANSWERED STATE ===== */

    .answered-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3, 12px);
    }

    .answer-info {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .answer-check {
      color: var(--color-success, #16a34a);
      font-size: var(--text-lg, 18px);
    }

    .answer-question {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      margin-bottom: var(--space-1, 4px);
    }

    .answer-label {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .answer-value {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    .concept-id {
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-normal, 400);
      color: var(--color-text-muted, #9ca3af);
      margin-left: var(--space-1, 4px);
    }

    .edit-link {
      font-size: var(--text-sm, 14px);
      color: var(--color-primary, #2563eb);
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: underline;
    }

    .edit-link:hover {
      color: var(--color-primary-dark, #1d4ed8);
    }

    /* ===== SKIPPED STATE ===== */

    .skipped-label {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
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
   * The question data
   */
  @property({ type: Object })
  question?: Question;

  /**
   * Whether the question has been answered
   */
  @property({ type: Boolean })
  answered = false;

  /**
   * The submitted answer (for answered state display)
   */
  @property({ type: Object })
  submittedAnswer?: QuestionAnswer;

  /**
   * Whether the question was skipped
   */
  @property({ type: Boolean })
  skipped = false;

  /**
   * Current selected value(s)
   */
  @state()
  private _selectedValue: string | string[] | null = null;

  /**
   * Text input value
   */
  @state()
  private _textValue = '';

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
        // Question changed - reset all internal state
        this._selectedValue = null;
        this._textValue = '';
        this._lastQuestionId = newQuestionId;
      }
    }
  }

  /**
   * Handle single select change
   */
  private _handleSingleSelect(value: string, _conceptId?: string) {
    this._selectedValue = value;
  }

  /**
   * Handle multiple select change
   */
  private _handleMultipleSelect(value: string, checked: boolean) {
    const currentValues = Array.isArray(this._selectedValue)
      ? [...this._selectedValue]
      : [];

    if (checked) {
      if (!currentValues.includes(value)) {
        currentValues.push(value);
      }
    } else {
      const index = currentValues.indexOf(value);
      if (index > -1) {
        currentValues.splice(index, 1);
      }
    }

    this._selectedValue = currentValues;
  }

  /**
   * Handle boolean selection
   */
  private _handleBooleanSelect(value: 'yes' | 'no') {
    this._selectedValue = value;
    // Auto-submit for boolean
    this._submitAnswer();
  }

  /**
   * Handle text input
   */
  private _handleTextInput(e: CustomEvent) {
    this._textValue = e.detail?.value ?? '';
  }

  /**
   * Check if submit should be enabled
   */
  private _canSubmit(): boolean {
    if (!this.question) return false;

    switch (this.question.inputType) {
      case 'single_select':
        return this._selectedValue !== null;
      case 'multiple_select':
        return Array.isArray(this._selectedValue) && this._selectedValue.length > 0;
      case 'free_text':
        return (this._textValue ?? '').trim().length > 0;
      case 'boolean':
        return this._selectedValue !== null;
      default:
        return false;
    }
  }

  /**
   * Submit the answer
   */
  private _submitAnswer() {
    if (!this.question || !this._canSubmit()) return;

    // Capture question ID before any state changes
    const questionId = this.question.id;

    let value: string | string[];
    let conceptId: string | undefined;

    switch (this.question.inputType) {
      case 'single_select': {
        value = this._selectedValue as string;
        const selectedOption = this.question.options.find((o) => o.value === value);
        conceptId = selectedOption?.conceptId;
        break;
      }
      case 'multiple_select':
        value = this._selectedValue as string[];
        break;
      case 'free_text':
        value = (this._textValue ?? '').trim();
        break;
      case 'boolean':
        value = this._selectedValue as string;
        break;
      default:
        return;
    }

    // Clear state immediately to prevent double-submission
    this._selectedValue = null;
    this._textValue = '';

    const answer: QuestionAnswer = {
      questionId,
      value,
      conceptId,
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
  private _handleSkip() {
    if (!this.question) return;

    this.dispatchEvent(
      new CustomEvent('skip', {
        bubbles: true,
        composed: true,
        detail: { questionId: this.question.id },
      })
    );
  }

  /**
   * Edit answer (reset state)
   */
  private _handleEdit() {
    this._selectedValue = null;
    this._textValue = '';

    this.dispatchEvent(
      new CustomEvent('edit', {
        bubbles: true,
        composed: true,
        detail: { questionId: this.question?.id },
      })
    );
  }

  /**
   * Render single select options
   */
  private _renderSingleSelect() {
    if (!this.question) return nothing;

    return html`
      <fieldset>
        <legend class="visually-hidden">${this.question.text}</legend>
        <div class="options-container" role="radiogroup">
          ${this.question.options.map((option) => {
            const isSelected = this._selectedValue === option.value;
            const optionClasses = {
              'option-item': true,
              selected: isSelected,
            };

            return html`
              <label class=${classMap(optionClasses)}>
                <input
                  type="radio"
                  name="question-${this.question?.id}"
                  .value=${option.value}
                  .checked=${isSelected}
                  @change=${() =>
                    this._handleSingleSelect(option.value, option.conceptId)}
                />
                <span class="option-label">${option.label}</span>
              </label>
            `;
          })}
        </div>
      </fieldset>
    `;
  }

  /**
   * Render multiple select options
   */
  private _renderMultipleSelect() {
    if (!this.question) return nothing;

    const selectedValues = Array.isArray(this._selectedValue)
      ? this._selectedValue
      : [];

    return html`
      <fieldset>
        <legend class="visually-hidden">${this.question.text}</legend>
        <div class="options-container">
          ${this.question.options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const optionClasses = {
              'option-item': true,
              selected: isSelected,
            };

            return html`
              <label class=${classMap(optionClasses)}>
                <input
                  type="checkbox"
                  .value=${option.value}
                  .checked=${isSelected}
                  @change=${(e: Event) =>
                    this._handleMultipleSelect(
                      option.value,
                      (e.target as HTMLInputElement).checked
                    )}
                />
                <span class="option-label">${option.label}</span>
              </label>
            `;
          })}
        </div>
      </fieldset>
    `;
  }

  /**
   * Render free text input
   */
  private _renderFreeText() {
    return html`
      <div class="text-input-container">
        <tx-textarea
          placeholder="Enter your answer..."
          .value=${this._textValue}
          @input=${this._handleTextInput}
        ></tx-textarea>
      </div>
    `;
  }

  /**
   * Render boolean buttons
   */
  private _renderBoolean() {
    const yesClasses = {
      'boolean-btn': true,
      yes: true,
      selected: this._selectedValue === 'yes',
    };

    const noClasses = {
      'boolean-btn': true,
      no: true,
      selected: this._selectedValue === 'no',
    };

    return html`
      <div class="boolean-buttons">
        <button
          class=${classMap(yesClasses)}
          type="button"
          @click=${() => this._handleBooleanSelect('yes')}
        >
          Yes
        </button>
        <button
          class=${classMap(noClasses)}
          type="button"
          @click=${() => this._handleBooleanSelect('no')}
        >
          No
        </button>
      </div>
    `;
  }

  /**
   * Render input based on type
   */
  private _renderInput() {
    if (!this.question) return nothing;

    switch (this.question.inputType) {
      case 'single_select':
        return this._renderSingleSelect();
      case 'multiple_select':
        return this._renderMultipleSelect();
      case 'free_text':
        return this._renderFreeText();
      case 'boolean':
        return this._renderBoolean();
      default:
        return nothing;
    }
  }

  /**
   * Get display value for answered state
   */
  private _getAnswerDisplay(): string {
    if (!this.submittedAnswer) return '';

    const value = this.submittedAnswer.value;

    if (Array.isArray(value)) {
      // Find labels for multi-select
      const labels = value.map((v) => {
        const option = this.question?.options.find((o) => o.value === v);
        return option?.label || v;
      });
      return labels.join(', ');
    }

    // Find label for single select
    if (this.question?.inputType === 'single_select') {
      const option = this.question.options.find((o) => o.value === value);
      return option?.label || value;
    }

    // Boolean or free text
    if (value === 'yes') return 'Yes';
    if (value === 'no') return 'No';
    return value;
  }

  /**
   * Render answered state
   */
  private _renderAnsweredState() {
    const conceptId = this.submittedAnswer?.conceptId;
    return html`
      <div class="answered-summary">
        <div class="answer-info">
          <span class="answer-check">✓</span>
          <div>
            <div class="answer-question">${this.question?.text}</div>
            <div class="answer-label">${this.question?.attributeName}</div>
            <div class="answer-value">
              ${this._getAnswerDisplay()}
              ${conceptId
                ? html`<span class="concept-id">(${conceptId})</span>`
                : nothing}
            </div>
          </div>
        </div>
        <button class="edit-link" @click=${this._handleEdit}>Edit</button>
      </div>
    `;
  }

  /**
   * Render skipped state
   */
  private _renderSkippedState() {
    return html`
      <div class="answered-summary">
        <div class="answer-info">
          <div>
            <div class="answer-question">${this.question?.text}</div>
            <div class="answer-label">${this.question?.attributeName}</div>
            <div class="skipped-label">Skipped</div>
          </div>
        </div>
        <button class="edit-link" @click=${this._handleEdit}>Answer</button>
      </div>
    `;
  }

  render() {
    if (!this.question) return nothing;

    const cardClasses = {
      'question-card': true,
      answered: this.answered,
      skipped: this.skipped,
    };

    // Show collapsed state if answered or skipped
    if (this.answered) {
      return html`
        <div class=${classMap(cardClasses)}>${this._renderAnsweredState()}</div>
      `;
    }

    if (this.skipped) {
      return html`
        <div class=${classMap(cardClasses)}>${this._renderSkippedState()}</div>
      `;
    }

    return html`
      <div class=${classMap(cardClasses)}>
        <!-- Header -->
        <div class="card-header">
          <span class="question-text">${this.question.text}</span>
          ${this.question.required
            ? html`<span class="required-badge">Required</span>`
            : nothing}
        </div>

        <!-- Related Term -->
        ${this.question.relatedTermText
          ? html`
              <div class="related-term">
                <span class="related-term-label">Related to:</span>
                <span class="term-badge">
                  ${this.question.relatedTermText}
                  ${this.question.relatedTermId
                    ? html`(${this.question.relatedTermId})`
                    : nothing}
                </span>
                <span class="attribute-badge">${this.question.attributeName}</span>
              </div>
            `
          : nothing}

        <div class="divider"></div>

        <!-- Input -->
        ${this._renderInput()}

        <!-- Hint -->
        ${this.question.hint
          ? html`
              <div class="hint">
                <span class="hint-icon">💡</span>
                <span>${this.question.hint}</span>
              </div>
            `
          : nothing}

        <!-- Actions -->
        <div class="actions">
          ${!this.question.required
            ? html`
                <tx-button variant="secondary" @click=${this._handleSkip}>
                  Skip
                </tx-button>
              `
            : nothing}
          ${this.question.inputType !== 'boolean'
            ? html`
                <tx-button
                  variant="primary"
                  ?disabled=${!this._canSubmit()}
                  @click=${this._submitAnswer}
                >
                  Submit Answer
                </tx-button>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-question-card': TxQuestionCard;
  }
}
