/**
 * API Service
 *
 * Typed fetch wrapper with error handling, retry logic, and request/response interceptors.
 * Based on API specifications from docs/architecture/llm-clinical-coding/07-api-specifications.md
 */

import type {
  Session,
  ExtractedTerm,
  TermMatch,
  Question,
  QuestionResponse,
  ECLExpression,
  SessionMetrics,
} from '../state/contexts/session-context.js';

// ============================================================================
// Configuration
// ============================================================================

/** Base URL for API requests - proxied by Vite in development */
const API_BASE_URL = '/api/v1';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 30000;

/** Extended timeout for operations that involve LLM calls (question generation) */
const EXTENDED_TIMEOUT_MS = 120000;

/** Default retry configuration */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// ============================================================================
// Types
// ============================================================================

/**
 * API error codes from backend
 */
export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_STATE'
  | 'NOT_COMPLETED'
  | 'EXTRACTION_FAILED'
  | 'SEARCH_FAILED'
  | 'BUILD_FAILED'
  | 'MRCM_VALIDATION_FAILED'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId?: string;
  };
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 0,
    public readonly details?: Record<string, unknown>,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'TIMEOUT' ||
      this.code === 'SERVICE_UNAVAILABLE' ||
      this.code === 'RATE_LIMITED'
    );
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

/**
 * Request options extending fetch RequestInit
 */
export interface ApiRequestOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
  retry?: Partial<RetryConfig> | boolean;
}

/**
 * Create session request body
 */
export interface CreateSessionRequest {
  text: string;
  context?: {
    specialty?: string;
    setting?: string;
  };
}

/**
 * Create session response
 */
export interface CreateSessionResponse {
  session_id: string;
  state: string;
  created_at: string;
  message: string;
}

/**
 * Session response from API (snake_case)
 */
export interface SessionApiResponse {
  session_id: string;
  state: string;
  created_at: string;
  updated_at: string;
  original_text: string;
  context?: {
    specialty?: string;
    setting?: string;
  };
  extracted_terms?: ExtractedTermApiResponse[];
  term_matches?: TermMatchApiResponse[];
  pending_questions?: QuestionApiResponse[];
  responses?: QuestionResponseApiResponse[];
  confirmed_attributes?: ConfirmedAttributeApiResponse[];
  /** Single expression (backward compat) */
  expression?: ECLExpressionApiResponse;
  /** All ECL expressions - industry standard: one per clinical finding */
  expressions?: ECLExpressionApiResponse[];
  metrics?: SessionMetricsApiResponse;
  progress?: SessionProgressApiResponse;
}

/** API response for extracted term (snake_case) */
interface ExtractedTermApiResponse {
  text: string;
  normalized: string;
  type: string;
  confidence: number;
  span: { start: number; end: number };
  modifiers: { type: string; value: string }[];
  negated: boolean;
}

/** API response for term match (snake_case) */
interface TermMatchApiResponse {
  term_index: number;
  matches: {
    id: string;
    term: string;
    fsn: string;
    semantic_tag: string;
    similarity: number;
    match_type?: string;
    clinical_hint?: string;
  }[];
  selected_id: string | null;
  selected_term?: string;
  needs_confirmation: boolean;
}

/** API response for question (snake_case) */
interface QuestionApiResponse {
  id: string;
  text: string;
  attribute_id: string;
  attribute_name: string;
  input_type: string;
  options: { label: string; value: string; concept_id: string }[];
  required: boolean;
  related_term_index: number;
  hint?: string;
}

/** API response for question response (snake_case) */
interface QuestionResponseApiResponse {
  question_id: string;
  value: string;
  concept_id?: string;
}

/** API response for confirmed attribute (snake_case) */
interface ConfirmedAttributeApiResponse {
  concept_id: string;
  attribute_id: string;
  attribute_name: string;
  value_id: string;
  value_name: string;
  role_group: number;
}

/** API response for ECL expression (snake_case) */
interface ECLExpressionApiResponse {
  ecl: string;
  description: string;
  fsn: string;
  expression_type: string;
  validation: {
    valid: boolean;
    mrcm_compliant: boolean;
    errors: string[];
    warnings: string[];
  };
  formatted: {
    brief: string;
    long: string;
    nested: string;
  };
}

/** API response for session metrics (snake_case) */
interface SessionMetricsApiResponse {
  extraction_time_ms?: number;
  matching_time_ms?: number;
  question_generation_time_ms?: number;
  expression_build_time_ms?: number;
  total_time_ms: number;
  llm_tokens_used: number;
}

/** API response for session progress (snake_case) */
interface SessionProgressApiResponse {
  current_step: string;
  percent_complete: number;
}

/**
 * Confirm concepts request
 */
export interface ConfirmConceptsRequest {
  selections: {
    term_index: number;
    concept_id: string;
  }[];
}

/**
 * Submit responses request
 */
export interface SubmitResponsesRequest {
  responses: {
    question_id: string;
    value: string;
    concept_id?: string;
  }[];
}

/**
 * Skip questions request
 */
export interface SkipQuestionsRequest {
  skip_all?: boolean;
  question_ids?: string[];
}

/**
 * Expression response
 */
export interface ExpressionResponse {
  expression: ECLExpressionApiResponse;
}

/**
 * Search options
 */
export interface SearchOptions {
  domain?: string;
  limit?: number;
  offset?: number;
}

/**
 * Concept search result
 */
export interface ConceptSearchResult {
  id: string;
  term: string;
  fsn: string;
  semanticTag: string;
  similarity: number;
}

/**
 * Search results response
 */
export interface SearchResultsResponse {
  results: ConceptSearchResult[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Two-Tier Search Types (Direct Matches + Related Concepts)
// ============================================================================

/**
 * Validated match from direct lookup (Stages 1-3)
 * - Stage 1: Synonym dictionary lookup
 * - Stage 2: Exact SNOMED description match
 * - Stage 3: Lexical/partial match
 */
export interface ValidatedMatchApi {
  concept_id: string;
  term: string;
  fsn: string;
  confidence: number;
  source: 'synonym_lookup' | 'exact_match' | 'lexical_match';
  semantic_tag?: string;
  clinically_validated: true;
}

/**
 * Related concept from embedding search (Stage 4)
 * - Suggestions based on medical literature patterns
 * - Confidence capped at 80%
 */
export interface RelatedConceptApi {
  concept_id: string;
  term: string;
  fsn?: string;
  similarity: number;
  source: 'embedding_search';
  clinical_hint?: string;
  is_suggestion: true;
  clinically_validated: false;
  semantic_tag?: string;
}

/**
 * Two-tier search response
 */
export interface TwoTierSearchResponse {
  query: string;
  search_metadata: {
    direct_lookup_time_ms: number;
    embedding_search_time_ms: number;
    total_time_ms: number;
    parallel_execution: boolean;
  };
  results: {
    validated_matches: ValidatedMatchApi[];
    related_concepts: RelatedConceptApi[];
  };
  ui_guidance?: {
    show_related: boolean;
    related_section_title: string;
    related_section_disclaimer: string;
  };
}

/**
 * Frontend validated match (camelCase)
 */
export interface ValidatedMatch {
  conceptId: string;
  term: string;
  fsn: string;
  confidence: number;
  source: 'synonym_lookup' | 'exact_match' | 'lexical_match';
  semanticTag?: string;
  clinicallyValidated: true;
}

/**
 * Frontend related concept (camelCase)
 */
export interface RelatedConcept {
  conceptId: string;
  term: string;
  fsn?: string;
  similarity: number;
  source: 'embedding_search';
  clinicalHint?: string;
  isSuggestion: true;
  clinicallyValidated: false;
  semanticTag?: string;
}

/**
 * Frontend two-tier search result
 */
export interface TwoTierSearchResult {
  query: string;
  searchMetadata: {
    directLookupTimeMs: number;
    embeddingSearchTimeMs: number;
    totalTimeMs: number;
    parallelExecution: boolean;
  };
  validatedMatches: ValidatedMatch[];
  relatedConcepts: RelatedConcept[];
  uiGuidance?: {
    showRelated: boolean;
    relatedSectionTitle: string;
    relatedSectionDisclaimer: string;
  };
}

// ============================================================================
// Tree Traversal Types
// ============================================================================

/**
 * Traversal question types
 */
export type TraversalQuestionType = 'disambiguation' | 'attribute';

/**
 * Traversal question option from API
 */
export interface TraversalQuestionOptionApi {
  concept_id: string;
  label: string;
  description?: string;
  fsn?: string;
}

/**
 * Traversal question from API
 */
export interface TraversalQuestionApi {
  id: string;
  type: TraversalQuestionType;
  text: string;
  options: TraversalQuestionOptionApi[];
  target_concept?: {
    id: string;
    term: string;
  };
  attribute?: {
    id: string;
    name: string;
  };
}

/**
 * Traversal state from API
 */
export interface TraversalStateApi {
  current_node_id?: string;
  current_node_term?: string;
  navigation_depth: number;
  can_go_back: boolean;
  confirmed_path: string[];
  current_question?: TraversalQuestionApi;
}

/**
 * Frontend traversal question option
 */
export interface TraversalQuestionOption {
  conceptId: string;
  label: string;
  description?: string;
  fsn?: string;
}

/**
 * Frontend traversal question
 */
export interface TraversalQuestion {
  id: string;
  type: TraversalQuestionType;
  text: string;
  options: TraversalQuestionOption[];
  targetConcept?: {
    id: string;
    term: string;
  };
  attribute?: {
    id: string;
    name: string;
  };
}

/**
 * Frontend traversal state
 */
export interface TraversalState {
  currentNodeId?: string;
  currentNodeTerm?: string;
  navigationDepth: number;
  canGoBack: boolean;
  confirmedPath: string[];
  currentQuestion?: TraversalQuestion;
}

/**
 * Concept detail
 */
export interface ConceptDetail {
  id: string;
  term: string;
  fsn: string;
  semanticTag: string;
  active: boolean;
  parents: { id: string; term: string }[];
  children: { id: string; term: string }[];
  attributes: { id: string; name: string; value: { id: string; term: string } }[];
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  message?: string;
}

/**
 * Registry status response
 */
export interface RegistryStatusResponse {
  version: string;
  servers: {
    id: string;
    name: string;
    url: string;
    status: 'healthy' | 'unavailable' | 'error';
    required: boolean;
    tools: string[];
    last_check: string;
    error?: string;
  }[];
  healthy: boolean;
  degraded: boolean;
  message?: string;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform API response (snake_case) to frontend model (camelCase)
 */
function transformSession(api: SessionApiResponse): Session {
  return {
    id: api.session_id,
    state: api.state as Session['state'],
    originalText: api.original_text,
    context: api.context,
    extractedTerms: (api.extracted_terms ?? []).map(transformExtractedTerm),
    termMatches: (api.term_matches ?? []).map(transformTermMatch),
    pendingQuestions: (api.pending_questions ?? []).map(transformQuestion),
    responses: (api.responses ?? []).map(transformQuestionResponse),
    confirmedAttributes: (api.confirmed_attributes ?? []).map(transformConfirmedAttribute),
    expression: api.expression ? transformECLExpression(api.expression) : undefined,
    expressions: (api.expressions ?? []).map(transformECLExpression),
    metrics: transformMetrics(api.metrics),
    progress: api.progress
      ? { currentStep: api.progress.current_step, percentComplete: api.progress.percent_complete }
      : undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function transformExtractedTerm(api: ExtractedTermApiResponse): ExtractedTerm {
  return {
    text: api.text,
    normalized: api.normalized,
    type: api.type as ExtractedTerm['type'],
    confidence: api.confidence,
    span: api.span,
    modifiers: api.modifiers,
    negated: api.negated,
  };
}

function transformTermMatch(api: TermMatchApiResponse): TermMatch {
  return {
    termIndex: api.term_index,
    matches: api.matches.map((m) => ({
      id: m.id,
      term: m.term,
      fsn: m.fsn,
      semanticTag: m.semantic_tag,
      similarity: m.similarity,
      matchType: m.match_type as 'validated' | 'related' | undefined,
      clinicalHint: m.clinical_hint,
    })),
    selectedId: api.selected_id,
    selectedTerm: api.selected_term,
    needsConfirmation: api.needs_confirmation,
  };
}

function transformQuestion(api: QuestionApiResponse): Question {
  return {
    id: api.id,
    text: api.text,
    attributeId: api.attribute_id,
    attributeName: api.attribute_name,
    inputType: api.input_type as Question['inputType'],
    options: api.options.map((o) => ({
      label: o.label,
      value: o.value,
      conceptId: o.concept_id,
    })),
    required: api.required,
    relatedTermIndex: api.related_term_index,
    hint: api.hint,
  };
}

function transformQuestionResponse(api: QuestionResponseApiResponse): QuestionResponse {
  return {
    questionId: api.question_id,
    value: api.value,
    conceptId: api.concept_id,
  };
}

function transformConfirmedAttribute(api: ConfirmedAttributeApiResponse) {
  return {
    conceptId: api.concept_id,
    attributeId: api.attribute_id,
    attributeName: api.attribute_name,
    valueId: api.value_id,
    valueName: api.value_name,
    roleGroup: api.role_group,
  };
}

function transformECLExpression(api: ECLExpressionApiResponse): ECLExpression {
  return {
    ecl: api.ecl,
    description: api.description,
    fsn: api.fsn,
    expressionType: api.expression_type as ECLExpression['expressionType'],
    validation: {
      valid: api.validation.valid,
      mrcmCompliant: api.validation.mrcm_compliant,
      errors: api.validation.errors,
      warnings: api.validation.warnings,
    },
    formatted: api.formatted,
  };
}

function transformMetrics(api?: SessionMetricsApiResponse): SessionMetrics {
  if (!api) {
    return { totalTimeMs: 0, llmTokensUsed: 0 };
  }
  return {
    extractionTimeMs: api.extraction_time_ms,
    matchingTimeMs: api.matching_time_ms,
    questionGenerationTimeMs: api.question_generation_time_ms,
    expressionBuildTimeMs: api.expression_build_time_ms,
    totalTimeMs: api.total_time_ms,
    llmTokensUsed: api.llm_tokens_used,
  };
}

// ============================================================================
// API Service Class
// ============================================================================

/**
 * API service for backend communication
 */
export class ApiService {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetryConfig: RetryConfig;

  constructor(config?: { baseUrl?: string; timeout?: number; retry?: Partial<RetryConfig> }) {
    this.baseUrl = config?.baseUrl ?? API_BASE_URL;
    this.defaultTimeout = config?.timeout ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config?.retry };
  }

  // ==========================================================================
  // Core Request Method
  // ==========================================================================

  /**
   * Make an API request with timeout, retry, and error handling
   */
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retry, ...fetchOptions } = options;

    const retryConfig = this.getRetryConfig(retry);
    const url = `${this.baseUrl}${endpoint}`;

    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions, timeout);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = this.normalizeError(error);

        // Check if we should retry
        if (attempt < retryConfig.maxAttempts && this.shouldRetry(lastError, retryConfig)) {
          const delay = this.calculateRetryDelay(attempt, retryConfig);
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError ?? new ApiError('UNKNOWN', 'Request failed');
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', `Request timed out after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle response and parse JSON
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: ApiErrorResponse | null = null;

      if (isJson) {
        try {
          errorData = await response.json();
        } catch {
          // Ignore JSON parse errors
        }
      }

      throw new ApiError(
        (errorData?.error?.code as ApiErrorCode) ?? this.getErrorCodeFromStatus(response.status),
        errorData?.error?.message ?? `Request failed with status ${response.status}`,
        response.status,
        errorData?.error?.details,
        errorData?.meta?.requestId
      );
    }

    if (!isJson) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): ApiErrorCode {
    switch (status) {
      case 400:
        return 'INVALID_INPUT';
      case 404:
        return 'SESSION_NOT_FOUND';
      case 429:
        return 'RATE_LIMITED';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return status >= 500 ? 'SERVICE_UNAVAILABLE' : 'UNKNOWN';
    }
  }

  /**
   * Normalize error to ApiError
   */
  private normalizeError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof TypeError) {
      // Network error (fetch failed)
      return new ApiError('NETWORK_ERROR', error.message);
    }

    if (error instanceof Error) {
      return new ApiError('UNKNOWN', error.message);
    }

    return new ApiError('UNKNOWN', 'An unknown error occurred');
  }

  /**
   * Get retry configuration
   */
  private getRetryConfig(retry?: Partial<RetryConfig> | boolean): RetryConfig {
    if (retry === false) {
      return { ...this.defaultRetryConfig, maxAttempts: 1 };
    }
    if (retry === true || retry === undefined) {
      return this.defaultRetryConfig;
    }
    return { ...this.defaultRetryConfig, ...retry };
  }

  /**
   * Check if error should trigger retry
   */
  private shouldRetry(error: ApiError, config: RetryConfig): boolean {
    return error.isRetryable() || config.retryableStatuses.includes(error.status);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelayMs * Math.pow(2, attempt - 1);
    return Math.min(delay, config.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Session API Methods
  // ==========================================================================

  /**
   * Create a new clinical coding session
   */
  async createSession(
    text: string,
    context?: { specialty?: string; setting?: string }
  ): Promise<CreateSessionResponse> {
    const body: CreateSessionRequest = { text, context };
    return this.request<CreateSessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get session state
   */
  async getSession(sessionId: string): Promise<Session> {
    const response = await this.request<SessionApiResponse>(`/sessions/${sessionId}`);
    return transformSession(response);
  }

  /**
   * Confirm concept selections
   * Uses extended timeout because this triggers LLM-based question generation
   */
  async confirmConcepts(
    sessionId: string,
    selections: { termIndex: number; conceptId: string }[]
  ): Promise<Session> {
    const body: ConfirmConceptsRequest = {
      selections: selections.map((s) => ({
        term_index: s.termIndex,
        concept_id: s.conceptId,
      })),
    };
    const response = await this.request<SessionApiResponse>(`/sessions/${sessionId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(body),
      timeout: EXTENDED_TIMEOUT_MS, // Question generation can take 60+ seconds
    });
    return transformSession(response);
  }

  /**
   * Submit question responses
   */
  async submitResponses(
    sessionId: string,
    responses: QuestionResponse[]
  ): Promise<Session> {
    const body: SubmitResponsesRequest = {
      responses: responses.map((r) => ({
        question_id: r.questionId,
        // Convert array values to comma-separated string for backend compatibility
        value: Array.isArray(r.value) ? r.value.join(',') : r.value,
        concept_id: r.conceptId,
      })),
    };
    const response = await this.request<SessionApiResponse>(`/sessions/${sessionId}/responses`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return transformSession(response);
  }

  /**
   * Skip questions
   */
  async skipQuestions(
    sessionId: string,
    questionIds?: string[]
  ): Promise<Session> {
    const body: SkipQuestionsRequest = questionIds
      ? { question_ids: questionIds }
      : { skip_all: true };
    const response = await this.request<SessionApiResponse>(`/sessions/${sessionId}/skip`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return transformSession(response);
  }

  /**
   * Skip a term (no good match)
   */
  async skipTerm(sessionId: string, termIndex: number): Promise<Session> {
    const response = await this.request<SessionApiResponse>(
      `/sessions/${sessionId}/skip-term`,
      {
        method: 'POST',
        body: JSON.stringify({ term_index: termIndex }),
      }
    );
    return transformSession(response);
  }

  /**
   * Get final expression
   */
  async getExpression(sessionId: string): Promise<ECLExpression> {
    const response = await this.request<ExpressionResponse>(`/sessions/${sessionId}/expression`);
    return transformECLExpression(response.expression);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.request<void>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Search API Methods
  // ==========================================================================

  /**
   * Search for concepts
   */
  async searchConcepts(query: string, options?: SearchOptions): Promise<SearchResultsResponse> {
    const params = new URLSearchParams({ q: query });
    if (options?.domain) params.append('domain', options.domain);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return this.request<SearchResultsResponse>(`/search?${params.toString()}`);
  }

  /**
   * Get concept details
   */
  async getConcept(conceptId: string): Promise<ConceptDetail> {
    return this.request<ConceptDetail>(`/concepts/${conceptId}`);
  }

  // ==========================================================================
  // Health & Status API Methods
  // ==========================================================================

  /**
   * Health check
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health', { retry: false });
  }

  /**
   * Get registry status
   */
  async getRegistryStatus(): Promise<RegistryStatusResponse> {
    return this.request<RegistryStatusResponse>('/registry');
  }

  // ==========================================================================
  // CCX Drilling Workflow API Methods
  // ==========================================================================

  /**
   * Create a CCX session with question generation
   */
  async createCcxSession(
    text: string,
    generateQuestions = true
  ): Promise<CcxSession> {
    const response = await this.request<CcxSessionApi>('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        text,
        generate_questions: generateQuestions,
      }),
      timeout: EXTENDED_TIMEOUT_MS,
    });
    return transformCcxSession(response);
  }

  /**
   * Get CCX session state
   */
  async getCcxSession(sessionId: string): Promise<CcxSession> {
    const response = await this.request<CcxSessionApi>(`/sessions/${sessionId}`);
    return transformCcxSession(response);
  }

  /**
   * Answer a question in the CCX drilling workflow
   * This may trigger drilling if a SPECIFICITY question is answered
   */
  async answerCcxQuestion(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    skipped = false
  ): Promise<CcxAnswerResponse> {
    const response = await this.request<CcxAnswerResponseApi>(
      `/sessions/${sessionId}/answer`,
      {
        method: 'POST',
        body: JSON.stringify({
          question_id: questionId,
          selected_option_ids: selectedOptionIds,
          skipped,
        }),
        timeout: EXTENDED_TIMEOUT_MS,
      }
    );
    return transformCcxAnswerResponse(response);
  }

  /**
   * Execute an ECL query
   */
  async executeEcl(
    ecl: string,
    limit = 100,
    includeDetails = true
  ): Promise<EclExecutionResponse> {
    const response = await this.request<EclExecutionResponseApi>('/ecl/execute', {
      method: 'POST',
      body: JSON.stringify({
        ecl,
        limit,
        include_details: includeDetails,
      }),
    });
    return transformEclExecutionResponse(response);
  }

  /**
   * Get concept children (for hierarchy navigation)
   */
  async getConceptChildren(
    conceptId: string,
    limit = 100
  ): Promise<{ conceptId: string; term: string; fsn: string; semanticTag: string }[]> {
    const response = await this.request<{
      children: { concept_id: string; term: string; fsn: string; semantic_tag: string }[];
    }>(`/concepts/${conceptId}/children?limit=${limit}`);
    return response.children.map((c) => ({
      conceptId: c.concept_id,
      term: c.term,
      fsn: c.fsn,
      semanticTag: c.semantic_tag,
    }));
  }

  /**
   * Get concept ancestors (for hierarchy navigation)
   */
  async getConceptAncestors(
    conceptId: string
  ): Promise<{ conceptId: string; term: string; fsn: string; semanticTag: string }[]> {
    const response = await this.request<{
      ancestors: { concept_id: string; term: string; fsn: string; semantic_tag: string }[];
    }>(`/concepts/${conceptId}/ancestors`);
    return response.ancestors.map((c) => ({
      conceptId: c.concept_id,
      term: c.term,
      fsn: c.fsn,
      semanticTag: c.semantic_tag,
    }));
  }
}

// ============================================================================
// CCX Drilling Workflow Types
// ============================================================================

/**
 * Focus concept - the current concept being coded (can change with drilling)
 */
export interface FocusConcept {
  conceptId: string;
  conceptTerm: string;
  semanticTag: string;
  originalPhrase: string;
  depth: number;
  parentConceptId: string | null;
}

/**
 * Focus concept from API (snake_case)
 */
interface FocusConceptApi {
  concept_id: string;
  concept_term: string;
  semantic_tag: string;
  original_phrase: string;
  depth: number;
  parent_concept_id: string | null;
}

/**
 * Drilling summary - tracks the drilling path
 */
export interface DrillingSummary {
  currentDepth: number;
  maxDepth: number;
  path: { conceptId: string; term: string; depth: number }[];
  answeredAttributes: string[];
  totalQuestionsAsked: number;
  totalQuestionsAnswered: number;
}

/**
 * Drilling summary from API (snake_case)
 */
interface DrillingSummaryApi {
  current_depth: number;
  max_depth: number;
  path: { concept_id: string; term: string; depth: number }[];
  answered_attributes: string[];
  total_questions_asked: number;
  total_questions_answered: number;
}

/**
 * Question option for drilling workflow
 */
export interface DrillingQuestionOption {
  conceptId: string;
  displayText: string;
  fsn: string;
  semanticTag: string;
  preSelected: boolean;
  preSelectionSource: string;
}

/**
 * Question option from API (snake_case)
 */
interface DrillingQuestionOptionApi {
  concept_id: string;
  display_text: string;
  fsn: string;
  semantic_tag: string;
  pre_selected: boolean;
  pre_selection_source: string;
}

/**
 * Drilling question - questions in the drilling workflow
 */
export interface DrillingQuestion {
  id: string;
  questionType: 'specificity' | 'severity' | 'laterality' | 'temporal' | 'attribute';
  priority: number;
  sourceConceptId: string;
  sourceConceptTerm: string;
  attributeId: string | null;
  attributeName: string | null;
  text: string;
  options: DrillingQuestionOption[];
  eclSource: string | null;
  skipOption: boolean;
  multiSelect: boolean;
}

/**
 * Drilling question from API (snake_case)
 */
interface DrillingQuestionApi {
  id: string;
  question_type: string;
  priority: number;
  source_concept_id: string;
  source_concept_term: string;
  attribute_id: string | null;
  attribute_name: string | null;
  text: string;
  options: DrillingQuestionOptionApi[];
  ecl_source: string | null;
  skip_option: boolean;
  multi_select: boolean;
}

/**
 * CCX Session response (with drilling support)
 */
export interface CcxSession {
  sessionId: string;
  status: 'active' | 'pending_questions' | 'complete' | 'expired' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  originalText: string;
  normalizedText: string;
  currentFocus: FocusConcept | null;
  drillingSummary: DrillingSummary | null;
  conceptCount: number;
  pendingQuestionCount: number;
  answeredQuestionCount: number;
  nextQuestion: DrillingQuestion | null;
  finalExpressions: string[];
}

/**
 * CCX Session from API (snake_case)
 */
interface CcxSessionApi {
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  original_text: string;
  normalized_text: string;
  current_focus: FocusConceptApi | null;
  drilling_summary: DrillingSummaryApi | null;
  concept_count: number;
  pending_question_count: number;
  answered_question_count: number;
  next_question: DrillingQuestionApi | null;
  final_expressions: string[];
}

/**
 * Answered question record
 */
export interface AnsweredQuestionRecord {
  questionId: string;
  questionType: string;
  selectedOptions: DrillingQuestionOption[];
  skipped: boolean;
  resultingAttribute: [string, string] | null;
}

/**
 * Answered question from API (snake_case)
 */
interface AnsweredQuestionRecordApi {
  question_id: string;
  question_type: string;
  selected_options: DrillingQuestionOptionApi[];
  skipped: boolean;
  resulting_attribute: [string, string] | null;
}

/**
 * Answer response - result of answering a question
 */
export interface CcxAnswerResponse {
  valid: boolean;
  errorMessage: string | null;
  sessionId: string;
  sessionStatus: string;
  drilledDown: boolean;
  currentFocus: FocusConcept | null;
  newQuestionsGenerated: number;
  answeredQuestion: AnsweredQuestionRecord | null;
  nextQuestion: DrillingQuestion | null;
  finalExpressions: string[];
}

/**
 * Answer response from API (snake_case)
 */
interface CcxAnswerResponseApi {
  valid: boolean;
  error_message: string | null;
  session_id: string;
  session_status: string;
  drilled_down: boolean;
  current_focus: FocusConceptApi | null;
  new_questions_generated: number;
  answered_question: AnsweredQuestionRecordApi | null;
  next_question: DrillingQuestionApi | null;
  final_expressions: string[];
}

/**
 * ECL execution response
 */
export interface EclExecutionResponse {
  ecl: string;
  totalCount: number;
  concepts: {
    conceptId: string;
    term: string;
    fsn: string;
    semanticTag: string;
    active: boolean;
  }[];
  executionTimeMs: number;
  truncated: boolean;
}

/**
 * ECL execution response from API (snake_case)
 */
interface EclExecutionResponseApi {
  ecl: string;
  total_count: number;
  concepts: {
    concept_id: string;
    term: string;
    fsn: string;
    semantic_tag: string;
    active: boolean;
  }[];
  execution_time_ms: number;
  truncated: boolean;
}

// ============================================================================
// CCX Transform Functions
// ============================================================================

function transformFocusConcept(api: FocusConceptApi): FocusConcept {
  return {
    conceptId: api.concept_id,
    conceptTerm: api.concept_term,
    semanticTag: api.semantic_tag,
    originalPhrase: api.original_phrase,
    depth: api.depth,
    parentConceptId: api.parent_concept_id,
  };
}

function transformDrillingSummary(api: DrillingSummaryApi): DrillingSummary {
  return {
    currentDepth: api.current_depth,
    maxDepth: api.max_depth,
    path: api.path.map((p) => ({
      conceptId: p.concept_id,
      term: p.term,
      depth: p.depth,
    })),
    answeredAttributes: api.answered_attributes,
    totalQuestionsAsked: api.total_questions_asked,
    totalQuestionsAnswered: api.total_questions_answered,
  };
}

function transformDrillingQuestionOption(api: DrillingQuestionOptionApi): DrillingQuestionOption {
  return {
    conceptId: api.concept_id,
    displayText: api.display_text,
    fsn: api.fsn,
    semanticTag: api.semantic_tag,
    preSelected: api.pre_selected,
    preSelectionSource: api.pre_selection_source,
  };
}

function transformDrillingQuestion(api: DrillingQuestionApi): DrillingQuestion {
  return {
    id: api.id,
    questionType: api.question_type as DrillingQuestion['questionType'],
    priority: api.priority,
    sourceConceptId: api.source_concept_id,
    sourceConceptTerm: api.source_concept_term,
    attributeId: api.attribute_id,
    attributeName: api.attribute_name,
    text: api.text,
    options: api.options.map(transformDrillingQuestionOption),
    eclSource: api.ecl_source,
    skipOption: api.skip_option,
    multiSelect: api.multi_select,
  };
}

function transformCcxSession(api: CcxSessionApi): CcxSession {
  return {
    sessionId: api.session_id,
    status: api.status as CcxSession['status'],
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    originalText: api.original_text,
    normalizedText: api.normalized_text,
    currentFocus: api.current_focus ? transformFocusConcept(api.current_focus) : null,
    drillingSummary: api.drilling_summary ? transformDrillingSummary(api.drilling_summary) : null,
    conceptCount: api.concept_count,
    pendingQuestionCount: api.pending_question_count,
    answeredQuestionCount: api.answered_question_count,
    nextQuestion: api.next_question ? transformDrillingQuestion(api.next_question) : null,
    finalExpressions: api.final_expressions,
  };
}

function transformAnsweredQuestionRecord(api: AnsweredQuestionRecordApi): AnsweredQuestionRecord {
  return {
    questionId: api.question_id,
    questionType: api.question_type,
    selectedOptions: api.selected_options.map(transformDrillingQuestionOption),
    skipped: api.skipped,
    resultingAttribute: api.resulting_attribute,
  };
}

function transformCcxAnswerResponse(api: CcxAnswerResponseApi): CcxAnswerResponse {
  return {
    valid: api.valid,
    errorMessage: api.error_message,
    sessionId: api.session_id,
    sessionStatus: api.session_status,
    drilledDown: api.drilled_down,
    currentFocus: api.current_focus ? transformFocusConcept(api.current_focus) : null,
    newQuestionsGenerated: api.new_questions_generated,
    answeredQuestion: api.answered_question
      ? transformAnsweredQuestionRecord(api.answered_question)
      : null,
    nextQuestion: api.next_question ? transformDrillingQuestion(api.next_question) : null,
    finalExpressions: api.final_expressions,
  };
}

function transformEclExecutionResponse(api: EclExecutionResponseApi): EclExecutionResponse {
  return {
    ecl: api.ecl,
    totalCount: api.total_count,
    concepts: api.concepts.map((c) => ({
      conceptId: c.concept_id,
      term: c.term,
      fsn: c.fsn,
      semanticTag: c.semantic_tag,
      active: c.active,
    })),
    executionTimeMs: api.execution_time_ms,
    truncated: api.truncated,
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default API service instance
 */
export const apiService = new ApiService();
