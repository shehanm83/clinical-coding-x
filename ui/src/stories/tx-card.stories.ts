/**
 * TxCard Stories
 *
 * Documentation and examples for the tx-card layout component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/layout/tx-card.js';
import '../components/core/tx-button.js';
import type { CardElevation, CardPadding } from '../components/layout/tx-card.js';

interface TxCardProps {
  elevation?: CardElevation;
  padding?: CardPadding;
  interactive?: boolean;
}

const meta: Meta<TxCardProps> = {
  title: 'Layout/Card',
  component: 'tx-card',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxCard

A surface container component with elevation, padding, and optional interactivity.

### Features
- **Elevation levels**: 0 (flat), 1, 2, 3 (most elevated)
- **Padding options**: 0, 2, 3, 4, 6, 8 (spacing tokens)
- **Interactive mode**: Hover effects for clickable cards
- **Flexible slots**: Header, default content, footer

### Slots
- \`header\`: Optional card header with bottom border
- Default: Main card content area
- \`footer\`: Optional footer with top border and gray background

### Usage Guidelines
- Use elevation 1-2 for most cards
- Use elevation 3 sparingly for emphasized content
- Use interactive for clickable list items
        `,
      },
    },
  },
  argTypes: {
    elevation: {
      control: 'select',
      options: ['0', '1', '2', '3'],
      description: 'Shadow elevation level',
      table: { defaultValue: { summary: '1' } },
    },
    padding: {
      control: 'select',
      options: ['0', '2', '3', '4', '6', '8'],
      description: 'Content padding (spacing token)',
      table: { defaultValue: { summary: '4' } },
    },
    interactive: {
      control: 'boolean',
      description: 'Enable hover effects for clickable cards',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  render: (args) => html`
    <tx-card
      elevation=${ifDefined(args.elevation)}
      padding=${ifDefined(args.padding)}
      ?interactive=${args.interactive}
    >
      <span slot="header">Card Title</span>
      <p>This is the card content. Cards provide a surface for grouping related content.</p>
      <span slot="footer">
        <tx-button variant="ghost" size="sm">View Details</tx-button>
      </span>
    </tx-card>
  `,
};

export default meta;
type Story = StoryObj<TxCardProps>;

export const Default: Story = {
  args: {
    elevation: '1',
    padding: '4',
  },
};

export const Elevations: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
      <tx-card elevation="0" padding="4">
        <span slot="header">Elevation 0</span>
        <p>Flat card with no shadow.</p>
      </tx-card>
      <tx-card elevation="1" padding="4">
        <span slot="header">Elevation 1</span>
        <p>Subtle shadow, default level.</p>
      </tx-card>
      <tx-card elevation="2" padding="4">
        <span slot="header">Elevation 2</span>
        <p>Medium shadow, more emphasis.</p>
      </tx-card>
      <tx-card elevation="3" padding="4">
        <span slot="header">Elevation 3</span>
        <p>Strong shadow, maximum elevation.</p>
      </tx-card>
    </div>
  `,
};

export const PaddingOptions: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <tx-card padding="0">
        <span slot="header">Padding 0</span>
        <p style="margin: 16px;">No body padding (but header has its own padding).</p>
      </tx-card>
      <tx-card padding="2">
        <span slot="header">Padding 2</span>
        <p>8px padding.</p>
      </tx-card>
      <tx-card padding="4">
        <span slot="header">Padding 4</span>
        <p>16px padding (default).</p>
      </tx-card>
      <tx-card padding="6">
        <span slot="header">Padding 6</span>
        <p>24px padding.</p>
      </tx-card>
      <tx-card padding="8">
        <span slot="header">Padding 8</span>
        <p>32px padding for spacious layouts.</p>
      </tx-card>
    </div>
  `,
};

export const Interactive: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
      <tx-card interactive elevation="1" padding="4" style="cursor: pointer;">
        <span slot="header">Session #1</span>
        <p style="color: var(--color-text-secondary); font-size: 14px;">
          Created: Jan 15, 2025<br />
          5 concepts identified
        </p>
      </tx-card>
      <tx-card interactive elevation="1" padding="4" style="cursor: pointer;">
        <span slot="header">Session #2</span>
        <p style="color: var(--color-text-secondary); font-size: 14px;">
          Created: Jan 14, 2025<br />
          12 concepts identified
        </p>
      </tx-card>
      <tx-card interactive elevation="1" padding="4" style="cursor: pointer;">
        <span slot="header">Session #3</span>
        <p style="color: var(--color-text-secondary); font-size: 14px;">
          Created: Jan 13, 2025<br />
          3 concepts identified
        </p>
      </tx-card>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Interactive cards have hover effects and are suitable for clickable list items.',
      },
    },
  },
};

export const WithoutHeaderFooter: Story = {
  render: () => html`
    <tx-card elevation="1" padding="6">
      <h3 style="margin: 0 0 16px 0;">Simple Card</h3>
      <p style="margin: 0; color: var(--color-text-secondary);">
        Cards without header and footer slots just display the default slot content.
      </p>
    </tx-card>
  `,
};

export const ConceptResultCard: Story = {
  render: () => html`
    <tx-card elevation="1" padding="0" style="max-width: 500px;">
      <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
        <span>Diabetes mellitus type 2</span>
        <span
          style="
            background: var(--tag-finding);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
          "
        >
          Finding
        </span>
      </div>
      <div style="padding: 16px;">
        <p style="margin: 0 0 8px 0; font-family: var(--font-mono); font-size: 14px;">
          SCTID: 44054006
        </p>
        <p style="margin: 0; color: var(--color-text-secondary); font-size: 14px;">
          A type of diabetes mellitus that is characterized by insulin resistance or desensitization
          and increased blood glucose levels.
        </p>
      </div>
      <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
        <tx-button variant="ghost" size="sm">View Details</tx-button>
        <tx-button variant="primary" size="sm">Select</tx-button>
      </div>
    </tx-card>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Example of a clinical concept result card with semantic tag and actions.',
      },
    },
  },
};

export const StatisticsCard: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
      <tx-card elevation="1" padding="4">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: var(--color-primary);">24</div>
          <div style="color: var(--color-text-secondary); font-size: 14px;">Sessions Today</div>
        </div>
      </tx-card>
      <tx-card elevation="1" padding="4">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: var(--color-success);">156</div>
          <div style="color: var(--color-text-secondary); font-size: 14px;">Concepts Coded</div>
        </div>
      </tx-card>
      <tx-card elevation="1" padding="4">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: var(--color-warning);">3</div>
          <div style="color: var(--color-text-secondary); font-size: 14px;">Pending Review</div>
        </div>
      </tx-card>
      <tx-card elevation="1" padding="4">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: var(--color-secondary);">98%</div>
          <div style="color: var(--color-text-secondary); font-size: 14px;">Accuracy Rate</div>
        </div>
      </tx-card>
    </div>
  `,
};
