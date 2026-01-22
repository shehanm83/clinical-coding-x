/**
 * TxFab Stories
 *
 * Documentation and examples for the Floating Action Button component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/features/coding/tx-fab.js';
import type { FabAction } from '../components/features/coding/tx-fab.js';

interface TxFabProps {
  icon: string;
  label: string;
  disabled: boolean;
  loading: boolean;
  hidden: boolean;
  secondaryActions: FabAction[];
  ariaLabel: string;
}

const defaultSecondaryActions: FabAction[] = [
  { id: 'save-draft', icon: '💾', label: 'Save Draft' },
  { id: 'copy', icon: '📋', label: 'Copy Expression' },
  { id: 'export', icon: '📤', label: 'Export' },
];

const meta: Meta<TxFabProps> = {
  title: 'Mobile/FAB',
  component: 'tx-fab',
  tags: ['autodocs'],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## TxFab

A Floating Action Button (FAB) for primary mobile actions.

### Features
- **Fixed position**: Bottom-right corner above mobile nav
- **Extended mode**: Add label for more context
- **Loading state**: Spinner animation while processing
- **Hidden state**: Slides off-screen when keyboard opens
- **Secondary actions**: Expandable menu for additional options
- **Touch ripple**: Native-like tap feedback

### Accessibility
- \`aria-label\` for screen readers
- \`aria-expanded\` for menu state
- \`aria-haspopup\` indicates menu presence
- Focus visible outline
- Respects reduced motion preference

### Events
- \`click\`: Fired when FAB clicked (no secondary actions)
- \`action\`: Fired when secondary action selected (detail: { actionId })

### Usage
Use for primary actions like "Confirm Selection" or "Submit".
        `,
      },
    },
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'Icon to display (emoji or character)',
      table: { defaultValue: { summary: '✓' } },
    },
    label: {
      control: 'text',
      description: 'Label text (creates extended FAB)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    hidden: {
      control: 'boolean',
      description: 'Hide the FAB (slide off-screen)',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
  decorators: [
    (story) => html`
      <div style="height: 300px; position: relative; background: var(--color-background, #f9fafb);">
        ${story()}
      </div>
    `,
  ],
  render: (args) => html`
    <tx-fab
      icon=${args.icon}
      label=${args.label}
      ?disabled=${args.disabled}
      ?loading=${args.loading}
      ?hidden=${args.hidden}
      .secondaryActions=${args.secondaryActions || []}
      ariaLabel=${args.ariaLabel}
      @click=${() => console.log('FAB clicked')}
      @action=${(e: CustomEvent) => console.log('Action:', e.detail.actionId)}
    ></tx-fab>
  `,
};

export default meta;
type Story = StoryObj<TxFabProps>;

export const Default: Story = {
  args: {
    icon: '✓',
    label: '',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: [],
    ariaLabel: 'Confirm selection',
  },
};

export const Extended: Story = {
  args: {
    icon: '✓',
    label: 'Confirm',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: [],
    ariaLabel: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Extended FAB with label text for more context.',
      },
    },
  },
};

export const CustomIcon: Story = {
  args: {
    icon: '➕',
    label: 'Add Term',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: [],
    ariaLabel: '',
  },
};

export const Disabled: Story = {
  args: {
    icon: '✓',
    label: 'Confirm',
    disabled: true,
    loading: false,
    hidden: false,
    secondaryActions: [],
    ariaLabel: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state when action is not available.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    icon: '✓',
    label: 'Saving...',
    disabled: false,
    loading: true,
    hidden: false,
    secondaryActions: [],
    ariaLabel: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state shows spinner animation.',
      },
    },
  },
};

export const Hidden: Story = {
  args: {
    icon: '✓',
    label: 'Confirm',
    disabled: false,
    loading: false,
    hidden: true,
    secondaryActions: [],
    ariaLabel: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hidden state slides FAB off-screen. Use when keyboard is visible.',
      },
    },
  },
};

export const WithSecondaryActions: Story = {
  args: {
    icon: '✓',
    label: '',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: defaultSecondaryActions,
    ariaLabel: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Click FAB to expand secondary actions menu.',
      },
    },
  },
};

export const ExtendedWithActions: Story = {
  args: {
    icon: '✓',
    label: 'Confirm & Save',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: defaultSecondaryActions,
    ariaLabel: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Extended FAB with expandable secondary actions.',
      },
    },
  },
};

export const WithDisabledAction: Story = {
  args: {
    icon: '✓',
    label: 'Actions',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: [
      { id: 'save', icon: '💾', label: 'Save', disabled: false },
      { id: 'export', icon: '📤', label: 'Export (Premium)', disabled: true },
      { id: 'share', icon: '🔗', label: 'Share' },
    ],
    ariaLabel: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Some secondary actions can be disabled individually.',
      },
    },
  },
};

export const SubmitFab: Story = {
  args: {
    icon: '📤',
    label: 'Submit',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: [],
    ariaLabel: 'Submit clinical code',
  },
};

export const AddFab: Story = {
  args: {
    icon: '➕',
    label: '',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: [],
    ariaLabel: 'Add new item',
  },
};

export const ClinicalCodingFab: Story = {
  args: {
    icon: '✓',
    label: 'Complete',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: [
      { id: 'save-draft', icon: '💾', label: 'Save as Draft' },
      { id: 'copy-ecl', icon: '📋', label: 'Copy ECL' },
      { id: 'export-fhir', icon: '🔄', label: 'Export FHIR' },
    ],
    ariaLabel: 'Complete coding session',
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical FAB configuration for the clinical coding interface.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    return html`
      <div style="height: 400px; position: relative; padding: 20px; background: var(--color-background, #f9fafb);">
        <p style="margin: 0 0 16px; color: var(--color-text-secondary, #6b7280);">
          Click the FAB to see the expandable menu. Click outside to close.
        </p>
        <tx-fab
          icon="✓"
          label="Complete"
          .secondaryActions=${defaultSecondaryActions}
          @click=${() => console.log('FAB clicked')}
          @action=${(e: CustomEvent) => {
            console.log('Action selected:', e.detail.actionId);
            alert(`Action: ${e.detail.actionId}`);
          }}
        ></tx-fab>
      </div>
    `;
  },
};

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: 24px; padding: 20px;">
      <div style="text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: var(--color-text-muted);">Default</p>
        <div style="position: relative; width: 80px; height: 80px;">
          <tx-fab icon="✓" style="position: absolute; bottom: 0; right: 0;"></tx-fab>
        </div>
      </div>

      <div style="text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: var(--color-text-muted);">Extended</p>
        <div style="position: relative; width: 120px; height: 80px;">
          <tx-fab icon="✓" label="Confirm" style="position: absolute; bottom: 0; right: 0;"></tx-fab>
        </div>
      </div>

      <div style="text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: var(--color-text-muted);">Disabled</p>
        <div style="position: relative; width: 80px; height: 80px;">
          <tx-fab icon="✓" disabled style="position: absolute; bottom: 0; right: 0;"></tx-fab>
        </div>
      </div>

      <div style="text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: var(--color-text-muted);">Loading</p>
        <div style="position: relative; width: 80px; height: 80px;">
          <tx-fab icon="✓" loading style="position: absolute; bottom: 0; right: 0;"></tx-fab>
        </div>
      </div>
    </div>
  `,
  decorators: [],
  parameters: {
    docs: {
      description: {
        story: 'Overview of all FAB states.',
      },
    },
  },
};

export const MobileViewport: Story = {
  args: {
    icon: '✓',
    label: 'Complete',
    disabled: false,
    loading: false,
    hidden: false,
    secondaryActions: defaultSecondaryActions,
    ariaLabel: '',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'View in mobile viewport (320px) for realistic positioning.',
      },
    },
  },
};
