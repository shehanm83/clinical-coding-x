/**
 * Session Context Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sessionContext,
  sessionLoadingContext,
  sessionErrorContext,
  defaultSessionContext,
  type Session,
  type SessionState,
  type ExtractedTerm,
  type TermMatch,
  type Question,
  type QuestionResponse,
  type ConfirmedAttribute,
  type ECLExpression,
  type SessionMetrics,
} from '../../../src/state/contexts/session-context.js';

describe('session-context', () => {
  describe('context creation', () => {
    it('exports sessionContext', () => {
      expect(sessionContext).toBeDefined();
    });

    it('exports sessionLoadingContext', () => {
      expect(sessionLoadingContext).toBeDefined();
    });

    it('exports sessionErrorContext', () => {
      expect(sessionErrorContext).toBeDefined();
    });
  });

  describe('defaultSessionContext', () => {
    it('has null session by default', () => {
      expect(defaultSessionContext.session).toBeNull();
    });

    it('has loading false by default', () => {
      expect(defaultSessionContext.loading).toBe(false);
    });

    it('has null error by default', () => {
      expect(defaultSessionContext.error).toBeNull();
    });

    it('has action methods that throw when not provided', async () => {
      // Async methods reject with error
      await expect(defaultSessionContext.createSession('test')).rejects.toThrow('SessionContext not provided');
      await expect(defaultSessionContext.confirmConcepts([])).rejects.toThrow('SessionContext not provided');
      await expect(defaultSessionContext.submitResponses([])).rejects.toThrow('SessionContext not provided');
      await expect(defaultSessionContext.skipQuestions()).rejects.toThrow('SessionContext not provided');
      await expect(defaultSessionContext.refreshSession()).rejects.toThrow('SessionContext not provided');

      // Sync method throws directly
      expect(() => defaultSessionContext.clearSession()).toThrow('SessionContext not provided');
    });
  });

  describe('type definitions', () => {
    it('SessionState has all required states', () => {
      const states: SessionState[] = [
        'initial',
        'extracting',
        'matching',
        'confirming',
        'questioning',
        'building',
        'completed',
        'error',
      ];
      expect(states).toHaveLength(8);
    });

    it('Session interface has required properties', () => {
      const session: Session = {
        id: 'test-id',
        state: 'initial',
        originalText: 'test text',
        extractedTerms: [],
        termMatches: [],
        pendingQuestions: [],
        responses: [],
        confirmedAttributes: [],
        metrics: { totalTimeMs: 0, llmTokensUsed: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(session.id).toBe('test-id');
      expect(session.state).toBe('initial');
      expect(session.originalText).toBe('test text');
    });

    it('ExtractedTerm interface has required properties', () => {
      const term: ExtractedTerm = {
        text: 'chest pain',
        normalized: 'chest pain',
        type: 'finding',
        confidence: 0.95,
        span: { start: 0, end: 10 },
        modifiers: [],
        negated: false,
      };

      expect(term.text).toBe('chest pain');
      expect(term.type).toBe('finding');
      expect(term.confidence).toBe(0.95);
    });

    it('TermMatch interface has required properties', () => {
      const match: TermMatch = {
        termIndex: 0,
        matches: [
          {
            id: '12345',
            term: 'Chest pain',
            fsn: 'Chest pain (finding)',
            semanticTag: 'finding',
            similarity: 0.95,
          },
        ],
        selectedId: null,
        needsConfirmation: true,
      };

      expect(match.termIndex).toBe(0);
      expect(match.matches).toHaveLength(1);
      expect(match.needsConfirmation).toBe(true);
    });

    it('Question interface has required properties', () => {
      const question: Question = {
        id: 'q1',
        text: 'What is the severity?',
        attributeId: '123',
        attributeName: 'Severity',
        inputType: 'single_select',
        options: [{ label: 'Mild', value: 'mild', conceptId: '456' }],
        required: false,
        relatedTermIndex: 0,
      };

      expect(question.id).toBe('q1');
      expect(question.inputType).toBe('single_select');
      expect(question.options).toHaveLength(1);
    });

    it('QuestionResponse interface has required properties', () => {
      const response: QuestionResponse = {
        questionId: 'q1',
        value: 'mild',
        conceptId: '456',
      };

      expect(response.questionId).toBe('q1');
      expect(response.value).toBe('mild');
    });

    it('ConfirmedAttribute interface has required properties', () => {
      const attr: ConfirmedAttribute = {
        conceptId: '123',
        attributeId: '456',
        attributeName: 'Severity',
        valueId: '789',
        valueName: 'Mild',
        roleGroup: 0,
      };

      expect(attr.conceptId).toBe('123');
      expect(attr.attributeName).toBe('Severity');
      expect(attr.roleGroup).toBe(0);
    });

    it('ECLExpression interface has required properties', () => {
      const expression: ECLExpression = {
        ecl: '12345 |Test|',
        description: 'Test expression',
        fsn: 'Test (finding)',
        expressionType: 'postcoordinated',
        validation: {
          valid: true,
          mrcmCompliant: true,
          errors: [],
          warnings: [],
        },
        formatted: {
          brief: '12345',
          long: '12345 |Test|',
          nested: '12345 |Test|',
        },
      };

      expect(expression.ecl).toBe('12345 |Test|');
      expect(expression.expressionType).toBe('postcoordinated');
      expect(expression.validation.valid).toBe(true);
    });

    it('SessionMetrics interface has required properties', () => {
      const metrics: SessionMetrics = {
        totalTimeMs: 100,
        llmTokensUsed: 50,
        extractionTimeMs: 25,
        matchingTimeMs: 25,
      };

      expect(metrics.totalTimeMs).toBe(100);
      expect(metrics.llmTokensUsed).toBe(50);
    });
  });
});
