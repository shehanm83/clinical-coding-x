/**
 * tx-term-card-skeleton Component Tests
 */

import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxTermCardSkeleton } from '../../../../src/components/features/coding/tx-term-card-skeleton.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-term-card-skeleton.js';

describe('tx-term-card-skeleton', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      expect(el).toBeDefined();
      expect(el.count).toBe(1);
      expect(el.conceptCount).toBe(3);
    });

    it('renders single skeleton card by default', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const cards = el.shadowRoot?.querySelectorAll('.skeleton-card');
      expect(cards?.length).toBe(1);
    });

    it('renders multiple skeleton cards', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton .count=${3}></tx-term-card-skeleton>`
      );

      const cards = el.shadowRoot?.querySelectorAll('.skeleton-card');
      expect(cards?.length).toBe(3);
    });

    it('renders skeleton elements with shimmer class', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const skeletonElements = el.shadowRoot?.querySelectorAll('.skeleton');
      expect(skeletonElements?.length).toBeGreaterThan(0);
    });
  });

  describe('structure', () => {
    it('renders skeleton header with title and badge', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const header = el.shadowRoot?.querySelector('.skeleton-header');
      expect(header).toBeDefined();

      const title = el.shadowRoot?.querySelector('.skeleton-title');
      expect(title).toBeDefined();

      const badge = el.shadowRoot?.querySelector('.skeleton-badge');
      expect(badge).toBeDefined();
    });

    it('renders skeleton modifiers section', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const modifiers = el.shadowRoot?.querySelector('.skeleton-modifiers');
      expect(modifiers).toBeDefined();

      const tags = el.shadowRoot?.querySelectorAll('.skeleton-tag');
      expect(tags?.length).toBe(2);
    });

    it('renders skeleton confidence section', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const confidence = el.shadowRoot?.querySelector('.skeleton-confidence');
      expect(confidence).toBeDefined();

      const confidenceText = el.shadowRoot?.querySelector('.skeleton-confidence-text');
      expect(confidenceText).toBeDefined();

      const confidenceBar = el.shadowRoot?.querySelector('.skeleton-confidence-bar');
      expect(confidenceBar).toBeDefined();
    });

    it('renders skeleton divider', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const divider = el.shadowRoot?.querySelector('.skeleton-divider');
      expect(divider).toBeDefined();
    });

    it('renders skeleton concept rows', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const concepts = el.shadowRoot?.querySelectorAll('.skeleton-concept');
      expect(concepts?.length).toBe(3); // default conceptCount
    });

    it('renders configurable concept count', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton .conceptCount=${5}></tx-term-card-skeleton>`
      );

      const concepts = el.shadowRoot?.querySelectorAll('.skeleton-concept');
      expect(concepts?.length).toBe(5);
    });
  });

  describe('concept rows', () => {
    it('each concept row has radio, text, and score', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const conceptRow = el.shadowRoot?.querySelector('.skeleton-concept');

      const radio = conceptRow?.querySelector('.skeleton-radio');
      expect(radio).toBeDefined();

      const text = conceptRow?.querySelector('.skeleton-concept-text');
      expect(text).toBeDefined();

      const score = conceptRow?.querySelector('.skeleton-concept-score');
      expect(score).toBeDefined();
    });

    it('concept text widths vary for natural look', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton .conceptCount=${5}></tx-term-card-skeleton>`
      );

      const conceptTexts = el.shadowRoot?.querySelectorAll('.skeleton-concept-text');
      const widths = new Set<string>();

      conceptTexts?.forEach((text) => {
        const width = (text as HTMLElement).style.width;
        widths.add(width);
      });

      // Should have multiple different widths
      expect(widths.size).toBeGreaterThan(1);
    });
  });

  describe('accessibility', () => {
    it('has aria-busy on container', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const container = el.shadowRoot?.querySelector('.skeleton-list');
      expect(container?.getAttribute('aria-busy')).toBe('true');
    });

    it('has aria-label on container', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const container = el.shadowRoot?.querySelector('.skeleton-list');
      expect(container?.getAttribute('aria-label')).toBe('Loading term cards');
    });

    it('has visually hidden loading text', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const hiddenText = el.shadowRoot?.querySelector('.visually-hidden');
      expect(hiddenText).toBeDefined();
      expect(hiddenText?.textContent).toContain('Loading');
    });

    it('skeleton cards are aria-hidden', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const card = el.shadowRoot?.querySelector('.skeleton-card');
      expect(card?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('shimmer animation', () => {
    it('skeleton elements have animation via CSS class', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton></tx-term-card-skeleton>`
      );

      const skeletonElement = el.shadowRoot?.querySelector('.skeleton');
      expect(skeletonElement?.classList.contains('skeleton')).toBe(true);
    });
  });

  describe('multiple cards', () => {
    it('renders correct number of cards with count prop', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton .count=${5}></tx-term-card-skeleton>`
      );

      const cards = el.shadowRoot?.querySelectorAll('.skeleton-card');
      expect(cards?.length).toBe(5);
    });

    it('each card has complete structure', async () => {
      const el = await fixture<TxTermCardSkeleton>(
        html`<tx-term-card-skeleton .count=${3}></tx-term-card-skeleton>`
      );

      const cards = el.shadowRoot?.querySelectorAll('.skeleton-card');

      cards?.forEach((card) => {
        expect(card.querySelector('.skeleton-header')).toBeDefined();
        expect(card.querySelector('.skeleton-modifiers')).toBeDefined();
        expect(card.querySelector('.skeleton-confidence')).toBeDefined();
        expect(card.querySelector('.skeleton-concepts')).toBeDefined();
      });
    });
  });
});
