import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Explorer page - SNOMED CT concept browser.
 *
 * @element explorer-page
 */
@customElement('explorer-page')
export class ExplorerPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: var(--tx-spacing-6, 1.5rem);
    }

    h1 {
      margin: 0 0 var(--tx-spacing-4, 1rem);
      color: var(--tx-color-text-primary, #111827);
    }

    p {
      color: var(--tx-color-text-secondary, #6b7280);
    }
  `;

  @property({ type: String })
  conceptId?: string;

  render() {
    return html`
      <h1>SNOMED CT Explorer</h1>
      <p>Concept browser - Implementation in future epic</p>
      ${this.conceptId ? html`<p>Concept: ${this.conceptId}</p>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'explorer-page': ExplorerPage;
  }
}
