/**
 * Agile Tools Module
 * 
 * This module provides MCP tool definitions for Jira Agile functionality.
 * It includes tools for managing boards, sprints, and agile workflows.
 * 
 * Tools included:
 * - getAgileBoards: Get all agile boards with optional project filtering
 * - getBoardIssues: Get issues from a specific agile board
 * - getSprintsFromBoard: Get all sprints from a specific board
 * - getSprintIssues: Get issues from a specific sprint
 * - getSprint: Get detailed sprint information
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool: getAgileBoards
 * Get all agile boards (Scrum, Kanban) from Jira with optional project filtering
 */
export function getAgileBoardsToolDefinition(): Tool {
  return {
    name: 'getAgileBoards',
    description: 'Get all agile boards (Scrum, Kanban) from Jira with optional project filtering',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Optional project key to filter boards (e.g., DSCWA, PROJECT-123). If provided, only boards associated with this project will be returned.'
        }
      }
    }
  };
}

/**
 * Tool: getBoardIssues
 * Get issues from a specific agile board with optional pagination and field selection
 */
export function getBoardIssuesToolDefinition(): Tool {
  return {
    name: 'getBoardIssues',
    description: 'Get issues from a specific agile board with optional pagination and field selection',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'number',
          description: 'The numeric ID of the agile board'
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
      required: ['boardId']
    }
  };
}

/**
 * Tool: getSprintsFromBoard
 * Get all sprints from a specific agile board (primarily useful for Scrum boards)
 */
export function getSprintsFromBoardToolDefinition(): Tool {
  return {
    name: 'getSprintsFromBoard',
    description: 'Get all sprints from a specific agile board (primarily useful for Scrum boards)',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'number',
          description: 'The numeric ID of the agile board'
        }
      },
      required: ['boardId']
    }
  };
}

/**
 * Tool: getSprintIssues
 * Get issues from a specific sprint with optional pagination and field selection
 */
export function getSprintIssuesToolDefinition(): Tool {
  return {
    name: 'getSprintIssues',
    description: 'Get issues from a specific sprint with optional pagination and field selection',
    inputSchema: {
      type: 'object',
      properties: {
        sprintId: {
          type: 'number',
          description: 'The numeric ID of the sprint'
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
      required: ['sprintId']
    }
  };
}

/**
 * Tool: getSprint
 * Get detailed information for a specific sprint by its ID
 */
export function getSprintToolDefinition(): Tool {
  return {
    name: 'getSprint',
    description: 'Get detailed information for a specific sprint by its ID',
    inputSchema: {
      type: 'object',
      properties: {
        sprintId: {
          type: 'number',
          description: 'The numeric ID of the sprint (e.g., 123, 456)'
        }
      },
      required: ['sprintId']
    }
  };
}

/**
 * Get all Agile tools as an array
 * 
 * @returns Array of all Agile tool definitions
 */
export function getAgileTools(): Tool[] {
  return [
    getAgileBoardsToolDefinition(),
    getBoardIssuesToolDefinition(),
    getSprintsFromBoardToolDefinition(),
    getSprintIssuesToolDefinition(),
    getSprintToolDefinition()
  ];
}