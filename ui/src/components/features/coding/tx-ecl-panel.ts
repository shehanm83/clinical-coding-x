/**
 * tx-ecl-panel - ECL Query Panel Component
 *
 * Provides an interface for executing Expression Constraint Language (ECL) queries
 * against the SNOMED CT terminology server.
 *
 * @fires ecl-execute - Fired when ECL query is executed
 * @fires concept-select - Fired when a result concept is selected
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import '../../core/tx-button.js';
import '../../core/tx-textarea.js';

/**
 * ECL result concept
 */
export interface EclResultConcept {
  conceptId: string;
  term: string;
  fsn: string;
  semanticTag: string;
  active: boolean;
}

/**
 * ECL execution result
 */
export interface EclExecutionResult {
  ecl: string;
  totalCount: number;
  concepts: EclResultConcept[];
  executionTimeMs: number;
  truncated: boolean;
}

/**
 * ECL template preset
 */
interface EclTemplate {
  label: string;
  ecl: string;
  description: string;
}

const ECL_TEMPLATES: EclTemplate[] = [
  {
    label: 'Descendants of Diabetes',
    ecl: '<< 73211009',
    description: 'All types of diabetes mellitus',
  },
  {
    label: 'Children of Headache',
    ecl: '< 25064002',
    description: 'Direct subtypes of headache',
  },
  {
    label: 'Findings with Body Site',
    ecl: '<< 404684003 : 363698007 = *',
    description: 'Clinical findings with any body site',
  },
  {
    label: 'Procedures on Heart',
    ecl: '<< 71388002 : 405813007 = << 80891009',
    description: 'Procedures with site in heart structure',
  },
];

@customElement('tx-ecl-panel')
export class TxEclPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .ecl-panel {
      padding: var(--space-4, 16px);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3, 12px);
    }

    .panel-title {
      font-size: var(--text-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-muted, #9ca3af);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .help-link {
      font-size: var(--text-xs, 12px);
      color: var(--color-primary, #2563eb);
      text-decoration: none;
      cursor: pointer;
    }

    .help-link:hover {
      text-decoration: underline;
    }

    .ecl-input-container {
      margin-bottom: var(--space-3, 12px);
    }

    .ecl-textarea {
      width: 100%;
      min-height: 80px;
      padding: var(--space-3, 12px);
      font-family: var(--font-mono, monospace);
      font-size: var(--text-sm, 14px);
      background: var(--color-background, #f9fafb);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      resize: vertical;
    }

    .ecl-textarea:focus {
      outline: none;
      border-color: var(--color-primary, #2563eb);
      box-shadow: 0 0 0 2px var(--color-primary-light, #dbeafe);
    }

    .templates-section {
      margin-bottom: var(--space-3, 12px);
    }

    .templates-label {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #9ca3af);
      margin-bottom: var(--space-2, 8px);
    }

    .templates-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2, 8px);
    }

    .template-btn {
      padding: var(--space-1, 4px) var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #4b5563);
      background: var(--color-background, #f9fafb);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) ease;
    }

    .template-btn:hover {
      background: var(--color-primary-light, #dbeafe);
      border-color: var(--color-primary, #2563eb);
      color: var(--color-primary, #2563eb);
    }

    .actions {
      display: flex;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-4, 16px);
    }

    .results-section {
      border-top: 1px solid var(--color-border, #e5e7eb);
      padding-top: var(--space-4, 16px);
    }

    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3, 12px);
    }

    .results-count {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #4b5563);
    }

    .results-count strong {
      color: var(--color-text-primary, #111827);
    }

    .execution-time {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #9ca3af);
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
      max-height: 300px;
      overflow-y: auto;
    }

    .result-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-background, #f9fafb);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: background var(--duration-fast, 150ms) ease;
    }

    .result-item:hover {
      background: var(--color-primary-light, #dbeafe);
    }

    .result-content {
      flex: 1;
      min-width: 0;
    }

    .result-term {
      font-size: var(--text-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-muted, #9ca3af);
    }

    .result-id {
      font-family: var(--font-mono, monospace);
    }

    .semantic-tag {
      padding: var(--space-1, 4px);
      background: var(--color-background, #e5e7eb);
      border-radius: var(--radius-xs, 2px);
      text-transform: capitalize;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2, 8px);
      padding: var(--space-6, 24px);
      color: var(--color-text-muted, #9ca3af);
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border, #e5e7eb);
      border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .error-state {
      padding: var(--space-3, 12px);
      background: var(--color-error-light, #fef2f2);
      color: var(--color-error, #dc2626);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-6, 24px);
      color: var(--color-text-muted, #9ca3af);
      font-size: var(--text-sm, 14px);
    }

    .truncated-warning {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning, #ca8a04);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
      margin-bottom: var(--space-3, 12px);
    }
  `;

  /**
   * Current ECL query
   */
  @property({ type: String })
  ecl = '';

  /**
   * Whether a query is executing
   */
  @property({ type: Boolean })
  loading = false;

  /**
   * Error message if query failed
   */
  @property({ type: String })
  error: string | null = null;

  /**
   * Query results
   */
  @property({ type: Object })
  results: EclExecutionResult | null = null;

  /**
   * Handle ECL input change
   */
  private _handleEclInput(e: Event): void {
    const target = e.target as HTMLTextAreaElement;
    this.ecl = target.value;
  }

  /**
   * Apply a template
   */
  private _applyTemplate(template: EclTemplate): void {
    this.ecl = template.ecl;
  }

  /**
   * Execute the ECL query
   */
  private _executeQuery(): void {
    if (!this.ecl.trim()) return;

    this.dispatchEvent(
      new CustomEvent('ecl-execute', {
        bubbles: true,
        composed: true,
        detail: { ecl: this.ecl.trim() },
      })
    );
  }

  /**
   * Clear the query
   */
  private _clearQuery(): void {
    this.ecl = '';
    this.results = null;
    this.error = null;
  }

  /**
   * Handle concept selection
   */
  private _handleConceptSelect(concept: EclResultConcept): void {
    this.dispatchEvent(
      new CustomEvent('concept-select', {
        bubbles: true,
        composed: true,
        detail: concept,
      })
    );
  }

  /**
   * Render templates section
   */
  private _renderTemplates() {
    return html`
      <div class="templates-section">
        <div class="templates-label">Quick templates:</div>
        <div class="templates-list">
          ${ECL_TEMPLATES.map(
            (template) => html`
              <button
                class="template-btn"
                @click=${() => this._applyTemplate(template)}
                title=${template.description}
              >
                ${template.label}
              </button>
            `
          )}
        </div>
      </div>
    `;
  }

  /**
   * Render results
   */
  private _renderResults() {
    if (this.loading) {
      return html`
        <div class="results-section">
          <div class="loading-state">
            <div class="spinner"></div>
            <span>Executing query...</span>
          </div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="results-section">
          <div class="error-state">${this.error}</div>
        </div>
      `;
    }

    if (!this.results) {
      return nothing;
    }

    if (this.results.concepts.length === 0) {
      return html`
        <div class="results-section">
          <div class="empty-state">No concepts found matching your query</div>
        </div>
      `;
    }

    return html`
      <div class="results-section">
        <div class="results-header">
          <span class="results-count">
            <strong>${this.results.totalCount}</strong> concepts found
          </span>
          <span class="execution-time">${this.results.executionTimeMs}ms</span>
        </div>

        ${this.results.truncated
          ? html`
              <div class="truncated-warning">
                Results truncated. Showing first ${this.results.concepts.length} of
                ${this.results.totalCount}.
              </div>
            `
          : nothing}

        <div class="results-list">
          ${this.results.concepts.map(
            (concept) => html`
              <div
                class="result-item"
                @click=${() => this._handleConceptSelect(concept)}
              >
                <div class="result-content">
                  <div class="result-term">${concept.term}</div>
                  <div class="result-meta">
                    <span class="result-id">${concept.conceptId}</span>
                    <span class="semantic-tag">${concept.semanticTag}</span>
                  </div>
                </div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="ecl-panel">
        <div class="panel-header">
          <span class="panel-title">ECL Query</span>
          <a
            class="help-link"
            href="https://confluence.ihtsdotools.org/display/DOCECL"
            target="_blank"
            rel="noopener"
          >
            ECL Syntax Help
          </a>
        </div>

        <div class="ecl-input-container">
          <textarea
            class="ecl-textarea"
            .value=${this.ecl}
            @input=${this._handleEclInput}
            placeholder="Enter ECL query, e.g., << 73211009"
          ></textarea>
        </div>

        ${this._renderTemplates()}

        <div class="actions">
          <tx-button
            variant="primary"
            ?disabled=${!this.ecl.trim() || this.loading}
            @click=${this._executeQuery}
          >
            Execute
          </tx-button>
          <tx-button
            variant="secondary"
            ?disabled=${!this.ecl && !this.results}
            @click=${this._clearQuery}
          >
            Clear
          </tx-button>
        </div>

        ${this._renderResults()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-ecl-panel': TxEclPanel;
  }
}
