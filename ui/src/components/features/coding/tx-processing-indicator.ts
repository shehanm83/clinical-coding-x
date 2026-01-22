/**
 * tx-processing-indicator - Processing Animation Component
 *
 * Visual feedback during AI processing with progress bar, spinner,
 * current text being analyzed, and estimated time remaining.
 *
 * @fires cancel - Fired when cancel button is clicked
 *
 * @example
 * ```html
 * <tx-processing-indicator
 *   .progress=${45}
 *   .currentAction=${'Extracting clinical terms'}
 *   .currentText=${'acute chest pain radiating to left arm'}
 *   @cancel=${this.handleCancel}
 * ></tx-processing-indicator>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// Import core button component
import '../../core/tx-button.js';

/**
 * Processing state interface
 */
export interface ProcessingState {
  progress: number;
  currentAction: string;
  currentText: string;
}

@customElement('tx-processing-indicator')
export class TxProcessingIndicator extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CONTAINER ===== */

    .processing-container {
      padding: var(--space-4, 16px);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
    }

    /* ===== CURRENT ACTION ===== */

    .current-action {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      margin-bottom: var(--space-3, 12px);
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    /* ===== PROGRESS BAR ===== */

    .progress-wrapper {
      margin-bottom: var(--space-4, 16px);
    }

    .progress-bar {
      height: 8px;
      background: var(--color-background, #f3f4f6);
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--color-primary, #2563eb) 0%,
        var(--color-primary-light, #60a5fa) 100%
      );
      border-radius: var(--radius-full, 9999px);
      transition: width var(--duration-normal, 300ms) var(--easing-default, ease);
    }

    .progress-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
      text-align: right;
      margin-top: var(--space-1, 4px);
    }

    /* ===== SPINNER ===== */

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border, #e5e7eb);
      border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ===== ANALYZING TEXT ===== */

    .analyzing-section {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-md, 8px);
      margin-bottom: var(--space-4, 16px);
    }

    .analyzing-icon {
      flex-shrink: 0;
      color: var(--color-primary, #2563eb);
    }

    .analyzing-content {
      flex: 1;
      min-width: 0;
    }

    .analyzing-label {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #6b7280);
      margin-bottom: var(--space-1, 4px);
    }

    .analyzing-text {
      font-size: var(--text-base, 16px);
      color: var(--color-text-primary, #111827);
      font-style: italic;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    /* Text fade animation */
    .analyzing-text.fade {
      animation: textFade 0.3s ease;
    }

    @keyframes textFade {
      0% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    /* ===== FOOTER ===== */

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .eta {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #6b7280);
    }

    .cancel-section {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .canceling-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #6b7280);
      font-style: italic;
    }

    /* ===== REDUCED MOTION ===== */

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
        opacity: 0.7;
      }

      .progress-fill {
        transition: none;
      }

      .analyzing-text.fade {
        animation: none;
      }
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
   * Progress percentage (0-100)
   */
  @property({ type: Number })
  progress = 0;

  /**
   * Current processing step description
   */
  @property({ type: String })
  currentAction = '';

  /**
   * Text segment being analyzed
   */
  @property({ type: String })
  currentText = '';

  /**
   * Whether cancellation is allowed
   */
  @property({ type: Boolean })
  canCancel = true;

  /**
   * Whether currently canceling
   */
  @state()
  private _isCanceling = false;

  /**
   * Start time for ETA calculation
   */
  @state()
  private _startTime = Date.now();

  /**
   * Elapsed time in ms
   */
  @state()
  private _elapsedTime = 0;

  /**
   * Previous text for fade animation
   */
  @state()
  private _previousText = '';

  /**
   * Whether text is fading
   */
  @state()
  private _textFading = false;

  /**
   * Show confirmation dialog
   */
  @state()
  private _showCancelConfirm = false;

  private _intervalId?: ReturnType<typeof setInterval>;

  connectedCallback() {
    super.connectedCallback();
    this._startTime = Date.now();
    this._startTimer();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTimer();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('currentText')) {
      const oldText = changedProperties.get('currentText') as string;
      if (oldText !== this.currentText && this.currentText) {
        this._triggerTextFade();
      }
    }

    // Reset start time when progress resets
    if (changedProperties.has('progress')) {
      const oldProgress = changedProperties.get('progress') as number;
      if (oldProgress > this.progress) {
        this._startTime = Date.now();
      }
    }
  }

  private _startTimer() {
    this._intervalId = setInterval(() => {
      this._elapsedTime = Date.now() - this._startTime;
    }, 1000);
  }

  private _stopTimer() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }

  private _triggerTextFade() {
    this._textFading = true;
    setTimeout(() => {
      this._textFading = false;
    }, 300);
  }

  /**
   * Calculate estimated time remaining
   */
  private _calculateETA(): string | null {
    // Only show after 5 seconds
    if (this._elapsedTime < 5000) return null;

    // Need some progress to calculate
    if (this.progress <= 0) return null;

    // Calculate rate and remaining time
    const rate = this.progress / this._elapsedTime;
    const remainingProgress = 100 - this.progress;
    const remainingMs = remainingProgress / rate;
    const seconds = Math.ceil(remainingMs / 1000);

    if (seconds <= 0) return null;
    if (seconds > 300) return null; // Don't show if > 5 minutes

    return `~${seconds} second${seconds !== 1 ? 's' : ''} remaining`;
  }

  /**
   * Handle cancel click
   */
  private _handleCancelClick() {
    // Show confirmation if progress > 50%
    if (this.progress > 50 && !this._showCancelConfirm) {
      this._showCancelConfirm = true;
      return;
    }

    this._confirmCancel();
  }

  /**
   * Confirm cancel action
   */
  private _confirmCancel() {
    this._isCanceling = true;
    this._showCancelConfirm = false;

    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Cancel the cancel confirmation
   */
  private _cancelConfirmation() {
    this._showCancelConfirm = false;
  }

  /**
   * Render spinner icon
   */
  private _renderSpinner() {
    return html`<div class="spinner" aria-hidden="true"></div>`;
  }

  /**
   * Render analyzing icon (rotating arrows)
   */
  private _renderAnalyzingIcon() {
    return html`
      <svg class="analyzing-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    `;
  }

  render() {
    const eta = this._calculateETA();

    const textClasses = {
      'analyzing-text': true,
      fade: this._textFading,
    };

    return html`
      <div class="processing-container">
        <!-- Current Action Header -->
        <div class="current-action" aria-live="polite">
          ${this._renderSpinner()}
          <span>${this.currentAction || 'Processing...'}</span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-wrapper">
          <div
            class="progress-bar"
            role="progressbar"
            aria-valuenow=${this.progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Processing progress"
          >
            <div
              class="progress-fill"
              style="width: ${Math.min(Math.max(this.progress, 0), 100)}%"
            ></div>
          </div>
          <div class="progress-text">${Math.round(this.progress)}%</div>
        </div>

        <!-- Analyzing Text -->
        ${this.currentText
          ? html`
              <div class="analyzing-section">
                ${this._renderAnalyzingIcon()}
                <div class="analyzing-content">
                  <div class="analyzing-label">Analyzing:</div>
                  <div class=${classMap(textClasses)}>
                    "${this.currentText}"
                  </div>
                </div>
              </div>
            `
          : nothing}

        <!-- Footer with ETA and Cancel -->
        <div class="footer">
          <div class="eta" aria-live="polite">
            ${eta || html`<span>&nbsp;</span>`}
          </div>

          <div class="cancel-section">
            ${this._isCanceling
              ? html`<span class="canceling-text">Canceling...</span>`
              : this._showCancelConfirm
                ? html`
                    <span class="canceling-text">Cancel processing?</span>
                    <tx-button
                      variant="secondary"
                      size="sm"
                      @click=${this._cancelConfirmation}
                    >
                      No
                    </tx-button>
                    <tx-button
                      variant="destructive"
                      size="sm"
                      @click=${this._confirmCancel}
                    >
                      Yes
                    </tx-button>
                  `
                : html`
                    <tx-button
                      variant="secondary"
                      size="sm"
                      ?disabled=${!this.canCancel}
                      @click=${this._handleCancelClick}
                      aria-label="Cancel processing"
                    >
                      Cancel
                    </tx-button>
                  `}
          </div>
        </div>

        <!-- Screen reader announcement -->
        <div class="visually-hidden" aria-live="assertive">
          ${this.currentAction}, ${Math.round(this.progress)} percent complete
          ${eta ? `, ${eta}` : ''}
        </div>
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-processing-indicator': TxProcessingIndicator;
  }
}
