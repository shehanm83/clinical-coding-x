/**
 * tx-clinical-input - Clinical Text Input Component
 *
 * A large text input area for clinical notes with auto-resize, character counter,
 * auto-save draft functionality, and keyboard shortcuts.
 *
 * @fires submit - Fired when Start Coding clicked or Ctrl+Enter pressed
 * @fires clear - Fired when text is cleared
 * @fires draft-saved - Fired on auto-save
 *
 * @example
 * ```html
 * <tx-clinical-input
 *   @submit=${this.handleSubmit}
 *   @clear=${this.handleClear}
 *   .value=${this.clinicalText}
 * ></tx-clinical-input>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// Import core components
import '../../core/tx-button.js';
import '../../core/tx-modal.js';

/**
 * Event detail for submit events
 */
export interface ClinicalInputEvent {
  text: string;
  context?: {
    specialty?: string;
    setting?: string;
  };
}

const DRAFT_STORAGE_KEY = 'clinical-input-draft';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEFAULT_MAX_LENGTH = 10000;
const WARNING_THRESHOLD = 9000;

const PLACEHOLDER_TEXT = `Enter clinical notes, symptoms, or diagnoses...

Example: Patient presents with acute chest pain radiating to left arm, accompanied by shortness of breath and diaphoresis.`;

@customElement('tx-clinical-input')
export class TxClinicalInput extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .clinical-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 12px);
    }

    /* ===== TEXTAREA CONTAINER ===== */

    .textarea-container {
      position: relative;
    }

    textarea {
      width: 100%;
      min-height: 120px;
      max-height: 400px;
      padding: var(--space-4, 16px);
      font-family: inherit;
      font-size: var(--text-base, 16px);
      line-height: var(--line-height-relaxed, 1.625);
      color: var(--color-text-primary, #111827);
      background-color: var(--color-surface, #ffffff);
      border: var(--input-border-width, 2px) solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      outline: none;
      resize: none;
      overflow-y: auto;
      transition:
        border-color var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
        box-shadow var(--duration-fast, 150ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    }

    textarea::placeholder {
      color: var(--color-text-muted, #9ca3af);
      white-space: pre-line;
    }

    /* Hover state */
    textarea:hover:not(:focus):not(:disabled) {
      border-color: var(--color-text-secondary, #4b5563);
    }

    /* Focus state */
    textarea:focus {
      border-color: var(--color-primary, #2563eb);
      box-shadow: 0 0 0 3px var(--color-primary-light, #dbeafe);
    }

    /* Disabled state */
    textarea:disabled {
      background-color: var(--color-background, #f9fafb);
      color: var(--color-text-muted, #9ca3af);
      cursor: not-allowed;
    }

    /* ===== FOOTER ===== */

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4, 16px);
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .character-counter {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
    }

    .character-counter.warning {
      color: var(--color-warning, #ca8a04);
    }

    .character-counter.error {
      color: var(--color-error, #dc2626);
      font-weight: var(--font-weight-medium, 500);
    }

    .keyboard-hint {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
    }

    .keyboard-hint kbd {
      display: inline-block;
      padding: 2px 6px;
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: var(--text-xs, 12px);
      background-color: var(--color-background, #f9fafb);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-sm, 4px);
    }

    /* ===== ACTION BAR ===== */

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-3, 12px);
    }

    .action-bar-left {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .action-bar-right {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
    }

    .draft-status {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
      font-style: italic;
    }

    /* ===== REDUCED MOTION ===== */

    @media (prefers-reduced-motion: reduce) {
      textarea {
        transition: none;
      }
    }
  `;

  /**
   * Current text content
   */
  @property({ type: String })
  value = '';

  /**
   * Disables input and buttons
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Shows loading state on submit button
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * Maximum character limit
   */
  @property({ type: Number })
  maxLength = DEFAULT_MAX_LENGTH;

  /**
   * Focus on mount
   */
  @property({ type: Boolean })
  autofocus = false;

  /**
   * Context for the clinical input (specialty, setting)
   */
  @property({ type: Object })
  context?: { specialty?: string; setting?: string };

  @state()
  private _charCount = 0;

  @state()
  private _showClearModal = false;

  @state()
  private _draftStatus = '';

  @query('textarea')
  private _textarea!: HTMLTextAreaElement;

  private _autoSaveInterval?: ReturnType<typeof setInterval>;
  private _lastSavedValue = '';

  connectedCallback() {
    super.connectedCallback();
    this._restoreDraft();
    this._startAutoSave();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAutoSave();
  }

  firstUpdated() {
    if (this.autofocus && this._textarea) {
      // Delay focus to ensure component is fully rendered
      requestAnimationFrame(() => {
        this._textarea.focus();
      });
    }
    this._updateCharCount();
    this._autoResize();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('value')) {
      this._updateCharCount();
      this._autoResize();
    }
  }

  /**
   * Focus the textarea
   */
  focus() {
    this._textarea?.focus();
  }

  /**
   * Clear the textarea content
   */
  clear() {
    this.value = '';
    this._charCount = 0;
    this._clearDraft();
    this._autoResize();

    this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private _updateCharCount() {
    this._charCount = this.value.length;
  }

  private _autoResize() {
    if (!this._textarea) return;

    // Reset height to auto to get the correct scrollHeight
    this._textarea.style.height = 'auto';

    // Calculate new height within bounds
    const minHeight = 120;
    const maxHeight = 400;
    const newHeight = Math.min(Math.max(this._textarea.scrollHeight, minHeight), maxHeight);

    this._textarea.style.height = `${newHeight}px`;
  }

  private _handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;

    // Enforce max length
    if (textarea.value.length > this.maxLength) {
      textarea.value = textarea.value.slice(0, this.maxLength);
    }

    this.value = textarea.value;
    this._updateCharCount();
    this._autoResize();
  }

  private _handleKeyDown(e: KeyboardEvent) {
    // Ctrl+Enter (or Cmd+Enter on Mac) to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this._handleSubmit();
    }
  }

  private _handleSubmit() {
    if (this.disabled || this.loading || !this.value.trim()) return;

    const event: ClinicalInputEvent = {
      text: this.value.trim(),
    };

    if (this.context) {
      event.context = this.context;
    }

    this.dispatchEvent(
      new CustomEvent('submit', {
        bubbles: true,
        composed: true,
        detail: event,
      })
    );

    // Clear draft on successful submit
    this._clearDraft();
  }

  private _handleClearClick() {
    if (this.value.trim()) {
      this._showClearModal = true;
    }
  }

  private _handleClearConfirm() {
    this._showClearModal = false;
    this.clear();
  }

  private _handleClearCancel() {
    this._showClearModal = false;
  }

  // ===== AUTO-SAVE DRAFT =====

  private _restoreDraft() {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft && !this.value) {
        this.value = draft;
        this._lastSavedValue = draft;
        this._draftStatus = 'Draft restored';
        setTimeout(() => {
          this._draftStatus = '';
        }, 3000);
      }
    } catch {
      // localStorage not available
    }
  }

  private _saveDraft() {
    if (this.value === this._lastSavedValue) return;

    try {
      if (this.value.trim()) {
        localStorage.setItem(DRAFT_STORAGE_KEY, this.value);
        this._lastSavedValue = this.value;
        this._draftStatus = 'Draft saved';

        this.dispatchEvent(
          new CustomEvent('draft-saved', {
            bubbles: true,
            composed: true,
            detail: { text: this.value },
          })
        );

        setTimeout(() => {
          this._draftStatus = '';
        }, 2000);
      }
    } catch {
      // localStorage not available
    }
  }

  private _clearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      this._lastSavedValue = '';
    } catch {
      // localStorage not available
    }
  }

  private _startAutoSave() {
    this._autoSaveInterval = setInterval(() => {
      this._saveDraft();
    }, AUTO_SAVE_INTERVAL);
  }

  private _stopAutoSave() {
    if (this._autoSaveInterval) {
      clearInterval(this._autoSaveInterval);
      this._autoSaveInterval = undefined;
    }
  }

  // ===== CHARACTER COUNTER =====

  private _getCounterClasses(): Record<string, boolean> {
    return {
      'character-counter': true,
      warning: this._charCount >= WARNING_THRESHOLD && this._charCount < this.maxLength,
      error: this._charCount >= this.maxLength,
    };
  }

  private _formatCharCount(): string {
    return `${this._charCount.toLocaleString()} / ${this.maxLength.toLocaleString()} characters`;
  }

  render() {
    const isSubmitDisabled = this.disabled || this.loading || !this.value.trim();

    return html`
      <div class="clinical-input-wrapper">
        <div class="textarea-container">
          <textarea
            placeholder=${PLACEHOLDER_TEXT}
            .value=${this.value}
            ?disabled=${this.disabled}
            tabindex="0"
            aria-label="Clinical notes input"
            aria-describedby="char-counter"
            @input=${this._handleInput}
            @keydown=${this._handleKeyDown}
          ></textarea>
        </div>

        <div class="footer">
          <div class="footer-left">
            <span id="char-counter" class=${classMap(this._getCounterClasses())} aria-live="polite">
              ${this._formatCharCount()}
            </span>
          </div>
          <span class="keyboard-hint">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to submit
          </span>
        </div>

        <div class="action-bar">
          <div class="action-bar-left">
            <tx-button
              variant="secondary"
              size="sm"
              ?disabled=${this.disabled || !this.value.trim()}
              @click=${this._handleClearClick}
              aria-label="Clear clinical notes"
            >
              Clear
            </tx-button>
            ${this._draftStatus
              ? html`<span class="draft-status">${this._draftStatus}</span>`
              : nothing}
          </div>

          <div class="action-bar-right">
            <tx-button
              variant="primary"
              ?disabled=${isSubmitDisabled}
              ?loading=${this.loading}
              @click=${this._handleSubmit}
              aria-label="Start coding clinical notes"
            >
              ${this.loading ? 'Processing...' : 'Start Coding'}
            </tx-button>
          </div>
        </div>

        <!-- Clear Confirmation Modal -->
        <tx-modal
          size="sm"
          ?open=${this._showClearModal}
          @close=${this._handleClearCancel}
        >
          <span slot="header">Clear Clinical Notes</span>

          <p>Are you sure you want to clear all clinical notes? This action cannot be undone.</p>

          <div slot="footer">
            <tx-button variant="secondary" @click=${this._handleClearCancel}>
              Cancel
            </tx-button>
            <tx-button variant="destructive" @click=${this._handleClearConfirm}>
              Clear Notes
            </tx-button>
          </div>
        </tx-modal>
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-clinical-input': TxClinicalInput;
  }
}
