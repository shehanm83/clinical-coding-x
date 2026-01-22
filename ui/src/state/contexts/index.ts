/**
 * Context Exports
 *
 * Central export point for all application contexts.
 * Import from this file rather than individual context files.
 */

// Session context - clinical coding session state
export {
  sessionContext,
  sessionLoadingContext,
  sessionErrorContext,
  defaultSessionContext,
  type Session,
  type SessionState,
  type SessionContextValue,
  type ExtractedTerm,
  type TermMatch,
  type ConceptMatch,
  type Question,
  type QuestionOption,
  type QuestionResponse,
  type ConfirmedAttribute,
  type ECLExpression,
  type ExpressionValidation,
  type FormattedExpression,
  type SessionMetrics,
  type SessionProgress,
  type SessionError,
  type TextSpan,
  type TermModifier,
  // CCX Drilling Workflow types
  ccxSessionContext,
  defaultCcxSessionContext,
  type CcxSession,
  type CcxSessionStatus,
  type CcxSessionContextValue,
  type CcxFocusConcept,
  type CcxDrillingSummary,
  type DrillingPathEntry,
  type CcxQuestion,
  type CcxQuestionType,
  type CcxQuestionOption,
  type CcxAnsweredQuestion,
  type CcxAnswerResponse,
} from './session-context.js';

// User context - user preferences and state
export {
  userContext,
  defaultUserContext,
  defaultUserState,
  defaultPreferences,
  USER_STORAGE_KEYS,
  MAX_RECENT_SESSIONS,
  type UserState,
  type UserContextValue,
  type UserPreferences,
  type UserInfo,
  type RecentSession,
  type BookmarkedConcept,
} from './user-context.js';

// Theme context - light/dark theme state
export {
  themeContext,
  defaultThemeContext,
  defaultThemeState,
  THEME_STORAGE_KEY,
  getSystemTheme,
  resolveTheme,
  applyTheme,
  loadThemePreference,
  saveThemePreference,
  createInitialThemeState,
  subscribeToSystemTheme,
  type ThemePreference,
  type ResolvedTheme,
  type ThemeState,
  type ThemeContextValue,
} from './theme-context.js';

// Consumer utilities
export { consumeContext, type ContextType } from './consumer-utils.js';
