/**
 * TxMobileTabs Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import '../../../src/components/features/coding/tx-mobile-tabs.js';
import type { TxMobileTabs, MobileTabConfig } from '../../../src/components/features/coding/tx-mobile-tabs.js';

const defaultTabs: MobileTabConfig[] = [
  { id: 'terms', label: 'Terms', icon: '📋', badge: 3 },
  { id: 'questions', label: 'Questions', icon: '❓', badge: 2 },
  { id: 'ecl', label: 'ECL', icon: '📝' },
];

describe('tx-mobile-tabs', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxMobileTabs>(html`<tx-mobile-tabs></tx-mobile-tabs>`);

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('tx-mobile-tabs');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxMobileTabs>(html`<tx-mobile-tabs></tx-mobile-tabs>`);

      expect(el.shadowRoot).toBeDefined();
    });

    it('renders tabs from tabs property', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');

      expect(tabs?.length).toBe(3);
    });

    it('displays tab labels', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const labels = el.shadowRoot?.querySelectorAll('.tab-label');

      expect(labels?.[0]?.textContent).toBe('Terms');
      expect(labels?.[1]?.textContent).toBe('Questions');
      expect(labels?.[2]?.textContent).toBe('ECL');
    });

    it('displays tab icons', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const icons = el.shadowRoot?.querySelectorAll('.tab-icon');

      expect(icons?.[0]?.textContent).toBe('📋');
      expect(icons?.[1]?.textContent).toBe('❓');
      expect(icons?.[2]?.textContent).toBe('📝');
    });

    it('displays badges when present', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const badges = el.shadowRoot?.querySelectorAll('.badge');

      expect(badges?.length).toBe(2); // Only 2 tabs have badges
      expect(badges?.[0]?.textContent?.trim()).toBe('3');
      expect(badges?.[1]?.textContent?.trim()).toBe('2');
    });

    it('does not display badge when count is 0', async () => {
      const tabs = [{ id: 'test', label: 'Test', badge: 0 }];
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${tabs}></tx-mobile-tabs>`
      );

      const badges = el.shadowRoot?.querySelectorAll('.badge');

      expect(badges?.length).toBe(0);
    });

    it('shows 99+ for large badge counts', async () => {
      const tabs = [{ id: 'test', label: 'Test', badge: 150 }];
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${tabs}></tx-mobile-tabs>`
      );

      const badge = el.shadowRoot?.querySelector('.badge');

      expect(badge?.textContent?.trim()).toBe('99+');
    });
  });

  describe('active state', () => {
    it('marks active tab', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="questions"></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      const activeTab = tabs?.[1];

      expect(activeTab?.classList.contains('active')).toBe(true);
    });

    it('sets aria-selected on active tab', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="terms"></tx-mobile-tabs>`
      );

      const activeTab = el.shadowRoot?.querySelector('.tab');

      expect(activeTab?.getAttribute('aria-selected')).toBe('true');
    });

    it('sets tabindex=0 on active tab', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="terms"></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');

      expect(tabs?.[0]?.getAttribute('tabindex')).toBe('0');
      expect(tabs?.[1]?.getAttribute('tabindex')).toBe('-1');
      expect(tabs?.[2]?.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('events', () => {
    it('dispatches tab-change event on click', async () => {
      const handler = vi.fn();
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs
          .tabs=${defaultTabs}
          activeTab="terms"
          @tab-change=${handler}
        ></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      (tabs?.[1] as HTMLButtonElement)?.click();

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual({
        tab: 'questions',
        previousTab: 'terms',
      });
    });

    it('does not dispatch event when clicking active tab', async () => {
      const handler = vi.fn();
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs
          .tabs=${defaultTabs}
          activeTab="terms"
          @tab-change=${handler}
        ></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      (tabs?.[0] as HTMLButtonElement)?.click();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus right with ArrowRight', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="terms"></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      const firstTab = tabs?.[0] as HTMLButtonElement;
      firstTab?.focus();

      firstTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

      expect(document.activeElement?.shadowRoot?.activeElement).toBe(tabs?.[1]);
    });

    it('moves focus left with ArrowLeft', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="questions"></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      const secondTab = tabs?.[1] as HTMLButtonElement;
      secondTab?.focus();

      secondTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

      expect(document.activeElement?.shadowRoot?.activeElement).toBe(tabs?.[0]);
    });

    it('wraps focus from last to first with ArrowRight', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="ecl"></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      const lastTab = tabs?.[2] as HTMLButtonElement;
      lastTab?.focus();

      lastTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

      expect(document.activeElement?.shadowRoot?.activeElement).toBe(tabs?.[0]);
    });

    it('goes to first tab with Home key', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="ecl"></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      const lastTab = tabs?.[2] as HTMLButtonElement;
      lastTab?.focus();

      lastTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));

      expect(document.activeElement?.shadowRoot?.activeElement).toBe(tabs?.[0]);
    });

    it('goes to last tab with End key', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} activeTab="terms"></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');
      const firstTab = tabs?.[0] as HTMLButtonElement;
      firstTab?.focus();

      firstTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));

      expect(document.activeElement?.shadowRoot?.activeElement).toBe(tabs?.[2]);
    });
  });

  describe('accessibility', () => {
    it('tabs have role="tab"', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');

      tabs?.forEach((tab) => {
        expect(tab.getAttribute('role')).toBe('tab');
      });
    });

    it('tabs have aria-controls', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const tabs = el.shadowRoot?.querySelectorAll('.tab');

      expect(tabs?.[0]?.getAttribute('aria-controls')).toBe('panel-terms');
      expect(tabs?.[1]?.getAttribute('aria-controls')).toBe('panel-questions');
      expect(tabs?.[2]?.getAttribute('aria-controls')).toBe('panel-ecl');
    });

    it('badges have aria-label', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const badges = el.shadowRoot?.querySelectorAll('.badge');

      expect(badges?.[0]?.getAttribute('aria-label')).toBe('3 items');
    });

    it('icons are hidden from screen readers', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs}></tx-mobile-tabs>`
      );

      const icons = el.shadowRoot?.querySelectorAll('.tab-icon');

      icons?.forEach((icon) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });

  describe('pulse badges', () => {
    it('adds pulse class when pulseBadges is true', async () => {
      const el = await fixture<TxMobileTabs>(
        html`<tx-mobile-tabs .tabs=${defaultTabs} ?pulseBadges=${true}></tx-mobile-tabs>`
      );

      const badges = el.shadowRoot?.querySelectorAll('.badge');

      badges?.forEach((badge) => {
        expect(badge.classList.contains('pulse')).toBe(true);
      });
    });
  });
});
