/**
 * tx-alert Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxAlert } from '../../../src/components/core/tx-alert.js';

describe('tx-alert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert>Alert message</tx-alert>`);

      expect(el).toBeDefined();
      expect(el.variant).toBe('info');
      expect(el.dismissible).toBe(false);
    });

    it('renders slotted content', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert>Test content</tx-alert>`);
      const slot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;

      expect(slot).toBeDefined();
    });

    it('renders title slot content', async () => {
      const el = await fixture<TxAlert>(html`
        <tx-alert>
          <span slot="title">Alert Title</span>
          Alert content
        </tx-alert>
      `);
      const titleSlot = el.shadowRoot?.querySelector('slot[name="title"]') as HTMLSlotElement;

      expect(titleSlot).toBeDefined();
    });

    it('has role="alert" for accessibility', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert>Alert</tx-alert>`);
      const alert = el.shadowRoot?.querySelector('.alert');

      expect(alert?.getAttribute('role')).toBe('alert');
    });
  });

  describe('variants', () => {
    it('renders info variant with correct styling', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert variant="info">Info alert</tx-alert>`);
      const alert = el.shadowRoot?.querySelector('.alert');
      const icon = el.shadowRoot?.querySelector('.icon');

      expect(alert?.classList.contains('variant-info')).toBe(true);
      expect(icon?.textContent?.trim()).toBe('ℹ');
    });

    it('renders success variant with correct styling', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert variant="success">Success alert</tx-alert>`);
      const alert = el.shadowRoot?.querySelector('.alert');
      const icon = el.shadowRoot?.querySelector('.icon');

      expect(alert?.classList.contains('variant-success')).toBe(true);
      expect(icon?.textContent?.trim()).toBe('✓');
    });

    it('renders warning variant with correct styling', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert variant="warning">Warning alert</tx-alert>`);
      const alert = el.shadowRoot?.querySelector('.alert');
      const icon = el.shadowRoot?.querySelector('.icon');

      expect(alert?.classList.contains('variant-warning')).toBe(true);
      expect(icon?.textContent?.trim()).toBe('⚠');
    });

    it('renders error variant with correct styling', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert variant="error">Error alert</tx-alert>`);
      const alert = el.shadowRoot?.querySelector('.alert');
      const icon = el.shadowRoot?.querySelector('.icon');

      expect(alert?.classList.contains('variant-error')).toBe(true);
      expect(icon?.textContent?.trim()).toBe('✕');
    });
  });

  describe('dismissibility', () => {
    it('hides dismiss button by default', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert>Alert</tx-alert>`);
      const closeButton = el.shadowRoot?.querySelector('.close-button');

      expect(closeButton).toBeNull();
    });

    it('shows dismiss button when dismissible', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert dismissible>Alert</tx-alert>`);
      const closeButton = el.shadowRoot?.querySelector('.close-button');

      expect(closeButton).toBeDefined();
    });

    it('emits close event when dismissed', async () => {
      const closeHandler = vi.fn();
      const el = await fixture<TxAlert>(
        html`<tx-alert dismissible @close=${closeHandler}>Alert</tx-alert>`
      );

      const closeButton = el.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;
      closeButton?.click();

      // Wait for animation
      vi.advanceTimersByTime(200);

      expect(closeHandler).toHaveBeenCalled();
    });

    it('hides element after dismiss', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert dismissible>Alert</tx-alert>`);

      const closeButton = el.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;
      closeButton?.click();

      // Wait for animation
      vi.advanceTimersByTime(200);

      expect(el.hidden).toBe(true);
    });
  });

  describe('animations', () => {
    it('applies dismissing class during dismiss animation', async () => {
      const el = await fixture<TxAlert>(html`<tx-alert dismissible>Alert</tx-alert>`);

      el.dismiss();
      await el.updateComplete;

      const alert = el.shadowRoot?.querySelector('.alert');
      expect(alert?.classList.contains('dismissing')).toBe(true);
    });
  });
});
