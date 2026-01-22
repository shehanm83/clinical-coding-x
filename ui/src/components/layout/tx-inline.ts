/**
 * tx-inline - Horizontal Inline Layout Component
 *
 * A flex row layout primitive for consistent horizontal spacing.
 *
 * @slot - Default slot for inline children
 *
 * @example
 * ```html
 * <tx-inline gap="2" align="center" justify="space-between">
 *   <span>Label</span>
 *   <tx-button>Action</tx-button>
 * </tx-inline>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type InlineAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type InlineJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around';
export type SpacingValue = '1' | '2' | '3' | '4' | '6' | '8';

@customElement('tx-inline')
export class TxInline extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
    }

    :host([wrap]) {
      flex-wrap: wrap;
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

    /* Alignment (cross-axis / vertical) */
    :host([align='start']) {
      align-items: flex-start;
    }

    :host([align='center']) {
      align-items: center;
    }

    :host([align='end']) {
      align-items: flex-end;
    }

    :host([align='baseline']) {
      align-items: baseline;
    }

    :host([align='stretch']) {
      align-items: stretch;
    }

    /* Justify (main-axis / horizontal) */
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

    :host([justify='space-around']) {
      justify-content: space-around;
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
  gap: SpacingValue = '2';

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
   * Cross-axis alignment (vertical)
   */
  @property({ type: String, reflect: true })
  align: InlineAlign = 'center';

  /**
   * Main-axis alignment (horizontal)
   */
  @property({ type: String, reflect: true })
  justify: InlineJustify = 'start';

  /**
   * Whether to wrap children
   */
  @property({ type: Boolean, reflect: true })
  wrap = false;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-inline': TxInline;
  }
}
