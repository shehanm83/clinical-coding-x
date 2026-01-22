/**
 * tx-textarea - Textarea Component
 *
 * A textarea component with label, character counter, error state, and helper text support.
 *
 * @fires input - Fired when textarea value changes
 * @fires change - Fired when textarea loses focus after value change
 * @fires invalid - Fired when validation fails
 *
 * @example
 * ```html
 * <tx-textarea
 *   label="Clinical Notes"
 *   placeholder="Enter clinical notes..."
 *   .value=${notes}
 *   maxLength=${10000}
 *   helperText="Describe symptoms, findings, and diagnoses"
 *   @input=${handleInput}
 * ></tx-textarea>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

// Unique ID generator for accessibility
let textareaIdCounter = 0;
const generateId = () => `tx-textarea-${++textareaIdCounter}`;

@customElement('tx-textarea')
export class TxTextarea extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .textarea-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    /* ===== LABEL ===== */

    label {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    label .required {
      color: var(--color-error, #DC2626);
      margin-left: 2px;
    }

    /* ===== TEXTAREA ===== */

    .textarea-container {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    textarea {
      width: 100%;
      min-height: 120px;
      padding: var(--input-padding-y, 12px) var(--input-padding-x, 16px);
      font-family: inherit;
      font-size: var(--text-base, 16px);
      line-height: var(--line-height-normal, 1.5);
      color: var(--color-text-primary, #111827);
      background-color: var(--color-surface, #FFFFFF);
      border: var(--input-border-width, 2px) solid var(--color-border, #E5E7EB);
      border-radius: var(--radius-sm, 4px);
      outline: none;
      resize: vertical;
      transition: border-color var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
                  box-shadow var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    }

    textarea::placeholder {
      color: var(--color-text-muted, #9CA3AF);
    }

    /* Hover state */
    textarea:hover:not(:focus):not(:disabled):not(.error) {
      border-color: var(--color-text-secondary, #4B5563);
    }

    /* Focus state */
    textarea:focus {
      border-color: var(--color-primary, #2563EB);
      box-shadow: 0 0 0 3px var(--color-primary-light, #DBEAFE);
    }

    /* Error state */
    textarea.error {
      border-color: var(--color-error, #DC2626);
    }

    textarea.error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
    }

    /* Disabled state */
    textarea:disabled {
      background-color: var(--color-background, #F9FAFB);
      color: var(--color-text-muted, #9CA3AF);
      cursor: not-allowed;
      resize: none;
    }

    /* ===== CHARACTER COUNTER ===== */

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-2, 8px);
      margin-top: var(--space-1, 4px);
    }

    .footer-text {
      flex: 1;
    }

    .character-counter {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9CA3AF);
      white-space: nowrap;
    }

    .character-counter.warning {
      color: var(--color-warning, #CA8A04);
    }

    .character-counter.error {
      color: var(--color-error, #DC2626);
    }

    /* ===== HELPER/ERROR TEXT ===== */

    .helper-text,
    .error-text {
      font-size: var(--text-sm, 14px);
    }

    .helper-text {
      color: var(--color-text-secondary, #4B5563);
    }

    .error-text {
      color: var(--color-error, #DC2626);
    }
  `;

  /**
   * Textarea value
   */
  @property({ type: String })
  value = '';

  /**
   * Placeholder text
   */
  @property({ type: String })
  placeholder = '';

  /**
   * Label text
   */
  @property({ type: String })
  label = '';

  /**
   * Disabled state
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Required field
   */
  @property({ type: Boolean })
  required = false;

  /**
   * Error state
   */
  @property({ type: Boolean })
  error = false;

  /**
   * Error message to display
   */
  @property({ type: String })
  errorMessage = '';

  /**
   * Helper text
   */
  @property({ type: String })
  helperText = '';

  /**
   * Textarea name attribute
   */
  @property({ type: String })
  name = '';

  /**
   * Maximum character length
   */
  @property({ type: Number })
  maxLength?: number;

  /**
   * Minimum character length
   */
  @property({ type: Number })
  minLength?: number;

  /**
   * Number of visible rows
   */
  @property({ type: Number })
  rows = 4;

  /**
   * Custom validity message
   */
  @property({ type: String })
  customValidity = '';

  @state()
  private _textareaId = generateId();

  @state()
  private _helperId = `${this._textareaId}-helper`;

  @state()
  private _errorId = `${this._textareaId}-error`;

  /**
   * Get reference to the native textarea element
   */
  get textareaElement(): HTMLTextAreaElement | null {
    return this.shadowRoot?.querySelector('textarea') ?? null;
  }

  /**
   * Get current character count
   */
  get characterCount(): number {
    return this.value.length;
  }

  /**
   * Validate the textarea
   */
  validate(): boolean {
    const textarea = this.textareaElement;
    if (!textarea) return true;

    // Set custom validity if provided
    if (this.customValidity) {
      textarea.setCustomValidity(this.customValidity);
    } else {
      textarea.setCustomValidity('');
    }

    const isValid = textarea.checkValidity();

    if (!isValid) {
      this.error = true;
      this.errorMessage = textarea.validationMessage;
      this.dispatchEvent(
        new CustomEvent('invalid', {
          bubbles: true,
          composed: true,
          detail: { validity: textarea.validity, message: textarea.validationMessage },
        })
      );
    }

    return isValid;
  }

  /**
   * Focus the textarea
   */
  focus() {
    this.textareaElement?.focus();
  }

  /**
   * Handle input event
   */
  private _handleInput(e: Event) {
    // Stop native event from bubbling out of shadow DOM
    // We dispatch our own custom event with detail.value
    e.stopPropagation();

    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;

    // Clear error state on input
    if (this.error) {
      this.error = false;
      this.errorMessage = '';
    }

    this.dispatchEvent(
      new CustomEvent('input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, characterCount: this.characterCount },
      })
    );
  }

  /**
   * Handle change event
   */
  private _handleChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;

    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, characterCount: this.characterCount },
      })
    );
  }

  /**
   * Get aria-describedby value
   */
  private _getAriaDescribedBy(): string | undefined {
    const ids: string[] = [];
    if (this.helperText) ids.push(this._helperId);
    if (this.error && this.errorMessage) ids.push(this._errorId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  /**
   * Get character counter classes
   */
  private _getCounterClasses(): Record<string, boolean> {
    if (!this.maxLength) return {};

    const percentage = (this.characterCount / this.maxLength) * 100;

    return {
      warning: percentage >= 80 && percentage < 100,
      error: percentage >= 100,
    };
  }

  render() {
    const textareaClasses = {
      error: this.error,
    };

    const showCounter = this.maxLength !== undefined;

    return html`
      <div class="textarea-wrapper">
        ${this.label
          ? html`
              <label for=${this._textareaId}>
                ${this.label}
                ${this.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing}
              </label>
            `
          : nothing}

        <div class="textarea-container">
          <textarea
            id=${this._textareaId}
            class=${classMap(textareaClasses)}
            .value=${this.value}
            placeholder=${ifDefined(this.placeholder || undefined)}
            name=${ifDefined(this.name || undefined)}
            rows=${this.rows}
            ?disabled=${this.disabled}
            ?required=${this.required}
            minlength=${ifDefined(this.minLength)}
            maxlength=${ifDefined(this.maxLength)}
            aria-invalid=${this.error}
            aria-describedby=${ifDefined(this._getAriaDescribedBy())}
            aria-required=${this.required}
            @input=${this._handleInput}
            @change=${this._handleChange}
          ></textarea>
        </div>

        <div class="footer">
          <div class="footer-text">
            ${this.helperText && !this.error
              ? html`<span id=${this._helperId} class="helper-text">${this.helperText}</span>`
              : nothing}

            ${this.error && this.errorMessage
              ? html`<span id=${this._errorId} class="error-text" role="alert">${this.errorMessage}</span>`
              : nothing}
          </div>

          ${showCounter
            ? html`
                <span
                  class="character-counter ${classMap(this._getCounterClasses())}"
                  aria-live="polite"
                >
                  ${this.characterCount}/${this.maxLength}
                </span>
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
    'tx-textarea': TxTextarea;
  }
}
