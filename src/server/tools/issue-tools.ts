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
          description: 'The issue key or ID (e.g., PROJ-123)'
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of field names to retrieve'
        }
      },
      required: ['issueKey']
    }
  };
}

/**
 * Get available status transitions for a Jira issue
 * @returns MCP Tool definition for getIssueTransitions
 */
export function getIssueTransitionsToolDefinition(): Tool {
  return {
    name: 'getIssueTransitions',
    description: 'Get available status transitions for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)'
        }
      },
      required: ['issueKey']
    }
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
          description: 'The JQL query string (e.g., "project = PROJ AND status = Open")'
        },
        startAt: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)'
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of field names to retrieve'
        }
      },
      required: ['jql']
    }
  };
}

/**
 * Get work log entries for a Jira issue
 * @returns MCP Tool definition for getIssueWorklogs
 */
export function getIssueWorklogsToolDefinition(): Tool {
  return {
    name: 'getIssueWorklogs',
    description: 'Get work log entries for a Jira issue, including time tracking and work history',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)'
        }
      },
      required: ['issueKey']
    }
  };
}

/**
 * Download attachment metadata for a Jira issue
 * @returns MCP Tool definition for downloadAttachments
 */
export function downloadAttachmentsToolDefinition(): Tool {
  return {
    name: 'downloadAttachments',
    description: 'Download attachment metadata for a Jira issue. Returns information about all attachments including file metadata, download URLs, and author details. Does not download actual files.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)'
        }
      },
      required: ['issueKey']
    }
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
    downloadAttachmentsToolDefinition()
  ];
}