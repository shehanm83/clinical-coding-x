/**
 * CodingPage Stories
 *
 * Comprehensive documentation and examples for the coding page component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../pages/coding/coding-page.js';

interface CodingPageProps {
  sessionId?: string;
}

const meta: Meta<CodingPageProps> = {
  title: 'Pages/CodingPage',
  component: 'coding-page',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## CodingPage

The main clinical coding interface that integrates all Epic 7 components into a cohesive workflow.

### Features
- **Clinical Input**: Enter clinical notes for AI-assisted coding
- **Context Options**: Set specialty and clinical setting
- **Progress Stepper**: Visual workflow state indicator
- **Two-Panel Layout**: Extracted terms (left) and refinement questions (right)
- **Expression Preview**: View generated SNOMED CT expression
- **Session Actions**: Clear, save draft, copy, and confirm actions
- **Real-time Updates**: WebSocket integration for live progress
- **URL Deep Linking**: Sessions can be shared via URL parameters
- **Mobile Responsive**: Tabbed view on mobile with swipe gestures

### Session States
| State | Description |
|-------|-------------|
| \`initial\` | No session started |
| \`extracting\` | AI is extracting clinical terms |
| \`matching\` | Finding SNOMED CT matches |
| \`confirming\` | User confirming concept selections |
| \`questioning\` | Answering refinement questions |
| \`building\` | Building ECL expression |
| \`completed\` | Expression ready |
| \`error\` | Error occurred |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| \`Ctrl+S\` | Save draft |
| \`Ctrl+Shift+C\` | Copy expression |
| \`Ctrl+Enter\` | Confirm & save |

### Events
- \`session-created\`: Fired when a new session is created
- \`session-completed\`: Fired when expression is ready
        `,
      },
    },
  },
  argTypes: {
    sessionId: {
      control: 'text',
      description: 'Optional session ID to load an existing session',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  decorators: [
    (story) => html`
      <div style="height: 100vh; background: var(--color-background, #f9fafb);">
        ${story()}
      </div>
    `,
  ],
};

export default meta;
type Story = StoryObj<CodingPageProps>;

/**
 * Default/Initial State
 *
 * The page as it appears when first loaded, with no active session.
 */
export const Default: Story = {
  render: () => html`<coding-page></coding-page>`,
  parameters: {
    docs: {
      description: {
        story:
          'Initial state with empty panels. User can enter clinical notes and start a coding session.',
      },
    },
  },
};

/**
 * With Session ID
 *
 * Demonstrates loading an existing session via the sessionId property.
 * Note: This will attempt to fetch the session from the API.
 */
export const WithSessionId: Story = {
  render: () => html`<coding-page sessionId="demo-session-123"></coding-page>`,
  parameters: {
    docs: {
      description: {
        story:
          'Loads an existing session by ID. In a real environment, this would fetch the session state from the backend.',
      },
    },
  },
};

/**
 * Desktop Layout
 *
 * Shows the two-column panel layout used on desktop screens.
 */
export const DesktopLayout: Story = {
  render: () => html`<coding-page></coding-page>`,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop layout with side-by-side panels for terms and questions. Breakpoint: >= 1024px',
      },
    },
  },
};

/**
 * Tablet Layout
 *
 * Shows the stacked panel layout used on tablet screens.
 */
export const TabletLayout: Story = {
  render: () => html`<coding-page></coding-page>`,
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Tablet layout with stacked panels. Breakpoint: 768px - 1023px',
      },
    },
  },
};

/**
 * Mobile Layout
 *
 * Shows the tabbed panel view used on mobile screens.
 */
export const MobileLayout: Story = {
  render: () => html`<coding-page></coding-page>`,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile layout with tabbed panel navigation and floating action button. Breakpoint: < 768px. Supports swipe gestures for tab switching.',
      },
    },
  },
};

/**
 * Mobile with iPhone X viewport
 *
 * Tests layout on iPhone X dimensions with notch considerations.
 */
export const MobileIPhoneX: Story = {
  render: () => html`<coding-page></coding-page>`,
  parameters: {
    viewport: {
      defaultViewport: 'iphonex',
    },
    docs: {
      description: {
        story: 'Mobile layout on iPhone X viewport (375x812). Tests safe area handling.',
      },
    },
  },
};

/**
 * Workflow Demo - Initial Input
 *
 * Demonstrates the initial state where user enters clinical notes.
 */
export const WorkflowInitial: Story = {
  render: () => html`
    <div style="position: relative;">
      <div style="
        position: absolute;
        top: 16px;
        right: 16px;
        padding: 8px 16px;
        background: var(--color-info, #0284c7);
        color: white;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
      ">
        Step 1: Enter clinical notes
      </div>
      <coding-page></coding-page>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Workflow step 1: User enters clinical text in the input area. Context options can be expanded to set specialty and setting.',
      },
    },
  },
};

/**
 * Connection States
 *
 * Demonstrates different WebSocket connection states.
 */
export const ConnectionStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px; padding: 24px;">
      <h2 style="margin: 0; font-size: 18px;">Connection Status Indicators</h2>
      <div style="display: flex; gap: 32px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #9ca3af;
          "></span>
          <span style="font-size: 12px; color: #6b7280;">Disconnected</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ca8a04;
            animation: pulse 1.5s infinite;
          "></span>
          <span style="font-size: 12px; color: #6b7280;">Connecting...</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #16a34a;
          "></span>
          <span style="font-size: 12px; color: #6b7280;">Connected</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ca8a04;
            animation: pulse 1.5s infinite;
          "></span>
          <span style="font-size: 12px; color: #6b7280;">Reconnecting...</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #dc2626;
          "></span>
          <span style="font-size: 12px; color: #6b7280;">Connection failed</span>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Visual reference for WebSocket connection status indicators shown in the page header.',
      },
    },
  },
};

/**
 * Error State
 *
 * Demonstrates the error banner display.
 */
export const ErrorState: Story = {
  render: () => html`
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 24px;">
      <h2 style="margin: 0; font-size: 18px;">Error Banner Examples</h2>

      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #dc2626;
      ">
        <svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; flex-shrink: 0;">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span style="flex: 1; font-size: 14px;">Service temporarily unavailable. Retrying...</span>
        <div style="display: flex; gap: 8px;">
          <button style="
            padding: 8px 12px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          ">Retry</button>
          <button style="
            padding: 8px 12px;
            background: transparent;
            color: #dc2626;
            border: 1px solid currentColor;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          ">Dismiss</button>
        </div>
      </div>

      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #dc2626;
      ">
        <svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; flex-shrink: 0;">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span style="flex: 1; font-size: 14px;">Session not found. It may have expired or been deleted.</span>
        <div style="display: flex; gap: 8px;">
          <button style="
            padding: 8px 12px;
            background: transparent;
            color: #dc2626;
            border: 1px solid currentColor;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          ">Dismiss</button>
        </div>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Error banners shown when API errors occur. Retryable errors show a Retry button, while non-retryable errors only show Dismiss.',
      },
    },
  },
};

/**
 * Page Layout Reference
 *
 * Visual reference for the page layout structure.
 */
export const LayoutReference: Story = {
  render: () => html`
    <div style="padding: 24px; font-family: var(--font-sans, sans-serif);">
      <h2 style="margin: 0 0 24px; font-size: 18px;">Page Layout Structure</h2>
      <pre style="
        background: #1f2937;
        color: #e5e7eb;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 12px;
        line-height: 1.5;
      ">
+-----------------------------------------------------+
|  [New Session]  [Active *]  [History]  [Templates]  |  <- Header
+-----------------------------------------------------+
|  Progress: *-----*-----o-----o                      |  <- Progress Stepper
+-----------------------------------------------------+
|  Clinical Text Input Area                           |  <- Clinical Input
|  [Specialty: ___] [Setting: ___]  <- Context Opts   |
+-------------------------+---------------------------+
|  Extracted Terms        |  Refinement Questions     |  <- Two-Column Panels
|  (Left Panel)           |  (Right Panel)            |
|                         |                           |
|  +-------------------+  |  +---------------------+  |
|  | Term Card 1       |  |  | Question Card 1     |  |
|  +-------------------+  |  +---------------------+  |
|  | Term Card 2       |  |  | Question Card 2     |  |
|  +-------------------+  |  +---------------------+  |
|                         |                           |
+-------------------------+---------------------------+
|  Expression Preview                                 |  <- ECL Preview
|  29857009 |Chest pain| : { 246112005 = 24484000 }   |
+-----------------------------------------------------+
|  [Clear]  [Save Draft]  [Copy]  [Confirm & Save]    |  <- Session Actions
+-----------------------------------------------------+
      </pre>

      <h3 style="margin: 24px 0 12px; font-size: 16px;">Mobile Layout (< 768px)</h3>
      <pre style="
        background: #1f2937;
        color: #e5e7eb;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 12px;
        line-height: 1.5;
      ">
+-----------------------------+
|  [=]  TerminologyX    [User]|  <- Compact Header
+-----------------------------+
|  *---o---o---o              |  <- Progress
+-----------------------------+
|  Clinical Input             |
|  +------------------------+ |
|  | Enter clinical notes.. | |
|  +------------------------+ |
|  [Start Coding]             |
+-----------------------------+
|  [Terms] [Questions] [ECL]  |  <- Tab Bar
+-----------------------------+
|                             |
|  Panel content here...      |  <- Tabbed Content
|                             |
|                        [OK] |  <- FAB
+-----------------------------+
      </pre>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'ASCII diagram showing the page layout structure for desktop and mobile viewports.',
      },
    },
  },
};

/**
 * Interactive Demo
 *
 * Full interactive demo of the coding page.
 */
export const InteractiveDemo: Story = {
  render: () => html`
    <div style="height: 100vh;">
      <coding-page
        @session-created=${(e: CustomEvent) =>
          console.log('Session created:', e.detail)}
        @session-completed=${(e: CustomEvent) =>
          console.log('Session completed:', e.detail)}
      ></coding-page>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: `
Full interactive demo. Try:
1. Enter clinical text (e.g., "Patient presents with severe chest pain and shortness of breath")
2. Observe the progress stepper
3. Select concepts from extracted terms
4. Answer refinement questions
5. View the generated expression
6. Use keyboard shortcuts (Ctrl+S, Ctrl+Enter)

**Note**: Requires backend API connection to function fully.
        `,
      },
    },
  },
};
