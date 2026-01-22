import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@components': resolve(__dirname, './src/components'),
      '@styles': resolve(__dirname, './src/styles'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@state': resolve(__dirname, './src/state'),
      '@pages': resolve(__dirname, './src/pages'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    target: 'ES2021',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'coding-page': ['./src/pages/coding/coding-page.ts'],
          'explorer-page': ['./src/pages/explorer/explorer-page.ts'],
          'learning-page': ['./src/pages/learning/learning-page.ts'],
          'api-page': ['./src/pages/api/api-page.ts'],
        },
      },
    },
  },
});
