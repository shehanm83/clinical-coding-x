/**
 * tx-select - Select/Dropdown Component
 *
 * A custom select component with keyboard navigation, label, and error state support.
 *
 * @fires change - Fired when selection changes
 * @fires invalid - Fired when validation fails
 *
 * @example
 * ```html
 * <tx-select
 *   label="Domain Filter"
 *   placeholder="Select domain"
 *   .options=${[
 *     { label: 'Clinical Finding', value: 'finding' },
 *     { label: 'Body Structure', value: 'body_structure' },
 *     { label: 'Procedure', value: 'procedure' }
 *   ]}
 *   .value=${selectedDomain}
 *   @change=${handleChange}
 * ></tx-select>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// Unique ID generator for accessibility
let selectIdCounter = 0;
const generateId = () => `tx-select-${++selectIdCounter}`;

@customElement('tx-select')
export class TxSelect extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .select-wrapper {
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

    /* ===== SELECT TRIGGER ===== */

    .select-container {
      position: relative;
    }

    .select-trigger {
      width: 100%;
      height: var(--input-height, 44px);
      padding: var(--input-padding-y, 12px) var(--input-padding-x, 16px);
      padding-right: 40px;
      font-family: inherit;
      font-size: var(--text-base, 16px);
      line-height: var(--line-height-normal, 1.5);
      color: var(--color-text-primary, #111827);
      background-color: var(--color-surface, #FFFFFF);
      border: var(--input-border-width, 2px) solid var(--color-border, #E5E7EB);
      border-radius: var(--radius-sm, 4px);
      outline: none;
      cursor: pointer;
      text-align: left;
      display: flex;
      align-items: center;
      transition: border-color var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
                  box-shadow var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    }

    .select-trigger.placeholder {
      color: var(--color-text-muted, #9CA3AF);
    }

    /* Arrow icon */
    .select-trigger::after {
      content: '';
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid var(--color-text-secondary, #4B5563);
      transition: transform var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    }

    .select-trigger.open::after {
      transform: translateY(-50%) rotate(180deg);
    }

    /* Hover state */
    .select-trigger:hover:not(:focus):not(:disabled):not(.error) {
      border-color: var(--color-text-secondary, #4B5563);
    }

    /* Focus state */
    .select-trigger:focus {
      border-color: var(--color-primary, #2563EB);
      box-shadow: 0 0 0 3px var(--color-primary-light, #DBEAFE);
    }

    /* Error state */
    .select-trigger.error {
      border-color: var(--color-error, #DC2626);
    }

    .select-trigger.error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
    }

    /* Disabled state */
    .select-trigger:disabled {
      background-color: var(--color-background, #F9FAFB);
      color: var(--color-text-muted, #9CA3AF);
      cursor: not-allowed;
    }

    /* ===== DROPDOWN ===== */

    .dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      max-height: 300px;
      overflow-y: auto;
      background-color: var(--color-surface, #FFFFFF);
      border: var(--input-border-width, 2px) solid var(--color-border, #E5E7EB);
      border-radius: var(--radius-sm, 4px);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      z-index: var(--z-dropdown, 100);
      display: none;
    }

    .dropdown.open {
      display: block;
    }

    .dropdown-option {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      cursor: pointer;
      transition: background-color var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    }

    .dropdown-option:hover,
    .dropdown-option.highlighted {
      background-color: var(--color-background, #F9FAFB);
    }

    .dropdown-option.selected {
      background-color: var(--color-primary-light, #DBEAFE);
      color: var(--color-primary, #2563EB);
      font-weight: var(--font-weight-medium, 500);
    }

    .dropdown-option.disabled {
      color: var(--color-text-muted, #9CA3AF);
      cursor: not-allowed;
    }

    .dropdown-option.disabled:hover {
      background-color: transparent;
    }

    .no-options {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      color: var(--color-text-muted, #9CA3AF);
      text-align: center;
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
   * Selected value
   */
  @property({ type: String })
  value = '';

  /**
   * Options array
   */
  @property({ type: Array })
  options: SelectOption[] = [];

  /**
   * Placeholder text
   */
  @property({ type: String })
  placeholder = 'Select an option';

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
   * Name attribute for form integration
   */
  @property({ type: String })
  name = '';

  @state()
  private _isOpen = false;

  @state()
  private _highlightedIndex = -1;

  @state()
  private _selectId = generateId();

  @state()
  private _listboxId = `${this._selectId}-listbox`;

  @state()
  private _helperId = `${this._selectId}-helper`;

  @state()
  private _errorId = `${this._selectId}-error`;

  /**
   * Get the selected option label
   */
  get selectedLabel(): string {
    const selected = this.options.find((opt) => opt.value === this.value);
    return selected?.label ?? '';
  }

  /**
   * Validate the select
   */
  validate(): boolean {
    if (this.required && !this.value) {
      this.error = true;
      this.errorMessage = 'Please select an option';
      this.dispatchEvent(
        new CustomEvent('invalid', {
          bubbles: true,
          composed: true,
          detail: { message: this.errorMessage },
        })
      );
      return false;
    }
    return true;
  }

  /**
   * Focus the select trigger
   */
  focus() {
    const trigger = this.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
    trigger?.focus();
  }

  connectedCallback() {
    super.connectedCallback();
    // Close dropdown on outside click
    document.addEventListener('click', this._handleOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
  }

  /**
   * Handle outside click to close dropdown
   */
  private _handleOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._isOpen = false;
    }
  };

  /**
   * Toggle dropdown
   */
  private _toggleDropdown() {
    if (this.disabled) return;

    this._isOpen = !this._isOpen;

    if (this._isOpen) {
      // Highlight current selection or first option
      const currentIndex = this.options.findIndex((opt) => opt.value === this.value);
      this._highlightedIndex = currentIndex >= 0 ? currentIndex : 0;
    }
  }

  /**
   * Select an option
   */
  private _selectOption(option: SelectOption) {
    if (option.disabled) return;

    this.value = option.value;
    this._isOpen = false;

    // Clear error state on selection
    if (this.error) {
      this.error = false;
      this.errorMessage = '';
    }

    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, label: option.label },
      })
    );
  }

  /**
   * Handle keyboard navigation
   */
  private _handleKeyDown(e: KeyboardEvent) {
    if (this.disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this._isOpen && this._highlightedIndex >= 0) {
          const option = this.options[this._highlightedIndex];
          if (option && !option.disabled) {
            this._selectOption(option);
          }
        } else {
          this._toggleDropdown();
        }
        break;

      case 'Escape':
        e.preventDefault();
        this._isOpen = false;
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!this._isOpen) {
          this._isOpen = true;
          this._highlightedIndex = 0;
        } else {
          this._highlightNext();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this._isOpen) {
          this._highlightPrevious();
        }
        break;

      case 'Home':
        e.preventDefault();
        if (this._isOpen) {
          this._highlightedIndex = this._findFirstEnabledIndex();
        }
        break;

      case 'End':
        e.preventDefault();
        if (this._isOpen) {
          this._highlightedIndex = this._findLastEnabledIndex();
        }
        break;

      default:
        // Typeahead - find option starting with typed character
        if (e.key.length === 1 && this._isOpen) {
          const char = e.key.toLowerCase();
          const startIndex = this._highlightedIndex + 1;
          const found = this._findOptionByChar(char, startIndex);
          if (found >= 0) {
            this._highlightedIndex = found;
          }
        }
        break;
    }
  }

  /**
   * Highlight next enabled option
   */
  private _highlightNext() {
    for (let i = this._highlightedIndex + 1; i < this.options.length; i++) {
      const option = this.options[i];
      if (option && !option.disabled) {
        this._highlightedIndex = i;
        this._scrollToHighlighted();
        return;
      }
    }
  }

  /**
   * Highlight previous enabled option
   */
  private _highlightPrevious() {
    for (let i = this._highlightedIndex - 1; i >= 0; i--) {
      const option = this.options[i];
      if (option && !option.disabled) {
        this._highlightedIndex = i;
        this._scrollToHighlighted();
        return;
      }
    }
  }

  /**
   * Find first enabled option index
   */
  private _findFirstEnabledIndex(): number {
    return this.options.findIndex((opt) => !opt.disabled);
  }

  /**
   * Find last enabled option index
   */
  private _findLastEnabledIndex(): number {
    for (let i = this.options.length - 1; i >= 0; i--) {
      const option = this.options[i];
      if (option && !option.disabled) return i;
    }
    return -1;
  }

  /**
   * Find option by starting character
   */
  private _findOptionByChar(char: string, startIndex: number): number {
    // Search from startIndex to end
    for (let i = startIndex; i < this.options.length; i++) {
      const option = this.options[i];
      if (option && !option.disabled && option.label.toLowerCase().startsWith(char)) {
        return i;
      }
    }
    // Wrap around from beginning
    for (let i = 0; i < startIndex; i++) {
      const option = this.options[i];
      if (option && !option.disabled && option.label.toLowerCase().startsWith(char)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Scroll dropdown to keep highlighted option visible
   */
  private _scrollToHighlighted() {
    const dropdown = this.shadowRoot?.querySelector('.dropdown');
    const highlighted = dropdown?.querySelector('.dropdown-option.highlighted') as HTMLElement;
    if (dropdown && highlighted) {
      highlighted.scrollIntoView({ block: 'nearest' });
    }
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
    const triggerClasses = {
      'select-trigger': true,
      placeholder: !this.value,
      open: this._isOpen,
      error: this.error,
    };

    const dropdownClasses = {
      dropdown: true,
      open: this._isOpen,
    };

    return html`
      <div class="select-wrapper">
        ${this.label
          ? html`
              <label id="${this._selectId}-label">
                ${this.label}
                ${this.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing}
              </label>
            `
          : nothing}

        <div class="select-container">
          <button
            type="button"
            class=${classMap(triggerClasses)}
            ?disabled=${this.disabled}
            role="combobox"
            aria-expanded=${this._isOpen}
            aria-haspopup="listbox"
            aria-controls=${this._listboxId}
            aria-labelledby="${this._selectId}-label"
            aria-describedby=${ifDefined(this._getAriaDescribedBy())}
            aria-invalid=${this.error}
            aria-required=${this.required}
            @click=${this._toggleDropdown}
            @keydown=${this._handleKeyDown}
          >
            ${this.value ? this.selectedLabel : this.placeholder}
          </button>

          <div
            id=${this._listboxId}
            class=${classMap(dropdownClasses)}
            role="listbox"
            aria-labelledby="${this._selectId}-label"
          >
            ${this.options.length > 0
              ? this.options.map(
                  (option, index) => html`
                    <div
                      class="dropdown-option ${classMap({
                        selected: option.value === this.value,
                        highlighted: index === this._highlightedIndex,
                        disabled: option.disabled ?? false,
                      })}"
                      role="option"
                      aria-selected=${option.value === this.value}
                      aria-disabled=${option.disabled ?? false}
                      @click=${() => this._selectOption(option)}
                      @mouseenter=${() => {
                        if (!option.disabled) this._highlightedIndex = index;
                      }}
                    >
                      ${option.label}
                    </div>
                  `
                )
              : html`<div class="no-options">No options available</div>`}
          </div>
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
    'tx-select': TxSelect;
  }
}
