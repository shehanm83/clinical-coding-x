/**
 * WebSocket Service
 *
 * Real-time WebSocket client with automatic reconnection and typed message handling.
 * Based on API specifications from docs/architecture/llm-clinical-coding/07-api-specifications.md
 */

import type {
  ExtractedTerm,
  Question,
  SessionState,
} from '../state/contexts/session-context.js';

// ============================================================================
// Configuration
// ============================================================================

/** Default WebSocket configuration */
const DEFAULT_CONFIG: WebSocketConfig = {
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  maxAttempts: 10,
  pingIntervalMs: 30000,
};

// ============================================================================
// Types
// ============================================================================

/**
 * WebSocket connection states
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  /** Initial reconnection delay in ms */
  initialDelayMs: number;
  /** Maximum reconnection delay in ms */
  maxDelayMs: number;
  /** Maximum reconnection attempts */
  maxAttempts: number;
  /** Ping interval for keep-alive in ms */
  pingIntervalMs: number;
}

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
}

/**
 * State change message data
 */
export interface StateChangeData {
  previous: SessionState;
  current: SessionState;
  timestamp: string;
}

/**
 * Progress update message data
 */
export interface ProgressData {
  step: string;
  detail?: string;
  percentComplete: number;
}

/**
 * Terms extracted message data
 */
export interface TermsExtractedData {
  terms: ExtractedTerm[];
}

/**
 * Questions ready message data
 */
export interface QuestionsReadyData {
  questions: Question[];
}

/**
 * Expression ready message data
 */
export interface ExpressionReadyData {
  ecl: string;
  description: string;
}

/**
 * Error message data
 */
export interface ErrorData {
  code: string;
  message: string;
}

/**
 * All possible message types
 */
export type WebSocketMessageType =
  | 'state_change'
  | 'progress'
  | 'terms_extracted'
  | 'questions_ready'
  | 'expression_ready'
  | 'error'
  | 'connection_state'
  | 'connection_failed';

/**
 * Message type to data type mapping
 */
export interface MessageTypeMap {
  state_change: StateChangeData;
  progress: ProgressData;
  terms_extracted: TermsExtractedData;
  questions_ready: QuestionsReadyData;
  expression_ready: ExpressionReadyData;
  error: ErrorData;
  connection_state: ConnectionState;
  connection_failed: null;
}

/**
 * Typed event listener
 */
export type MessageListener<T> = (data: T) => void;

/**
 * Internal listener entry
 */
interface ListenerEntry {
  callback: MessageListener<unknown>;
  once: boolean;
}

// ============================================================================
// WebSocket Service Class
// ============================================================================

/**
 * WebSocket service for real-time session updates
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Map<string, Set<ListenerEntry>>();
  private config: WebSocketConfig;
  private intentionalClose = false;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  /**
   * Get the WebSocket base URL
   */
  private getWsBaseUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/v1`;
  }

  /**
   * Connect to WebSocket for a session
   */
  connect(sessionId: string): void {
    // Clean up any existing connection
    if (this.ws) {
      this.intentionalClose = true;
      this.ws.close();
      this.ws = null;
    }

    this.sessionId = sessionId;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    this.setConnectionState('connecting');

    this.createConnection();
  }

  /**
   * Create WebSocket connection
   */
  private createConnection(): void {
    if (!this.sessionId) return;

    const url = `${this.getWsBaseUrl()}/sessions/${this.sessionId}/stream`;

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.handleConnectionError();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.startPingInterval();
    };

    this.ws.onclose = (event) => {
      console.log('[WebSocket] Closed:', event.code, event.reason);
      this.stopPingInterval();

      if (!this.intentionalClose) {
        this.scheduleReconnect();
      } else {
        this.setConnectionState('disconnected');
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      // onclose will be called after onerror
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      const type = message.type as WebSocketMessageType;
      this.emit(type, this.transformMessageData(type, message.data) as MessageTypeMap[typeof type]);
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Transform message data from snake_case to camelCase
   */
  private transformMessageData(type: string, data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;

    switch (type) {
      case 'progress':
        return this.transformProgress(data as Record<string, unknown>);
      case 'terms_extracted':
        return this.transformTermsExtracted(data as Record<string, unknown>);
      case 'questions_ready':
        return this.transformQuestionsReady(data as Record<string, unknown>);
      default:
        return data;
    }
  }

  private transformProgress(data: Record<string, unknown>): ProgressData {
    return {
      step: data.step as string,
      detail: data.detail as string | undefined,
      percentComplete: data.percent_complete as number,
    };
  }

  private transformTermsExtracted(data: Record<string, unknown>): TermsExtractedData {
    const terms = data.terms as unknown[];
    return {
      terms: terms.map((t) => this.transformExtractedTerm(t as Record<string, unknown>)),
    };
  }

  private transformExtractedTerm(t: Record<string, unknown>): ExtractedTerm {
    return {
      text: t.text as string,
      normalized: t.normalized as string,
      type: t.type as ExtractedTerm['type'],
      confidence: t.confidence as number,
      span: t.span as { start: number; end: number },
      modifiers: t.modifiers as { type: string; value: string }[],
      negated: t.negated as boolean,
    };
  }

  private transformQuestionsReady(data: Record<string, unknown>): QuestionsReadyData {
    const questions = data.questions as unknown[];
    return {
      questions: questions.map((q) => this.transformQuestion(q as Record<string, unknown>)),
    };
  }

  private transformQuestion(q: Record<string, unknown>): Question {
    const options = q.options as Record<string, unknown>[];
    return {
      id: q.id as string,
      text: q.text as string,
      attributeId: q.attribute_id as string,
      attributeName: q.attribute_name as string,
      inputType: q.input_type as Question['inputType'],
      options: options.map((o) => ({
        label: o.label as string,
        value: o.value as string,
        conceptId: o.concept_id as string,
      })),
      required: q.required as boolean,
      relatedTermIndex: q.related_term_index as number,
      hint: q.hint as string | undefined,
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.intentionalClose = true;
    this.cancelReconnect();
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.sessionId = null;
    this.setConnectionState('disconnected');
  }

  // ==========================================================================
  // Reconnection Logic
  // ==========================================================================

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.setConnectionState('failed');
      this.emit('connection_failed', null);
      return;
    }

    this.setConnectionState('reconnecting');

    const delay = this.calculateReconnectDelay();
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxAttempts})`);

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectAttempts++;
      this.createConnection();
    }, delay);
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    const delay = this.config.initialDelayMs * Math.pow(2, this.reconnectAttempts);
    return Math.min(delay, this.config.maxDelayMs);
  }

  /**
   * Cancel pending reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(): void {
    if (!this.intentionalClose) {
      this.scheduleReconnect();
    }
  }

  // ==========================================================================
  // Keep-Alive
  // ==========================================================================

  /**
   * Start ping interval for keep-alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.pingIntervalMs);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  /**
   * Set connection state and emit event
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection_state', state);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  /**
   * Subscribe to a message type
   * @returns Unsubscribe function
   */
  on<T extends WebSocketMessageType>(
    type: T,
    callback: MessageListener<MessageTypeMap[T]>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const entry: ListenerEntry = {
      callback: callback as MessageListener<unknown>,
      once: false,
    };
    this.listeners.get(type)!.add(entry);

    return () => {
      this.listeners.get(type)?.delete(entry);
    };
  }

  /**
   * Subscribe to a message type once
   * @returns Unsubscribe function
   */
  once<T extends WebSocketMessageType>(
    type: T,
    callback: MessageListener<MessageTypeMap[T]>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const entry: ListenerEntry = {
      callback: callback as MessageListener<unknown>,
      once: true,
    };
    this.listeners.get(type)!.add(entry);

    return () => {
      this.listeners.get(type)?.delete(entry);
    };
  }

  /**
   * Remove all listeners for a type, or all listeners if no type specified
   */
  off(type?: WebSocketMessageType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<T extends WebSocketMessageType>(type: T, data: MessageTypeMap[T]): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;

    const toRemove: ListenerEntry[] = [];

    listeners.forEach((entry) => {
      try {
        entry.callback(data);
        if (entry.once) {
          toRemove.push(entry);
        }
      } catch (error) {
        console.error(`[WebSocket] Error in listener for ${type}:`, error);
      }
    });

    // Remove one-time listeners
    toRemove.forEach((entry) => listeners.delete(entry));
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default WebSocket service instance
 */
export const wsService = new WebSocketService();
