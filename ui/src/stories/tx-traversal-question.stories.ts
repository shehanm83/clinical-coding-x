import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '../components/features/coding/tx-traversal-question.js';
import type { TraversalQuestion } from '../components/features/coding/tx-traversal-question.js';

const meta: Meta = {
  title: 'Features/Coding/TxTraversalQuestion',
  component: 'tx-traversal-question',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Tree traversal question component for navigating the SNOMED hierarchy:

**Question Types:**
1. **Disambiguation** - Choose between child concepts to refine coding
2. **Attribute** - Select attribute values (Severity, Laterality, Clinical course)

**Features:**
- **[SKIP]** - Accept current concept, don't specify further
- **[BACK]** - Go to previous question in navigation stack
- Single-select options from SNOMED (zero hallucination - all options from SNOMED)
- Depth indicator showing current traversal level

Part of the iterative refinement loop architecture where users drill down through
SNOMED hierarchy until they [SKIP] or reach a leaf concept.
        `,
      },
    },
  },
  argTypes: {
    question: {
      description: 'The traversal question to display',
      control: 'object',
    },
    canGoBack: {
      description: 'Whether user can navigate back',
      control: 'boolean',
    },
    depth: {
      description: 'Current traversal depth',
      control: 'number',
    },
    loading: {
      description: 'Whether confirm action is loading',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj;

// Sample disambiguation question
const disambiguationQuestion: TraversalQuestion = {
  id: 'q-chest-pain-1',
  type: 'disambiguation',
  text: 'What type of chest pain is the patient experiencing?',
  options: [
    {
      conceptId: '426396005',
      label: 'Cardiac chest pain',
      description: 'Pain originating from the heart or cardiac structures',
      fsn: 'Cardiac chest pain (finding)',
    },
    {
      conceptId: '10000006',
      label: 'Non-cardiac chest pain',
      description: 'Pain from non-cardiac causes (GERD, musculoskeletal)',
      fsn: 'Non-cardiac chest pain (finding)',
    },
    {
      conceptId: '36349006',
      label: 'Burning chest pain',
      description: 'Chest pain with burning character',
      fsn: 'Burning chest pain (finding)',
    },
    {
      conceptId: '3006004',
      label: 'Pleuritic chest pain',
      description: 'Sharp pain worsening with breathing',
      fsn: 'Pleuritic chest pain (finding)',
    },
  ],
  targetConcept: {
    id: '29857009',
    term: 'Chest pain',
  },
};

// Sample attribute question (Severity)
const severityQuestion: TraversalQuestion = {
  id: 'q-severity-1',
  type: 'attribute',
  text: 'What is the severity of the chest pain?',
  options: [
    {
      conceptId: '255604002',
      label: 'Mild',
      description: 'Low intensity, manageable',
    },
    {
      conceptId: '6736007',
      label: 'Moderate',
      description: 'Medium intensity',
    },
    {
      conceptId: '24484000',
      label: 'Severe',
      description: 'High intensity, significant impact',
    },
  ],
  targetConcept: {
    id: '426396005',
    term: 'Cardiac chest pain',
  },
  attribute: {
    id: '246112005',
    name: 'Severity',
  },
};

// Sample attribute question (Laterality)
const lateralityQuestion: TraversalQuestion = {
  id: 'q-laterality-1',
  type: 'attribute',
  text: 'Which side is the pain on?',
  options: [
    {
      conceptId: '7771000',
      label: 'Left',
      description: 'Left side of the chest',
    },
    {
      conceptId: '24028007',
      label: 'Right',
      description: 'Right side of the chest',
    },
    {
      conceptId: '51440002',
      label: 'Bilateral',
      description: 'Both sides',
    },
  ],
  targetConcept: {
    id: '426396005',
    term: 'Cardiac chest pain',
  },
  attribute: {
    id: '272741003',
    name: 'Laterality',
  },
};

/**
 * Disambiguation question - choosing between child concepts
 */
export const Disambiguation: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-traversal-question
        .question=${disambiguationQuestion}
        .canGoBack=${false}
        .depth=${1}
        @option-select=${(e: CustomEvent) =>
          console.log('Option selected:', e.detail)}
        @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
        @back=${() => console.log('Back clicked')}
      ></tx-traversal-question>
    </div>
  `,
};

/**
 * Severity attribute question
 */
export const AttributeSeverity: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-traversal-question
        .question=${severityQuestion}
        .canGoBack=${true}
        .depth=${2}
        @option-select=${(e: CustomEvent) =>
          console.log('Option selected:', e.detail)}
        @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
        @back=${() => console.log('Back clicked')}
      ></tx-traversal-question>
    </div>
  `,
};

/**
 * Laterality attribute question
 */
export const AttributeLaterality: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-traversal-question
        .question=${lateralityQuestion}
        .canGoBack=${true}
        .depth=${3}
        @option-select=${(e: CustomEvent) =>
          console.log('Option selected:', e.detail)}
        @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
        @back=${() => console.log('Back clicked')}
      ></tx-traversal-question>
    </div>
  `,
};

/**
 * Without back navigation (first question)
 */
export const NoBackNavigation: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-traversal-question
        .question=${disambiguationQuestion}
        .canGoBack=${false}
        .depth=${0}
        @option-select=${(e: CustomEvent) =>
          console.log('Option selected:', e.detail)}
        @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
        @back=${() => console.log('Back clicked')}
      ></tx-traversal-question>
    </div>
  `,
};

/**
 * Deep in traversal (high depth)
 */
export const DeepTraversal: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-traversal-question
        .question=${severityQuestion}
        .canGoBack=${true}
        .depth=${5}
        @option-select=${(e: CustomEvent) =>
          console.log('Option selected:', e.detail)}
        @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
        @back=${() => console.log('Back clicked')}
      ></tx-traversal-question>
    </div>
  `,
};

/**
 * Loading state during confirm
 */
export const Loading: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-traversal-question
        .question=${disambiguationQuestion}
        .canGoBack=${true}
        .depth=${2}
        .loading=${true}
        @option-select=${(e: CustomEvent) =>
          console.log('Option selected:', e.detail)}
        @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
        @back=${() => console.log('Back clicked')}
      ></tx-traversal-question>
    </div>
  `,
};

/**
 * Clinical course attribute question
 */
export const AttributeClinicalCourse: Story = {
  render: () => {
    const clinicalCourseQuestion: TraversalQuestion = {
      id: 'q-course-1',
      type: 'attribute',
      text: 'What is the clinical course?',
      options: [
        {
          conceptId: '373933003',
          label: 'Acute',
          description: 'Sudden onset, short duration',
        },
        {
          conceptId: '90734009',
          label: 'Chronic',
          description: 'Long-standing, persistent',
        },
        {
          conceptId: '7087005',
          label: 'Intermittent',
          description: 'Coming and going',
        },
        {
          conceptId: '255314001',
          label: 'Progressive',
          description: 'Getting worse over time',
        },
      ],
      targetConcept: {
        id: '426396005',
        term: 'Cardiac chest pain',
      },
      attribute: {
        id: '263502005',
        name: 'Clinical course',
      },
    };

    return html`
      <div style="max-width: 600px; padding: 24px;">
        <tx-traversal-question
          .question=${clinicalCourseQuestion}
          .canGoBack=${true}
          .depth=${4}
          @option-select=${(e: CustomEvent) =>
            console.log('Option selected:', e.detail)}
          @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
          @back=${() => console.log('Back clicked')}
        ></tx-traversal-question>
      </div>
    `;
  },
};

/**
 * Many options scenario
 */
export const ManyOptions: Story = {
  render: () => {
    const manyOptionsQuestion: TraversalQuestion = {
      id: 'q-body-site-1',
      type: 'attribute',
      text: 'Where is the pain located?',
      options: [
        { conceptId: '302551006', label: 'Chest wall', description: 'Anterior chest' },
        { conceptId: '62746008', label: 'Sternum', description: 'Breastbone area' },
        { conceptId: '302509004', label: 'Left precordium', description: 'Over heart area' },
        { conceptId: '78904004', label: 'Right chest', description: 'Right hemithorax' },
        { conceptId: '113197003', label: 'Retrosternal', description: 'Behind sternum' },
        { conceptId: '39607008', label: 'Epigastric', description: 'Upper abdomen' },
      ],
      targetConcept: {
        id: '29857009',
        term: 'Chest pain',
      },
      attribute: {
        id: '363698007',
        name: 'Finding site',
      },
    };

    return html`
      <div style="max-width: 600px; padding: 24px;">
        <tx-traversal-question
          .question=${manyOptionsQuestion}
          .canGoBack=${true}
          .depth=${2}
          @option-select=${(e: CustomEvent) =>
            console.log('Option selected:', e.detail)}
          @skip=${(e: CustomEvent) => console.log('Skip clicked:', e.detail)}
          @back=${() => console.log('Back clicked')}
        ></tx-traversal-question>
      </div>
    `;
  },
};
