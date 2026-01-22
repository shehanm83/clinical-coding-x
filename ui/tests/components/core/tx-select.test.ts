/**
 * tx-select Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxSelect, SelectOption } from '../../../src/components/core/tx-select.js';

const sampleOptions: SelectOption[] = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' },
  { label: 'Disabled Option', value: 'disabled', disabled: true },
];

describe('tx-select', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxSelect>(html`<tx-select></tx-select>`);

      expect(el).toBeDefined();
      expect(el.value).toBe('');
      expect(el.disabled).toBe(false);
      expect(el.required).toBe(false);
      expect(el.error).toBe(false);
    });

    it('renders trigger button', async () => {
      const el = await fixture<TxSelect>(html`<tx-select></tx-select>`);
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger).toBeDefined();
    });

    it('shows placeholder when no value selected', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select placeholder="Select option"></tx-select>`
      );
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger?.textContent?.trim()).toBe('Select option');
      expect(trigger?.classList.contains('placeholder')).toBe(true);
    });

    it('shows selected label when value is set', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} value="opt2"></tx-select>`
      );
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger?.textContent?.trim()).toBe('Option 2');
    });
  });

  describe('label', () => {
    it('renders label when provided', async () => {
      const el = await fixture<TxSelect>(html`<tx-select label="Category"></tx-select>`);
      const label = el.shadowRoot?.querySelector('label');

      expect(label).toBeDefined();
      expect(label?.textContent?.trim()).toContain('Category');
    });

    it('shows required indicator when required', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select label="Category" required></tx-select>`
      );
      const required = el.shadowRoot?.querySelector('.required');

      expect(required).toBeDefined();
      expect(required?.textContent).toBe('*');
    });
  });

  describe('dropdown', () => {
    it('dropdown is hidden by default', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );
      const dropdown = el.shadowRoot?.querySelector('.dropdown');

      expect(dropdown?.classList.contains('open')).toBe(false);
    });

    it('opens dropdown on trigger click', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );
      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;

      trigger?.click();
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown');
      expect(dropdown?.classList.contains('open')).toBe(true);
    });

    it('renders all options in dropdown', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const options = el.shadowRoot?.querySelectorAll('.dropdown-option');
      expect(options?.length).toBe(4);
    });

    it('shows "No options available" when options is empty', async () => {
      const el = await fixture<TxSelect>(html`<tx-select></tx-select>`);
      const noOptions = el.shadowRoot?.querySelector('.no-options');

      expect(noOptions?.textContent).toBe('No options available');
    });
  });

  describe('selection', () => {
    it('selects option on click', async () => {
      const changeHandler = vi.fn();
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} @change=${changeHandler}></tx-select>`
      );

      // Open dropdown
      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      // Click option
      const options = el.shadowRoot?.querySelectorAll('.dropdown-option');
      (options?.[1] as HTMLElement)?.click();
      await el.updateComplete;

      expect(el.value).toBe('opt2');
      expect(changeHandler).toHaveBeenCalled();
    });

    it('closes dropdown after selection', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      // Open dropdown
      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      // Click option
      const options = el.shadowRoot?.querySelectorAll('.dropdown-option');
      (options?.[0] as HTMLElement)?.click();
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown');
      expect(dropdown?.classList.contains('open')).toBe(false);
    });

    it('does not select disabled option', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      // Open dropdown
      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      // Click disabled option
      const options = el.shadowRoot?.querySelectorAll('.dropdown-option');
      (options?.[3] as HTMLElement)?.click(); // Disabled option
      await el.updateComplete;

      expect(el.value).toBe('');
    });

    it('marks selected option with .selected class', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} value="opt1"></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      const selectedOption = el.shadowRoot?.querySelector('.dropdown-option.selected');
      expect(selectedOption?.textContent?.trim()).toBe('Option 1');
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown on Enter key', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown');
      expect(dropdown?.classList.contains('open')).toBe(true);
    });

    it('opens dropdown on Space key', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown');
      expect(dropdown?.classList.contains('open')).toBe(true);
    });

    it('closes dropdown on Escape key', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      // Open dropdown
      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      // Press Escape
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown');
      expect(dropdown?.classList.contains('open')).toBe(false);
    });

    it('navigates options with ArrowDown', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown');
      expect(dropdown?.classList.contains('open')).toBe(true);

      const highlighted = el.shadowRoot?.querySelector('.dropdown-option.highlighted');
      expect(highlighted).toBeDefined();
    });

    it('selects highlighted option on Enter', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;

      // Open and navigate
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      await el.updateComplete;

      // Select with Enter
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await el.updateComplete;

      expect(el.value).toBe('opt1');
    });
  });

  describe('error state', () => {
    it('applies error class when error is true', async () => {
      const el = await fixture<TxSelect>(html`<tx-select error></tx-select>`);
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger?.classList.contains('error')).toBe(true);
    });

    it('shows error message when provided', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select error errorMessage="Please select an option"></tx-select>`
      );
      const errorText = el.shadowRoot?.querySelector('.error-text');

      expect(errorText).toBeDefined();
      expect(errorText?.textContent).toBe('Please select an option');
    });

    it('sets aria-invalid when error', async () => {
      const el = await fixture<TxSelect>(html`<tx-select error></tx-select>`);
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger?.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('helper text', () => {
    it('shows helper text when provided', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select helperText="Choose wisely"></tx-select>`
      );
      const helperText = el.shadowRoot?.querySelector('.helper-text');

      expect(helperText).toBeDefined();
      expect(helperText?.textContent).toBe('Choose wisely');
    });
  });

  describe('disabled state', () => {
    it('disables trigger when disabled', async () => {
      const el = await fixture<TxSelect>(html`<tx-select disabled></tx-select>`);
      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;

      expect(trigger?.disabled).toBe(true);
    });

    it('does not open dropdown when disabled', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} disabled></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      const dropdown = el.shadowRoot?.querySelector('.dropdown');
      expect(dropdown?.classList.contains('open')).toBe(false);
    });
  });

  describe('validation', () => {
    it('validates required field', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} required></tx-select>`
      );

      const isValid = el.validate();

      expect(isValid).toBe(false);
      expect(el.error).toBe(true);
      expect(el.errorMessage).toBe('Please select an option');
    });

    it('passes validation when value is selected', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} required value="opt1"></tx-select>`
      );

      const isValid = el.validate();

      expect(isValid).toBe(true);
    });

    it('emits invalid event on validation failure', async () => {
      const invalidHandler = vi.fn();
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} required @invalid=${invalidHandler}></tx-select>`
      );

      el.validate();

      expect(invalidHandler).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="combobox" on trigger', async () => {
      const el = await fixture<TxSelect>(html`<tx-select></tx-select>`);
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger?.getAttribute('role')).toBe('combobox');
    });

    it('has aria-expanded attribute', async () => {
      const el = await fixture<TxSelect>(html`<tx-select></tx-select>`);
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    });

    it('updates aria-expanded when open', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    });

    it('has aria-haspopup="listbox"', async () => {
      const el = await fixture<TxSelect>(html`<tx-select></tx-select>`);
      const trigger = el.shadowRoot?.querySelector('.select-trigger');

      expect(trigger?.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('dropdown has role="listbox"', async () => {
      const el = await fixture<TxSelect>(html`<tx-select></tx-select>`);
      const listbox = el.shadowRoot?.querySelector('[role="listbox"]');

      expect(listbox).toBeDefined();
    });

    it('options have role="option"', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const options = el.shadowRoot?.querySelectorAll('[role="option"]');
      expect(options?.length).toBe(4);
    });

    it('sets aria-selected on selected option', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} value="opt2"></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      const selectedOption = el.shadowRoot?.querySelector('.dropdown-option.selected');
      expect(selectedOption?.getAttribute('aria-selected')).toBe('true');
    });

    it('sets aria-disabled on disabled option', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
      trigger?.click();
      await el.updateComplete;

      const disabledOption = el.shadowRoot?.querySelector('.dropdown-option.disabled');
      expect(disabledOption?.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('selectedLabel property', () => {
    it('returns selected option label', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions} value="opt2"></tx-select>`
      );

      expect(el.selectedLabel).toBe('Option 2');
    });

    it('returns empty string when no selection', async () => {
      const el = await fixture<TxSelect>(
        html`<tx-select .options=${sampleOptions}></tx-select>`
      );

      expect(el.selectedLabel).toBe('');
    });
  });
});
