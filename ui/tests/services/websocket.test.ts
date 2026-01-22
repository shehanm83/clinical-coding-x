/**
 * WebSocket Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebSocketService,
  wsService,
  type ConnectionState,
  type StateChangeData,
  type ProgressData,
  type TermsExtractedData,
  type QuestionsReadyData,
  type ExpressionReadyData,
  type ErrorData,
} from '../../src/services/websocket.js';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(_data: string): void {
    // Mock send
  }

  close(code?: number, _reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code ?? 1000 }));
    }
  }

  // Helper methods for testing
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateClose(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

// Store original WebSocket
const OriginalWebSocket = global.WebSocket;

describe('websocket.ts', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock WebSocket constructor
    global.WebSocket = vi.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    }) as unknown as typeof WebSocket;

    // Copy static properties
    (global.WebSocket as unknown as typeof MockWebSocket).CONNECTING = MockWebSocket.CONNECTING;
    (global.WebSocket as unknown as typeof MockWebSocket).OPEN = MockWebSocket.OPEN;
    (global.WebSocket as unknown as typeof MockWebSocket).CLOSING = MockWebSocket.CLOSING;
    (global.WebSocket as unknown as typeof MockWebSocket).CLOSED = MockWebSocket.CLOSED;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.WebSocket = OriginalWebSocket;
  });

  describe('WebSocketService', () => {
    let service: WebSocketService;

    beforeEach(() => {
      service = new WebSocketService({
        initialDelayMs: 100,
        maxDelayMs: 1000,
        maxAttempts: 3,
        pingIntervalMs: 5000,
      });
    });

    afterEach(() => {
      service.destroy();
    });

    describe('connect', () => {
      it('creates WebSocket connection with correct URL', () => {
        service.connect('session-123');

        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/api/v2/sessions/session-123/stream')
        );
      });

      it('sets connection state to connecting', () => {
        const listener = vi.fn();
        service.on('connection_state', listener);

        service.connect('session-123');

        expect(listener).toHaveBeenCalledWith('connecting');
      });

      it('sets connection state to connected on open', () => {
        const listener = vi.fn();
        service.on('connection_state', listener);

        service.connect('session-123');
        mockWs.simulateOpen();

        expect(listener).toHaveBeenCalledWith('connected');
        expect(service.isConnected()).toBe(true);
      });

      it('closes existing connection before creating new one', () => {
        service.connect('session-123');
        mockWs.simulateOpen();

        const oldWs = mockWs;
        service.connect('session-456');

        // Old connection should be closed
        expect(oldWs.readyState).toBe(MockWebSocket.CLOSED);
      });
    });

    describe('disconnect', () => {
      it('closes connection and sets state to disconnected', () => {
        const listener = vi.fn();
        service.on('connection_state', listener);

        service.connect('session-123');
        mockWs.simulateOpen();
        listener.mockClear();

        service.disconnect();

        expect(service.getConnectionState()).toBe('disconnected');
        expect(service.isConnected()).toBe(false);
      });

      it('does not attempt reconnection after intentional disconnect', async () => {
        service.connect('session-123');
        mockWs.simulateOpen();

        service.disconnect();

        // Advance timers - should not attempt reconnect
        await vi.advanceTimersByTimeAsync(1000);

        // WebSocket should only have been created once
        expect(global.WebSocket).toHaveBeenCalledTimes(1);
      });
    });

    describe('reconnection', () => {
      it('attempts reconnection on unexpected close', async () => {
        const listener = vi.fn();
        service.on('connection_state', listener);

        service.connect('session-123');
        mockWs.simulateOpen();
        listener.mockClear();

        // Simulate unexpected close
        mockWs.simulateClose(1006);

        expect(listener).toHaveBeenCalledWith('reconnecting');

        // Advance past initial delay
        await vi.advanceTimersByTimeAsync(100);

        // Should have created a new WebSocket
        expect(global.WebSocket).toHaveBeenCalledTimes(2);
      });

      it('uses exponential backoff for reconnection delays', async () => {
        service.connect('session-123');
        mockWs.simulateOpen();

        // First unexpected close
        mockWs.simulateClose(1006);

        // First retry after 100ms (initial delay)
        await vi.advanceTimersByTimeAsync(100);
        expect(global.WebSocket).toHaveBeenCalledTimes(2);

        // Second unexpected close
        mockWs.simulateClose(1006);

        // Second retry after 200ms (100 * 2^1)
        await vi.advanceTimersByTimeAsync(200);
        expect(global.WebSocket).toHaveBeenCalledTimes(3);
      });

      it('emits connection_failed after max attempts', async () => {
        const failedListener = vi.fn();
        service.on('connection_failed', failedListener);

        service.connect('session-123');
        mockWs.simulateOpen();

        // Fail 3 times (max attempts)
        for (let i = 0; i < 3; i++) {
          mockWs.simulateClose(1006);
          const delay = 100 * Math.pow(2, i);
          await vi.advanceTimersByTimeAsync(delay);
        }

        // After 3 failures, should emit connection_failed
        mockWs.simulateClose(1006);

        expect(failedListener).toHaveBeenCalledWith(null);
        expect(service.getConnectionState()).toBe('failed');
      });

      it('resets reconnect attempts on successful connection', async () => {
        service.connect('session-123');
        mockWs.simulateOpen();

        // Fail and reconnect
        mockWs.simulateClose(1006);
        await vi.advanceTimersByTimeAsync(100);

        // New connection opens successfully
        mockWs.simulateOpen();

        // Fail again - should reset to initial delay
        mockWs.simulateClose(1006);
        await vi.advanceTimersByTimeAsync(100);

        expect(global.WebSocket).toHaveBeenCalledTimes(3);
      });
    });

    describe('message handling', () => {
      beforeEach(() => {
        service.connect('session-123');
        mockWs.simulateOpen();
      });

      it('emits state_change events', () => {
        const listener = vi.fn();
        service.on('state_change', listener);

        const data: StateChangeData = {
          previous: 'extracting',
          current: 'matching',
          timestamp: '2024-12-17T10:00:00Z',
        };

        mockWs.simulateMessage({ type: 'state_change', data });

        expect(listener).toHaveBeenCalledWith(data);
      });

      it('emits progress events with camelCase transformation', () => {
        const listener = vi.fn();
        service.on('progress', listener);

        mockWs.simulateMessage({
          type: 'progress',
          data: {
            step: 'Searching concepts',
            detail: 'Processing term 1 of 2',
            percent_complete: 50,
          },
        });

        expect(listener).toHaveBeenCalledWith({
          step: 'Searching concepts',
          detail: 'Processing term 1 of 2',
          percentComplete: 50,
        });
      });

      it('emits terms_extracted events with transformed data', () => {
        const listener = vi.fn();
        service.on('terms_extracted', listener);

        mockWs.simulateMessage({
          type: 'terms_extracted',
          data: {
            terms: [
              {
                text: 'chest pain',
                normalized: 'chest pain',
                type: 'finding',
                confidence: 0.95,
                span: { start: 0, end: 10 },
                modifiers: [],
                negated: false,
              },
            ],
          },
        });

        expect(listener).toHaveBeenCalledWith({
          terms: [
            {
              text: 'chest pain',
              normalized: 'chest pain',
              type: 'finding',
              confidence: 0.95,
              span: { start: 0, end: 10 },
              modifiers: [],
              negated: false,
            },
          ],
        });
      });

      it('emits questions_ready events with transformed data', () => {
        const listener = vi.fn();
        service.on('questions_ready', listener);

        mockWs.simulateMessage({
          type: 'questions_ready',
          data: {
            questions: [
              {
                id: 'q1',
                text: 'What is the severity?',
                attribute_id: '246112005',
                attribute_name: 'Severity',
                input_type: 'single_select',
                options: [{ label: 'Mild', value: 'mild', concept_id: '255604002' }],
                required: false,
                related_term_index: 0,
              },
            ],
          },
        });

        expect(listener).toHaveBeenCalledWith({
          questions: [
            {
              id: 'q1',
              text: 'What is the severity?',
              attributeId: '246112005',
              attributeName: 'Severity',
              inputType: 'single_select',
              options: [{ label: 'Mild', value: 'mild', conceptId: '255604002' }],
              required: false,
              relatedTermIndex: 0,
              hint: undefined,
            },
          ],
        });
      });

      it('emits expression_ready events', () => {
        const listener = vi.fn();
        service.on('expression_ready', listener);

        const data: ExpressionReadyData = {
          ecl: '29857009 |Chest pain|',
          description: 'Chest pain expression',
        };

        mockWs.simulateMessage({ type: 'expression_ready', data });

        expect(listener).toHaveBeenCalledWith(data);
      });

      it('emits error events', () => {
        const listener = vi.fn();
        service.on('error', listener);

        const data: ErrorData = {
          code: 'EXTRACTION_FAILED',
          message: 'LLM service unavailable',
        };

        mockWs.simulateMessage({ type: 'error', data });

        expect(listener).toHaveBeenCalledWith(data);
      });

      it('handles invalid JSON gracefully', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        if (mockWs.onmessage) {
          mockWs.onmessage(new MessageEvent('message', { data: 'invalid json' }));
        }

        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
      });
    });

    describe('event subscription', () => {
      it('on() subscribes and returns unsubscribe function', () => {
        const listener = vi.fn();
        const unsubscribe = service.on('state_change', listener);

        service.connect('session-123');
        mockWs.simulateOpen();

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'extracting', current: 'matching', timestamp: '' },
        });

        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'matching', current: 'confirming', timestamp: '' },
        });

        // Should not be called again after unsubscribe
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('once() subscribes and auto-unsubscribes after first call', () => {
        const listener = vi.fn();
        service.once('state_change', listener);

        service.connect('session-123');
        mockWs.simulateOpen();

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'extracting', current: 'matching', timestamp: '' },
        });

        expect(listener).toHaveBeenCalledTimes(1);

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'matching', current: 'confirming', timestamp: '' },
        });

        // Should not be called again
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('off() removes all listeners for a type', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();
        service.on('state_change', listener1);
        service.on('state_change', listener2);

        service.connect('session-123');
        mockWs.simulateOpen();

        service.off('state_change');

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'extracting', current: 'matching', timestamp: '' },
        });

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
      });

      it('off() with no argument removes all listeners', () => {
        const stateListener = vi.fn();
        const progressListener = vi.fn();
        service.on('state_change', stateListener);
        service.on('progress', progressListener);

        service.connect('session-123');
        mockWs.simulateOpen();

        service.off();

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'extracting', current: 'matching', timestamp: '' },
        });
        mockWs.simulateMessage({
          type: 'progress',
          data: { step: 'test', percent_complete: 50 },
        });

        expect(stateListener).not.toHaveBeenCalled();
        expect(progressListener).not.toHaveBeenCalled();
      });

      it('handles listener errors gracefully', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorListener = vi.fn(() => {
          throw new Error('Listener error');
        });
        const normalListener = vi.fn();

        service.on('state_change', errorListener);
        service.on('state_change', normalListener);

        service.connect('session-123');
        mockWs.simulateOpen();

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'extracting', current: 'matching', timestamp: '' },
        });

        // Error should be logged but not throw
        expect(consoleError).toHaveBeenCalled();
        // Other listeners should still be called
        expect(normalListener).toHaveBeenCalled();

        consoleError.mockRestore();
      });
    });

    describe('getConnectionState', () => {
      it('returns current connection state', () => {
        expect(service.getConnectionState()).toBe('disconnected');

        service.connect('session-123');
        expect(service.getConnectionState()).toBe('connecting');

        mockWs.simulateOpen();
        expect(service.getConnectionState()).toBe('connected');

        service.disconnect();
        expect(service.getConnectionState()).toBe('disconnected');
      });
    });

    describe('isConnected', () => {
      it('returns true only when fully connected', () => {
        expect(service.isConnected()).toBe(false);

        service.connect('session-123');
        expect(service.isConnected()).toBe(false);

        mockWs.simulateOpen();
        expect(service.isConnected()).toBe(true);

        service.disconnect();
        expect(service.isConnected()).toBe(false);
      });
    });

    describe('destroy', () => {
      it('disconnects and clears all listeners', () => {
        const listener = vi.fn();
        service.on('state_change', listener);

        service.connect('session-123');
        mockWs.simulateOpen();

        service.destroy();

        expect(service.getConnectionState()).toBe('disconnected');

        // Create new connection to test listeners are cleared
        service.connect('session-456');
        mockWs.simulateOpen();

        mockWs.simulateMessage({
          type: 'state_change',
          data: { previous: 'extracting', current: 'matching', timestamp: '' },
        });

        // Listener should not be called (was cleared)
        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe('ping/keep-alive', () => {
      it('sends ping messages when connected', async () => {
        const sendSpy = vi.fn();

        service.connect('session-123');
        mockWs.send = sendSpy;
        mockWs.simulateOpen();

        // Advance past ping interval
        await vi.advanceTimersByTimeAsync(5000);

        expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
      });

      it('stops ping on disconnect', async () => {
        const sendSpy = vi.fn();

        service.connect('session-123');
        mockWs.send = sendSpy;
        mockWs.simulateOpen();

        service.disconnect();
        sendSpy.mockClear();

        // Advance past ping interval
        await vi.advanceTimersByTimeAsync(10000);

        expect(sendSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('wsService singleton', () => {
    it('exports default instance', () => {
      expect(wsService).toBeInstanceOf(WebSocketService);
    });
  });
});
