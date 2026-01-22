/**
 * tx-expression-preview Storybook Stories
 *
 * Component for displaying ECL expression preview with syntax highlighting.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { action } from '@storybook/addon-actions';

import '../components/features/coding/tx-expression-preview.js';
import type {
  TxExpressionPreview,
  ECLExpression,
} from '../components/features/coding/tx-expression-preview.js';

// Sample expressions
const simpleExpression: ECLExpression = {
  ecl: '29857009|Chest pain|',
  description: 'Chest pain',
  fsn: 'Chest pain (finding)',
  expressionType: 'precoordinated',
  validation: {
    valid: true,
    mrcmCompliant: true,
    errors: [],
    warnings: [],
  },
  formatted: {
    brief: '29857009',
    long: '29857009|Chest pain|',
    nested: '29857009 |Chest pain|',
  },
};

const postcoordinatedExpression: ECLExpression = {
  ecl: '29857009|Chest pain|:{363698007|Finding site|=51185008|Thoracic structure|,246112005|Severity|=24484000|Severe|}',
  description:
    'Severe chest pain with finding site in thoracic structure',
  fsn: 'Chest pain (finding)',
  expressionType: 'postcoordinated',
  validation: {
    valid: true,
    mrcmCompliant: true,
    errors: [],
    warnings: [],
  },
  formatted: {
    brief: '29857009:{363698007=51185008,246112005=24484000}',
    long: '29857009|Chest pain|:{363698007|Finding site|=51185008|Thoracic structure|,246112005|Severity|=24484000|Severe|}',
    nested: `29857009 |Chest pain| : {
  363698007 |Finding site| = 51185008 |Thoracic structure|,
  246112005 |Severity| = 24484000 |Severe|
}`,
  },
};

const complexExpression: ECLExpression = {
  ecl: '29857009|Chest pain|:{363698007|Finding site|=368208006|Left upper arm structure|,246112005|Severity|=24484000|Severe|,263502005|Clinical course|=424124008|Sudden onset|}',
  description:
    'Severe chest pain with sudden onset, finding site in left upper arm structure',
  fsn: 'Chest pain (finding)',
  expressionType: 'postcoordinated',
  validation: {
    valid: true,
    mrcmCompliant: true,
    errors: [],
    warnings: [],
  },
  formatted: {
    brief: '29857009:{363698007=368208006,246112005=24484000,263502005=424124008}',
    long: '29857009|Chest pain|:{363698007|Finding site|=368208006|Left upper arm structure|,246112005|Severity|=24484000|Severe|,263502005|Clinical course|=424124008|Sudden onset|}',
    nested: `29857009 |Chest pain| : {
  363698007 |Finding site| = 368208006 |Left upper arm structure|,
  246112005 |Severity| = 24484000 |Severe|,
  263502005 |Clinical course| = 424124008 |Sudden onset|
}`,
  },
};

const expressionWithWarnings: ECLExpression = {
  ...postcoordinatedExpression,
  validation: {
    valid: true,
    mrcmCompliant: true,
    errors: [],
    warnings: [
      {
        code: 'SUGGESTION',
        message: 'Consider adding "Clinical course" attribute for onset type',
      },
      {
        code: 'SUGGESTION',
        message: 'The finding site could be more specific',
      },
    ],
  },
};

const expressionWithErrors: ECLExpression = {
  ecl: '29857009|Chest pain|:{999999999|Invalid attribute|=51185008|Thoracic structure|}',
  description: 'Invalid expression',
  fsn: 'Chest pain (finding)',
  expressionType: 'postcoordinated',
  validation: {
    valid: false,
    mrcmCompliant: false,
    errors: [
      {
        code: 'INVALID_ATTRIBUTE',
        message: 'Attribute 999999999 is not valid for domain Clinical Finding',
      },
      {
        code: 'MRCM_VIOLATION',
        message: 'The attribute-value pair violates MRCM constraints',
      },
    ],
    warnings: [],
  },
  formatted: {
    brief: '29857009:{999999999=51185008}',
    long: '29857009|Chest pain|:{999999999|Invalid attribute|=51185008|Thoracic structure|}',
    nested: `29857009 |Chest pain| : {
  999999999 |Invalid attribute| = 51185008 |Thoracic structure|
}`,
  },
};

const meta: Meta<TxExpressionPreview> = {
  title: 'Features/Coding/ExpressionPreview',
  component: 'tx-expression-preview',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A component for displaying ECL (Expression Constraint Language) expressions with syntax highlighting, validation status, and interactive features.

## Features
- Live preview that updates as expression changes
- Three format options: Brief, Long, Nested
- Syntax highlighting for SCTIDs, terms, and operators
- Human-readable description display
- Validation status indicators (syntax valid, MRCM compliant)
- Validation error and warning messages
- Copy to clipboard functionality
- Manual expression editing mode

## Format Examples
| Format | Example |
|--------|---------|
| Brief | \`29857009:{363698007=51185008}\` |
| Long | \`29857009|Chest pain|:{363698007|Finding site|=51185008|Thoracic structure|}\` |
| Nested | Multi-line indented format |

## Usage
\`\`\`html
<tx-expression-preview
  .expression=\${this.expression}
  format="long"
  ?editable=\${true}
  @copy=\${this.handleCopy}
  @edit=\${this.handleEdit}
></tx-expression-preview>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    expression: {
      description: 'The ECL expression data',
      control: { type: 'object' },
    },
    format: {
      description: 'Display format',
      control: { type: 'select' },
      options: ['brief', 'long', 'nested'],
    },
    editable: {
      description: 'Whether editing is allowed',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<TxExpressionPreview>;

// ===== PRECOORDINATED =====

export const Precoordinated: Story = {
  name: 'Precoordinated (Simple)',
  args: {
    expression: simpleExpression,
    format: 'long',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A simple precoordinated concept without refinements.',
      },
    },
  },
};

// ===== POSTCOORDINATED =====

export const Postcoordinated: Story = {
  name: 'Postcoordinated',
  args: {
    expression: postcoordinatedExpression,
    format: 'long',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A postcoordinated expression with attribute refinements.',
      },
    },
  },
};

// ===== COMPLEX EXPRESSION =====

export const ComplexExpression: Story = {
  name: 'Complex Expression',
  args: {
    expression: complexExpression,
    format: 'nested',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A complex expression with multiple attributes in nested format.',
      },
    },
  },
};

// ===== FORMAT: BRIEF =====

export const BriefFormat: Story = {
  name: 'Brief Format',
  args: {
    expression: postcoordinatedExpression,
    format: 'brief',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Expression shown in brief format (SCTIDs only, no terms).',
      },
    },
  },
};

// ===== FORMAT: NESTED =====

export const NestedFormat: Story = {
  name: 'Nested Format',
  args: {
    expression: postcoordinatedExpression,
    format: 'nested',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Expression shown in nested format with indentation.',
      },
    },
  },
};

// ===== WITH WARNINGS =====

export const WithWarnings: Story = {
  name: 'With Warnings',
  args: {
    expression: expressionWithWarnings,
    format: 'long',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Valid expression with suggestion warnings displayed.',
      },
    },
  },
};

// ===== WITH ERRORS =====

export const WithErrors: Story = {
  name: 'With Validation Errors',
  args: {
    expression: expressionWithErrors,
    format: 'long',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Invalid expression showing validation errors (syntax invalid, MRCM non-compliant).',
      },
    },
  },
};

// ===== EMPTY STATE =====

export const EmptyState: Story = {
  name: 'Empty State',
  args: {
    expression: null,
    format: 'long',
    editable: true,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Empty state before an expression has been generated.',
      },
    },
  },
};

// ===== NOT EDITABLE =====

export const NotEditable: Story = {
  name: 'Not Editable',
  args: {
    expression: postcoordinatedExpression,
    format: 'long',
    editable: false,
  },
  render: (args) => html`
    <div style="max-width: 800px;">
      <tx-expression-preview
        .expression=${args.expression}
        .format=${args.format}
        ?editable=${args.editable}
        @copy=${action('copy')}
        @edit=${action('edit')}
      ></tx-expression-preview>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Expression without the edit button (read-only mode).',
      },
    },
  },
};

// ===== INTERACTIVE DEMO =====

export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  render: () => {
    return html`
      <div style="max-width: 800px;">
        <p style="margin-bottom: 16px;">
          Try clicking the format buttons, copy button, and edit button to see the component in action.
        </p>
        <tx-expression-preview
          .expression=${complexExpression}
          format="long"
          ?editable=${true}
          @copy=${(e: CustomEvent) => {
            action('copy')(e);
            console.log('Copied:', e.detail.text);
          }}
          @edit=${(e: CustomEvent) => {
            action('edit')(e);
            alert(`Expression edited to:\n${e.detail.ecl}`);
          }}
        ></tx-expression-preview>
      </div>
    `;
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing all features of the component.',
      },
    },
  },
};

// ===== ALL FORMATS COMPARISON =====

export const AllFormatsComparison: Story = {
  name: 'Format Comparison',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 800px;">
      <div>
        <h3 style="margin-bottom: 8px;">Brief Format</h3>
        <tx-expression-preview
          .expression=${postcoordinatedExpression}
          format="brief"
          ?editable=${false}
          @copy=${action('copy')}
        ></tx-expression-preview>
      </div>

      <div>
        <h3 style="margin-bottom: 8px;">Long Format</h3>
        <tx-expression-preview
          .expression=${postcoordinatedExpression}
          format="long"
          ?editable=${false}
          @copy=${action('copy')}
        ></tx-expression-preview>
      </div>

      <div>
        <h3 style="margin-bottom: 8px;">Nested Format</h3>
        <tx-expression-preview
          .expression=${postcoordinatedExpression}
          format="nested"
          ?editable=${false}
          @copy=${action('copy')}
        ></tx-expression-preview>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison of all three format options for the same expression.',
      },
    },
  },
};
