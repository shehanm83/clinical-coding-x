/**
 * TxToast Stories
 *
 * Documentation and examples for the tx-toast notification component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/core/tx-toast.js';
import '../components/core/tx-toast-container.js';
import '../components/core/tx-button.js';
import { toast } from '../components/core/tx-toast-container.js';
import type { ToastVariant, ToastPosition } from '../components/core/tx-toast.js';

interface TxToastProps {
  variant?: ToastVariant;
  message: string;
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
}

const meta: Meta<TxToastProps> = {
  title: 'Core/Toast',
  component: 'tx-toast',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxToast

A toast notification component for temporary feedback messages.

### Features
- **Four variants**: Info, Success, Warning, Error
- **Auto-dismiss**: Configurable duration (default 3s)
- **Position options**: Top-right, Top-left, Bottom-right, Bottom-left
- **Manual dismiss**: Optional close button
- **Animated**: Smooth slide-in/out animations
- **Reduced motion**: Respects prefers-reduced-motion

### Accessibility
- Uses \`role="alert"\` and \`aria-live="polite"\`
- Dismiss button has descriptive \`aria-label\`
- Escape key can dismiss toast
- Not focus-stealing - doesn't interrupt workflow

### Events
- \`close\`: Fired when toast is dismissed

### Toast Container
Use \`<tx-toast-container>\` to manage multiple toasts. The \`toast()\` function
provides a convenient API for showing toasts programmatically.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      description: 'Toast severity variant',
      table: { defaultValue: { summary: 'info' } },
    },
    message: {
      control: 'text',
      description: 'Toast message content',
    },
    duration: {
      control: 'number',
      description: 'Auto-dismiss duration in ms (0 for persistent)',
      table: { defaultValue: { summary: '3000' } },
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description: 'Toast position (used by container)',
      table: { defaultValue: { summary: 'top-right' } },
    },
    dismissible: {
      control: 'boolean',
      description: 'Show dismiss button',
      table: { defaultValue: { summary: 'true' } },
    },
  },
  render: (args) => html`
    <tx-toast
      variant=${ifDefined(args.variant)}
      message=${args.message}
      duration=${ifDefined(args.duration)}
      position=${ifDefined(args.position)}
      ?dismissible=${args.dismissible}
    ></tx-toast>
  `,
};

export default meta;
type Story = StoryObj<TxToastProps>;

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'Your session has been saved automatically.',
    duration: 0, // Persistent for demo
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Clinical coding completed successfully!',
    duration: 0,
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'Some concepts may require manual review.',
    duration: 0,
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'Failed to connect to the terminology server.',
    duration: 0,
  },
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px; width: 400px;">
      <tx-toast variant="info" message="Information: Check your inbox" duration="0"></tx-toast>
      <tx-toast variant="success" message="Success: Changes saved" duration="0"></tx-toast>
      <tx-toast variant="warning" message="Warning: Low disk space" duration="0"></tx-toast>
      <tx-toast variant="error" message="Error: Connection failed" duration="0"></tx-toast>
    </div>
  `,
};

export const NonDismissible: Story = {
  args: {
    variant: 'info',
    message: 'This toast cannot be manually dismissed.',
    duration: 0,
    dismissible: false,
  },
};

export const ToastContainer: Story = {
  render: () => html`
    <div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <tx-button
          variant="primary"
          @click=${() =>
            toast({
              message: 'Information toast',
              variant: 'info',
            })}
        >
          Show Info
        </tx-button>
        <tx-button
          variant="primary"
          @click=${() =>
            toast({
              message: 'Operation completed successfully!',
              variant: 'success',
            })}
        >
          Show Success
        </tx-button>
        <tx-button
          variant="primary"
          @click=${() =>
            toast({
              message: 'Please check your input',
              variant: 'warning',
            })}
        >
          Show Warning
        </tx-button>
        <tx-button
          variant="primary"
          @click=${() =>
            toast({
              message: 'Something went wrong',
              variant: 'error',
            })}
        >
          Show Error
        </tx-button>
      </div>

      <tx-toast-container position="top-right"></tx-toast-container>

      <p style="margin-top: 24px; font-size: 14px; color: var(--color-text-secondary);">
        Click the buttons above to show different toast types. Toasts will auto-dismiss after 3
        seconds.
      </p>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: `
The toast container manages multiple toasts and handles stacking. Use the \`toast()\` function
to show toasts programmatically:

\`\`\`typescript
import { toast } from './tx-toast-container';

toast({
  message: 'Hello, World!',
  variant: 'success',
  duration: 5000, // optional, defaults to 3000
});
\`\`\`
        `,
      },
    },
  },
};

export const Positions: Story = {
  render: () => html`
    <div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        <tx-button
          variant="secondary"
          @click=${() => {
            const container = document.querySelector('tx-toast-container');
            container?.setAttribute('position', 'top-right');
            toast({ message: 'Top right position', variant: 'info' });
          }}
        >
          Top Right
        </tx-button>
        <tx-button
          variant="secondary"
          @click=${() => {
            const container = document.querySelector('tx-toast-container');
            container?.setAttribute('position', 'top-left');
            toast({ message: 'Top left position', variant: 'info' });
          }}
        >
          Top Left
        </tx-button>
        <tx-button
          variant="secondary"
          @click=${() => {
            const container = document.querySelector('tx-toast-container');
            container?.setAttribute('position', 'bottom-right');
            toast({ message: 'Bottom right position', variant: 'info' });
          }}
        >
          Bottom Right
        </tx-button>
        <tx-button
          variant="secondary"
          @click=${() => {
            const container = document.querySelector('tx-toast-container');
            container?.setAttribute('position', 'bottom-left');
            toast({ message: 'Bottom left position', variant: 'info' });
          }}
        >
          Bottom Left
        </tx-button>
      </div>

      <tx-toast-container position="top-right"></tx-toast-container>
    </div>
  `,
};

export const ProgrammaticUsage: Story = {
  render: () => html`
    <div>
      <pre
        style="background: var(--color-background); padding: 16px; border-radius: 8px; overflow-x: auto;"
      >
import { toast } from './components/core/tx-toast-container';

// Basic usage
toast({ message: 'Hello!' });

// With options
toast({
  message: 'Saved successfully',
  variant: 'success',
  duration: 5000,
});

// Error toast
toast({
  message: 'Network error occurred',
  variant: 'error',
  duration: 0, // Persistent until dismissed
});
      </pre>
    </div>
  `,
};
