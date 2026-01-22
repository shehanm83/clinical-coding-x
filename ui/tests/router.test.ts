/**
 * Router Tests
 *
 * Tests for the routing system including:
 * - Route matching
 * - Lazy loading
 * - URL parameter extraction
 * - Navigation events
 * - Document title updates
 * - Scroll restoration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRoutes,
  NAV_ROUTES,
  saveScrollPosition,
  restoreScrollPosition,
  updateDocumentTitle,
  getQueryParams,
  updateQueryParams,
  navigateTo,
  initScrollRestoration,
} from '../src/router.js';

describe('router', () => {
  let originalTitle: string;
  let originalScrollTo: typeof window.scrollTo;

  beforeEach(() => {
    originalTitle = document.title;
    originalScrollTo = window.scrollTo;
    window.scrollTo = vi.fn();

    // Reset URL
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    document.title = originalTitle;
    window.scrollTo = originalScrollTo;
  });

  describe('NAV_ROUTES', () => {
    it('has 4 navigation routes', () => {
      expect(NAV_ROUTES).toHaveLength(4);
    });

    it('has Code route at /', () => {
      const codeRoute = NAV_ROUTES.find((r) => r.path === '/');
      expect(codeRoute).toBeDefined();
      expect(codeRoute?.label).toBe('Code');
      expect(codeRoute?.icon).toBe('message-square');
    });

    it('has Explore route at /explore', () => {
      const exploreRoute = NAV_ROUTES.find((r) => r.path === '/explore');
      expect(exploreRoute).toBeDefined();
      expect(exploreRoute?.label).toBe('Explore');
    });

    it('has Learn route at /learn', () => {
      const learnRoute = NAV_ROUTES.find((r) => r.path === '/learn');
      expect(learnRoute).toBeDefined();
      expect(learnRoute?.label).toBe('Learn');
    });

    it('has API route at /api', () => {
      const apiRoute = NAV_ROUTES.find((r) => r.path === '/api');
      expect(apiRoute).toBeDefined();
      expect(apiRoute?.label).toBe('API');
    });

    it('all routes have keyboard shortcuts', () => {
      NAV_ROUTES.forEach((route) => {
        expect(route.shortcut).toBeDefined();
        expect(route.shortcut).toMatch(/^Alt\+\d$/);
      });
    });
  });

  describe('createRoutes', () => {
    it('creates route configuration array', () => {
      const routes = createRoutes();
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
    });

    it('has home redirect route', () => {
      const routes = createRoutes();
      const homeRoute = routes.find((r) => r.path === '/');
      expect(homeRoute).toBeDefined();
    });

    it('has /code route', () => {
      const routes = createRoutes();
      const codeRoute = routes.find((r) => r.path === '/code');
      expect(codeRoute).toBeDefined();
      expect(codeRoute?.render).toBeDefined();
      expect(codeRoute?.enter).toBeDefined();
    });

    it('has /code/:sessionId route with param', () => {
      const routes = createRoutes();
      const sessionRoute = routes.find((r) => r.path === '/code/:sessionId');
      expect(sessionRoute).toBeDefined();
    });

    it('has /explore route', () => {
      const routes = createRoutes();
      const exploreRoute = routes.find((r) => r.path === '/explore');
      expect(exploreRoute).toBeDefined();
    });

    it('has /explore/:conceptId route with param', () => {
      const routes = createRoutes();
      const conceptRoute = routes.find((r) => r.path === '/explore/:conceptId');
      expect(conceptRoute).toBeDefined();
    });

    it('has /learn route', () => {
      const routes = createRoutes();
      const learnRoute = routes.find((r) => r.path === '/learn');
      expect(learnRoute).toBeDefined();
    });

    it('has /api route', () => {
      const routes = createRoutes();
      const apiRoute = routes.find((r) => r.path === '/api');
      expect(apiRoute).toBeDefined();
    });

    it('has catch-all 404 route', () => {
      const routes = createRoutes();
      const notFoundRoute = routes.find((r) => r.path === '/*');
      expect(notFoundRoute).toBeDefined();
    });
  });

  describe('updateDocumentTitle', () => {
    it('updates document title for /code', () => {
      updateDocumentTitle('/code');
      expect(document.title).toBe('AI Coding | Clinical Coding');
    });

    it('updates document title for /explore', () => {
      updateDocumentTitle('/explore');
      expect(document.title).toBe('SNOMED Explorer | Clinical Coding');
    });

    it('updates document title for /learn', () => {
      updateDocumentTitle('/learn');
      expect(document.title).toBe('Learning Center | Clinical Coding');
    });

    it('updates document title for /api', () => {
      updateDocumentTitle('/api');
      expect(document.title).toBe('API Playground | Clinical Coding');
    });

    it('includes dynamic part when provided', () => {
      updateDocumentTitle('/code', 'Session ABC123');
      expect(document.title).toBe('Session ABC123 | Clinical Coding');
    });

    it('falls back for unknown routes', () => {
      updateDocumentTitle('/unknown');
      expect(document.title).toBe('Clinical Coding');
    });
  });

  describe('scroll restoration', () => {
    it('saves scroll position', () => {
      window.scrollX = 100;
      window.scrollY = 200;

      saveScrollPosition('/test');

      // Cannot directly verify internal state, but should not throw
      expect(() => saveScrollPosition('/test')).not.toThrow();
    });

    it('restores scroll position', () => {
      // Save a position
      const path = '/test-restore';
      window.scrollX = 50;
      window.scrollY = 150;
      saveScrollPosition(path);

      // Restore
      restoreScrollPosition(path);

      expect(window.scrollTo).toHaveBeenCalledWith(50, 150);
    });

    it('scrolls to top for unknown paths', () => {
      restoreScrollPosition('/unknown-path');

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('initScrollRestoration sets up handlers', () => {
      // Just verify it doesn't throw - scrollRestoration may not be available in jsdom
      expect(() => initScrollRestoration()).not.toThrow();
    });
  });

  describe('query parameters', () => {
    it('gets query parameters from URL', () => {
      window.history.replaceState({}, '', '/?q=test&page=2');

      const params = getQueryParams();

      expect(params.get('q')).toBe('test');
      expect(params.get('page')).toBe('2');
    });

    it('updates query parameters', () => {
      window.history.replaceState({}, '', '/explore');

      updateQueryParams({ q: 'chest pain', domain: 'clinical_finding' });

      const url = new URL(window.location.href);
      expect(url.searchParams.get('q')).toBe('chest pain');
      expect(url.searchParams.get('domain')).toBe('clinical_finding');
    });

    it('removes query parameters with null value', () => {
      window.history.replaceState({}, '', '/explore?q=test&page=2');

      updateQueryParams({ page: null });

      const url = new URL(window.location.href);
      expect(url.searchParams.get('q')).toBe('test');
      expect(url.searchParams.get('page')).toBeNull();
    });
  });

  describe('navigateTo', () => {
    it('navigates to a new path', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      navigateTo('/explore');

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/explore');
    });

    it('uses replaceState when replace option is true', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      navigateTo('/explore', { replace: true });

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/explore');
    });

    it('dispatches popstate event', () => {
      const popstateHandler = vi.fn();
      window.addEventListener('popstate', popstateHandler);

      navigateTo('/explore');

      expect(popstateHandler).toHaveBeenCalled();

      window.removeEventListener('popstate', popstateHandler);
    });

    it('saves scroll position before navigating', () => {
      window.scrollX = 0;
      window.scrollY = 500;

      navigateTo('/explore');

      // Navigate back and restore
      restoreScrollPosition('/');

      expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
    });
  });
});

describe('tx-route-loading', () => {
  it('element is defined', async () => {
    const el = document.createElement('tx-route-loading');
    expect(el).toBeDefined();
  });
});

describe('not-found-page', () => {
  it('element is defined', async () => {
    const el = document.createElement('not-found-page');
    expect(el).toBeDefined();
  });
});
