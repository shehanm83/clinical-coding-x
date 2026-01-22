/**
 * tx-progress-stepper - Progress Stepper Component
 *
 * A visual progress indicator showing the coding workflow steps.
 * Displays 4 steps: Input, Match, Refine, Complete with animated transitions.
 *
 * @fires step-click - Fired when a completed step is clicked
 *
 * @example
 * ```html
 * <tx-progress-stepper
 *   .currentStep=${'match'}
 *   .completedSteps=${['input']}
 * ></tx-progress-stepper>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * Step identifier type
 */
export type StepId = 'input' | 'match' | 'refine' | 'complete';

/**
 * Step definition interface
 */
export interface StepDefinition {
  id: StepId;
  label: string;
  number: number;
}

/**
 * Step state type
 */
export type StepState = 'pending' | 'active' | 'completed';

/**
 * Step definitions array
 */
const STEPS: StepDefinition[] = [
  { id: 'input', label: 'Input', number: 1 },
  { id: 'match', label: 'Match', number: 2 },
  { id: 'refine', label: 'Refine', number: 3 },
  { id: 'complete', label: 'Complete', number: 4 },
];

@customElement('tx-progress-stepper')
export class TxProgressStepper extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ===== CONTAINER ===== */

    .stepper-container {
      padding: var(--space-2, 8px) var(--space-3, 12px);
    }

    .step-header {
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #4b5563);
      margin-bottom: var(--space-1, 4px);
      text-align: center;
    }

    .step-header-current {
      color: var(--color-primary, #2563eb);
      font-weight: var(--font-weight-semibold, 600);
    }

    /* ===== STEPPER LAYOUT ===== */

    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
    }

    .step-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    /* ===== STEP CIRCLE ===== */

    .step-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      transition: all var(--duration-normal, 200ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
      position: relative;
      z-index: 1;
    }

    /* Pending state - gray hollow circle */
    .step-circle.pending {
      background-color: var(--color-surface, #ffffff);
      border: 2px solid var(--color-border, #e5e7eb);
      color: var(--color-text-muted, #9ca3af);
    }

    /* Active state - blue filled circle with pulse */
    .step-circle.active {
      background-color: var(--color-primary, #2563eb);
      border: 2px solid var(--color-primary, #2563eb);
      color: var(--color-text-inverse, #ffffff);
      animation: pulse 2s infinite;
    }

    /* Completed state - green circle with check */
    .step-circle.completed {
      background-color: var(--color-success, #16a34a);
      border: 2px solid var(--color-success, #16a34a);
      color: var(--color-text-inverse, #ffffff);
      cursor: pointer;
    }

    .step-circle.completed:hover {
      background-color: var(--color-success-dark, #15803d);
      border-color: var(--color-success-dark, #15803d);
    }

    /* Check icon for completed */
    .check-icon {
      width: 12px;
      height: 12px;
    }

    /* ===== STEP LABEL ===== */

    .step-label {
      font-size: 10px;
      color: var(--color-text-muted, #9ca3af);
      margin-top: var(--space-1, 4px);
      text-align: center;
      white-space: nowrap;
    }

    .step-label.active {
      color: var(--color-primary, #2563eb);
      font-weight: var(--font-weight-medium, 500);
    }

    .step-label.completed {
      color: var(--color-success, #16a34a);
    }

    /* ===== CONNECTING LINE ===== */

    .connecting-line {
      width: 40px;
      height: 2px;
      background-color: var(--color-border, #e5e7eb);
      position: relative;
      margin: 0 var(--space-1, 4px);
      margin-bottom: 18px; /* Offset for label height */
    }

    .connecting-line-fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 0;
      background-color: var(--color-success, #16a34a);
      transition: width var(--duration-slow, 300ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    }

    .connecting-line.completed .connecting-line-fill {
      width: 100%;
    }

    .connecting-line.active .connecting-line-fill {
      width: 50%;
      background-color: var(--color-primary, #2563eb);
    }

    /* ===== PULSE ANIMATION ===== */

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(37, 99, 235, 0);
      }
    }

    /* ===== REDUCED MOTION ===== */

    @media (prefers-reduced-motion: reduce) {
      .step-circle.active {
        animation: none;
        box-shadow: 0 0 0 3px var(--color-primary-light, #dbeafe);
      }

      .connecting-line-fill {
        transition: none;
      }

      .step-circle {
        transition: none;
      }
    }

    /* ===== RESPONSIVE - MOBILE VERTICAL LAYOUT ===== */

    @media (max-width: 768px) {
      .stepper {
        flex-direction: column;
        align-items: flex-start;
        gap: 0;
      }

      .step-wrapper {
        flex-direction: row;
        gap: var(--space-2, 8px);
      }

      .step-label {
        margin-top: 0;
        margin-left: var(--space-1, 4px);
      }

      .connecting-line {
        width: 2px;
        height: 16px;
        margin: var(--space-1, 4px) 0;
        margin-left: 11px; /* Center under circle */
        margin-bottom: 0;
      }

      .step-header {
        text-align: left;
      }
    }

    /* ===== ACCESSIBILITY ===== */

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  /**
   * Current active step ID
   */
  @property({ type: String })
  currentStep: StepId = 'input';

  /**
   * Array of completed step IDs
   */
  @property({ type: Array })
  completedSteps: StepId[] = [];

  /**
   * Get the state of a step
   */
  private _getStepState(stepId: StepId): StepState {
    if (this.completedSteps.includes(stepId)) {
      return 'completed';
    }
    if (stepId === this.currentStep) {
      return 'active';
    }
    return 'pending';
  }

  /**
   * Get current step number
   */
  private _getCurrentStepNumber(): number {
    const step = STEPS.find((s) => s.id === this.currentStep);
    return step?.number ?? 1;
  }

  /**
   * Get current step label
   */
  private _getCurrentStepLabel(): string {
    const step = STEPS.find((s) => s.id === this.currentStep);
    return step?.label ?? 'Input';
  }

  /**
   * Get connecting line state
   */
  private _getLineState(afterStepId: StepId): StepState {
    const stepIndex = STEPS.findIndex((s) => s.id === afterStepId);
    const nextStep = STEPS[stepIndex + 1];

    if (!nextStep) return 'pending';

    // Line is completed if current step is completed
    if (this.completedSteps.includes(afterStepId)) {
      return 'completed';
    }

    // Line is active if this is the current step
    if (afterStepId === this.currentStep) {
      return 'active';
    }

    return 'pending';
  }

  /**
   * Handle step click (for completed steps)
   */
  private _handleStepClick(stepId: StepId, state: StepState) {
    if (state === 'completed') {
      this.dispatchEvent(
        new CustomEvent('step-click', {
          bubbles: true,
          composed: true,
          detail: { stepId },
        })
      );
    }
  }

  /**
   * Render check icon SVG
   */
  private _renderCheckIcon() {
    return html`
      <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  }

  /**
   * Render step circle content
   */
  private _renderStepContent(step: StepDefinition, state: StepState) {
    if (state === 'completed') {
      return this._renderCheckIcon();
    }
    return step.number;
  }

  /**
   * Render a single step
   */
  private _renderStep(step: StepDefinition, index: number) {
    const state = this._getStepState(step.id);
    const isLast = index === STEPS.length - 1;

    const circleClasses = {
      'step-circle': true,
      [state]: true,
    };

    const labelClasses = {
      'step-label': true,
      [state]: true,
    };

    return html`
      <div class="step-wrapper">
        <div
          class=${classMap(circleClasses)}
          role="button"
          tabindex=${state === 'completed' ? '0' : '-1'}
          aria-label="${step.label} - ${state}"
          @click=${() => this._handleStepClick(step.id, state)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this._handleStepClick(step.id, state);
            }
          }}
        >
          ${this._renderStepContent(step, state)}
        </div>
        <span class=${classMap(labelClasses)}>${step.label}</span>
      </div>
      ${!isLast ? this._renderConnectingLine(step.id) : ''}
    `;
  }

  /**
   * Render connecting line
   */
  private _renderConnectingLine(afterStepId: StepId) {
    const state = this._getLineState(afterStepId);

    const lineClasses = {
      'connecting-line': true,
      [state]: true,
    };

    return html`
      <div class=${classMap(lineClasses)}>
        <div class="connecting-line-fill"></div>
      </div>
    `;
  }

  render() {
    const currentStepNumber = this._getCurrentStepNumber();
    const currentStepLabel = this._getCurrentStepLabel();

    return html`
      <div
        class="stepper-container"
        role="progressbar"
        aria-valuenow=${currentStepNumber}
        aria-valuemin="1"
        aria-valuemax="4"
        aria-label="Coding progress"
      >
        <div class="step-header">
          Step <span class="step-header-current">${currentStepNumber}</span> of 4:
          <span class="step-header-current">${currentStepLabel}</span>
        </div>

        <div class="stepper" role="list">
          ${STEPS.map((step, index) => this._renderStep(step, index))}
        </div>

        <!-- Screen reader announcement -->
        <div class="visually-hidden" aria-live="polite">
          Step ${currentStepNumber} of 4: ${currentStepLabel}
        </div>
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-progress-stepper': TxProgressStepper;
  }
}
