/**
 * tx-concept-selector Storybook Stories
 *
 * Modal component for selecting SNOMED CT concepts.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { action } from '@storybook/addon-actions';

import '../components/features/coding/tx-concept-selector.js';
import type {
  TxConceptSelector,
  ExtractedTerm,
  ConceptMatch,
  ConceptExplanation,
} from '../components/features/coding/tx-concept-selector.js';

// Sample data
const sampleTerm: ExtractedTerm = {
  text: 'chest pain',
  type: 'finding',
};

const sampleMatches: ConceptMatch[] = [
  {
    id: '29857009',
    term: 'Chest pain',
    fsn: 'Chest pain (finding)',
    semanticTag: 'finding',
    similarity: 95,
  },
  {
    id: '274668005',
    term: 'Acute chest pain',
    fsn: 'Acute chest pain (finding)',
    semanticTag: 'finding',
    similarity: 89,
  },
  {
    id: '8071008',
    term: 'Chest wall pain',
    fsn: 'Chest wall pain (finding)',
    semanticTag: 'finding',
    similarity: 76,
  },
  {
    id: '102612008',
    term: 'Pleuritic chest pain',
    fsn: 'Pleuritic chest pain (finding)',
    semanticTag: 'finding',
    similarity: 72,
  },
];

const sampleSearchResults: ConceptMatch[] = [
  {
    id: '426396005',
    term: 'Cardiac chest pain',
    fsn: 'Cardiac chest pain (finding)',
    semanticTag: 'finding',
    similarity: 82,
  },
  {
    id: '102614009',
    term: 'Substernal chest pain',
    fsn: 'Substernal chest pain (finding)',
    semanticTag: 'finding',
    similarity: 78,
  },
];

const sampleExplanations: Record<string, ConceptExplanation> = {
  '29857009': {
    conceptId: '29857009',
    explanation:
      'This is the most general concept for chest pain. It matches the input text directly without additional qualifiers.',
    differentiatingFactors: [
      'Direct match to "chest pain" term',
      'Most commonly used general concept',
      'Parent concept for more specific chest pain types',
    ],
  },
  '274668005': {
    conceptId: '274668005',
    explanation:
      'This concept includes the "acute" qualifier, which may or may not apply to the clinical context.',
    differentiatingFactors: [
      'Includes temporal qualifier "acute"',
      'Use when onset is recent/sudden',
      'More specific than general chest pain',
    ],
  },
  '8071008': {
    conceptId: '8071008',
    explanation:
      'This concept specifies pain localized to the chest wall structures.',
    differentiatingFactors: [
      'Specifies chest wall as finding site',
      'Use for musculoskeletal chest pain',
      'Excludes cardiac or pleuritic causes',
    ],
  },
};

const meta: Meta<TxConceptSelector> = {
  title: 'Features/Coding/ConceptSelector',
  component: 'tx-concept-selector',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A modal dialog for selecting SNOMED CT concepts when multiple matches exist.

## Features
- Displays concept matches with similarity scores
- Search input for finding alternative concepts (300ms debounce)
- Keyboard navigation (arrows, Enter, Escape, /)
- "No good match" skip option
- Expandable explanations for each concept
- Focus trap within modal

## Usage
\`\`\`html
<tx-concept-selector
  .open=\${true}
  .term=\${{ text: 'chest pain', type: 'finding' }}
  .conceptMatches=\${conceptMatches}
  .explanations=\${explanationMap}
  @select=\${this.handleSelect}
  @search=\${this.handleSearch}
  @skip=\${this.handleSkip}
  @close=\${this.handleClose}
></tx-concept-selector>
\`\`\`

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| \`↑\` / \`↓\` | Navigate options |
| \`Enter\` | Select highlighted option |
| \`Escape\` | Close modal |
| \`/\` | Focus search input |
        `,
      },
    },
  },
  argTypes: {
    open: {
      description: 'Whether the modal is open',
      control: { type: 'boolean' },
    },
    term: {
      description: 'The term being matched',
      control: { type: 'object' },
    },
    conceptMatches: {
      description: 'Array of concept matches',
      control: { type: 'object' },
    },
    searchResults: {
      description: 'Search results from API',
      control: { type: 'object' },
    },
    explanations: {
      description: 'Explanations keyed by concept ID',
      control: { type: 'object' },
    },
    loading: {
      description: 'Loading state for search',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<TxConceptSelector>;

// ===== DEFAULT / MULTIPLE MATCHES =====

export const MultipleMatches: Story = {
  name: 'Multiple Matches',
  args: {
    open: true,
    term: sampleTerm,
    conceptMatches: sampleMatches,
    searchResults: [],
    explanations: {},
    loading: false,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
};

// ===== WITH SEARCH RESULTS =====

export const WithSearchResults: Story = {
  name: 'With Search Results',
  args: {
    open: true,
    term: sampleTerm,
    matches: sampleMatches.slice(0, 2),
    searchResults: sampleSearchResults,
    explanations: {},
    loading: false,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Shows both suggested matches and additional search results from an API call.',
      },
    },
  },
};

// ===== WITH EXPLANATIONS =====

export const WithExplanations: Story = {
  name: 'With Explanations',
  args: {
    open: true,
    term: sampleTerm,
    matches: sampleMatches.slice(0, 3),
    searchResults: [],
    explanations: sampleExplanations,
    loading: false,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Includes expandable explanations for each concept from the clarify tool.',
      },
    },
  },
};

// ===== LOADING STATE =====

export const Loading: Story = {
  name: 'Loading State',
  args: {
    open: true,
    term: sampleTerm,
    matches: sampleMatches.slice(0, 2),
    searchResults: [],
    explanations: {},
    loading: true,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading indicator during search.',
      },
    },
  },
};

// ===== NO MATCHES =====

export const NoMatches: Story = {
  name: 'No Matches',
  args: {
    open: true,
    term: { text: 'unusual symptom', type: 'finding' } as ExtractedTerm,
    matches: [],
    searchResults: [],
    explanations: {},
    loading: false,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Empty state when no matches are found. User can search for alternatives.',
      },
    },
  },
};

// ===== LOW CONFIDENCE MATCHES =====

export const LowConfidenceMatches: Story = {
  name: 'Low Confidence Matches',
  args: {
    open: true,
    term: { text: 'vague discomfort', type: 'finding' } as ExtractedTerm,
    matches: [
      {
        id: '367391008',
        term: 'Malaise',
        fsn: 'Malaise (finding)',
        semanticTag: 'finding',
        similarity: 52,
      },
      {
        id: '22253000',
        term: 'Pain',
        fsn: 'Pain (finding)',
        semanticTag: 'finding',
        similarity: 45,
      },
      {
        id: '279001004',
        term: 'Discomfort',
        fsn: 'Discomfort (finding)',
        semanticTag: 'finding',
        similarity: 58,
      },
    ],
    searchResults: [],
    explanations: {},
    loading: false,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Shows matches with low similarity scores (red badges).',
      },
    },
  },
};

// ===== BODY SITE TERM =====

export const BodySiteTerm: Story = {
  name: 'Body Site Term',
  args: {
    open: true,
    term: { text: 'left arm', type: 'body_site' } as ExtractedTerm,
    matches: [
      {
        id: '368208006',
        term: 'Left upper arm structure',
        fsn: 'Left upper arm structure (body structure)',
        semanticTag: 'body structure',
        similarity: 92,
      },
      {
        id: '40983000',
        term: 'Structure of arm',
        fsn: 'Structure of arm (body structure)',
        semanticTag: 'body structure',
        similarity: 78,
      },
      {
        id: '66480008',
        term: 'Structure of left forearm',
        fsn: 'Structure of left forearm (body structure)',
        semanticTag: 'body structure',
        similarity: 72,
      },
    ],
    searchResults: [],
    explanations: {},
    loading: false,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Selecting a body site concept.',
      },
    },
  },
};

// ===== PROCEDURE TERM =====

export const ProcedureTerm: Story = {
  name: 'Procedure Term',
  args: {
    open: true,
    term: { text: 'ECG', type: 'procedure' } as ExtractedTerm,
    matches: [
      {
        id: '29303009',
        term: 'Electrocardiographic procedure',
        fsn: 'Electrocardiographic procedure (procedure)',
        semanticTag: 'procedure',
        similarity: 96,
      },
      {
        id: '164847006',
        term: '12 lead ECG',
        fsn: '12 lead electrocardiogram (procedure)',
        semanticTag: 'procedure',
        similarity: 88,
      },
    ],
    searchResults: [],
    explanations: {},
    loading: false,
  },
  render: (args) => html`
    <tx-concept-selector
      ?open=${args.open}
      .term=${args.term}
      .conceptMatches=${args.conceptMatches}
      .searchResults=${args.searchResults}
      .explanations=${args.explanations}
      ?loading=${args.loading}
      @select=${action('select')}
      @search=${action('search')}
      @skip=${action('skip')}
      @close=${action('close')}
    ></tx-concept-selector>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Selecting a procedure concept.',
      },
    },
  },
};

// ===== INTERACTIVE DEMO =====

export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  render: () => {
    // This story demonstrates the component with simulated interactions
    return html`
      <div style="padding: 20px;">
        <p style="margin-bottom: 16px;">
          Click the button to open the concept selector modal.
        </p>
        <tx-button
          variant="primary"
          @click=${(e: Event) => {
            const modal = (e.target as HTMLElement)
              .closest('div')
              ?.querySelector('tx-concept-selector');
            if (modal) {
              modal.open = true;
            }
          }}
        >
          Select Concept for "chest pain"
        </tx-button>

        <tx-concept-selector
          .term=${sampleTerm}
          .conceptMatches=${sampleMatches}
          .explanations=${sampleExplanations}
          @select=${(e: CustomEvent) => {
            action('select')(e);
            alert(`Selected concept: ${e.detail.conceptId}`);
          }}
          @search=${action('search')}
          @skip=${(e: Event) => {
            action('skip')(e);
            alert('Term skipped');
          }}
          @close=${action('close')}
        ></tx-concept-selector>
      </div>
    `;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing how the modal opens and responds to user actions.',
      },
    },
  },
};
