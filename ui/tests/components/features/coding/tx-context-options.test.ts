/**
 * tx-context-options Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxContextOptions } from '../../../../src/components/features/coding/tx-context-options.js';

// Import component to register custom element
import '../../../../src/components/features/coding/tx-context-options.js';

describe('tx-context-options', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);

      expect(el).toBeDefined();
      expect(el.context).toEqual({});
      expect(el.expanded).toBe(false);
    });

    it('renders panel header', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header');

      expect(header).toBeDefined();
    });

    it('renders Context Options title', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const title = el.shadowRoot?.querySelector('.header-title');

      expect(title?.textContent).toBe('Context Options');
    });

    it('renders toggle icon', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const icon = el.shadowRoot?.querySelector('.toggle-icon');

      expect(icon).toBeDefined();
    });
  });

  describe('collapsed state (default)', () => {
    it('is collapsed by default', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const content = el.shadowRoot?.querySelector('.panel-content');

      expect(content?.classList.contains('expanded')).toBe(false);
    });

    it('has aria-expanded="false" when collapsed', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header');

      expect(header?.getAttribute('aria-expanded')).toBe('false');
    });

    it('content has aria-hidden="true" when collapsed', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const content = el.shadowRoot?.querySelector('.panel-content');

      expect(content?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('expand/collapse', () => {
    it('expands on header click', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;

      header?.click();
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('expanded')).toBe(true);
    });

    it('collapses when clicking header again', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;

      // Expand
      header?.click();
      await el.updateComplete;

      // Collapse
      header?.click();
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('expanded')).toBe(false);
    });

    it('updates aria-expanded when expanded', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;

      header?.click();
      await el.updateComplete;

      expect(header?.getAttribute('aria-expanded')).toBe('true');
    });

    it('toggle icon rotates when expanded', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;

      header?.click();
      await el.updateComplete;

      const icon = el.shadowRoot?.querySelector('.toggle-icon');
      expect(icon?.classList.contains('expanded')).toBe(true);
    });

    it('respects expanded property', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded></tx-context-options>`
      );
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('expanded')).toBe(true);
    });
  });

  describe('keyboard toggle', () => {
    it('expands on Enter key', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;

      header?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('expanded')).toBe(true);
    });

    it('expands on Space key', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header') as HTMLElement;

      header?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      await el.updateComplete;

      const content = el.shadowRoot?.querySelector('.panel-content');
      expect(content?.classList.contains('expanded')).toBe(true);
    });
  });

  describe('specialty dropdown', () => {
    it('renders specialty select', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded></tx-context-options>`
      );
      await el.updateComplete;

      const specialtySelect = el.shadowRoot?.querySelector('tx-select[label="Specialty"]');
      expect(specialtySelect).toBeDefined();
    });

    it('has correct specialty options', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded></tx-context-options>`
      );
      await el.updateComplete;

      const specialtySelect = el.shadowRoot?.querySelector(
        'tx-select[label="Specialty"]'
      ) as HTMLElement & { options: Array<{ value: string; label: string }> };

      expect(specialtySelect?.options.length).toBe(9);
      expect(specialtySelect?.options[0]?.label).toBe('Not specified');
      expect(specialtySelect?.options[1]?.label).toBe('Cardiology');
    });

    it('emits context-change on specialty selection', async () => {
      const changeHandler = vi.fn();
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded @context-change=${changeHandler}></tx-context-options>`
      );
      await el.updateComplete;

      const specialtySelect = el.shadowRoot?.querySelector('tx-select[label="Specialty"]');
      specialtySelect?.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: 'cardiology', label: 'Cardiology' },
        })
      );
      await el.updateComplete;

      expect(changeHandler).toHaveBeenCalled();
      expect(changeHandler.mock.calls[0][0].detail.specialty).toBe('cardiology');
    });
  });

  describe('setting dropdown', () => {
    it('renders setting select', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded></tx-context-options>`
      );
      await el.updateComplete;

      const settingSelect = el.shadowRoot?.querySelector('tx-select[label="Clinical Setting"]');
      expect(settingSelect).toBeDefined();
    });

    it('has correct setting options', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded></tx-context-options>`
      );
      await el.updateComplete;

      const settingSelect = el.shadowRoot?.querySelector(
        'tx-select[label="Clinical Setting"]'
      ) as HTMLElement & { options: Array<{ value: string; label: string }> };

      expect(settingSelect?.options.length).toBe(5);
      expect(settingSelect?.options[0]?.label).toBe('Not specified');
      expect(settingSelect?.options[1]?.label).toBe('Emergency');
    });

    it('emits context-change on setting selection', async () => {
      const changeHandler = vi.fn();
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded @context-change=${changeHandler}></tx-context-options>`
      );
      await el.updateComplete;

      const settingSelect = el.shadowRoot?.querySelector('tx-select[label="Clinical Setting"]');
      settingSelect?.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: 'emergency', label: 'Emergency' },
        })
      );
      await el.updateComplete;

      expect(changeHandler).toHaveBeenCalled();
      expect(changeHandler.mock.calls[0][0].detail.setting).toBe('emergency');
    });
  });

  describe('context property', () => {
    it('sets specialty from context property', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options
          expanded
          .context=${{ specialty: 'neurology' }}
        ></tx-context-options>`
      );
      await el.updateComplete;

      const specialtySelect = el.shadowRoot?.querySelector(
        'tx-select[label="Specialty"]'
      ) as HTMLElement & { value: string };

      expect(specialtySelect?.value).toBe('neurology');
    });

    it('sets setting from context property', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options
          expanded
          .context=${{ setting: 'inpatient' }}
        ></tx-context-options>`
      );
      await el.updateComplete;

      const settingSelect = el.shadowRoot?.querySelector(
        'tx-select[label="Clinical Setting"]'
      ) as HTMLElement & { value: string };

      expect(settingSelect?.value).toBe('inpatient');
    });

    it('sets both from context property', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options
          expanded
          .context=${{ specialty: 'cardiology', setting: 'emergency' }}
        ></tx-context-options>`
      );
      await el.updateComplete;

      const specialtySelect = el.shadowRoot?.querySelector(
        'tx-select[label="Specialty"]'
      ) as HTMLElement & { value: string };
      const settingSelect = el.shadowRoot?.querySelector(
        'tx-select[label="Clinical Setting"]'
      ) as HTMLElement & { value: string };

      expect(specialtySelect?.value).toBe('cardiology');
      expect(settingSelect?.value).toBe('emergency');
    });
  });

  describe('context-change event', () => {
    it('includes only set values in event', async () => {
      const changeHandler = vi.fn();
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded @context-change=${changeHandler}></tx-context-options>`
      );
      await el.updateComplete;

      const specialtySelect = el.shadowRoot?.querySelector('tx-select[label="Specialty"]');
      specialtySelect?.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: 'cardiology', label: 'Cardiology' },
        })
      );
      await el.updateComplete;

      // Should only have specialty, not setting
      expect(changeHandler.mock.calls[0][0].detail).toEqual({ specialty: 'cardiology' });
    });

    it('includes both values when both are set', async () => {
      const changeHandler = vi.fn();
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options
          expanded
          .context=${{ specialty: 'cardiology' }}
          @context-change=${changeHandler}
        ></tx-context-options>`
      );
      await el.updateComplete;

      const settingSelect = el.shadowRoot?.querySelector('tx-select[label="Clinical Setting"]');
      settingSelect?.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: 'emergency', label: 'Emergency' },
        })
      );
      await el.updateComplete;

      expect(changeHandler.mock.calls[0][0].detail).toEqual({
        specialty: 'cardiology',
        setting: 'emergency',
      });
    });

    it('emits empty object when values cleared', async () => {
      const changeHandler = vi.fn();
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options
          expanded
          .context=${{ specialty: 'cardiology' }}
          @context-change=${changeHandler}
        ></tx-context-options>`
      );
      await el.updateComplete;

      const specialtySelect = el.shadowRoot?.querySelector('tx-select[label="Specialty"]');
      specialtySelect?.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: '', label: 'Not specified' },
        })
      );
      await el.updateComplete;

      expect(changeHandler.mock.calls[0][0].detail).toEqual({});
    });
  });

  describe('helper text', () => {
    it('renders helper text', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded></tx-context-options>`
      );
      await el.updateComplete;

      const helperText = el.shadowRoot?.querySelector('.helper-text');
      expect(helperText).toBeDefined();
      expect(helperText?.textContent).toContain('Specialty options improve AI accuracy');
    });
  });

  describe('accessibility', () => {
    it('header has role="button"', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header');

      expect(header?.getAttribute('role')).toBe('button');
    });

    it('header has tabindex="0"', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header');

      expect(header?.getAttribute('tabindex')).toBe('0');
    });

    it('header has aria-controls pointing to content', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const header = el.shadowRoot?.querySelector('.panel-header');
      const content = el.shadowRoot?.querySelector('.panel-content');

      expect(header?.getAttribute('aria-controls')).toBe(content?.id);
    });

    it('toggle icon has aria-hidden="true"', async () => {
      const el = await fixture<TxContextOptions>(html`<tx-context-options></tx-context-options>`);
      const icon = el.shadowRoot?.querySelector('.toggle-icon');

      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('grid layout', () => {
    it('renders options in two-column grid', async () => {
      const el = await fixture<TxContextOptions>(
        html`<tx-context-options expanded></tx-context-options>`
      );
      await el.updateComplete;

      const grid = el.shadowRoot?.querySelector('.options-grid');
      expect(grid).toBeDefined();

      const selects = grid?.querySelectorAll('tx-select');
      expect(selects?.length).toBe(2);
    });
  });
});
