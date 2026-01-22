/**
 * TxModal Stories
 *
 * Documentation and examples for the tx-modal dialog component.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/core/tx-modal.js';
import '../components/core/tx-button.js';
import '../components/core/tx-input.js';
import type { ModalSize } from '../components/core/tx-modal.js';

interface TxModalProps {
  open: boolean;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  header?: string;
  content: string;
}

const meta: Meta<TxModalProps> = {
  title: 'Core/Modal',
  component: 'tx-modal',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## TxModal

A modal dialog component with focus trap, keyboard handling, and multiple sizes.

### Features
- **Multiple sizes**: Small (400px), Medium (560px), Large (720px)
- **Focus trap**: Focus stays within modal when open
- **Keyboard handling**: Escape to close, focus management
- **Overlay click**: Optionally close on backdrop click
- **Scroll lock**: Body scroll disabled when open
- **Animated**: Smooth open/close transitions

### Accessibility
- Uses \`role="dialog"\` with \`aria-modal="true"\`
- \`aria-labelledby\` points to header
- Focus trapped within modal
- Focus returned to trigger on close
- Escape key closes modal

### Events
- \`close\`: Fired when modal is closed (via X, Escape, or overlay)

### Slots
- \`header\`: Modal title/header content
- Default: Main modal content
- \`footer\`: Action buttons
        `,
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Modal width size',
      table: { defaultValue: { summary: 'md' } },
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Close when clicking overlay',
      table: { defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Close when pressing Escape',
      table: { defaultValue: { summary: 'true' } },
    },
  },
  render: (args) => html`
    <tx-modal
      ?open=${args.open}
      size=${ifDefined(args.size)}
      ?closeOnOverlayClick=${args.closeOnOverlayClick}
      ?closeOnEscape=${args.closeOnEscape}
    >
      <span slot="header">${args.header || 'Modal Title'}</span>
      <p>${args.content}</p>
      <div slot="footer">
        <tx-button variant="secondary">Cancel</tx-button>
        <tx-button variant="primary">Confirm</tx-button>
      </div>
    </tx-modal>
  `,
};

export default meta;
type Story = StoryObj<TxModalProps>;

export const Default: Story = {
  args: {
    open: true,
    header: 'Confirm Action',
    content: 'Are you sure you want to proceed with this action? This cannot be undone.',
  },
};

export const Small: Story = {
  args: {
    open: true,
    size: 'sm',
    header: 'Quick Confirmation',
    content: 'Delete this item?',
  },
};

export const Medium: Story = {
  args: {
    open: true,
    size: 'md',
    header: 'Medium Modal',
    content:
      'This is the default size for most modals. It provides enough space for forms and content while staying focused.',
  },
};

export const Large: Story = {
  args: {
    open: true,
    size: 'lg',
    header: 'Large Modal',
    content:
      'Large modals are useful for complex forms, detailed information, or when you need more horizontal space for content.',
  },
};

export const WithForm: Story = {
  render: () => html`
    <tx-modal open size="md">
      <span slot="header">Create New Session</span>

      <form style="display: flex; flex-direction: column; gap: 16px;">
        <tx-input label="Session Name" placeholder="Enter session name" required></tx-input>
        <tx-input
          label="Patient Context"
          placeholder="Optional context"
          helperText="Add any relevant patient information"
        ></tx-input>
      </form>

      <div slot="footer">
        <tx-button variant="secondary">Cancel</tx-button>
        <tx-button variant="primary" type="submit">Create Session</tx-button>
      </div>
    </tx-modal>
  `,
};

export const ConfirmDelete: Story = {
  render: () => html`
    <tx-modal open size="sm">
      <span slot="header">Delete Session</span>

      <p style="margin: 0;">
        Are you sure you want to delete <strong>"Clinical Notes - Jan 2025"</strong>?
      </p>
      <p style="margin: 16px 0 0 0; color: var(--color-text-secondary);">
        This action cannot be undone. All associated data will be permanently removed.
      </p>

      <div slot="footer">
        <tx-button variant="secondary">Cancel</tx-button>
        <tx-button variant="destructive">Delete</tx-button>
      </div>
    </tx-modal>
  `,
};

export const ScrollableContent: Story = {
  render: () => html`
    <tx-modal open size="md">
      <span slot="header">Terms of Service</span>

      <div style="max-height: 300px; overflow-y: auto;">
        <h4>1. Introduction</h4>
        <p>
          Welcome to TerminologyX Clinical Coding. By using our services, you agree to these terms.
          Please read them carefully.
        </p>

        <h4>2. Using Our Services</h4>
        <p>
          You must follow any policies made available to you within the Services. Don't misuse our
          Services. For example, don't interfere with our Services or try to access them using a
          method other than the interface and the instructions that we provide.
        </p>

        <h4>3. Privacy and Data Protection</h4>
        <p>
          Our privacy policies explain how we treat your personal data and protect your privacy when
          you use our Services. By using our Services, you agree that we can use such data in
          accordance with our privacy policies.
        </p>

        <h4>4. Healthcare Disclaimer</h4>
        <p>
          The clinical coding suggestions provided by this tool are for reference only. Always
          verify codes against official guidelines and consult qualified healthcare professionals
          for clinical decisions.
        </p>

        <h4>5. Modifications</h4>
        <p>
          We may modify these terms or any additional terms that apply to a Service to, for example,
          reflect changes to the law or changes to our Services.
        </p>
      </div>

      <div slot="footer">
        <tx-button variant="secondary">Decline</tx-button>
        <tx-button variant="primary">Accept</tx-button>
      </div>
    </tx-modal>
  `,
};

export const NoOverlayClose: Story = {
  args: {
    open: true,
    header: 'Important Action',
    content: 'This modal requires explicit action. Clicking outside will not close it.',
    closeOnOverlayClick: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Set `closeOnOverlayClick` to `false` to prevent closing when clicking the backdrop.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    let modalEl: HTMLElement | null = null;

    const openModal = () => {
      modalEl?.setAttribute('open', '');
    };

    return html`
      <div>
        <tx-button variant="primary" @click=${openModal}>Open Modal</tx-button>

        <tx-modal
          size="md"
          @close=${(e: Event) => {
            (e.target as HTMLElement).removeAttribute('open');
          }}
        >
          <span slot="header">Interactive Modal</span>
          <p>This modal can be opened and closed interactively.</p>
          <p>Try pressing Escape or clicking the X button to close.</p>
          <div slot="footer">
            <tx-button
              variant="secondary"
              @click=${(e: Event) => {
                (e.target as HTMLElement).closest('tx-modal')?.removeAttribute('open');
              }}
            >
              Close
            </tx-button>
            <tx-button variant="primary">Save Changes</tx-button>
          </div>
        </tx-modal>
      </div>
    `;
  },
};
