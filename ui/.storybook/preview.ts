/**
 * Storybook Preview Configuration
 *
 * Global decorators, parameters, and configuration for all stories.
 * See: https://storybook.js.org/docs/configure
 */

import type { Preview } from '@storybook/web-components';
import { html } from 'lit';

// Import global styles
import '../src/styles/tokens.css';

const preview: Preview = {
  // Global parameters applied to all stories
  parameters: {
    // Action handler configuration
    actions: { argTypesRegex: '^on[A-Z].*' },

    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true, // Show all controls by default
    },

    // Background options
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#F9FAFB' },
        { name: 'dark', value: '#111827' },
        { name: 'surface', value: '#FFFFFF' },
      ],
    },

    // Viewport presets
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        wide: {
          name: 'Wide Desktop',
          styles: { width: '1536px', height: '900px' },
        },
      },
    },

    // Documentation defaults
    docs: {
      toc: true, // Table of contents
    },

    // Accessibility addon configuration
    a11y: {
      // Element to test (defaults to root)
      element: '#storybook-root',
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
      // Options for axe-core
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    },
  },

  // Global decorators
  decorators: [
    // Theme decorator - applies light/dark theme
    (Story, context) => {
      const theme = context.globals.theme || 'light';

      // Apply theme to document
      document.documentElement.setAttribute('data-theme', theme);

      // Update background based on theme
      if (theme === 'dark') {
        document.body.style.backgroundColor = '#111827';
        document.body.style.color = '#F9FAFB';
      } else {
        document.body.style.backgroundColor = '#F9FAFB';
        document.body.style.color = '#111827';
      }

      return html`
        <div
          style="
            padding: var(--space-4, 16px);
            font-family: var(--font-sans);
            min-height: 100px;
          "
        >
          ${Story()}
        </div>
      `;
    },
  ],

  // Global toolbar controls
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  // Initial global values
  initialGlobals: {
    theme: 'light',
  },
};

export default preview;
