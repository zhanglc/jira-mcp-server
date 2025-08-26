/**
 * User Tools Module
 *
 * This module contains MCP tool definitions for User-related Jira operations.
 * Extracted from the main jira-mcp-server.ts to improve code organization
 * and maintainability.
 *
 * Tools provided:
 * - getCurrentUser: Get information about the currently authenticated user
 * - getUserProfile: Get detailed profile information for a specific user
 */

// =============================================================================
// User Authentication Tools
// =============================================================================

/**
 * Tool definition for getCurrentUser
 * Get information about the currently authenticated user for authentication verification
 */
export function getCurrentUserToolDefinition() {
  return {
    name: 'getCurrentUser',
    description:
      'Get information about the currently authenticated user for authentication verification',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  };
}

// =============================================================================
// User Profile Tools
// =============================================================================

/**
 * Tool definition for getUserProfile
 * Get detailed profile information for a specific Jira user by username or email address
 */
export function getUserProfileToolDefinition() {
  return {
    name: 'getUserProfile',
    description:
      'Get detailed profile information for a specific Jira user by username or email address',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description:
            'The username or email address of the user (e.g., JIRAUSER23511, user@domain.com)',
        },
      },
      required: ['username'],
    },
  };
}

// =============================================================================
// Export All User Tools
// =============================================================================

/**
 * Get all User tool definitions
 * @returns Array of all User-related MCP tool definitions
 */
export function getUserTools() {
  return [getCurrentUserToolDefinition(), getUserProfileToolDefinition()];
}
