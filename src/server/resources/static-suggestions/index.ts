/**
 * Static suggestion data exports
 * Centralized export for all entity-specific static suggestion data
 */

export { ISSUE_STATIC_SUGGESTIONS } from './issue-suggestions.js';
export { PROJECT_STATIC_SUGGESTIONS } from './project-suggestions.js';
export { USER_STATIC_SUGGESTIONS } from './user-suggestions.js';
export { AGILE_STATIC_SUGGESTIONS } from './agile-suggestions.js';

// Re-export types for convenience
export type { StaticSuggestionData, StaticSuggestionsData } from '../../../types/static-suggestions.js';