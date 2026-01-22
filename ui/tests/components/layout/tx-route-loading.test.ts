/**
 * TxRouteLoading Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxRouteLoading } from '../../../src/components/layout/tx-route-loading.js';

describe('tx-route-loading', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading></tx-route-loading>`
      );

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('tx-route-loading');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading></tx-route-loading>`
      );

      expect(el.shadowRoot).toBeDefined();
    });

    it('defaults to skeleton variant', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading></tx-route-loading>`
      );

      expect(el.variant).toBe('skeleton');
    });
  });

  describe('skeleton variant', () => {
    it('renders skeleton elements', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading variant="skeleton"></tx-route-loading>`
      );

      const header = el.shadowRoot?.querySelector('.skeleton-header');
      const textElements = el.shadowRoot?.querySelectorAll('.skeleton-text');
      const card = el.shadowRoot?.querySelector('.skeleton-card');

      expect(header).toBeDefined();
      expect(textElements?.length).toBeGreaterThan(0);
      expect(card).toBeDefined();
    });

    it('has loading container with proper accessibility', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading variant="skeleton"></tx-route-loading>`
      );

      const container = el.shadowRoot?.querySelector('.loading-container');

      expect(container?.getAttribute('role')).toBe('status');
      expect(container?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('spinner variant', () => {
    it('renders spinner when variant is spinner', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading variant="spinner"></tx-route-loading>`
      );

      const spinner = el.shadowRoot?.querySelector('.spinner');
      const container = el.shadowRoot?.querySelector('.spinner-container');

      expect(spinner).toBeDefined();
      expect(container).toBeDefined();
    });

    it('shows default loading message', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading variant="spinner"></tx-route-loading>`
      );

      const message = el.shadowRoot?.querySelector('.loading-text');

      expect(message?.textContent).toBe('Loading...');
    });

    it('shows custom loading message', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading
          variant="spinner"
          message="Loading page..."
        ></tx-route-loading>`
      );

      const message = el.shadowRoot?.querySelector('.loading-text');

      expect(message?.textContent).toBe('Loading page...');
    });

    it('has spinner container with proper accessibility', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading variant="spinner"></tx-route-loading>`
      );

      const container = el.shadowRoot?.querySelector('.spinner-container');

      expect(container?.getAttribute('role')).toBe('status');
      expect(container?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('accessibility', () => {
    it('skeleton has aria-label', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading variant="skeleton"></tx-route-loading>`
      );

      const container = el.shadowRoot?.querySelector('.loading-container');

      expect(container?.getAttribute('aria-label')).toBe('Loading page content');
    });

    it('spinner has screen reader text', async () => {
      const el = await fixture<TxRouteLoading>(
        html`<tx-route-loading variant="spinner"></tx-route-loading>`
      );

      const srText = el.shadowRoot?.querySelector('.sr-only');

      expect(srText?.textContent).toBe('Loading page content');
    });
  });
});
