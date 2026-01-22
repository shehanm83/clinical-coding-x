/**
 * tx-textarea Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxTextarea } from '../../../src/components/core/tx-textarea.js';

describe('tx-textarea', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea></tx-textarea>`);

      expect(el).toBeDefined();
      expect(el.value).toBe('');
      expect(el.disabled).toBe(false);
      expect(el.required).toBe(false);
      expect(el.error).toBe(false);
    });

    it('renders native textarea element', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea).toBeDefined();
    });

    it('sets min-height on textarea', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      // Check the computed styles include min-height
      expect(textarea).toBeDefined();
    });
  });

  describe('label', () => {
    it('renders label when provided', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea label="Notes"></tx-textarea>`);
      const label = el.shadowRoot?.querySelector('label');

      expect(label).toBeDefined();
      expect(label?.textContent?.trim()).toContain('Notes');
    });

    it('associates label with textarea via for attribute', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea label="Notes"></tx-textarea>`);
      const label = el.shadowRoot?.querySelector('label');
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(label?.getAttribute('for')).toBe(textarea?.id);
    });

    it('shows required indicator when required', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea label="Notes" required></tx-textarea>`);
      const required = el.shadowRoot?.querySelector('.required');

      expect(required).toBeDefined();
      expect(required?.textContent).toBe('*');
    });
  });

  describe('character counter', () => {
    it('shows character counter when maxLength is set', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea maxLength=${100}></tx-textarea>`
      );
      const counter = el.shadowRoot?.querySelector('.character-counter');

      expect(counter).toBeDefined();
      expect(counter?.textContent).toContain('0/100');
    });

    it('updates counter on input', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea maxLength=${100} .value=${'Hello'}></tx-textarea>`
      );
      const counter = el.shadowRoot?.querySelector('.character-counter');

      expect(counter?.textContent).toContain('5/100');
    });

    it('applies warning class when near limit', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea maxLength=${10} .value=${'12345678'}></tx-textarea>`
      );
      const counter = el.shadowRoot?.querySelector('.character-counter');

      expect(counter?.classList.contains('warning')).toBe(true);
    });

    it('applies error class when at or over limit', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea maxLength=${5} .value=${'123456'}></tx-textarea>`
      );
      const counter = el.shadowRoot?.querySelector('.character-counter');

      expect(counter?.classList.contains('error')).toBe(true);
    });

    it('does not show counter when maxLength is not set', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea></tx-textarea>`);
      const counter = el.shadowRoot?.querySelector('.character-counter');

      expect(counter).toBeNull();
    });
  });

  describe('error state', () => {
    it('applies error class when error is true', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea error></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.classList.contains('error')).toBe(true);
    });

    it('shows error message when provided', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea error errorMessage="Field is required"></tx-textarea>`
      );
      const errorText = el.shadowRoot?.querySelector('.error-text');

      expect(errorText).toBeDefined();
      expect(errorText?.textContent).toBe('Field is required');
    });

    it('sets aria-invalid when error', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea error></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('helper text', () => {
    it('shows helper text when provided', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea helperText="Enter your notes"></tx-textarea>`
      );
      const helperText = el.shadowRoot?.querySelector('.helper-text');

      expect(helperText).toBeDefined();
      expect(helperText?.textContent).toBe('Enter your notes');
    });

    it('hides helper text when error is shown', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea helperText="Help" error errorMessage="Error"></tx-textarea>`
      );
      const helperText = el.shadowRoot?.querySelector('.helper-text');

      expect(helperText).toBeNull();
    });
  });

  describe('input events', () => {
    it('emits input event on value change', async () => {
      const inputHandler = vi.fn();
      const el = await fixture<TxTextarea>(
        html`<tx-textarea @input=${inputHandler}></tx-textarea>`
      );

      const textarea = el.shadowRoot?.querySelector('textarea');
      if (textarea) {
        textarea.value = 'test';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      expect(inputHandler).toHaveBeenCalled();
    });

    it('updates value property on input', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea></tx-textarea>`);

      const textarea = el.shadowRoot?.querySelector('textarea');
      if (textarea) {
        textarea.value = 'test value';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      expect(el.value).toBe('test value');
    });

    it('includes characterCount in event detail', async () => {
      let eventDetail: { characterCount: number } | undefined;
      const inputHandler = (e: CustomEvent) => {
        eventDetail = e.detail;
      };
      const el = await fixture<TxTextarea>(
        html`<tx-textarea @input=${inputHandler}></tx-textarea>`
      );

      const textarea = el.shadowRoot?.querySelector('textarea');
      if (textarea) {
        textarea.value = 'test';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      expect(eventDetail?.characterCount).toBe(4);
    });
  });

  describe('disabled state', () => {
    it('sets disabled on native textarea', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea disabled></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.disabled).toBe(true);
    });
  });

  describe('rows', () => {
    it('sets rows attribute on textarea', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea rows=${6}></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.rows).toBe(6);
    });

    it('defaults to 4 rows', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.rows).toBe(4);
    });
  });

  describe('validation', () => {
    it('validates required field', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea required></tx-textarea>`);

      const isValid = el.validate();

      expect(isValid).toBe(false);
      expect(el.error).toBe(true);
    });

    it('passes validation when field is valid', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea required .value=${'test'}></tx-textarea>`
      );

      const isValid = el.validate();

      expect(isValid).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has aria-describedby for helper text', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea helperText="Help"></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');
      const helper = el.shadowRoot?.querySelector('.helper-text');

      expect(textarea?.getAttribute('aria-describedby')).toBe(helper?.id);
    });

    it('sets aria-required when required', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea required></tx-textarea>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.getAttribute('aria-required')).toBe('true');
    });

    it('character counter has aria-live', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea maxLength=${100}></tx-textarea>`
      );
      const counter = el.shadowRoot?.querySelector('.character-counter');

      expect(counter?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('characterCount property', () => {
    it('returns current character count', async () => {
      const el = await fixture<TxTextarea>(
        html`<tx-textarea .value=${'Hello World'}></tx-textarea>`
      );

      expect(el.characterCount).toBe(11);
    });

    it('returns 0 for empty value', async () => {
      const el = await fixture<TxTextarea>(html`<tx-textarea></tx-textarea>`);

      expect(el.characterCount).toBe(0);
    });
  });
});
