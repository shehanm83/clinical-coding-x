/**
 * TxBottomDrawer Stories
 *
 * Documentation and examples for the mobile bottom drawer component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/features/coding/tx-bottom-drawer.js';
import '../components/core/tx-button.js';

interface TxBottomDrawerProps {
  open: boolean;
  title: string;
  showClose: boolean;
  closeThreshold: number;
}

const meta: Meta<TxBottomDrawerProps> = {
  title: 'Mobile/BottomDrawer',
  component: 'tx-bottom-drawer',
  tags: ['autodocs'],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## TxBottomDrawer

A slide-up drawer component optimized for mobile interactions.

### Features
- **Slide-up animation**: Smooth entrance from bottom of screen
- **Swipe to close**: Drag down gesture dismisses drawer
- **Backdrop overlay**: Semi-transparent overlay with click-to-close
- **Escape key**: Keyboard dismissal support
- **Focus trap**: Focus stays within drawer when open
- **Body scroll lock**: Prevents background scrolling

### Accessibility
- \`role="dialog"\` with \`aria-modal="true"\`
- \`aria-labelledby\` points to title
- Focus management on open/close
- Escape key support
- Touch gestures respect reduced motion

### Events
- \`close\`: Fired when drawer should close (all dismiss methods)
- \`opened\`: Fired after open animation completes
- \`closed\`: Fired after close animation completes

### Slots
- Default: Main drawer content

### Usage
Use for mobile modals, question cards, and contextual actions.
        `,
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the drawer is visible',
    },
    title: {
      control: 'text',
      description: 'Drawer header title',
    },
    showClose: {
      control: 'boolean',
      description: 'Show close button in header',
      table: { defaultValue: { summary: 'true' } },
    },
    closeThreshold: {
      control: { type: 'range', min: 50, max: 200, step: 10 },
      description: 'Swipe distance (px) to trigger close',
      table: { defaultValue: { summary: '100' } },
    },
  },
  render: (args) => html`
    <tx-bottom-drawer
      ?open=${args.open}
      title=${args.title}
      ?showClose=${args.showClose}
      closeThreshold=${args.closeThreshold}
      @close=${() => console.log('Drawer close requested')}
    >
      <p style="margin: 0 0 16px;">This is the drawer content. You can place any content here.</p>
      <tx-button variant="primary" style="width: 100%;">Primary Action</tx-button>
    </tx-bottom-drawer>
  `,
};

export default meta;
type Story = StoryObj<TxBottomDrawerProps>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Drawer Title',
    showClose: true,
    closeThreshold: 100,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    title: 'Drawer Title',
    showClose: true,
    closeThreshold: 100,
  },
};

export const NoTitle: Story = {
  args: {
    open: true,
    title: '',
    showClose: true,
    closeThreshold: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer with close button but no title text.',
      },
    },
  },
};

export const NoCloseButton: Story = {
  args: {
    open: true,
    title: 'Important Action',
    showClose: false,
    closeThreshold: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'Hide close button to require explicit action. Users can still swipe down or click backdrop.',
      },
    },
  },
};

export const LowCloseThreshold: Story = {
  args: {
    open: true,
    title: 'Easy to Dismiss',
    showClose: true,
    closeThreshold: 50,
  },
  parameters: {
    docs: {
      description: {
        story: 'Lower threshold (50px) makes drawer easier to dismiss with swipe.',
      },
    },
  },
};

export const HighCloseThreshold: Story = {
  args: {
    open: true,
    title: 'Requires Intent',
    showClose: true,
    closeThreshold: 200,
  },
  parameters: {
    docs: {
      description: {
        story: 'Higher threshold (200px) requires more deliberate swipe to dismiss.',
      },
    },
  },
};

export const WithQuestionCard: Story = {
  render: () => html`
    <tx-bottom-drawer open title="Refinement Question" @close=${() => console.log('close')}>
      <div style="padding: 0;">
        <p style="margin: 0 0 16px; color: var(--color-text-secondary, #6b7280);">
          Answer this question to refine the clinical code:
        </p>
        <div style="background: var(--color-background, #f9fafb); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0 0 12px; font-weight: 500;">What is the severity of the condition?</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; padding: 12px; background: white; border-radius: 6px; cursor: pointer;">
              <input type="radio" name="severity" value="mild" />
              <span>Mild</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; padding: 12px; background: white; border-radius: 6px; cursor: pointer;">
              <input type="radio" name="severity" value="moderate" />
              <span>Moderate</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; padding: 12px; background: white; border-radius: 6px; cursor: pointer;">
              <input type="radio" name="severity" value="severe" />
              <span>Severe</span>
            </label>
          </div>
        </div>
        <tx-button variant="primary" style="width: 100%;">Submit Answer</tx-button>
      </div>
    </tx-bottom-drawer>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Example of using bottom drawer to present a refinement question.',
      },
    },
  },
};

export const WithForm: Story = {
  render: () => html`
    <tx-bottom-drawer open title="Edit Note" @close=${() => console.log('close')}>
      <form style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Clinical Note</label>
          <textarea
            style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid var(--color-border, #e5e7eb); border-radius: 8px; font-family: inherit; resize: vertical;"
            placeholder="Enter clinical description..."
          ></textarea>
        </div>
        <div style="display: flex; gap: 12px;">
          <tx-button variant="secondary" style="flex: 1;">Cancel</tx-button>
          <tx-button variant="primary" style="flex: 1;">Save</tx-button>
        </div>
      </form>
    </tx-bottom-drawer>
  `,
};

export const WithScrollableContent: Story = {
  render: () => html`
    <tx-bottom-drawer open title="Session History" @close=${() => console.log('close')}>
      <div style="max-height: 300px; overflow-y: auto;">
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(
          (i) => html`
            <div style="padding: 12px 0; border-bottom: 1px solid var(--color-border, #e5e7eb);">
              <div style="font-weight: 500;">Session ${i}</div>
              <div style="color: var(--color-text-secondary, #6b7280); font-size: 14px;">
                January ${i}, 2025 - 3 terms extracted
              </div>
            </div>
          `
        )}
      </div>
    </tx-bottom-drawer>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Drawer with scrollable content for longer lists.',
      },
    },
  },
};

export const ConfirmationDrawer: Story = {
  render: () => html`
    <tx-bottom-drawer open title="Confirm Selection" @close=${() => console.log('close')}>
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
        <p style="margin: 0 0 8px; font-weight: 500;">Ready to submit?</p>
        <p style="margin: 0 0 24px; color: var(--color-text-secondary, #6b7280);">
          This will finalize your clinical code selection.
        </p>
        <div style="display: flex; gap: 12px;">
          <tx-button variant="secondary" style="flex: 1;">Go Back</tx-button>
          <tx-button variant="primary" style="flex: 1;">Confirm</tx-button>
        </div>
      </div>
    </tx-bottom-drawer>
  `,
};

export const InteractiveDemo: Story = {
  render: () => {
    return html`
      <div style="padding: 20px;">
        <tx-button
          variant="primary"
          @click=${(e: Event) => {
            const drawer = (e.target as HTMLElement).parentElement?.querySelector('tx-bottom-drawer');
            drawer?.setAttribute('open', '');
          }}
        >
          Open Drawer
        </tx-button>

        <tx-bottom-drawer
          title="Interactive Drawer"
          @close=${(e: Event) => {
            (e.target as HTMLElement).removeAttribute('open');
          }}
        >
          <p style="margin: 0 0 16px;">
            Try these interactions:
          </p>
          <ul style="margin: 0 0 16px; padding-left: 20px;">
            <li>Swipe down on the handle to close</li>
            <li>Click the backdrop to close</li>
            <li>Press Escape key to close</li>
            <li>Click the X button to close</li>
          </ul>
          <tx-button
            variant="secondary"
            style="width: 100%;"
            @click=${(e: Event) => {
              (e.target as HTMLElement).closest('tx-bottom-drawer')?.removeAttribute('open');
            }}
          >
            Close Drawer
          </tx-button>
        </tx-bottom-drawer>
      </div>
    `;
  },
};

export const MobileViewport: Story = {
  args: {
    open: true,
    title: 'Mobile View',
    showClose: true,
    closeThreshold: 100,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'View in mobile viewport (320px) to see native-like drawer behavior.',
      },
    },
  },
};
