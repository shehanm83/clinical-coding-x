/**
 * tx-refinement-panel Storybook Stories
 *
 * Panel component for displaying clarifying questions.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { action } from '@storybook/addon-actions';

import '../components/features/coding/tx-refinement-panel.js';
import '../components/features/coding/tx-question-card.js';
import type { TxRefinementPanel } from '../components/features/coding/tx-refinement-panel.js';
import type { Question, QuestionAnswer } from '../components/features/coding/tx-question-card.js';

// Sample questions data
const singleSelectQuestion: Question = {
  id: 'q_severity_001',
  text: 'How would you describe the severity of the chest pain?',
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
  hint: 'Consider the impact on daily activities and pain scale 1-10',
  relatedTermText: 'Chest pain',
  relatedTermId: '29857009',
};

const multiSelectQuestion: Question = {
  id: 'q_symptoms_002',
  text: 'Select all associated symptoms that were present',
  attributeId: '47429007',
  attributeName: 'Associated symptoms',
  inputType: 'multiple_select',
  options: [
    { label: 'Shortness of breath', value: 'dyspnea', conceptId: '267036007' },
    { label: 'Nausea', value: 'nausea', conceptId: '422587007' },
    { label: 'Sweating', value: 'sweating', conceptId: '415690000' },
    { label: 'Dizziness', value: 'dizziness', conceptId: '404640003' },
  ],
  required: false,
  relatedTermIndex: 0,
  relatedTermText: 'Chest pain',
  relatedTermId: '29857009',
};

const booleanQuestion: Question = {
  id: 'q_rest_003',
  text: 'Is the symptom present at rest?',
  attributeId: '364713004',
  attributeName: 'Presence at rest',
  inputType: 'boolean',
  options: [],
  required: false,
  relatedTermIndex: 0,
  relatedTermText: 'Chest pain',
  relatedTermId: '29857009',
};

const freeTextQuestion: Question = {
  id: 'q_notes_004',
  text: 'Any additional clinical notes about the presentation?',
  attributeId: '48767001',
  attributeName: 'Additional notes',
  inputType: 'free_text',
  options: [],
  required: false,
  relatedTermIndex: 0,
  hint: 'Include any relevant clinical context not captured above',
};

const requiredQuestion: Question = {
  id: 'q_site_005',
  text: 'Where exactly is the pain located?',
  attributeId: '363698007',
  attributeName: 'Finding site',
  inputType: 'single_select',
  options: [
    { label: 'Central chest', value: 'central', conceptId: '302509004' },
    { label: 'Left side of chest', value: 'left', conceptId: '63698009' },
    { label: 'Right side of chest', value: 'right', conceptId: '24028007' },
  ],
  required: true,
  relatedTermIndex: 0,
  relatedTermText: 'Chest pain',
  relatedTermId: '29857009',
};

const allQuestions = [
  singleSelectQuestion,
  multiSelectQuestion,
  booleanQuestion,
  freeTextQuestion,
];

// Sample answered questions
const answeredQuestions = [
  {
    question: {
      ...singleSelectQuestion,
      id: 'q_answered_001',
    },
    answer: {
      questionId: 'q_answered_001',
      value: 'moderate',
      conceptId: '6736007',
    } as QuestionAnswer,
    skipped: false,
  },
  {
    question: {
      ...booleanQuestion,
      id: 'q_answered_002',
    },
    answer: {
      questionId: 'q_answered_002',
      value: 'yes',
    } as QuestionAnswer,
    skipped: false,
  },
];

const meta: Meta<TxRefinementPanel> = {
  title: 'Features/Coding/RefinementPanel',
  component: 'tx-refinement-panel',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A panel component for displaying and managing clarifying questions to refine clinical expressions.

## Features
- Displays questions one at a time or all at once (toggle view)
- Progress indicator showing completion status
- Support for multiple question types: single select, multiple select, boolean, free text
- Skip functionality for optional questions
- Collapsible "Already answered" section
- Navigation between questions in single view mode

## Question Types
| Type | UI Element | Behavior |
|------|------------|----------|
| Single Select | Radio buttons | Select one option |
| Multiple Select | Checkboxes | Select multiple options |
| Boolean | Yes/No buttons | Auto-submits on click |
| Free Text | Textarea | Manual submit |

## Usage
\`\`\`html
<tx-refinement-panel
  .questions=\${this.pendingQuestions}
  .answeredQuestions=\${this.answeredQuestions}
  @answer=\${this.handleAnswer}
  @skip=\${this.handleSkip}
></tx-refinement-panel>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    questions: {
      description: 'Array of pending questions',
      control: { type: 'object' },
    },
    answeredQuestions: {
      description: 'Array of already answered questions',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<TxRefinementPanel>;

// ===== DEFAULT / MULTIPLE QUESTIONS =====

export const MultipleQuestions: Story = {
  name: 'Multiple Questions',
  args: {
    questions: allQuestions,
    answeredQuestions: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
        @complete=${action('complete')}
      ></tx-refinement-panel>
    </div>
  `,
};

// ===== SINGLE SELECT ONLY =====

export const SingleSelectQuestion: Story = {
  name: 'Single Select Question',
  args: {
    questions: [singleSelectQuestion],
    answeredQuestions: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A panel with a single select (radio button) question.',
      },
    },
  },
};

// ===== MULTIPLE SELECT =====

export const MultipleSelectQuestion: Story = {
  name: 'Multiple Select Question',
  args: {
    questions: [multiSelectQuestion],
    answeredQuestions: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A panel with a multiple select (checkbox) question.',
      },
    },
  },
};

// ===== BOOLEAN =====

export const BooleanQuestion: Story = {
  name: 'Boolean Question',
  args: {
    questions: [booleanQuestion],
    answeredQuestions: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A panel with a Yes/No boolean question. Auto-submits on selection.',
      },
    },
  },
};

// ===== FREE TEXT =====

export const FreeTextQuestion: Story = {
  name: 'Free Text Question',
  args: {
    questions: [freeTextQuestion],
    answeredQuestions: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A panel with a free text input question.',
      },
    },
  },
};

// ===== REQUIRED QUESTION =====

export const RequiredQuestion: Story = {
  name: 'Required Question',
  args: {
    questions: [requiredQuestion],
    answeredQuestions: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A required question that cannot be skipped.',
      },
    },
  },
};

// ===== WITH PROGRESS =====

export const WithProgress: Story = {
  name: 'With Progress',
  args: {
    questions: [singleSelectQuestion, booleanQuestion],
    answeredQuestions: answeredQuestions,
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Shows progress bar with some questions already answered. Expand the "Already answered" section to see completed questions.',
      },
    },
  },
};

// ===== ALL ANSWERED =====

export const AllAnswered: Story = {
  name: 'All Answered',
  args: {
    questions: [],
    answeredQuestions: answeredQuestions,
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'All questions have been answered. Shows completion message.',
      },
    },
  },
};

// ===== EMPTY STATE =====

export const Empty: Story = {
  name: 'Empty State',
  args: {
    questions: [],
    answeredQuestions: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-refinement-panel
        .questions=${args.questions}
        .answeredQuestions=${args.answeredQuestions}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-refinement-panel>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'No questions available.',
      },
    },
  },
};

// ===== QUESTION CARD STANDALONE =====

export const QuestionCardStandalone: Story = {
  name: 'Question Card (Standalone)',
  render: () => html`
    <div style="max-width: 600px; display: flex; flex-direction: column; gap: 16px;">
      <h3>Single Select</h3>
      <tx-question-card
        .question=${singleSelectQuestion}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-question-card>

      <h3>Multiple Select</h3>
      <tx-question-card
        .question=${multiSelectQuestion}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-question-card>

      <h3>Boolean</h3>
      <tx-question-card
        .question=${booleanQuestion}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-question-card>

      <h3>Free Text</h3>
      <tx-question-card
        .question=${freeTextQuestion}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-question-card>

      <h3>Required</h3>
      <tx-question-card
        .question=${requiredQuestion}
        @answer=${action('answer')}
        @skip=${action('skip')}
      ></tx-question-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Individual question cards showing all question types outside the panel.',
      },
    },
  },
};

// ===== ANSWERED CARD STATES =====

export const AnsweredCardStates: Story = {
  name: 'Answered Card States',
  render: () => html`
    <div style="max-width: 600px; display: flex; flex-direction: column; gap: 16px;">
      <h3>Answered (Single Select)</h3>
      <tx-question-card
        .question=${singleSelectQuestion}
        ?answered=${true}
        .submittedAnswer=${{
          questionId: singleSelectQuestion.id,
          value: 'moderate',
          conceptId: '6736007',
        }}
        @edit=${action('edit')}
      ></tx-question-card>

      <h3>Answered (Multiple Select)</h3>
      <tx-question-card
        .question=${multiSelectQuestion}
        ?answered=${true}
        .submittedAnswer=${{
          questionId: multiSelectQuestion.id,
          value: ['dyspnea', 'sweating'],
        }}
        @edit=${action('edit')}
      ></tx-question-card>

      <h3>Answered (Boolean - Yes)</h3>
      <tx-question-card
        .question=${booleanQuestion}
        ?answered=${true}
        .submittedAnswer=${{
          questionId: booleanQuestion.id,
          value: 'yes',
        }}
        @edit=${action('edit')}
      ></tx-question-card>

      <h3>Skipped</h3>
      <tx-question-card
        .question=${freeTextQuestion}
        ?skipped=${true}
        @edit=${action('edit')}
      ></tx-question-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Question cards in their answered and skipped collapsed states.',
      },
    },
  },
};
