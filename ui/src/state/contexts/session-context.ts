/**
 * Session Context
 *
 * Provides clinical coding session state to descendant components via Lit Context API.
 * Based on API specifications from docs/architecture/llm-clinical-coding/07-api-specifications.md
 */

import { createContext } from '@lit/context';

/**
 * Session workflow states
 */
export type SessionState =
  | 'initial'
  | 'extracting'
  | 'matching'
  | 'confirming'
  | 'questioning'
  | 'building'
  | 'completed'
  | 'error';

/**
 * Text span for term location
 */
export interface TextSpan {
  start: number;
  end: number;
}

/**
 * Term modifier from extraction
 */
export interface TermModifier {
  type: string;
  value: string;
}

/**
 * Extracted clinical term from NLU
 */
export interface ExtractedTerm {
  text: string;
  normalized: string;
  type: 'finding' | 'body_site' | 'procedure' | 'substance' | 'qualifier';
  confidence: number;
  span: TextSpan;
  modifiers: TermModifier[];
  negated: boolean;
}

/**
 * SNOMED CT concept match
 */
export interface ConceptMatch {
  id: string;
  term: string;
  fsn: string;
  semanticTag: string;
  similarity: number;
  /** Match type: validated (direct/lexical) or related (embedding) */
  matchType?: 'validated' | 'related';
  /** Clinical hint for related concepts */
  clinicalHint?: string;
}

/**
 * Term match with concept candidates
 */
export interface TermMatch {
  termIndex: number;
  matches: ConceptMatch[];
  selectedId: string | null;
  selectedTerm?: string;
  needsConfirmation: boolean;
}

/**
 * Question option for attribute selection
 */
export interface QuestionOption {
  label: string;
  value: string;
  conceptId: string;
}

/**
 * Question for attribute clarification
 */
export interface Question {
  id: string;
  text: string;
  attributeId: string;
  attributeName: string;
  inputType: 'single_select' | 'multiple_select' | 'free_text' | 'boolean';
  options: QuestionOption[];
  required: boolean;
  relatedTermIndex: number;
  hint?: string;
}

/**
 * User response to a question
 */
export interface QuestionResponse {
  questionId: string;
  value: string | string[];
  conceptId?: string;
}

/**
 * Confirmed attribute for expression building
 */
export interface ConfirmedAttribute {
  conceptId: string;
  attributeId: string;
  attributeName: string;
  valueId: string;
  valueName: string;
  roleGroup: number;
}

/**
 * Expression validation result
 */
export interface ExpressionValidation {
  valid: boolean;
  mrcmCompliant: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Formatted expression variants
 */
export interface FormattedExpression {
  brief: string;
  long: string;
  nested: string;
}

/**
 * ECL expression result
 */
export interface ECLExpression {
  ecl: string;
  description: string;
  fsn: string;
  expressionType: 'precoordinated' | 'postcoordinated';
  validation: ExpressionValidation;
  formatted: FormattedExpression;
}

/**
 * Session processing metrics
 */
export interface SessionMetrics {
  extractionTimeMs?: number;
  matchingTimeMs?: number;
  questionGenerationTimeMs?: number;
  expressionBuildTimeMs?: number;
  totalTimeMs: number;
  llmTokensUsed: number;
}

/**
 * Session progress indicator
 */
export interface SessionProgress {
  currentStep: string;
  percentComplete: number;
}

/**
 * Session error information
 */
export interface SessionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Complete session data structure
 */
export interface Session {
  id: string;
  state: SessionState;
  originalText: string;
  context?: {
    specialty?: string;
    setting?: string;
  };
  extractedTerms: ExtractedTerm[];
  termMatches: TermMatch[];
  pendingQuestions: Question[];
  responses: QuestionResponse[];
  confirmedAttributes: ConfirmedAttribute[];
  /** Single expression (backward compat) */
  expression?: ECLExpression;
  /** All ECL expressions - industry standard: one per clinical finding */
  expressions?: ECLExpression[];
  metrics: SessionMetrics;
  progress?: SessionProgress;
  error?: SessionError;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session context value including session data and actions
 */
export interface SessionContextValue {
  /** Current session data */
  session: Session | null;
  /** Whether a session operation is in progress */
  loading: boolean;
  /** Current error if any */
  error: SessionError | null;

  // Actions
  /** Start a new coding session */
  createSession: (text: string, context?: { specialty?: string; setting?: string }) => Promise<void>;
  /** Confirm concept selections */
  confirmConcepts: (selections: { termIndex: number; conceptId: string }[]) => Promise<void>;
  /** Submit question responses */
  submitResponses: (responses: QuestionResponse[]) => Promise<void>;
  /** Skip remaining questions */
  skipQuestions: (questionIds?: string[]) => Promise<void>;
  /** Clear current session */
  clearSession: () => void;
  /** Refresh session from backend */
  refreshSession: () => Promise<void>;
}

/**
 * Default session context value
 */
export const defaultSessionContext: SessionContextValue = {
  session: null,
  loading: false,
  error: null,
  createSession: async () => {
    throw new Error('SessionContext not provided');
  },
  confirmConcepts: async () => {
    throw new Error('SessionContext not provided');
  },
  submitResponses: async () => {
    throw new Error('SessionContext not provided');
  },
  skipQuestions: async () => {
    throw new Error('SessionContext not provided');
  },
  clearSession: () => {
    throw new Error('SessionContext not provided');
  },
  refreshSession: async () => {
    throw new Error('SessionContext not provided');
  },
};

/**
 * Session context key for providing/consuming session state
 */
export const sessionContext = createContext<SessionContextValue>('session');

/**
 * Loading context for session operations
 */
export const sessionLoadingContext = createContext<boolean>('session-loading');

/**
 * Error context for session errors
 */
export const sessionErrorContext = createContext<SessionError | null>('session-error');

// ============================================================================
// CCX Drilling Workflow Types
// ============================================================================

/**
 * Focus concept - the current concept being coded (can change with drilling)
 */
export interface CcxFocusConcept {
  conceptId: string;
  conceptTerm: string;
  semanticTag: string;
  originalPhrase: string;
  depth: number;
  parentConceptId: string | null;
}

/**
 * Drilling path entry
 */
export interface DrillingPathEntry {
  conceptId: string;
  term: string;
  depth: number;
}

/**
 * Drilling summary - tracks the drilling path
 */
export interface CcxDrillingSummary {
  currentDepth: number;
  maxDepth: number;
  path: DrillingPathEntry[];
  answeredAttributes: string[];
  totalQuestionsAsked: number;
  totalQuestionsAnswered: number;
}

/**
 * Drilling question option
 */
export interface CcxQuestionOption {
  conceptId: string;
  displayText: string;
  fsn: string;
  semanticTag: string;
  preSelected: boolean;
  preSelectionSource: string;
}

/**
 * Drilling question types
 */
export type CcxQuestionType = 'specificity' | 'severity' | 'laterality' | 'temporal' | 'attribute';

/**
 * Drilling question
 */
export interface CcxQuestion {
  id: string;
  questionType: CcxQuestionType;
  priority: number;
  sourceConceptId: string;
  sourceConceptTerm: string;
  attributeId: string | null;
  attributeName: string | null;
  text: string;
  options: CcxQuestionOption[];
  eclSource: string | null;
  skipOption: boolean;
  multiSelect: boolean;
}

/**
 * Answered question record
 */
export interface CcxAnsweredQuestion {
  questionId: string;
  questionType: string;
  selectedOptions: CcxQuestionOption[];
  skipped: boolean;
  resultingAttribute: [string, string] | null;
}

/**
 * CCX Session status
 */
export type CcxSessionStatus = 'active' | 'pending_questions' | 'complete' | 'expired' | 'cancelled';

/**
 * CCX Session - the complete session with drilling support
 */
export interface CcxSession {
  sessionId: string;
  status: CcxSessionStatus;
  createdAt: string;
  updatedAt: string;
  originalText: string;
  normalizedText: string;
  currentFocus: CcxFocusConcept | null;
  drillingSummary: CcxDrillingSummary | null;
  conceptCount: number;
  pendingQuestionCount: number;
  answeredQuestionCount: number;
  nextQuestion: CcxQuestion | null;
  answeredQuestions: CcxAnsweredQuestion[];
  finalExpressions: string[];
}

/**
 * CCX Answer response
 */
export interface CcxAnswerResponse {
  valid: boolean;
  errorMessage: string | null;
  sessionId: string;
  sessionStatus: string;
  drilledDown: boolean;
  currentFocus: CcxFocusConcept | null;
  newQuestionsGenerated: number;
  answeredQuestion: CcxAnsweredQuestion | null;
  nextQuestion: CcxQuestion | null;
  finalExpressions: string[];
}

/**
 * CCX Session context value including drilling state and actions
 */
export interface CcxSessionContextValue {
  /** Current CCX session data */
  session: CcxSession | null;
  /** Whether a session operation is in progress */
  loading: boolean;
  /** Current error if any */
  error: SessionError | null;

  // Actions
  /** Start a new CCX coding session */
  createSession: (text: string) => Promise<void>;
  /** Answer the current question (may trigger drilling) */
  answerQuestion: (questionId: string, selectedOptionIds: string[], skipped?: boolean) => Promise<CcxAnswerResponse | null>;
  /** Skip the current question */
  skipQuestion: (questionId: string) => Promise<CcxAnswerResponse | null>;
  /** Clear current session */
  clearSession: () => void;
  /** Refresh session from backend */
  refreshSession: () => Promise<void>;
  /** Navigate back in drilling path */
  drillBack: () => Promise<void>;
}

/**
 * Default CCX session context value
 */
export const defaultCcxSessionContext: CcxSessionContextValue = {
  session: null,
  loading: false,
  error: null,
  createSession: async () => {
    throw new Error('CcxSessionContext not provided');
  },
  answerQuestion: async () => {
    throw new Error('CcxSessionContext not provided');
  },
  skipQuestion: async () => {
    throw new Error('CcxSessionContext not provided');
  },
  clearSession: () => {
    throw new Error('CcxSessionContext not provided');
  },
  refreshSession: async () => {
    throw new Error('CcxSessionContext not provided');
  },
  drillBack: async () => {
    throw new Error('CcxSessionContext not provided');
  },
};

/**
 * CCX Session context key for providing/consuming drilling session state
 */
export const ccxSessionContext = createContext<CcxSessionContextValue>('ccx-session');
