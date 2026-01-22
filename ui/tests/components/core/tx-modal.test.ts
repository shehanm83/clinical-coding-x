/**
 * tx-modal Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxModal } from '../../../src/components/core/tx-modal.js';

describe('tx-modal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any body overflow changes
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxModal>(html`<tx-modal>Modal content</tx-modal>`);

      expect(el).toBeDefined();
      expect(el.open).toBe(false);
      expect(el.size).toBe('md');
      expect(el.closeOnBackdrop).toBe(true);
    });

    it('renders header slot', async () => {
      const el = await fixture<TxModal>(html`
        <tx-modal open>
          <span slot="header">Modal Title</span>
          Content
        </tx-modal>
      `);
      const headerSlot = el.shadowRoot?.querySelector('slot[name="header"]') as HTMLSlotElement;

      expect(headerSlot).toBeDefined();
    });

    it('renders footer slot', async () => {
      const el = await fixture<TxModal>(html`
        <tx-modal open>
          Content
          <span slot="footer">Footer</span>
        </tx-modal>
      `);
      const footerSlot = el.shadowRoot?.querySelector('slot[name="footer"]') as HTMLSlotElement;

      expect(footerSlot).toBeDefined();
    });

    it('has correct ARIA attributes', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open>Content</tx-modal>`);
      const modal = el.shadowRoot?.querySelector('.modal');

      expect(modal?.getAttribute('role')).toBe('dialog');
      expect(modal?.getAttribute('aria-modal')).toBe('true');
    });
  });

  describe('visibility', () => {
    it('is hidden when not open', async () => {
      const el = await fixture<TxModal>(html`<tx-modal>Content</tx-modal>`);
      const overlay = el.shadowRoot?.querySelector('.modal-overlay');

      expect(overlay?.classList.contains('open')).toBe(false);
    });

    it('is visible when open', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open>Content</tx-modal>`);
      const overlay = el.shadowRoot?.querySelector('.modal-overlay');

      expect(overlay?.classList.contains('open')).toBe(true);
    });
  });

  describe('size variants', () => {
    it('applies sm size class', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open size="sm">Content</tx-modal>`);
      const modal = el.shadowRoot?.querySelector('.modal');

      expect(modal?.classList.contains('size-sm')).toBe(true);
    });

    it('applies md size class', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open size="md">Content</tx-modal>`);
      const modal = el.shadowRoot?.querySelector('.modal');

      expect(modal?.classList.contains('size-md')).toBe(true);
    });

    it('applies lg size class', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open size="lg">Content</tx-modal>`);
      const modal = el.shadowRoot?.querySelector('.modal');

      expect(modal?.classList.contains('size-lg')).toBe(true);
    });
  });

  describe('closing', () => {
    it('emits close event when close button clicked', async () => {
      const closeHandler = vi.fn();
      const el = await fixture<TxModal>(
        html`<tx-modal open @close=${closeHandler}>Content</tx-modal>`
      );

      const closeButton = el.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;
      closeButton?.click();

      vi.advanceTimersByTime(250);

      expect(closeHandler).toHaveBeenCalled();
    });

    it('closes on Escape key', async () => {
      const closeHandler = vi.fn();
      const el = await fixture<TxModal>(
        html`<tx-modal open @close=${closeHandler}>Content</tx-modal>`
      );

      // Simulate Escape key
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      vi.advanceTimersByTime(250);

      expect(closeHandler).toHaveBeenCalled();
    });

    it('closes on backdrop click when closeOnBackdrop is true', async () => {
      const closeHandler = vi.fn();
      const el = await fixture<TxModal>(
        html`<tx-modal open closeOnBackdrop @close=${closeHandler}>Content</tx-modal>`
      );

      const overlay = el.shadowRoot?.querySelector('.modal-overlay') as HTMLElement;
      overlay?.click();

      vi.advanceTimersByTime(250);

      expect(closeHandler).toHaveBeenCalled();
    });

    it('does not close on backdrop click when closeOnBackdrop is false', async () => {
      const closeHandler = vi.fn();
      const el = await fixture<TxModal>(
        html`<tx-modal open .closeOnBackdrop=${false} @close=${closeHandler}>Content</tx-modal>`
      );

      const overlay = el.shadowRoot?.querySelector('.modal-overlay') as HTMLElement;
      overlay?.click();

      vi.advanceTimersByTime(250);

      expect(closeHandler).not.toHaveBeenCalled();
    });
  });

  describe('body scroll lock', () => {
    it('prevents body scroll when open', async () => {
      await fixture<TxModal>(html`<tx-modal open>Content</tx-modal>`);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open>Content</tx-modal>`);

      el.close();
      vi.advanceTimersByTime(250);

      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('focus management', () => {
    it('has close button focusable', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open>Content</tx-modal>`);
      const closeButton = el.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;

      expect(closeButton).toBeDefined();
      expect(closeButton?.tabIndex).not.toBe(-1);
    });
  });

  describe('animations', () => {
    it('applies closing class during close animation', async () => {
      const el = await fixture<TxModal>(html`<tx-modal open>Content</tx-modal>`);

      el.close();
      await el.updateComplete;

      const overlay = el.shadowRoot?.querySelector('.modal-overlay');
      expect(overlay?.classList.contains('closing')).toBe(true);
    });
  });
});
