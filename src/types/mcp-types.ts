export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

// Tool Arguments Interface - replaces 'any' for type safety
export interface ToolArgs {
  [key: string]: unknown;
}

// Tool Response Interface - standardizes response format
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Specific Tool Argument Interfaces for type safety
export interface GetIssueArgs {
  issueKey: string;
  fields?: string[];
}

export interface GetIssueTransitionsArgs {
  issueKey: string;
}

export interface SearchIssuesArgs {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export interface GetIssueWorklogsArgs {
  issueKey: string;
}

export interface DownloadAttachmentsArgs {
  issueKey: string;
}

export interface GetAllProjectsArgs {
  includeArchived?: boolean;
}

export interface GetProjectArgs {
  projectKey: string;
}

export interface GetProjectIssuesArgs {
  projectKey: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export interface GetProjectVersionsArgs {
  projectKey: string;
}

export interface GetCurrentUserArgs {
  // No parameters
}

export interface GetUserProfileArgs {
  username: string;
}

export interface GetAgileBoardsArgs {
  projectKey?: string;
}

export interface GetBoardIssuesArgs {
  boardId: number;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export interface GetSprintsFromBoardArgs {
  boardId: number;
}

export interface GetSprintIssuesArgs {
  sprintId: number;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export interface GetSprintArgs {
  sprintId: number;
}

export interface SearchFieldsArgs {
  query?: string;
}

export interface GetSystemInfoArgs {
  // No parameters
}

export interface GetServerInfoArgs {
  // No parameters
}

// Union type for all possible tool arguments
export type AllToolArgs =
  | GetIssueArgs
  | GetIssueTransitionsArgs
  | SearchIssuesArgs
  | GetIssueWorklogsArgs
  | DownloadAttachmentsArgs
  | GetAllProjectsArgs
  | GetProjectArgs
  | GetProjectIssuesArgs
  | GetProjectVersionsArgs
  | GetCurrentUserArgs
  | GetUserProfileArgs
  | GetAgileBoardsArgs
  | GetBoardIssuesArgs
  | GetSprintsFromBoardArgs
  | GetSprintIssuesArgs
  | GetSprintArgs
  | SearchFieldsArgs
  | GetSystemInfoArgs
  | GetServerInfoArgs;
