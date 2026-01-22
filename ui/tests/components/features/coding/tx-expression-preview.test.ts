/**
 * tx-expression-preview Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import type {
  TxExpressionPreview,
  ECLExpression,
} from '../../../../src/components/features/coding/tx-expression-preview.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-expression-preview.js';

// Test fixtures
const createExpression = (
  overrides: Partial<ECLExpression> = {}
): ECLExpression => ({
  ecl: '29857009|Chest pain|:{363698007|Finding site|=51185008|Thoracic structure|}',
  description: 'Chest pain with finding site in thoracic structure',
  fsn: 'Chest pain (finding)',
  expressionType: 'postcoordinated',
  validation: {
    valid: true,
    mrcmCompliant: true,
    errors: [],
    warnings: [],
  },
  formatted: {
    brief: '29857009:{363698007=51185008}',
    long: '29857009|Chest pain|:{363698007|Finding site|=51185008|Thoracic structure|}',
    nested: `29857009 |Chest pain| : {
  363698007 |Finding site| = 51185008 |Thoracic structure|
}`,
  },
  ...overrides,
});

const createExpressionWithErrors = (): ECLExpression => ({
  ...createExpression(),
  validation: {
    valid: false,
    mrcmCompliant: false,
    errors: [
      { code: 'SYNTAX_ERROR', message: 'Invalid ECL syntax at position 10' },
    ],
    warnings: [],
  },
});

const createExpressionWithWarnings = (): ECLExpression => ({
  ...createExpression(),
  validation: {
    valid: true,
    mrcmCompliant: true,
    errors: [],
    warnings: [
      {
        code: 'SUGGESTION',
        message: 'Consider adding "Clinical course" attribute for onset type',
      },
    ],
  },
});

describe('tx-expression-preview', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      expect(el).toBeDefined();
      expect(el.expression).toBeNull();
      expect(el.format).toBe('long');
      expect(el.editable).toBe(true);
    });

    it('renders empty state when no expression', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      const emptyCode = el.shadowRoot?.querySelector('.empty-code');
      expect(emptyCode?.textContent).toContain('No expression generated');
    });

    it('renders expression code', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const codeBlock = el.shadowRoot?.querySelector('.expression-code');
      expect(codeBlock?.textContent).toContain('Chest pain');
    });

    it('renders header title', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      const title = el.shadowRoot?.querySelector('.header-title');
      expect(title?.textContent).toBe('ECL Expression');
    });

    it('renders expression type badge', async () => {
      const expression = createExpression({ expressionType: 'postcoordinated' });
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const badge = el.shadowRoot?.querySelector('.type-badge');
      expect(badge?.textContent?.trim()).toBe('Postcoordinated');
      expect(badge?.classList.contains('postcoordinated')).toBe(true);
    });
  });

  describe('format toggle', () => {
    it('renders format toggle buttons', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.format-btn');
      expect(buttons?.length).toBe(3);
    });

    it('defaults to long format', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      const activeBtn = el.shadowRoot?.querySelector('.format-btn.active');
      expect(activeBtn?.textContent?.trim()).toBe('Long');
    });

    it('switches to brief format', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const briefBtn = el.shadowRoot?.querySelector(
        '.format-btn:first-child'
      ) as HTMLElement;
      briefBtn?.click();
      await el.updateComplete;

      const code = el.shadowRoot?.querySelector('.expression-code');
      expect(code?.textContent).toContain('29857009:{363698007=51185008}');
    });

    it('switches to nested format', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const nestedBtn = el.shadowRoot?.querySelector(
        '.format-btn:last-child'
      ) as HTMLElement;
      nestedBtn?.click();
      await el.updateComplete;

      const code = el.shadowRoot?.querySelector('.expression-code');
      // Nested format should have newlines
      expect(code?.textContent).toContain('\n');
    });

    it('marks active format button', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview format="brief"></tx-expression-preview>`
      );

      const briefBtn = el.shadowRoot?.querySelector('.format-btn:first-child');
      expect(briefBtn?.classList.contains('active')).toBe(true);
    });
  });

  describe('syntax highlighting', () => {
    it('applies syntax highlighting to SCTIDs', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const code = el.shadowRoot?.querySelector('.expression-code');
      expect(code?.innerHTML).toContain('class="sctid"');
    });

    it('applies syntax highlighting to terms', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const code = el.shadowRoot?.querySelector('.expression-code');
      expect(code?.innerHTML).toContain('class="term"');
    });

    it('applies syntax highlighting to operators', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const code = el.shadowRoot?.querySelector('.expression-code');
      expect(code?.innerHTML).toContain('class="operator"');
    });
  });

  describe('human-readable description', () => {
    it('renders description section', async () => {
      const expression = createExpression({
        description: 'Test description text',
      });
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const description = el.shadowRoot?.querySelector('.description-text');
      expect(description?.textContent).toBe('Test description text');
    });

    it('renders description label', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const label = el.shadowRoot?.querySelector('.description-label');
      expect(label?.textContent).toContain('Human-readable');
    });
  });

  describe('validation indicators', () => {
    it('shows valid syntax badge when valid', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const badges = el.shadowRoot?.querySelectorAll('.validation-badge.valid');
      expect(badges?.length).toBeGreaterThan(0);
    });

    it('shows invalid badge when syntax invalid', async () => {
      const expression = createExpressionWithErrors();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const invalidBadge = el.shadowRoot?.querySelector(
        '.validation-badge.invalid'
      );
      expect(invalidBadge).toBeDefined();
      expect(invalidBadge?.textContent).toContain('Valid Syntax');
    });

    it('shows MRCM compliant badge', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const section = el.shadowRoot?.querySelector('.validation-section');
      expect(section?.textContent).toContain('MRCM Compliant');
    });

    it('shows warning badge when warnings exist', async () => {
      const expression = createExpressionWithWarnings();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const warningBadge = el.shadowRoot?.querySelector(
        '.validation-badge.warning'
      );
      expect(warningBadge).toBeDefined();
      expect(warningBadge?.textContent).toContain('Suggestion');
    });
  });

  describe('validation details', () => {
    it('shows error messages', async () => {
      const expression = createExpressionWithErrors();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const errorMessage = el.shadowRoot?.querySelector(
        '.validation-message.error'
      );
      expect(errorMessage).toBeDefined();
      expect(errorMessage?.textContent).toContain('Invalid ECL syntax');
    });

    it('shows warning messages', async () => {
      const expression = createExpressionWithWarnings();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const warningMessage = el.shadowRoot?.querySelector(
        '.validation-message.warning'
      );
      expect(warningMessage).toBeDefined();
      expect(warningMessage?.textContent).toContain('Clinical course');
    });

    it('hides validation details when no messages', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const details = el.shadowRoot?.querySelector('.validation-details');
      expect(details).toBeNull();
    });
  });

  describe('copy to clipboard', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('renders copy button', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const copyBtn = el.shadowRoot?.querySelector('.action-btn');
      expect(copyBtn?.textContent).toContain('Copy');
    });

    it('disables copy button when no expression', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      const copyBtn = el.shadowRoot?.querySelector('.action-btn');
      expect(copyBtn?.hasAttribute('disabled')).toBe(true);
    });

    it('dispatches copy event', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const listener = oneEvent(el, 'copy');

      const copyBtn = el.shadowRoot?.querySelector('.action-btn') as HTMLElement;
      copyBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({
        format: 'long',
        text: expression.formatted.long,
      });
    });

    it('shows copied state after copy', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const copyBtn = el.shadowRoot?.querySelector('.action-btn') as HTMLElement;
      copyBtn?.click();

      // Wait for async clipboard operation and state update
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      // Re-query the button after state update
      const updatedCopyBtn = el.shadowRoot?.querySelector('.action-btn');
      expect(updatedCopyBtn?.classList.contains('copied')).toBe(true);
      expect(updatedCopyBtn?.textContent).toContain('Copied');
    });
  });

  describe('edit mode', () => {
    it('renders edit button when editable', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
          ?editable=${true}
        ></tx-expression-preview>`
      );

      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit'));
      expect(editBtn).toBeDefined();
    });

    it('hides edit button when not editable', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
          .editable=${false}
        ></tx-expression-preview>`
      );

      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit'));
      expect(editBtn).toBeUndefined();
    });

    it('enters edit mode on click', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit')) as HTMLElement;
      editBtn?.click();
      await el.updateComplete;

      const editSection = el.shadowRoot?.querySelector('.edit-section');
      expect(editSection).toBeDefined();
    });

    it('shows textarea in edit mode', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      // Enter edit mode
      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit')) as HTMLElement;
      editBtn?.click();
      await el.updateComplete;

      const textarea = el.shadowRoot?.querySelector('.edit-textarea');
      expect(textarea).toBeDefined();
    });

    it('shows cancel and save buttons in edit mode', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      // Enter edit mode
      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit')) as HTMLElement;
      editBtn?.click();
      await el.updateComplete;

      const cancelBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="secondary"]'
      );
      const saveBtn = el.shadowRoot?.querySelector('tx-button[variant="primary"]');

      expect(cancelBtn?.textContent?.trim()).toBe('Cancel');
      expect(saveBtn?.textContent?.trim()).toBe('Save');
    });

    it('exits edit mode on cancel', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      // Enter edit mode
      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit')) as HTMLElement;
      editBtn?.click();
      await el.updateComplete;

      // Click cancel
      const cancelBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="secondary"]'
      ) as HTMLElement;
      cancelBtn?.click();
      await el.updateComplete;

      const editSection = el.shadowRoot?.querySelector('.edit-section');
      expect(editSection).toBeNull();
    });

    it('dispatches edit event on save', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      // Enter edit mode
      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit')) as HTMLElement;
      editBtn?.click();
      await el.updateComplete;

      // Modify textarea
      const textarea = el.shadowRoot?.querySelector(
        '.edit-textarea'
      ) as HTMLTextAreaElement;
      textarea.value = 'modified expression';
      textarea.dispatchEvent(new Event('input'));
      await el.updateComplete;

      // Save
      const listener = oneEvent(el, 'edit');
      const saveBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="primary"]'
      ) as HTMLElement;
      saveBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ ecl: 'modified expression' });
    });
  });

  describe('accessibility', () => {
    it('format toggle has radiogroup role', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      const toggle = el.shadowRoot?.querySelector('.format-toggle');
      expect(toggle?.getAttribute('role')).toBe('radiogroup');
    });

    it('format buttons have radio role', async () => {
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview></tx-expression-preview>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.format-btn');
      buttons?.forEach((btn) => {
        expect(btn.getAttribute('role')).toBe('radio');
      });
    });

    it('code block has code role', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      const codeBlock = el.shadowRoot?.querySelector('.code-block');
      expect(codeBlock?.getAttribute('role')).toBe('code');
    });

    it('edit textarea has aria-label', async () => {
      const expression = createExpression();
      const el = await fixture<TxExpressionPreview>(
        html`<tx-expression-preview
          .expression=${expression}
        ></tx-expression-preview>`
      );

      // Enter edit mode
      const editBtn = Array.from(
        el.shadowRoot?.querySelectorAll('.action-btn') || []
      ).find((btn) => btn.textContent?.includes('Edit')) as HTMLElement;
      editBtn?.click();
      await el.updateComplete;

      const textarea = el.shadowRoot?.querySelector('.edit-textarea');
      expect(textarea?.getAttribute('aria-label')).toBe('Edit ECL expression');
    });
  });
});
