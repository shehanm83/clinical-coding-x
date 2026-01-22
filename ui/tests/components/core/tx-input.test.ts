/**
 * tx-input Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxInput } from '../../../src/components/core/tx-input.js';

describe('tx-input', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxInput>(html`<tx-input></tx-input>`);

      expect(el).toBeDefined();
      expect(el.value).toBe('');
      expect(el.type).toBe('text');
      expect(el.disabled).toBe(false);
      expect(el.required).toBe(false);
      expect(el.error).toBe(false);
    });

    it('renders native input element', async () => {
      const el = await fixture<TxInput>(html`<tx-input></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input).toBeDefined();
    });
  });

  describe('label', () => {
    it('renders label when provided', async () => {
      const el = await fixture<TxInput>(html`<tx-input label="Email"></tx-input>`);
      const label = el.shadowRoot?.querySelector('label');

      expect(label).toBeDefined();
      expect(label?.textContent?.trim()).toContain('Email');
    });

    it('associates label with input via for attribute', async () => {
      const el = await fixture<TxInput>(html`<tx-input label="Email"></tx-input>`);
      const label = el.shadowRoot?.querySelector('label');
      const input = el.shadowRoot?.querySelector('input');

      expect(label?.getAttribute('for')).toBe(input?.id);
    });

    it('shows required indicator when required', async () => {
      const el = await fixture<TxInput>(html`<tx-input label="Email" required></tx-input>`);
      const required = el.shadowRoot?.querySelector('.required');

      expect(required).toBeDefined();
      expect(required?.textContent).toBe('*');
    });
  });

  describe('error state', () => {
    it('applies error class when error is true', async () => {
      const el = await fixture<TxInput>(html`<tx-input error></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input?.classList.contains('error')).toBe(true);
    });

    it('shows error message when provided', async () => {
      const el = await fixture<TxInput>(
        html`<tx-input error errorMessage="Invalid email"></tx-input>`
      );
      const errorText = el.shadowRoot?.querySelector('.error-text');

      expect(errorText).toBeDefined();
      expect(errorText?.textContent).toBe('Invalid email');
    });

    it('sets aria-invalid when error', async () => {
      const el = await fixture<TxInput>(html`<tx-input error></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('error message has role="alert"', async () => {
      const el = await fixture<TxInput>(
        html`<tx-input error errorMessage="Error"></tx-input>`
      );
      const errorText = el.shadowRoot?.querySelector('.error-text');

      expect(errorText?.getAttribute('role')).toBe('alert');
    });
  });

  describe('helper text', () => {
    it('shows helper text when provided', async () => {
      const el = await fixture<TxInput>(html`<tx-input helperText="Enter your email"></tx-input>`);
      const helperText = el.shadowRoot?.querySelector('.helper-text');

      expect(helperText).toBeDefined();
      expect(helperText?.textContent).toBe('Enter your email');
    });

    it('hides helper text when error is shown', async () => {
      const el = await fixture<TxInput>(
        html`<tx-input helperText="Help" error errorMessage="Error"></tx-input>`
      );
      const helperText = el.shadowRoot?.querySelector('.helper-text');

      expect(helperText).toBeNull();
    });
  });

  describe('input events', () => {
    it('emits input event on value change', async () => {
      const inputHandler = vi.fn();
      const el = await fixture<TxInput>(
        html`<tx-input @input=${inputHandler}></tx-input>`
      );

      const input = el.shadowRoot?.querySelector('input');
      if (input) {
        input.value = 'test';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      expect(inputHandler).toHaveBeenCalled();
    });

    it('emits change event on blur', async () => {
      const changeHandler = vi.fn();
      const el = await fixture<TxInput>(
        html`<tx-input @change=${changeHandler}></tx-input>`
      );

      const input = el.shadowRoot?.querySelector('input');
      if (input) {
        input.value = 'test';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      expect(changeHandler).toHaveBeenCalled();
    });

    it('updates value property on input', async () => {
      const el = await fixture<TxInput>(html`<tx-input></tx-input>`);

      const input = el.shadowRoot?.querySelector('input');
      if (input) {
        input.value = 'test value';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      expect(el.value).toBe('test value');
    });
  });

  describe('disabled state', () => {
    it('sets disabled on native input', async () => {
      const el = await fixture<TxInput>(html`<tx-input disabled></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input?.disabled).toBe(true);
    });
  });

  describe('input types', () => {
    it('supports text type (default)', async () => {
      const el = await fixture<TxInput>(html`<tx-input></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input?.type).toBe('text');
    });

    it('supports email type', async () => {
      const el = await fixture<TxInput>(html`<tx-input type="email"></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input?.type).toBe('email');
    });

    it('supports password type', async () => {
      const el = await fixture<TxInput>(html`<tx-input type="password"></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input?.type).toBe('password');
    });
  });

  describe('validation', () => {
    it('validates required field', async () => {
      const el = await fixture<TxInput>(html`<tx-input required></tx-input>`);

      const isValid = el.validate();

      expect(isValid).toBe(false);
      expect(el.error).toBe(true);
    });

    it('emits invalid event on validation failure', async () => {
      const invalidHandler = vi.fn();
      const el = await fixture<TxInput>(
        html`<tx-input required @invalid=${invalidHandler}></tx-input>`
      );

      el.validate();

      expect(invalidHandler).toHaveBeenCalled();
    });

    it('passes validation when field is valid', async () => {
      const el = await fixture<TxInput>(html`<tx-input required .value=${'test'}></tx-input>`);

      const isValid = el.validate();

      expect(isValid).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has aria-describedby for helper text', async () => {
      const el = await fixture<TxInput>(html`<tx-input helperText="Help text"></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');
      const helper = el.shadowRoot?.querySelector('.helper-text');

      expect(input?.getAttribute('aria-describedby')).toBe(helper?.id);
    });

    it('sets aria-required when required', async () => {
      const el = await fixture<TxInput>(html`<tx-input required></tx-input>`);
      const input = el.shadowRoot?.querySelector('input');

      expect(input?.getAttribute('aria-required')).toBe('true');
    });
  });

  describe('focus', () => {
    it('can be focused programmatically', async () => {
      const el = await fixture<TxInput>(html`<tx-input></tx-input>`);

      el.focus();

      const input = el.shadowRoot?.querySelector('input');
      expect(el.shadowRoot?.activeElement).toBe(input);
    });
  });
});
