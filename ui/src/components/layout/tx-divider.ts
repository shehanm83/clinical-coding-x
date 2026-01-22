/**
 * tx-divider - Divider Component
 *
 * A horizontal or vertical divider with optional label.
 *
 * @example
 * ```html
 * <tx-divider></tx-divider>
 * <tx-divider label="OR"></tx-divider>
 * <tx-divider orientation="vertical"></tx-divider>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerThickness = 'thin' | 'thick';

@customElement('tx-divider')
export class TxDivider extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    :host([orientation='vertical']) {
      display: inline-block;
      height: 100%;
    }

    .divider {
      display: flex;
      align-items: center;
    }

    /* Horizontal divider */
    .divider.horizontal {
      width: 100%;
      flex-direction: row;
    }

    .divider.horizontal .line {
      flex: 1;
      height: 1px;
      background-color: var(--color-border, #E5E7EB);
    }

    .divider.horizontal.thick .line {
      height: 2px;
    }

    /* Vertical divider */
    .divider.vertical {
      height: 100%;
      min-height: 20px;
      flex-direction: column;
    }

    .divider.vertical .line {
      flex: 1;
      width: 1px;
      background-color: var(--color-border, #E5E7EB);
    }

    .divider.vertical.thick .line {
      width: 2px;
    }

    /* Label */
    .label {
      padding: 0 var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9CA3AF);
      white-space: nowrap;
    }

    .divider.vertical .label {
      padding: var(--space-2, 8px) 0;
    }

    /* No label - hide label element */
    .label:empty {
      display: none;
    }
  `;

  /**
   * Divider orientation
   */
  @property({ type: String, reflect: true })
  orientation: DividerOrientation = 'horizontal';

  /**
   * Divider thickness
   */
  @property({ type: String, reflect: true })
  thickness: DividerThickness = 'thin';

  /**
   * Optional label text
   */
  @property({ type: String })
  label = '';

  render() {
    const dividerClasses = `divider ${this.orientation} ${this.thickness}`;

    return html`
      <div class=${dividerClasses} role="separator" aria-orientation=${this.orientation}>
        <div class="line"></div>
        ${this.label ? html`<span class="label">${this.label}</span>` : null}
        ${this.label ? html`<div class="line"></div>` : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-divider': TxDivider;
  }
}
