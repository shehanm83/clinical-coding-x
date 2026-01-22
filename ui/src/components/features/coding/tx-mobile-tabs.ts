import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * Tab configuration
 */
export interface MobileTabConfig {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

/**
 * Tab change event detail
 */
export interface TabChangeEventDetail {
  tab: string;
  previousTab: string;
}

/**
 * Mobile tab bar component for panel navigation.
 *
 * Provides a bottom-aligned tab bar for switching between panels on mobile devices.
 * Supports badges for notification counts and accessible navigation.
 *
 * @element tx-mobile-tabs
 * @fires tab-change - Fired when active tab changes
 *
 * @example
 * ```html
 * <tx-mobile-tabs
 *   .tabs=${[
 *     { id: 'terms', label: 'Terms', icon: '📋', badge: 3 },
 *     { id: 'questions', label: 'Questions', icon: '❓', badge: 2 },
 *     { id: 'ecl', label: 'ECL', icon: '📝' }
 *   ]}
 *   activeTab="terms"
 *   @tab-change=${(e) => console.log('Tab changed:', e.detail)}
 * ></tx-mobile-tabs>
 * ```
 */
@customElement('tx-mobile-tabs')
export class TxMobileTabs extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: space-around;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--space-2, 8px);
    }

    .tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-2, 8px) var(--space-4, 16px);
      background: transparent;
      border: none;
      border-radius: var(--radius-md, 8px);
      color: var(--color-text-muted, #9ca3af);
      font-family: inherit;
      font-size: var(--text-xs, 12px);
      cursor: pointer;
      transition: all var(--duration-fast, 150ms) var(--easing-default);
      position: relative;
      min-width: 64px;
    }

    .tab:hover {
      background: var(--color-background, #f9fafb);
      color: var(--color-text-secondary, #6b7280);
    }

    .tab:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: 2px;
    }

    .tab.active {
      color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, #dbeafe);
    }

    .tab-icon {
      font-size: var(--text-lg, 18px);
      line-height: 1;
    }

    .tab-label {
      font-weight: var(--font-weight-medium, 500);
    }

    .badge {
      position: absolute;
      top: 0;
      right: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: var(--color-primary, #2563eb);
      color: white;
      font-size: 10px;
      font-weight: var(--font-weight-semibold, 600);
      border-radius: var(--radius-full, 9999px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: badge-appear var(--duration-normal, 250ms) var(--easing-bounce);
    }

    .badge.pulse {
      animation: badge-pulse 2s infinite;
    }

    @keyframes badge-appear {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes badge-pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    /* Touch feedback */
    .tab:active {
      transform: scale(0.95);
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .tab,
      .badge {
        transition: none;
        animation: none;
      }
    }
  `;

  /**
   * Tab configurations
   */
  @property({ type: Array })
  tabs: MobileTabConfig[] = [];

  /**
   * Currently active tab ID
   */
  @property({ type: String })
  activeTab = '';

  /**
   * Whether to pulse badges to draw attention
   */
  @property({ type: Boolean })
  pulseBadges = false;

  private _handleTabClick(tabId: string): void {
    if (tabId === this.activeTab) return;

    const previousTab = this.activeTab;

    this.dispatchEvent(
      new CustomEvent<TabChangeEventDetail>('tab-change', {
        detail: { tab: tabId, previousTab },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleKeyDown(e: KeyboardEvent, currentIndex: number): void {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
        e.preventDefault();
        break;
      case 'ArrowRight':
        newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
        e.preventDefault();
        break;
      case 'Home':
        newIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        newIndex = this.tabs.length - 1;
        e.preventDefault();
        break;
      default:
        return;
    }

    // Focus the new tab button
    const tabButtons = this.shadowRoot?.querySelectorAll('.tab');
    (tabButtons?.[newIndex] as HTMLButtonElement)?.focus();
  }

  render() {
    return html`
      ${this.tabs.map(
        (tab, index) => html`
          <button
            class=${classMap({
              tab: true,
              active: tab.id === this.activeTab,
            })}
            role="tab"
            aria-selected=${tab.id === this.activeTab}
            aria-controls="panel-${tab.id}"
            tabindex=${tab.id === this.activeTab ? 0 : -1}
            @click=${() => this._handleTabClick(tab.id)}
            @keydown=${(e: KeyboardEvent) => this._handleKeyDown(e, index)}
          >
            ${tab.icon
              ? html`<span class="tab-icon" aria-hidden="true">${tab.icon}</span>`
              : nothing}
            <span class="tab-label">${tab.label}</span>
            ${tab.badge && tab.badge > 0
              ? html`
                  <span
                    class=${classMap({
                      badge: true,
                      pulse: this.pulseBadges,
                    })}
                    aria-label="${tab.badge} items"
                  >
                    ${tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                `
              : nothing}
          </button>
        `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-mobile-tabs': TxMobileTabs;
  }
}
