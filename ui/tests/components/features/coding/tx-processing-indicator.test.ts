/**
 * tx-processing-indicator Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxProcessingIndicator } from '../../../../src/components/features/coding/tx-processing-indicator.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-processing-indicator.js';

describe('tx-processing-indicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator></tx-processing-indicator>`
      );

      expect(el).toBeDefined();
      expect(el.progress).toBe(0);
      expect(el.currentAction).toBe('');
      expect(el.currentText).toBe('');
      expect(el.canCancel).toBe(true);
    });

    it('renders progress bar', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${50}></tx-processing-indicator>`
      );

      const progressBar = el.shadowRoot?.querySelector('.progress-bar');
      expect(progressBar).toBeDefined();
      expect(progressBar?.getAttribute('role')).toBe('progressbar');
    });

    it('renders spinner', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator></tx-processing-indicator>`
      );

      const spinner = el.shadowRoot?.querySelector('.spinner');
      expect(spinner).toBeDefined();
    });

    it('renders current action text', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .currentAction=${'Extracting clinical terms'}
        ></tx-processing-indicator>`
      );

      const action = el.shadowRoot?.querySelector('.current-action');
      expect(action?.textContent).toContain('Extracting clinical terms');
    });

    it('renders cancel button', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator></tx-processing-indicator>`
      );

      const cancelButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      expect(cancelButton).toBeDefined();
    });
  });

  describe('progress bar', () => {
    it('updates width based on progress', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${45}></tx-processing-indicator>`
      );

      const fill = el.shadowRoot?.querySelector('.progress-fill') as HTMLElement;
      expect(fill?.style.width).toBe('45%');
    });

    it('displays progress percentage text', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${67}></tx-processing-indicator>`
      );

      const progressText = el.shadowRoot?.querySelector('.progress-text');
      expect(progressText?.textContent).toBe('67%');
    });

    it('clamps progress to 0-100 range', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${150}></tx-processing-indicator>`
      );

      const fill = el.shadowRoot?.querySelector('.progress-fill') as HTMLElement;
      expect(fill?.style.width).toBe('100%');
    });

    it('handles negative progress', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${-10}></tx-processing-indicator>`
      );

      const fill = el.shadowRoot?.querySelector('.progress-fill') as HTMLElement;
      expect(fill?.style.width).toBe('0%');
    });

    it('sets aria attributes on progress bar', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${30}></tx-processing-indicator>`
      );

      const progressBar = el.shadowRoot?.querySelector('.progress-bar');
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('30');
      expect(progressBar?.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar?.getAttribute('aria-valuemax')).toBe('100');
    });
  });

  describe('analyzing text', () => {
    it('displays current text being analyzed', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .currentText=${'acute chest pain'}
        ></tx-processing-indicator>`
      );

      const analyzingText = el.shadowRoot?.querySelector('.analyzing-text');
      expect(analyzingText?.textContent).toContain('acute chest pain');
    });

    it('hides analyzing section when no text', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator></tx-processing-indicator>`
      );

      const analyzingSection = el.shadowRoot?.querySelector('.analyzing-section');
      expect(analyzingSection).toBeNull();
    });

    it('shows analyzing section with text', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .currentText=${'test text'}
        ></tx-processing-indicator>`
      );

      const analyzingSection = el.shadowRoot?.querySelector('.analyzing-section');
      expect(analyzingSection).toBeDefined();
    });

    it('wraps text in quotes', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .currentText=${'some text'}
        ></tx-processing-indicator>`
      );

      const analyzingText = el.shadowRoot?.querySelector('.analyzing-text');
      expect(analyzingText?.textContent).toContain('"some text"');
    });
  });

  describe('ETA calculation', () => {
    it('does not show ETA before 5 seconds', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${50}></tx-processing-indicator>`
      );

      // Advance time by 3 seconds
      vi.advanceTimersByTime(3000);
      await el.updateComplete;

      const eta = el.shadowRoot?.querySelector('.eta');
      // Should not contain "remaining"
      expect(eta?.textContent?.trim()).not.toContain('remaining');
    });

    it('shows ETA after 5 seconds with progress', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${50}></tx-processing-indicator>`
      );

      // Advance time by 6 seconds
      vi.advanceTimersByTime(6000);
      await el.updateComplete;

      const eta = el.shadowRoot?.querySelector('.eta');
      expect(eta?.textContent).toContain('remaining');
    });

    it('does not show ETA with zero progress', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${0}></tx-processing-indicator>`
      );

      vi.advanceTimersByTime(10000);
      await el.updateComplete;

      const eta = el.shadowRoot?.querySelector('.eta');
      expect(eta?.textContent?.trim()).not.toContain('remaining');
    });
  });

  describe('cancellation', () => {
    it('dispatches cancel event on click', async () => {
      const cancelHandler = vi.fn();
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .progress=${30}
          @cancel=${cancelHandler}
        ></tx-processing-indicator>`
      );

      const cancelButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      (cancelButton as HTMLElement)?.click();

      expect(cancelHandler).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation at >50% progress', async () => {
      const cancelHandler = vi.fn();
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .progress=${60}
          @cancel=${cancelHandler}
        ></tx-processing-indicator>`
      );

      const cancelButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      (cancelButton as HTMLElement)?.click();
      await el.updateComplete;

      // Should not have called cancel yet
      expect(cancelHandler).not.toHaveBeenCalled();

      // Should show confirmation
      const confirmText = el.shadowRoot?.querySelector('.canceling-text');
      expect(confirmText?.textContent).toContain('Cancel processing?');
    });

    it('confirms cancel on Yes click', async () => {
      const cancelHandler = vi.fn();
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .progress=${60}
          @cancel=${cancelHandler}
        ></tx-processing-indicator>`
      );

      // First click shows confirmation
      const cancelButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      (cancelButton as HTMLElement)?.click();
      await el.updateComplete;

      // Click Yes
      const yesButton = el.shadowRoot?.querySelector('tx-button[variant="destructive"]');
      (yesButton as HTMLElement)?.click();

      expect(cancelHandler).toHaveBeenCalledTimes(1);
    });

    it('cancels confirmation on No click', async () => {
      const cancelHandler = vi.fn();
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .progress=${60}
          @cancel=${cancelHandler}
        ></tx-processing-indicator>`
      );

      // First click shows confirmation
      const cancelButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      (cancelButton as HTMLElement)?.click();
      await el.updateComplete;

      // Click No
      const noButton = el.shadowRoot?.querySelector('tx-button[variant="secondary"]');
      (noButton as HTMLElement)?.click();
      await el.updateComplete;

      // Should not have called cancel
      expect(cancelHandler).not.toHaveBeenCalled();

      // Should be back to normal cancel button
      const backButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      expect(backButton).toBeDefined();
    });

    it('shows canceling state after confirm', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .progress=${30}></tx-processing-indicator>`
      );

      const cancelButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      (cancelButton as HTMLElement)?.click();
      await el.updateComplete;

      const cancelingText = el.shadowRoot?.querySelector('.canceling-text');
      expect(cancelingText?.textContent).toContain('Canceling...');
    });

    it('disables cancel button when canCancel is false', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator .canCancel=${false}></tx-processing-indicator>`
      );

      const cancelButton = el.shadowRoot?.querySelector('tx-button[aria-label="Cancel processing"]');
      expect(cancelButton?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has aria-live region for action', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator></tx-processing-indicator>`
      );

      const liveRegion = el.shadowRoot?.querySelector('.current-action');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('has visually hidden screen reader announcement', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator
          .currentAction=${'Processing'}
          .progress=${50}
        ></tx-processing-indicator>`
      );

      const srAnnouncement = el.shadowRoot?.querySelector('.visually-hidden[aria-live="assertive"]');
      expect(srAnnouncement).toBeDefined();
      expect(srAnnouncement?.textContent).toContain('50 percent');
    });

    it('progress bar has accessible label', async () => {
      const el = await fixture<TxProcessingIndicator>(
        html`<tx-processing-indicator></tx-processing-indicator>`
      );

      const progressBar = el.shadowRoot?.querySelector('.progress-bar');
      expect(progressBar?.getAttribute('aria-label')).toBe('Processing progress');
    });
  });
});
