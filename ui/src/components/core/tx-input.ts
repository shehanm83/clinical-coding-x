/**
 * tx-input - Text Input Component
 *
 * A text input component with label, error state, and helper text support.
 *
 * @fires input - Fired when input value changes
 * @fires change - Fired when input loses focus after value change
 * @fires invalid - Fired when validation fails
 *
 * @example
 * ```html
 * <tx-input
 *   label="Email Address"
 *   type="email"
 *   placeholder="Enter your email"
 *   .value=${email}
 *   ?required=${true}
 *   ?error=${hasError}
 *   errorMessage="Invalid email format"
 *   helperText="We'll never share your email"
 *   @input=${handleInput}
 * ></tx-input>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

// Unique ID generator for accessibility
let inputIdCounter = 0;
const generateId = () => `tx-input-${++inputIdCounter}`;

@customElement('tx-input')
export class TxInput extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .input-wrapper {
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

    /* ===== INPUT ===== */

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    input {
      width: 100%;
      height: var(--input-height, 44px);
      padding: var(--input-padding-y, 12px) var(--input-padding-x, 16px);
      font-family: inherit;
      font-size: var(--text-base, 16px);
      line-height: var(--line-height-normal, 1.5);
      color: var(--color-text-primary, #111827);
      background-color: var(--color-surface, #FFFFFF);
      border: var(--input-border-width, 2px) solid var(--color-border, #E5E7EB);
      border-radius: var(--radius-sm, 4px);
      outline: none;
      transition: border-color var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
                  box-shadow var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    }

    input::placeholder {
      color: var(--color-text-muted, #9CA3AF);
    }

    /* Hover state */
    input:hover:not(:focus):not(:disabled):not(.error) {
      border-color: var(--color-text-secondary, #4B5563);
    }

    /* Focus state */
    input:focus {
      border-color: var(--color-primary, #2563EB);
      box-shadow: 0 0 0 3px var(--color-primary-light, #DBEAFE);
    }

    /* Error state */
    input.error {
      border-color: var(--color-error, #DC2626);
    }

    input.error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
    }

    /* Disabled state */
    input:disabled {
      background-color: var(--color-background, #F9FAFB);
      color: var(--color-text-muted, #9CA3AF);
      cursor: not-allowed;
    }

    /* ===== HELPER/ERROR TEXT ===== */

    .helper-text,
    .error-text {
      font-size: var(--text-sm, 14px);
      margin-top: var(--space-1, 4px);
    }

    .helper-text {
      color: var(--color-text-secondary, #4B5563);
    }

    .error-text {
      color: var(--color-error, #DC2626);
    }
  `;

  /**
   * Input value
   */
  @property({ type: String })
  value = '';

  /**
   * Input type
   */
  @property({ type: String })
  type: InputType = 'text';

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
   * Input name attribute
   */
  @property({ type: String })
  name = '';

  /**
   * Autocomplete attribute
   */
  @property({ type: String })
  autocomplete = '';

  /**
   * Custom validity message
   */
  @property({ type: String })
  customValidity = '';

  /**
   * Min length for validation
   */
  @property({ type: Number })
  minLength?: number;

  /**
   * Max length for validation
   */
  @property({ type: Number })
  maxLength?: number;

  /**
   * Pattern for validation
   */
  @property({ type: String })
  pattern?: string;

  @state()
  private _inputId = generateId();

  @state()
  private _helperId = `${this._inputId}-helper`;

  @state()
  private _errorId = `${this._inputId}-error`;

  /**
   * Get reference to the native input element
   */
  get inputElement(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector('input') ?? null;
  }

  /**
   * Validate the input
   */
  validate(): boolean {
    const input = this.inputElement;
    if (!input) return true;

    // Set custom validity if provided
    if (this.customValidity) {
      input.setCustomValidity(this.customValidity);
    } else {
      input.setCustomValidity('');
    }

    const isValid = input.checkValidity();

    if (!isValid) {
      this.error = true;
      this.errorMessage = input.validationMessage;
      this.dispatchEvent(
        new CustomEvent('invalid', {
          bubbles: true,
          composed: true,
          detail: { validity: input.validity, message: input.validationMessage },
        })
      );
    }

    return isValid;
  }

  /**
   * Focus the input
   */
  focus() {
    this.inputElement?.focus();
  }

  /**
   * Handle input event
   */
  private _handleInput(e: Event) {
    // Stop native event from bubbling out of shadow DOM
    // We dispatch our own custom event with detail.value
    e.stopPropagation();

    const input = e.target as HTMLInputElement;
    this.value = input.value;

    // Clear error state on input
    if (this.error) {
      this.error = false;
      this.errorMessage = '';
    }

    this.dispatchEvent(
      new CustomEvent('input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  /**
   * Handle change event
   */
  private _handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;

    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
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

  render() {
    const inputClasses = {
      error: this.error,
    };

    return html`
      <div class="input-wrapper">
        ${this.label
          ? html`
              <label for=${this._inputId}>
                ${this.label}
                ${this.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing}
              </label>
            `
          : nothing}

        <div class="input-container">
          <input
            id=${this._inputId}
            class=${classMap(inputClasses)}
            type=${this.type}
            .value=${this.value}
            placeholder=${ifDefined(this.placeholder || undefined)}
            name=${ifDefined(this.name || undefined)}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            minlength=${ifDefined(this.minLength)}
            maxlength=${ifDefined(this.maxLength)}
            pattern=${ifDefined(this.pattern)}
            aria-invalid=${this.error}
            aria-describedby=${ifDefined(this._getAriaDescribedBy())}
            aria-required=${this.required}
            @input=${this._handleInput}
            @change=${this._handleChange}
          />
        </div>

        ${this.helperText && !this.error
          ? html`<span id=${this._helperId} class="helper-text">${this.helperText}</span>`
          : nothing}

        ${this.error && this.errorMessage
          ? html`<span id=${this._errorId} class="error-text" role="alert">${this.errorMessage}</span>`
          : nothing}
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-input': TxInput;
  }
}
