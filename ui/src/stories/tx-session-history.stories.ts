/**
 * TxSessionHistory Stories
 *
 * Comprehensive documentation and examples for the tx-session-history component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/features/coding/tx-session-history.js';
import type { SessionSummary } from '../components/features/coding/tx-session-history.js';

interface TxSessionHistoryProps {
  sessions?: SessionSummary[];
  activeSessionId?: string | null;
  loading?: boolean;
  hasMore?: boolean;
  collapsed?: boolean;
}

// Sample data generators
const createSession = (
  id: string,
  status: 'draft' | 'completed' | 'error',
  firstTerm: string,
  daysAgo: number = 0,
  expressionSnippet?: string
): SessionSummary => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - Math.floor(Math.random() * 10));

  return {
    id,
    status,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
    preview: {
      inputText: `Patient presents with ${firstTerm.toLowerCase()}`,
      firstTerm,
      expressionSnippet,
      termCount: Math.floor(Math.random() * 5) + 1,
    },
  };
};

// Sample session data
const sampleSessions: SessionSummary[] = [
  createSession('1', 'draft', 'Chest pain, shortness of breath', 0),
  createSession(
    '2',
    'completed',
    'Acute myocardial infarction',
    0,
    '29857009:{363698007=...'
  ),
  createSession('3', 'draft', 'Diabetic neuropathy', 1),
  createSession(
    '4',
    'completed',
    'Diabetic nephropathy',
    1,
    '127013003:{116676008=...'
  ),
  createSession('5', 'error', 'Invalid expression attempt', 2),
  createSession('6', 'completed', 'Hypertension', 3, '38341003'),
  createSession('7', 'draft', 'Chronic kidney disease', 5),
  createSession('8', 'completed', 'Type 2 diabetes mellitus', 7, '44054006'),
];

const meta: Meta<TxSessionHistoryProps> = {
  title: 'Features/Coding/SessionHistory',
  component: 'tx-session-history',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxSessionHistory

Session history sidebar component for managing previous coding sessions.

### Features
- **Session List**: Displays sessions grouped by date (Today, Yesterday, etc.)
- **Status Badges**: Draft (yellow), Completed (green), Error (red)
- **Search**: Filter sessions by text content
- **Status Filter**: Filter by All, Drafts, or Completed
- **Expression Preview**: Shows snippet for completed sessions
- **Pagination**: Load more sessions on demand
- **Collapsible**: Can be collapsed to save space

### Events
- \`load-session\`: Session selected for loading (includes sessionId)
- \`delete-session\`: Session deletion confirmed (includes sessionId)
- \`load-more\`: More sessions requested (includes offset)

### Keyboard Support
- Enter/Space on session card loads the session
- Tab navigation through interactive elements

### Visual States
- Active session highlighted with primary border
- Hover shows delete button
- Loading spinner when fetching more
        `,
      },
    },
  },
  argTypes: {
    activeSessionId: {
      control: 'text',
      description: 'ID of the currently active session',
    },
    loading: {
      control: 'boolean',
      description: 'Whether more sessions are being loaded',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    hasMore: {
      control: 'boolean',
      description: 'Whether more sessions are available to load',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    collapsed: {
      control: 'boolean',
      description: 'Whether the sidebar is collapsed',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
  render: (args) => html`
    <div style="height: 600px; width: 350px;">
      <tx-session-history
        .sessions=${args.sessions || []}
        .activeSessionId=${args.activeSessionId || null}
        ?loading=${args.loading}
        ?hasMore=${args.hasMore}
        ?collapsed=${args.collapsed}
        @load-session=${(e: CustomEvent) =>
          console.log('Load session:', e.detail)}
        @delete-session=${(e: CustomEvent) =>
          console.log('Delete session:', e.detail)}
        @load-more=${(e: CustomEvent) => console.log('Load more:', e.detail)}
      ></tx-session-history>
    </div>
  `,
};

export default meta;
type Story = StoryObj<TxSessionHistoryProps>;

// Default with multiple sessions
export const Default: Story = {
  args: {
    sessions: sampleSessions,
    activeSessionId: '1',
    loading: false,
    hasMore: true,
    collapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view with multiple sessions, one active, and load more available.',
      },
    },
  },
};

// Empty state
export const Empty: Story = {
  args: {
    sessions: [],
    hasMore: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no sessions exist.',
      },
    },
  },
};

// Only drafts
export const DraftsOnly: Story = {
  args: {
    sessions: sampleSessions.filter((s) => s.status === 'draft'),
    hasMore: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'View with only draft sessions.',
      },
    },
  },
};

// Only completed
export const CompletedOnly: Story = {
  args: {
    sessions: sampleSessions.filter((s) => s.status === 'completed'),
    hasMore: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'View with only completed sessions showing expression snippets.',
      },
    },
  },
};

// With errors
export const WithErrors: Story = {
  args: {
    sessions: [
      createSession('1', 'error', 'Failed extraction', 0),
      createSession('2', 'error', 'Invalid input', 0),
      createSession('3', 'draft', 'New session', 0),
    ],
    hasMore: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'View showing sessions with errors.',
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  args: {
    sessions: sampleSessions.slice(0, 3),
    loading: true,
    hasMore: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state showing spinner while fetching more sessions.',
      },
    },
  },
};

// Many sessions (scrollable)
export const ManysSessions: Story = {
  args: {
    sessions: [
      ...sampleSessions,
      createSession('9', 'completed', 'Chronic obstructive pulmonary disease', 10, '13645005'),
      createSession('10', 'draft', 'Osteoarthritis', 12),
      createSession('11', 'completed', 'Major depressive disorder', 14, '35489007'),
      createSession('12', 'draft', 'Anxiety disorder', 15),
      createSession('13', 'completed', 'Asthma', 20, '195967001'),
    ],
    hasMore: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Scrollable list with many sessions grouped by date.',
      },
    },
  },
};

// Interactive demo
export const Interactive: Story = {
  render: () => {
    let sessions = [...sampleSessions];
    let activeSessionId = '1';

    return html`
      <div style="height: 600px; width: 350px;">
        <tx-session-history
          .sessions=${sessions}
          .activeSessionId=${activeSessionId}
          ?hasMore=${true}
          @load-session=${(e: CustomEvent) => {
            activeSessionId = e.detail.sessionId;
            alert(`Loading session: ${e.detail.sessionId}`);
          }}
          @delete-session=${(e: CustomEvent) => {
            sessions = sessions.filter((s) => s.id !== e.detail.sessionId);
            alert(`Deleted session: ${e.detail.sessionId}`);
          }}
          @load-more=${() => {
            alert('Loading more sessions...');
          }}
        ></tx-session-history>
      </div>
    `;
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo. Try clicking sessions, deleting, and loading more.',
      },
    },
  },
};

// Different date groupings
export const DateGroupings: Story = {
  args: {
    sessions: [
      createSession('1', 'completed', 'Today session 1', 0, '12345'),
      createSession('2', 'draft', 'Today session 2', 0),
      createSession('3', 'completed', 'Yesterday session', 1, '23456'),
      createSession('4', 'draft', '3 days ago', 3),
      createSession('5', 'completed', 'Last week', 7, '34567'),
      createSession('6', 'completed', 'Two weeks ago', 14, '45678'),
    ],
    hasMore: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows date grouping labels for different time periods.',
      },
    },
  },
};

// Search demonstration
export const SearchDemo: Story = {
  render: () => html`
    <div style="height: 600px; width: 350px;">
      <p style="margin-bottom: 16px; font-size: 14px; color: var(--color-text-secondary);">
        Try searching for "chest" or "diabetes" to filter sessions.
      </p>
      <tx-session-history
        .sessions=${sampleSessions}
        ?hasMore=${false}
      ></tx-session-history>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates search functionality. Type to filter sessions by content.',
      },
    },
  },
};

// Filter demonstration
export const FilterDemo: Story = {
  render: () => html`
    <div style="height: 600px; width: 350px;">
      <p style="margin-bottom: 16px; font-size: 14px; color: var(--color-text-secondary);">
        Use the filter buttons to show All, Drafts only, or Completed only.
      </p>
      <tx-session-history
        .sessions=${sampleSessions}
        ?hasMore=${false}
      ></tx-session-history>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates status filter buttons.',
      },
    },
  },
};

// Different sidebar widths
export const DifferentWidths: Story = {
  render: () => html`
    <div style="display: flex; gap: 24px;">
      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Narrow (300px)</h4>
        <div style="height: 400px; width: 300px;">
          <tx-session-history
            .sessions=${sampleSessions.slice(0, 3)}
            ?hasMore=${false}
          ></tx-session-history>
        </div>
      </div>
      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Wide (400px)</h4>
        <div style="height: 400px; width: 400px;">
          <tx-session-history
            .sessions=${sampleSessions.slice(0, 3)}
            ?hasMore=${false}
          ></tx-session-history>
        </div>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Shows how the component adapts to different widths.',
      },
    },
  },
};
