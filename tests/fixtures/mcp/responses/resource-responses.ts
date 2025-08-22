/**
 * MCP Resource Response Fixtures
 * 
 * Expected MCP resource response content for testing.
 */

import type { ResourceContent, FieldDefinitionContent } from '@/types/mcp';

/**
 * Field Definition Resource Responses
 */
export const fieldDefinitionResponses = {
  issueFields: {
    uri: 'jira://fields/issue',
    mimeType: 'application/json',
    text: JSON.stringify({
      fields: {
        summary: {
          type: 'string',
          description: 'Brief summary of the issue',
          required: true,
          example: 'Fix login bug'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue',
          required: false,
          example: 'Users cannot login with valid credentials'
        },
        status: {
          type: 'object',
          description: 'Current status of the issue',
          required: true,
          nested: {
            id: { type: 'string', description: 'Status ID' },
            name: { type: 'string', description: 'Status name' },
            statusCategory: {
              type: 'object',
              description: 'Status category information'
            }
          }
        },
        priority: {
          type: 'object',
          description: 'Priority level of the issue',
          required: false,
          nested: {
            id: { type: 'string', description: 'Priority ID' },
            name: { type: 'string', description: 'Priority name' },
            iconUrl: { type: 'string', description: 'Priority icon URL' }
          }
        },
        assignee: {
          type: 'object',
          description: 'User assigned to the issue',
          required: false,
          nested: {
            name: { type: 'string', description: 'Username' },
            displayName: { type: 'string', description: 'Display name' },
            emailAddress: { type: 'string', description: 'Email address' },
            active: { type: 'boolean', description: 'Account active status' }
          }
        },
        reporter: {
          type: 'object',
          description: 'User who reported the issue',
          required: true,
          nested: {
            name: { type: 'string', description: 'Username' },
            displayName: { type: 'string', description: 'Display name' },
            emailAddress: { type: 'string', description: 'Email address' }
          }
        },
        project: {
          type: 'object',
          description: 'Project containing the issue',
          required: true,
          nested: {
            id: { type: 'string', description: 'Project ID' },
            key: { type: 'string', description: 'Project key' },
            name: { type: 'string', description: 'Project name' },
            lead: { type: 'object', description: 'Project lead user' }
          }
        },
        created: {
          type: 'string',
          description: 'Issue creation timestamp (ISO 8601)',
          required: true,
          example: '2023-01-01T10:00:00.000Z'
        },
        updated: {
          type: 'string',
          description: 'Last update timestamp (ISO 8601)',
          required: true,
          example: '2023-01-02T15:30:00.000Z'
        },
        components: {
          type: 'array',
          description: 'Project components affected by this issue',
          required: false,
          nested: {
            id: { type: 'string', description: 'Component ID' },
            name: { type: 'string', description: 'Component name' },
            description: { type: 'string', description: 'Component description' }
          }
        },
        fixVersions: {
          type: 'array',
          description: 'Versions where this issue will be fixed',
          required: false,
          nested: {
            id: { type: 'string', description: 'Version ID' },
            name: { type: 'string', description: 'Version name' },
            released: { type: 'boolean', description: 'Version release status' },
            releaseDate: { type: 'string', description: 'Release date' }
          }
        },
        labels: {
          type: 'array',
          description: 'Labels attached to the issue',
          required: false,
          example: ['bug', 'critical', 'frontend']
        }
      },
      metadata: {
        entityType: 'issue',
        lastUpdated: '2023-01-01T10:00:00.000Z',
        version: '1.0.0',
        source: 'jira-server'
      }
    } as FieldDefinitionContent, null, 2)
  } as ResourceContent,

  projectFields: {
    uri: 'jira://fields/project',
    mimeType: 'application/json',
    text: JSON.stringify({
      fields: {
        id: {
          type: 'string',
          description: 'Unique project identifier',
          required: true,
          example: '10000'
        },
        key: {
          type: 'string',
          description: 'Project key (unique)',
          required: true,
          example: 'TEST'
        },
        name: {
          type: 'string',
          description: 'Project display name',
          required: true,
          example: 'Test Project'
        },
        description: {
          type: 'string',
          description: 'Project description',
          required: false,
          example: 'This is a test project for development'
        },
        lead: {
          type: 'object',
          description: 'Project lead user',
          required: true,
          nested: {
            name: { type: 'string', description: 'Username' },
            displayName: { type: 'string', description: 'Display name' },
            emailAddress: { type: 'string', description: 'Email address' }
          }
        },
        url: {
          type: 'string',
          description: 'Project URL',
          required: false,
          example: 'https://example.com/projects/test'
        },
        assigneeType: {
          type: 'string',
          description: 'Default assignee type',
          required: false,
          example: 'PROJECT_LEAD'
        },
        components: {
          type: 'array',
          description: 'Project components',
          required: false,
          nested: {
            id: { type: 'string', description: 'Component ID' },
            name: { type: 'string', description: 'Component name' },
            description: { type: 'string', description: 'Component description' },
            lead: { type: 'object', description: 'Component lead user' }
          }
        },
        versions: {
          type: 'array',
          description: 'Project versions',
          required: false,
          nested: {
            id: { type: 'string', description: 'Version ID' },
            name: { type: 'string', description: 'Version name' },
            released: { type: 'boolean', description: 'Release status' },
            archived: { type: 'boolean', description: 'Archive status' }
          }
        },
        roles: {
          type: 'object',
          description: 'Project role URLs',
          required: false,
          example: {
            'Administrators': 'https://example.com/project/TEST/role/10002',
            'Developers': 'https://example.com/project/TEST/role/10001'
          }
        }
      },
      metadata: {
        entityType: 'project',
        lastUpdated: '2023-01-01T10:00:00.000Z',
        version: '1.0.0',
        source: 'jira-server'
      }
    } as FieldDefinitionContent, null, 2)
  } as ResourceContent,

  userFields: {
    uri: 'jira://fields/user',
    mimeType: 'application/json',
    text: JSON.stringify({
      fields: {
        name: {
          type: 'string',
          description: 'Username (Server/DC primary identifier)',
          required: true,
          example: 'john.doe'
        },
        key: {
          type: 'string',
          description: 'User key (Server/DC)',
          required: true,
          example: 'john.doe'
        },
        displayName: {
          type: 'string',
          description: 'Full display name',
          required: true,
          example: 'John Doe'
        },
        emailAddress: {
          type: 'string',
          description: 'Email address',
          required: false,
          example: 'john.doe@example.com'
        },
        active: {
          type: 'boolean',
          description: 'Account active status',
          required: true,
          example: true
        },
        timeZone: {
          type: 'string',
          description: 'User timezone',
          required: false,
          example: 'America/New_York'
        },
        locale: {
          type: 'string',
          description: 'User locale',
          required: false,
          example: 'en_US'
        },
        avatarUrls: {
          type: 'object',
          description: 'Avatar image URLs',
          required: false,
          nested: {
            '16x16': { type: 'string', description: '16x16 avatar URL' },
            '24x24': { type: 'string', description: '24x24 avatar URL' },
            '32x32': { type: 'string', description: '32x32 avatar URL' },
            '48x48': { type: 'string', description: '48x48 avatar URL' }
          }
        },
        groups: {
          type: 'object',
          description: 'User groups membership',
          required: false,
          nested: {
            size: { type: 'number', description: 'Number of groups' },
            items: { type: 'array', description: 'Group objects' }
          }
        }
      },
      metadata: {
        entityType: 'user',
        lastUpdated: '2023-01-01T10:00:00.000Z',
        version: '1.0.0',
        source: 'jira-server'
      }
    } as FieldDefinitionContent, null, 2)
  } as ResourceContent,

  boardFields: {
    uri: 'jira://fields/board',
    mimeType: 'application/json',
    text: JSON.stringify({
      fields: {
        id: {
          type: 'string',
          description: 'Board ID',
          required: true,
          example: '1'
        },
        name: {
          type: 'string',
          description: 'Board name',
          required: true,
          example: 'Test Board'
        },
        type: {
          type: 'string',
          description: 'Board type',
          required: true,
          example: 'scrum'
        },
        location: {
          type: 'object',
          description: 'Board location information',
          required: true,
          nested: {
            type: { type: 'string', description: 'Location type (project/user)' },
            projectId: { type: 'number', description: 'Project ID' },
            projectKey: { type: 'string', description: 'Project key' },
            projectName: { type: 'string', description: 'Project name' },
            displayName: { type: 'string', description: 'Display name' }
          }
        },
        canEdit: {
          type: 'boolean',
          description: 'Whether current user can edit board',
          required: false,
          example: true
        },
        isPrivate: {
          type: 'boolean',
          description: 'Whether board is private',
          required: false,
          example: false
        },
        favourite: {
          type: 'boolean',
          description: 'Whether board is favorited by current user',
          required: false,
          example: true
        }
      },
      metadata: {
        entityType: 'board',
        lastUpdated: '2023-01-01T10:00:00.000Z',
        version: '1.0.0',
        source: 'jira-server'
      }
    } as FieldDefinitionContent, null, 2)
  } as ResourceContent,

  sprintFields: {
    uri: 'jira://fields/sprint',
    mimeType: 'application/json',
    text: JSON.stringify({
      fields: {
        id: {
          type: 'string',
          description: 'Sprint ID',
          required: true,
          example: '1'
        },
        name: {
          type: 'string',
          description: 'Sprint name',
          required: true,
          example: 'Sprint 1'
        },
        state: {
          type: 'string',
          description: 'Sprint state',
          required: true,
          example: 'active'
        },
        startDate: {
          type: 'string',
          description: 'Sprint start date (ISO 8601)',
          required: false,
          example: '2023-01-01T10:00:00.000Z'
        },
        endDate: {
          type: 'string',
          description: 'Sprint end date (ISO 8601)',
          required: false,
          example: '2023-01-15T10:00:00.000Z'
        },
        completeDate: {
          type: 'string',
          description: 'Sprint completion date (ISO 8601)',
          required: false,
          example: '2023-01-14T16:00:00.000Z'
        },
        originBoardId: {
          type: 'number',
          description: 'ID of the board where sprint was created',
          required: false,
          example: 1
        },
        goal: {
          type: 'string',
          description: 'Sprint goal',
          required: false,
          example: 'Complete user authentication features'
        }
      },
      metadata: {
        entityType: 'sprint',
        lastUpdated: '2023-01-01T10:00:00.000Z',
        version: '1.0.0',
        source: 'jira-server'
      }
    } as FieldDefinitionContent, null, 2)
  } as ResourceContent,

  worklogFields: {
    uri: 'jira://fields/worklog',
    mimeType: 'application/json',
    text: JSON.stringify({
      fields: {
        id: {
          type: 'string',
          description: 'Worklog entry ID',
          required: true,
          example: '10000'
        },
        author: {
          type: 'object',
          description: 'User who created the worklog',
          required: true,
          nested: {
            name: { type: 'string', description: 'Username' },
            displayName: { type: 'string', description: 'Display name' },
            emailAddress: { type: 'string', description: 'Email address' }
          }
        },
        updateAuthor: {
          type: 'object',
          description: 'User who last updated the worklog',
          required: false,
          nested: {
            name: { type: 'string', description: 'Username' },
            displayName: { type: 'string', description: 'Display name' }
          }
        },
        comment: {
          type: 'string',
          description: 'Worklog comment/description',
          required: false,
          example: 'Fixed the login bug'
        },
        started: {
          type: 'string',
          description: 'When work started (ISO 8601)',
          required: true,
          example: '2023-01-01T09:00:00.000Z'
        },
        timeSpent: {
          type: 'string',
          description: 'Time spent in human readable format',
          required: true,
          example: '2h 30m'
        },
        timeSpentSeconds: {
          type: 'number',
          description: 'Time spent in seconds',
          required: true,
          example: 9000
        },
        created: {
          type: 'string',
          description: 'Worklog creation timestamp (ISO 8601)',
          required: true,
          example: '2023-01-01T10:00:00.000Z'
        },
        updated: {
          type: 'string',
          description: 'Last update timestamp (ISO 8601)',
          required: true,
          example: '2023-01-01T10:00:00.000Z'
        },
        visibility: {
          type: 'object',
          description: 'Worklog visibility settings',
          required: false,
          nested: {
            type: { type: 'string', description: 'Visibility type (group/role)' },
            value: { type: 'string', description: 'Group or role name' }
          }
        }
      },
      metadata: {
        entityType: 'worklog',
        lastUpdated: '2023-01-01T10:00:00.000Z',
        version: '1.0.0',
        source: 'jira-server'
      }
    } as FieldDefinitionContent, null, 2)
  } as ResourceContent,

  customFields: {
    uri: 'jira://fields/custom',
    mimeType: 'application/json',
    text: JSON.stringify({
      fields: {
        'customfield_10001': {
          type: 'string',
          description: 'Custom Text Field',
          required: false,
          example: 'Custom value'
        },
        'customfield_10002': {
          type: 'object',
          description: 'Custom Select Field',
          required: false,
          nested: {
            value: { type: 'string', description: 'Selected value' },
            id: { type: 'string', description: 'Option ID' }
          }
        },
        'customfield_10003': {
          type: 'array',
          description: 'Custom Multi-Select Field',
          required: false,
          nested: {
            value: { type: 'string', description: 'Selected value' },
            id: { type: 'string', description: 'Option ID' }
          }
        },
        'customfield_10004': {
          type: 'number',
          description: 'Custom Number Field',
          required: false,
          example: 42.5
        },
        'customfield_10005': {
          type: 'string',
          description: 'Custom Date Field (ISO 8601)',
          required: false,
          example: '2023-01-01'
        },
        'customfield_10006': {
          type: 'object',
          description: 'Custom User Picker Field',
          required: false,
          nested: {
            name: { type: 'string', description: 'Username' },
            displayName: { type: 'string', description: 'Display name' }
          }
        }
      },
      metadata: {
        entityType: 'custom',
        lastUpdated: '2023-01-01T10:00:00.000Z',
        version: '1.0.0',
        source: 'configuration'
      }
    } as FieldDefinitionContent, null, 2)
  } as ResourceContent
};

/**
 * Resource Error Responses
 */
export const resourceErrorResponses = {
  notFound: {
    uri: 'jira://fields/nonexistent',
    mimeType: 'application/json',
    text: JSON.stringify({
      error: {
        type: 'resource_not_found',
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested resource does not exist.',
        uri: 'jira://fields/nonexistent'
      }
    })
  } as ResourceContent,

  invalidUri: {
    uri: 'invalid://uri/format',
    mimeType: 'application/json',
    text: JSON.stringify({
      error: {
        type: 'invalid_uri',
        code: 'INVALID_RESOURCE_URI',
        message: 'The resource URI format is invalid.',
        uri: 'invalid://uri/format'
      }
    })
  } as ResourceContent
};