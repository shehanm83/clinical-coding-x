/**
 * tx-card Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxCard } from '../../../src/components/layout/tx-card.js';

describe('tx-card', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxCard>(html`<tx-card>Content</tx-card>`);

      expect(el).toBeDefined();
      expect(el.elevation).toBe('1');
      expect(el.padding).toBe('4');
      expect(el.interactive).toBe(false);
    });

    it('renders slotted content', async () => {
      const el = await fixture<TxCard>(html`<tx-card>Card content</tx-card>`);
      const slot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;

      expect(slot).toBeDefined();
    });
  });

  describe('slots', () => {
    it('renders header slot', async () => {
      const el = await fixture<TxCard>(html`
        <tx-card>
          <span slot="header">Card Header</span>
          Content
        </tx-card>
      `);
      const headerSlot = el.shadowRoot?.querySelector('slot[name="header"]') as HTMLSlotElement;

      expect(headerSlot).toBeDefined();
    });

    it('renders footer slot', async () => {
      const el = await fixture<TxCard>(html`
        <tx-card>
          Content
          <span slot="footer">Card Footer</span>
        </tx-card>
      `);
      const footerSlot = el.shadowRoot?.querySelector('slot[name="footer"]') as HTMLSlotElement;

      expect(footerSlot).toBeDefined();
    });

    it('hides empty header', async () => {
      const el = await fixture<TxCard>(html`<tx-card>Content</tx-card>`);
      const header = el.shadowRoot?.querySelector('.card-header');

      expect(header?.classList.contains('empty')).toBe(true);
    });

    it('shows header when content provided', async () => {
      const el = await fixture<TxCard>(html`
        <tx-card>
          <span slot="header">Header</span>
          Content
        </tx-card>
      `);
      await el.updateComplete;
      const header = el.shadowRoot?.querySelector('.card-header');

      expect(header?.classList.contains('empty')).toBe(false);
    });
  });

  describe('elevation property', () => {
    it('reflects elevation attribute', async () => {
      const el = await fixture<TxCard>(html`<tx-card elevation="2">Content</tx-card>`);

      expect(el.getAttribute('elevation')).toBe('2');
    });

    it('accepts all elevation values', async () => {
      for (const elevation of ['0', '1', '2', '3']) {
        const el = await fixture<TxCard>(html`<tx-card elevation=${elevation}>Content</tx-card>`);
        expect(el.elevation).toBe(elevation);
      }
    });
  });

  describe('padding property', () => {
    it('reflects padding attribute', async () => {
      const el = await fixture<TxCard>(html`<tx-card padding="6">Content</tx-card>`);

      expect(el.getAttribute('padding')).toBe('6');
    });

    it('accepts all padding values', async () => {
      for (const padding of ['0', '2', '3', '4', '6', '8']) {
        const el = await fixture<TxCard>(html`<tx-card padding=${padding}>Content</tx-card>`);
        expect(el.padding).toBe(padding);
      }
    });
  });

  describe('interactive property', () => {
    it('defaults to non-interactive', async () => {
      const el = await fixture<TxCard>(html`<tx-card>Content</tx-card>`);

      expect(el.interactive).toBe(false);
      expect(el.hasAttribute('interactive')).toBe(false);
    });

    it('reflects interactive attribute', async () => {
      const el = await fixture<TxCard>(html`<tx-card interactive>Content</tx-card>`);

      expect(el.interactive).toBe(true);
      expect(el.hasAttribute('interactive')).toBe(true);
    });
  });

  describe('host element', () => {
    it('renders as custom element', async () => {
      const el = await fixture<TxCard>(html`<tx-card>Content</tx-card>`);

      expect(el.tagName.toLowerCase()).toBe('tx-card');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxCard>(html`<tx-card>Content</tx-card>`);

      expect(el.shadowRoot).toBeDefined();
    });
  });
});
