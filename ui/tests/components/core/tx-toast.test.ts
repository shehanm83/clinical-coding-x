/**
 * tx-toast Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxToast } from '../../../src/components/core/tx-toast.js';

describe('tx-toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxToast>(html`<tx-toast message="Test message"></tx-toast>`);

      expect(el).toBeDefined();
      expect(el.message).toBe('Test message');
      expect(el.variant).toBe('info');
      expect(el.duration).toBe(3000);
      expect(el.position).toBe('top-right');
      expect(el.dismissible).toBe(true);
    });

    it('renders message content', async () => {
      const el = await fixture<TxToast>(html`<tx-toast message="Hello World"></tx-toast>`);
      const message = el.shadowRoot?.querySelector('.message');

      expect(message?.textContent).toBe('Hello World');
    });

    it('renders with role="alert" for accessibility', async () => {
      const el = await fixture<TxToast>(html`<tx-toast message="Alert"></tx-toast>`);
      const toast = el.shadowRoot?.querySelector('.toast');

      expect(toast?.getAttribute('role')).toBe('alert');
    });
  });

  describe('variants', () => {
    it('renders info variant with correct icon', async () => {
      const el = await fixture<TxToast>(html`<tx-toast variant="info" message="Info"></tx-toast>`);
      const icon = el.shadowRoot?.querySelector('.icon');
      const toast = el.shadowRoot?.querySelector('.toast');

      expect(icon?.textContent?.trim()).toBe('ℹ');
      expect(toast?.classList.contains('variant-info')).toBe(true);
    });

    it('renders success variant with correct icon', async () => {
      const el = await fixture<TxToast>(
        html`<tx-toast variant="success" message="Success"></tx-toast>`
      );
      const icon = el.shadowRoot?.querySelector('.icon');
      const toast = el.shadowRoot?.querySelector('.toast');

      expect(icon?.textContent?.trim()).toBe('✓');
      expect(toast?.classList.contains('variant-success')).toBe(true);
    });

    it('renders warning variant with correct icon', async () => {
      const el = await fixture<TxToast>(
        html`<tx-toast variant="warning" message="Warning"></tx-toast>`
      );
      const icon = el.shadowRoot?.querySelector('.icon');
      const toast = el.shadowRoot?.querySelector('.toast');

      expect(icon?.textContent?.trim()).toBe('⚠');
      expect(toast?.classList.contains('variant-warning')).toBe(true);
    });

    it('renders error variant with correct icon', async () => {
      const el = await fixture<TxToast>(html`<tx-toast variant="error" message="Error"></tx-toast>`);
      const icon = el.shadowRoot?.querySelector('.icon');
      const toast = el.shadowRoot?.querySelector('.toast');

      expect(icon?.textContent?.trim()).toBe('✕');
      expect(toast?.classList.contains('variant-error')).toBe(true);
    });
  });

  describe('dismissibility', () => {
    it('shows dismiss button when dismissible', async () => {
      const el = await fixture<TxToast>(
        html`<tx-toast message="Test" dismissible></tx-toast>`
      );
      const closeButton = el.shadowRoot?.querySelector('.close-button');

      expect(closeButton).toBeDefined();
    });

    it('hides dismiss button when not dismissible', async () => {
      const el = await fixture<TxToast>(
        html`<tx-toast message="Test" .dismissible=${false}></tx-toast>`
      );
      const closeButton = el.shadowRoot?.querySelector('.close-button');

      expect(closeButton).toBeNull();
    });

    it('emits close event when dismiss button clicked', async () => {
      const closeHandler = vi.fn();
      const el = await fixture<TxToast>(
        html`<tx-toast message="Test" @close=${closeHandler}></tx-toast>`
      );

      const closeButton = el.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;
      closeButton?.click();

      // Wait for animation timeout
      vi.advanceTimersByTime(200);

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('auto-dismiss', () => {
    it('auto-dismisses after duration', async () => {
      const closeHandler = vi.fn();
      await fixture<TxToast>(
        html`<tx-toast message="Test" duration="3000" @close=${closeHandler}></tx-toast>`
      );

      // Advance past duration
      vi.advanceTimersByTime(3000);
      // Wait for animation
      vi.advanceTimersByTime(200);

      expect(closeHandler).toHaveBeenCalled();
    });

    it('does not auto-dismiss when duration is 0', async () => {
      const closeHandler = vi.fn();
      await fixture<TxToast>(
        html`<tx-toast message="Test" duration="0" @close=${closeHandler}></tx-toast>`
      );

      // Advance a long time
      vi.advanceTimersByTime(10000);

      expect(closeHandler).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('dismisses on Escape key', async () => {
      const closeHandler = vi.fn();
      const el = await fixture<TxToast>(
        html`<tx-toast message="Test" @close=${closeHandler}></tx-toast>`
      );

      const toast = el.shadowRoot?.querySelector('.toast') as HTMLElement;
      toast?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      // Wait for animation
      vi.advanceTimersByTime(200);

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('animations', () => {
    it('has toast element with animation classes', async () => {
      const el = await fixture<TxToast>(html`<tx-toast message="Test"></tx-toast>`);

      const toast = el.shadowRoot?.querySelector('.toast');
      expect(toast).toBeDefined();
      // Toast element exists and has proper structure
      expect(toast?.classList.contains('toast')).toBe(true);
    });

    it('applies dismissing class when dismiss is called', async () => {
      const el = await fixture<TxToast>(html`<tx-toast message="Test"></tx-toast>`);

      el.dismiss();
      await el.updateComplete;

      const toast = el.shadowRoot?.querySelector('.toast');
      expect(toast?.classList.contains('dismissing')).toBe(true);
    });
  });
});
