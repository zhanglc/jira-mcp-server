/**
 * Issue Tools Module
 *
 * This module contains MCP tool definitions for Jira Issue-related operations.
 * Extracted from jira-mcp-server.ts to improve code organization and maintainability.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Issue Operations Tools (5 tools)
 * - getIssue: Get issue details by key/ID
 * - getIssueTransitions: Get available status transitions
 * - searchIssues: JQL search for issues
 * - getIssueWorklogs: Get work log entries
 * - downloadAttachments: Download attachment metadata
 */

/**
 * Get a Jira issue by key or ID
 * @returns MCP Tool definition for getIssue
 */
export function getIssueToolDefinition(): Tool {
  return {
    name: 'getIssue',
    description: 'Get a Jira issue by key or ID',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://issue/fields

🔥 Enhanced capabilities:
• System fields: Full nested structure support (status.statusCategory.key)
• Custom fields: Pattern matching with validation
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["summary", "status.name", "assignee.displayName"]
• Custom: ["customfield_10001", "customfield_10002.value"]
• Mixed: ["summary", "status.statusCategory.key", "project.name", "customfield_10101"]

Note: Invalid fields are filtered with suggestions provided.`,
        },
        expand: {
          type: 'array',
          items: { type: 'string' },
          description: `Optional expand parameter to include additional data in the response.

🔥 Available expand options:
• changelog - Issue change history and transitions
• renderedFields - Rendered field values (HTML, etc.)
• names - Field names mapping
• schema - Field schema information  
• transitions - Available status transitions
• operations - Available operations on the issue
• editmeta - Edit metadata for the issue
• versionedRepresentations - Different field representations

🎯 Common usage examples:
• ["changelog"] - Get issue change history
• ["changelog", "transitions"] - Get history + available transitions
• ["renderedFields"] - Get rendered field values

Note: Large expand options like 'changelog' may increase response time.`,
        },
      },
      required: ['issueKey'],
    },
  };
}

/**
 * Get available status transitions for a Jira issue
 * @returns MCP Tool definition for getIssueTransitions
 */
export function getIssueTransitionsToolDefinition(): Tool {
  return {
    name: 'getIssueTransitions',
    description: 'Get available status transitions for a Jira issue. Enhanced field access available via jira://issue/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://issue/fields

🔥 Enhanced capabilities:
• Transition fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["id", "name", "to.name"]
• Detailed: ["id", "name", "to.name", "to.statusCategory.key"]
• Custom: ["name", "to.statusCategory.name", "fields"]

Note: Uses client-side filtering (API doesn't support native fields parameter)`,
        },
      },
      required: ['issueKey'],
    },
  };
}

/**
 * Search for Jira issues using JQL (Jira Query Language)
 * @returns MCP Tool definition for searchIssues
 */
export function searchIssuesToolDefinition(): Tool {
  return {
    name: 'searchIssues',
    description: 'Search for Jira issues using JQL (Jira Query Language)',
    inputSchema: {
      type: 'object',
      properties: {
        jql: {
          type: 'string',
          description:
            'The JQL query string (e.g., "project = PROJ AND status = Open")',
        },
        startAt: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://issue/fields

🔥 Enhanced capabilities:
• System fields: Full nested structure support (status.statusCategory.key)
• Custom fields: Pattern matching with validation
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["summary", "status.name", "assignee.displayName"]
• Custom: ["customfield_10001", "customfield_10002.value"]
• Mixed: ["summary", "status.statusCategory.key", "project.name", "customfield_10101"]

Note: Invalid fields are filtered with suggestions provided.`,
        },
      },
      required: ['jql'],
    },
  };
}

/**
 * Get work log entries for a Jira issue
 * @returns MCP Tool definition for getIssueWorklogs
 */
export function getIssueWorklogsToolDefinition(): Tool {
  return {
    name: 'getIssueWorklogs',
    description:
      'Get work log entries for a Jira issue, including time tracking and work history. Enhanced field access available via jira://issue/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://issue/fields

🔥 Enhanced capabilities:
• Worklog fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["id", "timeSpent", "author.displayName"]
• Detailed: ["id", "timeSpent", "author.displayName", "created", "comment"]
• Custom: ["timeSpent", "author.emailAddress", "updateAuthor.displayName"]

Note: Uses client-side filtering (API doesn't support native fields parameter)`,
        },
      },
      required: ['issueKey'],
    },
  };
}

/**
 * Download attachment metadata for a Jira issue
 * @returns MCP Tool definition for downloadAttachments
 */
export function downloadAttachmentsToolDefinition(): Tool {
  return {
    name: 'downloadAttachments',
    description:
      'Download attachment metadata for a Jira issue. Returns information about all attachments including file metadata, download URLs, and author details. Does not download actual files. Enhanced field access available via jira://issue/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and resource guidance.

📋 Complete field reference: jira://issue/fields

🔥 Enhanced capabilities:
• Attachment fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["id", "filename", "size"]
• Detailed: ["id", "filename", "size", "author.displayName", "created"]
• Custom: ["filename", "mimeType", "author.emailAddress", "content"]

Note: Uses client-side filtering (API doesn't support native fields parameter)`,
        },
      },
      required: ['issueKey'],
    },
  };
}

/**
 * Get all Issue tools as an array
 * @returns Array of all Issue-related MCP tool definitions
 */
export function getIssueTools(): Tool[] {
  return [
    getIssueToolDefinition(),
    getIssueTransitionsToolDefinition(),
    searchIssuesToolDefinition(),
    getIssueWorklogsToolDefinition(),
    downloadAttachmentsToolDefinition(),
  ];
}
