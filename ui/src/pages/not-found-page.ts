import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { navigateTo } from '../router.js';

/**
 * 404 Not Found page - displayed when no route matches.
 *
 * @element not-found-page
 */
@customElement('not-found-page')
export class NotFoundPage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 64px);
      padding: var(--tx-spacing-6, 1.5rem);
      text-align: center;
    }

    .container {
      max-width: 32rem;
    }

    .error-code {
      font-size: 6rem;
      font-weight: var(--tx-font-weight-bold, 700);
      color: var(--tx-color-text-muted, #9ca3af);
      line-height: 1;
      margin: 0;
    }

    h1 {
      margin: var(--tx-spacing-4, 1rem) 0;
      font-size: var(--tx-font-size-2xl, 1.5rem);
      color: var(--tx-color-text-primary, #111827);
    }

    p {
      margin: 0 0 var(--tx-spacing-6, 1.5rem);
      color: var(--tx-color-text-secondary, #6b7280);
      line-height: var(--tx-line-height-relaxed, 1.625);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--tx-spacing-3, 0.75rem);
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--tx-spacing-2, 0.5rem);
      padding: var(--tx-spacing-3, 0.75rem) var(--tx-spacing-4, 1rem);
      border: none;
      border-radius: var(--tx-radius-md, 0.375rem);
      font-size: var(--tx-font-size-sm, 0.875rem);
      font-weight: var(--tx-font-weight-medium, 500);
      cursor: pointer;
      text-decoration: none;
      transition:
        background-color 150ms ease,
        transform 100ms ease;
    }

    .btn:focus-visible {
      outline: var(--tx-focus-ring-width, 2px) solid var(--tx-focus-ring-color, #3b82f6);
      outline-offset: var(--tx-focus-ring-offset, 2px);
    }

    .btn-primary {
      background-color: var(--tx-color-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--tx-color-primary-hover, #2563eb);
    }

    .btn-primary:active {
      transform: scale(0.98);
    }

    .btn-secondary {
      background-color: var(--tx-color-surface-secondary, #f3f4f6);
      color: var(--tx-color-text-primary, #111827);
    }

    .btn-secondary:hover {
      background-color: var(--tx-color-surface-tertiary, #e5e7eb);
    }

    .btn-secondary:active {
      transform: scale(0.98);
    }

    /* Icon styling */
    .icon {
      width: 1rem;
      height: 1rem;
    }

    .suggestions {
      margin-top: var(--tx-spacing-8, 2rem);
      padding-top: var(--tx-spacing-6, 1.5rem);
      border-top: 1px solid var(--tx-color-border, #e5e7eb);
    }

    .suggestions h2 {
      font-size: var(--tx-font-size-sm, 0.875rem);
      font-weight: var(--tx-font-weight-medium, 500);
      color: var(--tx-color-text-secondary, #6b7280);
      margin: 0 0 var(--tx-spacing-3, 0.75rem);
    }

    .suggestions-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: var(--tx-spacing-2, 0.5rem);
      justify-content: center;
    }

    .suggestions-list a {
      color: var(--tx-color-primary, #3b82f6);
      text-decoration: none;
      font-size: var(--tx-font-size-sm, 0.875rem);
      padding: var(--tx-spacing-1, 0.25rem) var(--tx-spacing-2, 0.5rem);
      border-radius: var(--tx-radius-sm, 0.25rem);
      transition: background-color 150ms ease;
    }

    .suggestions-list a:hover {
      background-color: var(--tx-color-primary-ghost, rgba(59, 130, 246, 0.1));
    }

    .suggestions-list a:focus-visible {
      outline: var(--tx-focus-ring-width, 2px) solid var(--tx-focus-ring-color, #3b82f6);
      outline-offset: var(--tx-focus-ring-offset, 2px);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    // Log 404 for monitoring
    this._log404();
  }

  /**
   * Log 404 error for monitoring
   */
  private _log404(): void {
    const path = window.location.pathname;
    const referrer = document.referrer;
    console.warn(`[404] Page not found: ${path}`, {
      path,
      referrer,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Navigate to home page
   */
  private _handleGoHome(e: Event): void {
    e.preventDefault();
    navigateTo('/');
  }

  /**
   * Navigate back in history
   */
  private _handleGoBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/');
    }
  }

  /**
   * Navigate to a suggested page
   */
  private _handleSuggestion(e: Event, path: string): void {
    e.preventDefault();
    navigateTo(path);
  }

  render() {
    return html`
      <div class="container">
        <p class="error-code">404</p>
        <h1>Page Not Found</h1>
        <p>
          The page you're looking for doesn't exist or has been moved. Check the
          URL or try one of the options below.
        </p>

        <div class="actions">
          <button
            class="btn btn-primary"
            @click=${this._handleGoHome}
            aria-label="Go to home page"
          >
            <svg
              class="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Go to Home
          </button>
          <button
            class="btn btn-secondary"
            @click=${this._handleGoBack}
            aria-label="Go back to previous page"
          >
            <svg
              class="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Go Back
          </button>
        </div>

        <div class="suggestions">
          <h2>Try these pages instead:</h2>
          <ul class="suggestions-list">
            <li>
              <a
                href="/code"
                @click=${(e: Event) => this._handleSuggestion(e, '/code')}
              >
                AI Coding
              </a>
            </li>
            <li>
              <a
                href="/explore"
                @click=${(e: Event) => this._handleSuggestion(e, '/explore')}
              >
                SNOMED Explorer
              </a>
            </li>
            <li>
              <a
                href="/learn"
                @click=${(e: Event) => this._handleSuggestion(e, '/learn')}
              >
                Learning Center
              </a>
            </li>
            <li>
              <a
                href="/api"
                @click=${(e: Event) => this._handleSuggestion(e, '/api')}
              >
                API Playground
              </a>
            </li>
          </ul>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'not-found-page': NotFoundPage;
  }
}
