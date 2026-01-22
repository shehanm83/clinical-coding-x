import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '../components/features/coding/tx-two-tier-results.js';
import type {
  ValidatedMatch,
  RelatedConcept,
} from '../components/features/coding/tx-two-tier-results.js';

const meta: Meta = {
  title: 'Features/Coding/TxTwoTierResults',
  component: 'tx-two-tier-results',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Two-tier results display component showing:
1. **Direct Matches** - Primary validated results from synonym lookup, exact match, and lexical search (90-100% confidence)
2. **Related Concepts** - Suggestions from embedding search based on medical literature patterns (≤80% confidence)

Based on the zero-hallucination architecture where:
- Direct matches are clinically validated and selectable
- Related concepts are suggestions that require verification
- Embeddings add clinical discovery value (differential diagnosis hints)
        `,
      },
    },
  },
  argTypes: {
    validatedMatches: {
      description: 'Array of validated matches from direct lookup',
      control: 'object',
    },
    relatedConcepts: {
      description: 'Array of related concepts from embedding search',
      control: 'object',
    },
    selectedId: {
      description: 'Currently selected concept ID',
      control: 'text',
    },
    termText: {
      description: 'Original term being searched',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj;

// Sample data
const sampleValidatedMatches: ValidatedMatch[] = [
  {
    conceptId: '29857009',
    term: 'Chest pain',
    fsn: 'Chest pain (finding)',
    confidence: 1.0,
    source: 'exact_match',
    semanticTag: 'finding',
    clinicallyValidated: true,
  },
  {
    conceptId: '36349006',
    term: 'Burning chest pain',
    fsn: 'Burning chest pain (finding)',
    confidence: 0.95,
    source: 'lexical_match',
    semanticTag: 'finding',
    clinicallyValidated: true,
  },
];

const sampleRelatedConcepts: RelatedConcept[] = [
  {
    conceptId: '426396005',
    term: 'Cardiac chest pain',
    fsn: 'Cardiac chest pain (finding)',
    similarity: 0.56,
    source: 'embedding_search',
    clinicalHint: 'Consider when cardiac origin suspected',
    isSuggestion: true,
    clinicallyValidated: false,
    semanticTag: 'finding',
  },
  {
    conceptId: '10000006',
    term: 'Non-cardiac chest pain',
    fsn: 'Non-cardiac chest pain (finding)',
    similarity: 0.52,
    source: 'embedding_search',
    clinicalHint: 'Consider for GERD, musculoskeletal causes',
    isSuggestion: true,
    clinicallyValidated: false,
    semanticTag: 'finding',
  },
  {
    conceptId: '3006004',
    term: 'Chest pain due to pericarditis',
    fsn: 'Chest pain due to pericarditis (finding)',
    similarity: 0.50,
    source: 'embedding_search',
    clinicalHint: 'Consider when pericardial inflammation suspected',
    isSuggestion: true,
    clinicallyValidated: false,
    semanticTag: 'finding',
  },
];

/**
 * Default view with both validated matches and related concepts
 */
export const Default: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-two-tier-results
        .validatedMatches=${sampleValidatedMatches}
        .relatedConcepts=${sampleRelatedConcepts}
        .termText=${'burning chest pain'}
        @concept-select=${(e: CustomEvent) =>
          console.log('Concept selected:', e.detail)}
      ></tx-two-tier-results>
    </div>
  `,
};

/**
 * With a pre-selected concept
 */
export const WithSelection: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-two-tier-results
        .validatedMatches=${sampleValidatedMatches}
        .relatedConcepts=${sampleRelatedConcepts}
        .selectedId=${'29857009'}
        .termText=${'burning chest pain'}
        @concept-select=${(e: CustomEvent) =>
          console.log('Concept selected:', e.detail)}
      ></tx-two-tier-results>
    </div>
  `,
};

/**
 * Only validated matches (no related concepts)
 */
export const OnlyValidatedMatches: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-two-tier-results
        .validatedMatches=${sampleValidatedMatches}
        .relatedConcepts=${[]}
        .termText=${'chest pain'}
        @concept-select=${(e: CustomEvent) =>
          console.log('Concept selected:', e.detail)}
      ></tx-two-tier-results>
    </div>
  `,
};

/**
 * No direct matches (only related concepts as suggestions)
 */
export const OnlyRelatedConcepts: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-two-tier-results
        .validatedMatches=${[]}
        .relatedConcepts=${sampleRelatedConcepts}
        .termText=${'heart racing'}
        @concept-select=${(e: CustomEvent) =>
          console.log('Concept selected:', e.detail)}
      ></tx-two-tier-results>
    </div>
  `,
};

/**
 * Empty state - no matches found
 */
export const NoMatches: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-two-tier-results
        .validatedMatches=${[]}
        .relatedConcepts=${[]}
        .termText=${'unknown term'}
        @concept-select=${(e: CustomEvent) =>
          console.log('Concept selected:', e.detail)}
      ></tx-two-tier-results>
    </div>
  `,
};

/**
 * Many matches scenario
 */
export const ManyMatches: Story = {
  render: () => {
    const manyValidated: ValidatedMatch[] = [
      {
        conceptId: '267036007',
        term: 'Dyspnea',
        fsn: 'Dyspnea (finding)',
        confidence: 1.0,
        source: 'synonym_lookup',
        semanticTag: 'finding',
        clinicallyValidated: true,
      },
      {
        conceptId: '230145002',
        term: 'Difficulty breathing',
        fsn: 'Difficulty breathing (finding)',
        confidence: 0.98,
        source: 'exact_match',
        semanticTag: 'finding',
        clinicallyValidated: true,
      },
      {
        conceptId: '49233005',
        term: 'Shortness of breath',
        fsn: 'Shortness of breath (finding)',
        confidence: 0.95,
        source: 'lexical_match',
        semanticTag: 'finding',
        clinicallyValidated: true,
      },
    ];

    const manyRelated: RelatedConcept[] = [
      {
        conceptId: '195957006',
        term: 'Acute respiratory distress',
        similarity: 0.65,
        source: 'embedding_search',
        clinicalHint: 'Consider in severe respiratory compromise',
        isSuggestion: true,
        clinicallyValidated: false,
        semanticTag: 'finding',
      },
      {
        conceptId: '301282008',
        term: 'Wheeze',
        similarity: 0.58,
        source: 'embedding_search',
        clinicalHint: 'Consider with obstructive pattern',
        isSuggestion: true,
        clinicallyValidated: false,
        semanticTag: 'finding',
      },
      {
        conceptId: '50415004',
        term: 'Orthopnea',
        similarity: 0.55,
        source: 'embedding_search',
        clinicalHint: 'Consider if dyspnea worsens when lying flat',
        isSuggestion: true,
        clinicallyValidated: false,
        semanticTag: 'finding',
      },
      {
        conceptId: '23924001',
        term: 'Paroxysmal nocturnal dyspnea',
        similarity: 0.52,
        source: 'embedding_search',
        clinicalHint: 'Consider in heart failure presentations',
        isSuggestion: true,
        clinicallyValidated: false,
        semanticTag: 'finding',
      },
      {
        conceptId: '162888004',
        term: 'Hyperventilation',
        similarity: 0.48,
        source: 'embedding_search',
        clinicalHint: 'Consider if anxiety-related breathing pattern',
        isSuggestion: true,
        clinicallyValidated: false,
        semanticTag: 'finding',
      },
    ];

    return html`
      <div style="max-width: 600px; padding: 24px;">
        <tx-two-tier-results
          .validatedMatches=${manyValidated}
          .relatedConcepts=${manyRelated}
          .termText=${'shortness of breath'}
          @concept-select=${(e: CustomEvent) =>
            console.log('Concept selected:', e.detail)}
        ></tx-two-tier-results>
      </div>
    `;
  },
};

/**
 * Related concept selected (shows different styling)
 */
export const RelatedConceptSelected: Story = {
  render: () => html`
    <div style="max-width: 600px; padding: 24px;">
      <tx-two-tier-results
        .validatedMatches=${sampleValidatedMatches}
        .relatedConcepts=${sampleRelatedConcepts}
        .selectedId=${'426396005'}
        .termText=${'burning chest pain'}
        @concept-select=${(e: CustomEvent) =>
          console.log('Concept selected:', e.detail)}
      ></tx-two-tier-results>
    </div>
  `,
};
