/**
 * tx-term-card-skeleton Storybook Stories
 *
 * Skeleton loading placeholder for term cards.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '../components/features/coding/tx-term-card-skeleton.js';
import type { TxTermCardSkeleton } from '../components/features/coding/tx-term-card-skeleton.js';

const meta: Meta<TxTermCardSkeleton> = {
  title: 'Features/Coding/TermCardSkeleton',
  component: 'tx-term-card-skeleton',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A skeleton loading component that mimics the structure of term cards during loading states.

## Features
- Shimmer animation for visual feedback
- Configurable number of cards
- Configurable number of concept rows per card
- Full accessibility support with aria-busy
- Respects prefers-reduced-motion

## Usage
\`\`\`html
<!-- Single skeleton -->
<tx-term-card-skeleton></tx-term-card-skeleton>

<!-- Multiple skeletons -->
<tx-term-card-skeleton count="3"></tx-term-card-skeleton>

<!-- Custom concept count -->
<tx-term-card-skeleton count="2" conceptCount="5"></tx-term-card-skeleton>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    count: {
      description: 'Number of skeleton cards to display',
      control: { type: 'number', min: 1, max: 10 },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    conceptCount: {
      description: 'Number of concept rows per card',
      control: { type: 'number', min: 1, max: 10 },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '3' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<TxTermCardSkeleton>;

// ===== SINGLE SKELETON =====

export const Default: Story = {
  name: 'Single Skeleton',
  args: {
    count: 1,
    conceptCount: 3,
  },
  render: (args) => html`
    <tx-term-card-skeleton
      .count=${args.count}
      .conceptCount=${args.conceptCount}
    ></tx-term-card-skeleton>
  `,
};

// ===== MULTIPLE SKELETONS =====

export const MultipleSkeletons: Story = {
  name: 'Multiple Skeletons',
  args: {
    count: 3,
    conceptCount: 3,
  },
  render: (args) => html`
    <tx-term-card-skeleton
      .count=${args.count}
      .conceptCount=${args.conceptCount}
    ></tx-term-card-skeleton>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Multiple skeleton cards to represent loading a list of terms.',
      },
    },
  },
};

// ===== MORE CONCEPTS =====

export const MoreConcepts: Story = {
  name: 'More Concept Options',
  args: {
    count: 1,
    conceptCount: 5,
  },
  render: (args) => html`
    <tx-term-card-skeleton
      .count=${args.count}
      .conceptCount=${args.conceptCount}
    ></tx-term-card-skeleton>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton with 5 concept rows to match cards showing more options.',
      },
    },
  },
};

// ===== LOADING STATE COMPARISON =====

export const LoadingStateComparison: Story = {
  name: 'Loading State Comparison',
  render: () => html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div>
        <h3 style="margin-bottom: 12px; font-size: 14px; color: #6b7280;">Loading State</h3>
        <tx-term-card-skeleton count="2" conceptCount="3"></tx-term-card-skeleton>
      </div>
      <div>
        <h3 style="margin-bottom: 12px; font-size: 14px; color: #6b7280;">Placeholder for Loaded State</h3>
        <div style="padding: 16px; background: #f9fafb; border-radius: 12px; border: 1px dashed #e5e7eb; text-align: center; color: #9ca3af;">
          Term cards would appear here after loading
        </div>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison showing skeleton loading state.',
      },
    },
  },
};

// ===== IN CONTAINER =====

export const InContainer: Story = {
  name: 'In Panel Container',
  render: () => html`
    <div style="
      max-width: 600px;
      padding: 16px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      ">
        <h2 style="font-size: 16px; font-weight: 600; color: #111827;">
          Extracted Terms
        </h2>
        <span style="
          background: #e5e7eb;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 12px;
          color: #6b7280;
        ">
          Loading...
        </span>
      </div>
      <tx-term-card-skeleton count="3" conceptCount="3"></tx-term-card-skeleton>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton cards displayed within a panel container, as they would appear in the actual UI.',
      },
    },
  },
};

// ===== DARK THEME =====

export const DarkTheme: Story = {
  name: 'Dark Theme',
  args: {
    count: 2,
    conceptCount: 3,
  },
  render: (args) => html`
    <div
      style="
        background: #1f2937;
        padding: 24px;
        border-radius: 8px;
        --color-surface: #374151;
        --color-border: #4b5563;
        --color-gray-100: #4b5563;
        --color-gray-50: #374151;
      "
    >
      <tx-term-card-skeleton
        .count=${args.count}
        .conceptCount=${args.conceptCount}
      ></tx-term-card-skeleton>
    </div>
  `,
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'The skeleton supports theming via CSS custom properties.',
      },
    },
  },
};

// ===== REDUCED MOTION =====

export const ReducedMotion: Story = {
  name: 'Reduced Motion (Simulation)',
  render: () => html`
    <style>
      .reduced-motion-demo .skeleton {
        animation: none !important;
        background: var(--color-gray-100, #f3f4f6) !important;
      }
    </style>
    <div class="reduced-motion-demo">
      <p style="margin-bottom: 12px; font-size: 14px; color: #6b7280;">
        When <code>prefers-reduced-motion</code> is enabled, the shimmer animation is disabled:
      </p>
      <tx-term-card-skeleton count="1" conceptCount="3"></tx-term-card-skeleton>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'The component respects the prefers-reduced-motion media query by disabling the shimmer animation.',
      },
    },
  },
};
