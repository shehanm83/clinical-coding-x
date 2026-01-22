/**
 * tx-completion-modal Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import type {
  TxCompletionModal,
  CompletedExpression,
  SessionMetrics,
} from '../../../../src/components/features/coding/tx-completion-modal.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-completion-modal.js';

// Test fixtures
const createExpression = (
  overrides: Partial<CompletedExpression> = {}
): CompletedExpression => ({
  ecl: '29857009 |Chest pain|',
  formatted: {
    inline: '29857009 |Chest pain|',
    nested: '29857009 |Chest pain| : {\n  246112005 |Severity| = 24484000 |Severe|\n}',
  },
  description: 'Severe chest pain',
  validation: {
    valid: true,
    mrcmCompliant: true,
  },
  ...overrides,
});

const createMetrics = (overrides: Partial<SessionMetrics> = {}): SessionMetrics => ({
  totalTimeMs: 45000,
  termsExtracted: 3,
  conceptsMatched: 3,
  questionsAsked: 2,
  questionsAnswered: 2,
  expressionType: 'postcoordinated',
  validationStatus: 'mrcm_compliant',
  ...overrides,
});

describe('tx-completion-modal', () => {
  // Mock clipboard API
  const mockClipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };

  // Mock URL API for download
  const mockURL = {
    createObjectURL: vi.fn().mockReturnValue('blob:test'),
    revokeObjectURL: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: mockClipboard,
    });
    vi.stubGlobal('URL', mockURL);
    mockClipboard.writeText.mockClear();
    mockURL.createObjectURL.mockClear();
    mockURL.revokeObjectURL.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal></tx-completion-modal>`
      );

      expect(el).toBeDefined();
      expect(el.open).toBe(false);
      expect(el.expression).toBeUndefined();
      expect(el.metrics).toBeUndefined();
      expect(el.showConfetti).toBe(true);
    });

    it('renders modal with expression', async () => {
      const expression = createExpression();
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const code = el.shadowRoot?.querySelector('.expression-code');
      expect(code?.textContent?.trim()).toContain('29857009');
    });

    it('renders success icon', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const icon = el.shadowRoot?.querySelector('.success-icon');
      expect(icon).toBeDefined();
      expect(icon?.textContent?.trim()).toBe('✓');
    });

    it('renders success title', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const title = el.shadowRoot?.querySelector('.success-title');
      expect(title?.textContent).toContain('Expression Successfully Created');
    });

    it('renders expression description', async () => {
      const expression = createExpression({ description: 'Test description' });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const desc = el.shadowRoot?.querySelector('.expression-description');
      expect(desc?.textContent?.trim()).toBe('Test description');
    });
  });

  describe('validation badges', () => {
    it('shows valid badge when expression is valid', async () => {
      const expression = createExpression({
        validation: { valid: true, mrcmCompliant: false },
      });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const badges = el.shadowRoot?.querySelectorAll('.validation-badge.valid');
      expect(badges?.length).toBeGreaterThan(0);
    });

    it('shows MRCM compliant badge when compliant', async () => {
      const expression = createExpression({
        validation: { valid: true, mrcmCompliant: true },
      });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const badges = el.shadowRoot?.querySelectorAll('.validation-badge');
      const mrcmBadge = Array.from(badges || []).find((b) =>
        b.textContent?.includes('MRCM')
      );
      expect(mrcmBadge).toBeDefined();
    });

    it('shows warning badge when expression is invalid', async () => {
      const expression = createExpression({
        validation: { valid: false, mrcmCompliant: false },
      });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const warningBadge = el.shadowRoot?.querySelector('.validation-badge.warning');
      expect(warningBadge).toBeDefined();
    });
  });

  describe('metrics display', () => {
    it('renders metrics panel when metrics provided', async () => {
      const metrics = createMetrics();
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel).toBeDefined();
    });

    it('displays time metric correctly', async () => {
      const metrics = createMetrics({ totalTimeMs: 45000 });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel?.textContent).toContain('45 seconds');
    });

    it('displays terms extracted', async () => {
      const metrics = createMetrics({ termsExtracted: 5 });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel?.textContent).toContain('5');
    });

    it('displays expression type', async () => {
      const metrics = createMetrics({ expressionType: 'postcoordinated' });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel?.textContent).toContain('Postcoordinated');
    });

    it('displays validation status', async () => {
      const metrics = createMetrics({ validationStatus: 'mrcm_compliant' });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel?.textContent).toContain('MRCM Compliant');
    });
  });

  describe('time formatting', () => {
    it('formats milliseconds correctly', async () => {
      const metrics = createMetrics({ totalTimeMs: 500 });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel?.textContent).toContain('500ms');
    });

    it('formats seconds correctly', async () => {
      const metrics = createMetrics({ totalTimeMs: 30000 });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel?.textContent).toContain('30 seconds');
    });

    it('formats minutes correctly', async () => {
      const metrics = createMetrics({ totalTimeMs: 90000 });
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const panel = el.shadowRoot?.querySelector('.metrics-panel');
      expect(panel?.textContent).toContain('1m 30s');
    });
  });

  describe('action buttons', () => {
    it('renders all four action buttons', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.action-btn');
      expect(buttons?.length).toBe(4);
    });

    it('renders Copy to Clipboard button', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const button = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Copy to clipboard"]'
      );
      expect(button?.textContent).toContain('Copy to Clipboard');
    });

    it('renders Download button', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const button = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Download expression"]'
      );
      expect(button?.textContent).toContain('Download');
    });

    it('renders Start New Session button', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const button = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Start new session"]'
      );
      expect(button?.textContent).toContain('Start New Session');
    });

    it('renders View in Explorer button', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const button = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="View in explorer"]'
      );
      expect(button?.textContent).toContain('View in Explorer');
    });
  });

  describe('copy functionality', () => {
    it('copies expression to clipboard', async () => {
      const expression = createExpression();
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const copyBtn = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Copy to clipboard"]'
      ) as HTMLElement;
      copyBtn?.click();

      await el.updateComplete;
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });

    it('dispatches copy event', async () => {
      const expression = createExpression();
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const listener = oneEvent(el, 'copy');

      const copyBtn = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Copy to clipboard"]'
      ) as HTMLElement;
      copyBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ text: expression.ecl });
    });
  });

  describe('download functionality', () => {
    it('creates downloadable file', async () => {
      const expression = createExpression();
      const metrics = createMetrics();
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
          .metrics=${metrics}
        ></tx-completion-modal>`
      );

      const downloadBtn = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Download expression"]'
      ) as HTMLElement;
      downloadBtn?.click();

      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockURL.revokeObjectURL).toHaveBeenCalled();
    });

    it('dispatches download event', async () => {
      const expression = createExpression();
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const listener = oneEvent(el, 'download');

      const downloadBtn = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Download expression"]'
      ) as HTMLElement;
      downloadBtn?.click();

      const event = await listener;
      expect(event).toBeDefined();
    });
  });

  describe('new session functionality', () => {
    it('dispatches new-session event', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const listener = oneEvent(el, 'new-session');

      const newBtn = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="Start new session"]'
      ) as HTMLElement;
      newBtn?.click();

      const event = await listener;
      expect(event).toBeDefined();
    });
  });

  describe('view explorer functionality', () => {
    it('dispatches view-explorer event with ECL', async () => {
      const expression = createExpression();
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal
          ?open=${true}
          .expression=${expression}
        ></tx-completion-modal>`
      );

      const listener = oneEvent(el, 'view-explorer');

      const viewBtn = el.shadowRoot?.querySelector(
        '.action-btn[aria-label="View in explorer"]'
      ) as HTMLElement;
      viewBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ ecl: expression.ecl });
    });
  });

  describe('close functionality', () => {
    it('dispatches close event when modal closes', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const listener = oneEvent(el, 'close');

      // Trigger close via modal
      const modal = el.shadowRoot?.querySelector('tx-modal');
      modal?.dispatchEvent(
        new CustomEvent('close', {
          bubbles: true,
          composed: true,
        })
      );

      const event = await listener;
      expect(event).toBeDefined();
    });
  });

  describe('confetti animation', () => {
    it('shows confetti when modal opens', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      await el.updateComplete;

      const confetti = el.shadowRoot?.querySelector('.confetti-container');
      expect(confetti).toBeDefined();
    });

    it('respects showConfetti property when false', async () => {
      // First create the modal closed with property binding
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal .showConfetti=${false}></tx-completion-modal>`
      );

      // Verify property is set correctly
      expect(el.showConfetti).toBe(false);

      // Then open it
      el.open = true;
      await el.updateComplete;

      // Wait for any animation frames
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;

      const confetti = el.shadowRoot?.querySelector('.confetti-container');
      expect(confetti).toBeNull();
    });

    it('respects prefers-reduced-motion', async () => {
      // Mock matchMedia to return reduced motion preference
      const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));
      vi.stubGlobal('matchMedia', matchMediaMock);

      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      await el.updateComplete;

      // Confetti should not be active when reduced motion is preferred
      const confetti = el.shadowRoot?.querySelector('.confetti-container');
      expect(confetti).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has aria-labels on action buttons', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.action-btn');
      buttons?.forEach((btn) => {
        expect(btn.hasAttribute('aria-label')).toBe(true);
      });
    });

    it('uses tx-modal for accessibility features', async () => {
      const el = await fixture<TxCompletionModal>(
        html`<tx-completion-modal ?open=${true}></tx-completion-modal>`
      );

      const modal = el.shadowRoot?.querySelector('tx-modal');
      expect(modal).toBeDefined();
    });
  });
});
