/**
 * tx-grid - CSS Grid Layout Component
 *
 * A CSS grid layout primitive for responsive grid layouts.
 *
 * @slot - Default slot for grid children
 *
 * @example
 * ```html
 * <tx-grid columns="3" gap="4" minChildWidth="200px">
 *   <tx-card>Card 1</tx-card>
 *   <tx-card>Card 2</tx-card>
 *   <tx-card>Card 3</tx-card>
 * </tx-grid>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type SpacingValue = '1' | '2' | '3' | '4' | '6' | '8';

@customElement('tx-grid')
export class TxGrid extends LitElement {
  static styles = css`
    :host {
      display: grid;
    }

    /* Gap values mapping to spacing tokens */
    :host([gap='1']) {
      gap: var(--space-1, 4px);
    }

    :host([gap='2']) {
      gap: var(--space-2, 8px);
    }

    :host([gap='3']) {
      gap: var(--space-3, 12px);
    }

    :host([gap='4']) {
      gap: var(--space-4, 16px);
    }

    :host([gap='6']) {
      gap: var(--space-6, 24px);
    }

    :host([gap='8']) {
      gap: var(--space-8, 32px);
    }

    /* Column presets */
    :host([columns='1']) {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    :host([columns='2']) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :host([columns='3']) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    :host([columns='4']) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    :host([columns='5']) {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    :host([columns='6']) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    :host([columns='auto']) {
      grid-template-columns: repeat(auto-fit, minmax(var(--grid-min-width, 200px), 1fr));
    }

    /* Responsive columns */
    @media (min-width: 640px) {
      :host([columns-sm='1']) {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }
      :host([columns-sm='2']) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      :host([columns-sm='3']) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      :host([columns-sm='4']) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    @media (min-width: 768px) {
      :host([columns-md='1']) {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }
      :host([columns-md='2']) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      :host([columns-md='3']) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      :host([columns-md='4']) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      :host([columns-md='5']) {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }
      :host([columns-md='6']) {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
    }

    @media (min-width: 1024px) {
      :host([columns-lg='1']) {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }
      :host([columns-lg='2']) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      :host([columns-lg='3']) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      :host([columns-lg='4']) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      :host([columns-lg='5']) {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }
      :host([columns-lg='6']) {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
    }
  `;

  /**
   * Number of columns or 'auto' for auto-fit
   */
  @property({ type: String, reflect: true })
  columns: '1' | '2' | '3' | '4' | '5' | '6' | 'auto' = '3';

  /**
   * Responsive columns at sm breakpoint (640px+)
   */
  @property({ type: String, reflect: true, attribute: 'columns-sm' })
  columnsSm?: '1' | '2' | '3' | '4';

  /**
   * Responsive columns at md breakpoint (768px+)
   */
  @property({ type: String, reflect: true, attribute: 'columns-md' })
  columnsMd?: '1' | '2' | '3' | '4' | '5' | '6';

  /**
   * Responsive columns at lg breakpoint (1024px+)
   */
  @property({ type: String, reflect: true, attribute: 'columns-lg' })
  columnsLg?: '1' | '2' | '3' | '4' | '5' | '6';

  /**
   * Gap between grid items (spacing token value)
   */
  @property({ type: String, reflect: true })
  gap: SpacingValue = '4';

  /**
   * Minimum child width for auto-fit columns
   */
  @property({ type: String, attribute: 'min-child-width' })
  minChildWidth = '200px';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('minChildWidth')) {
      this.style.setProperty('--grid-min-width', this.minChildWidth);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.style.setProperty('--grid-min-width', this.minChildWidth);
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-grid': TxGrid;
  }
}
