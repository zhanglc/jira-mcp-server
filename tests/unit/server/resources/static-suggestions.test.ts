/**
 * Test for static suggestion data files
 * Validates data structure, content quality, and coverage
 */

import type { StaticSuggestionData } from '@/types/static-suggestions';

describe('Static Suggestion Data Files', () => {
  let issueSuggestions: StaticSuggestionData;
  let projectSuggestions: StaticSuggestionData;
  let userSuggestions: StaticSuggestionData;
  let agileSuggestions: StaticSuggestionData;

  beforeAll(async () => {
    // Import all static suggestion data
    const { ISSUE_STATIC_SUGGESTIONS } = await import('@/server/resources/static-suggestions/issue-suggestions');
    const { PROJECT_STATIC_SUGGESTIONS } = await import('@/server/resources/static-suggestions/project-suggestions');
    const { USER_STATIC_SUGGESTIONS } = await import('@/server/resources/static-suggestions/user-suggestions');
    const { AGILE_STATIC_SUGGESTIONS } = await import('@/server/resources/static-suggestions/agile-suggestions');

    issueSuggestions = ISSUE_STATIC_SUGGESTIONS;
    projectSuggestions = PROJECT_STATIC_SUGGESTIONS;
    userSuggestions = USER_STATIC_SUGGESTIONS;
    agileSuggestions = AGILE_STATIC_SUGGESTIONS;
  });

  describe('Data Structure Validation', () => {
    it.each([
      ['issue', () => issueSuggestions],
      ['project', () => projectSuggestions],
      ['user', () => userSuggestions],
      ['agile', () => agileSuggestions],
    ])('should have valid structure for %s suggestions', (entityType, getSuggestions) => {
      const suggestions = getSuggestions();
      
      expect(suggestions).toBeDefined();
      expect(suggestions.entityType).toBe(entityType);
      expect(suggestions.typoCorrections).toBeDefined();
      expect(suggestions.usageStatistics).toBeDefined();
      expect(suggestions.contextualSuggestions).toBeDefined();
      expect(suggestions.customFieldPatterns).toBeDefined();
      expect(suggestions.lastAnalyzed).toBeDefined();
      
      // Validate timestamp format
      expect(new Date(suggestions.lastAnalyzed).toString()).not.toBe('Invalid Date');
    });

    it.each([
      ['issue', () => issueSuggestions],
      ['project', () => projectSuggestions],
      ['user', () => userSuggestions],
      ['agile', () => agileSuggestions],
    ])('should have properly typed typoCorrections for %s', (entityType, getSuggestions) => {
      const suggestions = getSuggestions();
      
      expect(typeof suggestions.typoCorrections).toBe('object');
      
      Object.entries(suggestions.typoCorrections).forEach(([typo, correction]) => {
        expect(typeof typo).toBe('string');
        expect(typeof correction).toBe('string');
        expect(typo.length).toBeGreaterThan(0);
        expect(correction.length).toBeGreaterThan(0);
        expect(typo).not.toBe(correction);
      });
    });

    it.each([
      ['issue', () => issueSuggestions],
      ['project', () => projectSuggestions],
      ['user', () => userSuggestions],
      ['agile', () => agileSuggestions],
    ])('should have properly typed usageStatistics for %s', (entityType, getSuggestions) => {
      const suggestions = getSuggestions();
      
      expect(typeof suggestions.usageStatistics).toBe('object');
      
      Object.entries(suggestions.usageStatistics).forEach(([field, stats]) => {
        expect(typeof field).toBe('string');
        expect(field.length).toBeGreaterThan(0);
        
        expect(['high', 'medium', 'low']).toContain(stats.frequency);
        expect(typeof stats.availability).toBe('number');
        expect(stats.availability).toBeGreaterThanOrEqual(0);
        expect(stats.availability).toBeLessThanOrEqual(1);
      });
    });

    it.each([
      ['issue', () => issueSuggestions],
      ['project', () => projectSuggestions],
      ['user', () => userSuggestions],
      ['agile', () => agileSuggestions],
    ])('should have valid contextualSuggestions for %s', (entityType, getSuggestions) => {
      const suggestions = getSuggestions();
      
      expect(Array.isArray(suggestions.contextualSuggestions)).toBe(true);
      expect(suggestions.contextualSuggestions.length).toBeGreaterThan(0);
      
      suggestions.contextualSuggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Content Quality Validation', () => {
    describe('Issue Suggestions', () => {
      it('should have comprehensive issue field typo corrections', () => {
        const corrections = issueSuggestions.typoCorrections;
        
        // Must include common status typos
        expect(corrections).toHaveProperty('stat');
        expect(corrections['stat']).toBe('status');
        expect(corrections).toHaveProperty('statu');
        expect(corrections['statu']).toBe('status');
        
        // Must include common assignee typos
        expect(corrections).toHaveProperty('assigne');
        expect(corrections['assigne']).toBe('assignee');
        expect(corrections).toHaveProperty('asignee');
        expect(corrections['asignee']).toBe('assignee');
        
        // Must include common summary typos
        expect(corrections).toHaveProperty('sumary');
        expect(corrections['sumary']).toBe('summary');
        expect(corrections).toHaveProperty('summry');
        expect(corrections['summry']).toBe('summary');
        
        // Must include common description typos
        expect(corrections).toHaveProperty('discription');
        expect(corrections['discription']).toBe('description');
        expect(corrections).toHaveProperty('descripion');
        expect(corrections['descripion']).toBe('description');
        
        // Must include common priority typos
        expect(corrections).toHaveProperty('priorty');
        expect(corrections['priorty']).toBe('priority');
        expect(corrections).toHaveProperty('priorit');
        expect(corrections['priorit']).toBe('priority');
        
        // Should have at least 10 typo corrections
        expect(Object.keys(corrections).length).toBeGreaterThanOrEqual(10);
      });

      it('should have realistic usage statistics for core issue fields', () => {
        const stats = issueSuggestions.usageStatistics;
        
        // Core fields should exist with high frequency
        expect(stats).toHaveProperty('summary');
        expect(stats['summary'].frequency).toBe('high');
        expect(stats['summary'].availability).toBeGreaterThanOrEqual(0.95);
        
        expect(stats).toHaveProperty('status');
        expect(stats['status'].frequency).toBe('high');
        expect(stats['status'].availability).toBeGreaterThanOrEqual(0.95);
        
        expect(stats).toHaveProperty('assignee');
        expect(stats['assignee'].frequency).toBe('high');
        expect(stats['assignee'].availability).toBeGreaterThanOrEqual(0.7); // Lower because can be unassigned
        
        expect(stats).toHaveProperty('description');
        expect(stats['description'].frequency).toBe('high');
        expect(stats['description'].availability).toBeGreaterThanOrEqual(0.8);
        
        // Should have at least 8 fields tracked
        expect(Object.keys(stats).length).toBeGreaterThanOrEqual(8);
      });

      it('should include most commonly used fields in contextual suggestions', () => {
        const suggestions = issueSuggestions.contextualSuggestions;
        
        expect(suggestions).toContain('summary');
        expect(suggestions).toContain('status');
        expect(suggestions).toContain('assignee');
        expect(suggestions).toContain('description');
        expect(suggestions).toContain('priority');
        
        // Should include nested paths
        expect(suggestions.some(s => s.includes('.'))).toBe(true);
        
        // Should have at least 10 suggestions
        expect(suggestions.length).toBeGreaterThanOrEqual(10);
      });

      it('should have custom field patterns for common agile fields', () => {
        const patterns = issueSuggestions.customFieldPatterns;
        
        // Should include sprint patterns
        expect(patterns).toHaveProperty('sprint');
        expect(Array.isArray(patterns['sprint'])).toBe(true);
        expect(patterns['sprint'].length).toBeGreaterThan(0);
        
        // Should include epic patterns
        expect(patterns).toHaveProperty('epic');
        expect(Array.isArray(patterns['epic'])).toBe(true);
        
        // Should include story points patterns
        expect(patterns).toHaveProperty('story_points');
        expect(Array.isArray(patterns['story_points'])).toBe(true);
      });
    });

    describe('Project Suggestions', () => {
      it('should have project-specific typo corrections', () => {
        const corrections = projectSuggestions.typoCorrections;
        
        expect(corrections).toHaveProperty('projct');
        expect(corrections['projct']).toBe('project');
        expect(corrections).toHaveProperty('keey');
        expect(corrections['keey']).toBe('key');
        expect(corrections).toHaveProperty('nam');
        expect(corrections['nam']).toBe('name');
        
        // Should have at least 5 project-specific corrections
        expect(Object.keys(corrections).length).toBeGreaterThanOrEqual(5);
      });

      it('should include common project fields in contextual suggestions', () => {
        const suggestions = projectSuggestions.contextualSuggestions;
        
        expect(suggestions).toContain('key');
        expect(suggestions).toContain('name');
        expect(suggestions).toContain('projectCategory');
        expect(suggestions).toContain('lead');
        
        expect(suggestions.length).toBeGreaterThanOrEqual(6);
      });
    });

    describe('User Suggestions', () => {
      it('should have user-specific typo corrections', () => {
        const corrections = userSuggestions.typoCorrections;
        
        expect(corrections).toHaveProperty('displaynam');
        expect(corrections['displaynam']).toBe('displayName');
        expect(corrections).toHaveProperty('emailaddres');
        expect(corrections['emailaddres']).toBe('emailAddress');
        expect(corrections).toHaveProperty('activ');
        expect(corrections['activ']).toBe('active');
        
        expect(Object.keys(corrections).length).toBeGreaterThanOrEqual(5);
      });

      it('should include common user fields in contextual suggestions', () => {
        const suggestions = userSuggestions.contextualSuggestions;
        
        expect(suggestions).toContain('displayName');
        expect(suggestions).toContain('emailAddress');
        expect(suggestions).toContain('active');
        expect(suggestions).toContain('accountId');
        
        expect(suggestions.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Agile Suggestions', () => {
      it('should have agile-specific typo corrections', () => {
        const corrections = agileSuggestions.typoCorrections;
        
        expect(corrections).toHaveProperty('bord');
        expect(corrections['bord']).toBe('board');
        expect(corrections).toHaveProperty('sprin');
        expect(corrections['sprin']).toBe('sprint');
        expect(corrections).toHaveProperty('stat');
        expect(corrections['stat']).toBe('state');
        
        expect(Object.keys(corrections).length).toBeGreaterThanOrEqual(5);
      });

      it('should include common agile fields in contextual suggestions', () => {
        const suggestions = agileSuggestions.contextualSuggestions;
        
        expect(suggestions).toContain('name');
        expect(suggestions).toContain('state');
        expect(suggestions).toContain('startDate');
        expect(suggestions).toContain('endDate');
        
        expect(suggestions.length).toBeGreaterThanOrEqual(6);
      });
    });
  });

  describe('Cross-Entity Consistency', () => {
    it('should have consistent data quality across all entity types', () => {
      const allSuggestions = [issueSuggestions, projectSuggestions, userSuggestions, agileSuggestions];
      
      allSuggestions.forEach(suggestions => {
        // Each should have meaningful data
        expect(Object.keys(suggestions.typoCorrections).length).toBeGreaterThan(0);
        expect(Object.keys(suggestions.usageStatistics).length).toBeGreaterThan(0);
        expect(suggestions.contextualSuggestions.length).toBeGreaterThan(0);
        
        // All should have reasonable timestamps (within last year)
        const analyzedDate = new Date(suggestions.lastAnalyzed);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        expect(analyzedDate.getTime()).toBeGreaterThan(oneYearAgo.getTime());
      });
    });
  });

  describe('Import/Export Functionality', () => {
    it('should export all suggestion data from index file', async () => {
      const indexModule = await import('@/server/resources/static-suggestions/index');
      
      expect(indexModule).toHaveProperty('ISSUE_STATIC_SUGGESTIONS');
      expect(indexModule).toHaveProperty('PROJECT_STATIC_SUGGESTIONS');
      expect(indexModule).toHaveProperty('USER_STATIC_SUGGESTIONS');
      expect(indexModule).toHaveProperty('AGILE_STATIC_SUGGESTIONS');
      
      // Verify they match individual imports
      expect(indexModule.ISSUE_STATIC_SUGGESTIONS).toEqual(issueSuggestions);
      expect(indexModule.PROJECT_STATIC_SUGGESTIONS).toEqual(projectSuggestions);
      expect(indexModule.USER_STATIC_SUGGESTIONS).toEqual(userSuggestions);
      expect(indexModule.AGILE_STATIC_SUGGESTIONS).toEqual(agileSuggestions);
    });
  });
});