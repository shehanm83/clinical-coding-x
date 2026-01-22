import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';

// Import session context
import {
  sessionContext,
  type SessionContextValue,
  type Session,
  type SessionState,
  type SessionError,
  type QuestionResponse,
  type Question,
  defaultSessionContext,
} from '../../state/contexts/session-context.js';

// Import services
import {
  ApiService,
  ApiError,
  type CcxSession,
  type CcxAnswerResponse,
  type DrillingQuestion,
} from '../../services/api.js';
import {
  WebSocketService,
  type ConnectionState,
  type StateChangeData,
  type ProgressData,
  type TermsExtractedData,
  type QuestionsReadyData,
  type ExpressionReadyData,
  type ErrorData,
} from '../../services/websocket.js';

// Import clinical coding components
import '../../components/features/coding/tx-clinical-input.js';
import '../../components/features/coding/tx-context-options.js';
import '../../components/features/coding/tx-progress-stepper.js';
import '../../components/features/coding/tx-processing-indicator.js';
import '../../components/features/coding/tx-extracted-terms.js';
import '../../components/features/coding/tx-refinement-panel.js';
import type { QuestionState } from '../../components/features/coding/tx-refinement-panel.js';
import '../../components/features/coding/tx-expression-preview.js';
import '../../components/features/coding/tx-session-actions.js';
import '../../components/features/coding/tx-completion-modal.js';
import '../../components/features/coding/tx-session-history.js';
import '../../components/features/coding/tx-term-card-skeleton.js';
// Two-tier results and tree traversal components
import '../../components/features/coding/tx-two-tier-results.js';
import '../../components/features/coding/tx-traversal-question.js';
import type { ValidatedMatch, RelatedConcept } from '../../components/features/coding/tx-two-tier-results.js';
import type { TraversalQuestion } from '../../components/features/coding/tx-traversal-question.js';

// CCX Drilling Workflow Components
import '../../components/features/coding/tx-drilling-breadcrumb.js';
import '../../components/features/coding/tx-focus-panel.js';
import '../../components/features/coding/tx-ccx-question-card.js';
import type { CcxQuestionAnswer } from '../../components/features/coding/tx-ccx-question-card.js';

import type {
  ClinicalInputEvent,
  ContextOptions,
  StepId,
} from '../../components/features/coding/index.js';

/**
 * Mobile tab identifiers
 */
type MobileTab = 'terms' | 'questions' | 'ecl';

/**
 * Retry configuration for error recovery
 */
const RETRY_DELAYS = [1000, 2000, 4000, 8000];

/**
 * Coding page - Main clinical coding interface.
 *
 * Integrates all Epic 7 components into a cohesive workflow:
 * - Clinical input with context options
 * - Progress stepper for workflow visualization
 * - Two-column panels for terms and questions
 * - Expression preview and session actions
 * - Real-time updates via WebSocket
 *
 * @element coding-page
 * @fires session-created - When a new session is created
 * @fires session-completed - When a session is completed
 */
@customElement('coding-page')
export class CodingPage extends LitElement {
  static styles = css`
    :host {
      display: grid;
      grid-template-rows: auto auto auto 1fr auto auto;
      gap: var(--space-4, 16px);
      height: 100%;
      padding: var(--space-6, 24px);
      max-width: 1400px;
      margin: 0 auto;
      box-sizing: border-box;
    }

    /* Header section */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4, 16px);
    }

    .header-title {
      margin: 0;
      font-size: var(--text-2xl, 24px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .header-subtitle {
      margin: var(--space-1, 4px) 0 0;
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
    }

    .header-actions {
      display: flex;
      gap: var(--space-2, 8px);
    }

    /* Input section */
    .input-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 12px);
    }

    .context-options-wrapper {
      overflow: hidden;
      transition: max-height var(--duration-normal, 250ms) var(--easing-default);
    }

    .context-options-wrapper.collapsed {
      max-height: 0;
    }

    .context-options-wrapper.expanded {
      max-height: 200px;
    }

    /* Progress section */
    .progress-section {
      padding: var(--space-1, 4px) 0;
    }

    /* Main panels section */
    .panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4, 16px);
      min-height: 0;
      overflow: hidden;
    }

    .panel {
      display: flex;
      flex-direction: column;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      background: var(--color-background, #f9fafb);
    }

    .panel-title {
      margin: 0;
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .panel-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 var(--space-1, 4px);
      background: var(--color-primary, #2563eb);
      color: white;
      font-size: 10px;
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-full, 9999px);
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-2, 8px);
    }

    /* Expression preview section */
    .expression-section {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }

    /* Actions section */
    .actions-section {
      position: sticky;
      bottom: 0;
      background: var(--color-background, #f9fafb);
      padding: var(--space-4, 16px) 0 0;
      border-top: 1px solid var(--color-border, #e5e7eb);
      margin: 0 calc(-1 * var(--space-6, 24px));
      padding-left: var(--space-6, 24px);
      padding-right: var(--space-6, 24px);
    }

    /* Error state */
    .error-banner {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
      padding: var(--space-4, 16px);
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md, 8px);
      color: var(--color-error, #dc2626);
    }

    .error-banner svg {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    .error-message {
      flex: 1;
      font-size: var(--text-sm, 14px);
    }

    .error-actions {
      display: flex;
      gap: var(--space-2, 8px);
    }

    .retry-button {
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-error, #dc2626);
      color: white;
      border: none;
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
      cursor: pointer;
      transition: background var(--duration-fast, 150ms);
    }

    .retry-button:hover {
      background: #b91c1c;
    }

    .dismiss-button {
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: transparent;
      color: var(--color-error, #dc2626);
      border: 1px solid currentColor;
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
      cursor: pointer;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--space-8, 32px);
      color: var(--color-text-muted, #9ca3af);
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: var(--space-4, 16px);
      opacity: 0.5;
    }

    .empty-state-text {
      font-size: var(--text-sm, 14px);
    }

    /* Loading skeletons */
    .skeleton-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 12px);
    }

    /* Connection status indicator */
    .connection-status {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #9ca3af);
    }

    .connection-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-text-muted, #9ca3af);
    }

    .connection-dot.connected {
      background: var(--color-success, #16a34a);
    }

    .connection-dot.connecting,
    .connection-dot.reconnecting {
      background: var(--color-warning, #ca8a04);
      animation: pulse 1.5s infinite;
    }

    .connection-dot.failed {
      background: var(--color-error, #dc2626);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Mobile tab bar (hidden on desktop) */
    .mobile-tabs {
      display: none;
    }

    /* Mobile panel content (hidden on desktop) */
    .mobile-panel-content {
      display: none;
    }

    /* Floating action button (hidden on desktop) */
    .fab {
      display: none;
    }

    /* ===== RESPONSIVE STYLES ===== */

    /* Tablet: 768px - 1023px */
    @media (max-width: 1023px) {
      :host {
        padding: var(--space-4, 16px);
        gap: var(--space-3, 12px);
      }

      .panels {
        grid-template-columns: 1fr;
        gap: var(--space-4, 16px);
      }

      .panel {
        max-height: 400px;
      }
    }

    /* Mobile: < 768px */
    @media (max-width: 767px) {
      :host {
        grid-template-rows: auto auto auto 1fr auto auto auto;
        padding: var(--space-3, 12px);
        padding-bottom: calc(var(--space-3, 12px) + 80px); /* Space for FAB */
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-title {
        font-size: var(--text-xl, 20px);
      }

      /* Hide desktop panels on mobile */
      .panels {
        display: none;
      }

      /* Show mobile tab bar */
      .mobile-tabs {
        display: flex;
        justify-content: space-around;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: var(--radius-lg, 12px);
        padding: var(--space-2, 8px);
      }

      .mobile-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1, 4px);
        padding: var(--space-2, 8px) var(--space-4, 16px);
        background: transparent;
        border: none;
        border-radius: var(--radius-md, 8px);
        color: var(--color-text-muted, #9ca3af);
        font-size: var(--text-xs, 12px);
        cursor: pointer;
        transition: all var(--duration-fast, 150ms);
        position: relative;
        min-width: 80px;
      }

      .mobile-tab:hover {
        background: var(--color-background, #f9fafb);
      }

      .mobile-tab.active {
        color: var(--color-primary, #2563eb);
        background: var(--color-primary-light, #dbeafe);
      }

      .mobile-tab-icon {
        font-size: var(--text-lg, 18px);
      }

      .mobile-tab-badge {
        position: absolute;
        top: 2px;
        right: 8px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        background: var(--color-primary, #2563eb);
        color: white;
        font-size: 10px;
        font-weight: var(--font-weight-medium, 500);
        border-radius: var(--radius-full, 9999px);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Mobile panel content */
      .mobile-panel-content {
        display: block;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: var(--radius-lg, 12px);
        padding: var(--space-4, 16px);
        min-height: 200px;
        max-height: 400px;
        overflow-y: auto;
      }

      /* Show FAB on mobile */
      .fab {
        display: flex;
        position: fixed;
        bottom: 80px;
        right: var(--space-4, 16px);
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--color-primary, #2563eb);
        color: white;
        border: none;
        box-shadow: var(--shadow-lg);
        align-items: center;
        justify-content: center;
        font-size: var(--text-xl, 20px);
        cursor: pointer;
        z-index: var(--z-sticky, 200);
        transition: transform var(--duration-fast, 150ms),
                    background var(--duration-fast, 150ms),
                    opacity var(--duration-fast, 150ms);
      }

      .fab:hover {
        background: var(--color-primary-hover, #1d4ed8);
        transform: scale(1.05);
      }

      .fab:active {
        transform: scale(0.95);
      }

      .fab:disabled {
        background: var(--color-text-muted, #9ca3af);
        cursor: not-allowed;
        transform: none;
      }

      .fab.hidden {
        transform: translateY(100px);
        opacity: 0;
        pointer-events: none;
      }

      /* Hide desktop actions bar on mobile */
      .actions-section {
        display: none;
      }

      /* Expression section adjustments */
      .expression-section {
        margin-bottom: var(--space-4, 16px);
      }
    }

    /* Swipe container for mobile */
    .swipe-container {
      touch-action: pan-y pinch-zoom;
    }
  `;

  // ============================================================================
  // Properties
  // ============================================================================

  /** Session ID from URL parameter */
  @property({ type: String })
  sessionId?: string;

  // ============================================================================
  // Session Context Provider
  // ============================================================================

  @provide({ context: sessionContext })
  @state()
  private _sessionContext: SessionContextValue = {
    ...defaultSessionContext,
    createSession: this._createSession.bind(this),
    confirmConcepts: this._confirmConcepts.bind(this),
    submitResponses: this._submitResponses.bind(this),
    skipQuestions: this._skipQuestions.bind(this),
    clearSession: this._clearSession.bind(this),
    refreshSession: this._refreshSession.bind(this),
  };

  // ============================================================================
  // Internal State
  // ============================================================================

  @state()
  private _session: Session | null = null;

  /** CCX Session (new drilling workflow) */
  @state()
  private _ccxSession: CcxSession | null = null;

  @state()
  private _loading = false;

  @state()
  private _error: SessionError | null = null;

  @state()
  private _context: ContextOptions = {};

  @state()
  private _contextExpanded = false;

  @state()
  private _showCompletionModal = false;

  @state()
  private _showHistorySidebar = false;

  @state()
  private _connectionState: ConnectionState = 'disconnected';

  @state()
  private _progress: { step: string; percentComplete: number } | null = null;

  @state()
  private _hasUnsavedChanges = false;

  /** Mobile active tab */
  @state()
  private _mobileActiveTab: MobileTab = 'terms';

  /** Keyboard visibility (mobile) */
  @state()
  private _keyboardOpen = false;

  /** Touch tracking for swipe gestures */
  private _touchStartX = 0;
  private _touchStartY = 0;

  // ============================================================================
  // Question State Management (ID-based)
  // ============================================================================

  /** All questions (full original list, never shrinks) */
  @state()
  private _allQuestions: Question[] = [];

  /** Map of question ID to state (pending/answered/skipped) */
  @state()
  private _questionStates: Map<string, QuestionState> = new Map();

  /** Currently displayed question ID */
  @state()
  private _currentQuestionId: string | null = null;

  /** Refinement panel view mode */
  @state()
  private _refinementViewMode: 'single' | 'all' = 'single';

  // ============================================================================
  // Services
  // ============================================================================

  private _api = new ApiService();
  private _ws = new WebSocketService();
  private _wsUnsubscribers: (() => void)[] = [];
  private _pollingInterval: ReturnType<typeof setInterval> | null = null;

  // ============================================================================
  // Queries
  // ============================================================================

  @query('.swipe-container')
  private _swipeContainer?: HTMLElement;

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connectedCallback(): void {
    super.connectedCallback();

    // Check for session ID in URL
    this._handleUrlParameters();

    // Listen for browser navigation
    window.addEventListener('popstate', this._handlePopState);

    // Listen for keyboard visibility on mobile
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', this._handleViewportResize);
    }

    // Setup WebSocket event listeners
    this._setupWebSocketListeners();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    // Remove event listeners
    window.removeEventListener('popstate', this._handlePopState);
    if ('visualViewport' in window) {
      window.visualViewport?.removeEventListener('resize', this._handleViewportResize);
    }

    // Cleanup WebSocket
    this._cleanupWebSocket();

    // Cleanup polling
    this._stopPolling();
  }

  // ============================================================================
  // URL Parameter Handling
  // ============================================================================

  private _handleUrlParameters(): void {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');

    if (sessionId) {
      this._loadSession(sessionId);
    }
  }

  private _handlePopState = (): void => {
    this._handleUrlParameters();
  };

  private _updateUrl(sessionId: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.pushState({ sessionId }, '', url.toString());
  }

  private _clearUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.pushState({}, '', url.toString());
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  private async _createSession(
    text: string,
    _context?: { specialty?: string; setting?: string }
  ): Promise<void> {
    this._setLoading(true);
    this._setError(null);

    try {
      // Use CCX API with question generation
      const ccxSession = await this._api.createCcxSession(text, true);
      this._ccxSession = ccxSession;

      // Update URL
      this._updateUrl(ccxSession.sessionId);

      this.dispatchEvent(
        new CustomEvent('session-created', {
          detail: { sessionId: ccxSession.sessionId },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this._handleApiError(error);
    } finally {
      this._setLoading(false);
    }
  }

  private async _loadSession(sessionId: string): Promise<void> {
    this._setLoading(true);
    this._setError(null);

    try {
      // Use CCX API to load session
      const ccxSession = await this._api.getCcxSession(sessionId);
      this._ccxSession = ccxSession;

      // Update URL
      this._updateUrl(sessionId);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SESSION_NOT_FOUND') {
        this._setError({
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found. It may have expired or been deleted.',
        });
        this._clearUrl();
      } else {
        this._handleApiError(error);
      }
    } finally {
      this._setLoading(false);
    }
  }

  private async _confirmConcepts(
    selections: { termIndex: number; conceptId: string }[]
  ): Promise<void> {
    if (!this._session) return;

    this._setLoading(true);
    this._setError(null);

    try {
      const session = await this._api.confirmConcepts(this._session.id, selections);
      this._setSession(session);
      this._hasUnsavedChanges = true;
    } catch (error) {
      this._handleApiError(error);
    } finally {
      this._setLoading(false);
    }
  }

  private async _skipTerm(termIndex: number): Promise<void> {
    if (!this._session) return;

    this._setLoading(true);
    this._setError(null);

    try {
      const session = await this._api.skipTerm(this._session.id, termIndex);
      this._setSession(session);
      this._hasUnsavedChanges = true;
    } catch (error) {
      this._handleApiError(error);
    } finally {
      this._setLoading(false);
    }
  }

  private async _submitResponses(responses: QuestionResponse[]): Promise<void> {
    if (!this._session) return;

    this._setLoading(true);
    this._setError(null);

    try {
      const session = await this._api.submitResponses(this._session.id, responses);
      this._setSession(session);
      this._hasUnsavedChanges = true;
    } catch (error) {
      this._handleApiError(error);
    } finally {
      this._setLoading(false);
    }
  }

  private async _skipQuestions(questionIds?: string[]): Promise<void> {
    if (!this._session) return;

    this._setLoading(true);
    this._setError(null);

    try {
      const session = await this._api.skipQuestions(this._session.id, questionIds);
      this._setSession(session);
    } catch (error) {
      this._handleApiError(error);
    } finally {
      this._setLoading(false);
    }
  }

  private async _refreshSession(): Promise<void> {
    if (!this._session) return;
    await this._loadSession(this._session.id);
  }

  private _clearSession(): void {
    this._cleanupWebSocket();
    this._stopPolling();
    this._setSession(null);
    this._ccxSession = null;  // Clear CCX session
    this._setError(null);
    this._progress = null;
    this._hasUnsavedChanges = false;
    this._showCompletionModal = false;
    this._clearUrl();
  }

  // ============================================================================
  // WebSocket Integration
  // ============================================================================

  private _setupWebSocketListeners(): void {
    // Connection state changes
    this._wsUnsubscribers.push(
      this._ws.on('connection_state', (state: ConnectionState) => {
        this._connectionState = state;
      })
    );

    // Connection failed - fallback to polling
    this._wsUnsubscribers.push(
      this._ws.on('connection_failed', () => {
        console.warn('[CodingPage] WebSocket failed, falling back to polling');
        this._startPolling();
      })
    );

    // State change events
    this._wsUnsubscribers.push(
      this._ws.on('state_change', (data: StateChangeData) => {
        if (this._session) {
          this._setSession({
            ...this._session,
            state: data.current,
          });
        }
      })
    );

    // Progress updates
    this._wsUnsubscribers.push(
      this._ws.on('progress', (data: ProgressData) => {
        this._progress = {
          step: data.step,
          percentComplete: data.percentComplete,
        };
      })
    );

    // Terms extracted
    this._wsUnsubscribers.push(
      this._ws.on('terms_extracted', (data: TermsExtractedData) => {
        if (this._session) {
          this._setSession({
            ...this._session,
            extractedTerms: data.terms,
          });
        }
      })
    );

    // Questions ready
    this._wsUnsubscribers.push(
      this._ws.on('questions_ready', (data: QuestionsReadyData) => {
        if (this._session) {
          this._setSession({
            ...this._session,
            pendingQuestions: data.questions,
          });
          // Auto-switch to questions tab on mobile
          this._mobileActiveTab = 'questions';
        }
      })
    );

    // Expression ready
    this._wsUnsubscribers.push(
      this._ws.on('expression_ready', (data: ExpressionReadyData) => {
        if (this._session) {
          // Refresh to get full expression data
          this._refreshSession();
          this._showCompletionModal = true;
          // Auto-switch to ECL tab on mobile
          this._mobileActiveTab = 'ecl';
        }
      })
    );

    // Error events
    this._wsUnsubscribers.push(
      this._ws.on('error', (data: ErrorData) => {
        this._setError({
          code: data.code,
          message: data.message,
        });
      })
    );
  }

  private _connectWebSocket(sessionId: string): void {
    this._ws.connect(sessionId);
  }

  private _cleanupWebSocket(): void {
    this._wsUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this._wsUnsubscribers = [];
    this._ws.disconnect();
  }

  // ============================================================================
  // Polling Fallback
  // ============================================================================

  private _startPolling(): void {
    if (this._pollingInterval) return;

    this._pollingInterval = setInterval(async () => {
      if (this._session && !this._loading) {
        try {
          await this._refreshSession();
        } catch (error) {
          console.error('[CodingPage] Polling error:', error);
        }
      }
    }, 3000);
  }

  private _stopPolling(): void {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private _handleApiError(error: unknown): void {
    if (error instanceof ApiError) {
      this._setError({
        code: error.code,
        message: error.message,
        details: error.details,
      });

      // Attempt retry for recoverable errors
      if (error.isRetryable()) {
        this._retryWithBackoff();
      }
    } else if (error instanceof Error) {
      this._setError({
        code: 'UNKNOWN',
        message: error.message,
      });
    } else {
      this._setError({
        code: 'UNKNOWN',
        message: 'An unexpected error occurred',
      });
    }
  }

  private async _retryWithBackoff(): Promise<void> {
    for (const delay of RETRY_DELAYS) {
      await new Promise((r) => setTimeout(r, delay));

      try {
        await this._refreshSession();
        this._setError(null);
        return;
      } catch {
        continue;
      }
    }

    this._setError({
      code: 'RETRY_EXHAUSTED',
      message: 'Unable to reconnect after multiple attempts. Please try again.',
    });
  }

  // ============================================================================
  // State Helpers
  // ============================================================================

  private _setSession(session: Session | null): void {
    this._session = session;
    this._updateSessionContext();

    if (session) {
      // Sync questions from session
      this._syncQuestionsFromSession(session);
    } else {
      // Clear all question state when session is cleared
      this._allQuestions = [];
      this._questionStates = new Map();
      this._currentQuestionId = null;
    }

    // Check for completion
    if (session?.state === 'completed' && session.expression) {
      this._showCompletionModal = true;
      this.dispatchEvent(
        new CustomEvent('session-completed', {
          detail: { sessionId: session.id, expression: session.expression },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Sync question state from session data
   * This reconciles backend state with our local tracking while preserving optimistic updates
   */
  private _syncQuestionsFromSession(session: Session): void {
    const pendingQuestions = session.pendingQuestions || [];
    const responses = session.responses || [];

    // Add any new pending questions to allQuestions (never remove)
    const existingIds = new Set(this._allQuestions.map((q) => q.id));
    const newQuestions = pendingQuestions.filter((q) => !existingIds.has(q.id));
    if (newQuestions.length > 0) {
      this._allQuestions = [...this._allQuestions, ...newQuestions];
    }

    // Note: We don't add questions from responses because we don't have the full
    // Question object there - only the questionId. The questions should have been
    // added when they were first seen in pendingQuestions.

    // Build pending ID set and response map
    const pendingIds = new Set(pendingQuestions.map((q) => q.id));
    const responseMap = new Map(responses.map((r) => [r.questionId, r]));

    // Update question states based on backend data, preserving optimistic updates
    const newStates = new Map<string, QuestionState>();

    for (const question of this._allQuestions) {
      const existingState = this._questionStates.get(question.id);

      if (pendingIds.has(question.id)) {
        // Backend says pending - but preserve optimistic answered/skipped state
        if (existingState?.status === 'answered' || existingState?.status === 'skipped') {
          // Keep our optimistic update - backend will catch up
          newStates.set(question.id, existingState);
        } else {
          newStates.set(question.id, { status: 'pending' });
        }
      } else {
        // Not pending according to backend
        const response = responseMap.get(question.id);
        if (response) {
          // Backend has the response - use it
          newStates.set(question.id, {
            status: 'answered',
            answer: {
              questionId: response.questionId,
              value: response.value,
              conceptId: response.conceptId,
            },
          });
        } else if (existingState?.status === 'answered') {
          // Preserve optimistic answer (backend hasn't synced yet)
          newStates.set(question.id, existingState);
        } else if (existingState?.status === 'skipped') {
          // Preserve optimistic skip
          newStates.set(question.id, existingState);
        } else {
          // No backend data and no optimistic state - mark as skipped
          // This handles questions that were removed from pending without explicit action
          newStates.set(question.id, { status: 'skipped' });
        }
      }
    }

    this._questionStates = newStates;

    // Set current question if not set or if current is no longer pending
    const currentPending = this._currentQuestionId
      ? newStates.get(this._currentQuestionId)?.status === 'pending'
      : false;

    if (!this._currentQuestionId || !currentPending) {
      // Find first pending question
      const firstPending = this._allQuestions.find(
        (q) => newStates.get(q.id)?.status === 'pending'
      );
      this._currentQuestionId = firstPending?.id ?? null;
    }
  }

  private _setLoading(loading: boolean): void {
    this._loading = loading;
    this._updateSessionContext();
  }

  private _setError(error: SessionError | null): void {
    this._error = error;
    this._updateSessionContext();
  }

  private _updateSessionContext(): void {
    this._sessionContext = {
      ...this._sessionContext,
      session: this._session,
      loading: this._loading,
      error: this._error,
    };
  }

  // ============================================================================
  // Mobile Support
  // ============================================================================

  private _handleViewportResize = (): void => {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const windowHeight = window.innerHeight;
    this._keyboardOpen = windowHeight - viewportHeight > 100;
  };

  private _handleTouchStart(e: TouchEvent): void {
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
  }

  private _handleTouchEnd(e: TouchEvent): void {
    const deltaX = e.changedTouches[0].clientX - this._touchStartX;
    const deltaY = e.changedTouches[0].clientY - this._touchStartY;

    // Check for horizontal swipe (with velocity consideration)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      // Respect prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (!prefersReducedMotion) {
        if (deltaX > 0) {
          this._swipePrevTab();
        } else {
          this._swipeNextTab();
        }
      }
    }
  }

  private _swipePrevTab(): void {
    const tabs: MobileTab[] = ['terms', 'questions', 'ecl'];
    const currentIndex = tabs.indexOf(this._mobileActiveTab);
    if (currentIndex > 0) {
      this._mobileActiveTab = tabs[currentIndex - 1];
    }
  }

  private _swipeNextTab(): void {
    const tabs: MobileTab[] = ['terms', 'questions', 'ecl'];
    const currentIndex = tabs.indexOf(this._mobileActiveTab);
    if (currentIndex < tabs.length - 1) {
      this._mobileActiveTab = tabs[currentIndex + 1];
    }
  }

  private _setMobileTab(tab: MobileTab): void {
    this._mobileActiveTab = tab;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  private _handleContextChange(e: CustomEvent<ContextOptions>): void {
    this._context = e.detail;
  }

  private _handleSubmit(e: CustomEvent<ClinicalInputEvent>): void {
    this._createSession(e.detail.text, this._context);
  }

  private _handleClear(): void {
    this._clearSession();
  }

  /**
   * Handle CCX question answer (from tx-ccx-question-card)
   */
  private async _handleCcxQuestionAnswer(e: CustomEvent<CcxQuestionAnswer>): Promise<void> {
    if (!this._ccxSession) return;

    const { questionId, selectedOptionIds, skipped } = e.detail;
    this._setLoading(true);

    try {
      const response = await this._api.answerCcxQuestion(
        this._ccxSession.sessionId,
        questionId,
        selectedOptionIds,
        skipped
      );

      // Update CCX session with new state
      this._ccxSession = {
        ...this._ccxSession,
        status: response.sessionStatus as CcxSession['status'],
        currentFocus: response.currentFocus,
        nextQuestion: response.nextQuestion,
        finalExpressions: response.finalExpressions,
        pendingQuestionCount: response.nextQuestion ? this._ccxSession.pendingQuestionCount - 1 : 0,
        answeredQuestionCount: this._ccxSession.answeredQuestionCount + 1,
      };

      // If drilled down, update drilling summary
      if (response.drilledDown && this._ccxSession.drillingSummary) {
        this._ccxSession = {
          ...this._ccxSession,
          drillingSummary: {
            ...this._ccxSession.drillingSummary,
            currentDepth: (this._ccxSession.drillingSummary.currentDepth || 0) + 1,
          },
        };
      }
    } catch (error) {
      this._handleApiError(error);
    } finally {
      this._setLoading(false);
    }
  }

  private _handleConceptSelect(
    e: CustomEvent<{ termIndex: number; conceptId: string }>
  ): void {
    this._confirmConcepts([
      { termIndex: e.detail.termIndex, conceptId: e.detail.conceptId },
    ]);
  }

  private _handleSkipTerm(e: CustomEvent<{ termIndex: number }>): void {
    const { termIndex } = e.detail;
    // Skip this term - don't include in ECL
    this._skipTerm(termIndex);
  }

  private _handleQuestionAnswer(
    e: CustomEvent<{ questionId: string; value: string | string[]; conceptId?: string }>
  ): void {
    const { questionId, value, conceptId } = e.detail;

    // Optimistic update - immediately mark as answered
    const currentState = this._questionStates.get(questionId);
    if (currentState) {
      const newStates = new Map(this._questionStates);
      newStates.set(questionId, {
        status: 'answered',
        answer: { questionId, value, conceptId },
      });
      this._questionStates = newStates;
    }

    // Advance to next pending question
    this._advanceToNextPending(questionId);

    // Submit to backend
    this._submitResponses([{ questionId, value, conceptId }]);
  }

  private _handleSkipQuestion(e: CustomEvent<{ questionId: string }>): void {
    const { questionId } = e.detail;

    // Optimistic update - immediately mark as skipped
    const currentState = this._questionStates.get(questionId);
    if (currentState) {
      const newStates = new Map(this._questionStates);
      newStates.set(questionId, { status: 'skipped' });
      this._questionStates = newStates;
    }

    // Advance to next pending question
    this._advanceToNextPending(questionId);

    // Submit to backend
    this._skipQuestions([questionId]);
  }

  private _handleSkipAll(e: CustomEvent<{ questionIds: string[] }>): void {
    const { questionIds } = e.detail;

    // Optimistic update - mark all as skipped
    const newStates = new Map(this._questionStates);
    for (const id of questionIds) {
      newStates.set(id, { status: 'skipped' });
    }
    this._questionStates = newStates;
    this._currentQuestionId = null;

    // Submit to backend
    this._skipQuestions(questionIds);
  }

  private _handleQuestionNavigate(e: CustomEvent<{ questionId: string }>): void {
    this._currentQuestionId = e.detail.questionId;
  }

  private _handleViewModeChange(e: CustomEvent<{ mode: 'single' | 'all' }>): void {
    this._refinementViewMode = e.detail.mode;
  }

  /**
   * Advance to the next pending question after answering/skipping
   */
  private _advanceToNextPending(currentId: string): void {
    const pendingIds = this._pendingQuestionIds;
    const currentIdx = pendingIds.indexOf(currentId);

    // Find next pending question (excluding the one just answered/skipped)
    const remaining = pendingIds.filter((id) => id !== currentId);

    if (remaining.length > 0) {
      // If there was a next question, use it; otherwise use first remaining
      const firstRemaining = remaining[0] ?? null;
      if (currentIdx !== -1 && currentIdx < pendingIds.length - 1) {
        // There's a next question in the original order
        const nextId = pendingIds[currentIdx + 1];
        this._currentQuestionId =
          nextId && remaining.includes(nextId) ? nextId : firstRemaining;
      } else {
        this._currentQuestionId = firstRemaining;
      }
    } else {
      this._currentQuestionId = null;
    }
  }

  /**
   * Get pending question IDs (computed from question states)
   */
  private get _pendingQuestionIds(): string[] {
    return this._allQuestions
      .filter((q) => {
        const state = this._questionStates.get(q.id);
        return !state || state.status === 'pending';
      })
      .map((q) => q.id);
  }

  private _handleSaveDraft(): void {
    // Save draft logic - could persist to localStorage or backend
    this._hasUnsavedChanges = false;
  }

  private _handleCopyExpression(e: CustomEvent<{ text: string }>): void {
    navigator.clipboard.writeText(e.detail.text).catch((err) => {
      console.error('[CodingPage] Failed to copy:', err);
    });
  }

  private _handleConfirm(): void {
    this._showCompletionModal = true;
  }

  private _handleCompletionClose(): void {
    this._showCompletionModal = false;
  }

  private _handleCompletionSave(): void {
    this._showCompletionModal = false;
    this._hasUnsavedChanges = false;
    // Could trigger additional save logic here
  }

  private _handleHistoryLoadSession(e: CustomEvent<{ sessionId: string }>): void {
    this._loadSession(e.detail.sessionId);
    this._showHistorySidebar = false;
  }

  private _handleRetry(): void {
    this._setError(null);
    if (this._session) {
      this._refreshSession();
    }
  }

  private _handleDismissError(): void {
    this._setError(null);
  }

  private _toggleContextOptions(): void {
    this._contextExpanded = !this._contextExpanded;
  }

  private _toggleHistory(): void {
    this._showHistorySidebar = !this._showHistorySidebar;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  private get _currentStep(): StepId {
    if (!this._session) return 'input';

    const stateToStep: Record<SessionState, StepId> = {
      initial: 'input',
      extracting: 'extracting',
      matching: 'matching',
      confirming: 'confirming',
      questioning: 'refining',
      building: 'building',
      completed: 'complete',
      error: 'input',
    };

    return stateToStep[this._session.state] || 'input';
  }

  private get _termCount(): number {
    return this._session?.extractedTerms?.length || 0;
  }

  private get _questionCount(): number {
    return this._session?.pendingQuestions?.length || 0;
  }

  private get _hasExpression(): boolean {
    // Check for expressions array first (new), then fallback to single expression (legacy)
    return (this._session?.expressions?.length ?? 0) > 0 || !!this._session?.expression;
  }

  private get _expressionCount(): number {
    return this._session?.expressions?.length ?? (this._session?.expression ? 1 : 0);
  }

  private get _expressionValid(): boolean {
    // Check all expressions if available, otherwise fallback to single expression
    if (this._session?.expressions?.length) {
      return this._session.expressions.every(e => e.validation?.valid ?? false);
    }
    return this._session?.expression?.validation?.valid ?? false;
  }

  private get _isProcessing(): boolean {
    return (
      this._session?.state === 'extracting' ||
      this._session?.state === 'matching' ||
      this._session?.state === 'building'
    );
  }

  // ============================================================================
  // Render Methods
  // ============================================================================

  render() {
    return html`
      ${this._renderHeader()}
      ${this._renderError()}
      ${this._renderInputSection()}
      ${this._renderProgressSection()}
      ${this._renderPanels()}
      ${this._renderMobileTabs()}
      ${this._renderMobilePanelContent()}
      ${this._renderExpressionSection()}
      ${this._renderActionsSection()}
      ${this._renderFab()}
      ${this._renderCompletionModal()}
    `;
  }

  private _renderHeader() {
    return html`
      <header class="page-header">
        <div>
          <h1 class="header-title">AI Clinical Coding</h1>
          <p class="header-subtitle">
            Enter clinical notes to receive AI-assisted SNOMED CT code suggestions
          </p>
        </div>
        <div class="header-actions">
          ${this._renderConnectionStatus()}
          <button
            class="history-button"
            @click=${this._toggleHistory}
            aria-label="Session history"
            style="
              padding: var(--space-2, 8px) var(--space-3, 12px);
              background: var(--color-surface, #fff);
              border: 1px solid var(--color-border, #e5e7eb);
              border-radius: var(--radius-md, 8px);
              cursor: pointer;
              font-size: var(--text-sm, 14px);
            "
          >
            📋 History
          </button>
        </div>
      </header>
    `;
  }

  private _renderConnectionStatus() {
    const statusMap: Record<ConnectionState, string> = {
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      connected: 'Connected',
      reconnecting: 'Reconnecting...',
      failed: 'Connection failed',
    };

    return html`
      <div class="connection-status">
        <span class="connection-dot ${this._connectionState}"></span>
        <span>${statusMap[this._connectionState]}</span>
      </div>
    `;
  }

  private _renderError() {
    if (!this._error) return nothing;

    return html`
      <div class="error-banner" role="alert">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="error-message">${this._error.message}</span>
        <div class="error-actions">
          ${this._error.code !== 'SESSION_NOT_FOUND'
            ? html`
                <button class="retry-button" @click=${this._handleRetry}>
                  Retry
                </button>
              `
            : nothing}
          <button class="dismiss-button" @click=${this._handleDismissError}>
            Dismiss
          </button>
        </div>
      </div>
    `;
  }

  private _renderInputSection() {
    return html`
      <section class="input-section">
        <div
          class="context-options-wrapper ${this._contextExpanded
            ? 'expanded'
            : 'collapsed'}"
        >
          <tx-context-options
            .context=${this._context}
            @context-change=${this._handleContextChange}
          ></tx-context-options>
        </div>

        <tx-clinical-input
          .context=${this._context}
          .loading=${this._loading}
          @submit=${this._handleSubmit}
          @clear=${this._handleClear}
          @toggle-options=${this._toggleContextOptions}
          autofocus
        ></tx-clinical-input>
      </section>
    `;
  }

  private _renderProgressSection() {
    return html`
      <section class="progress-section">
        <tx-progress-stepper
          .currentStep=${this._currentStep}
          .progress=${this._progress?.percentComplete}
        ></tx-progress-stepper>

        ${this._isProcessing
          ? html`
              <tx-processing-indicator
                .state=${this._session?.state}
                .detail=${this._progress?.step}
              ></tx-processing-indicator>
            `
          : nothing}
      </section>
    `;
  }

  private _renderPanels() {
    // If we have a CCX session, render the CCX workflow
    if (this._ccxSession) {
      return this._renderCcxPanels();
    }

    return html`
      <section class="panels">
        ${this._renderTermsPanel()} ${this._renderQuestionsPanel()}
      </section>
    `;
  }

  /**
   * Render CCX drilling workflow panels
   */
  private _renderCcxPanels() {
    const session = this._ccxSession!;
    const focus = session.currentFocus;
    const question = session.nextQuestion;
    const drilling = session.drillingSummary;

    return html`
      <section class="panels">
        <!-- Left Panel: Focus Concept -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Focus Concept</h2>
          </div>
          <div class="panel-content">
            <tx-focus-panel
              .focusConcept=${focus ? {
                conceptId: focus.conceptId,
                conceptTerm: focus.conceptTerm,
                semanticTag: focus.semanticTag,
                originalPhrase: focus.originalPhrase,
                depth: focus.depth,
                parentConceptId: focus.parentConceptId,
              } : null}
            ></tx-focus-panel>

            ${drilling && drilling.path.length > 0 ? html`
              <div style="margin-top: var(--space-4, 16px);">
                <tx-drilling-breadcrumb
                  .path=${drilling.path.map(p => ({
                    conceptId: p.conceptId,
                    term: p.term,
                    depth: p.depth,
                  }))}
                  .currentDepth=${drilling.currentDepth}
                  .maxDepth=${drilling.maxDepth}
                ></tx-drilling-breadcrumb>
              </div>
            ` : nothing}
          </div>
        </div>

        <!-- Right Panel: Current Question -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Refinement Questions</h2>
            ${session.pendingQuestionCount > 0
              ? html`<span class="panel-badge">${session.pendingQuestionCount}</span>`
              : nothing}
          </div>
          <div class="panel-content">
            ${this._renderCcxQuestionContent()}
          </div>
        </div>
      </section>

      <!-- Final Expressions -->
      ${session.finalExpressions.length > 0 ? html`
        <section class="expression-section" style="margin-top: var(--space-4, 16px);">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Final Expressions</h2>
            </div>
            <div class="panel-content">
              ${session.finalExpressions.map(expr => html`
                <div style="
                  font-family: var(--font-mono, monospace);
                  font-size: var(--text-sm, 14px);
                  padding: var(--space-3, 12px);
                  background: var(--color-background, #f9fafb);
                  border-radius: var(--radius-md, 8px);
                  margin-bottom: var(--space-2, 8px);
                  word-break: break-all;
                ">
                  ${expr}
                </div>
              `)}
            </div>
          </div>
        </section>
      ` : nothing}
    `;
  }

  /**
   * Render CCX question content
   */
  private _renderCcxQuestionContent() {
    const session = this._ccxSession;
    if (!session) return nothing;

    // Session complete
    if (session.status === 'complete') {
      return html`
        <div class="empty-state" style="text-align: center; padding: var(--space-6, 24px);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: var(--space-3, 12px); color: var(--color-success, #16a34a);">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="empty-state-text" style="color: var(--color-success, #16a34a); font-weight: 600;">
            Coding Complete!
          </span>
          <p style="margin-top: var(--space-2, 8px); color: var(--color-text-muted);">
            All questions answered. See final expressions above.
          </p>
        </div>
      `;
    }

    // No question available
    const question = session.nextQuestion;
    if (!question) {
      return html`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <span class="empty-state-text">
            ${this._loading ? 'Loading questions...' : 'No questions at this time'}
          </span>
        </div>
      `;
    }

    // Render the CCX question card
    return html`
      <tx-ccx-question-card
        .question=${{
          id: question.id,
          questionType: question.questionType,
          priority: question.priority,
          sourceConceptId: question.sourceConceptId,
          sourceConceptTerm: question.sourceConceptTerm,
          attributeId: question.attributeId,
          attributeName: question.attributeName,
          text: question.text,
          options: question.options.map(o => ({
            conceptId: o.conceptId,
            displayText: o.displayText,
            fsn: o.fsn,
            semanticTag: o.semanticTag,
            preSelected: o.preSelected,
            preSelectionSource: o.preSelectionSource,
          })),
          eclSource: question.eclSource,
          skipOption: question.skipOption,
          multiSelect: question.multiSelect,
        }}
        .loading=${this._loading}
        @answer=${this._handleCcxQuestionAnswer}
      ></tx-ccx-question-card>
    `;
  }

  private _renderTermsPanel() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Extracted Terms</h2>
          ${this._termCount > 0
            ? html`<span class="panel-badge">${this._termCount}</span>`
            : nothing}
        </div>
        <div class="panel-content">
          ${this._renderTermsPanelContent()}
        </div>
      </div>
    `;
  }

  private _renderTermsPanelContent() {
    if (this._loading && !this._session) {
      return html`
        <div class="skeleton-container">
          <tx-term-card-skeleton></tx-term-card-skeleton>
          <tx-term-card-skeleton></tx-term-card-skeleton>
          <tx-term-card-skeleton></tx-term-card-skeleton>
        </div>
      `;
    }

    if (!this._session || this._session.extractedTerms.length === 0) {
      return html`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span class="empty-state-text">
            Enter clinical notes above to extract medical terms
          </span>
        </div>
      `;
    }

    return html`
      <tx-extracted-terms
        .terms=${this._session.extractedTerms}
        .termMatches=${this._session.termMatches}
        @concept-select=${this._handleConceptSelect}
        @skip-term=${this._handleSkipTerm}
      ></tx-extracted-terms>
    `;
  }

  private _renderQuestionsPanel() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Refinement Questions</h2>
          ${this._questionCount > 0
            ? html`<span class="panel-badge">${this._questionCount}</span>`
            : nothing}
        </div>
        <div class="panel-content">
          ${this._renderQuestionsPanelContent()}
        </div>
      </div>
    `;
  }

  private _renderQuestionsPanelContent() {
    // Show empty state only if we have no questions at all
    if (this._allQuestions.length === 0) {
      return html`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
          <span class="empty-state-text">
            ${this._session
              ? 'No refinement questions at this time'
              : 'Questions will appear after term extraction'}
          </span>
        </div>
      `;
    }

    return html`
      <tx-refinement-panel
        .allQuestions=${this._allQuestions}
        .pendingQuestionIds=${this._pendingQuestionIds}
        .questionStates=${this._questionStates}
        .currentQuestionId=${this._currentQuestionId}
        .viewMode=${this._refinementViewMode}
        @answer=${this._handleQuestionAnswer}
        @skip=${this._handleSkipQuestion}
        @skip-all=${this._handleSkipAll}
        @navigate=${this._handleQuestionNavigate}
        @view-mode-change=${this._handleViewModeChange}
      ></tx-refinement-panel>
    `;
  }

  private _renderMobileTabs() {
    return html`
      <nav class="mobile-tabs" role="tablist" aria-label="Panel navigation">
        <button
          class="mobile-tab ${this._mobileActiveTab === 'terms' ? 'active' : ''}"
          role="tab"
          aria-selected=${this._mobileActiveTab === 'terms'}
          aria-controls="mobile-panel-terms"
          @click=${() => this._setMobileTab('terms')}
        >
          <span class="mobile-tab-icon">📋</span>
          <span>Terms</span>
          ${this._termCount > 0
            ? html`<span class="mobile-tab-badge">${this._termCount}</span>`
            : nothing}
        </button>
        <button
          class="mobile-tab ${this._mobileActiveTab === 'questions' ? 'active' : ''}"
          role="tab"
          aria-selected=${this._mobileActiveTab === 'questions'}
          aria-controls="mobile-panel-questions"
          @click=${() => this._setMobileTab('questions')}
        >
          <span class="mobile-tab-icon">❓</span>
          <span>Questions</span>
          ${this._questionCount > 0
            ? html`<span class="mobile-tab-badge">${this._questionCount}</span>`
            : nothing}
        </button>
        <button
          class="mobile-tab ${this._mobileActiveTab === 'ecl' ? 'active' : ''}"
          role="tab"
          aria-selected=${this._mobileActiveTab === 'ecl'}
          aria-controls="mobile-panel-ecl"
          @click=${() => this._setMobileTab('ecl')}
        >
          <span class="mobile-tab-icon">📝</span>
          <span>ECL</span>
        </button>
      </nav>
    `;
  }

  private _renderMobilePanelContent() {
    return html`
      <div
        class="mobile-panel-content swipe-container"
        role="tabpanel"
        id="mobile-panel-${this._mobileActiveTab}"
        @touchstart=${this._handleTouchStart}
        @touchend=${this._handleTouchEnd}
      >
        ${this._mobileActiveTab === 'terms'
          ? this._renderTermsPanelContent()
          : this._mobileActiveTab === 'questions'
            ? this._renderQuestionsPanelContent()
            : this._renderMobileEclContent()}
      </div>
    `;
  }

  private _renderMobileEclContent() {
    if (!this._hasExpression) {
      return html`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
            />
          </svg>
          <span class="empty-state-text">
            ECL expression will be generated after refinement
          </span>
        </div>
      `;
    }

    // Use expressions array if available, otherwise fallback to single expression
    const expressions = this._session?.expressions?.length
      ? this._session.expressions
      : this._session?.expression
        ? [this._session.expression]
        : [];

    return html`
      <div>
        <div style="margin-bottom: var(--space-2, 8px); font-size: var(--text-xs, 12px); color: var(--color-text-muted, #9ca3af);">
          ${expressions.length} ECL expression(s)
        </div>
        ${expressions.map((expr, i) => html`
          <div style="margin-bottom: var(--space-3, 12px); ${i > 0 ? 'padding-top: var(--space-3, 12px); border-top: 1px solid var(--color-border, #e5e7eb);' : ''}">
            <div style="font-size: var(--text-xs, 12px); font-weight: var(--font-weight-medium, 500); color: var(--color-text-secondary, #6b7280); margin-bottom: var(--space-1, 4px);">
              ${expr.description}
            </div>
            <tx-expression-preview
              .expression=${expr}
              compact
            ></tx-expression-preview>
          </div>
        `)}
      </div>
    `;
  }

  private _renderExpressionSection() {
    if (!this._hasExpression) return nothing;

    // Use expressions array if available, otherwise fallback to single expression
    const expressions = this._session?.expressions?.length
      ? this._session.expressions
      : this._session?.expression
        ? [this._session.expression]
        : [];

    return html`
      <section class="expression-section">
        <div style="padding: var(--space-3, 12px); border-bottom: 1px solid var(--color-border, #e5e7eb);">
          <h3 style="margin: 0; font-size: var(--text-sm, 14px); font-weight: var(--font-weight-semibold, 600); color: var(--color-text-primary, #111827);">
            ECL Expressions (${expressions.length})
          </h3>
          <p style="margin: var(--space-1, 4px) 0 0; font-size: var(--text-xs, 12px); color: var(--color-text-muted, #9ca3af);">
            Each clinical finding is coded separately (industry standard)
          </p>
        </div>
        ${expressions.map((expr, i) => html`
          <div style="padding: var(--space-3, 12px); ${i > 0 ? 'border-top: 1px solid var(--color-border, #e5e7eb);' : ''}">
            <div style="font-size: var(--text-xs, 12px); font-weight: var(--font-weight-medium, 500); color: var(--color-text-secondary, #6b7280); margin-bottom: var(--space-2, 8px);">
              Finding ${i + 1}: ${expr.description}
            </div>
            <tx-expression-preview
              .expression=${expr}
              compact
            ></tx-expression-preview>
          </div>
        `)}
      </section>
    `;
  }

  private _renderActionsSection() {
    // Combine all ECL expressions for copy
    const allEcl = this._session?.expressions?.length
      ? this._session.expressions.map(e => e.ecl).join('\n\n')
      : this._session?.expression?.ecl || '';

    return html`
      <section class="actions-section">
        <tx-session-actions
          .sessionState=${this._session?.state || 'initial'}
          ?hasExpression=${this._hasExpression}
          ?expressionValid=${this._expressionValid}
          ?hasUnsavedChanges=${this._hasUnsavedChanges}
          ?loading=${this._loading}
          .expressionText=${allEcl}
          @clear=${this._handleClear}
          @save-draft=${this._handleSaveDraft}
          @copy=${this._handleCopyExpression}
          @confirm=${this._handleConfirm}
        ></tx-session-actions>
      </section>
    `;
  }

  private _renderFab() {
    const fabClasses = {
      fab: true,
      hidden: this._keyboardOpen || !this._expressionValid,
    };

    return html`
      <button
        class=${classMap(fabClasses)}
        ?disabled=${!this._expressionValid || this._loading}
        @click=${this._handleConfirm}
        aria-label="Confirm and save expression"
      >
        ✓
      </button>
    `;
  }

  private _renderCompletionModal() {
    if (!this._showCompletionModal || !this._hasExpression) return nothing;

    // Use expressions array if available, otherwise fallback to single expression
    const expressions = this._session?.expressions?.length
      ? this._session.expressions
      : this._session?.expression
        ? [this._session.expression]
        : [];

    return html`
      <tx-completion-modal
        .expression=${expressions[0]}
        .expressions=${expressions}
        .metrics=${this._session?.metrics}
        @close=${this._handleCompletionClose}
        @save=${this._handleCompletionSave}
        @copy=${this._handleCopyExpression}
      ></tx-completion-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'coding-page': CodingPage;
  }
}
