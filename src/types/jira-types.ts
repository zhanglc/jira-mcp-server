export interface JiraUser {
  self: string;
  name: string;
  key: string;
  displayName: string;
  emailAddress: string;
  active: boolean;
  deleted?: boolean;
  timeZone: string;
  locale?: string;
  avatarUrls: {
    [size: string]: string;
  };
  groups?: {
    size: number;
    items: any[];
  };
  applicationRoles?: {
    size: number;
    items: any[];
  };
  expand?: string;
  // Cloud-specific field for compatibility
  accountId?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        name: string;
      };
    };
    assignee: JiraUser | null;
    reporter: JiraUser;
    creator: JiraUser;
    project: {
      key: string;
      name: string;
    };
    issuetype: {
      name: string;
      subtask: boolean;
    };
    priority: {
      name: string;
      id: string;
    };
    created: string;
    updated: string;
    description?: string;
    parent?: {
      key: string;
      fields: {
        summary: string;
      };
    };
    [key: string]: any;
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  description?: string;
  opsbarSequence?: number;
  to: {
    self?: string;
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    statusCategory: {
      self?: string;
      id: number;
      key: string;
      colorName?: string;
      name: string;
    };
  };
  hasScreen?: boolean;
  isGlobal?: boolean;
  isInitial?: boolean;
  isAvailable?: boolean;
  isConditional?: boolean;
  fields?: {
    [fieldId: string]: {
      required: boolean;
      schema: {
        type: string;
        system?: string;
      };
      name: string;
      hasDefaultValue?: boolean;
      operations?: string[];
      allowedValues?: any[];
    };
  };
}

export interface SearchOptions {
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export interface SearchResult<T> {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: T[];
}

export interface JiraWorklog {
  self: string;
  id: string;
  issueId: string;
  author: JiraUser;
  updateAuthor?: JiraUser;
  created: string;
  updated?: string;
  started?: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment?: string;
  visibility?: {
    type: string;
    value: string;
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead?: JiraUser;
  projectTypeKey: string;
  archived?: boolean;
  self: string;
  avatarUrls?: {
    [size: string]: string;
  };
  projectCategory?: {
    id: string;
    name: string;
    description?: string;
  };
  components?: {
    id: string;
    name: string;
    description?: string;
  }[];
  versions?: {
    id: string;
    name: string;
    description?: string;
    archived: boolean;
    released: boolean;
    releaseDate?: string;
  }[];
  roles?: {
    [roleName: string]: string;
  };
  issueTypes?: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    subtask: boolean;
  }[];
}

export interface JiraVersion {
  self: string;
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  startDate?: string;
  releaseDate?: string;
  overdue?: boolean;
  userStartDate?: string;
  userReleaseDate?: string;
  projectId: number;
}

export interface JiraBoard {
  id: number;
  self: string;
  name: string;
  type: string;
  admins?: {
    users: JiraUser[];
    groups: any[];
  };
  location?: {
    type: string;
    projectKey?: string;
    projectId?: number;
    projectName?: string;
    projectTypeKey?: string;
    avatarURI?: string;
    name?: string;
  };
  canEdit?: boolean;
  isPrivate?: boolean;
  favourite?: boolean;
}

export interface JiraSprint {
  id: number;
  self: string;
  state: string; // 'active', 'closed', 'future'
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId?: number;
  goal?: string;
}

export interface JiraField {
  id: string;
  name: string;
  key?: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames?: string[];
  schema?: {
    type: string;
    system?: string;
    custom?: string;
    customId?: number;
  };
}

export interface JiraAttachment {
  id: string;
  self: string;
  filename: string;
  author: JiraUser;
  created: string;
  size: number;
  mimeType: string;
  content: string; // URL to download the attachment
  thumbnail?: string; // URL to thumbnail (for images)
}

export interface JiraSystemInfo {
  baseUrl: string;
  version: string;
  versionNumbers: number[];
  deploymentType: string;
  buildNumber: number;
  buildDate: string;
  scmInfo: string;
  serverTitle?: string;
  healthChecks?: {
    name: string;
    description: string;
    status: string;
  }[];
  systemInfoService?: {
    [key: string]: any;
  };
}

export interface JiraServerInfo {
  baseUrl: string;
  version: string;
  versionNumbers: number[];
  deploymentType: string;
  buildNumber: number;
  buildDate: string;
  serverTime: string;
  scmInfo: string;
  serverTitle?: string;
  defaultLocale?: {
    locale: string;
  };
}