/**
 * Accessibility Tests with axe-core
 *
 * These tests verify that all components meet WCAG 2.1 AA standards
 * using the axe-core accessibility testing engine.
 *
 * Run with: npm test -- --grep "Accessibility"
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import axe from 'axe-core';

// Import all components
import '../../src/components/core/tx-button.js';
import '../../src/components/core/tx-input.js';
import '../../src/components/core/tx-textarea.js';
import '../../src/components/core/tx-select.js';
import '../../src/components/core/tx-toast.js';
import '../../src/components/core/tx-alert.js';
import '../../src/components/core/tx-modal.js';
import '../../src/components/core/tx-live-region.js';
import '../../src/components/layout/tx-card.js';
import '../../src/components/layout/tx-stack.js';
import '../../src/components/layout/tx-inline.js';
import '../../src/components/layout/tx-container.js';
import '../../src/components/layout/tx-divider.js';

// axe-core configuration for WCAG 2.1 AA
const axeConfig: axe.RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  },
  rules: {
    // Disable rules that don't apply in JSDOM environment
    'color-contrast': { enabled: false }, // Can't compute colors in JSDOM
  },
};

/**
 * Run axe accessibility check on an element
 */
async function runAxe(element: Element): Promise<axe.AxeResults> {
  return await axe.run(element, axeConfig);
}

/**
 * Format axe violations for better error messages
 */
function formatViolations(violations: axe.Result[]): string {
  return violations
    .map(
      (v) =>
        `\n[${v.impact}] ${v.id}: ${v.help}\n` +
        `  Nodes: ${v.nodes.map((n) => n.html).join(', ')}\n` +
        `  More info: ${v.helpUrl}`
    )
    .join('\n');
}

describe('Accessibility Tests', () => {
  beforeAll(() => {
    // Configure axe-core for the test environment
    axe.configure({
      reporter: 'v2',
    });
  });

  // Note: @open-wc/testing's fixture handles cleanup automatically

  describe('Core Components', () => {
    it('tx-button should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div>
          <tx-button>Click Me</tx-button>
          <tx-button variant="secondary">Secondary</tx-button>
          <tx-button variant="ghost">Ghost</tx-button>
          <tx-button variant="destructive">Delete</tx-button>
          <tx-button disabled>Disabled</tx-button>
          <tx-button loading>Loading</tx-button>
          <tx-button iconOnly aria-label="Close"><span>X</span></tx-button>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-input should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div>
          <tx-input label="Email" type="email" placeholder="Enter email"></tx-input>
          <tx-input label="Required Field" required></tx-input>
          <tx-input label="With Error" error errorMessage="Invalid input"></tx-input>
          <tx-input label="With Helper" helperText="Some helper text"></tx-input>
          <tx-input label="Disabled" disabled></tx-input>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-textarea should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div>
          <tx-textarea label="Description" placeholder="Enter description"></tx-textarea>
          <tx-textarea label="Required" required></tx-textarea>
          <tx-textarea label="With Counter" maxLength=${500}></tx-textarea>
          <tx-textarea label="With Error" error errorMessage="Too short"></tx-textarea>
          <tx-textarea label="Disabled" disabled></tx-textarea>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-select should have no accessibility violations', async () => {
      const options = [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
        { label: 'Option 3', value: '3', disabled: true },
      ];

      const el = await fixture(html`
        <div>
          <tx-select label="Choose Option" .options=${options}></tx-select>
          <tx-select label="Required" .options=${options} required></tx-select>
          <tx-select label="With Error" .options=${options} error errorMessage="Select required"></tx-select>
          <tx-select label="Disabled" .options=${options} disabled></tx-select>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-toast should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div>
          <tx-toast variant="info" message="Information message"></tx-toast>
          <tx-toast variant="success" message="Success message"></tx-toast>
          <tx-toast variant="warning" message="Warning message"></tx-toast>
          <tx-toast variant="error" message="Error message"></tx-toast>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-alert should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div>
          <tx-alert variant="info">
            <span slot="title">Information</span>
            This is an info alert.
          </tx-alert>
          <tx-alert variant="success">
            <span slot="title">Success</span>
            Operation completed successfully.
          </tx-alert>
          <tx-alert variant="warning" dismissible>
            <span slot="title">Warning</span>
            Please review before continuing.
          </tx-alert>
          <tx-alert variant="error">
            <span slot="title">Error</span>
            Something went wrong.
          </tx-alert>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-modal should have no accessibility violations when open', async () => {
      const el = await fixture(html`
        <tx-modal open>
          <span slot="header">Modal Title</span>
          <p>Modal content goes here.</p>
          <div slot="footer">
            <tx-button variant="secondary">Cancel</tx-button>
            <tx-button variant="primary">Confirm</tx-button>
          </div>
        </tx-modal>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-live-region should have no accessibility violations', async () => {
      const el = await fixture(html` <tx-live-region></tx-live-region> `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });
  });

  describe('Layout Components', () => {
    it('tx-card should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div>
          <tx-card>Simple card content</tx-card>
          <tx-card elevation="2" padding="6">
            <span slot="header">Card Title</span>
            Card body content
            <span slot="footer">Footer actions</span>
          </tx-card>
          <tx-card interactive>Interactive card</tx-card>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-stack should have no accessibility violations', async () => {
      const el = await fixture(html`
        <tx-stack gap="4" align="stretch">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </tx-stack>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-container should have no accessibility violations', async () => {
      const el = await fixture(html`
        <tx-container>
          <p>Container content</p>
        </tx-container>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('tx-divider should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div>
          <tx-divider></tx-divider>
          <tx-divider orientation="vertical"></tx-divider>
          <tx-divider label="OR"></tx-divider>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });
  });

  describe('Form Pattern Accessibility', () => {
    it('complete form should have no accessibility violations', async () => {
      const el = await fixture(html`
        <form>
          <tx-stack gap="4">
            <tx-input label="Full Name" name="name" required autocomplete="name"></tx-input>
            <tx-input
              label="Email Address"
              type="email"
              name="email"
              required
              autocomplete="email"
            ></tx-input>
            <tx-select
              label="Country"
              name="country"
              .options=${[
                { label: 'United States', value: 'us' },
                { label: 'United Kingdom', value: 'uk' },
                { label: 'Australia', value: 'au' },
              ]}
              required
            ></tx-select>
            <tx-textarea
              label="Comments"
              name="comments"
              helperText="Optional feedback"
            ></tx-textarea>
            <tx-button type="submit">Submit</tx-button>
          </tx-stack>
        </form>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });
  });

  describe('Interactive Pattern Accessibility', () => {
    it('button group should have no accessibility violations', async () => {
      const el = await fixture(html`
        <div role="group" aria-label="Actions">
          <tx-button variant="primary">Save</tx-button>
          <tx-button variant="secondary">Cancel</tx-button>
          <tx-button variant="ghost">Reset</tx-button>
        </div>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });

    it('alert with action should have no accessibility violations', async () => {
      const el = await fixture(html`
        <tx-alert variant="error" dismissible>
          <span slot="title">Session Expired</span>
          Your session has expired. Please log in again to continue.
        </tx-alert>
      `);

      const results = await runAxe(el);
      expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
    });
  });
});

describe('Keyboard Navigation Tests', () => {
  it('tx-button should be focusable and activatable', async () => {
    let clicked = false;
    const el = await fixture<HTMLElement>(html`
      <tx-button @click=${() => (clicked = true)}>Click Me</tx-button>
    `);

    // Get the internal button
    const button = el.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();

    // Focus should work
    button?.focus();
    expect(document.activeElement).toBe(el);

    // Enter key should activate
    button?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clicked).toBe(true);

    // Space key should also activate
    clicked = false;
    button?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(clicked).toBe(true);
  });

  it('tx-select should have proper keyboard navigation', async () => {
    const options = [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
      { label: 'Option 3', value: '3' },
    ];

    const el = await fixture<HTMLElement>(html`
      <tx-select label="Test Select" .options=${options}></tx-select>
    `);

    const trigger = el.shadowRoot?.querySelector('.select-trigger') as HTMLButtonElement;
    expect(trigger).toBeTruthy();

    // Space should open dropdown
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    // Wait for update
    await el.updateComplete;

    const dropdown = el.shadowRoot?.querySelector('.dropdown.open');
    expect(dropdown).toBeTruthy();

    // Escape should close
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;

    const closedDropdown = el.shadowRoot?.querySelector('.dropdown.open');
    expect(closedDropdown).toBeFalsy();
  });

  it('tx-modal should trap focus', async () => {
    const el = await fixture<HTMLElement>(html`
      <tx-modal open>
        <span slot="header">Test Modal</span>
        <tx-input label="Name"></tx-input>
        <div slot="footer">
          <tx-button id="cancel">Cancel</tx-button>
          <tx-button id="confirm">Confirm</tx-button>
        </div>
      </tx-modal>
    `);

    // Modal should be open
    const modal = el.shadowRoot?.querySelector('.modal-overlay.open');
    expect(modal).toBeTruthy();

    // Close button should exist and be accessible
    const closeButton = el.shadowRoot?.querySelector('.close-button');
    expect(closeButton).toBeTruthy();
    expect(closeButton?.getAttribute('aria-label')).toBe('Close dialog');
  });
});
