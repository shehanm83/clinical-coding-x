import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * API Playground page - Interactive API testing interface.
 *
 * @element api-page
 */
@customElement('api-page')
export class ApiPage extends LitElement {
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
      <h1>API Playground</h1>
      <p>Interactive API testing - Implementation in future epic</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'api-page': ApiPage;
  }
}
