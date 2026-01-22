/**
 * tx-session-actions - Session Action Bar Component
 *
 * Action buttons for managing clinical coding sessions including
 * save draft, copy expression, clear session, and confirm & save.
 *
 * @fires clear - Fired when session clear is confirmed
 * @fires save-draft - Fired when save draft is clicked
 * @fires copy - Fired when expression is copied to clipboard
 * @fires confirm - Fired when confirm & save is clicked
 *
 * @example
 * ```html
 * <tx-session-actions
 *   .sessionState=${'questioning'}
 *   .hasExpression=${true}
 *   .expressionValid=${true}
 *   .hasUnsavedChanges=${true}
 *   @clear=${this.handleClear}
 *   @save-draft=${this.handleSaveDraft}
 *   @copy=${this.handleCopy}
 *   @confirm=${this.handleConfirm}
 * ></tx-session-actions>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// Import core components
import '../../core/tx-button.js';
import '../../core/tx-modal.js';
import { toast } from '../../core/tx-toast-container.js';

/**
 * Session state type
 */
export type SessionState =
  | 'initial'
  | 'extracting'
  | 'matching'
  | 'confirming'
  | 'questioning'
  | 'building'
  | 'completed'
  | 'error';

@customElement('tx-session-actions')
export class TxSessionActions extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== ACTION BAR CONTAINER ===== */

    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      gap: var(--space-3, 12px);
    }

    /* ===== LEFT ACTIONS (Destructive) ===== */

    .left-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    /* ===== RIGHT ACTIONS (Primary) ===== */

    .right-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
    }

    /* ===== BUTTON WITH ICON ===== */

    .btn-icon {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    /* ===== KEYBOARD HINT ===== */

    .kbd-hint {
      display: none;
      padding: 2px 6px;
      font-size: var(--text-xs, 12px);
      font-family: var(--font-mono, monospace);
      background: var(--color-background, #f3f4f6);
      border-radius: var(--radius-sm, 4px);
      color: var(--color-text-muted, #9ca3af);
      margin-left: var(--space-1, 4px);
    }

    @media (min-width: 768px) {
      .kbd-hint {
        display: inline-block;
      }
    }

    /* ===== MODAL CONTENT ===== */

    .modal-body {
      font-size: var(--text-base, 16px);
      color: var(--color-text-secondary, #4b5563);
      line-height: 1.5;
    }

    .modal-warning {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px);
      background: var(--color-warning-light, #fef3c7);
      border-radius: var(--radius-md, 8px);
      margin-top: var(--space-3, 12px);
    }

    .modal-warning-icon {
      flex-shrink: 0;
      font-size: var(--text-lg, 18px);
    }

    .modal-warning-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-warning-dark, #92400e);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
    }

    /* ===== RESPONSIVE ===== */

    @media (max-width: 640px) {
      .action-bar {
        flex-direction: column;
        gap: var(--space-3, 12px);
      }

      .left-actions,
      .right-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  /**
   * Current session state
   */
  @property({ type: String })
  sessionState: SessionState = 'initial';

  /**
   * Whether an expression exists
   */
  @property({ type: Boolean })
  hasExpression = false;

  /**
   * Whether the expression is valid
   */
  @property({ type: Boolean })
  expressionValid = false;

  /**
   * Whether there are unsaved changes
   */
  @property({ type: Boolean })
  hasUnsavedChanges = false;

  /**
   * Whether an action is in progress
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * The expression text to copy
   */
  @property({ type: String })
  expressionText = '';

  /**
   * Show clear confirmation modal
   */
  @state()
  private _showClearConfirm = false;

  /**
   * Loading state for save action
   */
  @state()
  private _savingDraft = false;

  /**
   * Loading state for confirm action
   */
  @state()
  private _confirming = false;

  /**
   * Keyboard handler bound reference
   */
  private _handleKeydown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl+S / Cmd+S for Save Draft
    if (modifier && e.key === 's') {
      e.preventDefault();
      if (!this._isSaveDisabled) {
        this._handleSaveDraft();
      }
    }

    // Ctrl+Shift+C / Cmd+Shift+C for Copy Expression
    if (modifier && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      if (this.hasExpression) {
        this._handleCopy();
      }
    }

    // Ctrl+Enter / Cmd+Enter for Confirm & Save
    if (modifier && e.key === 'Enter') {
      e.preventDefault();
      if (!this._isConfirmDisabled) {
        this._handleConfirm();
      }
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._handleKeydown);
    super.disconnectedCallback();
  }

  /**
   * Check if session is empty
   */
  private get _isSessionEmpty(): boolean {
    return this.sessionState === 'initial';
  }

  /**
   * Check if clear button should be disabled
   */
  private get _isClearDisabled(): boolean {
    return this._isSessionEmpty || this.loading;
  }

  /**
   * Check if save button should be disabled
   */
  private get _isSaveDisabled(): boolean {
    return !this.hasUnsavedChanges || this.loading || this._savingDraft;
  }

  /**
   * Check if copy button should be disabled
   */
  private get _isCopyDisabled(): boolean {
    return !this.hasExpression || this.loading;
  }

  /**
   * Check if confirm button should be disabled
   */
  private get _isConfirmDisabled(): boolean {
    return !this.expressionValid || this.loading || this._confirming;
  }

  /**
   * Handle clear button click - show confirmation
   */
  private _handleClearClick() {
    this._showClearConfirm = true;
  }

  /**
   * Confirm clear action
   */
  private _confirmClear() {
    this._showClearConfirm = false;
    this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Cancel clear action
   */
  private _cancelClear() {
    this._showClearConfirm = false;
  }

  /**
   * Handle save draft
   */
  private async _handleSaveDraft() {
    if (this._isSaveDisabled) return;

    this._savingDraft = true;

    this.dispatchEvent(
      new CustomEvent('save-draft', {
        bubbles: true,
        composed: true,
      })
    );

    // Show toast notification
    toast.success('Draft saved');

    // Reset loading after a brief delay
    setTimeout(() => {
      this._savingDraft = false;
    }, 500);
  }

  /**
   * Handle copy expression
   */
  private async _handleCopy() {
    if (this._isCopyDisabled) return;

    try {
      await navigator.clipboard.writeText(this.expressionText);
      toast.success('Copied to clipboard!');

      this.dispatchEvent(
        new CustomEvent('copy', {
          bubbles: true,
          composed: true,
          detail: { text: this.expressionText },
        })
      );
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }

  /**
   * Handle confirm & save
   */
  private _handleConfirm() {
    if (this._isConfirmDisabled) return;

    this._confirming = true;

    this.dispatchEvent(
      new CustomEvent('confirm', {
        bubbles: true,
        composed: true,
      })
    );

    // Reset loading after a brief delay
    setTimeout(() => {
      this._confirming = false;
    }, 500);
  }

  /**
   * Get keyboard shortcut hint based on platform
   */
  private _getShortcutHint(action: 'save' | 'copy' | 'confirm'): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? '⌘' : 'Ctrl';

    switch (action) {
      case 'save':
        return `${mod}+S`;
      case 'copy':
        return `${mod}+Shift+C`;
      case 'confirm':
        return `${mod}+Enter`;
      default:
        return '';
    }
  }

  /**
   * Render clear confirmation modal
   */
  private _renderClearConfirmation() {
    return html`
      <tx-modal
        .open=${this._showClearConfirm}
        size="sm"
        @close=${this._cancelClear}
      >
        <span slot="header">Clear Session?</span>

        <div class="modal-body">
          <p>Are you sure you want to clear this session?</p>
          <div class="modal-warning">
            <span class="modal-warning-icon">⚠️</span>
            <span class="modal-warning-text">
              All current work will be lost. This action cannot be undone.
            </span>
          </div>
        </div>

        <div slot="footer" class="modal-footer">
          <tx-button variant="secondary" @click=${this._cancelClear}>
            Cancel
          </tx-button>
          <tx-button variant="destructive" @click=${this._confirmClear}>
            Clear Session
          </tx-button>
        </div>
      </tx-modal>
    `;
  }

  render() {
    return html`
      <div class="action-bar">
        <!-- Left Actions (Destructive) -->
        <div class="left-actions">
          <tx-button
            variant="ghost"
            ?disabled=${this._isClearDisabled}
            @click=${this._handleClearClick}
            title="Clear current session"
          >
            Clear Session
          </tx-button>
        </div>

        <!-- Right Actions (Primary) -->
        <div class="right-actions">
          <tx-button
            variant="secondary"
            ?disabled=${this._isSaveDisabled}
            ?loading=${this._savingDraft}
            @click=${this._handleSaveDraft}
            title="Save draft (${this._getShortcutHint('save')})"
          >
            <span class="btn-icon">
              Save Draft
              <span class="kbd-hint">${this._getShortcutHint('save')}</span>
            </span>
          </tx-button>

          <tx-button
            variant="secondary"
            ?disabled=${this._isCopyDisabled}
            @click=${this._handleCopy}
            title="Copy expression (${this._getShortcutHint('copy')})"
          >
            <span class="btn-icon">
              📋 Copy Expression
              <span class="kbd-hint">${this._getShortcutHint('copy')}</span>
            </span>
          </tx-button>

          <tx-button
            variant="primary"
            ?disabled=${this._isConfirmDisabled}
            ?loading=${this._confirming}
            @click=${this._handleConfirm}
            title="Confirm and save (${this._getShortcutHint('confirm')})"
          >
            <span class="btn-icon">
              ✓ Confirm & Save
            </span>
          </tx-button>
        </div>
      </div>

      ${this._renderClearConfirmation()}
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-session-actions': TxSessionActions;
  }
}
