/**
 * tx-live-region - Screen Reader Announcer Component
 *
 * A utility component that provides live regions for announcing dynamic content
 * changes to screen readers. Supports both polite (status) and assertive (alert)
 * announcements.
 *
 * @example
 * ```html
 * <tx-live-region id="announcer"></tx-live-region>
 *
 * <script>
 *   document.querySelector('#announcer').announce('Form submitted successfully', 'polite');
 *   document.querySelector('#announcer').announceError('Validation failed');
 * </script>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export type AnnouncementPriority = 'polite' | 'assertive';

interface QueuedAnnouncement {
  message: string;
  priority: AnnouncementPriority;
}

@customElement('tx-live-region')
export class TxLiveRegion extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  /**
   * Current polite announcement (status updates)
   */
  @state()
  private _politeMessage = '';

  /**
   * Current assertive announcement (urgent alerts)
   */
  @state()
  private _assertiveMessage = '';

  /**
   * Queue for announcements to prevent overlapping
   */
  private _announcementQueue: QueuedAnnouncement[] = [];
  private _isProcessing = false;
  private _clearTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Announce a message to screen readers.
   *
   * @param message - The message to announce
   * @param priority - 'polite' for non-urgent updates, 'assertive' for urgent alerts
   */
  announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    this._announcementQueue.push({ message, priority });
    this._processQueue();
  }

  /**
   * Announce an error message (shorthand for assertive announcement)
   */
  announceError(message: string): void {
    this.announce(message, 'assertive');
  }

  /**
   * Announce a status update (shorthand for polite announcement)
   */
  announceStatus(message: string): void {
    this.announce(message, 'polite');
  }

  /**
   * Clear all pending announcements
   */
  clearAnnouncements(): void {
    this._announcementQueue = [];
    this._politeMessage = '';
    this._assertiveMessage = '';
    if (this._clearTimeout) {
      clearTimeout(this._clearTimeout);
      this._clearTimeout = null;
    }
    this._isProcessing = false;
  }

  /**
   * Process the announcement queue
   */
  private _processQueue(): void {
    if (this._isProcessing || this._announcementQueue.length === 0) {
      return;
    }

    this._isProcessing = true;
    const announcement = this._announcementQueue.shift();

    if (!announcement) {
      this._isProcessing = false;
      return;
    }

    // Clear previous message first to ensure screen reader announces new one
    if (announcement.priority === 'assertive') {
      this._assertiveMessage = '';
    } else {
      this._politeMessage = '';
    }

    // Use requestAnimationFrame to ensure DOM update
    requestAnimationFrame(() => {
      if (announcement.priority === 'assertive') {
        this._assertiveMessage = announcement.message;
      } else {
        this._politeMessage = announcement.message;
      }

      // Clear message after announcement to allow for repeated announcements
      this._clearTimeout = setTimeout(() => {
        this._politeMessage = '';
        this._assertiveMessage = '';
        this._isProcessing = false;

        // Process next item in queue
        if (this._announcementQueue.length > 0) {
          this._processQueue();
        }
      }, 1000);
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._clearTimeout) {
      clearTimeout(this._clearTimeout);
    }
  }

  render() {
    return html`
      <div role="status" aria-live="polite" aria-atomic="true">
        ${this._politeMessage}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        ${this._assertiveMessage}
      </div>
    `;
  }
}

// Singleton instance for global announcements
let globalAnnouncer: TxLiveRegion | null = null;

/**
 * Get or create the global live region announcer.
 * Call this function to make announcements from anywhere in the app.
 *
 * @example
 * ```typescript
 * import { getAnnouncer } from './tx-live-region';
 *
 * getAnnouncer().announce('Selection confirmed', 'polite');
 * getAnnouncer().announceError('Network error occurred');
 * ```
 */
export function getAnnouncer(): TxLiveRegion {
  if (!globalAnnouncer) {
    globalAnnouncer = document.createElement('tx-live-region') as TxLiveRegion;
    globalAnnouncer.id = 'tx-global-announcer';
    document.body.appendChild(globalAnnouncer);
  }
  return globalAnnouncer;
}

/**
 * Convenience function to announce a message
 */
export function announce(message: string, priority: AnnouncementPriority = 'polite'): void {
  getAnnouncer().announce(message, priority);
}

/**
 * Convenience function to announce an error
 */
export function announceError(message: string): void {
  getAnnouncer().announceError(message);
}

/**
 * Convenience function to announce a status update
 */
export function announceStatus(message: string): void {
  getAnnouncer().announceStatus(message);
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-live-region': TxLiveRegion;
  }
}
