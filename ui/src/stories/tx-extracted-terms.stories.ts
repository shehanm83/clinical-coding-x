/**
 * tx-extracted-terms Storybook Stories
 *
 * Collapsible panel for extracted clinical terms.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { action } from '@storybook/addon-actions';

import '../components/features/coding/tx-extracted-terms.js';
import type { TxExtractedTerms } from '../components/features/coding/tx-extracted-terms.js';
import type { ExtractedTerm } from '../components/features/coding/tx-term-card.js';
import type { TermMatchResult } from '../components/features/coding/tx-extracted-terms.js';

// Sample terms
const sampleTerms: ExtractedTerm[] = [
  {
    text: 'chest pain',
    normalized: 'chest pain',
    type: 'finding',
    confidence: 92,
    modifiers: [{ type: 'onset', value: 'acute' }],
    negated: false,
  },
  {
    text: 'left arm',
    normalized: 'left arm',
    type: 'body_site',
    confidence: 88,
    modifiers: [{ type: 'laterality', value: 'left' }],
    negated: false,
  },
  {
    text: 'shortness of breath',
    normalized: 'shortness of breath',
    type: 'finding',
    confidence: 95,
    modifiers: [],
    negated: false,
  },
];

// Sample matches
const sampleMatches: TermMatchResult[] = [
  {
    termIndex: 0,
    matches: [
      { id: '29857009', term: 'Chest pain', fsn: 'Chest pain (finding)', semanticTag: 'finding', similarity: 95 },
      { id: '274668005', term: 'Acute chest pain', fsn: 'Acute chest pain (finding)', semanticTag: 'finding', similarity: 89 },
      { id: '8071008', term: 'Chest wall pain', fsn: 'Chest wall pain (finding)', semanticTag: 'finding', similarity: 76 },
    ],
    selectedId: null,
    autoSelected: false,
  },
  {
    termIndex: 1,
    matches: [
      { id: '368208006', term: 'Left upper arm structure', fsn: 'Left upper arm structure (body structure)', semanticTag: 'body structure', similarity: 92 },
      { id: '40983000', term: 'Structure of arm', fsn: 'Structure of arm (body structure)', semanticTag: 'body structure', similarity: 78 },
    ],
    selectedId: null,
    autoSelected: false,
  },
  {
    termIndex: 2,
    matches: [
      { id: '267036007', term: 'Dyspnea', fsn: 'Dyspnea (finding)', semanticTag: 'finding', similarity: 97 },
      { id: '230145002', term: 'Difficulty breathing', fsn: 'Difficulty breathing (finding)', semanticTag: 'finding', similarity: 91 },
    ],
    selectedId: '267036007',
    autoSelected: true,
  },
];

const meta: Meta<TxExtractedTerms> = {
  title: 'Features/Coding/ExtractedTerms',
  component: 'tx-extracted-terms',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A collapsible panel that displays all extracted clinical terms with their
SNOMED CT concept matches for review and selection.

## Features
- Collapsible panel with term count badge
- Summary bar showing pending, selected, and excluded counts
- Individual term cards for each extracted term
- Auto-selection for high-confidence matches (>90%)
- Support for negated terms (excluded from expression)
- Event propagation for concept selection, manual search, and skip

## Usage
\`\`\`html
<tx-extracted-terms
  .terms=\${extractedTerms}
  .termMatches=\${termMatches}
  @concept-select=\${this.handleConceptSelect}
  @manual-search=\${this.handleManualSearch}
></tx-extracted-terms>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    terms: {
      description: 'Array of extracted terms',
      control: { type: 'object' },
    },
    termMatches: {
      description: 'Array of term match results',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<TxExtractedTerms>;

// ===== DEFAULT =====

export const Default: Story = {
  name: 'Default (Mixed States)',
  args: {
    terms: sampleTerms,
    termMatches: sampleMatches,
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
};

// ===== EMPTY STATE =====

export const EmptyState: Story = {
  name: 'Empty State',
  args: {
    terms: [],
    termMatches: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Empty state before any clinical text is processed.',
      },
    },
  },
};

// ===== ALL PENDING =====

export const AllPending: Story = {
  name: 'All Pending Selection',
  args: {
    terms: sampleTerms,
    termMatches: sampleTerms.map((_, i) => ({
      termIndex: i,
      matches: sampleMatches[i % sampleMatches.length].matches,
      selectedId: null,
      autoSelected: false,
    })),
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'All terms awaiting user selection.',
      },
    },
  },
};

// ===== ALL SELECTED =====

export const AllSelected: Story = {
  name: 'All Selected',
  args: {
    terms: sampleTerms,
    termMatches: sampleTerms.map((_, i) => ({
      termIndex: i,
      matches: sampleMatches[i % sampleMatches.length].matches,
      selectedId: sampleMatches[i % sampleMatches.length].matches[0].id,
      autoSelected: false,
    })),
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'All terms have been selected.',
      },
    },
  },
};

// ===== WITH NEGATED TERMS =====

export const WithNegatedTerms: Story = {
  name: 'With Negated Terms',
  args: {
    terms: [
      ...sampleTerms,
      {
        text: 'no history of cardiac issues',
        normalized: 'cardiac issues',
        type: 'finding' as const,
        confidence: 85,
        modifiers: [],
        negated: true,
      },
    ],
    termMatches: sampleMatches,
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Panel showing a mix of regular and negated (excluded) terms.',
      },
    },
  },
};

// ===== MANY TERMS =====

export const ManyTerms: Story = {
  name: 'Many Terms (Scrollable)',
  args: {
    terms: [
      { text: 'chest pain', normalized: 'chest pain', type: 'finding' as const, confidence: 92, modifiers: [], negated: false },
      { text: 'left arm', normalized: 'left arm', type: 'body_site' as const, confidence: 88, modifiers: [], negated: false },
      { text: 'shortness of breath', normalized: 'shortness of breath', type: 'finding' as const, confidence: 95, modifiers: [], negated: false },
      { text: 'diaphoresis', normalized: 'diaphoresis', type: 'finding' as const, confidence: 91, modifiers: [], negated: false },
      { text: 'nausea', normalized: 'nausea', type: 'finding' as const, confidence: 89, modifiers: [], negated: false },
      { text: 'ECG', normalized: 'electrocardiogram', type: 'procedure' as const, confidence: 94, modifiers: [], negated: false },
      { text: 'aspirin', normalized: 'aspirin', type: 'substance' as const, confidence: 97, modifiers: [], negated: false },
    ],
    termMatches: [],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Panel with many terms demonstrating scrollable content area.',
      },
    },
  },
};

// ===== SINGLE TERM =====

export const SingleTerm: Story = {
  name: 'Single Term',
  args: {
    terms: [sampleTerms[0]],
    termMatches: [sampleMatches[0]],
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
};

// ===== COLLAPSED STATE =====

export const CollapsedState: Story = {
  name: 'Collapsed (Click Header to Expand)',
  args: {
    terms: sampleTerms,
    termMatches: sampleMatches,
  },
  render: (args) => html`
    <div style="max-width: 700px;">
      <p style="margin-bottom: 16px; color: #6b7280; font-size: 14px;">
        Click the header to toggle collapse/expand state.
      </p>
      <tx-extracted-terms
        .terms=${args.terms}
        .termMatches=${args.termMatches}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-extracted-terms>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Click the panel header to collapse/expand the content.',
      },
    },
  },
};

// ===== IN CONTEXT =====

export const InContext: Story = {
  name: 'In Application Context',
  render: () => html`
    <div style="display: flex; gap: 24px; max-width: 1200px;">
      <!-- Left Column: Input -->
      <div style="flex: 1; min-width: 0;">
        <div style="padding: 16px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">Clinical Input</h3>
          <div style="padding: 12px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; line-height: 1.6;">
            Patient presents with acute chest pain radiating to left arm, accompanied by shortness of breath and diaphoresis. No history of cardiac issues.
          </div>
        </div>
      </div>

      <!-- Right Column: Extracted Terms -->
      <div style="flex: 1; min-width: 0;">
        <tx-extracted-terms
          .terms=${[
            { text: 'chest pain', normalized: 'chest pain', type: 'finding', confidence: 92, modifiers: [{ type: 'onset', value: 'acute' }], negated: false },
            { text: 'left arm', normalized: 'left arm', type: 'body_site', confidence: 88, modifiers: [{ type: 'laterality', value: 'left' }], negated: false },
            { text: 'shortness of breath', normalized: 'shortness of breath', type: 'finding', confidence: 95, modifiers: [], negated: false },
            { text: 'diaphoresis', normalized: 'diaphoresis', type: 'finding', confidence: 91, modifiers: [], negated: false },
            { text: 'no history of cardiac issues', normalized: 'cardiac issues', type: 'finding', confidence: 85, modifiers: [], negated: true },
          ]}
          .termMatches=${[
            { termIndex: 0, matches: [{ id: '29857009', term: 'Chest pain', fsn: 'Chest pain (finding)', semanticTag: 'finding', similarity: 95 }], selectedId: '29857009', autoSelected: true },
            { termIndex: 1, matches: [{ id: '368208006', term: 'Left upper arm structure', fsn: 'Left upper arm structure (body structure)', semanticTag: 'body structure', similarity: 92 }], selectedId: null, autoSelected: false },
            { termIndex: 2, matches: [{ id: '267036007', term: 'Dyspnea', fsn: 'Dyspnea (finding)', semanticTag: 'finding', similarity: 97 }], selectedId: '267036007', autoSelected: true },
            { termIndex: 3, matches: [{ id: '415690000', term: 'Sweating', fsn: 'Sweating (finding)', semanticTag: 'finding', similarity: 89 }], selectedId: null, autoSelected: false },
          ]}
          @concept-select=${action('concept-select')}
          @manual-search=${action('manual-search')}
          @skip-term=${action('skip-term')}
        ></tx-extracted-terms>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Extracted terms panel shown alongside the clinical input it was derived from.',
      },
    },
  },
};
