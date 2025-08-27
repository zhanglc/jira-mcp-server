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
    description:
      'Get all projects from Jira with optional filtering for archived projects. Enhanced field access available via jira://project/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        includeArchived: {
          type: 'boolean',
          description:
            'Whether to include archived projects (default: true). Set to false to exclude archived projects.',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Optional field selection with nested access support.

📋 Complete field reference: jira://project/fields

🔥 Enhanced capabilities:
• Project fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["name", "key", "projectCategory.name"]
• Detailed: ["name", "key", "lead.displayName", "description"]
• Custom: ["name", "projectTypeKey", "components[].name"]

⚠️ Note: Uses client-side filtering (API doesn't support native fields parameter)`
        }
      },
    },
  };
}

/**
 * Tool definition for getProject
 * Gets detailed information for a specific project
 */
export function getProjectToolDefinition() {
  return {
    name: 'getProject',
    description:
      'Get detailed information for a specific project, including components, versions, roles, and issue types. Enhanced field access available via jira://project/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ, DSCWA)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Optional field selection with nested access support.

📋 Complete field reference: jira://project/fields

🔥 Enhanced capabilities:
• Project fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["name", "key", "description"]
• Detailed: ["name", "key", "lead.displayName", "components[].name"]
• Custom: ["name", "projectTypeKey", "versions[].name"]

⚠️ Note: Uses client-side filtering (API doesn't support native fields parameter)`
        }
      },
      required: ['projectKey'],
    },
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
    description:
      'Get all issues for a specific project with optional pagination and field selection',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ, DSCWA)',
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
      required: ['projectKey'],
    },
  };
}

/**
 * Tool definition for getProjectVersions
 * Gets all versions for a specific project
 */
export function getProjectVersionsToolDefinition() {
  return {
    name: 'getProjectVersions',
    description:
      'Get all versions for a specific project, including release status, dates, and project milestones',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ, DSCWA)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Optional field selection with nested access support.

📋 Complete field reference: jira://project/fields

🔥 Enhanced capabilities:
• Version fields: Full nested structure support (field.subfield.key)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["id", "name", "released"]
• Detailed: ["id", "name", "released", "archived", "releaseDate"]
• Custom: ["name", "description", "userReleaseDate"]

⚠️ Note: Uses client-side filtering (API doesn't support native fields parameter)`
        }
      },
      required: ['projectKey'],
    },
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
    getProjectVersionsToolDefinition(),
  ];
}
