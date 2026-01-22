/**
 * tx-toast-container - Toast Notification Manager
 *
 * Container component that manages a stack of toast notifications.
 * Also exports a `toast` function for programmatic toast creation.
 *
 * @example
 * ```typescript
 * import { toast } from '@components/core/tx-toast-container';
 *
 * toast.success('Expression copied to clipboard!');
 * toast.error('Failed to save session');
 * toast.info('New questions available', { duration: 5000 });
 * toast.warning('Unsaved changes will be lost', { dismissible: true });
 * ```
 *
 * @example
 * ```html
 * <!-- Add to your app shell -->
 * <tx-toast-container position="top-right"></tx-toast-container>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ToastVariant, ToastPosition } from './tx-toast.js';
import './tx-toast.js';

export interface ToastOptions {
  duration?: number;
  dismissible?: boolean;
}

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  dismissible: boolean;
}

// Maximum visible toasts
const MAX_TOASTS = 3;

/**
 * Set the global container instance
 */
function setContainerInstance(instance: TxToastContainer | null) {
  TxToastContainer.instance = instance;
}

/**
 * Get the global container instance
 */
function getContainerInstance(): TxToastContainer | null {
  return TxToastContainer.instance;
}

@customElement('tx-toast-container')
export class TxToastContainer extends LitElement {
  /**
   * Global singleton instance reference
   */
  static instance: TxToastContainer | null = null;
  static styles = css`
    :host {
      display: block;
      position: fixed;
      z-index: var(--z-toast, 400);
      pointer-events: none;
    }

    /* Position variants */
    :host([position='top-right']) {
      top: var(--space-4, 16px);
      right: var(--space-4, 16px);
    }

    :host([position='top-left']) {
      top: var(--space-4, 16px);
      left: var(--space-4, 16px);
    }

    :host([position='bottom-right']) {
      bottom: var(--space-4, 16px);
      right: var(--space-4, 16px);
    }

    :host([position='bottom-left']) {
      bottom: var(--space-4, 16px);
      left: var(--space-4, 16px);
    }

    .toast-stack {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    /* Reverse stack for bottom positions */
    :host([position='bottom-right']) .toast-stack,
    :host([position='bottom-left']) .toast-stack {
      flex-direction: column-reverse;
    }

    tx-toast {
      pointer-events: auto;
    }
  `;

  /**
   * Position of the toast stack
   */
  @property({ type: String, reflect: true })
  position: ToastPosition = 'top-right';

  /**
   * Current toast stack
   */
  @state()
  private _toasts: ToastItem[] = [];

  private _idCounter = 0;

  connectedCallback() {
    super.connectedCallback();
    setContainerInstance(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (getContainerInstance() === this) {
      setContainerInstance(null);
    }
  }

  /**
   * Add a toast to the stack
   */
  addToast(message: string, variant: ToastVariant, options: ToastOptions = {}): string {
    const id = `toast-${++this._idCounter}`;
    const toast: ToastItem = {
      id,
      message,
      variant,
      duration: options.duration ?? 3000,
      dismissible: options.dismissible ?? true,
    };

    // Add to stack, removing oldest if exceeding max
    this._toasts = [...this._toasts, toast];
    if (this._toasts.length > MAX_TOASTS) {
      this._toasts = this._toasts.slice(-MAX_TOASTS);
    }

    return id;
  }

  /**
   * Remove a toast by ID
   */
  removeToast(id: string) {
    this._toasts = this._toasts.filter((t) => t.id !== id);
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    this._toasts = [];
  }

  private _handleToastClose(id: string) {
    this.removeToast(id);
  }

  render() {
    return html`
      <div class="toast-stack" role="region" aria-label="Notifications">
        ${repeat(
          this._toasts,
          (toast) => toast.id,
          (toast) => html`
            <tx-toast
              .message=${toast.message}
              .variant=${toast.variant}
              .duration=${toast.duration}
              .dismissible=${toast.dismissible}
              .position=${this.position}
              @close=${() => this._handleToastClose(toast.id)}
            ></tx-toast>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-toast-container': TxToastContainer;
  }
}

/**
 * Get or create the toast container instance
 */
function getContainer(): TxToastContainer {
  const existing = getContainerInstance();
  if (existing) {
    return existing;
  }
  // Create and append container if it doesn't exist
  const container = document.createElement('tx-toast-container');
  document.body.appendChild(container);
  return container;
}

/**
 * Programmatic toast API
 */
export const toast = {
  /**
   * Show an info toast
   */
  info(message: string, options?: ToastOptions): string {
    return getContainer().addToast(message, 'info', options);
  },

  /**
   * Show a success toast
   */
  success(message: string, options?: ToastOptions): string {
    return getContainer().addToast(message, 'success', options);
  },

  /**
   * Show a warning toast
   */
  warning(message: string, options?: ToastOptions): string {
    return getContainer().addToast(message, 'warning', options);
  },

  /**
   * Show an error toast
   */
  error(message: string, options?: ToastOptions): string {
    return getContainer().addToast(message, 'error', options);
  },

  /**
   * Remove a specific toast by ID
   */
  remove(id: string): void {
    getContainerInstance()?.removeToast(id);
  },

  /**
   * Clear all toasts
   */
  clearAll(): void {
    getContainerInstance()?.clearAll();
  },
};
