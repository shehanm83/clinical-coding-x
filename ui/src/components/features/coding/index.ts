/**
 * Clinical Coding Feature Components
 *
 * Components for the clinical coding interface.
 */

// Clinical input component
export { TxClinicalInput } from './tx-clinical-input.js';
export type { ClinicalInputEvent } from './tx-clinical-input.js';

// Context options component
export { TxContextOptions } from './tx-context-options.js';
export type { ContextOptions } from './tx-context-options.js';

// Progress stepper component
export { TxProgressStepper } from './tx-progress-stepper.js';
export type { StepId, StepDefinition, StepState } from './tx-progress-stepper.js';

// Processing indicator component
export { TxProcessingIndicator } from './tx-processing-indicator.js';
export type { ProcessingState } from './tx-processing-indicator.js';

// Term card skeleton component
export { TxTermCardSkeleton } from './tx-term-card-skeleton.js';

// Term card component
export { TxTermCard } from './tx-term-card.js';
export type { ExtractedTerm, ConceptMatch } from './tx-term-card.js';

// Extracted terms panel component
export { TxExtractedTerms } from './tx-extracted-terms.js';
export type { TermMatchResult } from './tx-extracted-terms.js';

// Concept selector modal component
export { TxConceptSelector } from './tx-concept-selector.js';
export type { ConceptExplanation } from './tx-concept-selector.js';

// Question card component
export { TxQuestionCard } from './tx-question-card.js';
export type { Question, QuestionOption, QuestionAnswer } from './tx-question-card.js';

// Refinement panel component
export { TxRefinementPanel } from './tx-refinement-panel.js';
export type { AnsweredQuestion } from './tx-refinement-panel.js';

// Expression preview component
export { TxExpressionPreview } from './tx-expression-preview.js';
export type {
  ECLExpression,
  ExpressionFormat,
  ValidationMessage,
} from './tx-expression-preview.js';

// Session actions component
export { TxSessionActions } from './tx-session-actions.js';
export type { SessionState } from './tx-session-actions.js';

// Completion modal component
export { TxCompletionModal } from './tx-completion-modal.js';
export type { CompletedExpression, SessionMetrics } from './tx-completion-modal.js';

// Session history sidebar component
export { TxSessionHistory } from './tx-session-history.js';
export type { SessionSummary, SessionStatus } from './tx-session-history.js';

// Mobile components
export { TxMobileTabs } from './tx-mobile-tabs.js';
export type { MobileTabConfig, TabChangeEventDetail } from './tx-mobile-tabs.js';

export { TxBottomDrawer } from './tx-bottom-drawer.js';

export { TxFab } from './tx-fab.js';
export type { FabAction } from './tx-fab.js';

// Two-tier results component (Direct Matches + Related Concepts)
export { TxTwoTierResults } from './tx-two-tier-results.js';
export type {
  ValidatedMatch,
  RelatedConcept,
  ConceptSelectDetail,
} from './tx-two-tier-results.js';

// Tree traversal question component
export { TxTraversalQuestion } from './tx-traversal-question.js';
export type {
  QuestionType,
  QuestionOption as TraversalQuestionOption,
  TraversalQuestion,
  OptionSelectDetail,
} from './tx-traversal-question.js';

// CCX Drilling Workflow Components
export { TxDrillingBreadcrumb } from './tx-drilling-breadcrumb.js';
export { TxFocusPanel } from './tx-focus-panel.js';
export { TxCcxQuestionCard } from './tx-ccx-question-card.js';
export type { CcxQuestionAnswer } from './tx-ccx-question-card.js';

// ECL Query Panel
export { TxEclPanel } from './tx-ecl-panel.js';
export type { EclResultConcept, EclExecutionResult } from './tx-ecl-panel.js';
