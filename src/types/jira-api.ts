/**
 * Jira Server API Response Type Definitions
 *
 * Comprehensive type definitions for Jira Server/Data Center API responses.
 * These types are specifically designed for Server/DC environments (not Cloud).
 */

import type {
  IsoDateString,
  SearchResult,
  IssueStatusCategory,
  PaginationOptions,
} from './common';

/**
 * Base Jira entity with common fields
 */
export interface JiraEntity {
  self: string;
  id: string;
}

/**
 * Jira User (Server/DC specific - uses name/key instead of accountId)
 */
export interface JiraUser extends JiraEntity {
  name: string; // Server/DC uses name as primary identifier
  key: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
  active: boolean;
  timeZone?: string;
  locale?: string;
  groups?: {
    size: number;
    items: JiraGroup[];
  };
}

/**
 * Jira Group
 */
export interface JiraGroup extends JiraEntity {
  name: string;
  groupId?: string;
}

/**
 * Jira Status
 */
export interface JiraStatus extends JiraEntity {
  name: string;
  description: string;
  iconUrl: string;
  statusCategory: {
    self: string;
    id: number;
    key: IssueStatusCategory;
    colorName: string;
    name: string;
  };
}

/**
 * Jira Priority
 */
export interface JiraPriority extends JiraEntity {
  name: string;
  description?: string;
  iconUrl: string;
  statusColor: string;
}

/**
 * Jira Issue Type
 */
export interface JiraIssueType extends JiraEntity {
  name: string;
  description: string;
  iconUrl: string;
  subtask: boolean;
  avatarId?: number;
  hierarchyLevel?: number;
}

/**
 * Jira Resolution
 */
export interface JiraResolution extends JiraEntity {
  name: string;
  description: string;
}

/**
 * Jira Component
 */
export interface JiraComponent extends JiraEntity {
  name: string;
  description?: string;
  lead?: JiraUser;
  assigneeType?: string;
  assignee?: JiraUser;
  realAssigneeType?: string;
  realAssignee?: JiraUser;
  isAssigneeTypeValid?: boolean;
  project?: string;
  projectId?: number;
}

/**
 * Jira Version
 */
export interface JiraVersion extends JiraEntity {
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  startDate?: IsoDateString;
  releaseDate?: IsoDateString;
  overdue?: boolean;
  userStartDate?: string;
  userReleaseDate?: string;
  project?: string;
  projectId?: number;
  moveUnfixedIssuesTo?: string;
  operations?: JiraOperation[];
  remotelinks?: any[];
}

/**
 * Jira Project
 */
export interface JiraProject extends JiraEntity {
  key: string;
  name: string;
  description?: string;
  lead?: JiraUser;
  components: JiraComponent[];
  issueTypes: JiraIssueType[];
  url?: string;
  email?: string;
  assigneeType?: string;
  versions: JiraVersion[];
  roles: Record<string, string>;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
  projectCategory?: {
    self: string;
    id: string;
    name: string;
    description: string;
  };
  projectTypeKey?: string;
  archived?: boolean;
  properties?: Record<string, any>;
  insight?: {
    totalIssueCount: number;
    lastIssueUpdateTime: IsoDateString;
  };
}

/**
 * Jira Custom Field Value (can be various types)
 */
export type JiraCustomFieldValue =
  | string
  | number
  | boolean
  | null
  | JiraUser
  | JiraUser[]
  | JiraVersion
  | JiraVersion[]
  | JiraComponent
  | JiraComponent[]
  | { value: string; id?: string }
  | { value: string; id?: string }[]
  | Record<string, any>;

/**
 * Jira Issue Fields
 */
export interface JiraIssueFields {
  // Core fields
  summary: string;
  description?: string;
  status: JiraStatus;
  priority?: JiraPriority;
  issuetype: JiraIssueType;
  project: JiraProject;

  // People
  assignee?: JiraUser;
  reporter?: JiraUser;
  creator?: JiraUser;

  // Dates
  created: IsoDateString;
  updated: IsoDateString;
  resolutiondate?: IsoDateString;
  duedate?: IsoDateString;

  // Resolution
  resolution?: JiraResolution;

  // Classifications
  components: JiraComponent[];
  fixVersions: JiraVersion[];
  versions: JiraVersion[];
  labels: string[];

  // Relationships
  parent?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      priority?: JiraPriority;
      issuetype: JiraIssueType;
    };
  };
  subtasks?: Array<{
    id: string;
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      priority?: JiraPriority;
      issuetype: JiraIssueType;
    };
  }>;
  issuelinks?: JiraIssueLink[];

  // Time tracking
  timeoriginalestimate?: number;
  timeestimate?: number;
  timespent?: number;
  aggregatetimeoriginalestimate?: number;
  aggregatetimeestimate?: number;
  aggregatetimespent?: number;

  // Worklog
  worklog?: {
    startAt: number;
    maxResults: number;
    total: number;
    worklogs: JiraWorklog[];
  };

  // Attachments
  attachment?: JiraAttachment[];

  // Comments
  comment?: {
    startAt: number;
    maxResults: number;
    total: number;
    comments: JiraComment[];
  };

  // Votes and watches
  votes?: {
    self: string;
    votes: number;
    hasVoted: boolean;
    voters: JiraUser[];
  };
  watches?: {
    self: string;
    watchCount: number;
    isWatching: boolean;
    watchers: JiraUser[];
  };

  // Security
  security?: {
    self: string;
    id: string;
    name: string;
    description: string;
  };

  // Environment and other text fields
  environment?: string;

  // Custom fields (Server/DC specific patterns)
  [key: `customfield_${number}`]: JiraCustomFieldValue;
}

/**
 * Jira Issue
 */
export interface JiraIssue extends JiraEntity {
  key: string;
  fields: JiraIssueFields;
  expand?: string;
  renderedFields?: Partial<JiraIssueFields>;
  properties?: Record<string, any>;
  names?: Record<string, string>;
  schema?: Record<string, JiraFieldSchema>;
  transitions?: JiraTransition[];
  operations?: JiraOperation[];
  editmeta?: JiraEditMeta;
  changelog?: JiraChangelog;
  versionedRepresentations?: Record<string, any>;
  fieldsToInclude?: {
    included?: string[];
    actuallyIncluded?: string[];
    excluded?: string[];
  };
}

/**
 * Jira Issue Link
 */
export interface JiraIssueLink {
  id: string;
  type: JiraIssueLinkType;
  inwardIssue?: {
    id: string;
    key: string;
    self: string;
    fields: Partial<JiraIssueFields>;
  };
  outwardIssue?: {
    id: string;
    key: string;
    self: string;
    fields: Partial<JiraIssueFields>;
  };
}

/**
 * Jira Issue Link Type
 */
export interface JiraIssueLinkType extends JiraEntity {
  name: string;
  inward: string;
  outward: string;
}

/**
 * Jira Worklog
 */
export interface JiraWorklog extends JiraEntity {
  author: JiraUser;
  updateAuthor?: JiraUser;
  comment?: string;
  created: IsoDateString;
  updated: IsoDateString;
  started: IsoDateString;
  timeSpent: string;
  timeSpentSeconds: number;
  issueId?: string;
  visibility?: {
    type: 'group' | 'role';
    value: string;
    identifier?: string;
  };
  properties?: Array<{
    key: string;
    value: any;
  }>;
}

/**
 * Jira Attachment
 */
export interface JiraAttachment extends JiraEntity {
  filename: string;
  author: JiraUser;
  created: IsoDateString;
  size: number;
  mimeType: string;
  content: string;
  thumbnail?: string;
  properties?: Record<string, any>;
}

/**
 * Jira Comment
 */
export interface JiraComment extends JiraEntity {
  author: JiraUser;
  body: string;
  updateAuthor?: JiraUser;
  created: IsoDateString;
  updated: IsoDateString;
  visibility?: {
    type: 'group' | 'role';
    value: string;
  };
  properties?: Array<{
    key: string;
    value: any;
  }>;
}

/**
 * Jira Transition
 */
export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
  hasScreen?: boolean;
  isGlobal?: boolean;
  isInitial?: boolean;
  isAvailable?: boolean;
  isConditional?: boolean;
  fields?: Record<string, JiraFieldMeta>;
  expand?: string;
  looped?: boolean;
}

/**
 * Jira Operation
 */
export interface JiraOperation {
  id: string;
  styleClass: string;
  iconClass: string;
  label: string;
  title: string;
  href: string;
  weight: number;
}

/**
 * Jira Field Schema
 */
export interface JiraFieldSchema {
  type: string;
  items?: string;
  system?: string;
  custom?: string;
  customId?: number;
  configuration?: Record<string, any>;
}

/**
 * Jira Field Meta
 */
export interface JiraFieldMeta {
  required: boolean;
  schema: JiraFieldSchema;
  name: string;
  key?: string;
  hasDefaultValue?: boolean;
  operations?: string[];
  allowedValues?: any[];
  autoCompleteUrl?: string;
  defaultValue?: any;
}

/**
 * Jira Edit Meta
 */
export interface JiraEditMeta {
  fields: Record<string, JiraFieldMeta>;
}

/**
 * Jira Changelog
 */
export interface JiraChangelog {
  startAt: number;
  maxResults: number;
  total: number;
  histories: JiraChangelogHistory[];
}

/**
 * Jira Changelog History
 */
export interface JiraChangelogHistory {
  id: string;
  author: JiraUser;
  created: IsoDateString;
  items: JiraChangelogItem[];
}

/**
 * Jira Changelog Item
 */
export interface JiraChangelogItem {
  field: string;
  fieldtype: string;
  fieldId?: string;
  from?: string;
  fromString?: string;
  to?: string;
  toString?: string;
  tmpFromAccountId?: string;
  tmpToAccountId?: string;
}

/**
 * Jira Field Definition
 */
export interface JiraField extends JiraEntity {
  key?: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema: JiraFieldSchema;
  description?: string;
  isLocked?: boolean;
  screensCount?: number;
  contextsCount?: number;
  lastUsed?: {
    type: string;
    project?: {
      id: string;
      key: string;
      name: string;
    };
  };
}

/**
 * Jira Agile Board
 */
export interface JiraBoard extends JiraEntity {
  name: string;
  type: 'scrum' | 'kanban' | 'simple';
  location: {
    type: 'project' | 'user';
    projectId?: number;
    userId?: number;
    userAccountId?: string;
    displayName?: string;
    projectName?: string;
    projectKey?: string;
    projectTypeKey?: string;
    avatarURI?: string;
    name?: string;
  };
  canEdit?: boolean;
  isPrivate?: boolean;
  favourite?: boolean;
}

/**
 * Jira Sprint
 */
export interface JiraSprint extends JiraEntity {
  state: 'closed' | 'active' | 'future';
  name: string;
  startDate?: IsoDateString;
  endDate?: IsoDateString;
  completeDate?: IsoDateString;
  originBoardId?: number;
  goal?: string;
}

/**
 * Board Configuration
 */
export interface JiraBoardConfiguration {
  id: number;
  name: string;
  type: string;
  self: string;
  location: JiraBoard['location'];
  filter: {
    id: string;
    self: string;
  };
  subQuery?: {
    query: string;
  };
  columnConfig: {
    columns: Array<{
      name: string;
      statuses: Array<{
        id: string;
        self: string;
      }>;
      min?: number;
      max?: number;
    }>;
    constraintType?: string;
  };
  estimation?: {
    type: 'none' | 'issueCount' | 'field';
    field?: {
      fieldId: string;
      displayName: string;
    };
  };
  ranking?: {
    rankCustomFieldId: number;
  };
}

/**
 * Search Issues Response
 */
export interface JiraSearchResponse extends SearchResult<JiraIssue> {
  issues: JiraIssue[];
  warningMessages?: string[];
  expand?: string;
  names?: Record<string, string>;
  schema?: Record<string, JiraFieldSchema>;
}

/**
 * Search Options for Jira APIs
 */
export interface JiraSearchOptions extends PaginationOptions {
  jql?: string;
  fields?: string[];
  expand?: string[];
  properties?: string[];
  validateQuery?: boolean;
}

/**
 * Board Issues Options
 */
export interface BoardIssueOptions extends JiraSearchOptions {
  assignee?: string;
  epic?: string;
  label?: string;
  version?: string;
  component?: string;
}

/**
 * Sprint State for filtering
 */
export type SprintState = 'closed' | 'active' | 'future';

/**
 * Board Filters
 */
export interface BoardFilters {
  type?: 'scrum' | 'kanban' | 'simple';
  name?: string;
  projectKeyOrId?: string;
}

/**
 * Attachment Download Result
 */
export interface AttachmentDownloadResult {
  issueKey: string;
  attachments: Array<{
    id: string;
    filename: string;
    size: number;
    downloadPath: string;
    success: boolean;
    error?: string;
  }>;
  totalSize: number;
  downloadPath: string;
  success: boolean;
  errors?: string[];
}
