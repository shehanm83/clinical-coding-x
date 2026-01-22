/**
 * Context Consumer Utilities
 *
 * Helper utilities for consuming contexts in Lit components.
 * Provides convenient patterns for context consumption.
 */

import { consume } from '@lit/context';
import type { Context } from '@lit/context';

/**
 * Re-export the consume decorator for convenience
 *
 * Usage in a component:
 * ```typescript
 * import { consumeContext, sessionContext } from '../state/contexts';
 *
 * class MyComponent extends LitElement {
 *   @consumeContext({ context: sessionContext, subscribe: true })
 *   sessionCtx?: SessionContextValue;
 * }
 * ```
 */
export { consume as consumeContext };

/**
 * Type helper for extracting context value type
 */
export type ContextType<C> = C extends Context<unknown, infer T> ? T : never;

/**
 * Example usage patterns for context consumption
 *
 * ## Basic Usage with @consume decorator
 *
 * The recommended way to consume contexts is using the @consume decorator
 * with subscribe: true to automatically receive updates.
 *
 * ```typescript
 * import { LitElement, html } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 * import { consume } from '@lit/context';
 * import { sessionContext, type SessionContextValue } from '../state/contexts';
 *
 * @customElement('my-component')
 * export class MyComponent extends LitElement {
 *   // Subscribe to session context updates
 *   @consume({ context: sessionContext, subscribe: true })
 *   sessionCtx?: SessionContextValue;
 *
 *   render() {
 *     const session = this.sessionCtx?.session;
 *     if (!session) {
 *       return html`<div>No active session</div>`;
 *     }
 *     return html`
 *       <div>Session: ${session.id}</div>
 *       <div>State: ${session.state}</div>
 *     `;
 *   }
 * }
 * ```
 *
 * ## Consuming Multiple Contexts
 *
 * ```typescript
 * import { consume } from '@lit/context';
 * import {
 *   sessionContext,
 *   themeContext,
 *   userContext,
 *   type SessionContextValue,
 *   type ThemeContextValue,
 *   type UserContextValue,
 * } from '../state/contexts';
 *
 * @customElement('multi-context-component')
 * export class MultiContextComponent extends LitElement {
 *   @consume({ context: sessionContext, subscribe: true })
 *   sessionCtx?: SessionContextValue;
 *
 *   @consume({ context: themeContext, subscribe: true })
 *   themeCtx?: ThemeContextValue;
 *
 *   @consume({ context: userContext, subscribe: true })
 *   userCtx?: UserContextValue;
 *
 *   render() {
 *     return html`
 *       <div class="theme-${this.themeCtx?.state.resolved}">
 *         <p>Session: ${this.sessionCtx?.session?.id ?? 'none'}</p>
 *         <p>Recent: ${this.userCtx?.state.recentSessions.length} sessions</p>
 *       </div>
 *     `;
 *   }
 * }
 * ```
 *
 * ## Using Context Actions
 *
 * ```typescript
 * @customElement('session-creator')
 * export class SessionCreator extends LitElement {
 *   @consume({ context: sessionContext, subscribe: true })
 *   sessionCtx?: SessionContextValue;
 *
 *   private async _handleSubmit(e: Event) {
 *     e.preventDefault();
 *     const form = e.target as HTMLFormElement;
 *     const text = new FormData(form).get('text') as string;
 *
 *     try {
 *       await this.sessionCtx?.createSession(text);
 *     } catch (error) {
 *       console.error('Failed to create session:', error);
 *     }
 *   }
 *
 *   render() {
 *     return html`
 *       <form @submit=${this._handleSubmit}>
 *         <textarea name="text" required></textarea>
 *         <button type="submit" ?disabled=${this.sessionCtx?.loading}>
 *           ${this.sessionCtx?.loading ? 'Creating...' : 'Create Session'}
 *         </button>
 *       </form>
 *       ${this.sessionCtx?.error
 *         ? html`<div class="error">${this.sessionCtx.error.message}</div>`
 *         : null}
 *     `;
 *   }
 * }
 * ```
 *
 * ## Theme Toggle Example
 *
 * ```typescript
 * @customElement('theme-toggle')
 * export class ThemeToggle extends LitElement {
 *   @consume({ context: themeContext, subscribe: true })
 *   themeCtx?: ThemeContextValue;
 *
 *   render() {
 *     const { preference, resolved } = this.themeCtx?.state ?? { preference: 'system', resolved: 'light' };
 *
 *     return html`
 *       <button @click=${() => this.themeCtx?.toggleTheme()}>
 *         ${resolved === 'light' ? '🌙' : '☀️'}
 *       </button>
 *       <select
 *         @change=${(e: Event) => {
 *           const value = (e.target as HTMLSelectElement).value as ThemePreference;
 *           this.themeCtx?.setTheme(value);
 *         }}
 *       >
 *         <option value="light" ?selected=${preference === 'light'}>Light</option>
 *         <option value="dark" ?selected=${preference === 'dark'}>Dark</option>
 *         <option value="system" ?selected=${preference === 'system'}>System</option>
 *       </select>
 *     `;
 *   }
 * }
 * ```
 *
 * ## Notes
 *
 * 1. Always use `subscribe: true` to receive context updates
 * 2. Context values are optional until the component connects to a provider
 * 3. Use optional chaining (?.) when accessing context values in render
 * 4. Contexts update automatically when provider values change
 * 5. Components will re-render when subscribed context values change
 */
