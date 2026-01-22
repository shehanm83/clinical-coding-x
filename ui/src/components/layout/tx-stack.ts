/**
 * tx-stack - Vertical Stack Layout Component
 *
 * A flex column layout primitive for consistent vertical spacing.
 *
 * @slot - Default slot for stack children
 *
 * @example
 * ```html
 * <tx-stack gap="4" align="stretch">
 *   <tx-card>Item 1</tx-card>
 *   <tx-card>Item 2</tx-card>
 *   <tx-card>Item 3</tx-card>
 * </tx-stack>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'space-between';
export type SpacingValue = '1' | '2' | '3' | '4' | '6' | '8';

@customElement('tx-stack')
export class TxStack extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
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

    /* Alignment */
    :host([align='start']) {
      align-items: flex-start;
    }

    :host([align='center']) {
      align-items: center;
    }

    :host([align='end']) {
      align-items: flex-end;
    }

    :host([align='stretch']) {
      align-items: stretch;
    }

    /* Justify */
    :host([justify='start']) {
      justify-content: flex-start;
    }

    :host([justify='center']) {
      justify-content: center;
    }

    :host([justify='end']) {
      justify-content: flex-end;
    }

    :host([justify='space-between']) {
      justify-content: space-between;
    }

    /* Responsive gap overrides */
    @media (min-width: 640px) {
      :host([gap-sm='1']) {
        gap: var(--space-1, 4px);
      }
      :host([gap-sm='2']) {
        gap: var(--space-2, 8px);
      }
      :host([gap-sm='3']) {
        gap: var(--space-3, 12px);
      }
      :host([gap-sm='4']) {
        gap: var(--space-4, 16px);
      }
      :host([gap-sm='6']) {
        gap: var(--space-6, 24px);
      }
      :host([gap-sm='8']) {
        gap: var(--space-8, 32px);
      }
    }

    @media (min-width: 768px) {
      :host([gap-md='1']) {
        gap: var(--space-1, 4px);
      }
      :host([gap-md='2']) {
        gap: var(--space-2, 8px);
      }
      :host([gap-md='3']) {
        gap: var(--space-3, 12px);
      }
      :host([gap-md='4']) {
        gap: var(--space-4, 16px);
      }
      :host([gap-md='6']) {
        gap: var(--space-6, 24px);
      }
      :host([gap-md='8']) {
        gap: var(--space-8, 32px);
      }
    }

    @media (min-width: 1024px) {
      :host([gap-lg='1']) {
        gap: var(--space-1, 4px);
      }
      :host([gap-lg='2']) {
        gap: var(--space-2, 8px);
      }
      :host([gap-lg='3']) {
        gap: var(--space-3, 12px);
      }
      :host([gap-lg='4']) {
        gap: var(--space-4, 16px);
      }
      :host([gap-lg='6']) {
        gap: var(--space-6, 24px);
      }
      :host([gap-lg='8']) {
        gap: var(--space-8, 32px);
      }
    }
  `;

  /**
   * Gap between children (spacing token value)
   */
  @property({ type: String, reflect: true })
  gap: SpacingValue = '4';

  /**
   * Responsive gap at sm breakpoint (640px+)
   */
  @property({ type: String, reflect: true, attribute: 'gap-sm' })
  gapSm?: SpacingValue;

  /**
   * Responsive gap at md breakpoint (768px+)
   */
  @property({ type: String, reflect: true, attribute: 'gap-md' })
  gapMd?: SpacingValue;

  /**
   * Responsive gap at lg breakpoint (1024px+)
   */
  @property({ type: String, reflect: true, attribute: 'gap-lg' })
  gapLg?: SpacingValue;

  /**
   * Cross-axis alignment
   */
  @property({ type: String, reflect: true })
  align: StackAlign = 'stretch';

  /**
   * Main-axis alignment
   */
  @property({ type: String, reflect: true })
  justify: StackJustify = 'start';

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-stack': TxStack;
  }
}
