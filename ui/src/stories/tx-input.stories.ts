/**
 * TxInput Stories
 *
 * Documentation and examples for the tx-input component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/core/tx-input.js';
import type { InputType } from '../components/core/tx-input.js';

interface TxInputProps {
  type?: InputType;
  label?: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

const meta: Meta<TxInputProps> = {
  title: 'Core/Input',
  component: 'tx-input',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxInput

A text input component with label, validation, and helper text support.

### Features
- **Multiple types**: Text, Email, Password, Tel, URL, Search, Number
- **Validation**: Built-in HTML5 validation with custom error messages
- **Helper text**: Additional context below the input
- **Error state**: Visual and accessible error indication
- **Clear button**: Optional clear button for quick value reset

### Accessibility
- Label properly associated with input via \`for\`/\`id\`
- \`aria-describedby\` links to helper/error text
- \`aria-invalid\` indicates error state
- Error messages use \`role="alert"\`
- Required fields marked with \`aria-required\`

### Events
- \`input\`: Fired on every keystroke
- \`change\`: Fired when input loses focus
- \`invalid\`: Fired when validation fails
        `,
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'tel', 'url', 'search', 'number'],
      description: 'HTML input type',
      table: { defaultValue: { summary: 'text' } },
    },
    label: {
      control: 'text',
      description: 'Label text displayed above input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below input',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message when in error state',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
      table: { defaultValue: { summary: 'false' } },
    },
    error: {
      control: 'boolean',
      description: 'Whether the input is in error state',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  render: (args) => html`
    <tx-input
      type=${ifDefined(args.type)}
      label=${ifDefined(args.label)}
      value=${ifDefined(args.value)}
      placeholder=${ifDefined(args.placeholder)}
      helperText=${ifDefined(args.helperText)}
      errorMessage=${ifDefined(args.errorMessage)}
      ?required=${args.required}
      ?disabled=${args.disabled}
      ?error=${args.error}
    ></tx-input>
  `,
};

export default meta;
type Story = StoryObj<TxInputProps>;

export const Default: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    helperText: 'We will never share your email with anyone.',
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    required: true,
    helperText: 'This field is required',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'invalid-email',
    error: true,
    errorMessage: 'Please enter a valid email address',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    value: 'Cannot edit this',
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters',
  },
};

export const Search: Story = {
  args: {
    label: 'Search',
    type: 'search',
    placeholder: 'Search concepts...',
  },
};

export const AllInputTypes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 400px;">
      <tx-input label="Text" type="text" placeholder="Enter text"></tx-input>
      <tx-input label="Email" type="email" placeholder="you@example.com"></tx-input>
      <tx-input label="Password" type="password" placeholder="Enter password"></tx-input>
      <tx-input label="Number" type="number" placeholder="0"></tx-input>
      <tx-input label="Phone" type="tel" placeholder="+1 (555) 000-0000"></tx-input>
      <tx-input label="URL" type="url" placeholder="https://example.com"></tx-input>
      <tx-input label="Search" type="search" placeholder="Search..."></tx-input>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'The input component supports various HTML5 input types with appropriate validation.',
      },
    },
  },
};

export const FormExample: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        alert('Form submitted!');
      }}
      style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;"
    >
      <tx-input label="Full Name" name="name" required autocomplete="name"></tx-input>
      <tx-input
        label="Email Address"
        type="email"
        name="email"
        required
        autocomplete="email"
      ></tx-input>
      <tx-input
        label="Phone Number"
        type="tel"
        name="phone"
        helperText="Optional"
        autocomplete="tel"
      ></tx-input>
      <tx-button type="submit" variant="primary">Submit</tx-button>
    </form>
  `,
};
