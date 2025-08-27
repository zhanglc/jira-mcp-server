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
      'Get information about the currently authenticated user for authentication verification. Enhanced field access available via jira://user/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Optional field selection with nested access support.

📋 Complete field reference: jira://user/fields

🔥 Enhanced capabilities:
• User fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["name", "displayName", "emailAddress"]
• Detailed: ["name", "displayName", "emailAddress", "active", "timeZone"]
• Custom: ["displayName", "groups.items[].name", "avatarUrls"]

⚠️ Note: Uses client-side filtering (API doesn't support native fields parameter)`
        }
      },
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
      'Get detailed profile information for a specific Jira user by username or email address. Enhanced field access available via jira://user/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description:
            'The username or email address of the user (e.g., JIRAUSER23511, user@domain.com)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Optional field selection with nested access support.

📋 Complete field reference: jira://user/fields

🔥 Enhanced capabilities:
• User fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["name", "displayName", "emailAddress"]
• Detailed: ["name", "displayName", "emailAddress", "active", "avatarUrls"]
• Custom: ["displayName", "timeZone", "groups.items[].name"]

⚠️ Note: Uses client-side filtering (API doesn't support native fields parameter)`
        }
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
