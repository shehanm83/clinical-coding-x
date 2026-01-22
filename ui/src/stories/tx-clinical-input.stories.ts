/**
 * TxClinicalInput Stories
 *
 * Documentation and examples for the tx-clinical-input component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/features/coding/tx-clinical-input.js';

interface TxClinicalInputProps {
  value?: string;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
  autofocus?: boolean;
  context?: {
    specialty?: string;
    setting?: string;
  };
}

const meta: Meta<TxClinicalInputProps> = {
  title: 'Features/Coding/ClinicalInput',
  component: 'tx-clinical-input',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxClinicalInput

A large text input component for entering clinical notes that will be processed by AI for medical coding.

### Features
- **Auto-resize**: Textarea grows with content (120px min, 400px max)
- **Character counter**: Real-time count with warning at 90% and error at 100%
- **Auto-save draft**: Saves to localStorage every 30 seconds
- **Keyboard shortcuts**: Ctrl+Enter (Cmd+Enter on Mac) to submit
- **Clear with confirmation**: Modal dialog to prevent accidental clearing

### Events
| Event | Detail | Description |
|-------|--------|-------------|
| \`submit\` | \`ClinicalInputEvent\` | Fired when Start Coding clicked or Ctrl+Enter |
| \`clear\` | \`void\` | Fired when text is cleared |
| \`draft-saved\` | \`{ text: string }\` | Fired on auto-save |

### Accessibility
- Full keyboard support (Tab, Ctrl+Enter)
- ARIA labels on all interactive elements
- Live region for character count updates
- Autofocus support with keyboard trap consideration
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Current text content',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables input and buttons',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state on submit button',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character limit (default: 10000)',
    },
    autofocus: {
      control: 'boolean',
      description: 'Focus on mount',
    },
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-clinical-input
        .value=${args.value ?? ''}
        .maxLength=${args.maxLength ?? 10000}
        .context=${args.context}
        ?disabled=${args.disabled}
        ?loading=${args.loading}
        ?autofocus=${args.autofocus}
        @submit=${(e: CustomEvent) => console.log('Submit event:', e.detail)}
        @clear=${() => console.log('Clear event')}
        @draft-saved=${(e: CustomEvent) => console.log('Draft saved:', e.detail)}
      ></tx-clinical-input>
    </div>
  `,
};

export default meta;
type Story = StoryObj<TxClinicalInputProps>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default empty state with placeholder text showing example clinical input.',
      },
    },
  },
};

export const WithContent: Story = {
  args: {
    value: `Patient is a 65-year-old male presenting with chief complaint of acute chest pain.

History of Present Illness:
The patient reports sudden onset of substernal chest pain that began approximately 2 hours ago. The pain is described as pressure-like, radiating to the left arm and jaw. Associated symptoms include diaphoresis and shortness of breath. Pain rated 8/10 in intensity.

Past Medical History:
- Hypertension (diagnosed 2015)
- Type 2 Diabetes Mellitus (diagnosed 2018)
- Hyperlipidemia

Current Medications:
- Lisinopril 20mg daily
- Metformin 1000mg BID
- Atorvastatin 40mg daily

Physical Examination:
- BP: 160/95 mmHg
- HR: 98 bpm, regular
- RR: 20/min
- SpO2: 94% on room air
- Cardiac: S1S2 regular, no murmurs
- Lungs: Clear to auscultation bilaterally`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Clinical input with sample patient notes demonstrating the typical use case.',
      },
    },
  },
};

export const ApproachingLimit: Story = {
  args: {
    value: 'x'.repeat(9100),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows warning state when approaching the character limit (>90%).',
      },
    },
  },
};

export const AtLimit: Story = {
  args: {
    value: 'x'.repeat(10000),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows error state when at the maximum character limit.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    value: 'Patient presents with acute chest pain radiating to left arm.',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state shown while AI is processing the clinical text.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    value: 'This input is disabled.',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state preventing any interaction.',
      },
    },
  },
};

export const WithContext: Story = {
  args: {
    value: 'Patient presents with acute myocardial infarction.',
    context: {
      specialty: 'cardiology',
      setting: 'emergency',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Clinical input with context (specialty and setting) that will be included in the submit event.',
      },
    },
  },
};

export const Autofocus: Story = {
  args: {
    autofocus: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Automatically focuses the textarea on page load.',
      },
    },
  },
};

export const CustomMaxLength: Story = {
  args: {
    maxLength: 500,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom character limit of 500 characters.',
      },
    },
  },
};

export const KeyboardShortcuts: Story = {
  render: () => html`
    <div style="max-width: 800px;">
      <tx-clinical-input
        @submit=${(e: CustomEvent) => alert('Submitted: ' + e.detail.text.substring(0, 50) + '...')}
      ></tx-clinical-input>
      <div style="margin-top: 16px; padding: 16px; background: var(--color-background, #f9fafb); border-radius: 8px;">
        <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600;">Keyboard Shortcuts</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: var(--color-text-secondary);">
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Ctrl</kbd> + <kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Enter</kbd> - Submit for coding</li>
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Cmd</kbd> + <kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Enter</kbd> - Submit (Mac)</li>
        </ul>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard shortcuts. Type some text and press Ctrl+Enter to submit.',
      },
    },
  },
};

export const AutoSaveDraft: Story = {
  render: () => html`
    <div style="max-width: 800px;">
      <tx-clinical-input
        @draft-saved=${(e: CustomEvent) => {
          const status = document.getElementById('draft-status');
          if (status) {
            status.textContent = 'Draft saved at ' + new Date().toLocaleTimeString();
            status.style.color = 'var(--color-success, #16a34a)';
          }
        }}
      ></tx-clinical-input>
      <div style="margin-top: 16px; padding: 12px; background: var(--color-background, #f9fafb); border-radius: 8px; font-size: 14px;">
        <strong>Auto-save Status:</strong>
        <span id="draft-status" style="margin-left: 8px; color: var(--color-text-muted);">Not saved yet</span>
        <p style="margin: 8px 0 0; color: var(--color-text-secondary);">
          Drafts are automatically saved every 30 seconds to localStorage.
          Refresh the page to see your draft restored.
        </p>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the auto-save draft functionality. Type some text and wait 30 seconds to see it auto-save.',
      },
    },
  },
};
