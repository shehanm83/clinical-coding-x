/**
 * tx-stack Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxStack } from '../../../src/components/layout/tx-stack.js';

describe('tx-stack', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxStack>(html`<tx-stack>Content</tx-stack>`);

      expect(el).toBeDefined();
      expect(el.gap).toBe('4');
      expect(el.align).toBe('stretch');
      expect(el.justify).toBe('start');
    });

    it('renders slotted content', async () => {
      const el = await fixture<TxStack>(html`
        <tx-stack>
          <div>Item 1</div>
          <div>Item 2</div>
        </tx-stack>
      `);
      const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
      const assignedElements = slot?.assignedElements();

      expect(assignedElements?.length).toBe(2);
    });
  });

  describe('gap property', () => {
    it('reflects gap attribute', async () => {
      const el = await fixture<TxStack>(html`<tx-stack gap="2">Content</tx-stack>`);

      expect(el.getAttribute('gap')).toBe('2');
    });

    it('accepts all spacing values', async () => {
      for (const gap of ['1', '2', '3', '4', '6', '8']) {
        const el = await fixture<TxStack>(html`<tx-stack gap=${gap}>Content</tx-stack>`);
        expect(el.gap).toBe(gap);
      }
    });
  });

  describe('responsive gap', () => {
    it('accepts gap-sm attribute', async () => {
      const el = await fixture<TxStack>(html`<tx-stack gap="2" gap-sm="4">Content</tx-stack>`);

      expect(el.getAttribute('gap-sm')).toBe('4');
    });

    it('accepts gap-md attribute', async () => {
      const el = await fixture<TxStack>(html`<tx-stack gap="2" gap-md="6">Content</tx-stack>`);

      expect(el.getAttribute('gap-md')).toBe('6');
    });

    it('accepts gap-lg attribute', async () => {
      const el = await fixture<TxStack>(html`<tx-stack gap="2" gap-lg="8">Content</tx-stack>`);

      expect(el.getAttribute('gap-lg')).toBe('8');
    });
  });

  describe('alignment', () => {
    it('reflects align attribute', async () => {
      const el = await fixture<TxStack>(html`<tx-stack align="center">Content</tx-stack>`);

      expect(el.getAttribute('align')).toBe('center');
    });

    it('accepts all align values', async () => {
      for (const align of ['start', 'center', 'end', 'stretch']) {
        const el = await fixture<TxStack>(html`<tx-stack align=${align}>Content</tx-stack>`);
        expect(el.align).toBe(align);
      }
    });
  });

  describe('justify', () => {
    it('reflects justify attribute', async () => {
      const el = await fixture<TxStack>(html`<tx-stack justify="center">Content</tx-stack>`);

      expect(el.getAttribute('justify')).toBe('center');
    });

    it('accepts all justify values', async () => {
      for (const justify of ['start', 'center', 'end', 'space-between']) {
        const el = await fixture<TxStack>(html`<tx-stack justify=${justify}>Content</tx-stack>`);
        expect(el.justify).toBe(justify);
      }
    });
  });

  describe('host element', () => {
    it('renders as custom element', async () => {
      const el = await fixture<TxStack>(html`<tx-stack>Content</tx-stack>`);

      expect(el.tagName.toLowerCase()).toBe('tx-stack');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxStack>(html`<tx-stack>Content</tx-stack>`);

      expect(el.shadowRoot).toBeDefined();
    });
  });
});
