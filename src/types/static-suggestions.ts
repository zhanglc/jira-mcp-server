/**
 * Type definitions for static suggestion data
 * Used by the static field analysis generator and suggestion engine
 */

/**
 * Static analysis result for a single entity type
 */
export interface StaticSuggestionData {
  /** Entity type analyzed */
  entityType: 'issue' | 'project' | 'user' | 'agile';
  /** Mapping of common typos to correct field names */
  typoCorrections: Record<string, string>;
  /** Field usage statistics with frequency and availability rates */
  usageStatistics: Record<string, { 
    frequency: 'high' | 'medium' | 'low'; 
    availability: number; 
  }>;
  /** Contextual suggestions - most commonly used fields in order */
  contextualSuggestions: string[];
  /** Custom field patterns - mapping field IDs to value types */
  customFieldPatterns: Record<string, string[]>;
  /** ISO timestamp of when analysis was performed */
  lastAnalyzed: string;
}

/**
 * Aggregated static suggestions for all entity types
 */
export interface StaticSuggestionsData {
  issue: StaticSuggestionData;
  project: StaticSuggestionData;
  user: StaticSuggestionData;
  agile: StaticSuggestionData;
}