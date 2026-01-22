/**
 * tx-session-history Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import type {
  TxSessionHistory,
  SessionSummary,
} from '../../../../src/components/features/coding/tx-session-history.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-session-history.js';

// Test fixtures
const createSession = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  id: `session-${Math.random().toString(36).substr(2, 9)}`,
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  preview: {
    inputText: 'Patient presents with chest pain',
    firstTerm: 'Chest pain',
    termCount: 2,
  },
  ...overrides,
});

const createCompletedSession = (): SessionSummary =>
  createSession({
    status: 'completed',
    preview: {
      inputText: 'Acute myocardial infarction',
      firstTerm: 'Acute myocardial infarction',
      expressionSnippet: '29857009:{363698007=...}',
      termCount: 3,
    },
  });

const createErrorSession = (): SessionSummary =>
  createSession({
    status: 'error',
    preview: {
      inputText: 'Invalid input',
      firstTerm: 'Error occurred',
      termCount: 0,
    },
  });

describe('tx-session-history', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      expect(el).toBeDefined();
      expect(el.sessions).toEqual([]);
      expect(el.activeSessionId).toBeNull();
      expect(el.loading).toBe(false);
      expect(el.hasMore).toBe(false);
      expect(el.collapsed).toBe(false);
    });

    it('renders sidebar container', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      const sidebar = el.shadowRoot?.querySelector('.sidebar');
      expect(sidebar).toBeDefined();
    });

    it('renders sidebar title', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      const title = el.shadowRoot?.querySelector('.sidebar-title');
      expect(title?.textContent).toBe('Session History');
    });

    it('renders search input', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      const search = el.shadowRoot?.querySelector('tx-input[type="search"]');
      expect(search).toBeDefined();
    });

    it('renders filter buttons', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      const filterBtns = el.shadowRoot?.querySelectorAll('.filter-btn');
      expect(filterBtns?.length).toBe(3);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no sessions', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      const emptyState = el.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('No sessions yet');
    });

    it('shows different message when filtered with no results', async () => {
      const sessions = [createSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${sessions}></tx-session-history>`
      );

      // Apply filter that matches nothing
      const completedFilter = el.shadowRoot?.querySelectorAll('.filter-btn')[2] as HTMLElement;
      completedFilter?.click();
      await el.updateComplete;

      const emptyState = el.shadowRoot?.querySelector('.empty-state');
      expect(emptyState?.textContent).toContain('No matching sessions');
    });
  });

  describe('session list', () => {
    it('renders sessions', async () => {
      const sessions = [createSession(), createSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${sessions}></tx-session-history>`
      );

      const sessionCards = el.shadowRoot?.querySelectorAll('.session-card');
      expect(sessionCards?.length).toBe(2);
    });

    it('shows session title from firstTerm', async () => {
      const session = createSession({
        preview: { firstTerm: 'Test Term', termCount: 1 },
      });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const title = el.shadowRoot?.querySelector('.session-title');
      expect(title?.textContent?.trim()).toBe('Test Term');
    });

    it('shows session title from inputText when no firstTerm', async () => {
      const session = createSession({
        preview: { inputText: 'Input Text Here', termCount: 0 },
      });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const title = el.shadowRoot?.querySelector('.session-title');
      expect(title?.textContent?.trim()).toBe('Input Text Here');
    });

    it('shows term count', async () => {
      const session = createSession({
        preview: { firstTerm: 'Test', termCount: 5 },
      });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const meta = el.shadowRoot?.querySelector('.session-meta');
      expect(meta?.textContent).toContain('5 terms');
    });
  });

  describe('status badges', () => {
    it('shows draft badge', async () => {
      const session = createSession({ status: 'draft' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const badge = el.shadowRoot?.querySelector('.status-badge.draft');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('Draft');
    });

    it('shows completed badge', async () => {
      const session = createCompletedSession();
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const badge = el.shadowRoot?.querySelector('.status-badge.completed');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('Completed');
    });

    it('shows error badge', async () => {
      const session = createErrorSession();
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const badge = el.shadowRoot?.querySelector('.status-badge.error');
      expect(badge).toBeDefined();
      expect(badge?.textContent?.trim()).toBe('Error');
    });
  });

  describe('expression snippet', () => {
    it('shows expression snippet for completed sessions', async () => {
      const session = createCompletedSession();
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const snippet = el.shadowRoot?.querySelector('.expression-snippet');
      expect(snippet).toBeDefined();
      expect(snippet?.textContent?.trim()).toContain('29857009');
    });

    it('does not show snippet for draft sessions', async () => {
      const session = createSession({ status: 'draft' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const snippet = el.shadowRoot?.querySelector('.expression-snippet');
      expect(snippet).toBeNull();
    });
  });

  describe('active session', () => {
    it('highlights active session', async () => {
      const sessions = [
        createSession({ id: 'session-1' }),
        createSession({ id: 'session-2' }),
      ];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${sessions}
          activeSessionId="session-1"
        ></tx-session-history>`
      );

      const cards = el.shadowRoot?.querySelectorAll('.session-card');
      expect(cards?.[0]?.classList.contains('active')).toBe(true);
      expect(cards?.[1]?.classList.contains('active')).toBe(false);
    });

    it('does not show delete button for active session', async () => {
      const session = createSession({ id: 'active-session' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${[session]}
          activeSessionId="active-session"
        ></tx-session-history>`
      );

      const deleteBtn = el.shadowRoot?.querySelector('.delete-btn');
      expect(deleteBtn).toBeNull();
    });
  });

  describe('load session', () => {
    it('dispatches load-session event on click', async () => {
      const session = createSession({ id: 'test-session' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const listener = oneEvent(el, 'load-session');

      const card = el.shadowRoot?.querySelector('.session-card') as HTMLElement;
      card?.click();

      const event = await listener;
      expect(event.detail).toEqual({ sessionId: 'test-session' });
    });

    it('does not dispatch event when clicking active session', async () => {
      const session = createSession({ id: 'active-session' });
      const loadHandler = vi.fn();

      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${[session]}
          activeSessionId="active-session"
          @load-session=${loadHandler}
        ></tx-session-history>`
      );

      const card = el.shadowRoot?.querySelector('.session-card') as HTMLElement;
      card?.click();
      await el.updateComplete;

      expect(loadHandler).not.toHaveBeenCalled();
    });
  });

  describe('delete session', () => {
    it('shows delete button on hover (visible via CSS)', async () => {
      const session = createSession();
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const deleteBtn = el.shadowRoot?.querySelector('.delete-btn');
      expect(deleteBtn).toBeDefined();
    });

    it('shows confirmation modal on delete click', async () => {
      const session = createSession({ id: 'delete-me' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const deleteBtn = el.shadowRoot?.querySelector('.delete-btn') as HTMLElement;
      deleteBtn?.click();
      await el.updateComplete;

      const modal = el.shadowRoot?.querySelector('tx-modal');
      expect(modal?.open).toBe(true);
    });

    it('dispatches delete-session event on confirmation', async () => {
      const session = createSession({ id: 'delete-me' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      // Click delete
      const deleteBtn = el.shadowRoot?.querySelector('.delete-btn') as HTMLElement;
      deleteBtn?.click();
      await el.updateComplete;

      // Confirm
      const listener = oneEvent(el, 'delete-session');
      const confirmBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="destructive"]'
      ) as HTMLElement;
      confirmBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ sessionId: 'delete-me' });
    });

    it('closes modal on cancel', async () => {
      const session = createSession();
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      // Click delete
      const deleteBtn = el.shadowRoot?.querySelector('.delete-btn') as HTMLElement;
      deleteBtn?.click();
      await el.updateComplete;

      // Cancel
      const cancelBtn = el.shadowRoot?.querySelector(
        '.modal-footer tx-button[variant="secondary"]'
      ) as HTMLElement;
      cancelBtn?.click();
      await el.updateComplete;

      const modal = el.shadowRoot?.querySelector('tx-modal');
      expect(modal?.open).toBe(false);
    });
  });

  describe('filtering', () => {
    it('filters by draft status', async () => {
      const sessions = [
        createSession({ id: '1', status: 'draft' }),
        createCompletedSession(),
      ];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${sessions}></tx-session-history>`
      );

      const draftFilter = el.shadowRoot?.querySelectorAll('.filter-btn')[1] as HTMLElement;
      draftFilter?.click();
      await el.updateComplete;

      const cards = el.shadowRoot?.querySelectorAll('.session-card');
      expect(cards?.length).toBe(1);
      expect(cards?.[0]?.querySelector('.status-badge')?.textContent?.trim()).toBe('Draft');
    });

    it('filters by completed status', async () => {
      const sessions = [createSession({ status: 'draft' }), createCompletedSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${sessions}></tx-session-history>`
      );

      const completedFilter = el.shadowRoot?.querySelectorAll('.filter-btn')[2] as HTMLElement;
      completedFilter?.click();
      await el.updateComplete;

      const cards = el.shadowRoot?.querySelectorAll('.session-card');
      expect(cards?.length).toBe(1);
    });

    it('shows all when All filter active', async () => {
      const sessions = [createSession(), createCompletedSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${sessions}></tx-session-history>`
      );

      // First filter to drafts
      const draftFilter = el.shadowRoot?.querySelectorAll('.filter-btn')[1] as HTMLElement;
      draftFilter?.click();
      await el.updateComplete;

      // Then back to all
      const allFilter = el.shadowRoot?.querySelectorAll('.filter-btn')[0] as HTMLElement;
      allFilter?.click();
      await el.updateComplete;

      const cards = el.shadowRoot?.querySelectorAll('.session-card');
      expect(cards?.length).toBe(2);
    });

    it('marks active filter button', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      const filters = el.shadowRoot?.querySelectorAll('.filter-btn');
      expect(filters?.[0]?.classList.contains('active')).toBe(true);

      (filters?.[1] as HTMLElement)?.click();
      await el.updateComplete;

      expect(filters?.[0]?.classList.contains('active')).toBe(false);
      expect(filters?.[1]?.classList.contains('active')).toBe(true);
    });
  });

  describe('search', () => {
    it('filters sessions by search query', async () => {
      vi.useFakeTimers();

      const sessions = [
        createSession({ preview: { firstTerm: 'Chest pain', termCount: 1 } }),
        createSession({ preview: { firstTerm: 'Headache', termCount: 1 } }),
      ];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${sessions}></tx-session-history>`
      );

      const search = el.shadowRoot?.querySelector('tx-input');
      search?.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: 'chest' },
          bubbles: true,
          composed: true,
        })
      );

      // Wait for debounce
      vi.advanceTimersByTime(400);
      await el.updateComplete;

      const cards = el.shadowRoot?.querySelectorAll('.session-card');
      expect(cards?.length).toBe(1);

      vi.useRealTimers();
    });
  });

  describe('load more', () => {
    it('shows load more button when hasMore is true', async () => {
      const sessions = [createSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${sessions}
          ?hasMore=${true}
        ></tx-session-history>`
      );

      const loadMoreBtn = el.shadowRoot?.querySelector('.load-more-container tx-button');
      expect(loadMoreBtn).toBeDefined();
      expect(loadMoreBtn?.textContent?.trim()).toBe('Load More Sessions');
    });

    it('hides load more button when hasMore is false', async () => {
      const sessions = [createSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${sessions}
          ?hasMore=${false}
        ></tx-session-history>`
      );

      const loadMoreBtn = el.shadowRoot?.querySelector('.load-more-container');
      expect(loadMoreBtn).toBeNull();
    });

    it('dispatches load-more event', async () => {
      const sessions = [createSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${sessions}
          ?hasMore=${true}
        ></tx-session-history>`
      );

      const listener = oneEvent(el, 'load-more');

      const loadMoreBtn = el.shadowRoot?.querySelector(
        '.load-more-container tx-button'
      ) as HTMLElement;
      loadMoreBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ offset: 1 });
    });

    it('shows loading spinner when loading', async () => {
      const sessions = [createSession()];
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${sessions}
          ?hasMore=${true}
          ?loading=${true}
        ></tx-session-history>`
      );

      const spinner = el.shadowRoot?.querySelector('.loading-spinner');
      expect(spinner).toBeDefined();
    });
  });

  describe('date grouping', () => {
    it('groups sessions by date', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        createSession({ updatedAt: today.toISOString() }),
        createSession({ updatedAt: yesterday.toISOString() }),
      ];

      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${sessions}></tx-session-history>`
      );

      const dateLabels = el.shadowRoot?.querySelectorAll('.date-label');
      expect(dateLabels?.length).toBe(2);
      expect(dateLabels?.[0]?.textContent).toBe('Today');
      expect(dateLabels?.[1]?.textContent).toBe('Yesterday');
    });
  });

  describe('collapse', () => {
    it('can be collapsed', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history ?collapsed=${true}></tx-session-history>`
      );

      expect(el.collapsed).toBe(true);
      expect(el.hasAttribute('collapsed')).toBe(true);
    });

    it('toggles collapse on button click', async () => {
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history></tx-session-history>`
      );

      expect(el.collapsed).toBe(false);

      const collapseBtn = el.shadowRoot?.querySelector('.collapse-btn') as HTMLElement;
      collapseBtn?.click();
      await el.updateComplete;

      expect(el.collapsed).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has role and aria-selected on session cards', async () => {
      const session = createSession({ id: 'test' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history
          .sessions=${[session]}
          activeSessionId="test"
        ></tx-session-history>`
      );

      const card = el.shadowRoot?.querySelector('.session-card');
      expect(card?.getAttribute('role')).toBe('button');
      expect(card?.getAttribute('aria-selected')).toBe('true');
    });

    it('supports keyboard navigation', async () => {
      const session = createSession({ id: 'test' });
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const listener = oneEvent(el, 'load-session');

      const card = el.shadowRoot?.querySelector('.session-card') as HTMLElement;
      card?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );

      const event = await listener;
      expect(event.detail.sessionId).toBe('test');
    });

    it('has aria-label on delete button', async () => {
      const session = createSession();
      const el = await fixture<TxSessionHistory>(
        html`<tx-session-history .sessions=${[session]}></tx-session-history>`
      );

      const deleteBtn = el.shadowRoot?.querySelector('.delete-btn');
      expect(deleteBtn?.getAttribute('aria-label')).toBe('Delete session');
    });
  });
});
