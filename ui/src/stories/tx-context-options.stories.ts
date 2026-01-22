/**
 * TxContextOptions Stories
 *
 * Documentation and examples for the tx-context-options panel component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/features/coding/tx-context-options.js';
import type { ContextOptions } from '../components/features/coding/tx-context-options.js';

interface TxContextOptionsProps {
  expanded?: boolean;
  context?: ContextOptions;
}

const meta: Meta<TxContextOptionsProps> = {
  title: 'Features/Coding/ContextOptions',
  component: 'tx-context-options',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxContextOptions

A collapsible panel for specifying medical specialty and clinical setting to improve AI code suggestion accuracy.

### Features
- **Collapsible panel**: Collapsed by default to save space
- **Two-column layout**: Specialty and Setting dropdowns side by side
- **Keyboard accessible**: Toggle with Enter/Space keys
- **Context binding**: Two-way binding for context values

### Events
| Event | Detail | Description |
|-------|--------|-------------|
| \`context-change\` | \`ContextOptions\` | Fired when any option changes |

### Context Options Interface
\`\`\`typescript
interface ContextOptions {
  specialty?: string;
  setting?: string;
}
\`\`\`

### Available Specialties
- Cardiology
- Neurology
- Pulmonology
- Gastroenterology
- Orthopedics
- Dermatology
- Psychiatry
- General Medicine

### Available Settings
- Emergency
- Inpatient
- Outpatient
- Primary Care

### Accessibility
- Panel header has \`role="button"\` and is keyboard accessible
- \`aria-expanded\` indicates current state
- Smooth CSS transition (respects \`prefers-reduced-motion\`)
        `,
      },
    },
  },
  argTypes: {
    expanded: {
      control: 'boolean',
      description: 'Initial expanded state',
    },
    context: {
      control: 'object',
      description: 'Current context selection',
    },
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-context-options
        ?expanded=${args.expanded}
        .context=${args.context ?? {}}
        @context-change=${(e: CustomEvent) => console.log('Context changed:', e.detail)}
      ></tx-context-options>
    </div>
  `,
};

export default meta;
type Story = StoryObj<TxContextOptionsProps>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default collapsed state. Click to expand and see the context options.',
      },
    },
  },
};

export const Expanded: Story = {
  args: {
    expanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Expanded state showing the specialty and clinical setting dropdowns.',
      },
    },
  },
};

export const WithPreselectedValues: Story = {
  args: {
    expanded: true,
    context: {
      specialty: 'cardiology',
      setting: 'emergency',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel with pre-selected values for specialty and clinical setting.',
      },
    },
  },
};

export const SpecialtyOnly: Story = {
  args: {
    expanded: true,
    context: {
      specialty: 'neurology',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel with only specialty selected.',
      },
    },
  },
};

export const SettingOnly: Story = {
  args: {
    expanded: true,
    context: {
      setting: 'outpatient',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel with only clinical setting selected.',
      },
    },
  },
};

export const KeyboardInteraction: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <tx-context-options></tx-context-options>
      <div style="margin-top: 16px; padding: 16px; background: var(--color-background, #f9fafb); border-radius: 8px;">
        <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600;">Keyboard Interaction</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: var(--color-text-secondary);">
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Tab</kbd> - Focus the panel header</li>
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Enter</kbd> or <kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Space</kbd> - Toggle expand/collapse</li>
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">Tab</kbd> - Navigate to dropdowns when expanded</li>
        </ul>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard accessibility. Focus the panel and use Enter/Space to toggle.',
      },
    },
  },
};

export const WithContextChange: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <tx-context-options
        expanded
        @context-change=${(e: CustomEvent) => {
          const output = document.getElementById('context-output');
          if (output) {
            output.textContent = JSON.stringify(e.detail, null, 2);
          }
        }}
      ></tx-context-options>
      <div style="margin-top: 16px; padding: 16px; background: var(--color-background, #f9fafb); border-radius: 8px;">
        <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600;">Context Change Event Output</h4>
        <pre id="context-output" style="margin: 0; font-family: monospace; font-size: 14px; color: var(--color-text-secondary);">{}</pre>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Shows the context-change event payload when selections are made.',
      },
    },
  },
};

export const IntegrationExample: Story = {
  render: () => html`
    <div style="max-width: 800px; display: flex; flex-direction: column; gap: 16px;">
      <div style="padding: 16px; border: 1px solid var(--color-border, #e5e7eb); border-radius: 12px;">
        <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">Clinical Coding Input</h3>
        <tx-context-options
          @context-change=${(e: CustomEvent) => {
            const info = document.getElementById('integration-info');
            if (info) {
              const context = e.detail;
              const parts = [];
              if (context.specialty) parts.push('Specialty: ' + context.specialty);
              if (context.setting) parts.push('Setting: ' + context.setting);
              info.textContent = parts.length > 0 ? parts.join(' | ') : 'No context selected';
            }
          }}
        ></tx-context-options>
        <div style="margin-top: 12px; padding: 12px; background: var(--color-primary-light, #dbeafe); border-radius: 8px; font-size: 14px;">
          <strong>Active Context:</strong>
          <span id="integration-info" style="margin-left: 8px; color: var(--color-primary, #2563eb);">No context selected</span>
        </div>
      </div>
      <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">
        This example shows how the context options panel integrates with a clinical coding interface.
        The selected context is passed along with the clinical text when submitting for AI coding.
      </p>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Shows how the context options panel would integrate within a clinical coding interface.',
      },
    },
  },
};
