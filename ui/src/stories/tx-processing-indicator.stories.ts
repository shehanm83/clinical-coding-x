/**
 * tx-processing-indicator Storybook Stories
 *
 * Visual feedback during AI processing.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { action } from '@storybook/addon-actions';

import '../components/features/coding/tx-processing-indicator.js';
import type { TxProcessingIndicator } from '../components/features/coding/tx-processing-indicator.js';

const meta: Meta<TxProcessingIndicator> = {
  title: 'Features/Coding/ProcessingIndicator',
  component: 'tx-processing-indicator',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A processing indicator component that provides visual feedback during AI processing.

## Features
- Progress bar with smooth fill animation
- Spinning icon with current action text
- Display of text being analyzed
- Estimated time remaining (after 5 seconds)
- Cancel button with confirmation at >50% progress

## Usage
\`\`\`html
<tx-processing-indicator
  .progress=\${45}
  .currentAction=\${'Extracting clinical terms'}
  .currentText=\${'acute chest pain radiating to left arm'}
  @cancel=\${this.handleCancel}
></tx-processing-indicator>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    progress: {
      description: 'Progress percentage (0-100)',
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    currentAction: {
      description: 'Current processing step description',
      control: { type: 'text' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
    currentText: {
      description: 'Text segment being analyzed',
      control: { type: 'text' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
    canCancel: {
      description: 'Whether cancellation is allowed',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<TxProcessingIndicator>;

// ===== DEFAULT =====

export const Default: Story = {
  name: 'Default',
  args: {
    progress: 0,
    currentAction: 'Initializing...',
    currentText: '',
    canCancel: true,
  },
  render: (args) => html`
    <tx-processing-indicator
      .progress=${args.progress}
      .currentAction=${args.currentAction}
      .currentText=${args.currentText}
      .canCancel=${args.canCancel}
      @cancel=${action('cancel')}
    ></tx-processing-indicator>
  `,
};

// ===== EXTRACTING TERMS =====

export const ExtractingTerms: Story = {
  name: 'Extracting Terms',
  args: {
    progress: 25,
    currentAction: 'Extracting clinical terms...',
    currentText: 'acute chest pain radiating to left arm',
    canCancel: true,
  },
  render: (args) => html`
    <tx-processing-indicator
      .progress=${args.progress}
      .currentAction=${args.currentAction}
      .currentText=${args.currentText}
      .canCancel=${args.canCancel}
      @cancel=${action('cancel')}
    ></tx-processing-indicator>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Processing at 25% - extracting clinical terms from text.',
      },
    },
  },
};

// ===== MATCHING CONCEPTS =====

export const MatchingConcepts: Story = {
  name: 'Matching Concepts',
  args: {
    progress: 55,
    currentAction: 'Searching for SNOMED CT concepts...',
    currentText: 'shortness of breath',
    canCancel: true,
  },
  render: (args) => html`
    <tx-processing-indicator
      .progress=${args.progress}
      .currentAction=${args.currentAction}
      .currentText=${args.currentText}
      .canCancel=${args.canCancel}
      @cancel=${action('cancel')}
    ></tx-processing-indicator>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Processing at 55% - matching concepts. Cancel will show confirmation.',
      },
    },
  },
};

// ===== BUILDING EXPRESSION =====

export const BuildingExpression: Story = {
  name: 'Building Expression',
  args: {
    progress: 85,
    currentAction: 'Building postcoordinated expression...',
    currentText: '',
    canCancel: true,
  },
  render: (args) => html`
    <tx-processing-indicator
      .progress=${args.progress}
      .currentAction=${args.currentAction}
      .currentText=${args.currentText}
      .canCancel=${args.canCancel}
      @cancel=${action('cancel')}
    ></tx-processing-indicator>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Processing at 85% - building the final expression.',
      },
    },
  },
};

// ===== ALMOST COMPLETE =====

export const AlmostComplete: Story = {
  name: 'Almost Complete',
  args: {
    progress: 98,
    currentAction: 'Finalizing...',
    currentText: '',
    canCancel: false,
  },
  render: (args) => html`
    <tx-processing-indicator
      .progress=${args.progress}
      .currentAction=${args.currentAction}
      .currentText=${args.currentText}
      .canCancel=${args.canCancel}
      @cancel=${action('cancel')}
    ></tx-processing-indicator>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Processing at 98% - cancel disabled as processing is almost complete.',
      },
    },
  },
};

// ===== INTERACTIVE DEMO =====

export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  render: () => {
    class DemoWrapper extends HTMLElement {
      private progress = 0;
      private actions = [
        { text: 'Analyzing input...', analyzeText: 'patient presents with acute symptoms' },
        { text: 'Extracting clinical terms...', analyzeText: 'acute chest pain' },
        { text: 'Identifying body sites...', analyzeText: 'radiating to left arm' },
        { text: 'Searching SNOMED CT...', analyzeText: 'shortness of breath' },
        { text: 'Matching concepts...', analyzeText: 'diaphoresis' },
        { text: 'Building expression...', analyzeText: '' },
        { text: 'Validating...', analyzeText: '' },
        { text: 'Complete!', analyzeText: '' },
      ];
      private currentActionIndex = 0;
      private intervalId?: ReturnType<typeof setInterval>;
      private indicator?: HTMLElement;

      connectedCallback() {
        this.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <tx-processing-indicator></tx-processing-indicator>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button id="start-btn" style="padding: 8px 16px; border-radius: 6px; background: #16a34a; color: white; border: none; cursor: pointer;">
                Start Processing
              </button>
              <button id="reset-btn" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer;">
                Reset
              </button>
            </div>
          </div>
        `;

        this.indicator = this.querySelector('tx-processing-indicator') as HTMLElement;
        this.updateIndicator();

        this.querySelector('#start-btn')?.addEventListener('click', () => this.startProcessing());
        this.querySelector('#reset-btn')?.addEventListener('click', () => this.reset());
        this.indicator?.addEventListener('cancel', () => this.handleCancel());
      }

      disconnectedCallback() {
        this.stopProcessing();
      }

      updateIndicator() {
        if (this.indicator) {
          const action = this.actions[this.currentActionIndex] || this.actions[0];
          (this.indicator as any).progress = this.progress;
          (this.indicator as any).currentAction = action.text;
          (this.indicator as any).currentText = action.analyzeText;
        }
      }

      startProcessing() {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
          if (this.progress < 100) {
            this.progress += Math.random() * 5 + 1;
            if (this.progress > 100) this.progress = 100;

            // Update action based on progress
            const actionIndex = Math.min(
              Math.floor(this.progress / 15),
              this.actions.length - 1
            );
            this.currentActionIndex = actionIndex;

            this.updateIndicator();
          } else {
            this.stopProcessing();
          }
        }, 500);
      }

      stopProcessing() {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = undefined;
        }
      }

      handleCancel() {
        this.stopProcessing();
        this.reset();
      }

      reset() {
        this.stopProcessing();
        this.progress = 0;
        this.currentActionIndex = 0;
        this.updateIndicator();
      }
    }

    if (!customElements.get('demo-processing-wrapper')) {
      customElements.define('demo-processing-wrapper', DemoWrapper);
    }

    return html`<demo-processing-wrapper></demo-processing-wrapper>`;
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo simulating the processing workflow. Click "Start Processing" to see the animation.',
      },
    },
  },
};

// ===== DARK THEME =====

export const DarkTheme: Story = {
  name: 'Dark Theme',
  args: {
    progress: 45,
    currentAction: 'Extracting clinical terms...',
    currentText: 'acute myocardial infarction',
    canCancel: true,
  },
  render: (args) => html`
    <div
      style="
        background: #1f2937;
        padding: 24px;
        border-radius: 8px;
        --color-surface: #374151;
        --color-background: #4b5563;
        --color-text-primary: #f9fafb;
        --color-text-secondary: #d1d5db;
        --color-text-muted: #9ca3af;
        --color-border: #4b5563;
        --color-primary: #60a5fa;
        --color-primary-light: #93c5fd;
        --color-gray-100: #4b5563;
        --color-gray-50: #374151;
      "
    >
      <tx-processing-indicator
        .progress=${args.progress}
        .currentAction=${args.currentAction}
        .currentText=${args.currentText}
        .canCancel=${args.canCancel}
        @cancel=${action('cancel')}
      ></tx-processing-indicator>
    </div>
  `,
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'The component supports theming via CSS custom properties.',
      },
    },
  },
};
