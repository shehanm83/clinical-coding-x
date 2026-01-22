/**
 * Services Index
 *
 * Re-exports all services and their types for convenient imports.
 */

// API Service
export {
  ApiService,
  ApiError,
  apiService,
  type ApiErrorCode,
  type ApiErrorResponse,
  type RetryConfig,
  type ApiRequestOptions,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type ConfirmConceptsRequest,
  type SubmitResponsesRequest,
  type SkipQuestionsRequest,
  type ExpressionResponse,
  type SearchOptions,
  type ConceptSearchResult,
  type SearchResultsResponse,
  type ConceptDetail,
  type HealthResponse,
  type RegistryStatusResponse,
} from './api.js';

// WebSocket Service
export {
  WebSocketService,
  wsService,
  type ConnectionState,
  type WebSocketConfig,
  type WebSocketMessage,
  type WebSocketMessageType,
  type MessageTypeMap,
  type MessageListener,
  type StateChangeData,
  type ProgressData,
  type TermsExtractedData,
  type QuestionsReadyData,
  type ExpressionReadyData,
  type ErrorData,
} from './websocket.js';
