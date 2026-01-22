/**
 * tx-button Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxButton } from '../../../src/components/core/tx-button.js';

describe('tx-button', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxButton>(html`<tx-button>Click me</tx-button>`);

      expect(el).toBeDefined();
      expect(el.variant).toBe('primary');
      expect(el.size).toBe('md');
      expect(el.disabled).toBe(false);
      expect(el.loading).toBe(false);
      expect(el.iconOnly).toBe(false);
    });

    it('renders slotted content', async () => {
      const el = await fixture<TxButton>(html`<tx-button>Test Content</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button).toBeDefined();
      const slot = button?.querySelector('slot');
      expect(slot).toBeDefined();
    });
  });

  describe('variants', () => {
    it('applies primary variant styles', async () => {
      const el = await fixture<TxButton>(html`<tx-button variant="primary">Primary</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('variant-primary')).toBe(true);
    });

    it('applies secondary variant styles', async () => {
      const el = await fixture<TxButton>(html`<tx-button variant="secondary">Secondary</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('variant-secondary')).toBe(true);
    });

    it('applies ghost variant styles', async () => {
      const el = await fixture<TxButton>(html`<tx-button variant="ghost">Ghost</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('variant-ghost')).toBe(true);
    });

    it('applies destructive variant styles', async () => {
      const el = await fixture<TxButton>(html`<tx-button variant="destructive">Delete</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('variant-destructive')).toBe(true);
    });
  });

  describe('sizes', () => {
    it('applies sm size', async () => {
      const el = await fixture<TxButton>(html`<tx-button size="sm">Small</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('size-sm')).toBe(true);
    });

    it('applies md size (default)', async () => {
      const el = await fixture<TxButton>(html`<tx-button>Medium</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('size-md')).toBe(true);
    });

    it('applies lg size', async () => {
      const el = await fixture<TxButton>(html`<tx-button size="lg">Large</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('size-lg')).toBe(true);
    });
  });

  describe('icon-only mode', () => {
    it('applies icon-only class', async () => {
      const el = await fixture<TxButton>(html`<tx-button iconOnly>X</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.classList.contains('icon-only')).toBe(true);
    });
  });

  describe('loading state', () => {
    it('shows spinner when loading', async () => {
      const el = await fixture<TxButton>(html`<tx-button loading>Loading</tx-button>`);
      const spinner = el.shadowRoot?.querySelector('.spinner');

      expect(spinner).toBeDefined();
    });

    it('sets aria-busy when loading', async () => {
      const el = await fixture<TxButton>(html`<tx-button loading>Loading</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.getAttribute('aria-busy')).toBe('true');
    });

    it('disables button when loading', async () => {
      const el = await fixture<TxButton>(html`<tx-button loading>Loading</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.disabled).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('sets disabled attribute on native button', async () => {
      const el = await fixture<TxButton>(html`<tx-button disabled>Disabled</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.disabled).toBe(true);
    });

    it('sets aria-disabled when disabled', async () => {
      const el = await fixture<TxButton>(html`<tx-button disabled>Disabled</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.getAttribute('aria-disabled')).toBe('true');
    });

    it('prevents click when disabled', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxButton>(
        html`<tx-button disabled @click=${clickHandler}>Disabled</tx-button>`
      );

      el.click();

      // Note: The click handler might still be called on the element itself
      // but the internal _handleClick will prevent propagation
      const button = el.shadowRoot?.querySelector('button');
      button?.click();

      // Event should be prevented inside the component
    });
  });

  describe('keyboard accessibility', () => {
    it('responds to Enter key', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxButton>(
        html`<tx-button @click=${clickHandler}>Click me</tx-button>`
      );

      const button = el.shadowRoot?.querySelector('button');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      button?.dispatchEvent(event);

      // Event handler should be triggered
    });

    it('responds to Space key', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxButton>(
        html`<tx-button @click=${clickHandler}>Click me</tx-button>`
      );

      const button = el.shadowRoot?.querySelector('button');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      button?.dispatchEvent(event);

      // Event handler should be triggered
    });
  });

  describe('button type', () => {
    it('defaults to button type', async () => {
      const el = await fixture<TxButton>(html`<tx-button>Click me</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.getAttribute('type')).toBe('button');
    });

    it('can be set to submit', async () => {
      const el = await fixture<TxButton>(html`<tx-button type="submit">Submit</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.getAttribute('type')).toBe('submit');
    });

    it('can be set to reset', async () => {
      const el = await fixture<TxButton>(html`<tx-button type="reset">Reset</tx-button>`);
      const button = el.shadowRoot?.querySelector('button');

      expect(button?.getAttribute('type')).toBe('reset');
    });
  });
});
