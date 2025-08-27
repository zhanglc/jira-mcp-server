/**
 * @fileoverview Static Suggestion Engine - Lightweight, high-performance field suggestion system
 * 
 * Implements a multi-level suggestion strategy optimized for MCP's stateless environment:
 * 1. Direct typo correction lookup (O(1))
 * 2. String similarity matching (Levenshtein distance)
 * 3. Multi-factor ranking (similarity + frequency + availability)
 * 
 * Performance targets:
 * - Single suggestion generation: <1ms
 * - Levenshtein calculation: <0.1ms per comparison
 * - Large candidate sets (100+ fields): <5ms
 * - Memory footprint: <10MB static data
 * 
 * Design principles:
 * - Stateless operation (no caching dependencies)
 * - Pre-computed static data usage
 * - Algorithm efficiency over feature complexity
 * - Graceful degradation for edge cases
 */

import type { StaticSuggestionData } from '../../types/static-suggestions.js';
import {
  ISSUE_STATIC_SUGGESTIONS,
  PROJECT_STATIC_SUGGESTIONS,
  USER_STATIC_SUGGESTIONS,
  AGILE_STATIC_SUGGESTIONS
} from './static-suggestions/index.js';

/**
 * Configuration options for suggestion generation
 */
export interface SuggestionOptions {
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
  /** Minimum similarity threshold (0.0 to 1.0) */
  minSimilarity?: number;
  /** Filter by field types (if supported) */
  fieldTypes?: string[];
  /** Include contextual boost for high-priority fields */
  useContextualBoost?: boolean;
}

/**
 * Individual suggestion result with scoring metadata
 */
export interface SuggestionResult {
  /** Suggested field name */
  field: string;
  /** Combined relevance score (0.0 to 1.0) */
  score: number;
  /** Detailed scoring metadata */
  metadata: {
    /** String similarity score */
    similarity: number;
    /** Usage frequency category */
    frequency: 'high' | 'medium' | 'low';
    /** Field availability rate */
    availability: number;
    /** Whether found via typo correction */
    isTypoCorrection: boolean;
    /** Contextual ranking boost applied */
    contextualBoost: number;
  };
}

/**
 * Lightweight suggestion engine optimized for real-time field suggestions
 * 
 * Core algorithm features:
 * - Efficient Levenshtein distance implementation
 * - Multi-factor scoring system
 * - Static data pre-computation
 * - Sub-millisecond response times
 */
export class StaticSuggestionEngine {
  private readonly suggestionData: Record<string, StaticSuggestionData>;
  private readonly defaultOptions: Required<SuggestionOptions>;

  constructor() {
    // Pre-load all static suggestion data for O(1) access
    this.suggestionData = {
      issue: ISSUE_STATIC_SUGGESTIONS,
      project: PROJECT_STATIC_SUGGESTIONS,
      user: USER_STATIC_SUGGESTIONS,
      agile: AGILE_STATIC_SUGGESTIONS
    };

    // Default configuration optimized for performance
    this.defaultOptions = {
      maxSuggestions: 10,
      minSimilarity: 0.2, // Lower threshold for better partial matching
      fieldTypes: [],
      useContextualBoost: true
    };
  }

  /**
   * Generate field suggestions for given entity type and input
   * 
   * @param entityType - Entity type (issue, project, user, agile)
   * @param input - User input string
   * @param maxSuggestions - Maximum suggestions to return
   * @returns Array of suggested field names
   */
  public suggest(
    entityType: 'issue' | 'project' | 'user' | 'agile',
    input: string,
    maxSuggestions: number = 10
  ): string[] {
    // Handle edge cases for maxSuggestions
    if (maxSuggestions <= 0) {
      return [];
    }

    const results = this.suggestWithMetadata(entityType, input, {
      ...this.defaultOptions,
      maxSuggestions
    });
    
    return results.map(result => result.field);
  }

  /**
   * Generate field suggestions with detailed scoring metadata
   * 
   * @param entityType - Entity type
   * @param input - User input string
   * @param options - Suggestion configuration options
   * @returns Array of suggestion results with metadata
   */
  public suggestWithMetadata(
    entityType: 'issue' | 'project' | 'user' | 'agile',
    input: string,
    options: SuggestionOptions = {}
  ): SuggestionResult[] {
    // Validate inputs and apply defaults
    const config = { ...this.defaultOptions, ...options };
    const normalizedInput = this.normalizeInput(input);
    
    if (!normalizedInput || config.maxSuggestions <= 0) {
      return [];
    }

    // Get entity-specific data
    const entityData = this.getEntityData(entityType);
    
    // Multi-level suggestion strategy
    const suggestions = this.generateSuggestions(normalizedInput, entityData, config);
    
    // Rank and filter results
    const rankedSuggestions = this.rankSuggestions(suggestions, config);
    
    return rankedSuggestions.slice(0, config.maxSuggestions);
  }

  /**
   * Calculate Levenshtein distance-based similarity between two strings
   * 
   * Optimized implementation with case-insensitive comparison
   * Performance target: <0.1ms per comparison
   * 
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0.0 to 1.0)
   */
  public calculateSimilarity(str1: string, str2: string): number {
    // Normalize inputs for case-insensitive comparison
    const a = str1.toLowerCase().trim();
    const b = str2.toLowerCase().trim();
    
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;
    
    // Use shorter string length for normalization
    const maxLen = Math.max(a.length, b.length);
    const distance = this.levenshteinDistance(a, b);
    
    // Convert distance to similarity score
    return Math.max(0, 1 - (distance / maxLen));
  }

  /**
   * Find similar field names using string similarity and prefix matching
   * 
   * @param input - Input string
   * @param candidates - Candidate field names
   * @param maxResults - Maximum results to return
   * @returns Array of similar field names
   */
  private findSimilar(input: string, candidates: string[], maxResults: number): string[] {
    const similarities = candidates
      .map(candidate => {
        const similarity = this.calculateSimilarity(input, candidate);
        // Boost score for prefix matches (especially for short inputs)
        const prefixBoost = candidate.toLowerCase().startsWith(input.toLowerCase()) ? 0.3 : 0;
        const finalSimilarity = Math.min(1.0, similarity + prefixBoost);
        
        return {
          field: candidate,
          similarity: finalSimilarity
        };
      })
      .filter(item => item.similarity > this.defaultOptions.minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
    
    return similarities.map(item => item.field);
  }

  /**
   * Normalize user input for consistent processing
   */
  private normalizeInput(input: string): string {
    return input.trim().toLowerCase();
  }

  /**
   * Get entity-specific suggestion data
   */
  private getEntityData(entityType: string): StaticSuggestionData {
    const data = this.suggestionData[entityType];
    if (!data) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }
    return data;
  }

  /**
   * Generate initial suggestions using multi-level strategy
   */
  private generateSuggestions(
    input: string,
    entityData: StaticSuggestionData,
    config: Required<SuggestionOptions>
  ): SuggestionResult[] {
    const results: SuggestionResult[] = [];
    
    // Level 1: Direct typo correction (O(1) lookup)
    const typoCorrection = entityData.typoCorrections[input];
    if (typoCorrection) {
      const stats = entityData.usageStatistics[typoCorrection];
      results.push({
        field: typoCorrection,
        score: 1.0, // Perfect match via typo correction
        metadata: {
          similarity: 1.0,
          frequency: stats?.frequency || 'medium',
          availability: stats?.availability || 0.5,
          isTypoCorrection: true,
          contextualBoost: 0
        }
      });
    }
    
    // Level 2: String similarity matching
    const allFields = this.getAllFieldNames(entityData);
    const similarFields = this.findSimilar(input, allFields, config.maxSuggestions * 2);
    
    for (const field of similarFields) {
      // Skip if already added via typo correction
      if (results.some(r => r.field === field)) continue;
      
      let similarity = this.calculateSimilarity(input, field);
      // Apply prefix boost consistently
      const prefixBoost = field.toLowerCase().startsWith(input.toLowerCase()) ? 0.3 : 0;
      similarity = Math.min(1.0, similarity + prefixBoost);
      
      const stats = entityData.usageStatistics[field];
      
      results.push({
        field,
        score: similarity, // Will be recalculated in ranking
        metadata: {
          similarity,
          frequency: stats?.frequency || 'medium',
          availability: stats?.availability || 0.5,
          isTypoCorrection: false,
          contextualBoost: 0
        }
      });
    }
    
    return results;
  }

  /**
   * Get all available field names for an entity
   */
  private getAllFieldNames(entityData: StaticSuggestionData): string[] {
    const fields = new Set<string>();
    
    // Add fields from usage statistics
    Object.keys(entityData.usageStatistics).forEach(field => fields.add(field));
    
    // Add fields from contextual suggestions
    entityData.contextualSuggestions.forEach(field => fields.add(field));
    
    // Add typo correction targets
    Object.values(entityData.typoCorrections).forEach(field => fields.add(field));
    
    return Array.from(fields);
  }

  /**
   * Rank suggestions using multi-factor scoring algorithm
   * 
   * Scoring factors:
   * 1. String similarity (0.0-1.0)
   * 2. Usage frequency (high=0.8, medium=0.6, low=0.4)
   * 3. Availability rate (0.0-1.0)
   * 4. Contextual boost (0.0-0.2)
   * 
   * Final score = (similarity * 0.5) + (frequency * 0.2) + (availability * 0.2) + contextualBoost
   */
  private rankSuggestions(
    suggestions: SuggestionResult[],
    config: Required<SuggestionOptions>
  ): SuggestionResult[] {
    return suggestions
      .map(suggestion => {
        // Calculate contextual boost
        const contextualBoost = config.useContextualBoost 
          ? this.calculateContextualBoost(suggestion.field)
          : 0;
        
        // Convert frequency to numeric score
        const frequencyScore = this.getFrequencyScore(suggestion.metadata.frequency);
        
        // Multi-factor scoring
        const combinedScore = 
          (suggestion.metadata.similarity * 0.5) +
          (frequencyScore * 0.2) +
          (suggestion.metadata.availability * 0.2) +
          (contextualBoost || 0);
        
        return {
          ...suggestion,
          score: Math.min(1.0, combinedScore),
          metadata: {
            ...suggestion.metadata,
            contextualBoost: contextualBoost || 0
          }
        };
      })
      .filter(suggestion => suggestion.score >= config.minSimilarity)
      .sort((a, b) => {
        // Primary sort: score descending
        if (Math.abs(a.score - b.score) > 0.01) {
          return b.score - a.score;
        }
        
        // Secondary sort: typo corrections first
        if (a.metadata.isTypoCorrection && !b.metadata.isTypoCorrection) return -1;
        if (!a.metadata.isTypoCorrection && b.metadata.isTypoCorrection) return 1;
        
        // Tertiary sort: higher availability
        return b.metadata.availability - a.metadata.availability;
      });
  }

  /**
   * Calculate contextual boost based on field importance
   */
  private calculateContextualBoost(field: string): number {
    // High-priority fields get contextual boost
    const highPriorityFields = [
      'summary', 'status', 'assignee', 'description', 'project', 'issuetype',
      'key', 'name', 'displayName', 'emailAddress'
    ];
    
    if (highPriorityFields.some(priority => field.includes(priority))) {
      return 0.1;
    }
    
    return 0;
  }

  /**
   * Convert frequency category to numeric score
   */
  private getFrequencyScore(frequency: 'high' | 'medium' | 'low'): number {
    switch (frequency) {
      case 'high': return 0.8;
      case 'medium': return 0.6;
      case 'low': return 0.4;
    }
  }

  /**
   * Efficient Levenshtein distance calculation
   * 
   * Optimized dynamic programming implementation
   * Space complexity: O(min(m,n))
   * Time complexity: O(m*n)
   */
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    // Use the shorter string for the matrix dimension to save memory
    if (a.length > b.length) [a, b] = [b, a];
    
    const rows = a.length + 1;
    let previousRow = Array.from({ length: rows }, (_, i) => i);
    
    for (let i = 1; i <= b.length; i++) {
      const currentRow = [i];
      
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        const insertCost = (currentRow[j - 1] ?? 0) + 1;
        const deleteCost = (previousRow[j] ?? 0) + 1;
        const substituteCost = (previousRow[j - 1] ?? 0) + cost;
        
        currentRow[j] = Math.min(insertCost, deleteCost, substituteCost);
      }
      
      previousRow = currentRow;
    }
    
    return previousRow[a.length] ?? 0;
  }
}