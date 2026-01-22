/**
 * tx-completion-modal - Success/Completion Modal Component
 *
 * Displays completed ECL expression with session metrics and action buttons.
 * Includes celebration animation on successful completion.
 *
 * @fires copy - Fired when expression is copied
 * @fires download - Fired when download is requested
 * @fires new-session - Fired when starting new session
 * @fires view-explorer - Fired when viewing in explorer
 * @fires close - Fired when modal is closed
 *
 * @example
 * ```html
 * <tx-completion-modal
 *   .open=${true}
 *   .expression=${completedExpression}
 *   .metrics=${sessionMetrics}
 *   @copy=${this.handleCopy}
 *   @download=${this.handleDownload}
 *   @new-session=${this.handleNewSession}
 *   @view-explorer=${this.handleViewExplorer}
 *   @close=${this.handleClose}
 * ></tx-completion-modal>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// Import core components
import '../../core/tx-button.js';
import '../../core/tx-modal.js';
import { toast } from '../../core/tx-toast-container.js';

/**
 * ECL Expression interface
 */
export interface CompletedExpression {
  ecl: string;
  formatted: {
    inline: string;
    nested: string;
  };
  description: string;
  validation: {
    valid: boolean;
    mrcmCompliant: boolean;
  };
}

/**
 * Session metrics interface
 */
export interface SessionMetrics {
  totalTimeMs: number;
  termsExtracted: number;
  conceptsMatched: number;
  questionsAsked: number;
  questionsAnswered: number;
  expressionType: 'precoordinated' | 'postcoordinated';
  validationStatus: 'valid' | 'mrcm_compliant' | 'warning';
}

@customElement('tx-completion-modal')
export class TxCompletionModal extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    /* ===== MODAL CONTENT ===== */

    .completion-content {
      text-align: center;
    }

    /* ===== SUCCESS ICON ===== */

    .success-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      margin: 0 auto var(--space-4, 16px);
      background: var(--color-success-light, #dcfce7);
      border-radius: 50%;
      font-size: 32px;
      color: var(--color-success, #16a34a);
    }

    /* ===== TITLE ===== */

    .success-title {
      font-size: var(--text-xl, 20px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
      margin: 0 0 var(--space-4, 16px);
    }

    /* ===== EXPRESSION BLOCK ===== */

    .expression-block {
      margin: var(--space-4, 16px) 0;
      padding: var(--space-4, 16px);
      background: var(--color-code-bg, #1e293b);
      border-radius: var(--radius-md, 8px);
      text-align: left;
      overflow-x: auto;
    }

    .expression-code {
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
      font-size: var(--text-sm, 14px);
      color: var(--color-code-text, #e2e8f0);
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .expression-description {
      margin-top: var(--space-3, 12px);
      padding-top: var(--space-3, 12px);
      border-top: 1px solid var(--color-border-dark, #334155);
      font-family: inherit;
      font-size: var(--text-sm, 14px);
      color: var(--color-code-comment, #94a3b8);
      font-style: italic;
    }

    /* ===== VALIDATION BADGES ===== */

    .validation-badges {
      display: flex;
      gap: var(--space-2, 8px);
      margin-top: var(--space-3, 12px);
    }

    .validation-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-sm, 4px);
    }

    .validation-badge.valid {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success, #16a34a);
    }

    .validation-badge.warning {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
    }

    /* ===== METRICS PANEL ===== */

    .metrics-panel {
      margin: var(--space-4, 16px) 0;
      padding: var(--space-4, 16px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-md, 8px);
      text-align: left;
    }

    .metrics-title {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
      margin: 0 0 var(--space-3, 12px);
    }

    .metrics-divider {
      height: 1px;
      background: var(--color-border, #e5e7eb);
      margin-bottom: var(--space-3, 12px);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2, 8px) var(--space-4, 16px);
    }

    .metric-item {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-sm, 14px);
    }

    .metric-label {
      color: var(--color-text-muted, #9ca3af);
    }

    .metric-value {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    .metric-value.success {
      color: var(--color-success, #16a34a);
    }

    /* ===== NEXT ACTIONS ===== */

    .next-actions-title {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
      margin: var(--space-4, 16px) 0 var(--space-3, 12px);
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3, 12px);
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-3, 12px);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .action-btn:hover {
      background: var(--color-background, #f9fafb);
      border-color: var(--color-primary, #2563eb);
    }

    .action-btn:focus-visible {
      outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, var(--color-primary));
      outline-offset: var(--focus-ring-offset, 2px);
    }

    .action-btn-icon {
      font-size: var(--text-xl, 20px);
    }

    .action-btn-label {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    /* ===== CONFETTI ===== */

    .confetti-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .confetti-piece {
      position: absolute;
      width: 10px;
      height: 10px;
      background: var(--confetti-color, #2563eb);
      animation: confetti-fall 3s ease-out forwards;
    }

    @keyframes confetti-fall {
      0% {
        opacity: 1;
        transform: translateY(-20px) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translateY(400px) rotate(720deg);
      }
    }

    .confetti-piece:nth-child(1) {
      left: 10%;
      --confetti-color: #2563eb;
      animation-delay: 0s;
    }
    .confetti-piece:nth-child(2) {
      left: 20%;
      --confetti-color: #16a34a;
      animation-delay: 0.1s;
    }
    .confetti-piece:nth-child(3) {
      left: 30%;
      --confetti-color: #dc2626;
      animation-delay: 0.2s;
    }
    .confetti-piece:nth-child(4) {
      left: 40%;
      --confetti-color: #f59e0b;
      animation-delay: 0.15s;
    }
    .confetti-piece:nth-child(5) {
      left: 50%;
      --confetti-color: #8b5cf6;
      animation-delay: 0.25s;
    }
    .confetti-piece:nth-child(6) {
      left: 60%;
      --confetti-color: #ec4899;
      animation-delay: 0.05s;
    }
    .confetti-piece:nth-child(7) {
      left: 70%;
      --confetti-color: #06b6d4;
      animation-delay: 0.3s;
    }
    .confetti-piece:nth-child(8) {
      left: 80%;
      --confetti-color: #84cc16;
      animation-delay: 0.2s;
    }
    .confetti-piece:nth-child(9) {
      left: 90%;
      --confetti-color: #f97316;
      animation-delay: 0.1s;
    }
    .confetti-piece:nth-child(10) {
      left: 15%;
      --confetti-color: #14b8a6;
      animation-delay: 0.35s;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .confetti-piece {
        animation: none;
        display: none;
      }
    }

    /* ===== RESPONSIVE ===== */

    @media (max-width: 480px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        grid-template-columns: 1fr;
      }
    }
  `;

  /**
   * Whether the modal is open
   */
  @property({ type: Boolean })
  open = false;

  /**
   * The completed expression (backward compat - first expression)
   */
  @property({ type: Object })
  expression?: CompletedExpression;

  /**
   * All completed expressions (industry standard: one per clinical finding)
   */
  @property({ type: Array })
  expressions?: CompletedExpression[];

  /**
   * Session metrics
   */
  @property({ type: Object })
  metrics?: SessionMetrics;

  /**
   * Whether to show confetti animation
   */
  @property({ type: Boolean })
  showConfetti = true;

  /**
   * Whether confetti is currently active
   */
  @state()
  private _confettiActive = false;

  /**
   * Track if confetti has been shown for this open
   */
  @state()
  private _confettiShown = false;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open && !this._confettiShown) {
        this._triggerConfetti();
      }
      if (!this.open) {
        this._confettiShown = false;
      }
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  private _prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Trigger confetti animation
   */
  private _triggerConfetti() {
    if (this.showConfetti && !this._prefersReducedMotion()) {
      this._confettiActive = true;
      this._confettiShown = true;
      setTimeout(() => {
        this._confettiActive = false;
      }, 3000);
    }
  }

  /**
   * Format time in human-readable format
   */
  private _formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Handle close
   */
  private _handleClose() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle copy to clipboard
   */
  private async _handleCopy() {
    const allExpressions = this.expressions?.length
      ? this.expressions
      : this.expression
        ? [this.expression]
        : [];

    if (allExpressions.length === 0) return;

    // Combine all expressions for copy
    const textToCopy = allExpressions
      .map(e => e.formatted?.nested || e.ecl)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(`Copied ${allExpressions.length} expression(s) to clipboard!`);

      this.dispatchEvent(
        new CustomEvent('copy', {
          bubbles: true,
          composed: true,
          detail: { text: textToCopy },
        })
      );
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }

  /**
   * Handle download
   */
  private _handleDownload() {
    const allExpressions = this.expressions?.length
      ? this.expressions
      : this.expression
        ? [this.expression]
        : [];

    if (allExpressions.length === 0) return;

    const content = this._generateDownloadContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snomed-expressions-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    this.dispatchEvent(
      new CustomEvent('download', {
        bubbles: true,
        composed: true,
      })
    );

    toast.success(`${allExpressions.length} expression(s) downloaded`);
  }

  /**
   * Generate download file content
   */
  private _generateDownloadContent(): string {
    const allExpressions = this.expressions?.length
      ? this.expressions
      : this.expression
        ? [this.expression]
        : [];

    const expressionsContent = allExpressions.map((expr, i) => `
=== Expression ${i + 1} ===
Description: ${expr.description || 'Clinical Finding'}
ECL: ${expr.formatted?.nested || expr.ecl}
Validation: ${expr.validation?.valid ? 'Valid' : 'Invalid'}
MRCM Compliant: ${expr.validation?.mrcmCompliant ? 'Yes' : 'No'}
`).join('\n');

    return `SNOMED CT Expressions
Generated: ${new Date().toISOString()}
Total Expressions: ${allExpressions.length}

${expressionsContent}

Session Metrics:
- Time: ${this._formatTime(this.metrics?.totalTimeMs || 0)}
- Terms Extracted: ${this.metrics?.termsExtracted || 0}
- Concepts Matched: ${this.metrics?.conceptsMatched || 0}
- Questions Answered: ${this.metrics?.questionsAnswered || 0}
`;
  }

  /**
   * Handle new session
   */
  private _handleNewSession() {
    this.dispatchEvent(
      new CustomEvent('new-session', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle view in explorer
   */
  private _handleViewExplorer() {
    this.dispatchEvent(
      new CustomEvent('view-explorer', {
        bubbles: true,
        composed: true,
        detail: { ecl: this.expression?.ecl },
      })
    );
  }

  /**
   * Render validation badges
   */
  private _renderValidationBadges() {
    if (!this.expression) return nothing;

    const badges = [];

    if (this.expression.validation.valid) {
      badges.push(html`
        <span class="validation-badge valid">
          <span>✓</span>
          <span>Valid</span>
        </span>
      `);
    }

    if (this.expression.validation.mrcmCompliant) {
      badges.push(html`
        <span class="validation-badge valid">
          <span>✓</span>
          <span>MRCM Compliant</span>
        </span>
      `);
    }

    if (!this.expression.validation.valid) {
      badges.push(html`
        <span class="validation-badge warning">
          <span>⚠</span>
          <span>Validation Warning</span>
        </span>
      `);
    }

    return badges.length > 0
      ? html`<div class="validation-badges">${badges}</div>`
      : nothing;
  }

  /**
   * Render confetti pieces
   */
  private _renderConfetti() {
    if (!this._confettiActive) return nothing;

    return html`
      <div class="confetti-container">
        ${Array.from({ length: 10 }).map(
          () => html`<div class="confetti-piece"></div>`
        )}
      </div>
    `;
  }

  /**
   * Render all expressions
   */
  private _renderExpressions() {
    // Use expressions array if available, otherwise fallback to single expression
    const allExpressions = this.expressions?.length
      ? this.expressions
      : this.expression
        ? [this.expression]
        : [];

    if (allExpressions.length === 0) return nothing;

    return html`
      <div style="margin: var(--space-4, 16px) 0; text-align: left;">
        ${allExpressions.length > 1
          ? html`
            <div style="margin-bottom: var(--space-2, 8px); font-size: var(--text-sm, 14px); color: var(--color-text-secondary, #6b7280);">
              <strong>${allExpressions.length} ECL Expressions</strong>
              <span style="font-size: var(--text-xs, 12px); color: var(--color-text-muted, #9ca3af); margin-left: var(--space-2, 8px);">
                (one per clinical finding - industry standard)
              </span>
            </div>
          `
          : nothing}
        ${allExpressions.map((expr, i) => html`
          <div class="expression-block" style="${i > 0 ? 'margin-top: var(--space-3, 12px);' : ''}">
            ${allExpressions.length > 1
              ? html`
                <div style="font-size: var(--text-xs, 12px); color: var(--color-code-comment, #94a3b8); margin-bottom: var(--space-2, 8px);">
                  Finding ${i + 1}: ${expr.description || 'Clinical Finding'}
                </div>
              `
              : nothing}
            <code class="expression-code">
              ${expr.formatted?.nested || expr.ecl}
            </code>
            ${expr.description && allExpressions.length === 1
              ? html`
                  <div class="expression-description">
                    ${expr.description}
                  </div>
                `
              : nothing}
            ${this._renderValidationBadgesFor(expr)}
          </div>
        `)}
      </div>
    `;
  }

  /**
   * Render validation badges for a specific expression
   */
  private _renderValidationBadgesFor(expr: CompletedExpression) {
    if (!expr) return nothing;

    const badges = [];

    if (expr.validation?.valid) {
      badges.push(html`
        <span class="validation-badge valid">
          <span>✓</span>
          <span>Valid</span>
        </span>
      `);
    }

    if (expr.validation?.mrcmCompliant) {
      badges.push(html`
        <span class="validation-badge valid">
          <span>✓</span>
          <span>MRCM</span>
        </span>
      `);
    }

    if (expr.validation && !expr.validation.valid) {
      badges.push(html`
        <span class="validation-badge warning">
          <span>⚠</span>
          <span>Warning</span>
        </span>
      `);
    }

    return badges.length > 0
      ? html`<div class="validation-badges">${badges}</div>`
      : nothing;
  }

  /**
   * Render metrics panel
   */
  private _renderMetrics() {
    if (!this.metrics) return nothing;

    return html`
      <div class="metrics-panel">
        <h4 class="metrics-title">Session Summary</h4>
        <div class="metrics-divider"></div>
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-label">Time:</span>
            <span class="metric-value">${this._formatTime(this.metrics.totalTimeMs)}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Terms Extracted:</span>
            <span class="metric-value">${this.metrics.termsExtracted}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Concepts Matched:</span>
            <span class="metric-value">${this.metrics.conceptsMatched}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Questions Asked:</span>
            <span class="metric-value">${this.metrics.questionsAsked}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Expression Type:</span>
            <span class="metric-value">
              ${this.metrics.expressionType === 'postcoordinated'
                ? 'Postcoordinated'
                : 'Precoordinated'}
            </span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Validation:</span>
            <span class="metric-value success">
              ${this.metrics.validationStatus === 'mrcm_compliant'
                ? '✓ MRCM Compliant'
                : this.metrics.validationStatus === 'valid'
                  ? '✓ Valid'
                  : '⚠ Warning'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <tx-modal .open=${this.open} size="md" @close=${this._handleClose}>
        <span slot="header">Expression Complete</span>

        <div class="completion-content">
          ${this._renderConfetti()}

          <!-- Success Icon -->
          <div class="success-icon">✓</div>

          <!-- Title -->
          <h3 class="success-title">Expression Successfully Created</h3>

          <!-- Expression Block(s) -->
          ${this._renderExpressions()}

          <!-- Metrics Panel -->
          ${this._renderMetrics()}

          <!-- Next Actions -->
          <p class="next-actions-title">What would you like to do next?</p>

          <div class="action-buttons">
            <button
              class="action-btn"
              @click=${this._handleCopy}
              aria-label="Copy to clipboard"
            >
              <span class="action-btn-icon">📋</span>
              <span class="action-btn-label">Copy to Clipboard</span>
            </button>

            <button
              class="action-btn"
              @click=${this._handleDownload}
              aria-label="Download expression"
            >
              <span class="action-btn-icon">💾</span>
              <span class="action-btn-label">Download</span>
            </button>

            <button
              class="action-btn"
              @click=${this._handleNewSession}
              aria-label="Start new session"
            >
              <span class="action-btn-icon">📝</span>
              <span class="action-btn-label">Start New Session</span>
            </button>

            <button
              class="action-btn"
              @click=${this._handleViewExplorer}
              aria-label="View in explorer"
            >
              <span class="action-btn-icon">🔍</span>
              <span class="action-btn-label">View in Explorer</span>
            </button>
          </div>
        </div>

        <div slot="footer"></div>
      </tx-modal>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-completion-modal': TxCompletionModal;
  }
}
