/**
 * tx-refinement-panel - Refinement Panel Component
 *
 * Container for displaying and managing clarifying questions.
 * Shows questions one at a time or all at once, with progress tracking.
 *
 * This component is a pure presentation component - all state is managed
 * by the parent (coding-page.ts). It receives data via props and emits
 * events for user actions.
 *
 * @fires answer - Fired when a question is answered
 * @fires skip - Fired when a question is skipped
 * @fires navigate - Fired when user navigates to a different question
 * @fires view-mode-change - Fired when view mode changes
 * @fires skip-all - Fired when skip all is clicked
 *
 * @example
 * ```html
 * <tx-refinement-panel
 *   .allQuestions=${this.allQuestions}
 *   .pendingQuestionIds=${this.pendingIds}
 *   .questionStates=${this.questionStates}
 *   .currentQuestionId=${this.currentId}
 *   .viewMode=${'single'}
 *   @answer=${this.handleAnswer}
 *   @skip=${this.handleSkip}
 *   @navigate=${this.handleNavigate}
 * ></tx-refinement-panel>
 * ```
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './tx-question-card.js';
import '../../core/tx-button.js';
import type { Question, QuestionAnswer } from './tx-question-card.js';

/**
 * Question state tracking
 */
export interface QuestionState {
  status: 'pending' | 'answered' | 'skipped';
  answer?: QuestionAnswer;
}

/**
 * Answered question with response (for compatibility)
 */
export interface AnsweredQuestion {
  question: Question;
  answer?: QuestionAnswer;
  skipped: boolean;
}

@customElement('tx-refinement-panel')
export class TxRefinementPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== PANEL CONTAINER ===== */

    .refinement-panel {
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }

    /* ===== HEADER ===== */

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4, 16px);
      background: var(--color-background, #f9fafb);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
    }

    .panel-title {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .question-count {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      background: var(--color-primary-light, #dbeafe);
      color: var(--color-primary, #2563eb);
      border-radius: var(--radius-full, 9999px);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .view-toggle {
      display: flex;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }

    .view-toggle-btn {
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .view-toggle-btn:hover {
      background: var(--color-background-hover, #f3f4f6);
    }

    .view-toggle-btn.active {
      background: var(--color-primary, #2563eb);
      color: white;
    }

    .skip-all-btn {
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
      background: transparent;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .skip-all-btn:hover {
      background: var(--color-background-hover, #f3f4f6);
      color: var(--color-text-secondary, #4b5563);
    }

    /* ===== PROGRESS ===== */

    .progress-section {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2, 8px);
    }

    .progress-label {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .progress-count {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
    }

    .progress-bar {
      height: 8px;
      background: var(--color-background, #f3f4f6);
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-primary, #2563eb);
      border-radius: var(--radius-full, 9999px);
      transition: width var(--duration-normal, 200ms) ease;
    }

    /* ===== QUESTIONS CONTAINER ===== */

    .questions-container {
      padding: var(--space-4, 16px);
    }

    .question-wrapper {
      margin-bottom: var(--space-4, 16px);
    }

    .question-wrapper:last-child {
      margin-bottom: 0;
    }

    /* ===== NAVIGATION (Single View) ===== */

    .question-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .nav-info {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .nav-buttons {
      display: flex;
      gap: var(--space-2, 8px);
    }

    /* ===== COMPLETED SECTION ===== */

    .completed-section {
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .completed-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      background: var(--color-success-light, #dcfce7);
      cursor: pointer;
    }

    .completed-title {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-success, #16a34a);
    }

    .collapse-icon {
      transition: transform var(--duration-fast, 150ms) ease;
    }

    .collapse-icon.expanded {
      transform: rotate(180deg);
    }

    .completed-list {
      padding: var(--space-4, 16px);
    }

    /* ===== EMPTY STATE ===== */

    .empty-state {
      padding: var(--space-8, 32px);
      text-align: center;
      color: var(--color-text-muted, #9ca3af);
    }

    .empty-icon {
      font-size: var(--text-4xl, 36px);
      margin-bottom: var(--space-3, 12px);
    }

    .empty-title {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
      margin-bottom: var(--space-2, 8px);
    }

    .empty-description {
      font-size: var(--text-sm, 14px);
    }

    /* ===== ALL COMPLETE STATE ===== */

    .all-complete {
      padding: var(--space-6, 24px);
      text-align: center;
      background: var(--color-success-light, #dcfce7);
    }

    .complete-icon {
      font-size: var(--text-4xl, 36px);
      margin-bottom: var(--space-3, 12px);
    }

    .complete-title {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-success, #16a34a);
      margin-bottom: var(--space-2, 8px);
    }

    .complete-description {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }
  `;

  // ============================================================================
  // Properties - All state comes from parent
  // ============================================================================

  /**
   * All questions (full original list, never changes once set)
   */
  @property({ type: Array })
  allQuestions: Question[] = [];

  /**
   * IDs of pending questions (not yet answered or skipped)
   */
  @property({ type: Array })
  pendingQuestionIds: string[] = [];

  /**
   * Map of question ID to state (pending/answered/skipped)
   */
  @property({ attribute: false })
  questionStates: Map<string, QuestionState> = new Map();

  /**
   * Currently displayed question ID (for single view)
   */
  @property({ type: String })
  currentQuestionId: string | null = null;

  /**
   * View mode: 'single' shows one at a time, 'all' shows all pending
   */
  @property({ type: String })
  viewMode: 'single' | 'all' = 'single';

  /**
   * Whether completed section is expanded
   */
  @property({ type: Boolean })
  completedExpanded = false;

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Total question count (never changes)
   */
  private get _totalCount(): number {
    return this.allQuestions.length;
  }

  /**
   * Number of answered questions
   */
  private get _answeredCount(): number {
    return Array.from(this.questionStates.values()).filter(
      (s) => s.status === 'answered'
    ).length;
  }

  /**
   * Number of skipped questions
   */
  private get _skippedCount(): number {
    return Array.from(this.questionStates.values()).filter(
      (s) => s.status === 'skipped'
    ).length;
  }

  /**
   * Number of completed (answered + skipped)
   */
  private get _completedCount(): number {
    return this._answeredCount + this._skippedCount;
  }

  /**
   * Progress percentage
   */
  private get _progressPercent(): number {
    if (this._totalCount === 0) return 100;
    return Math.round((this._completedCount / this._totalCount) * 100);
  }

  /**
   * Pending questions (full objects)
   */
  private get _pendingQuestions(): Question[] {
    return this.allQuestions.filter((q) =>
      this.pendingQuestionIds.includes(q.id)
    );
  }

  /**
   * Current question object
   */
  private get _currentQuestion(): Question | null {
    if (!this.currentQuestionId) return null;
    return (
      this.allQuestions.find((q) => q.id === this.currentQuestionId) ?? null
    );
  }

  /**
   * Current question index in pending list (for "Question X of Y" display)
   */
  private get _currentPendingIndex(): number {
    if (!this.currentQuestionId) return -1;
    return this.pendingQuestionIds.indexOf(this.currentQuestionId);
  }

  /**
   * Completed questions (answered or skipped)
   */
  private get _completedQuestions(): AnsweredQuestion[] {
    return this.allQuestions
      .filter((q) => {
        const state = this.questionStates.get(q.id);
        return state && state.status !== 'pending';
      })
      .map((q) => {
        const state = this.questionStates.get(q.id)!;
        return {
          question: q,
          answer: state.answer,
          skipped: state.status === 'skipped',
        };
      });
  }

  // ============================================================================
  // Event Handlers - Just emit events, parent handles state
  // ============================================================================

  /**
   * Handle answer from question card
   */
  private _handleAnswer(e: CustomEvent<QuestionAnswer>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('answer', {
        bubbles: true,
        composed: true,
        detail: e.detail,
      })
    );
  }

  /**
   * Handle skip from question card
   */
  private _handleSkip(e: CustomEvent<{ questionId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('skip', {
        bubbles: true,
        composed: true,
        detail: e.detail,
      })
    );
  }

  /**
   * Skip all remaining questions
   */
  private _handleSkipAll() {
    this.dispatchEvent(
      new CustomEvent('skip-all', {
        bubbles: true,
        composed: true,
        detail: { questionIds: this.pendingQuestionIds },
      })
    );
  }

  /**
   * Navigate to previous question
   */
  private _goToPrevious() {
    const currentIdx = this._currentPendingIndex;
    if (currentIdx > 0) {
      this.dispatchEvent(
        new CustomEvent('navigate', {
          bubbles: true,
          composed: true,
          detail: { questionId: this.pendingQuestionIds[currentIdx - 1] },
        })
      );
    }
  }

  /**
   * Navigate to next question
   */
  private _goToNext() {
    const currentIdx = this._currentPendingIndex;
    if (currentIdx < this.pendingQuestionIds.length - 1) {
      this.dispatchEvent(
        new CustomEvent('navigate', {
          bubbles: true,
          composed: true,
          detail: { questionId: this.pendingQuestionIds[currentIdx + 1] },
        })
      );
    }
  }

  /**
   * Change view mode
   */
  private _setViewMode(mode: 'single' | 'all') {
    this.dispatchEvent(
      new CustomEvent('view-mode-change', {
        bubbles: true,
        composed: true,
        detail: { mode },
      })
    );
  }

  /**
   * Toggle completed section
   */
  private _toggleCompleted() {
    this.completedExpanded = !this.completedExpanded;
  }

  // ============================================================================
  // Render Methods
  // ============================================================================

  /**
   * Render progress bar
   */
  private _renderProgress() {
    return html`
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">Progress</span>
          <span class="progress-count">
            ${this._completedCount} of ${this._totalCount} completed
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: ${this._progressPercent}%"
          ></div>
        </div>
      </div>
    `;
  }

  /**
   * Render single view navigation
   */
  private _renderNavigation() {
    if (this.viewMode !== 'single' || this.pendingQuestionIds.length <= 1) {
      return nothing;
    }

    const currentIdx = this._currentPendingIndex;
    const pendingCount = this.pendingQuestionIds.length;

    return html`
      <div class="question-navigation">
        <span class="nav-info">
          Question ${currentIdx + 1} of ${pendingCount} remaining
        </span>
        <div class="nav-buttons">
          <tx-button
            variant="secondary"
            size="sm"
            ?disabled=${currentIdx <= 0}
            @click=${this._goToPrevious}
          >
            Previous
          </tx-button>
          <tx-button
            variant="secondary"
            size="sm"
            ?disabled=${currentIdx >= pendingCount - 1}
            @click=${this._goToNext}
          >
            Next
          </tx-button>
        </div>
      </div>
    `;
  }

  /**
   * Render completed questions section
   */
  private _renderCompletedSection() {
    const completed = this._completedQuestions;
    if (completed.length === 0) {
      return nothing;
    }

    return html`
      <div class="completed-section">
        <div class="completed-header" @click=${this._toggleCompleted}>
          <span class="completed-title">
            Completed (${completed.length})
          </span>
          <span
            class="collapse-icon ${this.completedExpanded ? 'expanded' : ''}"
          >
          </span>
        </div>
        ${this.completedExpanded
          ? html`
              <div class="completed-list">
                ${completed.map(
                  (aq) => html`
                    <div class="question-wrapper">
                      <tx-question-card
                        .question=${aq.question}
                        ?answered=${!aq.skipped}
                        ?skipped=${aq.skipped}
                        .submittedAnswer=${aq.answer}
                      ></tx-question-card>
                    </div>
                  `
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  /**
   * Render empty state
   */
  private _renderEmptyState() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No Questions</div>
        <div class="empty-description">
          No clarifying questions at this time.
        </div>
      </div>
    `;
  }

  /**
   * Render all complete state
   */
  private _renderAllComplete() {
    return html`
      <div class="all-complete">
        <div class="complete-icon">✓</div>
        <div class="complete-title">All Questions Completed</div>
        <div class="complete-description">
          You've completed all clarifying questions.
        </div>
      </div>
    `;
  }

  /**
   * Render questions in single view mode
   */
  private _renderSingleView() {
    const question = this._currentQuestion;
    if (!question) {
      return nothing;
    }

    return html`
      <tx-question-card
        .question=${question}
        @answer=${this._handleAnswer}
        @skip=${this._handleSkip}
      ></tx-question-card>
    `;
  }

  /**
   * Render questions in all view mode
   */
  private _renderAllView() {
    return html`
      ${this._pendingQuestions.map(
        (q) => html`
          <div class="question-wrapper">
            <tx-question-card
              .question=${q}
              @answer=${this._handleAnswer}
              @skip=${this._handleSkip}
            ></tx-question-card>
          </div>
        `
      )}
    `;
  }

  render() {
    const hasPendingQuestions = this.pendingQuestionIds.length > 0;
    const hasCompletedQuestions = this._completedCount > 0;
    const hasAnyQuestions = this._totalCount > 0;

    return html`
      <div class="refinement-panel">
        <!-- Header -->
        <div class="panel-header">
          <div class="header-left">
            <span class="panel-title">Clarifying Questions</span>
            ${hasPendingQuestions
              ? html`<span class="question-count"
                  >${this.pendingQuestionIds.length} remaining</span
                >`
              : nothing}
          </div>
          <div class="header-actions">
            ${hasPendingQuestions
              ? html`
                  <div class="view-toggle">
                    <button
                      class="view-toggle-btn ${this.viewMode === 'single'
                        ? 'active'
                        : ''}"
                      @click=${() => this._setViewMode('single')}
                    >
                      One at a time
                    </button>
                    <button
                      class="view-toggle-btn ${this.viewMode === 'all'
                        ? 'active'
                        : ''}"
                      @click=${() => this._setViewMode('all')}
                    >
                      Show all
                    </button>
                  </div>
                  <button class="skip-all-btn" @click=${this._handleSkipAll}>
                    Skip All
                  </button>
                `
              : nothing}
          </div>
        </div>

        <!-- Progress -->
        ${hasAnyQuestions ? this._renderProgress() : nothing}

        <!-- Questions -->
        ${!hasPendingQuestions && !hasCompletedQuestions
          ? this._renderEmptyState()
          : !hasPendingQuestions && hasCompletedQuestions
            ? this._renderAllComplete()
            : html`
                <div class="questions-container">
                  ${this.viewMode === 'single'
                    ? this._renderSingleView()
                    : this._renderAllView()}
                </div>
              `}

        <!-- Navigation (Single View) -->
        ${hasPendingQuestions ? this._renderNavigation() : nothing}

        <!-- Completed Section -->
        ${this._renderCompletedSection()}
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-refinement-panel': TxRefinementPanel;
  }
}
