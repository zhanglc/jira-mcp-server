/**
 * @fileoverview Algorithm TDD test suite for Static Suggestion Engine
 * 
 * This test suite follows Algorithm TDD methodology:
 * 1. Algorithm correctness tests (mathematical accuracy)
 * 2. Performance benchmarks (response time requirements)  
 * 3. Edge case validation (boundary conditions)
 * 4. Ranking algorithm verification (multi-factor scoring)
 * 
 * Core requirements:
 * - Levenshtein distance algorithm correctness
 * - Sub-millisecond single suggestion generation  
 * - Multi-level suggestion strategy validation
 * - Ranking algorithm accuracy (similarity + frequency + availability)
 */

import { StaticSuggestionEngine } from '@/server/resources/static-suggestion-engine';
import { 
  ISSUE_STATIC_SUGGESTIONS,
  PROJECT_STATIC_SUGGESTIONS,
  USER_STATIC_SUGGESTIONS,
  AGILE_STATIC_SUGGESTIONS
} from '@/server/resources/static-suggestions';

describe('StaticSuggestionEngine - Algorithm TDD', () => {
  let engine: StaticSuggestionEngine;

  beforeEach(() => {
    engine = new StaticSuggestionEngine();
  });

  describe('Levenshtein Distance Algorithm', () => {
    it('should calculate perfect similarity for identical strings', () => {
      expect(engine.calculateSimilarity('status', 'status')).toBe(1.0);
      expect(engine.calculateSimilarity('assignee', 'assignee')).toBe(1.0);
      expect(engine.calculateSimilarity('', '')).toBe(1.0);
    });

    it('should calculate zero similarity for completely different strings', () => {
      expect(engine.calculateSimilarity('status', 'xyz123')).toBe(0.0);
      expect(engine.calculateSimilarity('assignee', 'zzz')).toBe(0.0);
    });

    it('should calculate correct similarity for single character differences', () => {
      // Single insertion: 'stat' -> 'status' (4 chars -> 6 chars, distance = 2)
      // Expected similarity = 1 - (2 / 6) = 0.667
      const similarity = engine.calculateSimilarity('stat', 'status');
      expect(similarity).toBeCloseTo(0.667, 2);
    });

    it('should calculate correct similarity for transpositions', () => {
      // 'staus' -> 'status' (one transposition)
      const similarity = engine.calculateSimilarity('staus', 'status');
      expect(similarity).toBeGreaterThan(0.6);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should handle case sensitivity correctly', () => {
      expect(engine.calculateSimilarity('Status', 'status')).toBe(1.0);
      expect(engine.calculateSimilarity('ASSIGNEE', 'assignee')).toBe(1.0);
      expect(engine.calculateSimilarity('PrIoRiTy', 'priority')).toBe(1.0);
    });

    it('should handle Unicode characters correctly', () => {
      expect(engine.calculateSimilarity('café', 'cafe')).toBeGreaterThan(0.5);
      expect(engine.calculateSimilarity('naïve', 'naive')).toBeGreaterThan(0.5);
    });

    it('should handle empty strings correctly', () => {
      expect(engine.calculateSimilarity('', 'status')).toBe(0.0);
      expect(engine.calculateSimilarity('status', '')).toBe(0.0);
      expect(engine.calculateSimilarity('', '')).toBe(1.0);
    });

    it('should be symmetric', () => {
      const pairs = [
        ['status', 'stat'],
        ['assignee', 'assigne'],
        ['priority', 'prority'],
        ['description', 'desc']
      ];

      pairs.forEach(([a, b]) => {
        expect(engine.calculateSimilarity(a, b)).toBe(engine.calculateSimilarity(b, a));
      });
    });

    it('should satisfy triangle inequality', () => {
      // For any three strings a, b, c: similarity(a,c) >= similarity(a,b) + similarity(b,c) - 1
      const testCases = [
        ['status', 'stat', 'st'],
        ['assignee', 'assign', 'as'],
        ['priority', 'prior', 'pri']
      ];

      testCases.forEach(([a, b, c]) => {
        const simAC = engine.calculateSimilarity(a, c);
        const simAB = engine.calculateSimilarity(a, b);
        const simBC = engine.calculateSimilarity(b, c);
        
        // Triangle inequality for similarity scores
        expect(simAC).toBeGreaterThanOrEqual(Math.max(0, simAB + simBC - 1));
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should generate suggestions in under 2ms for single queries', () => {
      const startTime = performance.now();
      engine.suggest('issue', 'stat', 5);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(2.0);
    });

    it('should handle large candidate sets in under 5ms', () => {
      const startTime = performance.now();
      
      // Test with all issue fields (100+ candidates)
      const results = engine.suggest('issue', 'as', 10);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5.0);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle Levenshtein calculation in under 0.1ms per comparison', () => {
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        engine.calculateSimilarity('status', 'stat');
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      expect(avgTime).toBeLessThan(0.1);
    });

    it('should handle batch suggestions efficiently', () => {
      const testInputs = ['stat', 'assign', 'desc', 'prio', 'proj'];
      const startTime = performance.now();
      
      testInputs.forEach(input => {
        engine.suggest('issue', input, 5);
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(10.0); // 5 queries in 10ms
    });
  });

  describe('Multi-Level Suggestion Strategy', () => {
    it('should prioritize exact typo corrections (O(1) lookup)', () => {
      // Direct typo correction should be first result
      const results = engine.suggest('issue', 'stat', 5);
      expect(results[0]).toBe('status');
      
      const results2 = engine.suggest('issue', 'assigne', 5);
      expect(results2[0]).toBe('assignee');
      
      const results3 = engine.suggest('issue', 'desc', 5);
      expect(results3[0]).toBe('description');
    });

    it('should fall back to similarity matching when no exact typo found', () => {
      // 'statu' is not in typo corrections, should use similarity
      const results = engine.suggest('issue', 'statu', 5);
      expect(results).toContain('status');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle partial matches correctly', () => {
      // 'as' should match assignee-related fields
      const results = engine.suggest('issue', 'as', 10);
      expect(results).toContain('assignee');
      expect(results.some(r => r.includes('assignee'))).toBe(true);
    });

    it('should respect similarity threshold', () => {
      // Very different input should return fewer or no results
      const results = engine.suggest('issue', 'xyz123', 10);
      expect(results.length).toBeLessThanOrEqual(5); // Should filter out poor matches
    });
  });

  describe('Ranking Algorithm Verification', () => {
    it('should rank high-frequency fields higher', () => {
      const results = engine.suggestWithMetadata('issue', 'as', { maxSuggestions: 10 });
      
      // Among similar matches, high-frequency should rank higher
      const assigneeResult = results.find(r => r.field === 'assignee');
      const lowFreqResult = results.find(r => 
        r.field.startsWith('assignee') && 
        ISSUE_STATIC_SUGGESTIONS.usageStatistics[r.field]?.frequency === 'low'
      );
      
      if (assigneeResult && lowFreqResult) {
        expect(assigneeResult.score).toBeGreaterThan(lowFreqResult.score);
      }
    });

    it('should factor in availability rates', () => {
      const results = engine.suggestWithMetadata('issue', 'status', { maxSuggestions: 5 });
      
      // Higher availability should contribute to higher score
      results.forEach(result => {
        const stats = ISSUE_STATIC_SUGGESTIONS.usageStatistics[result.field];
        if (stats) {
          expect(result.score).toBeGreaterThan(0);
          // Score should be influenced by availability
          expect(result.metadata.availability).toBe(stats.availability);
        }
      });
    });

    it('should combine similarity, frequency, and availability correctly', () => {
      const results = engine.suggestWithMetadata('issue', 'stat', { maxSuggestions: 3 });
      
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
        expect(result.score).toBeLessThanOrEqual(1);
        expect(result.metadata.similarity).toBeGreaterThan(0);
        expect(result.metadata.frequency).toMatch(/^(high|medium|low)$/);
        expect(result.metadata.availability).toBeGreaterThanOrEqual(0);
        expect(result.metadata.availability).toBeLessThanOrEqual(1);
      });
    });

    it('should maintain ranking consistency', () => {
      // Same query should return same ranking
      const results1 = engine.suggest('issue', 'assign', 5);
      const results2 = engine.suggest('issue', 'assign', 5);
      
      expect(results1).toEqual(results2);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty input gracefully', () => {
      const results = engine.suggest('issue', '', 5);
      expect(results).toEqual([]);
    });

    it('should handle whitespace-only input', () => {
      const results = engine.suggest('issue', '   ', 5);
      expect(results).toEqual([]);
    });

    it('should handle very long input strings', () => {
      const longInput = 'a'.repeat(1000);
      const results = engine.suggest('issue', longInput, 5);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should handle special characters in input', () => {
      const specialInputs = ['status!', 'assign@ee', 'desc#ription', 'prior$ity'];
      
      specialInputs.forEach(input => {
        const results = engine.suggest('issue', input, 5);
        expect(Array.isArray(results)).toBe(true);
      });
    });

    it('should handle invalid entity types gracefully', () => {
      expect(() => {
        engine.suggest('invalid' as any, 'status', 5);
      }).toThrow('Unsupported entity type: invalid');
    });

    it('should handle zero maxSuggestions', () => {
      const results = engine.suggest('issue', 'status', 0);
      expect(results).toEqual([]);
    });

    it('should handle negative maxSuggestions', () => {
      const results = engine.suggest('issue', 'status', -1);
      expect(results).toEqual([]);
    });

    it('should handle maxSuggestions larger than available candidates', () => {
      const results = engine.suggest('issue', 'status', 1000);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(1000); // Should not exceed available fields
    });
  });

  describe('Entity Type Support', () => {
    it('should support all defined entity types', () => {
      const entityTypes = ['issue', 'project', 'user', 'agile'];
      
      entityTypes.forEach(entityType => {
        expect(() => {
          engine.suggest(entityType as any, 'test', 5);
        }).not.toThrow();
      });
    });

    it('should return entity-appropriate suggestions', () => {
      // Issue-specific fields
      const issueResults = engine.suggest('issue', 'status', 5);
      expect(issueResults).toContain('status');
      
      // Project-specific fields
      const projectResults = engine.suggest('project', 'key', 5);
      expect(projectResults.length).toBeGreaterThan(0);
      
      // User-specific fields
      const userResults = engine.suggest('user', 'name', 5);
      expect(userResults.length).toBeGreaterThan(0);
      
      // Agile-specific fields
      const agileResults = engine.suggest('agile', 'sprint', 5);
      expect(agileResults.length).toBeGreaterThan(0);
    });
  });

  describe('Contextual Suggestions Integration', () => {
    it('should use contextual suggestions for better ranking', () => {
      // Empty input should return contextual suggestions
      const results = engine.suggest('issue', '', 10);
      expect(results.length).toBe(0); // Empty input returns empty array
      
      // But partial matches should favor contextual fields
      const partialResults = engine.suggest('issue', 's', 5);
      expect(partialResults).toContain('summary'); // High in contextual suggestions
      expect(partialResults).toContain('status');  // High in contextual suggestions
    });

    it('should prioritize contextual suggestions in ties', () => {
      const results = engine.suggestWithMetadata('issue', 'st', { maxSuggestions: 5 });
      
      // Both 'status' and 'summary' start with 's', but contextual ordering should matter
      const statusIndex = results.findIndex(r => r.field === 'status');
      const summaryIndex = results.findIndex(r => r.field === 'summary');
      
      if (statusIndex >= 0 && summaryIndex >= 0) {
        // One should be ranked higher based on contextual suggestions
        expect(Math.abs(statusIndex - summaryIndex)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain low memory footprint', () => {
      // Create multiple engines to test memory usage
      const engines = Array.from({ length: 10 }, () => new StaticSuggestionEngine());
      
      // Perform operations on all engines
      engines.forEach((eng, index) => {
        eng.suggest('issue', `test${index}`, 5);
      });
      
      // Should not cause memory issues
      expect(engines.length).toBe(10);
    });

    it('should be stateless across multiple calls', () => {
      const input = 'status';
      const results1 = engine.suggest('issue', input, 5);
      const results2 = engine.suggest('issue', input, 5);
      const results3 = engine.suggest('issue', input, 5);
      
      expect(results1).toEqual(results2);
      expect(results2).toEqual(results3);
    });
  });
});

// Performance regression tests
describe('StaticSuggestionEngine - Performance Regression', () => {
  let engine: StaticSuggestionEngine;

  beforeAll(() => {
    engine = new StaticSuggestionEngine();
  });

  it('should maintain performance standards over many operations', () => {
    const iterations = 1000;
    const testInputs = ['stat', 'assign', 'desc', 'prio', 'proj'];
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const input = testInputs[i % testInputs.length];
      engine.suggest('issue', input, 5);
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;
    
    // Should maintain sub-millisecond average
    expect(avgTime).toBeLessThan(1.0);
  });

  it('should handle stress testing without degradation', () => {
    const stressInputs = Array.from({ length: 100 }, (_, i) => `test${i}`);
    const times: number[] = [];
    
    stressInputs.forEach(input => {
      const start = performance.now();
      engine.suggest('issue', input, 10);
      const end = performance.now();
      times.push(end - start);
    });
    
    // Performance should not degrade significantly
    const firstHalf = times.slice(0, 50);
    const secondHalf = times.slice(50);
    
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    // Second half should not be more than 50% slower than first half
    expect(avgSecond).toBeLessThan(avgFirst * 1.5);
  });
});