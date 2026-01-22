/**
 * tx-inline Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxInline } from '../../../src/components/layout/tx-inline.js';

describe('tx-inline', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxInline>(html`<tx-inline>Content</tx-inline>`);

      expect(el).toBeDefined();
      expect(el.gap).toBe('2');
      expect(el.align).toBe('center');
      expect(el.justify).toBe('start');
      expect(el.wrap).toBe(false);
    });

    it('renders slotted content', async () => {
      const el = await fixture<TxInline>(html`
        <tx-inline>
          <span>Label</span>
          <button>Action</button>
        </tx-inline>
      `);
      const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
      const assignedElements = slot?.assignedElements();

      expect(assignedElements?.length).toBe(2);
    });
  });

  describe('gap property', () => {
    it('reflects gap attribute', async () => {
      const el = await fixture<TxInline>(html`<tx-inline gap="4">Content</tx-inline>`);

      expect(el.getAttribute('gap')).toBe('4');
    });

    it('accepts all spacing values', async () => {
      for (const gap of ['1', '2', '3', '4', '6', '8']) {
        const el = await fixture<TxInline>(html`<tx-inline gap=${gap}>Content</tx-inline>`);
        expect(el.gap).toBe(gap);
      }
    });
  });

  describe('alignment', () => {
    it('reflects align attribute', async () => {
      const el = await fixture<TxInline>(html`<tx-inline align="baseline">Content</tx-inline>`);

      expect(el.getAttribute('align')).toBe('baseline');
    });

    it('accepts all align values', async () => {
      for (const align of ['start', 'center', 'end', 'baseline', 'stretch']) {
        const el = await fixture<TxInline>(html`<tx-inline align=${align}>Content</tx-inline>`);
        expect(el.align).toBe(align);
      }
    });
  });

  describe('justify', () => {
    it('reflects justify attribute', async () => {
      const el = await fixture<TxInline>(
        html`<tx-inline justify="space-between">Content</tx-inline>`
      );

      expect(el.getAttribute('justify')).toBe('space-between');
    });

    it('accepts all justify values', async () => {
      for (const justify of ['start', 'center', 'end', 'space-between', 'space-around']) {
        const el = await fixture<TxInline>(html`<tx-inline justify=${justify}>Content</tx-inline>`);
        expect(el.justify).toBe(justify);
      }
    });
  });

  describe('wrap property', () => {
    it('defaults to no wrap', async () => {
      const el = await fixture<TxInline>(html`<tx-inline>Content</tx-inline>`);

      expect(el.wrap).toBe(false);
      expect(el.hasAttribute('wrap')).toBe(false);
    });

    it('reflects wrap attribute', async () => {
      const el = await fixture<TxInline>(html`<tx-inline wrap>Content</tx-inline>`);

      expect(el.wrap).toBe(true);
      expect(el.hasAttribute('wrap')).toBe(true);
    });
  });

  describe('host element', () => {
    it('renders as custom element', async () => {
      const el = await fixture<TxInline>(html`<tx-inline>Content</tx-inline>`);

      expect(el.tagName.toLowerCase()).toBe('tx-inline');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxInline>(html`<tx-inline>Content</tx-inline>`);

      expect(el.shadowRoot).toBeDefined();
    });
  });
});
