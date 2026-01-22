/**
 * tx-divider Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxDivider } from '../../../src/components/layout/tx-divider.js';

describe('tx-divider', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);

      expect(el).toBeDefined();
      expect(el.orientation).toBe('horizontal');
      expect(el.thickness).toBe('thin');
      expect(el.label).toBe('');
    });

    it('renders divider element with role separator', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);
      const divider = el.shadowRoot?.querySelector('.divider');

      expect(divider?.getAttribute('role')).toBe('separator');
    });
  });

  describe('orientation property', () => {
    it('reflects orientation attribute', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider orientation="vertical"></tx-divider>`);

      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('applies horizontal class by default', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);
      const divider = el.shadowRoot?.querySelector('.divider');

      expect(divider?.classList.contains('horizontal')).toBe(true);
    });

    it('applies vertical class when vertical', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider orientation="vertical"></tx-divider>`);
      const divider = el.shadowRoot?.querySelector('.divider');

      expect(divider?.classList.contains('vertical')).toBe(true);
    });

    it('sets aria-orientation attribute', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider orientation="vertical"></tx-divider>`);
      const divider = el.shadowRoot?.querySelector('.divider');

      expect(divider?.getAttribute('aria-orientation')).toBe('vertical');
    });
  });

  describe('thickness property', () => {
    it('reflects thickness attribute', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider thickness="thick"></tx-divider>`);

      expect(el.getAttribute('thickness')).toBe('thick');
    });

    it('applies thin class by default', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);
      const divider = el.shadowRoot?.querySelector('.divider');

      expect(divider?.classList.contains('thin')).toBe(true);
    });

    it('applies thick class when thick', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider thickness="thick"></tx-divider>`);
      const divider = el.shadowRoot?.querySelector('.divider');

      expect(divider?.classList.contains('thick')).toBe(true);
    });
  });

  describe('label property', () => {
    it('hides label when empty', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);
      const label = el.shadowRoot?.querySelector('.label');

      // No label rendered when empty
      expect(label).toBeNull();
    });

    it('shows label when provided', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider label="OR"></tx-divider>`);
      const label = el.shadowRoot?.querySelector('.label');

      expect(label).toBeDefined();
      expect(label?.textContent).toBe('OR');
    });

    it('renders two line elements with label', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider label="OR"></tx-divider>`);
      const lines = el.shadowRoot?.querySelectorAll('.line');

      expect(lines?.length).toBe(2);
    });

    it('renders one line element without label', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);
      const lines = el.shadowRoot?.querySelectorAll('.line');

      expect(lines?.length).toBe(1);
    });
  });

  describe('host element', () => {
    it('renders as custom element', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);

      expect(el.tagName.toLowerCase()).toBe('tx-divider');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxDivider>(html`<tx-divider></tx-divider>`);

      expect(el.shadowRoot).toBeDefined();
    });
  });
});
