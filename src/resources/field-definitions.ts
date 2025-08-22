/**
 * Field Definition Provider - Generates field schemas for all Jira entities
 * 
 * Provides the 7 field definition resources as specified in the API design
 */

import type { Logger } from 'winston';
import type { 
  JiraServerConfig, 
  FieldSchema, 
  FieldDefinition,
  NestedFieldDefinition,
  CustomFieldDefinition,
  IsoDateString
} from '@/types';

export class FieldDefinitionProvider {
  constructor(
    private config: JiraServerConfig,
    private logger: Logger
  ) {}

  /**
   * Get issue field definitions - jira://fields/issue
   */
  async getIssueFields(): Promise<FieldSchema> {
    const basicFields: Record<string, FieldDefinition> = {
      // Core issue fields
      'key': {
        type: 'string',
        description: 'Issue key (e.g., PROJ-123)',
        example: 'PROJ-123'
      },
      'summary': {
        type: 'string',
        description: 'Issue title/summary',
        example: 'Fix authentication bug'
      },
      'description': {
        type: 'string',
        description: 'Issue description',
        example: 'Detailed description of the issue...'
      },
      'status': {
        type: 'object',
        description: 'Issue status object',
        properties: {
          'name': { type: 'string', description: 'Status name' },
          'id': { type: 'string', description: 'Status ID' },
          'category': { 
            type: 'object', 
            description: 'Status category',
            properties: {
              'name': { type: 'string', description: 'Category name' },
              'key': { type: 'string', description: 'Category key' }
            }
          }
        }
      },
      'assignee': {
        type: 'object',
        description: 'Issue assignee',
        properties: {
          'displayName': { type: 'string', description: 'Assignee display name' },
          'emailAddress': { type: 'string', description: 'Assignee email' },
          'key': { type: 'string', description: 'User key' },
          'accountId': { type: 'string', description: 'Account ID' }
        }
      },
      'reporter': {
        type: 'object',
        description: 'Issue reporter',
        properties: {
          'displayName': { type: 'string', description: 'Reporter display name' },
          'emailAddress': { type: 'string', description: 'Reporter email' },
          'key': { type: 'string', description: 'User key' },
          'accountId': { type: 'string', description: 'Account ID' }
        }
      },
      'priority': {
        type: 'object',
        description: 'Issue priority',
        properties: {
          'name': { type: 'string', description: 'Priority name' },
          'id': { type: 'string', description: 'Priority ID' }
        }
      },
      'issuetype': {
        type: 'object',
        description: 'Issue type',
        properties: {
          'name': { type: 'string', description: 'Issue type name' },
          'id': { type: 'string', description: 'Issue type ID' }
        }
      },
      'created': {
        type: 'string',
        format: 'date-time',
        description: 'Issue creation date',
        example: '2024-01-15T10:30:00.000Z'
      },
      'updated': {
        type: 'string',
        format: 'date-time',
        description: 'Last update date',
        example: '2024-01-16T14:45:00.000Z'
      }
    };

    const nestedFields: Record<string, NestedFieldDefinition> = {
      'assignee.displayName': {
        type: 'string',
        description: 'Assignee display name',
        path: 'assignee.displayName',
        parentField: 'assignee',
        nestedField: 'displayName'
      },
      'assignee.emailAddress': {
        type: 'string',
        description: 'Assignee email address',
        path: 'assignee.emailAddress',
        parentField: 'assignee',
        nestedField: 'emailAddress'
      },
      'reporter.displayName': {
        type: 'string',
        description: 'Reporter display name',
        path: 'reporter.displayName',
        parentField: 'reporter',
        nestedField: 'displayName'
      },
      'status.name': {
        type: 'string',
        description: 'Status name',
        path: 'status.name',
        parentField: 'status',
        nestedField: 'name'
      }
    };

    const customFields: Record<string, CustomFieldDefinition> = {
      'customfield_10008': {
        type: 'string',
        description: 'Epic Link',
        fieldId: 'customfield_10008',
        fieldName: 'Epic Link',
        fieldType: 'com.pyxis.greenhopper.jira:gh-epic-link',
        isGlobal: true,
        isLocked: false
      },
      'customfield_10009': {
        type: 'number',
        description: 'Story Points',
        fieldId: 'customfield_10009',
        fieldName: 'Story Points',
        fieldType: 'com.pyxis.greenhopper.jira:gh-epic-story-points',
        isGlobal: true,
        isLocked: false
      }
    };

    return {
      fields: { ...basicFields },
      nestedFields,
      customFields,
      metadata: {
        entityType: 'issue',
        version: '1.0.0',
        lastUpdated: new Date().toISOString() as IsoDateString,
        source: 'configuration',
        customFieldsIncluded: true,
        totalFields: Object.keys(basicFields).length + Object.keys(customFields).length
      }
    };
  }

  /**
   * Get project field definitions - jira://fields/project
   */
  async getProjectFields(): Promise<FieldSchema> {
    const fields: Record<string, FieldDefinition> = {
      'key': {
        type: 'string',
        description: 'Project key',
        example: 'PROJ'
      },
      'name': {
        type: 'string',
        description: 'Project name',
        example: 'My Project'
      },
      'lead': {
        type: 'object',
        description: 'Project lead',
        properties: {
          'displayName': { type: 'string', description: 'Lead display name' },
          'emailAddress': { type: 'string', description: 'Lead email address' }
        }
      },
      'projectTypeKey': {
        type: 'string',
        description: 'Project type (software, business, etc.)',
        enum: ['software', 'business', 'service_desk']
      }
    };

    const nestedFields: Record<string, NestedFieldDefinition> = {
      'lead.displayName': {
        type: 'string',
        description: 'Project lead display name',
        path: 'lead.displayName',
        parentField: 'lead',
        nestedField: 'displayName'
      }
    };

    return {
      fields,
      nestedFields,
      metadata: {
        entityType: 'project',
        version: '1.0.0',
        lastUpdated: new Date().toISOString() as IsoDateString,
        source: 'configuration',
        customFieldsIncluded: false,
        totalFields: Object.keys(fields).length
      }
    };
  }

  /**
   * Get user field definitions - jira://fields/user
   */
  async getUserFields(): Promise<FieldSchema> {
    const fields: Record<string, FieldDefinition> = {
      'displayName': {
        type: 'string',
        description: 'User display name',
        example: 'John Doe'
      },
      'emailAddress': {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'john.doe@example.com'
      },
      'active': {
        type: 'boolean',
        description: 'User active status'
      },
      'timeZone': {
        type: 'string',
        description: 'User timezone',
        example: 'America/New_York'
      }
    };

    return {
      fields,
      metadata: {
        entityType: 'user',
        version: '1.0.0',
        lastUpdated: new Date().toISOString() as IsoDateString,
        source: 'configuration',
        customFieldsIncluded: false,
        totalFields: Object.keys(fields).length
      }
    };
  }

  /**
   * Get board field definitions - jira://fields/board
   */
  async getBoardFields(): Promise<FieldSchema> {
    const fields: Record<string, FieldDefinition> = {
      'id': {
        type: 'number',
        description: 'Board ID',
        example: 1
      },
      'name': {
        type: 'string',
        description: 'Board name',
        example: 'My Scrum Board'
      },
      'type': {
        type: 'string',
        description: 'Board type',
        enum: ['scrum', 'kanban', 'simple']
      },
      'location': {
        type: 'object',
        description: 'Board location info',
        properties: {
          'projectKey': { type: 'string', description: 'Associated project key' },
          'name': { type: 'string', description: 'Associated project name' }
        }
      }
    };

    const nestedFields: Record<string, NestedFieldDefinition> = {
      'location.projectKey': {
        type: 'string',
        description: 'Associated project key',
        path: 'location.projectKey',
        parentField: 'location',
        nestedField: 'projectKey'
      }
    };

    return {
      fields,
      nestedFields,
      metadata: {
        entityType: 'board',
        version: '1.0.0',
        lastUpdated: new Date().toISOString() as IsoDateString,
        source: 'configuration',
        customFieldsIncluded: false,
        totalFields: Object.keys(fields).length
      }
    };
  }

  /**
   * Get sprint field definitions - jira://fields/sprint
   */
  async getSprintFields(): Promise<FieldSchema> {
    const fields: Record<string, FieldDefinition> = {
      'id': {
        type: 'number',
        description: 'Sprint ID',
        example: 1
      },
      'name': {
        type: 'string',
        description: 'Sprint name',
        example: 'Sprint 1'
      },
      'state': {
        type: 'string',
        description: 'Sprint state',
        enum: ['future', 'active', 'closed']
      },
      'startDate': {
        type: 'string',
        format: 'date-time',
        description: 'Sprint start date'
      },
      'endDate': {
        type: 'string',
        format: 'date-time',
        description: 'Sprint end date'
      },
      'goal': {
        type: 'string',
        description: 'Sprint goal'
      }
    };

    return {
      fields,
      metadata: {
        entityType: 'sprint',
        version: '1.0.0',
        lastUpdated: new Date().toISOString() as IsoDateString,
        source: 'configuration',
        customFieldsIncluded: false,
        totalFields: Object.keys(fields).length
      }
    };
  }

  /**
   * Get worklog field definitions - jira://fields/worklog
   */
  async getWorklogFields(): Promise<FieldSchema> {
    const fields: Record<string, FieldDefinition> = {
      'id': {
        type: 'string',
        description: 'Worklog ID'
      },
      'author': {
        type: 'object',
        description: 'Worklog author',
        properties: {
          'displayName': { type: 'string', description: 'Author display name' },
          'emailAddress': { type: 'string', description: 'Author email' }
        }
      },
      'timeSpent': {
        type: 'string',
        description: 'Time spent (human readable)',
        example: '2h 30m'
      },
      'timeSpentSeconds': {
        type: 'number',
        description: 'Time spent in seconds',
        example: 9000
      },
      'comment': {
        type: 'string',
        description: 'Worklog comment'
      },
      'created': {
        type: 'string',
        format: 'date-time',
        description: 'Creation date'
      },
      'started': {
        type: 'string',
        format: 'date-time',
        description: 'Work start date'
      }
    };

    const nestedFields: Record<string, NestedFieldDefinition> = {
      'author.displayName': {
        type: 'string',
        description: 'Worklog author display name',
        path: 'author.displayName',
        parentField: 'author',
        nestedField: 'displayName'
      }
    };

    return {
      fields,
      nestedFields,
      metadata: {
        entityType: 'worklog',
        version: '1.0.0',
        lastUpdated: new Date().toISOString() as IsoDateString,
        source: 'configuration',
        customFieldsIncluded: false,
        totalFields: Object.keys(fields).length
      }
    };
  }

  /**
   * Get custom field definitions - jira://fields/custom
   */
  async getCustomFields(): Promise<{ fields: Record<string, CustomFieldDefinition>; metadata: any }> {
    const fields: Record<string, CustomFieldDefinition> = {
      'customfield_10008': {
        type: 'string',
        description: 'Epic Link',
        fieldId: 'customfield_10008',
        fieldName: 'Epic Link',
        fieldType: 'com.pyxis.greenhopper.jira:gh-epic-link',
        isGlobal: true,
        isLocked: false
      },
      'customfield_10009': {
        type: 'number',
        description: 'Story Points',
        fieldId: 'customfield_10009',
        fieldName: 'Story Points',
        fieldType: 'com.pyxis.greenhopper.jira:gh-epic-story-points',
        isGlobal: true,
        isLocked: false
      },
      'customfield_10010': {
        type: 'string',
        description: 'Epic Name',
        fieldId: 'customfield_10010',
        fieldName: 'Epic Name',
        fieldType: 'com.pyxis.greenhopper.jira:gh-epic-label',
        isGlobal: true,
        isLocked: false
      }
    };

    return {
      fields,
      metadata: {
        totalCustomFields: Object.keys(fields).length,
        lastScanned: new Date().toISOString() as IsoDateString,
        serverVersion: 'unknown',
        includedProjects: [],
        fieldTypes: ['com.pyxis.greenhopper.jira:gh-epic-link', 'com.pyxis.greenhopper.jira:gh-epic-story-points']
      }
    };
  }
}