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
    description: 'Search for Jira fields with optional query filtering. Returns all available fields including system and custom fields.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Optional query string to filter fields by name or ID (case-insensitive partial match). If omitted, returns all available fields.'
        }
      }
    }
  };
}

/**
 * Get system information from the Jira server
 * Includes version details, deployment type, build information, and optional health checks
 */
export function getSystemInfoToolDefinition() {
  return {
    name: 'getSystemInfo',
    description: 'Get system information from the Jira server, including version details, deployment type, build information, and optional health checks. Essential for system monitoring and version compatibility checks.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  };
}

/**
 * Get server-specific information from the Jira server
 * Includes real-time server details, current server time, default locale settings, and server runtime configuration
 */
export function getServerInfoToolDefinition() {
  return {
    name: 'getServerInfo',
    description: 'Get server-specific information from the Jira server, including real-time server details, current server time, default locale settings, and server runtime configuration. Provides more server-specific details compared to getSystemInfo.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
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
    getServerInfoToolDefinition()
  ];
}