/**
 * User Context Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  userContext,
  defaultUserContext,
  defaultUserState,
  defaultPreferences,
  USER_STORAGE_KEYS,
  MAX_RECENT_SESSIONS,
  type UserState,
  type UserPreferences,
  type RecentSession,
  type BookmarkedConcept,
} from '../../../src/state/contexts/user-context.js';

describe('user-context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('context creation', () => {
    it('exports userContext', () => {
      expect(userContext).toBeDefined();
    });
  });

  describe('defaultPreferences', () => {
    it('has expressionFormat set to long', () => {
      expect(defaultPreferences.expressionFormat).toBe('long');
    });

    it('has showConfidenceScores enabled', () => {
      expect(defaultPreferences.showConfidenceScores).toBe(true);
    });

    it('has keyboardShortcuts enabled', () => {
      expect(defaultPreferences.keyboardShortcuts).toBe(true);
    });

    it('has autoExpandDetails disabled', () => {
      expect(defaultPreferences.autoExpandDetails).toBe(false);
    });

    it('has undefined defaultDomain', () => {
      expect(defaultPreferences.defaultDomain).toBeUndefined();
    });
  });

  describe('defaultUserState', () => {
    it('has isAuthenticated false', () => {
      expect(defaultUserState.isAuthenticated).toBe(false);
    });

    it('has null user', () => {
      expect(defaultUserState.user).toBeNull();
    });

    it('has default preferences', () => {
      expect(defaultUserState.preferences).toEqual(defaultPreferences);
    });

    it('has empty recentSessions', () => {
      expect(defaultUserState.recentSessions).toEqual([]);
    });

    it('has empty bookmarkedConcepts', () => {
      expect(defaultUserState.bookmarkedConcepts).toEqual([]);
    });
  });

  describe('defaultUserContext', () => {
    it('has default state', () => {
      expect(defaultUserContext.state).toEqual(defaultUserState);
    });

    it('has action methods that throw when not provided', () => {
      expect(() => defaultUserContext.updatePreferences({})).toThrow('UserContext not provided');
      expect(() => defaultUserContext.resetPreferences()).toThrow('UserContext not provided');
      expect(() => defaultUserContext.addRecentSession({} as RecentSession)).toThrow(
        'UserContext not provided'
      );
      expect(() => defaultUserContext.removeRecentSession('id')).toThrow(
        'UserContext not provided'
      );
      expect(() => defaultUserContext.clearRecentSessions()).toThrow('UserContext not provided');
      expect(() => defaultUserContext.addBookmark({} as BookmarkedConcept)).toThrow(
        'UserContext not provided'
      );
      expect(() => defaultUserContext.removeBookmark('id')).toThrow('UserContext not provided');
      expect(() => defaultUserContext.isBookmarked('id')).toThrow('UserContext not provided');
    });
  });

  describe('storage keys', () => {
    it('has preferences key', () => {
      expect(USER_STORAGE_KEYS.preferences).toBe('tx-user-prefs');
    });

    it('has recentSessions key', () => {
      expect(USER_STORAGE_KEYS.recentSessions).toBe('tx-recent-sessions');
    });

    it('has bookmarks key', () => {
      expect(USER_STORAGE_KEYS.bookmarks).toBe('tx-bookmarks');
    });
  });

  describe('constants', () => {
    it('MAX_RECENT_SESSIONS is 10', () => {
      expect(MAX_RECENT_SESSIONS).toBe(10);
    });
  });

  describe('type definitions', () => {
    it('UserPreferences interface has required properties', () => {
      const prefs: UserPreferences = {
        defaultDomain: 'clinical_finding',
        expressionFormat: 'brief',
        autoExpandDetails: true,
        showConfidenceScores: false,
        keyboardShortcuts: true,
      };

      expect(prefs.defaultDomain).toBe('clinical_finding');
      expect(prefs.expressionFormat).toBe('brief');
    });

    it('RecentSession interface has required properties', () => {
      const session: RecentSession = {
        id: 'session-1',
        originalText: 'test text',
        state: 'completed',
        createdAt: new Date().toISOString(),
        expressionPreview: '12345 |Test|',
      };

      expect(session.id).toBe('session-1');
      expect(session.state).toBe('completed');
    });

    it('BookmarkedConcept interface has required properties', () => {
      const bookmark: BookmarkedConcept = {
        id: '12345',
        term: 'Chest pain',
        fsn: 'Chest pain (finding)',
        semanticTag: 'finding',
        bookmarkedAt: new Date().toISOString(),
      };

      expect(bookmark.id).toBe('12345');
      expect(bookmark.term).toBe('Chest pain');
      expect(bookmark.semanticTag).toBe('finding');
    });

    it('UserState interface has required properties', () => {
      const state: UserState = {
        isAuthenticated: true,
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        preferences: defaultPreferences,
        recentSessions: [],
        bookmarkedConcepts: [],
      };

      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe('Test User');
    });
  });
});
