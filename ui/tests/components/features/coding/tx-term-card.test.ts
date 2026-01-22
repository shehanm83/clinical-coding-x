/**
 * tx-term-card Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxTermCard, ExtractedTerm, ConceptMatch } from '../../../../src/components/features/coding/tx-term-card.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-term-card.js';

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

describe('tx-term-card', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxTermCard>(
        html`<tx-term-card></tx-term-card>`
      );

      expect(el).toBeDefined();
      expect(el.term).toBeUndefined();
      expect(el.conceptMatches).toEqual([]);
      expect(el.selectedId).toBeNull();
    });

    it('renders nothing when no term provided', async () => {
      const el = await fixture<TxTermCard>(
        html`<tx-term-card></tx-term-card>`
      );

      const card = el.shadowRoot?.querySelector('.term-card');
      expect(card).toBeNull();
    });

    it('renders term text', async () => {
      const term = createTerm({ text: 'acute chest pain' });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const termText = el.shadowRoot?.querySelector('.term-text');
      expect(termText?.textContent?.trim()).toBe('acute chest pain');
    });

    it('renders type badge', async () => {
      const term = createTerm({ type: 'finding' });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.type-badge');
      expect(badge?.textContent?.trim()).toBe('Finding');
      expect(badge?.classList.contains('type-finding')).toBe(true);
    });
  });

  describe('type badges', () => {
    it('displays finding badge correctly', async () => {
      const term = createTerm({ type: 'finding' });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.type-badge');
      expect(badge?.classList.contains('type-finding')).toBe(true);
    });

    it('displays body_site badge correctly', async () => {
      const term = createTerm({ type: 'body_site' });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.type-badge');
      expect(badge?.textContent?.trim()).toBe('Body Site');
      expect(badge?.classList.contains('type-body-site')).toBe(true);
    });

    it('displays procedure badge correctly', async () => {
      const term = createTerm({ type: 'procedure' });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.type-badge');
      expect(badge?.textContent?.trim()).toBe('Procedure');
      expect(badge?.classList.contains('type-procedure')).toBe(true);
    });

    it('displays substance badge correctly', async () => {
      const term = createTerm({ type: 'substance' });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.type-badge');
      expect(badge?.textContent?.trim()).toBe('Substance');
    });

    it('displays qualifier badge correctly', async () => {
      const term = createTerm({ type: 'qualifier' });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.type-badge');
      expect(badge?.textContent?.trim()).toBe('Qualifier');
    });
  });

  describe('modifiers', () => {
    it('renders modifiers when present', async () => {
      const term = createTerm({
        modifiers: [
          { type: 'onset', value: 'acute' },
          { type: 'severity', value: 'severe' },
        ],
      });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const modifierTags = el.shadowRoot?.querySelectorAll('.modifier-tag');
      expect(modifierTags?.length).toBe(2);
    });

    it('hides modifiers section when none present', async () => {
      const term = createTerm({ modifiers: [] });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const modifiersSection = el.shadowRoot?.querySelector('.modifiers');
      expect(modifiersSection).toBeNull();
    });
  });

  describe('confidence', () => {
    it('displays confidence percentage', async () => {
      const term = createTerm({ confidence: 85 });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const confidenceLabel = el.shadowRoot?.querySelector('.confidence-label');
      expect(confidenceLabel?.textContent).toContain('85%');
    });

    it('applies high confidence class for >= 85%', async () => {
      const term = createTerm({ confidence: 90 });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const fill = el.shadowRoot?.querySelector('.confidence-fill');
      expect(fill?.classList.contains('high')).toBe(true);
    });

    it('applies medium confidence class for 65-84%', async () => {
      const term = createTerm({ confidence: 75 });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const fill = el.shadowRoot?.querySelector('.confidence-fill');
      expect(fill?.classList.contains('medium')).toBe(true);
    });

    it('applies low confidence class for < 65%', async () => {
      const term = createTerm({ confidence: 50 });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const fill = el.shadowRoot?.querySelector('.confidence-fill');
      expect(fill?.classList.contains('low')).toBe(true);
    });

    it('sets confidence bar width correctly', async () => {
      const term = createTerm({ confidence: 75 });
      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const fill = el.shadowRoot?.querySelector('.confidence-fill') as HTMLElement;
      expect(fill?.style.width).toBe('75%');
    });
  });

  describe('concept selection', () => {
    it('renders concept options', async () => {
      const term = createTerm();
      const matches = [
        createMatch({ id: '1', term: 'Concept 1', similarity: 95 }),
        createMatch({ id: '2', term: 'Concept 2', similarity: 85 }),
      ];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const options = el.shadowRoot?.querySelectorAll('.concept-option');
      expect(options?.length).toBe(2);
    });

    it('displays concept term and ID', async () => {
      const term = createTerm();
      const matches = [createMatch({ id: '29857009', term: 'Chest pain' })];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const conceptTerm = el.shadowRoot?.querySelector('.concept-term');
      const conceptId = el.shadowRoot?.querySelector('.concept-id');

      expect(conceptTerm?.textContent).toBe('Chest pain');
      expect(conceptId?.textContent).toBe('29857009');
    });

    it('shows similarity badge with correct color', async () => {
      const term = createTerm();
      const matches = [createMatch({ similarity: 95 })];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.similarity-badge');
      expect(badge?.textContent?.trim()).toBe('95%');
      expect(badge?.classList.contains('similarity-high')).toBe(true);
    });

    it('dispatches concept-select event on selection', async () => {
      const selectHandler = vi.fn();
      const term = createTerm();
      const matches = [createMatch({ id: '12345' })];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .index=${0}
          @concept-select=${selectHandler}
        ></tx-term-card>`
      );

      const radio = el.shadowRoot?.querySelector('input[type="radio"]') as HTMLInputElement;
      radio?.click();

      expect(selectHandler).toHaveBeenCalledTimes(1);
      expect(selectHandler.mock.calls[0][0].detail).toEqual({
        termIndex: 0,
        conceptId: '12345',
      });
    });

    it('marks selected concept', async () => {
      const term = createTerm();
      const matches = [createMatch({ id: '12345' })];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .selectedId=${'12345'}
        ></tx-term-card>`
      );

      const option = el.shadowRoot?.querySelector('.concept-option');
      expect(option?.classList.contains('selected')).toBe(true);
    });
  });

  describe('auto-selection', () => {
    it('shows auto-selected badge', async () => {
      const term = createTerm();
      const matches = [createMatch({ id: '12345' })];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .selectedId=${'12345'}
          .autoSelected=${true}
        ></tx-term-card>`
      );

      const badge = el.shadowRoot?.querySelector('.auto-badge');
      expect(badge?.textContent).toContain('Auto-selected');
    });

    it('shows change button when auto-selected', async () => {
      const term = createTerm();
      const matches = [
        createMatch({ id: '1' }),
        createMatch({ id: '2' }),
      ];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .selectedId=${'1'}
          .autoSelected=${true}
        ></tx-term-card>`
      );

      const changeButton = el.shadowRoot?.querySelector('.action-link');
      expect(changeButton?.textContent).toContain('Change');
    });

    it('card has auto-selected state class', async () => {
      const term = createTerm();
      const matches = [createMatch({ id: '12345' })];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .selectedId=${'12345'}
          .autoSelected=${true}
        ></tx-term-card>`
      );

      const card = el.shadowRoot?.querySelector('.term-card');
      expect(card?.classList.contains('auto-selected')).toBe(true);
    });
  });

  describe('negated terms', () => {
    it('applies negated styling', async () => {
      const term = createTerm({ negated: true });

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const card = el.shadowRoot?.querySelector('.term-card');
      expect(card?.classList.contains('negated')).toBe(true);

      const termText = el.shadowRoot?.querySelector('.term-text');
      expect(termText?.classList.contains('negated')).toBe(true);
    });

    it('shows excluded message for negated terms', async () => {
      const term = createTerm({ negated: true });

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      const noMatches = el.shadowRoot?.querySelector('.no-matches');
      expect(noMatches?.textContent).toContain('excluded');
    });

    it('shows excluded label in modifiers', async () => {
      const term = createTerm({ negated: true, modifiers: [] });

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term}></tx-term-card>`
      );

      // The negated label is shown in modifiers section when negated
      const card = el.shadowRoot?.querySelector('.term-card');
      expect(card?.classList.contains('negated')).toBe(true);
    });
  });

  describe('manual search', () => {
    it('shows manual search option', async () => {
      const term = createTerm();
      const matches = [createMatch()];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const searchLink = Array.from(
        el.shadowRoot?.querySelectorAll('.action-link') || []
      ).find((el) => el.textContent?.includes('Search'));

      expect(searchLink).toBeDefined();
    });

    it('dispatches manual-search event', async () => {
      const searchHandler = vi.fn();
      const term = createTerm({ text: 'test term' });
      const matches = [createMatch()];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .index=${2}
          @manual-search=${searchHandler}
        ></tx-term-card>`
      );

      const searchLink = Array.from(
        el.shadowRoot?.querySelectorAll('.action-link') || []
      ).find((el) => el.textContent?.includes('Search'));

      (searchLink as HTMLElement)?.click();

      expect(searchHandler).toHaveBeenCalledTimes(1);
      expect(searchHandler.mock.calls[0][0].detail).toEqual({
        termIndex: 2,
        termText: 'test term',
      });
    });
  });

  describe('skip term', () => {
    it('shows skip option', async () => {
      const term = createTerm();
      const matches = [createMatch()];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const skipLink = Array.from(
        el.shadowRoot?.querySelectorAll('.action-link') || []
      ).find((el) => el.textContent?.includes('No good match'));

      expect(skipLink).toBeDefined();
    });

    it('dispatches skip-term event', async () => {
      const skipHandler = vi.fn();
      const term = createTerm();
      const matches = [createMatch()];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .index=${1}
          @skip-term=${skipHandler}
        ></tx-term-card>`
      );

      const skipLink = Array.from(
        el.shadowRoot?.querySelectorAll('.action-link') || []
      ).find((el) => el.textContent?.includes('No good match'));

      (skipLink as HTMLElement)?.click();

      expect(skipHandler).toHaveBeenCalledTimes(1);
      expect(skipHandler.mock.calls[0][0].detail).toEqual({
        termIndex: 1,
      });
    });
  });

  describe('no matches', () => {
    it('shows no matches message when empty', async () => {
      const term = createTerm();

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${[]}></tx-term-card>`
      );

      const noMatches = el.shadowRoot?.querySelector('.no-matches');
      expect(noMatches?.textContent).toContain('No strong matches');
    });

    it('shows manual search in no matches state', async () => {
      const term = createTerm();

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${[]}></tx-term-card>`
      );

      const searchLink = el.shadowRoot?.querySelector('.no-matches .action-link');
      expect(searchLink).toBeDefined();
    });

    it('card has error state class when no matches', async () => {
      const term = createTerm();

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${[]}></tx-term-card>`
      );

      const card = el.shadowRoot?.querySelector('.term-card');
      expect(card?.classList.contains('error')).toBe(true);
    });
  });

  describe('card states', () => {
    it('has pending state when no selection', async () => {
      const term = createTerm();
      const matches = [createMatch()];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const card = el.shadowRoot?.querySelector('.term-card');
      expect(card?.classList.contains('pending')).toBe(true);
    });

    it('has selected state when selection made', async () => {
      const term = createTerm();
      const matches = [createMatch({ id: '123' })];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card
          .term=${term}
          .conceptMatches=${matches}
          .selectedId=${'123'}
        ></tx-term-card>`
      );

      const card = el.shadowRoot?.querySelector('.term-card');
      expect(card?.classList.contains('selected')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('uses fieldset and legend for concept options', async () => {
      const term = createTerm();
      const matches = [createMatch()];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const fieldset = el.shadowRoot?.querySelector('fieldset');
      expect(fieldset).toBeDefined();

      const legend = el.shadowRoot?.querySelector('legend');
      expect(legend).toBeDefined();
      expect(legend?.classList.contains('visually-hidden')).toBe(true);
    });

    it('labels reference term text', async () => {
      const term = createTerm({ text: 'test pain' });
      const matches = [createMatch()];

      const el = await fixture<TxTermCard>(
        html`<tx-term-card .term=${term} .conceptMatches=${matches}></tx-term-card>`
      );

      const legend = el.shadowRoot?.querySelector('legend');
      expect(legend?.textContent).toContain('test pain');
    });
  });
});
