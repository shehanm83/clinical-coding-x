/**
 * TxMobileTabs Stories
 *
 * Documentation and examples for the mobile tab bar component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/features/coding/tx-mobile-tabs.js';
import type { MobileTabConfig } from '../components/features/coding/tx-mobile-tabs.js';

interface TxMobileTabsProps {
  tabs: MobileTabConfig[];
  activeTab: string;
  pulseBadges: boolean;
}

const defaultTabs: MobileTabConfig[] = [
  { id: 'terms', label: 'Terms', icon: '📋', badge: 3 },
  { id: 'questions', label: 'Questions', icon: '❓', badge: 2 },
  { id: 'ecl', label: 'ECL', icon: '📝' },
];

const meta: Meta<TxMobileTabsProps> = {
  title: 'Mobile/MobileTabs',
  component: 'tx-mobile-tabs',
  tags: ['autodocs'],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        component: `
## TxMobileTabs

A mobile-optimized tab bar component for panel navigation.

### Features
- **Bottom tab navigation**: Fixed position tab bar for mobile UX
- **Badge support**: Notification badges with optional pulse animation
- **Keyboard navigation**: Arrow keys, Home, End for accessibility
- **Touch optimized**: Large tap targets with feedback

### Accessibility
- \`role="tab"\` on each tab button
- \`aria-selected\` indicates active tab
- \`aria-controls\` links to panel
- Keyboard navigation with arrow keys
- Badges have \`aria-label\` for screen readers

### Events
- \`tab-change\`: Fired when tab changes (detail: { tab, previousTab })

### Usage
Use this component for mobile panel switching in the clinical coding interface.
        `,
      },
    },
  },
  argTypes: {
    activeTab: {
      control: 'select',
      options: ['terms', 'questions', 'ecl'],
      description: 'Currently active tab ID',
    },
    pulseBadges: {
      control: 'boolean',
      description: 'Animate badges to draw attention',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  render: (args) => html`
    <div style="padding: 20px; background: var(--color-background, #f9fafb);">
      <tx-mobile-tabs
        .tabs=${args.tabs}
        activeTab=${args.activeTab}
        ?pulseBadges=${args.pulseBadges}
        @tab-change=${(e: CustomEvent) => console.log('Tab changed:', e.detail)}
      ></tx-mobile-tabs>
    </div>
  `,
};

export default meta;
type Story = StoryObj<TxMobileTabsProps>;

export const Default: Story = {
  args: {
    tabs: defaultTabs,
    activeTab: 'terms',
    pulseBadges: false,
  },
};

export const WithPulseBadges: Story = {
  args: {
    tabs: defaultTabs,
    activeTab: 'terms',
    pulseBadges: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badges pulse to draw attention to unread items or pending actions.',
      },
    },
  },
};

export const QuestionsActive: Story = {
  args: {
    tabs: defaultTabs,
    activeTab: 'questions',
    pulseBadges: false,
  },
};

export const ECLActive: Story = {
  args: {
    tabs: defaultTabs,
    activeTab: 'ecl',
    pulseBadges: false,
  },
};

export const NoBadges: Story = {
  args: {
    tabs: [
      { id: 'terms', label: 'Terms', icon: '📋' },
      { id: 'questions', label: 'Questions', icon: '❓' },
      { id: 'ecl', label: 'ECL', icon: '📝' },
    ],
    activeTab: 'terms',
    pulseBadges: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tabs without badges for when there are no pending items.',
      },
    },
  },
};

export const HighBadgeCounts: Story = {
  args: {
    tabs: [
      { id: 'terms', label: 'Terms', icon: '📋', badge: 150 },
      { id: 'questions', label: 'Questions', icon: '❓', badge: 99 },
      { id: 'ecl', label: 'ECL', icon: '📝', badge: 100 },
    ],
    activeTab: 'terms',
    pulseBadges: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge counts over 99 display as "99+" to maintain visual consistency.',
      },
    },
  },
};

export const TextOnlyTabs: Story = {
  args: {
    tabs: [
      { id: 'terms', label: 'Terms' },
      { id: 'questions', label: 'Questions' },
      { id: 'ecl', label: 'ECL Expression' },
    ],
    activeTab: 'terms',
    pulseBadges: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tabs without icons for simpler interfaces.',
      },
    },
  },
};

export const TwoTabs: Story = {
  args: {
    tabs: [
      { id: 'input', label: 'Input', icon: '✏️' },
      { id: 'output', label: 'Output', icon: '📤' },
    ],
    activeTab: 'input',
    pulseBadges: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Two-tab layout for simpler workflows.',
      },
    },
  },
};

export const FourTabs: Story = {
  args: {
    tabs: [
      { id: 'terms', label: 'Terms', icon: '📋', badge: 3 },
      { id: 'questions', label: 'Questions', icon: '❓', badge: 1 },
      { id: 'ecl', label: 'ECL', icon: '📝' },
      { id: 'history', label: 'History', icon: '📜' },
    ],
    activeTab: 'terms',
    pulseBadges: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Four tabs maximum before content becomes cramped on mobile.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    return html`
      <div style="padding: 20px; background: var(--color-background, #f9fafb);">
        <p style="margin: 0 0 16px; color: var(--color-text-secondary, #6b7280); font-size: 14px;">
          Click tabs or use Arrow keys to navigate. Press Home/End for first/last tab.
        </p>
        <tx-mobile-tabs
          .tabs=${defaultTabs}
          activeTab="terms"
          @tab-change=${(e: CustomEvent) => {
            const el = e.target as HTMLElement;
            el.setAttribute('activeTab', e.detail.tab);
          }}
        ></tx-mobile-tabs>
      </div>
    `;
  },
};

export const MobileViewport: Story = {
  args: {
    tabs: defaultTabs,
    activeTab: 'terms',
    pulseBadges: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'View in mobile viewport (320px) to see touch-optimized layout.',
      },
    },
  },
};
