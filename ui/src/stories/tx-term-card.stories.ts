/**
 * tx-term-card Storybook Stories
 *
 * Individual term card for extracted clinical terms.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { action } from '@storybook/addon-actions';

import '../components/features/coding/tx-term-card.js';
import type { TxTermCard, ExtractedTerm, ConceptMatch } from '../components/features/coding/tx-term-card.js';

// Sample data
const sampleTerm: ExtractedTerm = {
  text: 'chest pain',
  normalized: 'chest pain',
  type: 'finding',
  confidence: 92,
  modifiers: [{ type: 'onset', value: 'acute' }],
  negated: false,
};

const sampleMatches: ConceptMatch[] = [
  { id: '29857009', term: 'Chest pain', fsn: 'Chest pain (finding)', semanticTag: 'finding', similarity: 95 },
  { id: '274668005', term: 'Acute chest pain', fsn: 'Acute chest pain (finding)', semanticTag: 'finding', similarity: 89 },
  { id: '8071008', term: 'Chest wall pain', fsn: 'Chest wall pain (finding)', semanticTag: 'finding', similarity: 76 },
];

const meta: Meta<TxTermCard> = {
  title: 'Features/Coding/TermCard',
  component: 'tx-term-card',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A term card component that displays a single extracted clinical term with its type,
modifiers, confidence score, and SNOMED CT concept matches.

## Features
- Type badges with semantic coloring (finding, body_site, procedure, etc.)
- Confidence visualization with color-coded bar
- Concept selection via radio buttons
- Auto-selection indicator for high-confidence matches
- Negated term styling with strikethrough
- Manual search and skip options

## Usage
\`\`\`html
<tx-term-card
  .term=\${extractedTerm}
  .conceptMatches=\${conceptMatches}
  .selectedId=\${selectedConceptId}
  @concept-select=\${this.handleSelect}
></tx-term-card>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    term: {
      description: 'The extracted term data',
      control: { type: 'object' },
    },
    conceptMatches: {
      description: 'Array of concept matches',
      control: { type: 'object' },
    },
    selectedId: {
      description: 'Currently selected concept ID',
      control: { type: 'text' },
    },
    autoSelected: {
      description: 'Whether the selection was automatic',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<TxTermCard>;

// ===== PENDING SELECTION =====

export const PendingSelection: Story = {
  name: 'Pending Selection',
  args: {
    term: sampleTerm,
    conceptMatches: sampleMatches,
    selectedId: null,
    autoSelected: false,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
};

// ===== SELECTED =====

export const Selected: Story = {
  name: 'Selected',
  args: {
    term: sampleTerm,
    conceptMatches: sampleMatches,
    selectedId: '29857009',
    autoSelected: false,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A term with a manually selected concept match.',
      },
    },
  },
};

// ===== AUTO-SELECTED =====

export const AutoSelected: Story = {
  name: 'Auto-Selected (High Confidence)',
  args: {
    term: { ...sampleTerm, confidence: 96 },
    conceptMatches: sampleMatches,
    selectedId: '29857009',
    autoSelected: true,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A term with auto-selected concept due to high confidence (>90%).',
      },
    },
  },
};

// ===== NEGATED TERM =====

export const NegatedTerm: Story = {
  name: 'Negated Term',
  args: {
    term: {
      ...sampleTerm,
      text: 'no history of cardiac issues',
      negated: true,
    },
    conceptMatches: [],
    selectedId: null,
    autoSelected: false,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A negated term shown with strikethrough and excluded status.',
      },
    },
  },
};

// ===== NO MATCHES =====

export const NoMatches: Story = {
  name: 'No Matches',
  args: {
    term: { ...sampleTerm, text: 'unusual symptom', confidence: 45 },
    conceptMatches: [],
    selectedId: null,
    autoSelected: false,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A term with no matching concepts found.',
      },
    },
  },
};

// ===== DIFFERENT TYPES =====

export const BodySiteType: Story = {
  name: 'Body Site Type',
  args: {
    term: {
      text: 'left arm',
      normalized: 'left arm',
      type: 'body_site',
      confidence: 88,
      modifiers: [{ type: 'laterality', value: 'left' }],
      negated: false,
    } as ExtractedTerm,
    conceptMatches: [
      { id: '368208006', term: 'Left upper arm structure', fsn: 'Left upper arm structure (body structure)', semanticTag: 'body structure', similarity: 92 },
      { id: '40983000', term: 'Structure of arm', fsn: 'Structure of arm (body structure)', semanticTag: 'body structure', similarity: 78 },
    ],
    selectedId: null,
    autoSelected: false,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
};

export const ProcedureType: Story = {
  name: 'Procedure Type',
  args: {
    term: {
      text: 'ECG',
      normalized: 'electrocardiogram',
      type: 'procedure',
      confidence: 94,
      modifiers: [],
      negated: false,
    } as ExtractedTerm,
    conceptMatches: [
      { id: '29303009', term: 'Electrocardiographic procedure', fsn: 'Electrocardiographic procedure (procedure)', semanticTag: 'procedure', similarity: 96 },
    ],
    selectedId: '29303009',
    autoSelected: true,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
};

// ===== LOW CONFIDENCE =====

export const LowConfidence: Story = {
  name: 'Low Confidence',
  args: {
    term: { ...sampleTerm, confidence: 52 },
    conceptMatches: [
      { ...sampleMatches[0], similarity: 58 },
      { ...sampleMatches[1], similarity: 45 },
    ],
    selectedId: null,
    autoSelected: false,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A term with low confidence score showing red indicators.',
      },
    },
  },
};

// ===== WITH MULTIPLE MODIFIERS =====

export const WithModifiers: Story = {
  name: 'With Multiple Modifiers',
  args: {
    term: {
      ...sampleTerm,
      modifiers: [
        { type: 'onset', value: 'acute' },
        { type: 'severity', value: 'severe' },
        { type: 'character', value: 'radiating' },
      ],
    },
    conceptMatches: sampleMatches,
    selectedId: null,
    autoSelected: false,
    index: 0,
  },
  render: (args) => html`
    <div style="max-width: 600px;">
      <tx-term-card
        .term=${args.term}
        .conceptMatches=${args.conceptMatches}
        .selectedId=${args.selectedId}
        .autoSelected=${args.autoSelected}
        .index=${args.index}
        @concept-select=${action('concept-select')}
        @manual-search=${action('manual-search')}
        @skip-term=${action('skip-term')}
      ></tx-term-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A term with multiple modifiers displayed as tags.',
      },
    },
  },
};
