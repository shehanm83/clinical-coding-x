/**
 * NotFoundPage Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import type { NotFoundPage } from '../../src/pages/not-found-page.js';

describe('not-found-page', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.history.replaceState({}, '', '/unknown-path');
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    window.history.replaceState({}, '', '/');
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('not-found-page');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      expect(el.shadowRoot).toBeDefined();
    });

    it('displays 404 error code', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const errorCode = el.shadowRoot?.querySelector('.error-code');

      expect(errorCode?.textContent).toBe('404');
    });

    it('displays "Page Not Found" heading', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const heading = el.shadowRoot?.querySelector('h1');

      expect(heading?.textContent).toBe('Page Not Found');
    });

    it('displays helpful message', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      // Get the paragraph after h1 (skip the error-code paragraph)
      const message = el.shadowRoot?.querySelector('.container > p:not(.error-code)');

      expect(message?.textContent).toContain("doesn't exist");
    });
  });

  describe('navigation buttons', () => {
    it('renders Go to Home button', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const homeButton = el.shadowRoot?.querySelector('.btn-primary');

      expect(homeButton?.textContent?.trim()).toContain('Go to Home');
    });

    it('renders Go Back button', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const backButton = el.shadowRoot?.querySelector('.btn-secondary');

      expect(backButton?.textContent?.trim()).toContain('Go Back');
    });

    it('home button has proper aria-label', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const homeButton = el.shadowRoot?.querySelector('.btn-primary');

      expect(homeButton?.getAttribute('aria-label')).toBe('Go to home page');
    });

    it('back button has proper aria-label', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const backButton = el.shadowRoot?.querySelector('.btn-secondary');

      expect(backButton?.getAttribute('aria-label')).toBe('Go back to previous page');
    });

    it('home button navigates to /', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      const homeButton = el.shadowRoot?.querySelector('.btn-primary') as HTMLButtonElement;

      homeButton.click();

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/');
    });
  });

  describe('suggestions', () => {
    it('renders suggestions section', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const suggestions = el.shadowRoot?.querySelector('.suggestions');

      expect(suggestions).toBeDefined();
    });

    it('renders suggestion links', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const links = el.shadowRoot?.querySelectorAll('.suggestions-list a');

      expect(links?.length).toBe(4);
    });

    it('has link to AI Coding', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const codeLink = el.shadowRoot?.querySelector('.suggestions-list a[href="/code"]');

      expect(codeLink?.textContent?.trim()).toBe('AI Coding');
    });

    it('has link to SNOMED Explorer', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const exploreLink = el.shadowRoot?.querySelector('.suggestions-list a[href="/explore"]');

      expect(exploreLink?.textContent?.trim()).toBe('SNOMED Explorer');
    });

    it('has link to Learning Center', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const learnLink = el.shadowRoot?.querySelector('.suggestions-list a[href="/learn"]');

      expect(learnLink?.textContent?.trim()).toBe('Learning Center');
    });

    it('has link to API Playground', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const apiLink = el.shadowRoot?.querySelector('.suggestions-list a[href="/api"]');

      expect(apiLink?.textContent?.trim()).toBe('API Playground');
    });

    it('suggestion links navigate programmatically', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      const exploreLink = el.shadowRoot?.querySelector(
        '.suggestions-list a[href="/explore"]'
      ) as HTMLAnchorElement;

      exploreLink.click();

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/explore');
    });
  });

  describe('logging', () => {
    it('logs 404 error on connect', async () => {
      await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[404]');
    });

    it('logs current path', async () => {
      window.history.replaceState({}, '', '/some/bad/path');
      await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

      expect(consoleWarnSpy.mock.calls[0][0]).toContain('/some/bad/path');
    });
  });

  describe('accessibility', () => {
    it('buttons are focusable', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const buttons = el.shadowRoot?.querySelectorAll('button');

      buttons?.forEach((button) => {
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('links are focusable', async () => {
      const el = await fixture<NotFoundPage>(
        html`<not-found-page></not-found-page>`
      );

      const links = el.shadowRoot?.querySelectorAll('a');

      links?.forEach((link) => {
        expect(link.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
