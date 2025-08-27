/**
 * System Tools Module
 *
 * This module contains MCP tool definitions for Jira system-related operations.
 * Provides tools for field searching, system information, and server information queries.
 */

// ================================
// System Information Tools
// ================================

/**
 * Search for Jira fields with optional query filtering
 * Returns all available fields including system and custom fields
 */
export function searchFieldsToolDefinition() {
  return {
    name: 'searchFields',
    description:
      'Search for Jira fields with optional query filtering. Returns all available fields including system and custom fields. Enhanced field access available via jira://system/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Optional query string to filter fields by name or ID (case-insensitive partial match). If omitted, returns all available fields.',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://system/fields

🔥 Enhanced capabilities:
• System fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["id", "name", "custom"]
• Detailed: ["id", "name", "custom", "schema.type", "schema.system"]
• Custom: ["name", "schema.custom", "clauseNames"]

Note: Uses client-side filtering (API doesn't support native fields parameter)`,
        },
      },
    },
  };
}

/**
 * Get system information from the Jira server
 * Includes version details, deployment type, build information, and optional health checks
 */
export function getSystemInfoToolDefinition() {
  return {
    name: 'getSystemInfo',
    description:
      'Get system information from the Jira server, including version details, deployment type, build information, and optional health checks. Essential for system monitoring and version compatibility checks. Enhanced field access available via jira://system/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://system/fields

🔥 Enhanced capabilities:
• System info fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["version", "buildNumber", "deploymentType"]
• Detailed: ["version", "buildNumber", "deploymentType", "databaseExamples"]
• Custom: ["buildDate", "scmInfo", "serverTitle"]

Note: Uses client-side filtering (API doesn't support native fields parameter)`,
        },
      },
      additionalProperties: false,
    },
  };
}

/**
 * Get server-specific information from the Jira server
 * Includes real-time server details, current server time, default locale settings, and server runtime configuration
 */
export function getServerInfoToolDefinition() {
  return {
    name: 'getServerInfo',
    description:
      'Get server-specific information from the Jira server, including real-time server details, current server time, default locale settings, and server runtime configuration. Provides more server-specific details compared to getSystemInfo. Enhanced field access available via jira://system/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://system/fields

🔥 Enhanced capabilities:
• Server info fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["baseUrl", "version", "serverTime"]
• Detailed: ["baseUrl", "version", "serverTime", "buildNumber", "serverTitle"]
• Custom: ["scmInfo", "buildDate", "databaseExamples"]

Note: Uses client-side filtering (API doesn't support native fields parameter)`,
        },
      },
      additionalProperties: false,
    },
  };
}

// ================================
// System Tools Collection
// ================================

/**
 * Get all system tools as an array
 * Returns all system-related MCP tool definitions
 */
export function getSystemTools() {
  return [
    searchFieldsToolDefinition(),
    getSystemInfoToolDefinition(),
    getServerInfoToolDefinition(),
  ];
}
