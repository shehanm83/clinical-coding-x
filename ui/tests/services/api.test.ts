/**
 * API Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ApiService,
  ApiError,
  apiService,
  type ApiErrorCode,
  type CreateSessionResponse,
  type SearchResultsResponse,
  type HealthResponse,
} from '../../src/services/api.js';
import type { Session } from '../../src/state/contexts/session-context.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api.ts', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ApiError', () => {
    it('creates error with all properties', () => {
      const error = new ApiError('SESSION_NOT_FOUND', 'Not found', 404, { id: '123' }, 'req-1');

      expect(error.code).toBe('SESSION_NOT_FOUND');
      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.details).toEqual({ id: '123' });
      expect(error.requestId).toBe('req-1');
      expect(error.name).toBe('ApiError');
    });

    it('isRetryable returns true for network errors', () => {
      const error = new ApiError('NETWORK_ERROR', 'Network failed');
      expect(error.isRetryable()).toBe(true);
    });

    it('isRetryable returns true for timeout', () => {
      const error = new ApiError('TIMEOUT', 'Timed out');
      expect(error.isRetryable()).toBe(true);
    });

    it('isRetryable returns true for service unavailable', () => {
      const error = new ApiError('SERVICE_UNAVAILABLE', 'Service down', 503);
      expect(error.isRetryable()).toBe(true);
    });

    it('isRetryable returns true for rate limited', () => {
      const error = new ApiError('RATE_LIMITED', 'Too many requests', 429);
      expect(error.isRetryable()).toBe(true);
    });

    it('isRetryable returns false for client errors', () => {
      const error = new ApiError('INVALID_INPUT', 'Bad request', 400);
      expect(error.isRetryable()).toBe(false);
    });
  });

  describe('ApiService', () => {
    let service: ApiService;

    beforeEach(() => {
      service = new ApiService({ baseUrl: '/api/v2' });
    });

    describe('createSession', () => {
      it('creates session successfully', async () => {
        const mockResponse: CreateSessionResponse = {
          session_id: 'session-123',
          state: 'extracting',
          created_at: '2024-12-17T10:00:00Z',
          message: 'Session created',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResponse,
        });

        const result = await service.createSession('chest pain', { specialty: 'cardiology' });

        expect(mockFetch).toHaveBeenCalledWith('/api/v2/sessions', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'chest pain', context: { specialty: 'cardiology' } }),
        }));
        expect(result.session_id).toBe('session-123');
      });

      it('throws ApiError on 400 validation error', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            error: { code: 'INVALID_INPUT', message: 'Text is required' },
          }),
        });

        try {
          await service.createSession('');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          const apiError = error as ApiError;
          expect(apiError.code).toBe('INVALID_INPUT');
          expect(apiError.status).toBe(400);
        }
      });
    });

    describe('getSession', () => {
      it('gets session and transforms response', async () => {
        const mockApiResponse = {
          session_id: 'session-123',
          state: 'confirming',
          created_at: '2024-12-17T10:00:00Z',
          updated_at: '2024-12-17T10:00:05Z',
          original_text: 'chest pain',
          extracted_terms: [
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
          term_matches: [
            {
              term_index: 0,
              matches: [
                {
                  id: '29857009',
                  term: 'Chest pain',
                  fsn: 'Chest pain (finding)',
                  semantic_tag: 'finding',
                  similarity: 0.95,
                },
              ],
              selected_id: null,
              needs_confirmation: true,
            },
          ],
          pending_questions: [],
          responses: [],
          confirmed_attributes: [],
          metrics: {
            total_time_ms: 100,
            llm_tokens_used: 50,
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockApiResponse,
        });

        const result = await service.getSession('session-123');

        expect(mockFetch).toHaveBeenCalledWith('/api/v2/sessions/session-123', expect.any(Object));
        expect(result.id).toBe('session-123');
        expect(result.state).toBe('confirming');
        expect(result.originalText).toBe('chest pain');
        expect(result.extractedTerms).toHaveLength(1);
        expect(result.extractedTerms[0].text).toBe('chest pain');
        expect(result.termMatches).toHaveLength(1);
        expect(result.termMatches[0].termIndex).toBe(0);
        expect(result.termMatches[0].matches[0].semanticTag).toBe('finding');
        expect(result.metrics.totalTimeMs).toBe(100);
      });

      it('throws ApiError on 404', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
          }),
        });

        try {
          await service.getSession('invalid-id');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).code).toBe('SESSION_NOT_FOUND');
          expect((error as ApiError).status).toBe(404);
        }
      });
    });

    describe('confirmConcepts', () => {
      it('confirms concepts with snake_case transformation', async () => {
        const mockApiResponse = {
          session_id: 'session-123',
          state: 'questioning',
          created_at: '2024-12-17T10:00:00Z',
          updated_at: '2024-12-17T10:00:10Z',
          original_text: 'chest pain',
          extracted_terms: [],
          term_matches: [
            {
              term_index: 0,
              matches: [],
              selected_id: '29857009',
              selected_term: 'Chest pain',
              needs_confirmation: false,
            },
          ],
          pending_questions: [
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
          responses: [],
          confirmed_attributes: [],
          metrics: { total_time_ms: 150, llm_tokens_used: 75 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockApiResponse,
        });

        const result = await service.confirmConcepts('session-123', [
          { termIndex: 0, conceptId: '29857009' },
        ]);

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v2/sessions/session-123/confirm',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              selections: [{ term_index: 0, concept_id: '29857009' }],
            }),
          })
        );
        expect(result.state).toBe('questioning');
        expect(result.pendingQuestions).toHaveLength(1);
        expect(result.pendingQuestions[0].attributeId).toBe('246112005');
        expect(result.pendingQuestions[0].options[0].conceptId).toBe('255604002');
      });
    });

    describe('submitResponses', () => {
      it('submits responses successfully', async () => {
        const mockApiResponse = {
          session_id: 'session-123',
          state: 'building',
          created_at: '2024-12-17T10:00:00Z',
          updated_at: '2024-12-17T10:00:20Z',
          original_text: 'chest pain',
          extracted_terms: [],
          term_matches: [],
          pending_questions: [],
          responses: [{ question_id: 'q1', value: 'severe', concept_id: '24484000' }],
          confirmed_attributes: [],
          metrics: { total_time_ms: 200, llm_tokens_used: 100 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockApiResponse,
        });

        const result = await service.submitResponses('session-123', [
          { questionId: 'q1', value: 'severe', conceptId: '24484000' },
        ]);

        expect(result.state).toBe('building');
        expect(result.responses[0].questionId).toBe('q1');
      });
    });

    describe('skipQuestions', () => {
      it('skips all questions', async () => {
        const mockApiResponse = {
          session_id: 'session-123',
          state: 'building',
          created_at: '2024-12-17T10:00:00Z',
          updated_at: '2024-12-17T10:00:25Z',
          original_text: 'chest pain',
          extracted_terms: [],
          term_matches: [],
          pending_questions: [],
          responses: [],
          confirmed_attributes: [],
          metrics: { total_time_ms: 250, llm_tokens_used: 100 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockApiResponse,
        });

        const result = await service.skipQuestions('session-123');

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v2/sessions/session-123/skip',
          expect.objectContaining({
            body: JSON.stringify({ skip_all: true }),
          })
        );
        expect(result.state).toBe('building');
      });

      it('skips specific questions', async () => {
        const mockApiResponse = {
          session_id: 'session-123',
          state: 'questioning',
          created_at: '2024-12-17T10:00:00Z',
          updated_at: '2024-12-17T10:00:25Z',
          original_text: 'chest pain',
          extracted_terms: [],
          term_matches: [],
          pending_questions: [],
          responses: [],
          confirmed_attributes: [],
          metrics: { total_time_ms: 250, llm_tokens_used: 100 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockApiResponse,
        });

        await service.skipQuestions('session-123', ['q1', 'q2']);

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v2/sessions/session-123/skip',
          expect.objectContaining({
            body: JSON.stringify({ question_ids: ['q1', 'q2'] }),
          })
        );
      });
    });

    describe('getExpression', () => {
      it('gets expression and transforms response', async () => {
        const mockApiResponse = {
          expression: {
            ecl: '29857009 |Chest pain|',
            description: 'Chest pain expression',
            fsn: 'Chest pain (finding)',
            expression_type: 'postcoordinated',
            validation: {
              valid: true,
              mrcm_compliant: true,
              errors: [],
              warnings: [],
            },
            formatted: {
              brief: '29857009',
              long: '29857009 |Chest pain|',
              nested: '29857009 |Chest pain|',
            },
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockApiResponse,
        });

        const result = await service.getExpression('session-123');

        expect(result.ecl).toBe('29857009 |Chest pain|');
        expect(result.expressionType).toBe('postcoordinated');
        expect(result.validation.mrcmCompliant).toBe(true);
      });
    });

    describe('deleteSession', () => {
      it('deletes session successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers(),
        });

        await expect(service.deleteSession('session-123')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v2/sessions/session-123',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    describe('searchConcepts', () => {
      it('searches concepts with options', async () => {
        const mockResponse: SearchResultsResponse = {
          results: [
            { id: '29857009', term: 'Chest pain', fsn: 'Chest pain (finding)', semanticTag: 'finding', similarity: 0.95 },
          ],
          total: 1,
          limit: 10,
          offset: 0,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResponse,
        });

        const result = await service.searchConcepts('chest pain', { domain: 'finding', limit: 10 });

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v2/search?q=chest+pain&domain=finding&limit=10',
          expect.any(Object)
        );
        expect(result.results).toHaveLength(1);
      });
    });

    describe('getConcept', () => {
      it('gets concept details', async () => {
        const mockResponse = {
          id: '29857009',
          term: 'Chest pain',
          fsn: 'Chest pain (finding)',
          semanticTag: 'finding',
          active: true,
          parents: [{ id: '22253000', term: 'Pain' }],
          children: [],
          attributes: [],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResponse,
        });

        const result = await service.getConcept('29857009');

        expect(result.id).toBe('29857009');
        expect(result.active).toBe(true);
        expect(result.parents).toHaveLength(1);
      });
    });

    describe('health', () => {
      it('gets health status', async () => {
        const mockResponse: HealthResponse = {
          status: 'healthy',
          version: '2.0.0',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResponse,
        });

        const result = await service.health();

        expect(result.status).toBe('healthy');
      });

      it('health check does not retry', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            error: { code: 'SERVICE_UNAVAILABLE', message: 'Down' },
          }),
        });

        await expect(service.health()).rejects.toThrow(ApiError);
        expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
      });
    });

    describe('retry logic', () => {
      it('service with retry disabled fails immediately', async () => {
        const noRetryService = new ApiService({
          baseUrl: '/api/v2',
          retry: { maxAttempts: 1, initialDelayMs: 0, maxDelayMs: 0, retryableStatuses: [] },
        });

        mockFetch.mockResolvedValue({
          ok: false,
          status: 503,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Down' } }),
        });

        await expect(noRetryService.getSession('session-123')).rejects.toThrow(ApiError);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('error includes correct status code', async () => {
        const noRetryService = new ApiService({
          baseUrl: '/api/v2',
          retry: { maxAttempts: 1, initialDelayMs: 0, maxDelayMs: 0, retryableStatuses: [] },
        });

        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: { code: 'UNKNOWN', message: 'Server error' } }),
        });

        try {
          await noRetryService.getSession('session-123');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(500);
        }
      });
    });

    describe('timeout handling', () => {
      it('aborted requests result in TIMEOUT error', async () => {
        // Mock fetch that simulates an abort
        mockFetch.mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

        const noRetryService = new ApiService({
          baseUrl: '/api/v2',
          retry: { maxAttempts: 1, initialDelayMs: 0, maxDelayMs: 0, retryableStatuses: [] },
        });

        try {
          await noRetryService.getSession('session-123');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).code).toBe('TIMEOUT');
        }
      });
    });

    describe('network error handling', () => {
      it('network errors result in NETWORK_ERROR', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        const noRetryService = new ApiService({
          baseUrl: '/api/v2',
          retry: { maxAttempts: 1, initialDelayMs: 0, maxDelayMs: 0, retryableStatuses: [] },
        });

        try {
          await noRetryService.getSession('session-123');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).code).toBe('NETWORK_ERROR');
          expect((error as ApiError).isRetryable()).toBe(true);
        }
      });
    });
  });

  describe('apiService singleton', () => {
    it('exports default instance', () => {
      expect(apiService).toBeInstanceOf(ApiService);
    });
  });
});
