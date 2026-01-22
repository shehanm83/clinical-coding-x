/**
 * tx-refinement-panel and tx-question-card Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import type { TxRefinementPanel } from '../../../../src/components/features/coding/tx-refinement-panel.js';
import type {
  TxQuestionCard,
  Question,
  QuestionAnswer,
} from '../../../../src/components/features/coding/tx-question-card.js';

// Import components to register them
import '../../../../src/components/features/coding/tx-refinement-panel.js';
import '../../../../src/components/features/coding/tx-question-card.js';

// Test fixtures
const createQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'q_001',
  text: 'How would you describe the severity?',
  attributeId: '246112005',
  attributeName: 'Severity',
  inputType: 'single_select',
  options: [
    { label: 'Mild', value: 'mild', conceptId: '255604002' },
    { label: 'Moderate', value: 'moderate', conceptId: '6736007' },
    { label: 'Severe', value: 'severe', conceptId: '24484000' },
  ],
  required: false,
  relatedTermIndex: 0,
  hint: 'Consider the impact on daily activities',
  relatedTermText: 'Chest pain',
  relatedTermId: '29857009',
  ...overrides,
});

const createMultiSelectQuestion = (): Question => ({
  id: 'q_002',
  text: 'Select all associated symptoms',
  attributeId: '47429007',
  attributeName: 'Associated symptoms',
  inputType: 'multiple_select',
  options: [
    { label: 'Shortness of breath', value: 'dyspnea' },
    { label: 'Nausea', value: 'nausea' },
    { label: 'Sweating', value: 'sweating' },
    { label: 'Dizziness', value: 'dizziness' },
  ],
  required: false,
  relatedTermIndex: 0,
});

const createFreeTextQuestion = (): Question => ({
  id: 'q_003',
  text: 'Any additional notes?',
  attributeId: '48767001',
  attributeName: 'Additional notes',
  inputType: 'free_text',
  options: [],
  required: false,
  relatedTermIndex: 0,
});

const createBooleanQuestion = (): Question => ({
  id: 'q_004',
  text: 'Is the symptom present at rest?',
  attributeId: '364713004',
  attributeName: 'Presence at rest',
  inputType: 'boolean',
  options: [],
  required: false,
  relatedTermIndex: 0,
});

// ============================================================
// tx-question-card Tests
// ============================================================

describe('tx-question-card', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card></tx-question-card>`
      );

      expect(el).toBeDefined();
      expect(el.question).toBeUndefined();
      expect(el.answered).toBe(false);
      expect(el.skipped).toBe(false);
    });

    it('renders nothing when no question provided', async () => {
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card></tx-question-card>`
      );

      const card = el.shadowRoot?.querySelector('.question-card');
      expect(card).toBeNull();
    });

    it('renders question text', async () => {
      const question = createQuestion({ text: 'Test question text' });
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const text = el.shadowRoot?.querySelector('.question-text');
      expect(text?.textContent?.trim()).toBe('Test question text');
    });

    it('renders required badge when required', async () => {
      const question = createQuestion({ required: true });
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const badge = el.shadowRoot?.querySelector('.required-badge');
      expect(badge).toBeDefined();
      expect(badge?.textContent).toBe('Required');
    });

    it('does not render required badge when not required', async () => {
      const question = createQuestion({ required: false });
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const badge = el.shadowRoot?.querySelector('.required-badge');
      expect(badge).toBeNull();
    });

    it('renders related term info', async () => {
      const question = createQuestion({
        relatedTermText: 'Test Term',
        relatedTermId: '12345',
      });
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const relatedTerm = el.shadowRoot?.querySelector('.related-term');
      expect(relatedTerm?.textContent).toContain('Test Term');
      expect(relatedTerm?.textContent).toContain('12345');
    });

    it('renders hint when provided', async () => {
      const question = createQuestion({ hint: 'This is a helpful hint' });
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const hint = el.shadowRoot?.querySelector('.hint');
      expect(hint?.textContent).toContain('This is a helpful hint');
    });
  });

  describe('single select', () => {
    it('renders radio buttons for options', async () => {
      const question = createQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const radios = el.shadowRoot?.querySelectorAll('input[type="radio"]');
      expect(radios?.length).toBe(3);
    });

    it('renders option labels', async () => {
      const question = createQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const labels = el.shadowRoot?.querySelectorAll('.option-label');
      expect(labels?.[0]?.textContent).toBe('Mild');
      expect(labels?.[1]?.textContent).toBe('Moderate');
      expect(labels?.[2]?.textContent).toBe('Severe');
    });

    it('marks selected option', async () => {
      const question = createQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      // Click first option
      const options = el.shadowRoot?.querySelectorAll('.option-item');
      (options?.[0] as HTMLElement)?.click();
      await el.updateComplete;

      expect(options?.[0]?.classList.contains('selected')).toBe(true);
    });

    it('dispatches answer event with correct data', async () => {
      const question = createQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      // Select option
      const options = el.shadowRoot?.querySelectorAll('.option-item');
      (options?.[1] as HTMLElement)?.click();
      await el.updateComplete;

      // Submit
      const listener = oneEvent(el, 'answer');
      const submitBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="primary"]'
      ) as HTMLElement;
      submitBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({
        questionId: 'q_001',
        value: 'moderate',
        conceptId: '6736007',
      });
    });
  });

  describe('multiple select', () => {
    it('renders checkboxes for options', async () => {
      const question = createMultiSelectQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const checkboxes = el.shadowRoot?.querySelectorAll(
        'input[type="checkbox"]'
      );
      expect(checkboxes?.length).toBe(4);
    });

    it('allows multiple selections', async () => {
      const question = createMultiSelectQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      // Select multiple options
      const checkboxes = el.shadowRoot?.querySelectorAll(
        'input[type="checkbox"]'
      );
      (checkboxes?.[0] as HTMLInputElement).click();
      (checkboxes?.[2] as HTMLInputElement).click();
      await el.updateComplete;

      const selectedOptions = el.shadowRoot?.querySelectorAll(
        '.option-item.selected'
      );
      expect(selectedOptions?.length).toBe(2);
    });

    it('dispatches answer with array of values', async () => {
      const question = createMultiSelectQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      // Select options
      const checkboxes = el.shadowRoot?.querySelectorAll(
        'input[type="checkbox"]'
      );
      (checkboxes?.[0] as HTMLInputElement).click();
      (checkboxes?.[1] as HTMLInputElement).click();
      await el.updateComplete;

      // Submit
      const listener = oneEvent(el, 'answer');
      const submitBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="primary"]'
      ) as HTMLElement;
      submitBtn?.click();

      const event = await listener;
      expect(event.detail.value).toEqual(['dyspnea', 'nausea']);
    });
  });

  describe('free text', () => {
    it('renders textarea for free text', async () => {
      const question = createFreeTextQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const textarea = el.shadowRoot?.querySelector('tx-textarea');
      expect(textarea).toBeDefined();
    });

    it('enables submit when text entered', async () => {
      const question = createFreeTextQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      // Initially disabled
      let submitBtn = el.shadowRoot?.querySelector('tx-button[variant="primary"]');
      expect(submitBtn?.hasAttribute('disabled')).toBe(true);

      // Simulate text input by triggering the event
      const textarea = el.shadowRoot?.querySelector('tx-textarea');
      textarea?.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: 'Some text' },
          bubbles: true,
          composed: true,
        })
      );
      await el.updateComplete;

      submitBtn = el.shadowRoot?.querySelector('tx-button[variant="primary"]');
      expect(submitBtn?.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('boolean', () => {
    it('renders Yes/No buttons', async () => {
      const question = createBooleanQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('.boolean-btn');
      expect(buttons?.length).toBe(2);
      expect(buttons?.[0]?.textContent?.trim()).toBe('Yes');
      expect(buttons?.[1]?.textContent?.trim()).toBe('No');
    });

    it('auto-submits on Yes click', async () => {
      const question = createBooleanQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const listener = oneEvent(el, 'answer');

      const yesBtn = el.shadowRoot?.querySelector('.boolean-btn.yes') as HTMLElement;
      yesBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({
        questionId: 'q_004',
        value: 'yes',
        conceptId: undefined,
      });
    });

    it('auto-submits on No click', async () => {
      const question = createBooleanQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const listener = oneEvent(el, 'answer');

      const noBtn = el.shadowRoot?.querySelector('.boolean-btn.no') as HTMLElement;
      noBtn?.click();

      const event = await listener;
      expect(event.detail.value).toBe('no');
    });
  });

  describe('skip functionality', () => {
    it('shows skip button for non-required questions', async () => {
      const question = createQuestion({ required: false });
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const skipBtn = el.shadowRoot?.querySelector('tx-button[variant="secondary"]');
      expect(skipBtn?.textContent?.trim()).toBe('Skip');
    });

    it('hides skip button for required questions', async () => {
      const question = createQuestion({ required: true });
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const skipBtn = el.shadowRoot?.querySelector('tx-button[variant="secondary"]');
      expect(skipBtn).toBeNull();
    });

    it('dispatches skip event', async () => {
      const question = createQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card .question=${question}></tx-question-card>`
      );

      const listener = oneEvent(el, 'skip');

      const skipBtn = el.shadowRoot?.querySelector(
        'tx-button[variant="secondary"]'
      ) as HTMLElement;
      skipBtn?.click();

      const event = await listener;
      expect(event.detail).toEqual({ questionId: 'q_001' });
    });
  });

  describe('answered state', () => {
    it('shows collapsed answered state', async () => {
      const question = createQuestion();
      const answer: QuestionAnswer = {
        questionId: 'q_001',
        value: 'moderate',
        conceptId: '6736007',
      };

      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card
          .question=${question}
          ?answered=${true}
          .submittedAnswer=${answer}
        ></tx-question-card>`
      );

      const summary = el.shadowRoot?.querySelector('.answered-summary');
      expect(summary).toBeDefined();

      const answerValue = el.shadowRoot?.querySelector('.answer-value');
      expect(answerValue?.textContent).toBe('Moderate');
    });

    it('shows edit button in answered state', async () => {
      const question = createQuestion();
      const answer: QuestionAnswer = {
        questionId: 'q_001',
        value: 'mild',
      };

      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card
          .question=${question}
          ?answered=${true}
          .submittedAnswer=${answer}
        ></tx-question-card>`
      );

      const editLink = el.shadowRoot?.querySelector('.edit-link');
      expect(editLink?.textContent).toBe('Edit');
    });
  });

  describe('skipped state', () => {
    it('shows skipped state', async () => {
      const question = createQuestion();
      const el = await fixture<TxQuestionCard>(
        html`<tx-question-card
          .question=${question}
          ?skipped=${true}
        ></tx-question-card>`
      );

      const skippedLabel = el.shadowRoot?.querySelector('.skipped-label');
      expect(skippedLabel?.textContent).toBe('Skipped');
    });
  });
});

// ============================================================
// tx-refinement-panel Tests
// ============================================================

describe('tx-refinement-panel', () => {
  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel></tx-refinement-panel>`
      );

      expect(el).toBeDefined();
      expect(el.questions).toEqual([]);
      expect(el.answeredQuestions).toEqual([]);
    });

    it('renders panel title', async () => {
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel></tx-refinement-panel>`
      );

      const title = el.shadowRoot?.querySelector('.panel-title');
      expect(title?.textContent).toBe('Clarifying Questions');
    });

    it('shows question count badge', async () => {
      const questions = [createQuestion(), createQuestion({ id: 'q_002' })];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      const badge = el.shadowRoot?.querySelector('.question-count');
      expect(badge?.textContent).toBe('2');
    });
  });

  describe('progress tracking', () => {
    it('shows progress bar', async () => {
      const questions = [createQuestion()];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      const progressBar = el.shadowRoot?.querySelector('.progress-bar');
      expect(progressBar).toBeDefined();
    });

    it('calculates progress correctly', async () => {
      const questions = [createQuestion()];
      const answeredQuestions = [
        { question: createQuestion({ id: 'q_002' }), skipped: false },
      ];

      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .questions=${questions}
          .answeredQuestions=${answeredQuestions}
        ></tx-refinement-panel>`
      );

      const progressCount = el.shadowRoot?.querySelector('.progress-count');
      expect(progressCount?.textContent).toBe('1 of 2 answered');
    });

    it('shows 50% progress fill', async () => {
      const questions = [createQuestion()];
      const answeredQuestions = [
        { question: createQuestion({ id: 'q_002' }), skipped: false },
      ];

      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .questions=${questions}
          .answeredQuestions=${answeredQuestions}
        ></tx-refinement-panel>`
      );

      const fill = el.shadowRoot?.querySelector('.progress-fill') as HTMLElement;
      expect(fill?.style.width).toBe('50%');
    });
  });

  describe('view modes', () => {
    it('shows view toggle buttons', async () => {
      const questions = [createQuestion(), createQuestion({ id: 'q_002' })];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      const toggleBtns = el.shadowRoot?.querySelectorAll('.view-toggle-btn');
      expect(toggleBtns?.length).toBe(2);
    });

    it('defaults to single view', async () => {
      const questions = [createQuestion(), createQuestion({ id: 'q_002' })];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      // Only one question card should be visible
      const cards = el.shadowRoot?.querySelectorAll('tx-question-card');
      expect(cards?.length).toBe(1);
    });

    it('shows all questions in "all" view', async () => {
      const questions = [
        createQuestion(),
        createQuestion({ id: 'q_002' }),
        createQuestion({ id: 'q_003' }),
      ];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      // Switch to all view
      const allBtn = el.shadowRoot?.querySelectorAll('.view-toggle-btn')[1] as HTMLElement;
      allBtn?.click();
      await el.updateComplete;

      const cards = el.shadowRoot?.querySelectorAll('tx-question-card');
      expect(cards?.length).toBe(3);
    });
  });

  describe('navigation', () => {
    it('shows navigation in single view with multiple questions', async () => {
      const questions = [createQuestion(), createQuestion({ id: 'q_002' })];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      const nav = el.shadowRoot?.querySelector('.question-navigation');
      expect(nav).toBeDefined();
    });

    it('shows question number info', async () => {
      const questions = [createQuestion(), createQuestion({ id: 'q_002' })];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      const navInfo = el.shadowRoot?.querySelector('.nav-info');
      expect(navInfo?.textContent?.trim()).toBe('Question 1 of 2');
    });

    it('disables previous button on first question', async () => {
      const questions = [createQuestion(), createQuestion({ id: 'q_002' })];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      const prevBtn = el.shadowRoot?.querySelector('.nav-buttons tx-button:first-child');
      expect(prevBtn?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('skip all', () => {
    it('shows skip all button', async () => {
      const questions = [createQuestion()];
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel .questions=${questions}></tx-refinement-panel>`
      );

      const skipAllBtn = el.shadowRoot?.querySelector('.skip-all-btn');
      expect(skipAllBtn?.textContent?.trim()).toContain('Skip All');
    });

    it('dispatches skip events for all questions', async () => {
      const questions = [
        createQuestion({ id: 'q_001' }),
        createQuestion({ id: 'q_002' }),
      ];

      const skipHandler = vi.fn();
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .questions=${questions}
          @skip=${skipHandler}
        ></tx-refinement-panel>`
      );

      const skipAllBtn = el.shadowRoot?.querySelector('.skip-all-btn') as HTMLElement;
      skipAllBtn?.click();

      expect(skipHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('completed section', () => {
    it('shows completed section when has answered questions', async () => {
      const answeredQuestions = [
        { question: createQuestion(), skipped: false },
      ];

      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .answeredQuestions=${answeredQuestions}
        ></tx-refinement-panel>`
      );

      const completedSection = el.shadowRoot?.querySelector('.completed-section');
      expect(completedSection).toBeDefined();
    });

    it('toggles completed section visibility', async () => {
      const answeredQuestions = [
        { question: createQuestion(), skipped: false },
      ];

      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .answeredQuestions=${answeredQuestions}
        ></tx-refinement-panel>`
      );

      // Initially collapsed
      let list = el.shadowRoot?.querySelector('.completed-list');
      expect(list).toBeNull();

      // Click to expand
      const header = el.shadowRoot?.querySelector('.completed-header') as HTMLElement;
      header?.click();
      await el.updateComplete;

      list = el.shadowRoot?.querySelector('.completed-list');
      expect(list).toBeDefined();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no questions', async () => {
      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel></tx-refinement-panel>`
      );

      const emptyState = el.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('No Questions');
    });
  });

  describe('all complete state', () => {
    it('shows all complete state when all answered', async () => {
      const answeredQuestions = [
        { question: createQuestion(), skipped: false },
      ];

      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .questions=${[]}
          .answeredQuestions=${answeredQuestions}
        ></tx-refinement-panel>`
      );

      const allComplete = el.shadowRoot?.querySelector('.all-complete');
      expect(allComplete).toBeDefined();
      expect(allComplete?.textContent).toContain('All Questions Answered');
    });
  });

  describe('event handling', () => {
    it('forwards answer events', async () => {
      const questions = [createQuestion()];
      const answerHandler = vi.fn();

      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .questions=${questions}
          @answer=${answerHandler}
        ></tx-refinement-panel>`
      );

      // Simulate answer from question card
      const questionCard = el.shadowRoot?.querySelector('tx-question-card');
      questionCard?.dispatchEvent(
        new CustomEvent('answer', {
          detail: { questionId: 'q_001', value: 'mild' },
          bubbles: true,
          composed: true,
        })
      );

      expect(answerHandler).toHaveBeenCalled();
    });

    it('forwards skip events', async () => {
      const questions = [createQuestion()];
      const skipHandler = vi.fn();

      const el = await fixture<TxRefinementPanel>(
        html`<tx-refinement-panel
          .questions=${questions}
          @skip=${skipHandler}
        ></tx-refinement-panel>`
      );

      // Simulate skip from question card
      const questionCard = el.shadowRoot?.querySelector('tx-question-card');
      questionCard?.dispatchEvent(
        new CustomEvent('skip', {
          detail: { questionId: 'q_001' },
          bubbles: true,
          composed: true,
        })
      );

      expect(skipHandler).toHaveBeenCalled();
    });
  });
});
