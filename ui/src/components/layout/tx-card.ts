/**
 * tx-card - Elevated Surface Card Component
 *
 * A card component with elevation, padding, and optional header/footer slots.
 *
 * @slot header - Optional card header
 * @slot - Default slot for card content
 * @slot footer - Optional card footer
 *
 * @example
 * ```html
 * <tx-card elevation="2" padding="4">
 *   <span slot="header">Card Title</span>
 *   <p>Card content goes here</p>
 *   <span slot="footer">Footer actions</span>
 * </tx-card>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export type CardElevation = '0' | '1' | '2' | '3';
export type CardPadding = '0' | '2' | '3' | '4' | '6' | '8';

@customElement('tx-card')
export class TxCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #E5E7EB);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }

    /* Elevation (shadow) */
    :host([elevation='0']) {
      box-shadow: none;
    }

    :host([elevation='1']) {
      box-shadow: var(--shadow-sm);
    }

    :host([elevation='2']) {
      box-shadow: var(--shadow-md);
    }

    :host([elevation='3']) {
      box-shadow: var(--shadow-lg);
    }

    /* Padding variants */
    :host([padding='0']) .card-body {
      padding: 0;
    }

    :host([padding='2']) .card-body {
      padding: var(--space-2, 8px);
    }

    :host([padding='3']) .card-body {
      padding: var(--space-3, 12px);
    }

    :host([padding='4']) .card-body {
      padding: var(--space-4, 16px);
    }

    :host([padding='6']) .card-body {
      padding: var(--space-6, 24px);
    }

    :host([padding='8']) .card-body {
      padding: var(--space-8, 32px);
    }

    .card-header {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border, #E5E7EB);
      font-weight: var(--font-weight-semibold, 600);
      font-size: var(--text-base, 16px);
      color: var(--color-text-primary, #111827);
    }

    .card-header.empty {
      display: none;
    }

    .card-body {
      padding: var(--space-4, 16px);
    }

    .card-footer {
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #E5E7EB);
      background-color: var(--color-background, #F9FAFB);
    }

    .card-footer.empty {
      display: none;
    }

    /* Hover effect for interactive cards */
    :host([interactive]) {
      cursor: pointer;
      transition: box-shadow var(--duration-fast, 150ms) var(--easing-default);
    }

    :host([interactive]:hover) {
      box-shadow: var(--shadow-md);
    }

    :host([interactive][elevation='1']:hover) {
      box-shadow: var(--shadow-md);
    }

    :host([interactive][elevation='2']:hover) {
      box-shadow: var(--shadow-lg);
    }

    :host([interactive][elevation='3']:hover) {
      box-shadow: var(--shadow-xl);
    }
  `;

  /**
   * Card elevation (shadow level)
   */
  @property({ type: String, reflect: true })
  elevation: CardElevation = '1';

  /**
   * Card body padding (spacing token)
   */
  @property({ type: String, reflect: true })
  padding: CardPadding = '4';

  /**
   * Whether the card has interactive hover styles
   */
  @property({ type: Boolean, reflect: true })
  interactive = false;

  /**
   * Track if header slot has content
   */
  @state()
  private _hasHeader = false;

  /**
   * Track if footer slot has content
   */
  @state()
  private _hasFooter = false;

  private _handleHeaderSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasHeader = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleFooterSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasFooter = slot.assignedNodes({ flatten: true }).length > 0;
  }

  render() {
    return html`
      <div class="card-header ${this._hasHeader ? '' : 'empty'}">
        <slot name="header" @slotchange=${this._handleHeaderSlotChange}></slot>
      </div>
      <div class="card-body">
        <slot></slot>
      </div>
      <div class="card-footer ${this._hasFooter ? '' : 'empty'}">
        <slot name="footer" @slotchange=${this._handleFooterSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-card': TxCard;
  }
}
