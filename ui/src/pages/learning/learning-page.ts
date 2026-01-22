import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Learning page - Educational resources and tutorials.
 *
 * @element learning-page
 */
@customElement('learning-page')
export class LearningPage extends LitElement {
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

  render() {
    return html`
      <h1>Learning Center</h1>
      <p>Educational resources - Implementation in future epic</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'learning-page': LearningPage;
  }
}
