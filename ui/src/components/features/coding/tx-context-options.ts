/**
 * tx-context-options - Context Options Panel Component
 *
 * A collapsible panel for specifying medical specialty and clinical setting
 * to improve AI code suggestion accuracy.
 *
 * @fires context-change - Fired when any option changes
 *
 * @example
 * ```html
 * <tx-context-options
 *   .context=${{ specialty: 'cardiology', setting: 'emergency' }}
 *   @context-change=${this.handleContextChange}
 * ></tx-context-options>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// Import core components
import '../../core/tx-select.js';
import type { SelectOption } from '../../core/tx-select.js';

/**
 * Context options for clinical coding
 */
export interface ContextOptions {
  specialty?: string;
  setting?: string;
}

const SPECIALTY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Not specified' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'pulmonology', label: 'Pulmonology' },
  { value: 'gastroenterology', label: 'Gastroenterology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'general', label: 'General Medicine' },
];

const SETTING_OPTIONS: SelectOption[] = [
  { value: '', label: 'Not specified' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'primary_care', label: 'Primary Care' },
];

// Unique ID generator for accessibility
let contextOptionsIdCounter = 0;
const generateId = () => `tx-context-options-${++contextOptionsIdCounter}`;

@customElement('tx-context-options')
export class TxContextOptions extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .context-panel {
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      background-color: var(--color-surface, #ffffff);
      overflow: hidden;
    }

    /* ===== HEADER ===== */

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      cursor: pointer;
      user-select: none;
      background-color: var(--color-background, #f9fafb);
      transition: background-color var(--duration-fast, 150ms) var(--easing-default);
    }

    .panel-header:hover {
      background-color: var(--color-border, #e5e7eb);
    }

    .panel-header:focus-visible {
      outline: var(--focus-ring-width, 2px) solid var(--focus-ring-color, var(--color-primary, #2563eb));
      outline-offset: -2px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .header-title {
      font-size: var(--text-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-primary, #111827);
      margin: 0;
    }

    .toggle-icon {
      width: 20px;
      height: 20px;
      color: var(--color-text-secondary, #4b5563);
      transition: transform var(--duration-fast, 150ms) var(--easing-default);
    }

    .toggle-icon.expanded {
      transform: rotate(180deg);
    }

    /* ===== CONTENT ===== */

    .panel-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height var(--duration-normal, 200ms) var(--easing-default);
    }

    .panel-content.expanded {
      max-height: 300px;
    }

    .content-inner {
      padding: var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    /* ===== GRID LAYOUT ===== */

    .options-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4, 16px);
    }

    @media (max-width: 600px) {
      .options-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ===== HELPER TEXT ===== */

    .helper-text {
      margin-top: var(--space-3, 12px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-muted, #9ca3af);
      line-height: var(--line-height-normal, 1.5);
    }

    /* ===== REDUCED MOTION ===== */

    @media (prefers-reduced-motion: reduce) {
      .panel-content,
      .toggle-icon,
      .panel-header {
        transition: none;
      }
    }
  `;

  /**
   * Current context selection
   */
  @property({ type: Object })
  context: ContextOptions = {};

  /**
   * Initial expanded state
   */
  @property({ type: Boolean })
  expanded = false;

  @state()
  private _expanded = false;

  @state()
  private _specialty = '';

  @state()
  private _setting = '';

  @state()
  private _panelId = generateId();

  @state()
  private _contentId = `${this._panelId}-content`;

  connectedCallback() {
    super.connectedCallback();
    this._expanded = this.expanded;
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('context')) {
      this._specialty = this.context.specialty ?? '';
      this._setting = this.context.setting ?? '';
    }
    if (changedProperties.has('expanded')) {
      this._expanded = this.expanded;
    }
  }

  private _togglePanel() {
    this._expanded = !this._expanded;

    // Focus first select when expanding
    if (this._expanded) {
      requestAnimationFrame(() => {
        const firstSelect = this.shadowRoot?.querySelector('tx-select') as HTMLElement;
        firstSelect?.focus();
      });
    }
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._togglePanel();
    }
  }

  private _handleSpecialtyChange(e: CustomEvent) {
    this._specialty = e.detail.value;
    this._emitContextChange();
  }

  private _handleSettingChange(e: CustomEvent) {
    this._setting = e.detail.value;
    this._emitContextChange();
  }

  private _emitContextChange() {
    const context: ContextOptions = {};

    if (this._specialty) {
      context.specialty = this._specialty;
    }
    if (this._setting) {
      context.setting = this._setting;
    }

    this.dispatchEvent(
      new CustomEvent('context-change', {
        bubbles: true,
        composed: true,
        detail: context,
      })
    );
  }

  private _renderToggleIcon() {
    return html`
      <svg
        class="toggle-icon ${this._expanded ? 'expanded' : ''}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
  }

  render() {
    const contentClasses = {
      'panel-content': true,
      expanded: this._expanded,
    };

    return html`
      <div class="context-panel">
        <div
          class="panel-header"
          role="button"
          tabindex="0"
          aria-expanded=${this._expanded}
          aria-controls=${this._contentId}
          @click=${this._togglePanel}
          @keydown=${this._handleKeyDown}
        >
          <div class="header-content">
            <h3 class="header-title">Context Options</h3>
          </div>
          ${this._renderToggleIcon()}
        </div>

        <div
          id=${this._contentId}
          class=${classMap(contentClasses)}
          aria-hidden=${!this._expanded}
        >
          <div class="content-inner">
            <div class="options-grid">
              <tx-select
                label="Specialty"
                placeholder="Not specified"
                .options=${SPECIALTY_OPTIONS}
                .value=${this._specialty}
                @change=${this._handleSpecialtyChange}
              ></tx-select>

              <tx-select
                label="Clinical Setting"
                placeholder="Not specified"
                .options=${SETTING_OPTIONS}
                .value=${this._setting}
                @change=${this._handleSettingChange}
              ></tx-select>
            </div>

            <p class="helper-text">
              Specialty options improve AI accuracy for domain-specific terminology.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

// TypeScript declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'tx-context-options': TxContextOptions;
  }
}
