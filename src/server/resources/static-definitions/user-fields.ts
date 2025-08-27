import type { ResourceDefinition } from '../../../types/field-definition.js';

/**
 * Static field definitions for Jira user fields
 * Covers core user fields with complete nested access paths
 */
export const USER_FIELD_DEFINITIONS: ResourceDefinition = {
  uri: 'jira://user/fields',
  entityType: 'user',
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
  totalFields: 12, // Core user fields

  fields: {
    displayName: {
      id: 'displayName',
      name: 'Display Name',
      description: 'User display name',
      type: 'string',
      accessPaths: [
        {
          path: 'displayName',
          description: 'User full display name',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['displayName'],
      commonUsage: [['displayName']],
    },

    emailAddress: {
      id: 'emailAddress',
      name: 'Email Address',
      description: 'User email address',
      type: 'string',
      accessPaths: [
        {
          path: 'emailAddress',
          description: 'User email address',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['emailAddress'],
      commonUsage: [['emailAddress']],
    },

    name: {
      id: 'name',
      name: 'Username',
      description: 'User login name',
      type: 'string',
      accessPaths: [
        {
          path: 'name',
          description: 'Username for login',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['name'],
      commonUsage: [['name']],
    },

    key: {
      id: 'key',
      name: 'User Key',
      description: 'Unique user key identifier',
      type: 'string',
      accessPaths: [
        {
          path: 'key',
          description: 'User key identifier',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['key'],
      commonUsage: [['key']],
    },

    accountId: {
      id: 'accountId',
      name: 'Account ID',
      description: 'User account identifier',
      type: 'string',
      accessPaths: [
        {
          path: 'accountId',
          description: 'User account ID',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['accountId'],
      commonUsage: [['accountId']],
    },

    active: {
      id: 'active',
      name: 'Active Status',
      description: 'User active status',
      type: 'string',
      accessPaths: [
        {
          path: 'active',
          description: 'Whether user is active',
          type: 'boolean',
          frequency: 'high',
        },
      ],
      examples: ['active'],
      commonUsage: [['active']],
    },

    timeZone: {
      id: 'timeZone',
      name: 'Time Zone',
      description: 'User timezone setting',
      type: 'string',
      accessPaths: [
        {
          path: 'timeZone',
          description: 'User timezone (e.g., "America/New_York")',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['timeZone'],
      commonUsage: [['timeZone']],
    },

    locale: {
      id: 'locale',
      name: 'Locale',
      description: 'User locale setting',
      type: 'string',
      accessPaths: [
        {
          path: 'locale',
          description: 'User locale (e.g., "en_US")',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['locale'],
      commonUsage: [['locale']],
    },

    avatarUrls: {
      id: 'avatarUrls',
      name: 'Avatar URLs',
      description: 'User avatar image URLs',
      type: 'object',
      accessPaths: [
        {
          path: 'avatarUrls.48x48',
          description: 'Large avatar URL (48x48)',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'avatarUrls.24x24',
          description: 'Medium avatar URL (24x24)',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'avatarUrls.16x16',
          description: 'Small avatar URL (16x16)',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'avatarUrls.32x32',
          description: 'Default avatar URL (32x32)',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['avatarUrls.48x48', 'avatarUrls.32x32'],
      commonUsage: [
        ['avatarUrls.48x48'],
        ['avatarUrls.32x32'],
        ['avatarUrls.24x24'],
      ],
    },

    groups: {
      id: 'groups',
      name: 'Groups',
      description: 'User group memberships',
      type: 'object',
      accessPaths: [
        {
          path: 'groups.size',
          description: 'Number of groups user belongs to',
          type: 'number',
          frequency: 'medium',
        },
        {
          path: 'groups.items[].name',
          description: 'Group name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'groups.items[].self',
          description: 'Group REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['groups.items[].name', 'groups.size'],
      commonUsage: [
        ['groups.items[].name'],
        ['groups.size'],
        ['groups.items[].name', 'groups.size'],
      ],
    },

    applicationRoles: {
      id: 'applicationRoles',
      name: 'Application Roles',
      description: 'User application role assignments',
      type: 'object',
      accessPaths: [
        {
          path: 'applicationRoles.size',
          description: 'Number of application roles',
          type: 'number',
          frequency: 'medium',
        },
        {
          path: 'applicationRoles.items[].key',
          description: 'Application role key',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'applicationRoles.items[].name',
          description: 'Application role name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'applicationRoles.items[].defaultGroups',
          description: 'Default groups for role',
          type: 'string[]',
          frequency: 'low',
        },
        {
          path: 'applicationRoles.items[].selectedByDefault',
          description: 'Whether role is selected by default',
          type: 'boolean',
          frequency: 'low',
        },
        {
          path: 'applicationRoles.items[].defined',
          description: 'Whether role is defined',
          type: 'boolean',
          frequency: 'low',
        },
        {
          path: 'applicationRoles.items[].numberOfSeats',
          description: 'Number of seats for role',
          type: 'number',
          frequency: 'low',
        },
        {
          path: 'applicationRoles.items[].remainingSeats',
          description: 'Remaining seats for role',
          type: 'number',
          frequency: 'low',
        },
        {
          path: 'applicationRoles.items[].userCount',
          description: 'User count for role',
          type: 'number',
          frequency: 'low',
        },
        {
          path: 'applicationRoles.items[].userCountDescription',
          description: 'User count description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'applicationRoles.items[].hasUnlimitedSeats',
          description: 'Whether role has unlimited seats',
          type: 'boolean',
          frequency: 'low',
        },
      ],
      examples: ['applicationRoles.items[].name', 'applicationRoles.size'],
      commonUsage: [
        ['applicationRoles.items[].name'],
        ['applicationRoles.size'],
        ['applicationRoles.items[].key', 'applicationRoles.items[].name'],
      ],
    },

    self: {
      id: 'self',
      name: 'REST API URL',
      description: 'User REST API URL',
      type: 'string',
      accessPaths: [
        {
          path: 'self',
          description: 'User REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['self'],
      commonUsage: [['self']],
    },
  },

  // Fast lookup index: path -> field ID
  pathIndex: {},
};

// Build the path index automatically
Object.entries(USER_FIELD_DEFINITIONS.fields).forEach(([fieldId, field]) => {
  field.accessPaths.forEach(accessPath => {
    USER_FIELD_DEFINITIONS.pathIndex[accessPath.path] = fieldId;
  });
});