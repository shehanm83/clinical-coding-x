/**
 * tx-progress-stepper Storybook Stories
 *
 * Visual progress indicator for coding workflow steps.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { action } from '@storybook/addon-actions';

import '../components/features/coding/tx-progress-stepper.js';
import type { TxProgressStepper, StepId } from '../components/features/coding/tx-progress-stepper.js';

const meta: Meta<TxProgressStepper> = {
  title: 'Features/Coding/ProgressStepper',
  component: 'tx-progress-stepper',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A visual progress indicator showing the 4-step clinical coding workflow:
1. **Input** - Enter clinical text
2. **Match** - Find matching SNOMED CT concepts
3. **Refine** - Select and refine concepts
4. **Complete** - Review final expression

## Features
- Visual step indicators with states (pending, active, completed)
- Animated connecting lines that fill as progress is made
- Pulse animation on active step
- Click on completed steps to navigate back
- Responsive design (horizontal on desktop, vertical on mobile)
- Full accessibility support with ARIA attributes

## Usage
\`\`\`html
<tx-progress-stepper
  .currentStep=\${'match'}
  .completedSteps=\${['input']}
  @step-click=\${this.handleStepClick}
></tx-progress-stepper>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    currentStep: {
      description: 'The current active step',
      control: { type: 'select' },
      options: ['input', 'match', 'refine', 'complete'],
      table: {
        type: { summary: 'StepId' },
        defaultValue: { summary: 'input' },
      },
    },
    completedSteps: {
      description: 'Array of completed step IDs',
      control: { type: 'object' },
      table: {
        type: { summary: 'StepId[]' },
        defaultValue: { summary: '[]' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<TxProgressStepper>;

// ===== DEFAULT =====

export const Default: Story = {
  name: 'Default (Step 1)',
  args: {
    currentStep: 'input' as StepId,
    completedSteps: [],
  },
  render: (args) => html`
    <tx-progress-stepper
      .currentStep=${args.currentStep}
      .completedSteps=${args.completedSteps}
      @step-click=${action('step-click')}
    ></tx-progress-stepper>
  `,
};

// ===== STEP 2: MATCH =====

export const Step2Match: Story = {
  name: 'Step 2: Match',
  args: {
    currentStep: 'match' as StepId,
    completedSteps: ['input'] as StepId[],
  },
  render: (args) => html`
    <tx-progress-stepper
      .currentStep=${args.currentStep}
      .completedSteps=${args.completedSteps}
      @step-click=${action('step-click')}
    ></tx-progress-stepper>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Progress at step 2 (Match) with step 1 (Input) completed.',
      },
    },
  },
};

// ===== STEP 3: REFINE =====

export const Step3Refine: Story = {
  name: 'Step 3: Refine',
  args: {
    currentStep: 'refine' as StepId,
    completedSteps: ['input', 'match'] as StepId[],
  },
  render: (args) => html`
    <tx-progress-stepper
      .currentStep=${args.currentStep}
      .completedSteps=${args.completedSteps}
      @step-click=${action('step-click')}
    ></tx-progress-stepper>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Progress at step 3 (Refine) with steps 1 and 2 completed.',
      },
    },
  },
};

// ===== STEP 4: COMPLETE =====

export const Step4Complete: Story = {
  name: 'Step 4: Complete',
  args: {
    currentStep: 'complete' as StepId,
    completedSteps: ['input', 'match', 'refine'] as StepId[],
  },
  render: (args) => html`
    <tx-progress-stepper
      .currentStep=${args.currentStep}
      .completedSteps=${args.completedSteps}
      @step-click=${action('step-click')}
    ></tx-progress-stepper>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Progress at final step (Complete) with all previous steps completed.',
      },
    },
  },
};

// ===== ALL COMPLETED =====

export const AllCompleted: Story = {
  name: 'All Steps Completed',
  args: {
    currentStep: 'complete' as StepId,
    completedSteps: ['input', 'match', 'refine', 'complete'] as StepId[],
  },
  render: (args) => html`
    <tx-progress-stepper
      .currentStep=${args.currentStep}
      .completedSteps=${args.completedSteps}
      @step-click=${action('step-click')}
    ></tx-progress-stepper>
  `,
  parameters: {
    docs: {
      description: {
        story: 'All steps completed - shows all check marks.',
      },
    },
  },
};

// ===== MOBILE VIEWPORT =====

export const MobileViewport: Story = {
  name: 'Mobile Viewport (Vertical)',
  args: {
    currentStep: 'refine' as StepId,
    completedSteps: ['input', 'match'] as StepId[],
  },
  render: (args) => html`
    <div style="max-width: 320px; border: 1px dashed #ccc; padding: 16px;">
      <tx-progress-stepper
        .currentStep=${args.currentStep}
        .completedSteps=${args.completedSteps}
        @step-click=${action('step-click')}
      ></tx-progress-stepper>
    </div>
  `,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile viewports (<768px), the stepper switches to a vertical layout.',
      },
    },
  },
};

// ===== INTERACTIVE DEMO =====

export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  render: () => {
    // State management via custom element wrapper
    class DemoWrapper extends HTMLElement {
      private currentStep: StepId = 'input';
      private completedSteps: StepId[] = [];
      private stepper: HTMLElement | null = null;

      connectedCallback() {
        this.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <tx-progress-stepper></tx-progress-stepper>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button id="prev-btn" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer;">
                ← Previous
              </button>
              <button id="next-btn" style="padding: 8px 16px; border-radius: 6px; background: #2563eb; color: white; border: none; cursor: pointer;">
                Next →
              </button>
              <button id="reset-btn" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer;">
                Reset
              </button>
            </div>
            <div id="status" style="text-align: center; font-size: 14px; color: #6b7280;">
              Click "Next" to progress through steps
            </div>
          </div>
        `;

        this.stepper = this.querySelector('tx-progress-stepper');
        this.updateStepper();

        this.querySelector('#next-btn')?.addEventListener('click', () => this.nextStep());
        this.querySelector('#prev-btn')?.addEventListener('click', () => this.prevStep());
        this.querySelector('#reset-btn')?.addEventListener('click', () => this.reset());
      }

      updateStepper() {
        if (this.stepper) {
          (this.stepper as any).currentStep = this.currentStep;
          (this.stepper as any).completedSteps = [...this.completedSteps];
        }
        const status = this.querySelector('#status');
        if (status) {
          const stepNames: Record<StepId, string> = {
            input: 'Input',
            match: 'Match',
            refine: 'Refine',
            complete: 'Complete',
          };
          status.textContent = `Current: ${stepNames[this.currentStep]} | Completed: ${
            this.completedSteps.length > 0 ? this.completedSteps.join(', ') : 'none'
          }`;
        }
      }

      nextStep() {
        const steps: StepId[] = ['input', 'match', 'refine', 'complete'];
        const currentIndex = steps.indexOf(this.currentStep);

        if (currentIndex < steps.length - 1) {
          // Mark current as completed
          if (!this.completedSteps.includes(this.currentStep)) {
            this.completedSteps.push(this.currentStep);
          }
          // Move to next
          this.currentStep = steps[currentIndex + 1];
          this.updateStepper();
        } else {
          // Mark final step as completed
          if (!this.completedSteps.includes('complete')) {
            this.completedSteps.push('complete');
            this.updateStepper();
          }
        }
      }

      prevStep() {
        const steps: StepId[] = ['input', 'match', 'refine', 'complete'];
        const currentIndex = steps.indexOf(this.currentStep);

        if (currentIndex > 0) {
          // Remove current from completed if it was
          this.completedSteps = this.completedSteps.filter((s) => s !== this.currentStep);
          // Move to previous
          this.currentStep = steps[currentIndex - 1];
          // Remove previous from completed too
          this.completedSteps = this.completedSteps.filter((s) => s !== this.currentStep);
          this.updateStepper();
        }
      }

      reset() {
        this.currentStep = 'input';
        this.completedSteps = [];
        this.updateStepper();
      }
    }

    if (!customElements.get('demo-progress-wrapper')) {
      customElements.define('demo-progress-wrapper', DemoWrapper);
    }

    return html`<demo-progress-wrapper></demo-progress-wrapper>`;
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing step progression. Click "Next" to advance through the workflow.',
      },
    },
  },
};

// ===== DARK THEME =====

export const DarkTheme: Story = {
  name: 'Dark Theme',
  args: {
    currentStep: 'match' as StepId,
    completedSteps: ['input'] as StepId[],
  },
  render: (args) => html`
    <div
      style="
        background: #1f2937;
        padding: 24px;
        border-radius: 8px;
        --color-surface: #374151;
        --color-text-primary: #f9fafb;
        --color-text-secondary: #d1d5db;
        --color-text-muted: #9ca3af;
        --color-text-inverse: #1f2937;
        --color-border: #4b5563;
        --color-primary: #60a5fa;
        --color-primary-light: #1e3a5f;
        --color-success: #34d399;
        --color-success-dark: #10b981;
      "
    >
      <tx-progress-stepper
        .currentStep=${args.currentStep}
        .completedSteps=${args.completedSteps}
        @step-click=${action('step-click')}
      ></tx-progress-stepper>
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
