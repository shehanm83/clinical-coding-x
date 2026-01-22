/**
 * tx-extracted-terms Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxExtractedTerms } from '../../../../src/components/features/coding/tx-extracted-terms.js';
import type { ExtractedTerm, ConceptMatch } from '../../../../src/components/features/coding/tx-term-card.js';
import type { TermMatchResult } from '../../../../src/components/features/coding/tx-extracted-terms.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-extracted-terms.js';

// Test fixtures
const createTerm = (overrides: Partial<ExtractedTerm> = {}): ExtractedTerm => ({
  text: 'chest pain',
  normalized: 'chest pain',
  type: 'finding',
  confidence: 92,
  modifiers: [],
  negated: false,
  ...overrides,
});

const createMatch = (overrides: Partial<ConceptMatch> = {}): ConceptMatch => ({
  id: '29857009',
  term: 'Chest pain',
  fsn: 'Chest pain (finding)',
  semanticTag: 'finding',
  similarity: 95,
  ...overrides,
});

const createMatchResult = (overrides: Partial<TermMatchResult> = {}): TermMatchResult => ({
  termIndex: 0,
  matches: [createMatch()],
  selectedId: null,
  autoSelected: false,
  ...overrides,
});

describe('tx-extracted-terms', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms></tx-extracted-terms>`
      );

      expect(el).toBeDefined();
      expect(el.terms).toEqual([]);
      expect(el.termMatches).toEqual([]);
    });

    it('renders panel header', async () => {
      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header');
      expect(header).toBeDefined();

      const title = el.shadowRoot?.querySelector('.panel-title');
      expect(title?.textContent?.trim()).toBe('Extracted Terms');
    });

    it('displays term count in badge', async () => {
      const terms = [createTerm(), createTerm({ text: 'headache' })];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const badge = el.shadowRoot?.querySelector('.count-badge');
      expect(badge?.textContent?.trim()).toBe('2');
    });

    it('renders empty state when no terms', async () => {
      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms></tx-extracted-terms>`
      );

      const emptyState = el.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('No terms extracted');
    });
  });

  describe('term cards', () => {
    it('renders correct number of term cards', async () => {
      const terms = [
        createTerm({ text: 'term 1' }),
        createTerm({ text: 'term 2' }),
        createTerm({ text: 'term 3' }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const cards = el.shadowRoot?.querySelectorAll('tx-term-card');
      expect(cards?.length).toBe(3);
    });

    it('passes term data to cards', async () => {
      const terms = [createTerm({ text: 'test term' })];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const card = el.shadowRoot?.querySelector('tx-term-card') as any;
      expect(card?.term?.text).toBe('test term');
    });

    it('passes matches to cards', async () => {
      const terms = [createTerm()];
      const matches = [
        createMatchResult({
          termIndex: 0,
          matches: [createMatch({ id: '123' }), createMatch({ id: '456' })],
        }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
        ></tx-extracted-terms>`
      );

      const card = el.shadowRoot?.querySelector('tx-term-card') as any;
      expect(card?.conceptMatches?.length).toBe(2);
    });

    it('passes selectedId to cards', async () => {
      const terms = [createTerm()];
      const matches = [
        createMatchResult({
          termIndex: 0,
          selectedId: '12345',
        }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
        ></tx-extracted-terms>`
      );

      const card = el.shadowRoot?.querySelector('tx-term-card') as any;
      expect(card?.selectedId).toBe('12345');
    });

    it('passes autoSelected to cards', async () => {
      const terms = [createTerm()];
      const matches = [
        createMatchResult({
          termIndex: 0,
          autoSelected: true,
          selectedId: '123',
        }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
        ></tx-extracted-terms>`
      );

      const card = el.shadowRoot?.querySelector('tx-term-card') as any;
      expect(card?.autoSelected).toBe(true);
    });
  });

  describe('collapse/expand', () => {
    it('panel starts expanded', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('collapsed')).toBe(false);
    });

    it('collapses on header click', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;
      header?.click();
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('collapsed')).toBe(true);
    });

    it('expands on second header click', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;

      // Collapse
      header?.click();
      await el.updateComplete;

      // Expand
      header?.click();
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('collapsed')).toBe(false);
    });

    it('toggle icon rotates when collapsed', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;
      header?.click();
      await el.updateComplete;

      const icon = el.shadowRoot?.querySelector('.toggle-icon');
      expect(icon?.classList.contains('collapsed')).toBe(true);
    });

    it('responds to Enter key on header', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      header?.dispatchEvent(event);
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('collapsed')).toBe(true);
    });

    it('responds to Space key on header', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      header?.dispatchEvent(event);
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('collapsed')).toBe(true);
    });
  });

  describe('summary bar', () => {
    it('renders summary bar with terms', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const summary = el.shadowRoot?.querySelector('.summary-bar');
      expect(summary).toBeDefined();
    });

    it('shows pending count', async () => {
      const terms = [createTerm(), createTerm({ text: 'term2' })];
      const matches = [
        createMatchResult({ termIndex: 0, selectedId: null }),
        createMatchResult({ termIndex: 1, selectedId: null }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
        ></tx-extracted-terms>`
      );

      const pendingStat = el.shadowRoot?.querySelector('.stat.pending .stat-value');
      expect(pendingStat?.textContent?.trim()).toBe('2');
    });

    it('shows selected count', async () => {
      const terms = [createTerm(), createTerm({ text: 'term2' })];
      const matches = [
        createMatchResult({ termIndex: 0, selectedId: '123' }),
        createMatchResult({ termIndex: 1, selectedId: null }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
        ></tx-extracted-terms>`
      );

      const selectedStat = el.shadowRoot?.querySelector('.stat.selected .stat-value');
      expect(selectedStat?.textContent?.trim()).toBe('1');
    });

    it('shows excluded count for negated terms', async () => {
      const terms = [
        createTerm(),
        createTerm({ text: 'negated term', negated: true }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const excludedStat = el.shadowRoot?.querySelector('.stat.excluded .stat-value');
      expect(excludedStat?.textContent?.trim()).toBe('1');
    });

    it('hides excluded stat when no negated terms', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const excludedStat = el.shadowRoot?.querySelector('.stat.excluded');
      expect(excludedStat).toBeNull();
    });
  });

  describe('event propagation', () => {
    it('propagates concept-select events', async () => {
      const selectHandler = vi.fn();
      const terms = [createTerm()];
      const matches = [createMatchResult({ termIndex: 0 })];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
          @concept-select=${selectHandler}
        ></tx-extracted-terms>`
      );

      // Find and click the first radio button
      const card = el.shadowRoot?.querySelector('tx-term-card');
      const radio = card?.shadowRoot?.querySelector('input[type="radio"]') as HTMLInputElement;
      radio?.click();

      expect(selectHandler).toHaveBeenCalled();
    });

    it('propagates manual-search events', async () => {
      const searchHandler = vi.fn();
      const terms = [createTerm()];
      const matches = [createMatchResult({ termIndex: 0 })];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
          @manual-search=${searchHandler}
        ></tx-extracted-terms>`
      );

      // Find and click the search link
      const card = el.shadowRoot?.querySelector('tx-term-card');
      const searchLink = Array.from(
        card?.shadowRoot?.querySelectorAll('.action-link') || []
      ).find((el) => el.textContent?.includes('Search'));
      (searchLink as HTMLElement)?.click();

      expect(searchHandler).toHaveBeenCalled();
    });

    it('propagates skip-term events', async () => {
      const skipHandler = vi.fn();
      const terms = [createTerm()];
      const matches = [createMatchResult({ termIndex: 0 })];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
          @skip-term=${skipHandler}
        ></tx-extracted-terms>`
      );

      // Find and click the skip link
      const card = el.shadowRoot?.querySelector('tx-term-card');
      const skipLink = Array.from(
        card?.shadowRoot?.querySelectorAll('.action-link') || []
      ).find((el) => el.textContent?.includes('No good match'));
      (skipLink as HTMLElement)?.click();

      expect(skipHandler).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('header has button role', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header');
      expect(header?.getAttribute('role')).toBe('button');
    });

    it('header has aria-expanded', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header');
      expect(header?.getAttribute('aria-expanded')).toBe('true');

      // Click to collapse
      (header as HTMLElement)?.click();
      await el.updateComplete;

      expect(header?.getAttribute('aria-expanded')).toBe('false');
    });

    it('header has aria-controls', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header');
      expect(header?.getAttribute('aria-controls')).toBe('panel-content');
    });

    it('content has region role', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const content = el.shadowRoot?.querySelector('#panel-content');
      expect(content?.getAttribute('role')).toBe('region');
    });

    it('has live region for state announcements', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const liveRegion = el.shadowRoot?.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeDefined();
    });

    it('header is keyboard focusable', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms}></tx-extracted-terms>`
      );

      const header = el.shadowRoot?.querySelector('.panel-header');
      expect(header?.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('edge cases', () => {
    it('handles empty matches array', async () => {
      const terms = [createTerm()];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms .terms=${terms} .termMatches=${[]}></tx-extracted-terms>`
      );

      const card = el.shadowRoot?.querySelector('tx-term-card') as any;
      expect(card?.conceptMatches).toEqual([]);
    });

    it('handles mismatched term and match indices', async () => {
      const terms = [createTerm(), createTerm({ text: 'term2' })];
      const matches = [
        createMatchResult({ termIndex: 0 }),
        // No match for index 1
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
        ></tx-extracted-terms>`
      );

      const cards = el.shadowRoot?.querySelectorAll('tx-term-card');
      expect(cards?.length).toBe(2);
    });

    it('negated terms do not count as pending', async () => {
      const terms = [
        createTerm({ negated: true }),
        createTerm({ text: 'term2' }),
      ];
      const matches = [
        createMatchResult({ termIndex: 1, selectedId: null }),
      ];

      const el = await fixture<TxExtractedTerms>(
        html`<tx-extracted-terms
          .terms=${terms}
          .termMatches=${matches}
        ></tx-extracted-terms>`
      );

      const pendingStat = el.shadowRoot?.querySelector('.stat.pending .stat-value');
      // Only term2 is pending (not negated and no selection)
      expect(pendingStat?.textContent?.trim()).toBe('1');
    });
  });
});
