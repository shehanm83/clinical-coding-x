/**
 * tx-concept-selector Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import type {
  TxConceptSelector,
  ExtractedTerm,
  ConceptMatch,
  ConceptExplanation,
} from '../../../../src/components/features/coding/tx-concept-selector.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-concept-selector.js';

// Test fixtures
const createTerm = (overrides: Partial<ExtractedTerm> = {}): ExtractedTerm => ({
  text: 'chest pain',
  type: 'finding',
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

const createExplanation = (
  overrides: Partial<ConceptExplanation> = {}
): ConceptExplanation => ({
  conceptId: '29857009',
  explanation: 'This concept matches because...',
  differentiatingFactors: ['Factor 1', 'Factor 2'],
  ...overrides,
});

describe('tx-concept-selector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector></tx-concept-selector>`
      );

      expect(el).toBeDefined();
      expect(el.open).toBe(false);
      expect(el.conceptMatches).toEqual([]);
      expect(el.searchResults).toEqual([]);
    });

    it('renders modal when open', async () => {
      const term = createTerm();
      const matches = [createMatch()];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .term=${term}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const modal = el.shadowRoot?.querySelector('tx-modal');
      expect(modal).toBeDefined();
      expect(modal?.getAttribute('open')).not.toBeNull();
    });

    it('displays term text in header', async () => {
      const term = createTerm({ text: 'acute chest pain' });

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .term=${term}
        ></tx-concept-selector>`
      );

      const header = el.shadowRoot?.querySelector('[slot="header"]');
      expect(header?.textContent).toContain('acute chest pain');
    });

    it('renders search input', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector ?open=${true}></tx-concept-selector>`
      );

      const searchInput = el.shadowRoot?.querySelector('.search-input');
      expect(searchInput).toBeDefined();
    });
  });

  describe('concept matches display', () => {
    it('renders all matches', async () => {
      const term = createTerm();
      const matches = [
        createMatch({ id: '1', term: 'Concept 1' }),
        createMatch({ id: '2', term: 'Concept 2' }),
        createMatch({ id: '3', term: 'Concept 3' }),
      ];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .term=${term}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const options = el.shadowRoot?.querySelectorAll('.concept-option');
      expect(options?.length).toBe(3);
    });

    it('displays concept term and ID', async () => {
      const matches = [createMatch({ id: '29857009', term: 'Chest pain' })];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const conceptTerm = el.shadowRoot?.querySelector('.concept-term');
      const conceptId = el.shadowRoot?.querySelector('.concept-id');

      expect(conceptTerm?.textContent).toBe('Chest pain');
      expect(conceptId?.textContent).toBe('29857009');
    });

    it('displays FSN and semantic tag', async () => {
      const matches = [
        createMatch({
          fsn: 'Chest pain (finding)',
          semanticTag: 'finding',
        }),
      ];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const fsn = el.shadowRoot?.querySelector('.concept-fsn');
      const tag = el.shadowRoot?.querySelector('.semantic-tag');

      expect(fsn?.textContent).toBe('Chest pain (finding)');
      expect(tag?.textContent).toBe('finding');
    });

    it('shows similarity badge with correct color class', async () => {
      const matches = [createMatch({ similarity: 95 })];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const badge = el.shadowRoot?.querySelector('.similarity-badge');
      expect(badge?.textContent?.trim()).toBe('95%');
      expect(badge?.classList.contains('similarity-high')).toBe(true);
    });

    it('applies correct similarity class for medium', async () => {
      const matches = [createMatch({ similarity: 75 })];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const badge = el.shadowRoot?.querySelector('.similarity-badge');
      expect(badge?.classList.contains('similarity-medium')).toBe(true);
    });

    it('applies correct similarity class for low', async () => {
      const matches = [createMatch({ similarity: 50 })];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const badge = el.shadowRoot?.querySelector('.similarity-badge');
      expect(badge?.classList.contains('similarity-low')).toBe(true);
    });

    it('shows empty state when no matches', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${[]}
        ></tx-concept-selector>`
      );

      const emptyState = el.shadowRoot?.querySelector('.empty-state');
      expect(emptyState?.textContent).toContain('No suggested matches');
    });
  });

  describe('concept selection', () => {
    it('marks selected concept', async () => {
      const matches = [createMatch({ id: '12345' })];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      // Click the option
      const option = el.shadowRoot?.querySelector(
        '.concept-option'
      ) as HTMLElement;
      option?.click();

      await el.updateComplete;

      expect(option?.classList.contains('selected')).toBe(true);
    });

    it('dispatches select event on confirm', async () => {
      const matches = [createMatch({ id: '12345' })];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      // Select the option
      const option = el.shadowRoot?.querySelector(
        '.concept-option'
      ) as HTMLElement;
      option?.click();
      await el.updateComplete;

      // Click confirm
      const listener = oneEvent(el, 'select');
      const confirmBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="primary"]'
      ) as HTMLElement;
      confirmBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ conceptId: '12345' });
    });

    it('disables confirm button when no selection', async () => {
      const matches = [createMatch()];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const confirmBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="primary"]'
      );
      expect(confirmBtn?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('search functionality', () => {
    it('debounces search input', async () => {
      const searchHandler = vi.fn();

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          @search=${searchHandler}
        ></tx-concept-selector>`
      );

      const input = el.shadowRoot?.querySelector(
        '.search-input'
      ) as HTMLInputElement;

      // Type in search
      input.value = 'test query';
      input.dispatchEvent(new Event('input'));

      // Should not fire immediately
      expect(searchHandler).not.toHaveBeenCalled();

      // Fast forward debounce
      vi.advanceTimersByTime(300);

      expect(searchHandler).toHaveBeenCalledTimes(1);
      expect(searchHandler.mock.calls[0][0].detail).toEqual({
        query: 'test query',
      });
    });

    it('does not search for empty query', async () => {
      const searchHandler = vi.fn();

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          @search=${searchHandler}
        ></tx-concept-selector>`
      );

      const input = el.shadowRoot?.querySelector(
        '.search-input'
      ) as HTMLInputElement;

      // Type empty search
      input.value = '   ';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(300);

      expect(searchHandler).not.toHaveBeenCalled();
    });

    it('displays loading indicator when loading', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          ?loading=${true}
        ></tx-concept-selector>`
      );

      const loadingIndicator =
        el.shadowRoot?.querySelector('.loading-indicator');
      expect(loadingIndicator).toBeDefined();
      expect(loadingIndicator?.textContent).toContain('Searching');
    });

    it('displays search results', async () => {
      const matches = [createMatch({ id: '1' })];
      const searchResults = [
        createMatch({ id: '2', term: 'Search Result 1' }),
        createMatch({ id: '3', term: 'Search Result 2' }),
      ];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
          .searchResults=${searchResults}
        ></tx-concept-selector>`
      );

      const searchSection = el.shadowRoot?.querySelector(
        '.search-results-section'
      );
      expect(searchSection).toBeDefined();

      // Should show 2 search results (not duplicates of matches)
      const searchResultOptions = searchSection?.querySelectorAll(
        '.concept-option'
      );
      expect(searchResultOptions?.length).toBe(2);
    });
  });

  describe('keyboard navigation', () => {
    it('arrow down moves focus to next option', async () => {
      const matches = [
        createMatch({ id: '1' }),
        createMatch({ id: '2' }),
      ];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      // First option should be focused by default
      const focusedOption = el.shadowRoot?.querySelector('.focused');
      expect(focusedOption).toBeDefined();

      // Press arrow down - find the div containing search-section (the keydown handler parent)
      const container = el.shadowRoot?.querySelector('.search-section')?.parentElement;
      container?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      );

      await el.updateComplete;

      // Second option should now be focused
      const options = el.shadowRoot?.querySelectorAll('.concept-option');
      expect(options?.[1]?.classList.contains('focused')).toBe(true);
    });

    it('arrow up moves focus to previous option', async () => {
      const matches = [
        createMatch({ id: '1' }),
        createMatch({ id: '2' }),
      ];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      // Move to second option first
      const container = el.shadowRoot?.querySelector('.search-section')?.parentElement;
      container?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      );
      await el.updateComplete;

      // Press arrow up
      container?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      );
      await el.updateComplete;

      // First option should be focused again
      const options = el.shadowRoot?.querySelectorAll('.concept-option');
      expect(options?.[0]?.classList.contains('focused')).toBe(true);
    });

    it('enter selects focused option', async () => {
      const matches = [createMatch({ id: '12345' })];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const listener = oneEvent(el, 'select');

      // Press enter to select first option
      const container = el.shadowRoot?.querySelector('.search-section')?.parentElement;
      container?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );

      // Then click confirm (since Enter only selects, not confirms)
      await el.updateComplete;
      const confirmBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="primary"]'
      ) as HTMLElement;
      confirmBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ conceptId: '12345' });
    });

    it('slash focuses search input', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector ?open=${true}></tx-concept-selector>`
      );

      const searchInput = el.shadowRoot?.querySelector(
        '.search-input'
      ) as HTMLInputElement;

      // Press slash
      const container = el.shadowRoot?.querySelector('.search-section')?.parentElement;
      container?.dispatchEvent(
        new KeyboardEvent('keydown', { key: '/', bubbles: true })
      );

      // Search input should be focused
      await el.updateComplete;
      expect(el.shadowRoot?.activeElement).toBe(searchInput);
    });
  });

  describe('skip functionality', () => {
    it('renders skip option', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector ?open=${true}></tx-concept-selector>`
      );

      const skipOption = el.shadowRoot?.querySelector('.skip-option');
      expect(skipOption).toBeDefined();
      expect(skipOption?.textContent).toContain('No good match');
    });

    it('dispatches skip event when selected', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector ?open=${true}></tx-concept-selector>`
      );

      const listener = oneEvent(el, 'skip');

      const skipRadio = el.shadowRoot?.querySelector(
        '.skip-option input[type="radio"]'
      ) as HTMLInputElement;
      skipRadio?.click();

      const event = await listener;
      expect(event).toBeDefined();
    });
  });

  describe('explanations', () => {
    it('shows explanation toggle when available', async () => {
      const matches = [createMatch({ id: '29857009' })];
      const explanations = {
        '29857009': createExplanation({ conceptId: '29857009' }),
      };

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
          .explanations=${explanations}
        ></tx-concept-selector>`
      );

      const toggle = el.shadowRoot?.querySelector('.explanation-toggle');
      expect(toggle).toBeDefined();
      expect(toggle?.textContent).toContain('Why this match?');
    });

    it('expands explanation on click', async () => {
      const matches = [createMatch({ id: '29857009' })];
      const explanations = {
        '29857009': createExplanation({
          conceptId: '29857009',
          explanation: 'Test explanation text',
        }),
      };

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
          .explanations=${explanations}
        ></tx-concept-selector>`
      );

      // Click toggle
      const toggle = el.shadowRoot?.querySelector(
        '.explanation-toggle'
      ) as HTMLElement;
      toggle?.click();
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.explanation-content');
      expect(content).toBeDefined();
      expect(content?.textContent).toContain('Test explanation text');
    });

    it('shows differentiating factors', async () => {
      const matches = [createMatch({ id: '29857009' })];
      const explanations = {
        '29857009': createExplanation({
          conceptId: '29857009',
          differentiatingFactors: ['Factor A', 'Factor B'],
        }),
      };

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
          .explanations=${explanations}
        ></tx-concept-selector>`
      );

      // Expand explanation
      const toggle = el.shadowRoot?.querySelector(
        '.explanation-toggle'
      ) as HTMLElement;
      toggle?.click();
      await el.updateComplete;

      const factors = el.shadowRoot?.querySelectorAll(
        '.differentiating-factors li'
      );
      expect(factors?.length).toBe(2);
    });
  });

  describe('modal behavior', () => {
    it('dispatches close event on cancel', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector ?open=${true}></tx-concept-selector>`
      );

      const listener = oneEvent(el, 'close');

      const cancelBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="secondary"]'
      ) as HTMLElement;
      cancelBtn?.click();

      const event = await listener;
      expect(event).toBeDefined();
    });

    it('displays keyboard hints', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector ?open=${true}></tx-concept-selector>`
      );

      const hints = el.shadowRoot?.querySelector('.keyboard-hint');
      expect(hints).toBeDefined();
      expect(hints?.textContent).toContain('Navigate');
      expect(hints?.textContent).toContain('Select');
      expect(hints?.textContent).toContain('Search');
    });
  });

  describe('accessibility', () => {
    it('uses fieldset and legend', async () => {
      const matches = [createMatch()];

      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector
          ?open=${true}
          .conceptMatches=${matches}
        ></tx-concept-selector>`
      );

      const fieldset = el.shadowRoot?.querySelector('fieldset');
      expect(fieldset).toBeDefined();

      const legend = el.shadowRoot?.querySelector('legend');
      expect(legend).toBeDefined();
      expect(legend?.classList.contains('visually-hidden')).toBe(true);
    });

    it('search input has aria-label', async () => {
      const el = await fixture<TxConceptSelector>(
        html`<tx-concept-selector ?open=${true}></tx-concept-selector>`
      );

      const input = el.shadowRoot?.querySelector('.search-input');
      expect(input?.getAttribute('aria-label')).toBe('Search for concepts');
    });
  });
});
