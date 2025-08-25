/**
 * Project Tools Module
 * 
 * Contains MCP tool definitions for Jira project-related operations.
 * These tools provide functionality for:
 * - Retrieving all projects
 * - Getting specific project details
 * - Fetching project issues
 * - Managing project versions
 */

// ============================================================================
// Project Management Tools
// ============================================================================

/**
 * Tool definition for getAllProjects
 * Gets all projects from Jira with optional filtering for archived projects
 */
export function getAllProjectsToolDefinition() {
  return {
    name: 'getAllProjects',
    description: 'Get all projects from Jira with optional filtering for archived projects',
    inputSchema: {
      type: 'object',
      properties: {
        includeArchived: {
          type: 'boolean',
          description: 'Whether to include archived projects (default: true). Set to false to exclude archived projects.'
        }
      }
    }
  };
}

/**
 * Tool definition for getProject
 * Gets detailed information for a specific project
 */
export function getProjectToolDefinition() {
  return {
    name: 'getProject',
    description: 'Get detailed information for a specific project, including components, versions, roles, and issue types',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ, DSCWA)'
        }
      },
      required: ['projectKey']
    }
  };
}

// ============================================================================
// Project Content Tools  
// ============================================================================

/**
 * Tool definition for getProjectIssues
 * Gets all issues for a specific project with pagination and field selection
 */
export function getProjectIssuesToolDefinition() {
  return {
    name: 'getProjectIssues',
    description: 'Get all issues for a specific project with optional pagination and field selection',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ, DSCWA)'
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
      required: ['projectKey']
    }
  };
}

/**
 * Tool definition for getProjectVersions
 * Gets all versions for a specific project
 */
export function getProjectVersionsToolDefinition() {
  return {
    name: 'getProjectVersions',
    description: 'Get all versions for a specific project, including release status, dates, and project milestones',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ, DSCWA)'
        }
      },
      required: ['projectKey']
    }
  };
}

// ============================================================================
// Tool Collection Export
// ============================================================================

/**
 * Returns all project-related MCP tool definitions as an array
 * @returns Array of project tool definitions
 */
export function getProjectTools() {
  return [
    getAllProjectsToolDefinition(),
    getProjectToolDefinition(),
    getProjectIssuesToolDefinition(),
    getProjectVersionsToolDefinition()
  ];
}