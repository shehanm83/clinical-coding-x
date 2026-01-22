/**
 * tx-grid Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxGrid } from '../../../src/components/layout/tx-grid.js';

describe('tx-grid', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid>Content</tx-grid>`);

      expect(el).toBeDefined();
      expect(el.columns).toBe('3');
      expect(el.gap).toBe('4');
      expect(el.minChildWidth).toBe('200px');
    });

    it('renders slotted content', async () => {
      const el = await fixture<TxGrid>(html`
        <tx-grid>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </tx-grid>
      `);
      const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
      const assignedElements = slot?.assignedElements();

      expect(assignedElements?.length).toBe(3);
    });
  });

  describe('columns property', () => {
    it('reflects columns attribute', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid columns="4">Content</tx-grid>`);

      expect(el.getAttribute('columns')).toBe('4');
    });

    it('accepts numeric column values', async () => {
      for (const columns of ['1', '2', '3', '4', '5', '6']) {
        const el = await fixture<TxGrid>(html`<tx-grid columns=${columns}>Content</tx-grid>`);
        expect(el.columns).toBe(columns);
      }
    });

    it('accepts auto column value', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid columns="auto">Content</tx-grid>`);

      expect(el.columns).toBe('auto');
    });
  });

  describe('responsive columns', () => {
    it('accepts columns-sm attribute', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid columns="1" columns-sm="2">Content</tx-grid>`);

      expect(el.getAttribute('columns-sm')).toBe('2');
    });

    it('accepts columns-md attribute', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid columns="1" columns-md="3">Content</tx-grid>`);

      expect(el.getAttribute('columns-md')).toBe('3');
    });

    it('accepts columns-lg attribute', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid columns="1" columns-lg="4">Content</tx-grid>`);

      expect(el.getAttribute('columns-lg')).toBe('4');
    });
  });

  describe('gap property', () => {
    it('reflects gap attribute', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid gap="6">Content</tx-grid>`);

      expect(el.getAttribute('gap')).toBe('6');
    });

    it('accepts all spacing values', async () => {
      for (const gap of ['1', '2', '3', '4', '6', '8']) {
        const el = await fixture<TxGrid>(html`<tx-grid gap=${gap}>Content</tx-grid>`);
        expect(el.gap).toBe(gap);
      }
    });
  });

  describe('minChildWidth property', () => {
    it('sets CSS variable for min width', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid min-child-width="300px">Content</tx-grid>`);

      expect(el.style.getPropertyValue('--grid-min-width')).toBe('300px');
    });

    it('defaults to 200px', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid>Content</tx-grid>`);

      expect(el.minChildWidth).toBe('200px');
    });
  });

  describe('host element', () => {
    it('renders as custom element', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid>Content</tx-grid>`);

      expect(el.tagName.toLowerCase()).toBe('tx-grid');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxGrid>(html`<tx-grid>Content</tx-grid>`);

      expect(el.shadowRoot).toBeDefined();
    });
  });
});
