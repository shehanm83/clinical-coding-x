import { Router, type RouteConfig } from '@lit-labs/router';
import { html, nothing, type ReactiveControllerHost } from 'lit';

/**
 * Route metadata for navigation and display
 */
export interface RouteMetadata {
  title: string;
  description?: string;
}

/**
 * Extended route configuration with metadata
 */
export type AppRouteConfig = RouteConfig & {
  meta?: RouteMetadata;
};

/**
 * Navigation route definition for UI
 */
export interface NavRoute {
  path: string;
  label: string;
  icon: string;
  shortcut: string;
}

/**
 * Available navigation routes for navbar
 */
export const NAV_ROUTES: NavRoute[] = [
  { path: '/', label: 'Code', icon: 'message-square', shortcut: 'Alt+1' },
  { path: '/explore', label: 'Explore', icon: 'search', shortcut: 'Alt+2' },
  { path: '/learn', label: 'Learn', icon: 'book-open', shortcut: 'Alt+3' },
  { path: '/api', label: 'API', icon: 'code', shortcut: 'Alt+4' },
];

/**
 * App title suffix
 */
const APP_TITLE_SUFFIX = 'Clinical Coding';

/**
 * Route titles for document.title updates
 */
const ROUTE_TITLES: Record<string, string> = {
  '/': 'AI Coding',
  '/code': 'AI Coding',
  '/explore': 'SNOMED Explorer',
  '/learn': 'Learning Center',
  '/api': 'API Playground',
};

/**
 * Scroll position storage for restoration
 */
const scrollPositions = new Map<string, { x: number; y: number }>();

/**
 * Save current scroll position for a path
 */
export function saveScrollPosition(path: string): void {
  scrollPositions.set(path, {
    x: window.scrollX,
    y: window.scrollY,
  });
}

/**
 * Restore scroll position for a path
 */
export function restoreScrollPosition(path: string): void {
  const position = scrollPositions.get(path);
  if (position) {
    window.scrollTo(position.x, position.y);
  } else {
    window.scrollTo(0, 0);
  }
}

/**
 * Update document title based on route
 */
export function updateDocumentTitle(path: string, dynamicPart?: string): void {
  const baseTitle = ROUTE_TITLES[path] || ROUTE_TITLES[getBasePath(path)];
  let title: string;

  if (dynamicPart) {
    title = `${dynamicPart} | ${APP_TITLE_SUFFIX}`;
  } else if (baseTitle) {
    title = `${baseTitle} | ${APP_TITLE_SUFFIX}`;
  } else {
    title = APP_TITLE_SUFFIX;
  }

  document.title = title;
}

/**
 * Get base path from a full path (e.g., /code/123 -> /code)
 */
function getBasePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? `/${parts[0]}` : '/';
}

/**
 * Extract query parameters from URL
 */
export function getQueryParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/**
 * Update URL query parameters without navigation
 */
export function updateQueryParams(
  params: Record<string, string | null>
): void {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  window.history.replaceState({}, '', url.toString());
}

/**
 * Loading state tracker for lazy-loaded routes
 */
let loadingResolver: (() => void) | null = null;
let isLoading = false;

/**
 * Signal that a route is loading
 */
export function startRouteLoading(): void {
  isLoading = true;
}

/**
 * Signal that a route has finished loading
 */
export function finishRouteLoading(): void {
  isLoading = false;
  if (loadingResolver) {
    loadingResolver();
    loadingResolver = null;
  }
}

/**
 * Check if a route is currently loading
 */
export function isRouteLoading(): boolean {
  return isLoading;
}

/**
 * Create route configuration for the application
 */
export function createRoutes(): RouteConfig[] {
  return [
    // Home redirects to /code
    {
      path: '/',
      enter: async () => {
        // Redirect to /code and re-dispatch to trigger router
        window.history.replaceState({}, '', '/code');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return false;
      },
      render: () => nothing,
    },
    // Coding page
    {
      path: '/code',
      render: () => {
        updateDocumentTitle('/code');
        return html`<coding-page></coding-page>`;
      },
      enter: async () => {
        await import('./pages/coding/coding-page.js');
        return true;
      },
    },
    // Coding page with session
    {
      path: '/code/:sessionId',
      render: ({ sessionId }) => {
        updateDocumentTitle('/code', `Session ${sessionId}`);
        return html`<coding-page .sessionId=${sessionId}></coding-page>`;
      },
      enter: async () => {
        await import('./pages/coding/coding-page.js');
        return true;
      },
    },
    // Explorer page
    {
      path: '/explore',
      render: () => {
        updateDocumentTitle('/explore');
        return html`<explorer-page></explorer-page>`;
      },
      enter: async () => {
        await import('./pages/explorer/explorer-page.js');
        return true;
      },
    },
    // Explorer with concept detail
    {
      path: '/explore/:conceptId',
      render: ({ conceptId }) => {
        updateDocumentTitle('/explore', `Concept ${conceptId}`);
        return html`<explorer-page .conceptId=${conceptId}></explorer-page>`;
      },
      enter: async () => {
        await import('./pages/explorer/explorer-page.js');
        return true;
      },
    },
    // Learning page
    {
      path: '/learn',
      render: () => {
        updateDocumentTitle('/learn');
        return html`<learning-page></learning-page>`;
      },
      enter: async () => {
        await import('./pages/learning/learning-page.js');
        return true;
      },
    },
    // API Playground page
    {
      path: '/api',
      render: () => {
        updateDocumentTitle('/api');
        return html`<api-page></api-page>`;
      },
      enter: async () => {
        await import('./pages/api/api-page.js');
        return true;
      },
    },
    // 404 Not Found - catch all
    {
      path: '/*',
      render: () => {
        updateDocumentTitle('/', 'Page Not Found');
        return html`<not-found-page></not-found-page>`;
      },
      enter: async () => {
        await import('./pages/not-found-page.js');
        return true;
      },
    },
  ];
}

/**
 * Router navigation helper for programmatic navigation
 */
export function navigateTo(
  path: string,
  options?: { replace?: boolean }
): void {
  const currentPath = window.location.pathname;

  // Save scroll position of current page
  saveScrollPosition(currentPath);

  if (options?.replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }

  // Dispatch popstate to trigger router update
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Initialize scroll restoration handling
 */
export function initScrollRestoration(): void {
  // Save scroll position on navigation
  window.addEventListener('beforeunload', () => {
    saveScrollPosition(window.location.pathname);
  });

  // Restore on popstate (back/forward)
  window.addEventListener('popstate', () => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      restoreScrollPosition(window.location.pathname);
    });
  });

  // Disable browser's built-in scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
}

/**
 * Create and configure the application router
 */
export function createRouter(host: ReactiveControllerHost & HTMLElement): Router {
  const routes = createRoutes();
  return new Router(host, routes);
}

export { Router };
