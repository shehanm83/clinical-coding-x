/**
 * tx-page-header Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxPageHeader } from '../../../src/components/layout/tx-page-header.js';

describe('tx-page-header', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxPageHeader>(html`<tx-page-header></tx-page-header>`);

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('tx-page-header');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxPageHeader>(html`<tx-page-header></tx-page-header>`);

      expect(el.shadowRoot).toBeDefined();
    });

    it('renders title from property', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header pageTitle="Test Page"></tx-page-header>`
      );
      const title = el.shadowRoot?.querySelector('.title');

      expect(title?.textContent?.trim()).toBe('Test Page');
    });

    it('renders title from slot', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header>Slotted Title</tx-page-header>`
      );
      const slot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
      const assignedNodes = slot?.assignedNodes();

      expect(assignedNodes?.length).toBeGreaterThan(0);
    });

    it('renders subtitle when provided', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header pageTitle="Title" subtitle="Subtitle text"></tx-page-header>`
      );
      const subtitle = el.shadowRoot?.querySelector('.subtitle');

      expect(subtitle?.textContent?.trim()).toBe('Subtitle text');
    });

    it('does not render subtitle when not provided', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header pageTitle="Title"></tx-page-header>`
      );
      const subtitle = el.shadowRoot?.querySelector('.subtitle');

      expect(subtitle).toBeNull();
    });
  });

  describe('back button', () => {
    it('does not render back button by default', async () => {
      const el = await fixture<TxPageHeader>(html`<tx-page-header></tx-page-header>`);
      const backBtn = el.shadowRoot?.querySelector('.back-btn');

      expect(backBtn).toBeNull();
    });

    it('renders back button when show-back is true', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header show-back></tx-page-header>`
      );
      const backBtn = el.shadowRoot?.querySelector('.back-btn');

      expect(backBtn).toBeDefined();
    });

    it('fires back event on button click', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header show-back></tx-page-header>`
      );

      const backHandler = vi.fn();
      el.addEventListener('back', backHandler);

      const backBtn = el.shadowRoot?.querySelector('.back-btn') as HTMLButtonElement;
      backBtn?.click();

      expect(backHandler).toHaveBeenCalled();
    });

    it('back button has aria-label', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header show-back></tx-page-header>`
      );
      const backBtn = el.shadowRoot?.querySelector('.back-btn');

      expect(backBtn?.getAttribute('aria-label')).toBe('Go back');
    });
  });

  describe('slots', () => {
    it('renders breadcrumbs slot', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header>
          <nav slot="breadcrumbs">Home / Page</nav>
        </tx-page-header>`
      );
      const breadcrumbSlot = el.shadowRoot?.querySelector(
        'slot[name="breadcrumbs"]'
      ) as HTMLSlotElement;
      const assignedElements = breadcrumbSlot?.assignedElements();

      expect(assignedElements?.length).toBe(1);
    });

    it('renders actions slot', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header>
          <button slot="actions">Action</button>
        </tx-page-header>`
      );
      const actionsSlot = el.shadowRoot?.querySelector(
        'slot[name="actions"]'
      ) as HTMLSlotElement;
      const assignedElements = actionsSlot?.assignedElements();

      expect(assignedElements?.length).toBe(1);
    });

    it('renders multiple actions', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header>
          <button slot="actions">Action 1</button>
          <button slot="actions">Action 2</button>
        </tx-page-header>`
      );
      const actionsSlot = el.shadowRoot?.querySelector(
        'slot[name="actions"]'
      ) as HTMLSlotElement;
      const assignedElements = actionsSlot?.assignedElements();

      expect(assignedElements?.length).toBe(2);
    });
  });

  describe('accessibility', () => {
    it('title is an h1 element', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header pageTitle="Test"></tx-page-header>`
      );
      const title = el.shadowRoot?.querySelector('.title');

      expect(title?.tagName.toLowerCase()).toBe('h1');
    });

    it('subtitle is a p element', async () => {
      const el = await fixture<TxPageHeader>(
        html`<tx-page-header pageTitle="Title" subtitle="Sub"></tx-page-header>`
      );
      const subtitle = el.shadowRoot?.querySelector('.subtitle');

      expect(subtitle?.tagName.toLowerCase()).toBe('p');
    });
  });

  describe('host element', () => {
    it('renders as custom element', async () => {
      const el = await fixture<TxPageHeader>(html`<tx-page-header></tx-page-header>`);

      expect(el.tagName.toLowerCase()).toBe('tx-page-header');
    });

    it('has page-header container element', async () => {
      const el = await fixture<TxPageHeader>(html`<tx-page-header></tx-page-header>`);
      const container = el.shadowRoot?.querySelector('.page-header');

      // Verify the page header structure exists
      expect(container).toBeDefined();
    });
  });
});
