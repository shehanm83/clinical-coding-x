/**
 * TxSessionActions Stories
 *
 * Comprehensive documentation and examples for the tx-session-actions component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/features/coding/tx-session-actions.js';
import type { SessionState } from '../components/features/coding/tx-session-actions.js';

interface TxSessionActionsProps {
  sessionState?: SessionState;
  hasExpression?: boolean;
  expressionValid?: boolean;
  hasUnsavedChanges?: boolean;
  loading?: boolean;
  expressionText?: string;
}

const meta: Meta<TxSessionActionsProps> = {
  title: 'Features/Coding/SessionActions',
  component: 'tx-session-actions',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxSessionActions

Action bar component for managing clinical coding sessions.

### Features
- **Clear Session**: Reset current work with confirmation
- **Save Draft**: Save work in progress
- **Copy Expression**: Copy ECL expression to clipboard
- **Confirm & Save**: Finalize and submit expression

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| \`Ctrl+S\` / \`Cmd+S\` | Save Draft |
| \`Ctrl+Shift+C\` / \`Cmd+Shift+C\` | Copy Expression |
| \`Ctrl+Enter\` / \`Cmd+Enter\` | Confirm & Save |

### Button States
Buttons are automatically enabled/disabled based on:
- **Clear Session**: Enabled when session has data
- **Save Draft**: Enabled when unsaved changes exist
- **Copy Expression**: Enabled when expression available
- **Confirm & Save**: Enabled when expression is valid

### Events
- \`clear\`: Session clear confirmed
- \`save-draft\`: Save draft requested
- \`copy\`: Expression copied (includes text in detail)
- \`confirm\`: Final submission requested
        `,
      },
    },
  },
  argTypes: {
    sessionState: {
      control: 'select',
      options: [
        'initial',
        'extracting',
        'matching',
        'confirming',
        'questioning',
        'building',
        'completed',
        'error',
      ],
      description: 'Current session state',
      table: {
        defaultValue: { summary: 'initial' },
        type: { summary: 'SessionState' },
      },
    },
    hasExpression: {
      control: 'boolean',
      description: 'Whether an expression exists',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    expressionValid: {
      control: 'boolean',
      description: 'Whether the expression is valid',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    hasUnsavedChanges: {
      control: 'boolean',
      description: 'Whether there are unsaved changes',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Whether an action is in progress',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    expressionText: {
      control: 'text',
      description: 'The expression text to copy',
    },
  },
  render: (args) => html`
    <tx-session-actions
      sessionState=${ifDefined(args.sessionState)}
      ?hasExpression=${args.hasExpression}
      ?expressionValid=${args.expressionValid}
      ?hasUnsavedChanges=${args.hasUnsavedChanges}
      ?loading=${args.loading}
      .expressionText=${args.expressionText || ''}
      @clear=${() => console.log('Clear event fired')}
      @save-draft=${() => console.log('Save draft event fired')}
      @copy=${(e: CustomEvent) => console.log('Copy event fired:', e.detail)}
      @confirm=${() => console.log('Confirm event fired')}
    ></tx-session-actions>
  `,
};

export default meta;
type Story = StoryObj<TxSessionActionsProps>;

// Default state (all disabled)
export const Default: Story = {
  args: {
    sessionState: 'initial',
    hasExpression: false,
    expressionValid: false,
    hasUnsavedChanges: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial state with all actions disabled. Session is empty with no expression or changes.',
      },
    },
  },
};

// All actions enabled
export const AllEnabled: Story = {
  args: {
    sessionState: 'questioning',
    hasExpression: true,
    expressionValid: true,
    hasUnsavedChanges: true,
    loading: false,
    expressionText: '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
  },
  parameters: {
    docs: {
      description: {
        story: 'All actions enabled with active session, valid expression, and unsaved changes.',
      },
    },
  },
};

// In progress state
export const InProgress: Story = {
  args: {
    sessionState: 'building',
    hasExpression: true,
    expressionValid: false,
    hasUnsavedChanges: true,
    loading: false,
    expressionText: '29857009 |Chest pain|',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Session in progress with expression being built. Copy enabled but Confirm disabled until valid.',
      },
    },
  },
};

// Partial disabled state
export const PartialDisabled: Story = {
  args: {
    sessionState: 'questioning',
    hasExpression: false,
    expressionValid: false,
    hasUnsavedChanges: true,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Some actions disabled. Clear and Save Draft enabled, Copy and Confirm disabled (no expression).',
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  args: {
    sessionState: 'questioning',
    hasExpression: true,
    expressionValid: true,
    hasUnsavedChanges: true,
    loading: true,
    expressionText: '29857009 |Chest pain|',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state disables all buttons to prevent concurrent actions.',
      },
    },
  },
};

// Completed session
export const Completed: Story = {
  args: {
    sessionState: 'completed',
    hasExpression: true,
    expressionValid: true,
    hasUnsavedChanges: false,
    loading: false,
    expressionText: '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Completed session with valid expression. Save Draft disabled (no changes), Copy and Confirm enabled.',
      },
    },
  },
};

// Error state
export const ErrorState: Story = {
  args: {
    sessionState: 'error',
    hasExpression: true,
    expressionValid: false,
    hasUnsavedChanges: true,
    loading: false,
    expressionText: '29857009 |Chest pain| : { INVALID }',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state with invalid expression. Clear, Save, and Copy enabled, Confirm disabled.',
      },
    },
  },
};

// Interactive demo showing confirmation modal
export const ClearConfirmation: Story = {
  render: () => html`
    <div>
      <p style="margin-bottom: 16px; color: var(--color-text-secondary);">
        Click "Clear Session" to see the confirmation modal.
      </p>
      <tx-session-actions
        sessionState="questioning"
        ?hasExpression=${true}
        ?expressionValid=${true}
        ?hasUnsavedChanges=${true}
        .expressionText=${'29857009 |Chest pain|'}
        @clear=${() => alert('Session cleared!')}
        @save-draft=${() => alert('Draft saved!')}
        @copy=${() => alert('Copied to clipboard!')}
        @confirm=${() => alert('Confirmed and saved!')}
      ></tx-session-actions>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing the clear confirmation modal. Click Clear Session to trigger it.',
      },
    },
  },
};

// Keyboard shortcuts demo
export const KeyboardShortcuts: Story = {
  render: () => html`
    <div>
      <div
        style="margin-bottom: 16px; padding: 16px; background: var(--color-background); border-radius: 8px;"
      >
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Keyboard Shortcuts</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: var(--color-text-secondary);">
          <li><code>Ctrl+S</code> / <code>Cmd+S</code> - Save Draft</li>
          <li><code>Ctrl+Shift+C</code> / <code>Cmd+Shift+C</code> - Copy Expression</li>
          <li><code>Ctrl+Enter</code> / <code>Cmd+Enter</code> - Confirm & Save</li>
        </ul>
      </div>
      <tx-session-actions
        sessionState="questioning"
        ?hasExpression=${true}
        ?expressionValid=${true}
        ?hasUnsavedChanges=${true}
        .expressionText=${'29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }'}
      ></tx-session-actions>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard shortcuts. Try using the shortcuts listed above.',
      },
    },
  },
};

// Session states demo
export const SessionStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Initial (Empty Session)</h4>
        <tx-session-actions sessionState="initial"></tx-session-actions>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Extracting</h4>
        <tx-session-actions
          sessionState="extracting"
          ?hasUnsavedChanges=${true}
        ></tx-session-actions>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Questioning (Active)</h4>
        <tx-session-actions
          sessionState="questioning"
          ?hasExpression=${true}
          ?hasUnsavedChanges=${true}
          .expressionText=${'29857009 |Chest pain|'}
        ></tx-session-actions>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Building (Valid Expression)</h4>
        <tx-session-actions
          sessionState="building"
          ?hasExpression=${true}
          ?expressionValid=${true}
          ?hasUnsavedChanges=${true}
          .expressionText=${'29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }'}
        ></tx-session-actions>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Completed</h4>
        <tx-session-actions
          sessionState="completed"
          ?hasExpression=${true}
          ?expressionValid=${true}
          .expressionText=${'29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }'}
        ></tx-session-actions>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Shows the action bar in different session states with appropriate button states.',
      },
    },
  },
};
