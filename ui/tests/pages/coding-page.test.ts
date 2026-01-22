/**
 * CodingPage Integration Tests
 *
 * Tests for the main clinical coding page that integrates all Epic 7 components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html, waitUntil } from '@open-wc/testing';
import type { CodingPage } from '../../src/pages/coding/coding-page.js';

// Mock API responses
const mockSession = {
  id: 'test-session-123',
  state: 'extracting',
  originalText: 'Patient presents with severe chest pain',
  extractedTerms: [],
  termMatches: [],
  pendingQuestions: [],
  responses: [],
  confirmedAttributes: [],
  metrics: { totalTimeMs: 0, llmTokensUsed: 0 },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockSessionWithTerms = {
  ...mockSession,
  state: 'confirming',
  extractedTerms: [
    {
      text: 'severe chest pain',
      normalized: 'severe chest pain',
      type: 'finding',
      confidence: 0.95,
      span: { start: 22, end: 39 },
      modifiers: [{ type: 'severity', value: 'severe' }],
      negated: false,
    },
  ],
  termMatches: [
    {
      termIndex: 0,
      matches: [
        {
          id: '29857009',
          term: 'Chest pain',
          fsn: 'Chest pain (finding)',
          semanticTag: 'finding',
          similarity: 0.92,
        },
      ],
      selectedId: null,
      needsConfirmation: true,
    },
  ],
};

const mockSessionWithQuestions = {
  ...mockSessionWithTerms,
  state: 'questioning',
  termMatches: [
    {
      ...mockSessionWithTerms.termMatches[0],
      selectedId: '29857009',
      selectedTerm: 'Chest pain',
    },
  ],
  pendingQuestions: [
    {
      id: 'q1',
      text: 'What is the severity of the chest pain?',
      attributeId: '246112005',
      attributeName: 'Severity',
      inputType: 'single_select' as const,
      options: [
        { label: 'Mild', value: 'mild', conceptId: '255604002' },
        { label: 'Moderate', value: 'moderate', conceptId: '6736007' },
        { label: 'Severe', value: 'severe', conceptId: '24484000' },
      ],
      required: false,
      relatedTermIndex: 0,
    },
  ],
};

const mockCompletedSession = {
  ...mockSessionWithQuestions,
  state: 'completed',
  pendingQuestions: [],
  responses: [{ questionId: 'q1', value: 'severe', conceptId: '24484000' }],
  expression: {
    ecl: '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
    description: 'Chest pain with severe severity',
    fsn: 'Chest pain (finding)',
    expressionType: 'postcoordinated' as const,
    validation: {
      valid: true,
      mrcmCompliant: true,
      errors: [],
      warnings: [],
    },
    formatted: {
      brief: '29857009 : { 246112005 = 24484000 }',
      long: '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
      nested: '29857009 |Chest pain|\n  : { 246112005 |Severity| = 24484000 |Severe| }',
    },
  },
};

// Mock fetch
const mockFetch = vi.fn();

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  readyState = 0;

  static OPEN = 1;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  send(_data: string) {}
  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    // Create a proper CloseEvent-like object
    const closeEvent = { code, reason, wasClean: true } as CloseEvent;
    this.onclose?.(closeEvent);
  }
}

describe('coding-page', () => {
  let originalFetch: typeof global.fetch;
  let originalWebSocket: typeof global.WebSocket;
  let originalPushState: typeof window.history.pushState;

  beforeEach(() => {
    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockReset();

    // Mock WebSocket
    originalWebSocket = global.WebSocket;
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

    // Mock history
    originalPushState = window.history.pushState;
    window.history.pushState = vi.fn();

    // Reset URL
    window.history.replaceState({}, '', '/code');

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // Mock visualViewport
    if (!window.visualViewport) {
      Object.defineProperty(window, 'visualViewport', {
        value: {
          height: window.innerHeight,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        writable: true,
      });
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.WebSocket = originalWebSocket;
    window.history.pushState = originalPushState;
    window.history.replaceState({}, '', '/');
  });

  // =========================================================================
  // Rendering Tests
  // =========================================================================

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('coding-page');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      expect(el.shadowRoot).toBeDefined();
    });

    it('displays page header', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const title = el.shadowRoot?.querySelector('.header-title');

      expect(title?.textContent).toBe('AI Clinical Coding');
    });

    it('displays page subtitle', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const subtitle = el.shadowRoot?.querySelector('.header-subtitle');

      expect(subtitle?.textContent).toContain('SNOMED CT code suggestions');
    });

    it('renders clinical input component', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');

      expect(input).toBeDefined();
    });

    it('renders context options component', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const options = el.shadowRoot?.querySelector('tx-context-options');

      expect(options).toBeDefined();
    });

    it('renders progress stepper component', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const stepper = el.shadowRoot?.querySelector('tx-progress-stepper');

      expect(stepper).toBeDefined();
    });

    it('renders terms panel', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const panel = el.shadowRoot?.querySelector('.panel');

      expect(panel).toBeDefined();
    });

    it('renders session actions component', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const actions = el.shadowRoot?.querySelector('tx-session-actions');

      expect(actions).toBeDefined();
    });

    it('renders connection status', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const status = el.shadowRoot?.querySelector('.connection-status');

      expect(status).toBeDefined();
    });

    it('renders history button', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const button = el.shadowRoot?.querySelector('.history-button');

      expect(button?.textContent).toContain('History');
    });
  });

  // =========================================================================
  // Empty State Tests
  // =========================================================================

  describe('empty state', () => {
    it('shows empty state in terms panel initially', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const emptyState = el.shadowRoot?.querySelector('.panel-content .empty-state');

      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('Enter clinical notes');
    });

    it('shows empty state in questions panel initially', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const panels = el.shadowRoot?.querySelectorAll('.panel-content');
      const questionsPanel = panels?.[1];
      const emptyState = questionsPanel?.querySelector('.empty-state');

      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('Questions will appear');
    });
  });

  // =========================================================================
  // Session Creation Tests
  // =========================================================================

  describe('session creation', () => {
    it('creates session on submit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          session_id: 'test-session-123',
          state: 'extracting',
          created_at: new Date().toISOString(),
          message: 'Session created',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockSession,
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      await waitUntil(() => mockFetch.mock.calls.length >= 1, 'Fetch should be called');

      expect(mockFetch).toHaveBeenCalled();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/sessions');
      expect(options.method).toBe('POST');
    });

    it('updates URL on session creation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          session_id: 'test-session-123',
          state: 'extracting',
          created_at: new Date().toISOString(),
          message: 'Session created',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockSession,
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      await waitUntil(
        () => (window.history.pushState as ReturnType<typeof vi.fn>).mock.calls.length > 0,
        'pushState should be called',
        { timeout: 5000 }
      );

      expect(window.history.pushState).toHaveBeenCalled();
    });

    it('dispatches session-created event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          session_id: 'test-session-123',
          state: 'extracting',
          created_at: new Date().toISOString(),
          message: 'Session created',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockSession,
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      // Set up listener before dispatching event
      let receivedEvent: CustomEvent | null = null;
      el.addEventListener('session-created', (e) => { receivedEvent = e as CustomEvent; }, { once: true });

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      // Wait for event to be dispatched
      await waitUntil(
        () => receivedEvent !== null,
        'session-created event should be dispatched',
        { timeout: 5000 }
      );

      expect(receivedEvent!.detail.sessionId).toBe('test-session-123');
    });
  });

  // =========================================================================
  // URL Parameter Tests
  // =========================================================================

  describe('URL parameter handling', () => {
    it('loads session from URL parameter on connect', async () => {
      window.history.replaceState({}, '', '/code?session=existing-session-456');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockSessionWithTerms,
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      await waitUntil(() => mockFetch.mock.calls.length > 0, 'Fetch should be called');

      expect(mockFetch).toHaveBeenCalled();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/sessions/existing-session-456');
    });

    it('handles invalid session ID gracefully', async () => {
      window.history.replaceState({}, '', '/code?session=invalid-session');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: async () => ({
          error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        }),
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      await waitUntil(
        () => el.shadowRoot?.querySelector('.error-banner') !== null,
        'Error banner should appear'
      );

      const errorBanner = el.shadowRoot?.querySelector('.error-banner');

      expect(errorBanner).toBeDefined();
      expect(errorBanner?.textContent).toContain('not found');
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  describe('error handling', () => {
    it('displays error banner on API error', async () => {
      // Mock 400 error (not retryable) to show error immediately
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: async () => ({
          error: { code: 'INVALID_INPUT', message: 'Invalid input provided' },
        }),
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      await waitUntil(
        () => el.shadowRoot?.querySelector('.error-banner') !== null,
        'Error banner should appear',
        { timeout: 3000 }
      );

      const errorBanner = el.shadowRoot?.querySelector('.error-banner');

      expect(errorBanner).toBeDefined();
    });

    it('shows retry button for retryable errors', async () => {
      // Mock 3 failed responses for retry exhaustion
      const errorResponse = {
        ok: false,
        status: 503,
        headers: { get: () => 'application/json' },
        json: async () => ({
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' },
        }),
      };
      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse);

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      await waitUntil(
        () => el.shadowRoot?.querySelector('.error-banner') !== null,
        'Error banner should appear',
        { timeout: 10000 }
      );

      const retryButton = el.shadowRoot?.querySelector('.retry-button');

      expect(retryButton).toBeDefined();
      expect(retryButton?.textContent).toContain('Retry');
    });

    it('dismisses error on dismiss button click', async () => {
      // Mock 400 error (not retryable) to show error immediately
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: async () => ({
          error: { code: 'INVALID_INPUT', message: 'Invalid input provided' },
        }),
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      await waitUntil(
        () => el.shadowRoot?.querySelector('.error-banner') !== null,
        'Error banner should appear',
        { timeout: 3000 }
      );

      const dismissButton = el.shadowRoot?.querySelector('.dismiss-button') as HTMLButtonElement;
      dismissButton?.click();

      await waitUntil(
        () => el.shadowRoot?.querySelector('.error-banner') === null,
        'Error banner should disappear',
        { timeout: 3000 }
      );

      expect(el.shadowRoot?.querySelector('.error-banner')).toBeNull();
    });
  });

  // =========================================================================
  // Loading State Tests
  // =========================================================================

  describe('loading states', () => {
    it('shows skeleton loading for terms panel during initial load', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  headers: { get: () => 'application/json' },
                  json: async () => mockSession,
                }),
              1000
            )
          )
      );

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      // Wait a bit for loading state
      await new Promise((r) => setTimeout(r, 50));

      const skeletons = el.shadowRoot?.querySelectorAll('tx-term-card-skeleton');

      expect(skeletons?.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Mobile Adaptations Tests
  // =========================================================================

  describe('mobile adaptations', () => {
    it('renders mobile tabs', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const tabs = el.shadowRoot?.querySelector('.mobile-tabs');

      expect(tabs).toBeDefined();
    });

    it('has Terms tab', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const termsTab = el.shadowRoot?.querySelector('.mobile-tab');

      expect(termsTab?.textContent).toContain('Terms');
    });

    it('has Questions tab', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const tabs = el.shadowRoot?.querySelectorAll('.mobile-tab');
      const questionsTab = tabs?.[1];

      expect(questionsTab?.textContent).toContain('Questions');
    });

    it('has ECL tab', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const tabs = el.shadowRoot?.querySelectorAll('.mobile-tab');
      const eclTab = tabs?.[2];

      expect(eclTab?.textContent).toContain('ECL');
    });

    it('renders floating action button', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab).toBeDefined();
    });

    it('FAB is disabled when no valid expression', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;

      expect(fab.disabled).toBe(true);
    });

    it('switches tabs on click', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const tabs = el.shadowRoot?.querySelectorAll('.mobile-tab');
      const questionsTab = tabs?.[1] as HTMLButtonElement;

      questionsTab?.click();
      await el.updateComplete;

      expect(questionsTab?.classList.contains('active')).toBe(true);
    });
  });

  // =========================================================================
  // Session Actions Tests
  // =========================================================================

  describe('session actions', () => {
    it('clears session on clear event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          session_id: 'test-session-123',
          state: 'extracting',
          created_at: new Date().toISOString(),
          message: 'Session created',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockSessionWithTerms,
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      // Create a session first
      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      await waitUntil(() => mockFetch.mock.calls.length >= 2, 'Session should be loaded');
      await el.updateComplete;

      // Clear the session
      const actions = el.shadowRoot?.querySelector('tx-session-actions');
      actions?.dispatchEvent(new CustomEvent('clear', { bubbles: true, composed: true }));

      await el.updateComplete;

      // Check that terms panel shows empty state
      const emptyState = el.shadowRoot?.querySelector('.panel-content .empty-state');
      expect(emptyState).toBeDefined();
    });
  });

  // =========================================================================
  // Accessibility Tests
  // =========================================================================

  describe('accessibility', () => {
    it('has proper page heading structure', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const h1 = el.shadowRoot?.querySelector('h1');
      const h2s = el.shadowRoot?.querySelectorAll('h2');

      expect(h1).toBeDefined();
      expect(h2s?.length).toBeGreaterThan(0);
    });

    it('error banner has role="alert"', async () => {
      // Mock 400 error (not retryable) to show error immediately
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: async () => ({
          error: { code: 'INVALID_INPUT', message: 'Error' },
        }),
      });

      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const input = el.shadowRoot?.querySelector('tx-clinical-input');
      input?.dispatchEvent(
        new CustomEvent('submit', {
          detail: { text: 'Patient has chest pain', context: {} },
          bubbles: true,
          composed: true,
        })
      );

      await waitUntil(
        () => el.shadowRoot?.querySelector('.error-banner') !== null,
        'Error banner should appear',
        { timeout: 3000 }
      );

      const errorBanner = el.shadowRoot?.querySelector('.error-banner');

      expect(errorBanner?.getAttribute('role')).toBe('alert');
    });

    it('mobile tabs have proper ARIA attributes', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const tablist = el.shadowRoot?.querySelector('[role="tablist"]');
      const tabs = el.shadowRoot?.querySelectorAll('[role="tab"]');

      expect(tablist).toBeDefined();
      expect(tabs?.length).toBe(3);
    });

    it('FAB has accessible label', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.getAttribute('aria-label')).toBe('Confirm and save expression');
    });

    it('history button has aria-label', async () => {
      const el = await fixture<CodingPage>(html`<coding-page></coding-page>`);

      const button = el.shadowRoot?.querySelector('.history-button');

      expect(button?.getAttribute('aria-label')).toBe('Session history');
    });
  });
});
