/**
 * tx-modal - Modal Dialog Component
 *
 * A fully accessible modal dialog with focus trap, keyboard navigation,
 * and customizable content slots.
 *
 * @fires close - Fired when the modal is closed (via close button, escape key, or backdrop click)
 *
 * @slot header - Modal header content (title)
 * @slot - Default slot for modal body content
 * @slot footer - Modal footer content (action buttons)
 *
 * @example
 * ```html
 * <tx-modal ?open=${showModal} @close=${handleClose}>
 *   <span slot="header">Confirm Selection</span>
 *
 *   <p>Are you sure you want to select this concept?</p>
 *   <p><strong>29857009 | Chest pain (finding)</strong></p>
 *
 *   <div slot="footer">
 *     <tx-button variant="secondary" @click=${handleClose}>Cancel</tx-button>
 *     <tx-button variant="primary" @click=${handleConfirm}>Confirm</tx-button>
 *   </div>
 * </tx-modal>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export type ModalSize = 'sm' | 'md' | 'lg';

// Focusable element selector
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

@customElement('tx-modal')
export class TxModal extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal, 300);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4, 16px);
      background-color: rgba(0, 0, 0, 0);
      opacity: 0;
      visibility: hidden;
      transition:
        background-color 250ms var(--easing-default),
        opacity 250ms var(--easing-default),
        visibility 250ms var(--easing-default);
    }

    .modal-overlay.open {
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 1;
      visibility: visible;
    }

    .modal-overlay.closing {
      background-color: rgba(0, 0, 0, 0);
      opacity: 0;
    }

    .modal {
      position: relative;
      display: flex;
      flex-direction: column;
      background-color: var(--color-surface, #ffffff);
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-xl);
      max-height: 90vh;
      overflow: hidden;
      transform: scale(0.95);
      transition: transform 250ms var(--easing-default);
    }

    .modal-overlay.open .modal {
      transform: scale(1);
    }

    .modal-overlay.closing .modal {
      transform: scale(0.95);
    }

    /* Size variants */
    .modal.size-sm {
      width: 100%;
      max-width: 400px;
    }

    .modal.size-md {
      width: 100%;
      max-width: 600px;
    }

    .modal.size-lg {
      width: 100%;
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4, 16px);
      padding: var(--space-4, 16px) var(--space-6, 24px);
      border-bottom: 1px solid var(--color-border, #E5E7EB);
    }

    .modal-title {
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
      margin: 0;
      line-height: var(--line-height-tight, 1.2);
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: var(--radius-sm, 4px);
      background: transparent;
      color: var(--color-text-muted, #9CA3AF);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) var(--easing-default);
    }

    .close-button:hover {
      background-color: var(--color-border, #E5E7EB);
      color: var(--color-text-primary, #111827);
    }

    .close-button:focus-visible {
      outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, var(--color-primary));
      outline-offset: var(--focus-ring-offset, 2px);
    }

    .modal-body {
      flex: 1;
      padding: var(--space-6, 24px);
      overflow-y: auto;
      font-size: var(--text-base, 16px);
      line-height: var(--line-height-normal, 1.5);
      color: var(--color-text-secondary, #4B5563);
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
      padding: var(--space-4, 16px) var(--space-6, 24px);
      border-top: 1px solid var(--color-border, #E5E7EB);
    }

    .modal-footer:empty {
      display: none;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .modal-overlay {
        transition: opacity var(--duration-fast, 150ms) var(--easing-default);
      }

      .modal {
        transform: none;
        transition: none;
      }
    }
  `;

  /**
   * Whether the modal is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Modal size
   */
  @property({ type: String })
  size: ModalSize = 'md';

  /**
   * Whether clicking the backdrop closes the modal
   */
  @property({ type: Boolean })
  closeOnBackdrop = true;

  /**
   * Closing animation state
   */
  @state()
  private _closing = false;

  /**
   * Element that triggered the modal open (for focus return)
   */
  private _triggerElement: HTMLElement | null = null;

  /**
   * Previous body overflow style
   */
  private _previousBodyOverflow = '';

  @query('.modal')
  private _modalElement!: HTMLElement;

  @query('.close-button')
  private _closeButton!: HTMLButtonElement;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this._onOpen();
      }
    }
  }

  private _onOpen() {
    // Store trigger element for focus return
    this._triggerElement = document.activeElement as HTMLElement;

    // Prevent body scroll
    this._previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Add keyboard listener
    document.addEventListener('keydown', this._handleKeyDown);

    // Focus first focusable element after animation
    requestAnimationFrame(() => {
      this._focusFirstElement();
    });
  }

  private _onClose() {
    // Remove keyboard listener
    document.removeEventListener('keydown', this._handleKeyDown);

    // Restore body scroll
    document.body.style.overflow = this._previousBodyOverflow;

    // Return focus to trigger element
    if (this._triggerElement && typeof this._triggerElement.focus === 'function') {
      this._triggerElement.focus();
    }
    this._triggerElement = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.open) {
      document.body.style.overflow = this._previousBodyOverflow;
    }
  }

  /**
   * Close the modal with animation
   */
  close() {
    this._closing = true;

    setTimeout(() => {
      this._closing = false;
      this.open = false;
      this._onClose();

      this.dispatchEvent(
        new CustomEvent('close', {
          bubbles: true,
          composed: true,
        })
      );
    }, 250);
  }

  private _handleKeyDown = (e: KeyboardEvent) => {
    if (!this.open) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    // Focus trap
    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  };

  private _trapFocus(e: KeyboardEvent) {
    const focusableElements = this._getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    if (e.shiftKey) {
      // Shift + Tab: Move backwards
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: Move forwards
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  private _getFocusableElements(): HTMLElement[] {
    if (!this._modalElement) return [];

    const elements = this._modalElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    return Array.from(elements).filter(
      (el) => el.offsetParent !== null && !el.hasAttribute('disabled')
    );
  }

  private _focusFirstElement() {
    const focusableElements = this._getFocusableElements();
    const firstElement = focusableElements[0];
    if (firstElement) {
      firstElement.focus();
    } else if (this._closeButton) {
      this._closeButton.focus();
    }
  }

  private _handleBackdropClick(e: MouseEvent) {
    if (this.closeOnBackdrop && e.target === e.currentTarget) {
      this.close();
    }
  }

  render() {
    const overlayClasses = {
      'modal-overlay': true,
      open: this.open && !this._closing,
      closing: this._closing,
    };

    const modalClasses = {
      modal: true,
      [`size-${this.size}`]: true,
    };

    return html`
      <div
        class=${classMap(overlayClasses)}
        @click=${this._handleBackdropClick}
        aria-hidden=${!this.open}
      >
        <div
          class=${classMap(modalClasses)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <header class="modal-header">
            <h2 class="modal-title" id="modal-title">
              <slot name="header"></slot>
            </h2>
            <button
              class="close-button"
              @click=${this.close}
              aria-label="Close dialog"
              type="button"
            >
              ✕
            </button>
          </header>

          <div class="modal-body">
            <slot></slot>
          </div>

          <footer class="modal-footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-modal': TxModal;
  }
}
