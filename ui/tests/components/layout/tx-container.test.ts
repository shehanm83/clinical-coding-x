/**
 * tx-container Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxContainer } from '../../../src/components/layout/tx-container.js';

describe('tx-container', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxContainer>(html`<tx-container>Content</tx-container>`);

      expect(el).toBeDefined();
      expect(el.size).toBe('lg');
    });

    it('renders slotted content', async () => {
      const el = await fixture<TxContainer>(html`
        <tx-container>
          <h1>Title</h1>
          <p>Content</p>
        </tx-container>
      `);
      const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
      const assignedElements = slot?.assignedElements();

      expect(assignedElements?.length).toBe(2);
    });
  });

  describe('size property', () => {
    it('reflects size attribute', async () => {
      const el = await fixture<TxContainer>(html`<tx-container size="md">Content</tx-container>`);

      expect(el.getAttribute('size')).toBe('md');
    });

    it('accepts all size values', async () => {
      for (const size of ['sm', 'md', 'lg', 'xl', 'full']) {
        const el = await fixture<TxContainer>(html`<tx-container size=${size}>Content</tx-container>`);
        expect(el.size).toBe(size);
      }
    });
  });

  describe('host element', () => {
    it('renders as custom element', async () => {
      const el = await fixture<TxContainer>(html`<tx-container>Content</tx-container>`);

      expect(el.tagName.toLowerCase()).toBe('tx-container');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxContainer>(html`<tx-container>Content</tx-container>`);

      expect(el.shadowRoot).toBeDefined();
    });
  });
});
