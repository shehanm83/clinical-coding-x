/**
 * tx-progress-stepper Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { TxProgressStepper } from '../../../../src/components/features/coding/tx-progress-stepper.js';

// Import component to register it
import '../../../../src/components/features/coding/tx-progress-stepper.js';

describe('tx-progress-stepper', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      expect(el).toBeDefined();
      expect(el.currentStep).toBe('input');
      expect(el.completedSteps).toEqual([]);
    });

    it('renders all 4 steps', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const stepCircles = el.shadowRoot?.querySelectorAll('.step-circle');
      expect(stepCircles?.length).toBe(4);

      const stepLabels = el.shadowRoot?.querySelectorAll('.step-label');
      expect(stepLabels?.length).toBe(4);
    });

    it('renders step labels correctly', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const labels = el.shadowRoot?.querySelectorAll('.step-label');
      const labelTexts = Array.from(labels || []).map((l) => l.textContent?.trim());

      expect(labelTexts).toEqual(['Input', 'Match', 'Refine', 'Complete']);
    });

    it('renders connecting lines between steps', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const connectingLines = el.shadowRoot?.querySelectorAll('.connecting-line');
      expect(connectingLines?.length).toBe(3); // 3 lines for 4 steps
    });

    it('renders step header with current step info', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'match'}></tx-progress-stepper>`
      );

      const header = el.shadowRoot?.querySelector('.step-header');
      expect(header?.textContent).toContain('Step');
      expect(header?.textContent).toContain('2');
      expect(header?.textContent).toContain('Match');
    });
  });

  describe('step states', () => {
    it('first step is active by default', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const firstCircle = el.shadowRoot?.querySelector('.step-circle');
      expect(firstCircle?.classList.contains('active')).toBe(true);
    });

    it('marks steps as completed correctly', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
        ></tx-progress-stepper>`
      );

      const circles = el.shadowRoot?.querySelectorAll('.step-circle');
      const circlesArray = Array.from(circles || []);

      // First step should be completed
      expect(circlesArray[0]?.classList.contains('completed')).toBe(true);

      // Second step should be active
      expect(circlesArray[1]?.classList.contains('active')).toBe(true);

      // Remaining steps should be pending
      expect(circlesArray[2]?.classList.contains('pending')).toBe(true);
      expect(circlesArray[3]?.classList.contains('pending')).toBe(true);
    });

    it('completed steps show check icon', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
        ></tx-progress-stepper>`
      );

      const completedCircle = el.shadowRoot?.querySelector('.step-circle.completed');
      const checkIcon = completedCircle?.querySelector('.check-icon');

      expect(checkIcon).toBeDefined();
    });

    it('active step shows number', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'match'}></tx-progress-stepper>`
      );

      const activeCircle = el.shadowRoot?.querySelector('.step-circle.active');
      expect(activeCircle?.textContent?.trim()).toBe('2');
    });

    it('pending step shows number', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'input'}></tx-progress-stepper>`
      );

      const circles = el.shadowRoot?.querySelectorAll('.step-circle');
      const thirdCircle = circles?.[2]; // Refine step

      expect(thirdCircle?.classList.contains('pending')).toBe(true);
      expect(thirdCircle?.textContent?.trim()).toBe('3');
    });
  });

  describe('connecting lines', () => {
    it('line after completed step is completed', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'refine'}
          .completedSteps=${['input', 'match']}
        ></tx-progress-stepper>`
      );

      const lines = el.shadowRoot?.querySelectorAll('.connecting-line');
      const linesArray = Array.from(lines || []);

      // First two lines should be completed
      expect(linesArray[0]?.classList.contains('completed')).toBe(true);
      expect(linesArray[1]?.classList.contains('completed')).toBe(true);
    });

    it('line after active step is partially filled', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
        ></tx-progress-stepper>`
      );

      const lines = el.shadowRoot?.querySelectorAll('.connecting-line');
      const linesArray = Array.from(lines || []);

      // Line after current step should be active
      expect(linesArray[1]?.classList.contains('active')).toBe(true);
    });

    it('line after pending step is pending', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'input'}></tx-progress-stepper>`
      );

      const lines = el.shadowRoot?.querySelectorAll('.connecting-line');
      const linesArray = Array.from(lines || []);

      // Last two lines should be pending
      expect(linesArray[1]?.classList.contains('pending')).toBe(true);
      expect(linesArray[2]?.classList.contains('pending')).toBe(true);
    });
  });

  describe('step labels', () => {
    it('active step label is highlighted', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'refine'}></tx-progress-stepper>`
      );

      const labels = el.shadowRoot?.querySelectorAll('.step-label');
      const refineLabel = labels?.[2];

      expect(refineLabel?.classList.contains('active')).toBe(true);
    });

    it('completed step label has completed class', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
        ></tx-progress-stepper>`
      );

      const labels = el.shadowRoot?.querySelectorAll('.step-label');
      const inputLabel = labels?.[0];

      expect(inputLabel?.classList.contains('completed')).toBe(true);
    });

    it('pending step label has pending class', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'input'}></tx-progress-stepper>`
      );

      const labels = el.shadowRoot?.querySelectorAll('.step-label');
      const completeLabel = labels?.[3];

      expect(completeLabel?.classList.contains('pending')).toBe(true);
    });
  });

  describe('interactions', () => {
    it('completed step is clickable', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
          @step-click=${clickHandler}
        ></tx-progress-stepper>`
      );

      const completedCircle = el.shadowRoot?.querySelector('.step-circle.completed');
      (completedCircle as HTMLElement)?.click();

      expect(clickHandler).toHaveBeenCalledTimes(1);
      expect(clickHandler.mock.calls[0][0].detail).toEqual({ stepId: 'input' });
    });

    it('active step is not clickable', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          @step-click=${clickHandler}
        ></tx-progress-stepper>`
      );

      const activeCircle = el.shadowRoot?.querySelector('.step-circle.active');
      (activeCircle as HTMLElement)?.click();

      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('pending step is not clickable', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'input'}
          @step-click=${clickHandler}
        ></tx-progress-stepper>`
      );

      const pendingCircle = el.shadowRoot?.querySelector('.step-circle.pending');
      (pendingCircle as HTMLElement)?.click();

      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('completed step responds to Enter key', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
          @step-click=${clickHandler}
        ></tx-progress-stepper>`
      );

      const completedCircle = el.shadowRoot?.querySelector('.step-circle.completed');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      completedCircle?.dispatchEvent(event);

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('completed step responds to Space key', async () => {
      const clickHandler = vi.fn();
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
          @step-click=${clickHandler}
        ></tx-progress-stepper>`
      );

      const completedCircle = el.shadowRoot?.querySelector('.step-circle.completed');
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      completedCircle?.dispatchEvent(event);

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has progressbar role on container', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const container = el.shadowRoot?.querySelector('[role="progressbar"]');
      expect(container).toBeDefined();
    });

    it('sets aria-valuenow to current step number', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'refine'}></tx-progress-stepper>`
      );

      const container = el.shadowRoot?.querySelector('[role="progressbar"]');
      expect(container?.getAttribute('aria-valuenow')).toBe('3');
    });

    it('sets aria-valuemin and aria-valuemax', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const container = el.shadowRoot?.querySelector('[role="progressbar"]');
      expect(container?.getAttribute('aria-valuemin')).toBe('1');
      expect(container?.getAttribute('aria-valuemax')).toBe('4');
    });

    it('has aria-label on step circles', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const circles = el.shadowRoot?.querySelectorAll('.step-circle');
      circles?.forEach((circle) => {
        expect(circle.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('completed step has tabindex 0', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'match'}
          .completedSteps=${['input']}
        ></tx-progress-stepper>`
      );

      const completedCircle = el.shadowRoot?.querySelector('.step-circle.completed');
      expect(completedCircle?.getAttribute('tabindex')).toBe('0');
    });

    it('non-completed step has tabindex -1', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper></tx-progress-stepper>`
      );

      const activeCircle = el.shadowRoot?.querySelector('.step-circle.active');
      expect(activeCircle?.getAttribute('tabindex')).toBe('-1');
    });

    it('has screen reader announcement region', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'match'}></tx-progress-stepper>`
      );

      const liveRegion = el.shadowRoot?.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeDefined();
      expect(liveRegion?.textContent).toContain('Step 2');
      expect(liveRegion?.textContent).toContain('Match');
    });
  });

  describe('step progression scenarios', () => {
    it('handles all steps completed', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'complete'}
          .completedSteps=${['input', 'match', 'refine', 'complete']}
        ></tx-progress-stepper>`
      );

      const circles = el.shadowRoot?.querySelectorAll('.step-circle');
      circles?.forEach((circle) => {
        expect(circle.classList.contains('completed')).toBe(true);
      });
    });

    it('handles intermediate step', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper
          .currentStep=${'refine'}
          .completedSteps=${['input', 'match']}
        ></tx-progress-stepper>`
      );

      const circles = el.shadowRoot?.querySelectorAll('.step-circle');
      const circlesArray = Array.from(circles || []);

      expect(circlesArray[0]?.classList.contains('completed')).toBe(true);
      expect(circlesArray[1]?.classList.contains('completed')).toBe(true);
      expect(circlesArray[2]?.classList.contains('active')).toBe(true);
      expect(circlesArray[3]?.classList.contains('pending')).toBe(true);
    });
  });

  describe('CSS classes', () => {
    it('active step circle has active class for pulse animation', async () => {
      const el = await fixture<TxProgressStepper>(
        html`<tx-progress-stepper .currentStep=${'match'}></tx-progress-stepper>`
      );

      const activeCircle = el.shadowRoot?.querySelector('.step-circle.active');
      expect(activeCircle).toBeDefined();

      // Check that active class is present (which triggers the pulse animation)
      expect(activeCircle?.classList.contains('active')).toBe(true);
    });
  });
});
