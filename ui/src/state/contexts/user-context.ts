/**
 * User Context
 *
 * Provides user state and preferences to descendant components via Lit Context API.
 */

import { createContext } from '@lit/context';

/**
 * User preferences for the application
 */
export interface UserPreferences {
  /** Default SNOMED CT domain for searches */
  defaultDomain?: string;
  /** Preferred expression format */
  expressionFormat?: 'brief' | 'long' | 'nested';
  /** Auto-expand concept details */
  autoExpandDetails?: boolean;
  /** Show confidence scores */
  showConfidenceScores?: boolean;
  /** Enable keyboard shortcuts */
  keyboardShortcuts?: boolean;
}

/**
 * Recent session reference
 */
export interface RecentSession {
  id: string;
  originalText: string;
  state: string;
  createdAt: string;
  expressionPreview?: string;
}

/**
 * Bookmarked concept reference
 */
export interface BookmarkedConcept {
  id: string;
  term: string;
  fsn: string;
  semanticTag: string;
  bookmarkedAt: string;
}

/**
 * User information (for future authentication)
 */
export interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
}

/**
 * Complete user state
 */
export interface UserState {
  /** Whether user is authenticated (always false for v1.0) */
  isAuthenticated: boolean;
  /** User information if authenticated */
  user: UserInfo | null;
  /** User preferences */
  preferences: UserPreferences;
  /** Recent coding sessions */
  recentSessions: RecentSession[];
  /** Bookmarked concepts */
  bookmarkedConcepts: BookmarkedConcept[];
}

/**
 * User context value including state and actions
 */
export interface UserContextValue {
  /** Current user state */
  state: UserState;

  // Preference actions
  /** Update user preferences */
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  /** Reset preferences to defaults */
  resetPreferences: () => void;

  // Recent sessions actions
  /** Add a session to recent list */
  addRecentSession: (session: RecentSession) => void;
  /** Remove a session from recent list */
  removeRecentSession: (sessionId: string) => void;
  /** Clear all recent sessions */
  clearRecentSessions: () => void;

  // Bookmark actions
  /** Add a concept to bookmarks */
  addBookmark: (concept: BookmarkedConcept) => void;
  /** Remove a concept from bookmarks */
  removeBookmark: (conceptId: string) => void;
  /** Check if concept is bookmarked */
  isBookmarked: (conceptId: string) => boolean;
}

/**
 * Default user preferences
 */
export const defaultPreferences: UserPreferences = {
  defaultDomain: undefined,
  expressionFormat: 'long',
  autoExpandDetails: false,
  showConfidenceScores: true,
  keyboardShortcuts: true,
};

/**
 * Default user state
 */
export const defaultUserState: UserState = {
  isAuthenticated: false,
  user: null,
  preferences: defaultPreferences,
  recentSessions: [],
  bookmarkedConcepts: [],
};

/**
 * Default user context value
 */
export const defaultUserContext: UserContextValue = {
  state: defaultUserState,
  updatePreferences: () => {
    throw new Error('UserContext not provided');
  },
  resetPreferences: () => {
    throw new Error('UserContext not provided');
  },
  addRecentSession: () => {
    throw new Error('UserContext not provided');
  },
  removeRecentSession: () => {
    throw new Error('UserContext not provided');
  },
  clearRecentSessions: () => {
    throw new Error('UserContext not provided');
  },
  addBookmark: () => {
    throw new Error('UserContext not provided');
  },
  removeBookmark: () => {
    throw new Error('UserContext not provided');
  },
  isBookmarked: () => {
    throw new Error('UserContext not provided');
  },
};

/**
 * User context key for providing/consuming user state
 */
export const userContext = createContext<UserContextValue>('user');

/**
 * localStorage keys for user data persistence
 */
export const USER_STORAGE_KEYS = {
  preferences: 'tx-user-prefs',
  recentSessions: 'tx-recent-sessions',
  bookmarks: 'tx-bookmarks',
} as const;

/**
 * Maximum number of recent sessions to store
 */
export const MAX_RECENT_SESSIONS = 10;
