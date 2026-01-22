/**
 * TxFab Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import '../../../src/components/features/coding/tx-fab.js';
import type { TxFab, FabAction } from '../../../src/components/features/coding/tx-fab.js';

const secondaryActions: FabAction[] = [
  { id: 'save-draft', icon: '💾', label: 'Save Draft' },
  { id: 'copy', icon: '📋', label: 'Copy Expression' },
  { id: 'export', icon: '📤', label: 'Export', disabled: true },
];

describe('tx-fab', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('tx-fab');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      expect(el.shadowRoot).toBeDefined();
    });

    it('renders fab button', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab).toBeDefined();
    });

    it('displays default icon', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      const icon = el.shadowRoot?.querySelector('.fab-icon');

      expect(icon?.textContent?.trim()).toBe('✓');
    });

    it('displays custom icon', async () => {
      const el = await fixture<TxFab>(html`<tx-fab icon="➕"></tx-fab>`);

      const icon = el.shadowRoot?.querySelector('.fab-icon');

      expect(icon?.textContent?.trim()).toBe('➕');
    });
  });

  describe('label property', () => {
    it('renders extended FAB with label', async () => {
      const el = await fixture<TxFab>(html`<tx-fab label="Confirm"></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab');
      const label = el.shadowRoot?.querySelector('.fab-label');

      expect(fab?.classList.contains('extended')).toBe(true);
      expect(label?.textContent).toBe('Confirm');
    });

    it('does not show label element when empty', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      const label = el.shadowRoot?.querySelector('.fab-label');

      expect(label).toBeFalsy();
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled is true', async () => {
      const el = await fixture<TxFab>(html`<tx-fab ?disabled=${true}></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;

      expect(fab?.disabled).toBe(true);
    });

    it('button has disabled attribute', async () => {
      const el = await fixture<TxFab>(html`<tx-fab ?disabled=${true}></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;

      expect(fab?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('loading state', () => {
    it('adds loading class when loading is true', async () => {
      const el = await fixture<TxFab>(html`<tx-fab ?loading=${true}></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.classList.contains('loading')).toBe(true);
    });

    it('shows loading icon when loading', async () => {
      const el = await fixture<TxFab>(html`<tx-fab ?loading=${true}></tx-fab>`);

      const icon = el.shadowRoot?.querySelector('.fab-icon');

      expect(icon?.textContent?.trim()).toBe('⟳');
    });

    it('has loading property set', async () => {
      const el = await fixture<TxFab>(html`<tx-fab ?loading=${true}></tx-fab>`);

      expect(el.loading).toBe(true);
    });
  });

  describe('hidden state', () => {
    it('adds hidden class when hidden is true', async () => {
      const el = await fixture<TxFab>(html`<tx-fab ?hidden=${true}></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('click events', () => {
    it('dispatches click event when clicked', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;

      setTimeout(() => fab?.click());
      const event = await oneEvent(el, 'click');

      expect(event).toBeDefined();
    });
  });

  describe('secondary actions', () => {
    it('renders secondary actions menu', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const actionsMenu = el.shadowRoot?.querySelector('.secondary-actions');

      expect(actionsMenu).toBeDefined();
    });

    it('renders correct number of secondary action buttons', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const actionButtons = el.shadowRoot?.querySelectorAll('.secondary-action');

      expect(actionButtons?.length).toBe(3);
    });

    it('secondary actions have correct labels', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const actionButtons = el.shadowRoot?.querySelectorAll('.secondary-action');

      expect(actionButtons?.[0]?.textContent).toContain('Save Draft');
      expect(actionButtons?.[1]?.textContent).toContain('Copy Expression');
      expect(actionButtons?.[2]?.textContent).toContain('Export');
    });

    it('disables actions with disabled flag', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const actionButtons = el.shadowRoot?.querySelectorAll('.secondary-action');
      const disabledButton = actionButtons?.[2] as HTMLButtonElement;

      expect(disabledButton?.disabled).toBe(true);
    });

    it('toggles menu on FAB click when has secondary actions', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;
      fab?.click();
      await el.updateComplete;

      const actionsMenu = el.shadowRoot?.querySelector('.secondary-actions');

      expect(actionsMenu?.classList.contains('open')).toBe(true);
    });

    it('shows plus icon when expanded', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;
      fab?.click();
      await el.updateComplete;

      const icon = el.shadowRoot?.querySelector('.fab-icon');

      expect(icon?.textContent?.trim()).toBe('+');
    });

    it('adds expanded class when menu is open', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;
      fab?.click();
      await el.updateComplete;

      expect(fab?.classList.contains('expanded')).toBe(true);
    });

    it('dispatches action event when secondary action clicked', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      // Open menu first
      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;
      fab?.click();
      await el.updateComplete;

      const actionButton = el.shadowRoot?.querySelector('.secondary-action') as HTMLButtonElement;

      setTimeout(() => actionButton?.click());
      const event = await oneEvent(el, 'action');

      expect(event.detail).toEqual({ actionId: 'save-draft' });
    });

    it('closes menu after action is clicked', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      // Open menu first
      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;
      fab?.click();
      await el.updateComplete;

      const actionButton = el.shadowRoot?.querySelector('.secondary-action') as HTMLButtonElement;
      actionButton?.click();
      await el.updateComplete;

      const actionsMenu = el.shadowRoot?.querySelector('.secondary-actions');

      expect(actionsMenu?.classList.contains('open')).toBe(false);
    });

    it('does not render secondary actions menu when empty', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      const actionsMenu = el.shadowRoot?.querySelector('.secondary-actions');

      expect(actionsMenu).toBeFalsy();
    });
  });

  describe('accessibility', () => {
    it('uses ariaLabel property for aria-label', async () => {
      const el = await fixture<TxFab>(html`<tx-fab ariaLabel="Confirm selection"></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.getAttribute('aria-label')).toBe('Confirm selection');
    });

    it('falls back to label for aria-label', async () => {
      const el = await fixture<TxFab>(html`<tx-fab label="Confirm"></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.getAttribute('aria-label')).toBe('Confirm');
    });

    it('uses default aria-label for primary action', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.getAttribute('aria-label')).toBe('Primary action');
    });

    it('uses menu aria-label when has secondary actions', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.getAttribute('aria-label')).toBe('Open actions menu');
    });

    it('has aria-expanded when has secondary actions', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.getAttribute('aria-expanded')).toBe('false');
    });

    it('updates aria-expanded when menu opens', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const fab = el.shadowRoot?.querySelector('.fab') as HTMLButtonElement;
      fab?.click();
      await el.updateComplete;

      expect(fab?.getAttribute('aria-expanded')).toBe('true');
    });

    it('has aria-haspopup when has secondary actions', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const fab = el.shadowRoot?.querySelector('.fab');

      expect(fab?.getAttribute('aria-haspopup')).toBe('true');
    });

    it('secondary action buttons have aria-label', async () => {
      const el = await fixture<TxFab>(
        html`<tx-fab .secondaryActions=${secondaryActions}></tx-fab>`
      );

      const actionButtons = el.shadowRoot?.querySelectorAll('.secondary-action');

      expect(actionButtons?.[0]?.getAttribute('aria-label')).toBe('Save Draft');
      expect(actionButtons?.[1]?.getAttribute('aria-label')).toBe('Copy Expression');
    });

    it('icon has aria-hidden="true"', async () => {
      const el = await fixture<TxFab>(html`<tx-fab></tx-fab>`);

      const icon = el.shadowRoot?.querySelector('.fab-icon');

      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
