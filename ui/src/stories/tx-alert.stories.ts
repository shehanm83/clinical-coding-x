/**
 * TxAlert Stories
 *
 * Documentation and examples for the tx-alert inline alert component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/core/tx-alert.js';
import type { AlertVariant } from '../components/core/tx-alert.js';

interface TxAlertProps {
  variant?: AlertVariant;
  dismissible?: boolean;
  title?: string;
  message: string;
}

const meta: Meta<TxAlertProps> = {
  title: 'Core/Alert',
  component: 'tx-alert',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxAlert

An inline alert component for displaying contextual feedback messages.

### Features
- **Four variants**: Info, Success, Warning, Error
- **Optional title**: Emphasize the alert purpose
- **Dismissible**: Optional close button
- **Animated dismiss**: Smooth fade-out animation

### Accessibility
- Uses \`role="alert"\` for screen reader announcement
- Close button has descriptive \`aria-label\`
- Color not sole indicator - icons provide additional context

### Events
- \`close\`: Fired when alert is dismissed

### Slots
- \`title\`: Optional title for the alert
- Default: Alert message content
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      description: 'Alert severity variant',
      table: { defaultValue: { summary: 'info' } },
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the alert can be dismissed',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  render: (args) => html`
    <tx-alert variant=${ifDefined(args.variant)} ?dismissible=${args.dismissible}>
      ${args.title ? html`<span slot="title">${args.title}</span>` : ''}
      ${args.message}
    </tx-alert>
  `,
};

export default meta;
type Story = StoryObj<TxAlertProps>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    message: 'This expression uses ECL (Expression Constraint Language) syntax.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    message: 'Your clinical coding session has been saved successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    message:
      'Some SNOMED concepts in this expression may not be valid in the current MRCM context.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    message: 'Failed to validate the expression. Please check the syntax and try again.',
  },
};

export const WithoutTitle: Story = {
  args: {
    variant: 'info',
    message: 'This is an alert without a title, useful for simple notifications.',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'success',
    title: 'Dismissible Alert',
    message: 'Click the X button to dismiss this alert.',
    dismissible: true,
  },
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 600px;">
      <tx-alert variant="info">
        <span slot="title">Information</span>
        This is an informational message for general guidance.
      </tx-alert>

      <tx-alert variant="success">
        <span slot="title">Success</span>
        Operation completed successfully. Your changes have been saved.
      </tx-alert>

      <tx-alert variant="warning">
        <span slot="title">Warning</span>
        Please review your input before proceeding. Some fields may need attention.
      </tx-alert>

      <tx-alert variant="error">
        <span slot="title">Error</span>
        Something went wrong. Please try again or contact support.
      </tx-alert>
    </div>
  `,
};

export const UseCases: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 600px;">
      <div>
        <h4 style="margin: 0 0 8px 0;">Form Validation Error</h4>
        <tx-alert variant="error">
          <span slot="title">Validation Error</span>
          The SNOMED CT expression is invalid. Missing closing bracket on line 3.
        </tx-alert>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0;">Session Saved</h4>
        <tx-alert variant="success" dismissible>
          <span slot="title">Session Saved</span>
          Your coding session has been saved. You can continue from where you left off.
        </tx-alert>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0;">API Rate Limit Warning</h4>
        <tx-alert variant="warning">
          <span slot="title">Rate Limit Warning</span>
          You are approaching the API rate limit. Consider batching your requests.
        </tx-alert>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0;">Feature Tip</h4>
        <tx-alert variant="info">
          <span slot="title">Pro Tip</span>
          Press Ctrl+Space to trigger autocomplete suggestions while editing ECL expressions.
        </tx-alert>
      </div>
    </div>
  `,
};
