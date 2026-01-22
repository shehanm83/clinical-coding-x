/**
 * tx-container - Max-Width Container Component
 *
 * A container component that constrains content width and centers it.
 *
 * @slot - Default slot for container content
 *
 * @example
 * ```html
 * <tx-container size="lg">
 *   <h1>Page Content</h1>
 *   <p>Centered content with max-width</p>
 * </tx-container>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@customElement('tx-container')
export class TxContainer extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      margin-left: auto;
      margin-right: auto;
      padding-left: var(--space-4, 16px);
      padding-right: var(--space-4, 16px);
    }

    /* Size variants */
    :host([size='sm']) {
      max-width: 640px;
    }

    :host([size='md']) {
      max-width: 768px;
    }

    :host([size='lg']) {
      max-width: 1024px;
    }

    :host([size='xl']) {
      max-width: 1280px;
    }

    :host([size='full']) {
      max-width: none;
    }

    /* Responsive padding */
    @media (min-width: 640px) {
      :host {
        padding-left: var(--space-6, 24px);
        padding-right: var(--space-6, 24px);
      }
    }

    @media (min-width: 1024px) {
      :host {
        padding-left: var(--space-8, 32px);
        padding-right: var(--space-8, 32px);
      }
    }
  `;

  /**
   * Container size (max-width)
   */
  @property({ type: String, reflect: true })
  size: ContainerSize = 'lg';

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-container': TxContainer;
  }
}
