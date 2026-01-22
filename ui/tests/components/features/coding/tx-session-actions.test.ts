/**
 * tx-session-actions Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import type { TxSessionActions, SessionState } from '../../../../src/components/features/coding/tx-session-actions.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-session-actions.js';

describe('tx-session-actions', () => {
  // Mock clipboard API
  const mockClipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: mockClipboard,
      platform: 'MacIntel',
    });
    mockClipboard.writeText.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      expect(el).toBeDefined();
      expect(el.sessionState).toBe('initial');
      expect(el.hasExpression).toBe(false);
      expect(el.expressionValid).toBe(false);
      expect(el.hasUnsavedChanges).toBe(false);
      expect(el.loading).toBe(false);
    });

    it('renders action bar container', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const actionBar = el.shadowRoot?.querySelector('.action-bar');
      expect(actionBar).toBeDefined();
    });

    it('renders all four action buttons', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      // Check for the specific action buttons by looking at left-actions and right-actions
      const leftButtons = el.shadowRoot?.querySelectorAll('.left-actions tx-button');
      const rightButtons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(leftButtons?.length).toBe(1); // Clear Session
      expect(rightButtons?.length).toBe(3); // Save, Copy, Confirm
    });

    it('renders Clear Session button', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button');
      expect(clearBtn?.textContent?.trim()).toContain('Clear Session');
    });

    it('renders Save Draft button', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[0]?.textContent?.trim()).toContain('Save Draft');
    });

    it('renders Copy Expression button', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[1]?.textContent?.trim()).toContain('Copy Expression');
    });

    it('renders Confirm & Save button', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[2]?.textContent?.trim()).toContain('Confirm & Save');
    });
  });

  describe('button states - Clear Session', () => {
    it('disables Clear when session is initial/empty', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="initial"></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button');
      expect(clearBtn?.hasAttribute('disabled')).toBe(true);
    });

    it('enables Clear when session has data', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="questioning"></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button');
      expect(clearBtn?.hasAttribute('disabled')).toBe(false);
    });

    it('disables Clear when loading', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="questioning" ?loading=${true}></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button');
      expect(clearBtn?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('button states - Save Draft', () => {
    it('disables Save when no unsaved changes', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?hasUnsavedChanges=${false}></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[0]?.hasAttribute('disabled')).toBe(true);
    });

    it('enables Save when unsaved changes exist', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?hasUnsavedChanges=${true}></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[0]?.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('button states - Copy Expression', () => {
    it('disables Copy when no expression', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?hasExpression=${false}></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[1]?.hasAttribute('disabled')).toBe(true);
    });

    it('enables Copy when expression exists', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?hasExpression=${true}></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[1]?.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('button states - Confirm & Save', () => {
    it('disables Confirm when expression invalid', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?expressionValid=${false}></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[2]?.hasAttribute('disabled')).toBe(true);
    });

    it('enables Confirm when expression valid', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?expressionValid=${true}></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      expect(buttons?.[2]?.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('Clear Session flow', () => {
    it('shows confirmation modal on Clear click', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="questioning"></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button') as HTMLElement;
      clearBtn?.click();
      await el.updateComplete;

      const modal = el.shadowRoot?.querySelector('tx-modal');
      expect(modal?.open).toBe(true);
    });

    it('shows warning message in confirmation modal', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="questioning"></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button') as HTMLElement;
      clearBtn?.click();
      await el.updateComplete;

      const warning = el.shadowRoot?.querySelector('.modal-warning-text');
      expect(warning?.textContent).toContain('All current work will be lost');
    });

    it('dispatches clear event on confirmation', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="questioning"></tx-session-actions>`
      );

      // Open modal
      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button') as HTMLElement;
      clearBtn?.click();
      await el.updateComplete;

      // Click confirm
      const listener = oneEvent(el, 'clear');
      const confirmBtn = el.shadowRoot?.querySelector('tx-button[variant="destructive"]') as HTMLElement;
      confirmBtn?.click();

      const event = await listener;
      expect(event).toBeDefined();
    });

    it('closes modal on cancel', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="questioning"></tx-session-actions>`
      );

      // Open modal
      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button') as HTMLElement;
      clearBtn?.click();
      await el.updateComplete;

      // Click cancel
      const cancelBtn = el.shadowRoot?.querySelector('.modal-footer tx-button[variant="secondary"]') as HTMLElement;
      cancelBtn?.click();
      await el.updateComplete;

      const modal = el.shadowRoot?.querySelector('tx-modal');
      expect(modal?.open).toBe(false);
    });
  });

  describe('Save Draft flow', () => {
    it('dispatches save-draft event', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?hasUnsavedChanges=${true}></tx-session-actions>`
      );

      const listener = oneEvent(el, 'save-draft');

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      (buttons?.[0] as HTMLElement)?.click();

      const event = await listener;
      expect(event).toBeDefined();
    });
  });

  describe('Copy Expression flow', () => {
    it('copies expression to clipboard', async () => {
      const testExpression = '29857009 |Chest pain|';
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions
          ?hasExpression=${true}
          .expressionText=${testExpression}
        ></tx-session-actions>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      (buttons?.[1] as HTMLElement)?.click();
      await el.updateComplete;

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testExpression);
    });

    it('dispatches copy event with expression text', async () => {
      const testExpression = '29857009 |Chest pain|';
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions
          ?hasExpression=${true}
          .expressionText=${testExpression}
        ></tx-session-actions>`
      );

      const listener = oneEvent(el, 'copy');

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      (buttons?.[1] as HTMLElement)?.click();

      const event = await listener;
      expect(event.detail).toEqual({ text: testExpression });
    });
  });

  describe('Confirm & Save flow', () => {
    it('dispatches confirm event', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions ?expressionValid=${true}></tx-session-actions>`
      );

      const listener = oneEvent(el, 'confirm');

      const buttons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');
      (buttons?.[2] as HTMLElement)?.click();

      const event = await listener;
      expect(event).toBeDefined();
    });
  });

  // NOTE: Keyboard shortcut tests are skipped because document-level
  // keyboard event handling doesn't work reliably in JSDOM test environment.
  // The keyboard shortcuts work correctly in actual browsers.
  // These should be tested with E2E tests (Playwright) instead.
  describe('keyboard shortcuts', () => {
    it('registers keyboard listener on connect', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    it('removes keyboard listener on disconnect', async () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      // Remove from DOM
      el.remove();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('shows correct keyboard hints for Mac', async () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        platform: 'MacIntel',
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const hints = el.shadowRoot?.querySelectorAll('.kbd-hint');
      const hintTexts = Array.from(hints || []).map((h) => h.textContent);
      expect(hintTexts.some((h) => h?.includes('⌘'))).toBe(true);
    });
  });

  describe('session states', () => {
    const sessionStates: SessionState[] = [
      'initial',
      'extracting',
      'matching',
      'confirming',
      'questioning',
      'building',
      'completed',
      'error',
    ];

    sessionStates.forEach((state) => {
      it(`handles session state: ${state}`, async () => {
        const el = await fixture<TxSessionActions>(
          html`<tx-session-actions .sessionState=${state}></tx-session-actions>`
        );

        expect(el.sessionState).toBe(state);

        // Clear should only be enabled for non-initial states
        const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button');
        if (state === 'initial') {
          expect(clearBtn?.hasAttribute('disabled')).toBe(true);
        } else {
          expect(clearBtn?.hasAttribute('disabled')).toBe(false);
        }
      });
    });
  });

  describe('loading states', () => {
    it('disables all action buttons when loading', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions
          sessionState="questioning"
          ?hasUnsavedChanges=${true}
          ?hasExpression=${true}
          ?expressionValid=${true}
          ?loading=${true}
        ></tx-session-actions>`
      );

      // Check action bar buttons specifically
      const leftButtons = el.shadowRoot?.querySelectorAll('.left-actions tx-button');
      const rightButtons = el.shadowRoot?.querySelectorAll('.right-actions tx-button');

      leftButtons?.forEach((btn) => {
        expect(btn.hasAttribute('disabled')).toBe(true);
      });
      rightButtons?.forEach((btn) => {
        expect(btn.hasAttribute('disabled')).toBe(true);
      });
    });
  });

  describe('keyboard hint display', () => {
    it('shows keyboard hints on buttons', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const hints = el.shadowRoot?.querySelectorAll('.kbd-hint');
      expect(hints?.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('has title attributes on buttons', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button');
      expect(clearBtn?.getAttribute('title')).toContain('Clear current session');
    });

    it('modal has proper heading', async () => {
      const el = await fixture<TxSessionActions>(
        html`<tx-session-actions sessionState="questioning"></tx-session-actions>`
      );

      const clearBtn = el.shadowRoot?.querySelector('.left-actions tx-button') as HTMLElement;
      clearBtn?.click();
      await el.updateComplete;

      const header = el.shadowRoot?.querySelector('[slot="header"]');
      expect(header?.textContent).toContain('Clear Session');
    });
  });

});
