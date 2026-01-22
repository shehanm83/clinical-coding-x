/**
 * tx-expression-preview - Expression Preview Component
 *
 * Displays a live preview of the ECL expression being built with
 * syntax highlighting, format options, validation status, and copy/edit features.
 *
 * @fires copy - Fired when expression is copied to clipboard
 * @fires edit - Fired when expression is manually edited
 *
 * @example
 * ```html
 * <tx-expression-preview
 *   .expression=${this.expression}
 *   @copy=${this.handleCopy}
 *   @edit=${this.handleEdit}
 * ></tx-expression-preview>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// Import core components
import '../../core/tx-button.js';
import '../../core/tx-textarea.js';

/**
 * Validation error/warning interface
 */
export interface ValidationMessage {
  code: string;
  message: string;
}

/**
 * ECL Expression interface
 */
export interface ECLExpression {
  ecl: string;
  description: string;
  fsn: string;
  expressionType: 'precoordinated' | 'postcoordinated';
  validation: {
    valid: boolean;
    mrcmCompliant: boolean;
    errors: ValidationMessage[];
    warnings: ValidationMessage[];
  };
  formatted: {
    brief: string;
    long: string;
    nested: string;
  };
}

export type ExpressionFormat = 'brief' | 'long' | 'nested';

@customElement('tx-expression-preview')
export class TxExpressionPreview extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CONTAINER ===== */

    .expression-preview {
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }

    /* ===== HEADER ===== */

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-background, #f9fafb);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .header-title {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    /* ===== FORMAT TOGGLE ===== */

    .format-toggle {
      display: flex;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }

    .format-btn {
      padding: var(--space-1-5, 6px) var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .format-btn:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .format-btn.active {
      background: var(--color-primary, #2563eb);
      color: white;
    }

    /* ===== CODE BLOCK ===== */

    .code-section {
      padding: var(--space-4, 16px);
    }

    .code-block {
      position: relative;
      padding: var(--space-4, 16px);
      background: var(--code-bg, #1e1e1e);
      border-radius: var(--radius-md, 8px);
      overflow-x: auto;
    }

    .expression-code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', ui-monospace, monospace;
      font-size: var(--text-sm, 14px);
      line-height: 1.6;
      color: var(--code-text, #d4d4d4);
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }

    /* Syntax highlighting */
    .expression-code :global(.sctid) {
      color: #569cd6;
    }

    .expression-code :global(.term) {
      color: #ce9178;
    }

    .expression-code :global(.operator) {
      color: #d4d4d4;
    }

    .expression-code :global(.attribute) {
      color: #4ec9b0;
    }

    /* Using inline styles via unsafeHTML for highlighting */
    .sctid { color: #569cd6; }
    .term { color: #ce9178; }
    .operator { color: #d4d4d4; }

    /* ===== EMPTY STATE ===== */

    .empty-code {
      color: var(--color-text-muted, #9ca3af);
      font-style: italic;
    }

    /* ===== DESCRIPTION ===== */

    .description-section {
      padding: var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .description-label {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
      margin-bottom: var(--space-2, 8px);
    }

    .description-box {
      padding: var(--space-3, 12px);
      background: var(--color-info-light, #eff6ff);
      border-left: 4px solid var(--color-info, #3b82f6);
      border-radius: 0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0;
    }

    .description-text {
      font-size: var(--text-base, 16px);
      color: var(--color-text-primary, #111827);
      line-height: 1.5;
    }

    /* ===== VALIDATION ===== */

    .validation-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
      background: var(--color-background, #f9fafb);
    }

    .validation-label {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
    }

    .validation-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-full, 9999px);
    }

    .validation-badge.valid {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success, #16a34a);
    }

    .validation-badge.invalid {
      background: var(--color-error-light, #fef2f2);
      color: var(--color-error, #dc2626);
    }

    .validation-badge.warning {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
    }

    /* ===== VALIDATION DETAILS ===== */

    .validation-details {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .validation-message {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      margin-bottom: var(--space-2, 8px);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--text-sm, 14px);
    }

    .validation-message:last-child {
      margin-bottom: 0;
    }

    .validation-message.error {
      background: var(--color-error-light, #fef2f2);
      color: var(--color-error, #dc2626);
    }

    .validation-message.warning {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
    }

    .message-icon {
      flex-shrink: 0;
    }

    /* ===== ACTIONS ===== */

    .actions-section {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .action-btn:hover {
      background: var(--color-background-hover, #f3f4f6);
      color: var(--color-text-primary, #111827);
    }

    .action-btn.copied {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success, #16a34a);
      border-color: var(--color-success, #16a34a);
    }

    /* ===== EDIT MODE ===== */

    .edit-section {
      padding: var(--space-4, 16px);
    }

    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3, 12px);
    }

    .edit-label {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
    }

    .edit-actions {
      display: flex;
      gap: var(--space-2, 8px);
    }

    .edit-textarea {
      width: 100%;
      min-height: 120px;
      padding: var(--space-3, 12px);
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', ui-monospace, monospace;
      font-size: var(--text-sm, 14px);
      line-height: 1.6;
      background: var(--code-bg, #1e1e1e);
      color: var(--code-text, #d4d4d4);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      resize: vertical;
    }

    .edit-textarea:focus {
      outline: none;
      border-color: var(--color-primary, #2563eb);
      box-shadow: 0 0 0 3px var(--color-primary-light, #dbeafe);
    }

    /* ===== TYPE BADGE ===== */

    .type-badge {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
      margin-left: var(--space-2, 8px);
    }

    .type-badge.precoordinated {
      background: var(--color-background, #f3f4f6);
      color: var(--color-text-secondary, #4b5563);
    }

    .type-badge.postcoordinated {
      background: var(--color-primary-light, #dbeafe);
      color: var(--color-primary, #2563eb);
    }
  `;

  /**
   * The ECL expression data
   */
  @property({ type: Object })
  expression: ECLExpression | null = null;

  /**
   * Display format
   */
  @property({ type: String })
  format: ExpressionFormat = 'long';

  /**
   * Whether editing is allowed
   */
  @property({ type: Boolean })
  editable = true;

  /**
   * Whether in edit mode
   */
  @state()
  private _editMode = false;

  /**
   * Edit textarea value
   */
  @state()
  private _editValue = '';

  /**
   * Copy button state
   */
  @state()
  private _copied = false;

  /**
   * Get the expression text for current format
   */
  private _getFormattedExpression(): string {
    if (!this.expression) return '';
    return this.expression.formatted[this.format] || this.expression.ecl;
  }

  /**
   * Apply syntax highlighting to ECL
   */
  private _highlightSyntax(ecl: string): string {
    if (!ecl) return '';

    // Escape HTML first
    let highlighted = ecl
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Use unique string placeholders to avoid regex conflicts
    const SCTID_OPEN = '___SCTID_O___';
    const SCTID_CLOSE = '___SCTID_C___';
    const TERM_OPEN = '___TERM_O___';
    const TERM_CLOSE = '___TERM_C___';
    const OP_OPEN = '___OP_O___';
    const OP_CLOSE = '___OP_C___';

    // Highlight operators first (before wrapping in spans)
    highlighted = highlighted.replace(
      /(:|\{|\}|=|\+|,)/g,
      `${OP_OPEN}$1${OP_CLOSE}`
    );

    // Highlight SCTIDs (6+ digit numbers)
    highlighted = highlighted.replace(
      /(\d{6,})/g,
      `${SCTID_OPEN}$1${SCTID_CLOSE}`
    );

    // Highlight terms in pipes
    highlighted = highlighted.replace(
      /\|([^|]+)\|/g,
      `|${TERM_OPEN}$1${TERM_CLOSE}|`
    );

    // Replace placeholders with actual HTML spans
    highlighted = highlighted
      .replace(/___SCTID_O___/g, '<span class="sctid">')
      .replace(/___SCTID_C___/g, '</span>')
      .replace(/___TERM_O___/g, '<span class="term">')
      .replace(/___TERM_C___/g, '</span>')
      .replace(/___OP_O___/g, '<span class="operator">')
      .replace(/___OP_C___/g, '</span>');

    return highlighted;
  }

  /**
   * Set display format
   */
  private _setFormat(format: ExpressionFormat) {
    this.format = format;
  }

  /**
   * Copy expression to clipboard
   */
  private async _copyToClipboard() {
    const text = this._getFormattedExpression();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      this._copied = true;

      this.dispatchEvent(
        new CustomEvent('copy', {
          bubbles: true,
          composed: true,
          detail: { format: this.format, text },
        })
      );

      // Reset copied state after 2 seconds
      setTimeout(() => {
        this._copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  /**
   * Enter edit mode
   */
  private _enterEditMode() {
    this._editValue = this._getFormattedExpression();
    this._editMode = true;
  }

  /**
   * Cancel edit mode
   */
  private _cancelEdit() {
    this._editMode = false;
    this._editValue = '';
  }

  /**
   * Save edited expression
   */
  private _saveEdit() {
    this.dispatchEvent(
      new CustomEvent('edit', {
        bubbles: true,
        composed: true,
        detail: { ecl: this._editValue },
      })
    );
    this._editMode = false;
  }

  /**
   * Handle edit textarea input
   */
  private _handleEditInput(e: Event) {
    this._editValue = (e.target as HTMLTextAreaElement).value;
  }

  /**
   * Render format toggle
   */
  private _renderFormatToggle() {
    const formats: ExpressionFormat[] = ['brief', 'long', 'nested'];

    return html`
      <div class="format-toggle" role="radiogroup" aria-label="Expression format">
        ${formats.map((f) => {
          const classes = { 'format-btn': true, active: this.format === f };
          const label = f.charAt(0).toUpperCase() + f.slice(1);
          return html`
            <button
              class=${classMap(classes)}
              @click=${() => this._setFormat(f)}
              role="radio"
              aria-checked=${this.format === f}
            >
              ${label}
            </button>
          `;
        })}
      </div>
    `;
  }

  /**
   * Render validation badges
   */
  private _renderValidation() {
    if (!this.expression) return nothing;

    const { validation } = this.expression;
    const hasWarnings = validation.warnings.length > 0;

    return html`
      <div class="validation-section">
        <span class="validation-label">Validation:</span>

        <!-- Syntax Valid -->
        <span class="validation-badge ${validation.valid ? 'valid' : 'invalid'}">
          ${validation.valid ? '✓' : '✗'} Valid Syntax
        </span>

        <!-- MRCM Compliant -->
        <span
          class="validation-badge ${validation.mrcmCompliant ? 'valid' : 'invalid'}"
        >
          ${validation.mrcmCompliant ? '✓' : '✗'} MRCM Compliant
        </span>

        <!-- Warnings -->
        ${hasWarnings
          ? html`
              <span class="validation-badge warning">
                ⚠ ${validation.warnings.length} Suggestion${validation.warnings
                    .length > 1
                    ? 's'
                    : ''}
              </span>
            `
          : nothing}
      </div>
    `;
  }

  /**
   * Render validation details (errors and warnings)
   */
  private _renderValidationDetails() {
    if (!this.expression) return nothing;

    const { validation } = this.expression;
    const hasMessages =
      validation.errors.length > 0 || validation.warnings.length > 0;

    if (!hasMessages) return nothing;

    return html`
      <div class="validation-details">
        ${validation.errors.map(
          (err) => html`
            <div class="validation-message error">
              <span class="message-icon">✗</span>
              <span>${err.message}</span>
            </div>
          `
        )}
        ${validation.warnings.map(
          (warn) => html`
            <div class="validation-message warning">
              <span class="message-icon">💡</span>
              <span>${warn.message}</span>
            </div>
          `
        )}
      </div>
    `;
  }

  /**
   * Render edit mode
   */
  private _renderEditMode() {
    return html`
      <div class="edit-section">
        <div class="edit-header">
          <span class="edit-label">Edit Expression</span>
          <div class="edit-actions">
            <tx-button variant="secondary" size="sm" @click=${this._cancelEdit}>
              Cancel
            </tx-button>
            <tx-button variant="primary" size="sm" @click=${this._saveEdit}>
              Save
            </tx-button>
          </div>
        </div>
        <textarea
          class="edit-textarea"
          .value=${this._editValue}
          @input=${this._handleEditInput}
          aria-label="Edit ECL expression"
        ></textarea>
      </div>
    `;
  }

  render() {
    const expressionText = this._getFormattedExpression();
    const highlightedCode = this._highlightSyntax(expressionText);

    return html`
      <div class="expression-preview">
        <!-- Header -->
        <div class="preview-header">
          <div>
            <span class="header-title">ECL Expression</span>
            ${this.expression?.expressionType
              ? html`
                  <span
                    class="type-badge ${this.expression.expressionType}"
                  >
                    ${this.expression.expressionType === 'precoordinated'
                      ? 'Precoordinated'
                      : 'Postcoordinated'}
                  </span>
                `
              : nothing}
          </div>
          ${this._renderFormatToggle()}
        </div>

        <!-- Code Block -->
        ${this._editMode
          ? this._renderEditMode()
          : html`
              <div class="code-section">
                <div class="code-block" role="code">
                  ${expressionText
                    ? html`
                        <pre class="expression-code">${unsafeHTML(highlightedCode)}</pre>
                      `
                    : html`
                        <pre class="expression-code empty-code">No expression generated yet</pre>
                      `}
                </div>
              </div>
            `}

        <!-- Description -->
        ${this.expression?.description && !this._editMode
          ? html`
              <div class="description-section">
                <div class="description-label">Human-readable description:</div>
                <div class="description-box">
                  <p class="description-text">${this.expression.description}</p>
                </div>
              </div>
            `
          : nothing}

        <!-- Validation -->
        ${this.expression && !this._editMode ? this._renderValidation() : nothing}

        <!-- Validation Details -->
        ${this.expression && !this._editMode
          ? this._renderValidationDetails()
          : nothing}

        <!-- Actions -->
        ${!this._editMode
          ? html`
              <div class="actions-section">
                <button
                  class="action-btn ${this._copied ? 'copied' : ''}"
                  @click=${this._copyToClipboard}
                  ?disabled=${!expressionText}
                >
                  ${this._copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                ${this.editable
                  ? html`
                      <button
                        class="action-btn"
                        @click=${this._enterEditMode}
                        ?disabled=${!this.expression}
                      >
                        ✏️ Edit Expression
                      </button>
                    `
                  : nothing}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-expression-preview': TxExpressionPreview;
  }
}
