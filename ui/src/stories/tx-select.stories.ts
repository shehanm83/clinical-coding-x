/**
 * TxSelect Stories
 *
 * Documentation and examples for the tx-select dropdown component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/core/tx-select.js';
import type { SelectOption } from '../components/core/tx-select.js';

interface TxSelectProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
}

const defaultOptions: SelectOption[] = [
  { label: 'Clinical Finding', value: 'finding' },
  { label: 'Body Structure', value: 'body_structure' },
  { label: 'Procedure', value: 'procedure' },
  { label: 'Substance', value: 'substance' },
  { label: 'Qualifier Value', value: 'qualifier', disabled: true },
];

const meta: Meta<TxSelectProps> = {
  title: 'Core/Select',
  component: 'tx-select',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxSelect

A custom dropdown select component with full keyboard navigation support.

### Features
- **Custom styling**: Consistent appearance across browsers
- **Keyboard navigation**: Arrow keys, Enter, Space, Escape
- **Typeahead**: Jump to options by typing first letter
- **Disabled options**: Individual options can be disabled
- **Error state**: Visual and accessible error indication

### Accessibility
- Implements WAI-ARIA combobox pattern
- Full keyboard navigation (Up/Down arrows, Home, End)
- \`role="combobox"\` on trigger, \`role="listbox"\` on dropdown
- \`aria-expanded\`, \`aria-haspopup\`, \`aria-selected\`
- Focus trap within dropdown

### Events
- \`change\`: Fired when selection changes with \`{ value, label }\`
- \`invalid\`: Fired when validation fails
        `,
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text displayed above select',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder when no option selected',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below select',
    },
    required: {
      control: 'boolean',
      description: 'Whether selection is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether select is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Whether in error state',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message when in error state',
    },
  },
  render: (args) => html`
    <div style="width: 300px;">
      <tx-select
        label=${ifDefined(args.label)}
        value=${ifDefined(args.value)}
        placeholder=${ifDefined(args.placeholder)}
        helperText=${ifDefined(args.helperText)}
        errorMessage=${ifDefined(args.errorMessage)}
        .options=${args.options}
        ?required=${args.required}
        ?disabled=${args.disabled}
        ?error=${args.error}
      ></tx-select>
    </div>
  `,
};

export default meta;
type Story = StoryObj<TxSelectProps>;

export const Default: Story = {
  args: {
    label: 'SNOMED Domain',
    placeholder: 'Select a domain',
    options: defaultOptions,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Semantic Type',
    placeholder: 'Choose semantic type',
    options: defaultOptions,
    helperText: 'Filter results by semantic category',
  },
};

export const Required: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'Please select',
    options: defaultOptions,
    required: true,
    helperText: 'This selection is required',
  },
};

export const WithPreselectedValue: Story = {
  args: {
    label: 'Default Selection',
    options: defaultOptions,
    value: 'procedure',
  },
};

export const WithError: Story = {
  args: {
    label: 'With Error',
    placeholder: 'Select an option',
    options: defaultOptions,
    error: true,
    errorMessage: 'Please select an option to continue',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    options: defaultOptions,
    value: 'finding',
    disabled: true,
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: 'Some Options Disabled',
    placeholder: 'Select available option',
    options: [
      { label: 'Available Option 1', value: '1' },
      { label: 'Unavailable Option', value: '2', disabled: true },
      { label: 'Available Option 2', value: '3' },
      { label: 'Premium Feature', value: '4', disabled: true },
    ],
  },
};

export const LongOptionList: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select your country',
    options: [
      { label: 'Australia', value: 'AU' },
      { label: 'Brazil', value: 'BR' },
      { label: 'Canada', value: 'CA' },
      { label: 'Germany', value: 'DE' },
      { label: 'France', value: 'FR' },
      { label: 'India', value: 'IN' },
      { label: 'Japan', value: 'JP' },
      { label: 'New Zealand', value: 'NZ' },
      { label: 'United Kingdom', value: 'UK' },
      { label: 'United States', value: 'US' },
    ],
    helperText: 'Tip: Type first letter to jump to option',
  },
};

export const KeyboardNavigation: Story = {
  render: () => html`
    <div style="width: 300px;">
      <tx-select
        label="Test Keyboard Navigation"
        placeholder="Focus and use arrow keys"
        .options=${defaultOptions}
      ></tx-select>
      <p style="margin-top: 16px; font-size: 14px; color: var(--color-text-secondary);">
        <strong>Keyboard shortcuts:</strong><br />
        - Space/Enter: Open dropdown or select option<br />
        - Arrow Up/Down: Navigate options<br />
        - Home/End: Jump to first/last option<br />
        - Escape: Close dropdown<br />
        - Type letter: Jump to matching option
      </p>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'The select component supports full keyboard navigation for accessibility.',
      },
    },
  },
};
