/**
 * TxTextarea Stories
 *
 * Documentation and examples for the tx-textarea component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/core/tx-textarea.js';

interface TxTextareaProps {
  label?: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  rows?: number;
  maxLength?: number;
  minLength?: number;
}

const meta: Meta<TxTextareaProps> = {
  title: 'Core/Textarea',
  component: 'tx-textarea',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxTextarea

A multi-line text input component with label, character counter, and validation support.

### Features
- **Character counter**: Shows current/max character count
- **Validation**: Built-in HTML5 validation with custom messages
- **Auto-resize**: Vertical resize by user
- **Helper text**: Additional context below textarea
- **Error state**: Visual and accessible error indication

### Accessibility
- Label properly associated with textarea
- \`aria-describedby\` links to helper/error text
- \`aria-invalid\` indicates error state
- Character counter uses \`aria-live="polite"\`
- Error messages use \`role="alert"\`

### Events
- \`input\`: Fired on every keystroke with \`{ value, characterCount }\`
- \`change\`: Fired when textarea loses focus
- \`invalid\`: Fired when validation fails
        `,
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text displayed above textarea',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below textarea',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text rows',
      table: { defaultValue: { summary: '4' } },
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length',
    },
    minLength: {
      control: 'number',
      description: 'Minimum character length',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
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
    <tx-textarea
      label=${ifDefined(args.label)}
      value=${ifDefined(args.value)}
      placeholder=${ifDefined(args.placeholder)}
      helperText=${ifDefined(args.helperText)}
      errorMessage=${ifDefined(args.errorMessage)}
      rows=${ifDefined(args.rows)}
      maxLength=${ifDefined(args.maxLength)}
      minLength=${ifDefined(args.minLength)}
      ?required=${args.required}
      ?disabled=${args.disabled}
      ?error=${args.error}
    ></tx-textarea>
  `,
};

export default meta;
type Story = StoryObj<TxTextareaProps>;

export const Default: Story = {
  args: {
    label: 'Clinical Notes',
    placeholder: 'Enter clinical notes here...',
    helperText: 'Describe symptoms, findings, and diagnoses',
  },
};

export const WithCharacterCounter: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a brief description',
    maxLength: 500,
    helperText: 'Maximum 500 characters',
  },
};

export const Required: Story = {
  args: {
    label: 'Patient History',
    placeholder: 'Enter patient history...',
    required: true,
    rows: 6,
    helperText: 'This field is required',
  },
};

export const WithError: Story = {
  args: {
    label: 'ECL Expression',
    value: '<<404684003 | Clinical finding |',
    error: true,
    errorMessage: 'Invalid ECL syntax: missing closing bracket',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Read-only Notes',
    value: 'This content cannot be edited.',
    disabled: true,
  },
};

export const CharacterLimitWarning: Story = {
  args: {
    label: 'Short Description',
    value:
      'This is a long text that is approaching the character limit. The counter will change color to warn you.',
    maxLength: 100,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The character counter changes color to warn when approaching (80%) or exceeding the limit.',
      },
    },
  },
};

export const LargeTextarea: Story = {
  args: {
    label: 'Detailed Clinical Notes',
    placeholder: 'Enter comprehensive clinical documentation...',
    rows: 10,
    maxLength: 10000,
    helperText: 'Use this space for detailed clinical documentation',
  },
};

export const ClinicalCodingInput: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <tx-textarea
        label="Clinical Text Input"
        placeholder="Enter or paste clinical text to be coded...

Example:
Patient presents with severe chest pain radiating to left arm, shortness of breath, and diaphoresis. History of hypertension and diabetes mellitus type 2."
        rows="8"
        maxLength="10000"
        helperText="Paste clinical notes, discharge summaries, or any medical text for SNOMED CT coding"
      ></tx-textarea>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Primary use case for the clinical coding application.',
      },
    },
  },
};

export const ECLExpressionInput: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <tx-textarea
        label="ECL Expression"
        placeholder="Enter SNOMED CT Expression Constraint Language (ECL)..."
        rows="4"
        value="<<404684003 |Clinical finding| :
  363698007 |Finding site| = <<39057004 |Pulmonary valve structure|,
  116676008 |Associated morphology| = <<26036001 |Obstruction|"
        helperText="Use ECL syntax to query SNOMED CT concept hierarchies"
        style="font-family: var(--font-mono);"
      ></tx-textarea>
    </div>
  `,
};
