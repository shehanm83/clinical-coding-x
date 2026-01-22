/**
 * Test Setup
 *
 * Global setup for Vitest tests.
 */

// Polyfill URLPattern for @lit-labs/router (required in jsdom)
import 'urlpattern-polyfill';

// Mock matchMedia for jsdom (used by theme detection)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Import custom element definitions to register them

// Core components
import '../src/components/core/tx-button.js';
import '../src/components/core/tx-input.js';
import '../src/components/core/tx-textarea.js';
import '../src/components/core/tx-select.js';
import '../src/components/core/tx-toast.js';
import '../src/components/core/tx-toast-container.js';
import '../src/components/core/tx-alert.js';
import '../src/components/core/tx-modal.js';

// Layout components
import '../src/components/layout/tx-stack.js';
import '../src/components/layout/tx-inline.js';
import '../src/components/layout/tx-grid.js';
import '../src/components/layout/tx-container.js';
import '../src/components/layout/tx-card.js';
import '../src/components/layout/tx-divider.js';
import '../src/components/layout/tx-navbar.js';
import '../src/components/layout/tx-page-header.js';
import '../src/components/layout/tx-route-loading.js';

// App shell
import '../src/app-shell.js';

// Page components
import '../src/pages/coding/coding-page.js';
import '../src/pages/explorer/explorer-page.js';
import '../src/pages/learning/learning-page.js';
import '../src/pages/api/api-page.js';
import '../src/pages/not-found-page.js';
