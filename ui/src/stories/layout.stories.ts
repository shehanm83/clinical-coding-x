/**
 * Layout Components Stories
 *
 * Documentation and examples for layout primitives: Stack, Inline, Container, Grid, Divider.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/layout/tx-stack.js';
import '../components/layout/tx-inline.js';
import '../components/layout/tx-container.js';
import '../components/layout/tx-grid.js';
import '../components/layout/tx-divider.js';
import '../components/layout/tx-card.js';
import '../components/core/tx-button.js';

// ============================================================================
// TX-STACK
// ============================================================================

const stackMeta: Meta = {
  title: 'Layout/Stack',
  component: 'tx-stack',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxStack

A vertical flex layout primitive for consistent spacing between elements.

### Features
- **Gap control**: 1-8 spacing tokens (4px-32px)
- **Alignment**: Start, center, end, stretch
- **Justify**: Start, center, end, space-between
- **Responsive gaps**: \`gap-sm\`, \`gap-md\`, \`gap-lg\` for breakpoints

### Usage
Use Stack for vertical layouts like forms, card lists, or page sections.
        `,
      },
    },
  },
};

export default stackMeta;

export const StackBasic: StoryObj = {
  name: 'Basic Stack',
  render: () => html`
    <tx-stack gap="4">
      <tx-card padding="3">Item 1</tx-card>
      <tx-card padding="3">Item 2</tx-card>
      <tx-card padding="3">Item 3</tx-card>
    </tx-stack>
  `,
};

export const StackGaps: StoryObj = {
  name: 'Stack Gap Sizes',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
      <div>
        <h4 style="margin-bottom: 8px;">Gap 2 (8px)</h4>
        <tx-stack gap="2">
          <tx-card padding="2">A</tx-card>
          <tx-card padding="2">B</tx-card>
          <tx-card padding="2">C</tx-card>
        </tx-stack>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">Gap 4 (16px)</h4>
        <tx-stack gap="4">
          <tx-card padding="2">A</tx-card>
          <tx-card padding="2">B</tx-card>
          <tx-card padding="2">C</tx-card>
        </tx-stack>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">Gap 8 (32px)</h4>
        <tx-stack gap="8">
          <tx-card padding="2">A</tx-card>
          <tx-card padding="2">B</tx-card>
          <tx-card padding="2">C</tx-card>
        </tx-stack>
      </div>
    </div>
  `,
};

export const StackAlignment: StoryObj = {
  name: 'Stack Alignment',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
      <div>
        <h4 style="margin-bottom: 8px;">align="start"</h4>
        <tx-stack gap="2" align="start" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">Short</tx-button>
          <tx-button size="sm">Medium Text</tx-button>
          <tx-button size="sm">A</tx-button>
        </tx-stack>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">align="center"</h4>
        <tx-stack gap="2" align="center" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">Short</tx-button>
          <tx-button size="sm">Medium Text</tx-button>
          <tx-button size="sm">A</tx-button>
        </tx-stack>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">align="end"</h4>
        <tx-stack gap="2" align="end" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">Short</tx-button>
          <tx-button size="sm">Medium Text</tx-button>
          <tx-button size="sm">A</tx-button>
        </tx-stack>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">align="stretch"</h4>
        <tx-stack gap="2" align="stretch" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">Short</tx-button>
          <tx-button size="sm">Medium Text</tx-button>
          <tx-button size="sm">A</tx-button>
        </tx-stack>
      </div>
    </div>
  `,
};

// ============================================================================
// TX-INLINE
// ============================================================================

export const InlineBasic: StoryObj = {
  name: 'Inline Basic',
  parameters: {
    docs: {
      description: {
        story: `
## TxInline

A horizontal flex layout primitive for inline content alignment.

### Features
- **Gap control**: Same spacing tokens as Stack
- **Alignment**: Vertical alignment of items
- **Justify**: Horizontal distribution
- **Wrap**: Allow wrapping on small screens
        `,
      },
    },
  },
  render: () => html`
    <tx-inline gap="4">
      <tx-button variant="primary">Save</tx-button>
      <tx-button variant="secondary">Cancel</tx-button>
      <tx-button variant="ghost">Reset</tx-button>
    </tx-inline>
  `,
};

export const InlineJustify: StoryObj = {
  name: 'Inline Justify',
  render: () => html`
    <tx-stack gap="6">
      <div>
        <h4 style="margin-bottom: 8px;">justify="start"</h4>
        <tx-inline gap="2" justify="start" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">A</tx-button>
          <tx-button size="sm">B</tx-button>
          <tx-button size="sm">C</tx-button>
        </tx-inline>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">justify="center"</h4>
        <tx-inline gap="2" justify="center" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">A</tx-button>
          <tx-button size="sm">B</tx-button>
          <tx-button size="sm">C</tx-button>
        </tx-inline>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">justify="end"</h4>
        <tx-inline gap="2" justify="end" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">A</tx-button>
          <tx-button size="sm">B</tx-button>
          <tx-button size="sm">C</tx-button>
        </tx-inline>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">justify="space-between"</h4>
        <tx-inline gap="2" justify="space-between" style="background: var(--color-background); padding: 8px;">
          <tx-button size="sm">A</tx-button>
          <tx-button size="sm">B</tx-button>
          <tx-button size="sm">C</tx-button>
        </tx-inline>
      </div>
    </tx-stack>
  `,
};

export const InlineWrap: StoryObj = {
  name: 'Inline Wrap',
  render: () => html`
    <div style="max-width: 300px; border: 1px dashed var(--color-border); padding: 8px;">
      <tx-inline gap="2" wrap>
        <tx-button size="sm">Button 1</tx-button>
        <tx-button size="sm">Button 2</tx-button>
        <tx-button size="sm">Button 3</tx-button>
        <tx-button size="sm">Button 4</tx-button>
        <tx-button size="sm">Button 5</tx-button>
        <tx-button size="sm">Button 6</tx-button>
      </tx-inline>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'With `wrap` enabled, items wrap to the next line when space is limited.',
      },
    },
  },
};

// ============================================================================
// TX-CONTAINER
// ============================================================================

export const ContainerBasic: StoryObj = {
  name: 'Container',
  parameters: {
    docs: {
      description: {
        story: `
## TxContainer

A responsive container that constrains content width with automatic margins.

### Features
- **Max-width options**: sm (640px), md (768px), lg (1024px), xl (1280px), full
- **Centered**: Automatic horizontal centering
- **Padding**: Built-in horizontal padding
        `,
      },
    },
  },
  render: () => html`
    <tx-stack gap="6">
      <tx-container size="sm" style="background: var(--color-primary-light);">
        <tx-card padding="4">Container size="sm" (max-width: 640px)</tx-card>
      </tx-container>
      <tx-container size="md" style="background: var(--color-primary-light);">
        <tx-card padding="4">Container size="md" (max-width: 768px)</tx-card>
      </tx-container>
      <tx-container size="lg" style="background: var(--color-primary-light);">
        <tx-card padding="4">Container size="lg" (max-width: 1024px)</tx-card>
      </tx-container>
      <tx-container size="xl" style="background: var(--color-primary-light);">
        <tx-card padding="4">Container size="xl" (max-width: 1280px)</tx-card>
      </tx-container>
    </tx-stack>
  `,
};

// ============================================================================
// TX-DIVIDER
// ============================================================================

export const DividerBasic: StoryObj = {
  name: 'Divider',
  parameters: {
    docs: {
      description: {
        story: `
## TxDivider

A visual separator for content sections.

### Features
- **Orientation**: Horizontal (default) or vertical
- **Label**: Optional center label (e.g., "OR")
- **Spacing**: Configurable margin
        `,
      },
    },
  },
  render: () => html`
    <tx-stack gap="6">
      <div>
        <h4 style="margin-bottom: 16px;">Horizontal Divider</h4>
        <tx-card padding="4">
          <p>Content above the divider</p>
          <tx-divider spacing="4"></tx-divider>
          <p>Content below the divider</p>
        </tx-card>
      </div>

      <div>
        <h4 style="margin-bottom: 16px;">Divider with Label</h4>
        <tx-card padding="4">
          <tx-button fullWidth>Continue with Google</tx-button>
          <tx-divider spacing="4" label="OR"></tx-divider>
          <tx-button variant="secondary" fullWidth>Sign in with Email</tx-button>
        </tx-card>
      </div>

      <div>
        <h4 style="margin-bottom: 16px;">Vertical Divider</h4>
        <tx-inline gap="4" align="stretch" style="height: 60px;">
          <div style="padding: 8px;">Left Content</div>
          <tx-divider orientation="vertical"></tx-divider>
          <div style="padding: 8px;">Right Content</div>
        </tx-inline>
      </div>
    </tx-stack>
  `,
};

// ============================================================================
// COMBINED LAYOUT EXAMPLE
// ============================================================================

export const LayoutComposition: StoryObj = {
  name: 'Layout Composition',
  parameters: {
    docs: {
      description: {
        story:
          'Example showing how layout primitives compose together to build complex interfaces.',
      },
    },
  },
  render: () => html`
    <tx-container size="lg">
      <tx-stack gap="6">
        <!-- Header -->
        <tx-inline justify="space-between" align="center">
          <h2 style="margin: 0;">Dashboard</h2>
          <tx-inline gap="2">
            <tx-button variant="ghost">Export</tx-button>
            <tx-button variant="primary">New Session</tx-button>
          </tx-inline>
        </tx-inline>

        <tx-divider></tx-divider>

        <!-- Stats Grid -->
        <tx-grid columns="4" gap="4">
          <tx-card padding="4">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700;">24</div>
              <div style="color: var(--color-text-secondary); font-size: 14px;">Sessions</div>
            </div>
          </tx-card>
          <tx-card padding="4">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700;">156</div>
              <div style="color: var(--color-text-secondary); font-size: 14px;">Concepts</div>
            </div>
          </tx-card>
          <tx-card padding="4">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700;">98%</div>
              <div style="color: var(--color-text-secondary); font-size: 14px;">Accuracy</div>
            </div>
          </tx-card>
          <tx-card padding="4">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700;">2.3s</div>
              <div style="color: var(--color-text-secondary); font-size: 14px;">Avg Time</div>
            </div>
          </tx-card>
        </tx-grid>

        <!-- Recent Sessions -->
        <tx-card>
          <span slot="header">Recent Sessions</span>
          <tx-stack gap="2">
            <tx-inline justify="space-between" align="center">
              <span>Session #24 - Cardiology Notes</span>
              <tx-button variant="ghost" size="sm">View</tx-button>
            </tx-inline>
            <tx-divider spacing="2"></tx-divider>
            <tx-inline justify="space-between" align="center">
              <span>Session #23 - Emergency Report</span>
              <tx-button variant="ghost" size="sm">View</tx-button>
            </tx-inline>
            <tx-divider spacing="2"></tx-divider>
            <tx-inline justify="space-between" align="center">
              <span>Session #22 - Lab Results</span>
              <tx-button variant="ghost" size="sm">View</tx-button>
            </tx-inline>
          </tx-stack>
          <span slot="footer">
            <tx-button variant="ghost" size="sm">View All Sessions</tx-button>
          </span>
        </tx-card>
      </tx-stack>
    </tx-container>
  `,
};
