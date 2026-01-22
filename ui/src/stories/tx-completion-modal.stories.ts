/**
 * TxCompletionModal Stories
 *
 * Comprehensive documentation and examples for the tx-completion-modal component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/features/coding/tx-completion-modal.js';
import type {
  CompletedExpression,
  SessionMetrics,
} from '../components/features/coding/tx-completion-modal.js';

interface TxCompletionModalProps {
  open?: boolean;
  expression?: CompletedExpression;
  metrics?: SessionMetrics;
  showConfetti?: boolean;
}

// Sample data
const sampleExpression: CompletedExpression = {
  ecl: '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
  formatted: {
    inline: '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
    nested: `29857009 |Chest pain| : {
  246112005 |Severity| = 24484000 |Severe|
}`,
  },
  description: 'Severe chest pain',
  validation: {
    valid: true,
    mrcmCompliant: true,
  },
};

const sampleMetrics: SessionMetrics = {
  totalTimeMs: 45000,
  termsExtracted: 3,
  conceptsMatched: 3,
  questionsAsked: 2,
  questionsAnswered: 2,
  expressionType: 'postcoordinated',
  validationStatus: 'mrcm_compliant',
};

const meta: Meta<TxCompletionModalProps> = {
  title: 'Features/Coding/CompletionModal',
  component: 'tx-completion-modal',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxCompletionModal

Success modal displayed when an ECL expression is completed.

### Features
- **Expression Display**: Shows formatted ECL expression with syntax highlighting
- **Session Metrics**: Displays time, terms, concepts, questions, and validation status
- **Action Buttons**: Copy, Download, Start New Session, View in Explorer
- **Celebration Animation**: Subtle confetti animation on success (respects prefers-reduced-motion)

### Events
- \`copy\`: Expression copied to clipboard
- \`download\`: Download requested
- \`new-session\`: Start new session requested
- \`view-explorer\`: View in SNOMED explorer requested
- \`close\`: Modal closed

### Accessibility
- Uses tx-modal for focus trap and keyboard navigation
- Escape key closes modal
- Confetti respects prefers-reduced-motion
- Action buttons have aria-labels
        `,
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is visible',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    showConfetti: {
      control: 'boolean',
      description: 'Whether to show celebration confetti',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
  },
  render: (args) => html`
    <tx-completion-modal
      ?open=${args.open}
      .expression=${args.expression}
      .metrics=${args.metrics}
      ?showConfetti=${args.showConfetti}
      @copy=${() => console.log('Copy event fired')}
      @download=${() => console.log('Download event fired')}
      @new-session=${() => console.log('New session event fired')}
      @view-explorer=${(e: CustomEvent) =>
        console.log('View explorer event fired:', e.detail)}
      @close=${() => console.log('Close event fired')}
    ></tx-completion-modal>
  `,
};

export default meta;
type Story = StoryObj<TxCompletionModalProps>;

// Default open state with full data
export const Default: Story = {
  args: {
    open: true,
    expression: sampleExpression,
    metrics: sampleMetrics,
    showConfetti: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default completion modal with expression, metrics, and confetti.',
      },
    },
  },
};

// Without confetti
export const NoConfetti: Story = {
  args: {
    open: true,
    expression: sampleExpression,
    metrics: sampleMetrics,
    showConfetti: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Completion modal without celebration animation.',
      },
    },
  },
};

// Simple precoordinated expression
export const Precoordinated: Story = {
  args: {
    open: true,
    expression: {
      ecl: '29857009 |Chest pain|',
      formatted: {
        inline: '29857009 |Chest pain|',
        nested: '29857009 |Chest pain|',
      },
      description: 'Chest pain finding',
      validation: {
        valid: true,
        mrcmCompliant: true,
      },
    },
    metrics: {
      totalTimeMs: 15000,
      termsExtracted: 1,
      conceptsMatched: 1,
      questionsAsked: 0,
      questionsAnswered: 0,
      expressionType: 'precoordinated',
      validationStatus: 'valid',
    },
    showConfetti: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Simple precoordinated expression with quick completion.',
      },
    },
  },
};

// Complex postcoordinated expression
export const ComplexPostcoordinated: Story = {
  args: {
    open: true,
    expression: {
      ecl: `29857009 |Chest pain| : {
  246112005 |Severity| = 24484000 |Severe|,
  363698007 |Finding site| = 80891009 |Heart structure|,
  263502005 |Clinical course| = 424124008 |Sudden onset|
}`,
      formatted: {
        inline:
          '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe|, 363698007 |Finding site| = 80891009 |Heart structure|, 263502005 |Clinical course| = 424124008 |Sudden onset| }',
        nested: `29857009 |Chest pain| : {
  246112005 |Severity| = 24484000 |Severe|,
  363698007 |Finding site| = 80891009 |Heart structure|,
  263502005 |Clinical course| = 424124008 |Sudden onset|
}`,
      },
      description: 'Severe sudden onset chest pain located in heart',
      validation: {
        valid: true,
        mrcmCompliant: true,
      },
    },
    metrics: {
      totalTimeMs: 120000,
      termsExtracted: 4,
      conceptsMatched: 4,
      questionsAsked: 5,
      questionsAnswered: 5,
      expressionType: 'postcoordinated',
      validationStatus: 'mrcm_compliant',
    },
    showConfetti: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex postcoordinated expression with multiple attributes.',
      },
    },
  },
};

// With validation warning
export const WithWarning: Story = {
  args: {
    open: true,
    expression: {
      ecl: '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
      formatted: {
        inline:
          '29857009 |Chest pain| : { 246112005 |Severity| = 24484000 |Severe| }',
        nested: `29857009 |Chest pain| : {
  246112005 |Severity| = 24484000 |Severe|
}`,
      },
      description: 'Severe chest pain',
      validation: {
        valid: false,
        mrcmCompliant: false,
      },
    },
    metrics: {
      ...sampleMetrics,
      validationStatus: 'warning',
    },
    showConfetti: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Expression with validation warning. Confetti disabled for warnings.',
      },
    },
  },
};

// Quick completion (under 1 second)
export const QuickCompletion: Story = {
  args: {
    open: true,
    expression: sampleExpression,
    metrics: {
      totalTimeMs: 800,
      termsExtracted: 1,
      conceptsMatched: 1,
      questionsAsked: 0,
      questionsAnswered: 0,
      expressionType: 'precoordinated',
      validationStatus: 'valid',
    },
    showConfetti: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Very quick completion showing millisecond formatting.',
      },
    },
  },
};

// Long session (over 1 minute)
export const LongSession: Story = {
  args: {
    open: true,
    expression: sampleExpression,
    metrics: {
      totalTimeMs: 180000,
      termsExtracted: 8,
      conceptsMatched: 6,
      questionsAsked: 10,
      questionsAnswered: 10,
      expressionType: 'postcoordinated',
      validationStatus: 'mrcm_compliant',
    },
    showConfetti: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Long session showing minute:second formatting.',
      },
    },
  },
};

// Interactive demo
export const Interactive: Story = {
  render: () => {
    let modal: HTMLElement | null = null;

    const openModal = () => {
      if (modal) {
        (modal as any).open = true;
      }
    };

    const closeModal = () => {
      if (modal) {
        (modal as any).open = false;
      }
    };

    return html`
      <div>
        <p style="margin-bottom: 16px; color: var(--color-text-secondary);">
          Click the button to open the completion modal.
        </p>
        <tx-button variant="primary" @click=${openModal}>
          Show Completion Modal
        </tx-button>
        <tx-completion-modal
          @ref=${(e: Event) => (modal = e.target as HTMLElement)}
          .expression=${sampleExpression}
          .metrics=${sampleMetrics}
          ?showConfetti=${true}
          @close=${closeModal}
          @copy=${() => alert('Copied to clipboard!')}
          @download=${() => alert('Downloaded!')}
          @new-session=${() => {
            closeModal();
            alert('Starting new session...');
          }}
          @view-explorer=${() => alert('Opening SNOMED Explorer...')}
        ></tx-completion-modal>
      </div>
    `;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo. Click the button to open the modal and try all the actions.',
      },
    },
  },
};

// All metrics variations
export const MetricsVariations: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Quick (Precoordinated)</h4>
        <tx-completion-modal
          ?open=${true}
          .expression=${sampleExpression}
          .metrics=${{
            totalTimeMs: 5000,
            termsExtracted: 1,
            conceptsMatched: 1,
            questionsAsked: 0,
            questionsAnswered: 0,
            expressionType: 'precoordinated',
            validationStatus: 'valid',
          }}
          ?showConfetti=${false}
        ></tx-completion-modal>
      </div>
      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Full Session (Postcoordinated)</h4>
        <tx-completion-modal
          ?open=${true}
          .expression=${sampleExpression}
          .metrics=${sampleMetrics}
          ?showConfetti=${false}
        ></tx-completion-modal>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of different session metrics.',
      },
    },
  },
};
