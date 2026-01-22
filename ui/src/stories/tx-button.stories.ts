/**
 * TxButton Stories
 *
 * Comprehensive documentation and examples for the tx-button component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/core/tx-button.js';
import type { ButtonVariant, ButtonSize, ButtonType } from '../components/core/tx-button.js';

interface TxButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  label: string;
}

const meta: Meta<TxButtonProps> = {
  title: 'Core/Button',
  component: 'tx-button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxButton

A versatile button component with multiple variants, sizes, and states.

### Features
- **Multiple variants**: Primary, Secondary, Ghost, Destructive
- **Multiple sizes**: Small, Medium, Large
- **Loading state**: Shows spinner and disables interaction
- **Icon-only mode**: Square button for icon-only actions
- **Full-width support**: Spans container width
- **Keyboard accessible**: Full keyboard navigation support

### Accessibility
- Uses native \`<button>\` element
- Proper focus indicators with \`:focus-visible\`
- Loading state announced to screen readers
- Disabled state properly communicated

### Events
- \`click\`: Fired when button is clicked (not fired when disabled or loading)
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
      description: 'Visual style variant of the button',
      table: {
        defaultValue: { summary: 'primary' },
        type: { summary: 'ButtonVariant' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
      table: {
        defaultValue: { summary: 'md' },
        type: { summary: 'ButtonSize' },
      },
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type',
      table: {
        defaultValue: { summary: 'button' },
        type: { summary: 'ButtonType' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Whether to show loading spinner',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether button should span full width',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    iconOnly: {
      control: 'boolean',
      description: 'Whether button is icon-only (square)',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    label: {
      control: 'text',
      description: 'Button text content',
    },
  },
  render: (args) => html`
    <tx-button
      variant=${ifDefined(args.variant)}
      size=${ifDefined(args.size)}
      type=${ifDefined(args.type)}
      ?disabled=${args.disabled}
      ?loading=${args.loading}
      ?fullWidth=${args.fullWidth}
      ?iconOnly=${args.iconOnly}
    >
      ${args.label}
    </tx-button>
  `,
};

export default meta;
type Story = StoryObj<TxButtonProps>;

// Primary story
export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Primary Button',
  },
};

// Secondary story
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Secondary Button',
  },
};

// Ghost story
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Ghost Button',
  },
};

// Destructive story
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    label: 'Delete',
  },
};

// All sizes
export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; align-items: center;">
      <tx-button size="sm">Small</tx-button>
      <tx-button size="md">Medium</tx-button>
      <tx-button size="lg">Large</tx-button>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Buttons come in three sizes: Small (sm), Medium (md), and Large (lg).',
      },
    },
  },
};

// All variants
export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
      <tx-button variant="primary">Primary</tx-button>
      <tx-button variant="secondary">Secondary</tx-button>
      <tx-button variant="ghost">Ghost</tx-button>
      <tx-button variant="destructive">Destructive</tx-button>
    </div>
  `,
};

// Loading states
export const Loading: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
      <tx-button variant="primary" loading>Processing...</tx-button>
      <tx-button variant="secondary" loading>Loading...</tx-button>
      <tx-button variant="destructive" loading>Deleting...</tx-button>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Loading state shows a spinner and disables interaction while maintaining button width.',
      },
    },
  },
};

// Disabled states
export const Disabled: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
      <tx-button variant="primary" disabled>Disabled Primary</tx-button>
      <tx-button variant="secondary" disabled>Disabled Secondary</tx-button>
      <tx-button variant="ghost" disabled>Disabled Ghost</tx-button>
      <tx-button variant="destructive" disabled>Disabled Destructive</tx-button>
    </div>
  `,
};

// Full width
export const FullWidth: Story = {
  render: () => html`
    <div style="width: 300px;">
      <tx-button variant="primary" fullWidth>Full Width Button</tx-button>
    </div>
  `,
};

// Icon only
export const IconOnly: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px;">
      <tx-button variant="primary" iconOnly aria-label="Add item">+</tx-button>
      <tx-button variant="secondary" iconOnly aria-label="Close">×</tx-button>
      <tx-button variant="ghost" iconOnly aria-label="Settings">⚙</tx-button>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only buttons are square and should always have an `aria-label` for screen readers.',
      },
    },
  },
};

// Button with icon
export const WithIcon: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
      <tx-button variant="primary">
        <span style="margin-right: 8px;">+</span>
        Add New
      </tx-button>
      <tx-button variant="secondary">
        <span style="margin-right: 8px;">↓</span>
        Download
      </tx-button>
      <tx-button variant="destructive">
        <span style="margin-right: 8px;">🗑</span>
        Delete
      </tx-button>
    </div>
  `,
};

// Form submit example
export const FormSubmit: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        alert('Form submitted!');
      }}
    >
      <div style="display: flex; gap: 16px;">
        <tx-button type="submit" variant="primary">Submit</tx-button>
        <tx-button type="reset" variant="secondary">Reset</tx-button>
        <tx-button type="button" variant="ghost">Cancel</tx-button>
      </div>
    </form>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Buttons support `submit`, `reset`, and `button` types for form integration.',
      },
    },
  },
};
