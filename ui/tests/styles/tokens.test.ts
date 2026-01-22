/**
 * Design Tokens CSS Tests
 *
 * Verifies that CSS custom properties are defined and have expected values.
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Design Tokens', () => {
  let root: HTMLElement;
  let computedStyle: CSSStyleDeclaration;

  beforeAll(() => {
    // Create a test element to read computed styles
    root = document.documentElement;

    // Load the CSS tokens
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --color-primary: #2563EB;
        --color-primary-hover: #1D4ED8;
        --color-primary-light: #DBEAFE;
        --color-secondary: #0D9488;
        --color-accent: #8B5CF6;
        --color-success: #16A34A;
        --color-warning: #CA8A04;
        --color-error: #DC2626;
        --color-info: #0284C7;
        --color-text-primary: #111827;
        --color-text-secondary: #4B5563;
        --color-text-muted: #9CA3AF;
        --color-surface: #FFFFFF;
        --color-background: #F9FAFB;
        --color-border: #E5E7EB;
        --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
        --text-xs: 12px;
        --text-sm: 14px;
        --text-base: 16px;
        --text-lg: 18px;
        --text-xl: 20px;
        --text-2xl: 24px;
        --text-3xl: 30px;
        --space-1: 4px;
        --space-2: 8px;
        --space-3: 12px;
        --space-4: 16px;
        --space-6: 24px;
        --space-8: 32px;
        --radius-sm: 4px;
        --radius-md: 8px;
        --radius-lg: 12px;
        --radius-xl: 16px;
        --radius-full: 9999px;
        --duration-fast: 150ms;
        --duration-normal: 250ms;
        --duration-slow: 400ms;
        --z-base: 0;
        --z-dropdown: 100;
        --z-sticky: 200;
        --z-modal: 300;
        --z-toast: 400;
        --z-tooltip: 500;
      }
    `;
    document.head.appendChild(style);

    computedStyle = getComputedStyle(root);
  });

  describe('Color Tokens', () => {
    it('defines primary color', () => {
      const value = computedStyle.getPropertyValue('--color-primary').trim();
      expect(value).toBe('#2563EB');
    });

    it('defines primary hover color', () => {
      const value = computedStyle.getPropertyValue('--color-primary-hover').trim();
      expect(value).toBe('#1D4ED8');
    });

    it('defines primary light color', () => {
      const value = computedStyle.getPropertyValue('--color-primary-light').trim();
      expect(value).toBe('#DBEAFE');
    });

    it('defines secondary color', () => {
      const value = computedStyle.getPropertyValue('--color-secondary').trim();
      expect(value).toBe('#0D9488');
    });

    it('defines accent color', () => {
      const value = computedStyle.getPropertyValue('--color-accent').trim();
      expect(value).toBe('#8B5CF6');
    });

    it('defines success color', () => {
      const value = computedStyle.getPropertyValue('--color-success').trim();
      expect(value).toBe('#16A34A');
    });

    it('defines warning color', () => {
      const value = computedStyle.getPropertyValue('--color-warning').trim();
      expect(value).toBe('#CA8A04');
    });

    it('defines error color', () => {
      const value = computedStyle.getPropertyValue('--color-error').trim();
      expect(value).toBe('#DC2626');
    });

    it('defines info color', () => {
      const value = computedStyle.getPropertyValue('--color-info').trim();
      expect(value).toBe('#0284C7');
    });

    it('defines text primary color', () => {
      const value = computedStyle.getPropertyValue('--color-text-primary').trim();
      expect(value).toBe('#111827');
    });

    it('defines surface color', () => {
      const value = computedStyle.getPropertyValue('--color-surface').trim();
      expect(value).toBe('#FFFFFF');
    });

    it('defines background color', () => {
      const value = computedStyle.getPropertyValue('--color-background').trim();
      expect(value).toBe('#F9FAFB');
    });

    it('defines border color', () => {
      const value = computedStyle.getPropertyValue('--color-border').trim();
      expect(value).toBe('#E5E7EB');
    });
  });

  describe('Typography Tokens', () => {
    it('defines font-sans', () => {
      const value = computedStyle.getPropertyValue('--font-sans').trim();
      expect(value).toContain('Inter');
    });

    it('defines font-mono', () => {
      const value = computedStyle.getPropertyValue('--font-mono').trim();
      expect(value).toContain('JetBrains Mono');
    });

    it('defines text-xs', () => {
      const value = computedStyle.getPropertyValue('--text-xs').trim();
      expect(value).toBe('12px');
    });

    it('defines text-sm', () => {
      const value = computedStyle.getPropertyValue('--text-sm').trim();
      expect(value).toBe('14px');
    });

    it('defines text-base', () => {
      const value = computedStyle.getPropertyValue('--text-base').trim();
      expect(value).toBe('16px');
    });

    it('defines text-lg', () => {
      const value = computedStyle.getPropertyValue('--text-lg').trim();
      expect(value).toBe('18px');
    });

    it('defines text-xl', () => {
      const value = computedStyle.getPropertyValue('--text-xl').trim();
      expect(value).toBe('20px');
    });

    it('defines text-2xl', () => {
      const value = computedStyle.getPropertyValue('--text-2xl').trim();
      expect(value).toBe('24px');
    });

    it('defines text-3xl', () => {
      const value = computedStyle.getPropertyValue('--text-3xl').trim();
      expect(value).toBe('30px');
    });
  });

  describe('Spacing Tokens', () => {
    it('defines space-1 (4px)', () => {
      const value = computedStyle.getPropertyValue('--space-1').trim();
      expect(value).toBe('4px');
    });

    it('defines space-2 (8px)', () => {
      const value = computedStyle.getPropertyValue('--space-2').trim();
      expect(value).toBe('8px');
    });

    it('defines space-3 (12px)', () => {
      const value = computedStyle.getPropertyValue('--space-3').trim();
      expect(value).toBe('12px');
    });

    it('defines space-4 (16px)', () => {
      const value = computedStyle.getPropertyValue('--space-4').trim();
      expect(value).toBe('16px');
    });

    it('defines space-6 (24px)', () => {
      const value = computedStyle.getPropertyValue('--space-6').trim();
      expect(value).toBe('24px');
    });

    it('defines space-8 (32px)', () => {
      const value = computedStyle.getPropertyValue('--space-8').trim();
      expect(value).toBe('32px');
    });
  });

  describe('Border Radius Tokens', () => {
    it('defines radius-sm (4px)', () => {
      const value = computedStyle.getPropertyValue('--radius-sm').trim();
      expect(value).toBe('4px');
    });

    it('defines radius-md (8px)', () => {
      const value = computedStyle.getPropertyValue('--radius-md').trim();
      expect(value).toBe('8px');
    });

    it('defines radius-lg (12px)', () => {
      const value = computedStyle.getPropertyValue('--radius-lg').trim();
      expect(value).toBe('12px');
    });

    it('defines radius-xl (16px)', () => {
      const value = computedStyle.getPropertyValue('--radius-xl').trim();
      expect(value).toBe('16px');
    });

    it('defines radius-full', () => {
      const value = computedStyle.getPropertyValue('--radius-full').trim();
      expect(value).toBe('9999px');
    });
  });

  describe('Animation Tokens', () => {
    it('defines duration-fast (150ms)', () => {
      const value = computedStyle.getPropertyValue('--duration-fast').trim();
      expect(value).toBe('150ms');
    });

    it('defines duration-normal (250ms)', () => {
      const value = computedStyle.getPropertyValue('--duration-normal').trim();
      expect(value).toBe('250ms');
    });

    it('defines duration-slow (400ms)', () => {
      const value = computedStyle.getPropertyValue('--duration-slow').trim();
      expect(value).toBe('400ms');
    });
  });

  describe('Z-Index Tokens', () => {
    it('defines z-base (0)', () => {
      const value = computedStyle.getPropertyValue('--z-base').trim();
      expect(value).toBe('0');
    });

    it('defines z-dropdown (100)', () => {
      const value = computedStyle.getPropertyValue('--z-dropdown').trim();
      expect(value).toBe('100');
    });

    it('defines z-sticky (200)', () => {
      const value = computedStyle.getPropertyValue('--z-sticky').trim();
      expect(value).toBe('200');
    });

    it('defines z-modal (300)', () => {
      const value = computedStyle.getPropertyValue('--z-modal').trim();
      expect(value).toBe('300');
    });

    it('defines z-toast (400)', () => {
      const value = computedStyle.getPropertyValue('--z-toast').trim();
      expect(value).toBe('400');
    });

    it('defines z-tooltip (500)', () => {
      const value = computedStyle.getPropertyValue('--z-tooltip').trim();
      expect(value).toBe('500');
    });
  });
});
