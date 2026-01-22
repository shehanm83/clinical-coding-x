import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * Bottom drawer component for mobile modals.
 *
 * Provides a slide-up drawer from the bottom of the screen with:
 * - Partial height with drag-to-expand
 * - Swipe down to close
 * - Backdrop overlay
 * - Accessible focus management
 *
 * @element tx-bottom-drawer
 * @fires close - Fired when drawer is closed
 * @fires opened - Fired when drawer finishes opening
 * @fires closed - Fired when drawer finishes closing
 *
 * @slot - Default slot for drawer content
 * @slot header - Optional header content above the handle
 *
 * @example
 * ```html
 * <tx-bottom-drawer
 *   ?open=${showDrawer}
 *   title="Refinement Question"
 *   @close=${() => showDrawer = false}
 * >
 *   <tx-question-card .question=${question}></tx-question-card>
 * </tx-bottom-drawer>
 * ```
 */
@customElement('tx-bottom-drawer')
export class TxBottomDrawer extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--duration-normal, 250ms) var(--easing-default),
                  visibility var(--duration-normal, 250ms);
      z-index: var(--z-modal, 300);
    }

    .backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-xl, 16px) var(--radius-xl, 16px) 0 0;
      box-shadow: var(--shadow-xl);
      transform: translateY(100%);
      transition: transform var(--duration-normal, 250ms) var(--easing-default);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      z-index: calc(var(--z-modal, 300) + 1);
      touch-action: none;
    }

    .drawer.open {
      transform: translateY(0);
    }

    .drawer.dragging {
      transition: none;
    }

    .handle-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-3, 12px);
      cursor: grab;
      user-select: none;
    }

    .handle-area:active {
      cursor: grabbing;
    }

    .handle {
      width: 40px;
      height: 4px;
      background: var(--color-border, #e5e7eb);
      border-radius: 2px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--space-4, 16px) var(--space-3, 12px);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .title {
      margin: 0;
      font-size: var(--text-lg, 18px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #111827);
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-md, 8px);
      color: var(--color-text-muted, #9ca3af);
      cursor: pointer;
      transition: background var(--duration-fast, 150ms),
                  color var(--duration-fast, 150ms);
    }

    .close-button:hover {
      background: var(--color-background, #f9fafb);
      color: var(--color-text-primary, #111827);
    }

    .close-button:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: 2px;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4, 16px);
      overscroll-behavior: contain;
    }

    /* Safe area padding for iOS */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .content {
        padding-bottom: calc(var(--space-4, 16px) + env(safe-area-inset-bottom));
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .backdrop,
      .drawer {
        transition: none;
      }
    }
  `;

  /**
   * Whether the drawer is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Drawer title
   */
  @property({ type: String })
  title = '';

  /**
   * Whether to show the close button
   */
  @property({ type: Boolean })
  showClose = true;

  /**
   * Threshold for swipe-to-close (pixels)
   */
  @property({ type: Number })
  closeThreshold = 100;

  @state()
  private _dragging = false;

  @state()
  private _dragOffset = 0;

  private _startY = 0;
  private _startTime = 0;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleEscape);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleEscape);
  }

  updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('open')) {
      if (this.open) {
        this._onOpen();
      } else {
        this._onClose();
      }
    }
  }

  private _onOpen(): void {
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus the drawer for accessibility
    requestAnimationFrame(() => {
      const firstFocusable = this.shadowRoot?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    // Dispatch opened event after transition
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('opened', { bubbles: true, composed: true }));
    }, 250);
  }

  private _onClose(): void {
    // Restore body scroll
    document.body.style.overflow = '';

    // Dispatch closed event after transition
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
    }, 250);
  }

  private _handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.open) {
      this._close();
    }
  };

  private _handleBackdropClick(): void {
    this._close();
  }

  private _handleCloseClick(): void {
    this._close();
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private _handleTouchStart(e: TouchEvent): void {
    // Only handle single touch
    if (e.touches.length !== 1) return;

    this._startY = e.touches[0].clientY;
    this._startTime = Date.now();
    this._dragging = true;
    this._dragOffset = 0;
  }

  private _handleTouchMove(e: TouchEvent): void {
    if (!this._dragging) return;

    const deltaY = e.touches[0].clientY - this._startY;

    // Only allow dragging down
    if (deltaY > 0) {
      this._dragOffset = deltaY;
      e.preventDefault();
    }
  }

  private _handleTouchEnd(e: TouchEvent): void {
    if (!this._dragging) return;

    const deltaY = e.changedTouches[0].clientY - this._startY;
    const deltaTime = Date.now() - this._startTime;
    const velocity = deltaY / deltaTime;

    // Close if dragged past threshold or with high velocity
    if (deltaY > this.closeThreshold || velocity > 0.5) {
      this._close();
    }

    this._dragging = false;
    this._dragOffset = 0;
  }

  render() {
    const drawerStyle = this._dragOffset > 0
      ? `transform: translateY(${this._dragOffset}px)`
      : '';

    return html`
      <div
        class=${classMap({ backdrop: true, open: this.open })}
        @click=${this._handleBackdropClick}
        aria-hidden="true"
      ></div>

      <div
        class=${classMap({
          drawer: true,
          open: this.open,
          dragging: this._dragging,
        })}
        role="dialog"
        aria-modal="true"
        aria-labelledby=${this.title ? 'drawer-title' : ''}
        style=${drawerStyle}
      >
        <div
          class="handle-area"
          @touchstart=${this._handleTouchStart}
          @touchmove=${this._handleTouchMove}
          @touchend=${this._handleTouchEnd}
        >
          <div class="handle"></div>
        </div>

        ${this.title || this.showClose
          ? html`
              <div class="header">
                ${this.title
                  ? html`<h2 class="title" id="drawer-title">${this.title}</h2>`
                  : html`<div></div>`}
                ${this.showClose
                  ? html`
                      <button
                        class="close-button"
                        @click=${this._handleCloseClick}
                        aria-label="Close drawer"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>
                    `
                  : ''}
              </div>
            `
          : ''}

        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-bottom-drawer': TxBottomDrawer;
  }
}
