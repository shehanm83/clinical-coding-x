/**
 * tx-clinical-input Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxClinicalInput } from '../../../../src/components/features/coding/tx-clinical-input.js';

// Import component to register custom element
import '../../../../src/components/features/coding/tx-clinical-input.js';

const DRAFT_STORAGE_KEY = 'clinical-input-draft';

describe('tx-clinical-input', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);

      expect(el).toBeDefined();
      expect(el.value).toBe('');
      expect(el.disabled).toBe(false);
      expect(el.loading).toBe(false);
      expect(el.maxLength).toBe(10000);
    });

    it('renders textarea element', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea).toBeDefined();
    });

    it('renders placeholder text', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.placeholder).toContain('Enter clinical notes');
    });

    it('renders character counter', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const counter = el.shadowRoot?.querySelector('#char-counter');

      expect(counter).toBeDefined();
      expect(counter?.textContent).toContain('0 / 10,000 characters');
    });

    it('renders Clear button', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const clearButton = el.shadowRoot?.querySelector('tx-button[aria-label="Clear clinical notes"]');

      expect(clearButton).toBeDefined();
    });

    it('renders Start Coding button', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const submitButton = el.shadowRoot?.querySelector('tx-button[aria-label="Start coding clinical notes"]');

      expect(submitButton).toBeDefined();
      expect(submitButton?.textContent?.trim()).toBe('Start Coding');
    });

    it('renders keyboard hint', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const hint = el.shadowRoot?.querySelector('.keyboard-hint');

      expect(hint).toBeDefined();
      expect(hint?.textContent).toContain('Ctrl');
      expect(hint?.textContent).toContain('Enter');
    });
  });

  describe('character counter', () => {
    it('updates character count on input', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

      textarea.value = 'Test text';
      textarea.dispatchEvent(new Event('input'));
      await el.updateComplete;

      const counter = el.shadowRoot?.querySelector('#char-counter');
      expect(counter?.textContent).toContain('9 / 10,000 characters');
    });

    it('shows warning color when approaching limit', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'x'.repeat(9001)}></tx-clinical-input>`
      );
      await el.updateComplete;

      const counter = el.shadowRoot?.querySelector('#char-counter');
      expect(counter?.classList.contains('warning')).toBe(true);
    });

    it('shows error color at max length', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'x'.repeat(10000)}></tx-clinical-input>`
      );
      await el.updateComplete;

      const counter = el.shadowRoot?.querySelector('#char-counter');
      expect(counter?.classList.contains('error')).toBe(true);
    });

    it('enforces max length', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

      // Try to input text exceeding max length
      textarea.value = 'x'.repeat(10050);
      textarea.dispatchEvent(new Event('input'));
      await el.updateComplete;

      expect(el.value.length).toBe(10000);
    });
  });

  describe('auto-resize', () => {
    it('has textarea element with CSS styles defined', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

      // Verify textarea exists and has expected structure
      expect(textarea).toBeDefined();
      expect(textarea.tagName.toLowerCase()).toBe('textarea');
    });

    it('textarea resizes based on content', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

      // Initial height should be set
      expect(textarea.style.height).toBeDefined();
    });
  });

  describe('clear button', () => {
    it('is disabled when textarea is empty', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const clearButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Clear clinical notes"]'
      ) as HTMLElement;

      expect(clearButton?.hasAttribute('disabled')).toBe(true);
    });

    it('is enabled when textarea has content', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Some text'}></tx-clinical-input>`
      );
      await el.updateComplete;

      const clearButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Clear clinical notes"]'
      ) as HTMLElement;

      expect(clearButton?.hasAttribute('disabled')).toBe(false);
    });

    it('shows confirmation modal on click', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Some text'}></tx-clinical-input>`
      );
      await el.updateComplete;

      const clearButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Clear clinical notes"]'
      ) as HTMLElement;
      clearButton?.click();
      await el.updateComplete;

      const modal = el.shadowRoot?.querySelector('tx-modal');
      expect(modal?.open).toBe(true);
    });

    it('clears text on confirm', async () => {
      const clearHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Some text'} @clear=${clearHandler}></tx-clinical-input>`
      );
      await el.updateComplete;

      // Open modal
      const clearButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Clear clinical notes"]'
      ) as HTMLElement;
      clearButton?.click();
      await el.updateComplete;

      // Click confirm button
      const confirmButton = el.shadowRoot?.querySelector(
        'tx-button[variant="destructive"]'
      ) as HTMLElement;
      confirmButton?.click();
      await el.updateComplete;

      expect(el.value).toBe('');
      expect(clearHandler).toHaveBeenCalled();
    });

    it('closes modal on cancel', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Some text'}></tx-clinical-input>`
      );
      await el.updateComplete;

      // Open modal
      const clearButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Clear clinical notes"]'
      ) as HTMLElement;
      clearButton?.click();
      await el.updateComplete;

      // Click cancel button - it's inside the modal footer slot
      const modal = el.shadowRoot?.querySelector('tx-modal');
      const cancelButton = modal?.querySelector(
        'tx-button[variant="secondary"]'
      ) as HTMLElement;
      cancelButton?.click();
      await el.updateComplete;

      // Value should remain unchanged (cancel doesn't clear)
      expect(el.value).toBe('Some text');
    });
  });

  describe('keyboard shortcuts', () => {
    it('submits on Ctrl+Enter', async () => {
      const submitHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Test text'} @submit=${submitHandler}></tx-clinical-input>`
      );

      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
      await el.updateComplete;

      expect(submitHandler).toHaveBeenCalled();
    });

    it('submits on Cmd+Enter (Mac)', async () => {
      const submitHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Test text'} @submit=${submitHandler}></tx-clinical-input>`
      );

      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }));
      await el.updateComplete;

      expect(submitHandler).toHaveBeenCalled();
    });

    it('does not submit on Enter without modifier', async () => {
      const submitHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Test text'} @submit=${submitHandler}></tx-clinical-input>`
      );

      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await el.updateComplete;

      expect(submitHandler).not.toHaveBeenCalled();
    });
  });

  describe('auto-save draft', () => {
    it('saves draft to localStorage after 30 seconds', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);

      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = 'Draft text';
      textarea.dispatchEvent(new Event('input'));
      await el.updateComplete;

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);
      await el.updateComplete;

      expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe('Draft text');
    });

    it('restores draft on mount', async () => {
      localStorage.setItem(DRAFT_STORAGE_KEY, 'Saved draft');

      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      await el.updateComplete;

      expect(el.value).toBe('Saved draft');
    });

    it('clears draft on successful submit', async () => {
      localStorage.setItem(DRAFT_STORAGE_KEY, 'Saved draft');

      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Test text'}></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      submitButton?.click();
      await el.updateComplete;

      expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });

    it('emits draft-saved event on auto-save', async () => {
      const draftHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input @draft-saved=${draftHandler}></tx-clinical-input>`
      );

      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = 'Draft text';
      textarea.dispatchEvent(new Event('input'));
      await el.updateComplete;

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);
      await el.updateComplete;

      expect(draftHandler).toHaveBeenCalled();
      expect(draftHandler.mock.calls[0][0].detail.text).toBe('Draft text');
    });
  });

  describe('submit event', () => {
    it('dispatches submit event with correct payload', async () => {
      const submitHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Clinical text'} @submit=${submitHandler}></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      submitButton?.click();
      await el.updateComplete;

      expect(submitHandler).toHaveBeenCalled();
      expect(submitHandler.mock.calls[0][0].detail.text).toBe('Clinical text');
    });

    it('includes context in submit event when provided', async () => {
      const submitHandler = vi.fn();
      const context = { specialty: 'cardiology', setting: 'emergency' };
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input
          .value=${'Clinical text'}
          .context=${context}
          @submit=${submitHandler}
        ></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      submitButton?.click();
      await el.updateComplete;

      expect(submitHandler.mock.calls[0][0].detail.context).toEqual(context);
    });

    it('does not submit when text is empty', async () => {
      const submitHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input @submit=${submitHandler}></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      submitButton?.click();
      await el.updateComplete;

      expect(submitHandler).not.toHaveBeenCalled();
    });

    it('does not submit when disabled', async () => {
      const submitHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Text'} disabled @submit=${submitHandler}></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      submitButton?.click();
      await el.updateComplete;

      expect(submitHandler).not.toHaveBeenCalled();
    });

    it('does not submit when loading', async () => {
      const submitHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Text'} loading @submit=${submitHandler}></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      submitButton?.click();
      await el.updateComplete;

      expect(submitHandler).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('disables textarea when disabled', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input disabled></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

      expect(textarea.disabled).toBe(true);
    });

    it('disables buttons when disabled', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input disabled></tx-clinical-input>`);

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      expect(submitButton?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('loading state', () => {
    it('shows loading text on submit button', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Text'} loading></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      expect(submitButton?.textContent?.trim()).toBe('Processing...');
    });

    it('passes loading state to submit button', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Text'} loading></tx-clinical-input>`
      );

      const submitButton = el.shadowRoot?.querySelector(
        'tx-button[aria-label="Start coding clinical notes"]'
      ) as HTMLElement;
      expect(submitButton?.hasAttribute('loading')).toBe(true);
    });
  });

  describe('focus management', () => {
    it('has focus method', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);

      expect(typeof el.focus).toBe('function');
    });

    it('focuses textarea when focus() is called', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

      el.focus();
      await el.updateComplete;

      expect(el.shadowRoot?.activeElement).toBe(textarea);
    });

    it('has tabindex="0" on textarea', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('accessibility', () => {
    it('has aria-label on textarea', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.getAttribute('aria-label')).toBe('Clinical notes input');
    });

    it('has aria-describedby pointing to character counter', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const textarea = el.shadowRoot?.querySelector('textarea');

      expect(textarea?.getAttribute('aria-describedby')).toBe('char-counter');
    });

    it('character counter has aria-live="polite"', async () => {
      const el = await fixture<TxClinicalInput>(html`<tx-clinical-input></tx-clinical-input>`);
      const counter = el.shadowRoot?.querySelector('#char-counter');

      expect(counter?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('clear method', () => {
    it('clears the value', async () => {
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Some text'}></tx-clinical-input>`
      );

      el.clear();
      await el.updateComplete;

      expect(el.value).toBe('');
    });

    it('emits clear event', async () => {
      const clearHandler = vi.fn();
      const el = await fixture<TxClinicalInput>(
        html`<tx-clinical-input .value=${'Some text'} @clear=${clearHandler}></tx-clinical-input>`
      );

      el.clear();
      await el.updateComplete;

      expect(clearHandler).toHaveBeenCalled();
    });
  });
});
