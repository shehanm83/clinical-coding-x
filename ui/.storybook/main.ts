/**
 * Storybook Main Configuration
 *
 * Configures Storybook for Lit web components with Vite builder.
 * See: https://storybook.js.org/docs/configure
 */

import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  // Story file locations
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],

  // Addons for enhanced functionality
  addons: [
    '@storybook/addon-essentials', // Includes docs, controls, actions, viewport, backgrounds
    '@storybook/addon-a11y', // Accessibility testing panel
    '@storybook/addon-links', // Navigate between stories
  ],

  // Framework configuration
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },

  // Documentation settings
  docs: {
    autodocs: 'tag', // Generate docs for stories with 'autodocs' tag
    defaultName: 'Documentation',
  },

  // Static assets directory
  staticDirs: ['../public'],

  // Core configuration
  core: {
    disableTelemetry: true,
  },

  // Custom Vite configuration
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
      // Use the same CSS/Tailwind setup as the main app
      css: {
        postcss: {},
      },
      // Resolve aliases if needed
      resolve: {
        alias: {
          '@': '/src',
        },
      },
    });
  },
};

export default config;
