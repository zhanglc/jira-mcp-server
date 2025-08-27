import type { ResourceDefinition } from '../../../types/field-definition.js';

/**
 * Static field definitions for Jira agile fields (boards, sprints, epics)
 * Covers core agile fields with complete nested access paths
 */
export const AGILE_FIELD_DEFINITIONS: ResourceDefinition = {
  uri: 'jira://agile/fields',
  entityType: 'agile',
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
  totalFields: 3, // Core agile entities: board, sprint, epic

  fields: {
    board: {
      id: 'board',
      name: 'Board',
      description: 'Agile board information and metadata',
      type: 'object',
      accessPaths: [
        {
          path: 'board.id',
          description: 'Board ID',
          type: 'number',
          frequency: 'high',
        },
        {
          path: 'board.name',
          description: 'Board name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'board.type',
          description: 'Board type (scrum, kanban, simple)',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'board.location.type',
          description: 'Board location type (project, user)',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'board.location.key',
          description: 'Board location key (project key or user key)',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'board.location.id',
          description: 'Board location ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'board.location.name',
          description: 'Board location name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'board.location.displayName',
          description: 'Board location display name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'board.location.projectName',
          description: 'Board project name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'board.location.projectKey',
          description: 'Board project key',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'board.location.projectId',
          description: 'Board project ID',
          type: 'number',
          frequency: 'medium',
        },
        {
          path: 'board.location.projectTypeKey',
          description: 'Board project type key',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'board.location.avatarURI',
          description: 'Board location avatar URI',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'board.self',
          description: 'Board REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['board.name', 'board.type', 'board.location.key'],
      commonUsage: [
        ['board.name', 'board.type'],
        ['board.name', 'board.location.key'],
        ['board.id', 'board.name'],
        ['board.type', 'board.location.type'],
      ],
    },

    sprint: {
      id: 'sprint',
      name: 'Sprint',
      description: 'Agile sprint information and metadata',
      type: 'object',
      accessPaths: [
        {
          path: 'sprint.id',
          description: 'Sprint ID',
          type: 'number',
          frequency: 'high',
        },
        {
          path: 'sprint.name',
          description: 'Sprint name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'sprint.state',
          description: 'Sprint state (future, active, closed)',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'sprint.startDate',
          description: 'Sprint start date',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'sprint.endDate',
          description: 'Sprint end date',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'sprint.completeDate',
          description: 'Sprint completion date',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'sprint.originBoardId',
          description: 'Origin board ID',
          type: 'number',
          frequency: 'medium',
        },
        {
          path: 'sprint.goal',
          description: 'Sprint goal description',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'sprint.self',
          description: 'Sprint REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['sprint.name', 'sprint.state', 'sprint.startDate'],
      commonUsage: [
        ['sprint.name', 'sprint.state'],
        ['sprint.name', 'sprint.startDate', 'sprint.endDate'],
        ['sprint.state', 'sprint.startDate'],
        ['sprint.id', 'sprint.name'],
        ['sprint.name', 'sprint.goal'],
      ],
    },

    epic: {
      id: 'epic',
      name: 'Epic',
      description: 'Epic information and metadata',
      type: 'object',
      accessPaths: [
        {
          path: 'epic.id',
          description: 'Epic ID',
          type: 'number',
          frequency: 'high',
        },
        {
          path: 'epic.key',
          description: 'Epic key (e.g., "DEMO-123")',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'epic.name',
          description: 'Epic name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'epic.summary',
          description: 'Epic summary',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'epic.color.key',
          description: 'Epic color key',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'epic.done',
          description: 'Epic completion status',
          type: 'boolean',
          frequency: 'high',
        },
        {
          path: 'epic.self',
          description: 'Epic REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['epic.key', 'epic.name', 'epic.done'],
      commonUsage: [
        ['epic.key', 'epic.name'],
        ['epic.name', 'epic.done'],
        ['epic.key', 'epic.summary'],
        ['epic.key', 'epic.name', 'epic.done'],
      ],
    },
  },

  // Fast lookup index: path -> field ID
  pathIndex: {},
};

// Build the path index automatically
Object.entries(AGILE_FIELD_DEFINITIONS.fields).forEach(([fieldId, field]) => {
  field.accessPaths.forEach(accessPath => {
    AGILE_FIELD_DEFINITIONS.pathIndex[accessPath.path] = fieldId;
  });
});