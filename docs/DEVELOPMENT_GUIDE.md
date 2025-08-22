# Development Guide

## 🏗️ Technical Architecture Design

### Core Technology Stack

#### MCP Official Dependencies
```typescript
// Main dependencies
"(@modelcontextprotocol/sdk": "^1.0.0"  // Official MCP TypeScript SDK
```

#### Configuration Interface (Simplified)
```typescript
export interface JiraServerConfig {
  // Basic configuration
  url: string;                 // Jira Server URL
  personalToken: string;       // PAT token (only authentication method)
  
  // Connection configuration
  sslVerify: boolean;          // SSL certificate verification
  timeout: number;             // Request timeout (default 30s)
  
  // Filter configuration (optional)
  projectsFilter?: string[];   // Project filter list
}
```

#### Core Service Interface
```typescript
export interface JiraService {
  // Issue related
  getIssue(issueKey: string, fields?: string[]): Promise<JiraIssue>;
  getIssueTransitions(issueKey: string): Promise<JiraTransition[]>;
  getIssueWorklogs(issueKey: string): Promise<JiraWorklog[]>;
  
  // Search related
  searchIssues(jql: string, options?: SearchOptions): Promise<SearchResult<JiraIssue>>;
  searchFields(keyword?: string, limit?: number): Promise<JiraField[]>;
  
  // Project related
  getAllProjects(includeArchived?: boolean): Promise<JiraProject[]>;
  getProjectIssues(projectKey: string, options?: PaginationOptions): Promise<SearchResult<JiraIssue>>;
  getProjectVersions(projectKey: string): Promise<JiraVersion[]>;
  
  // User related
  getUserProfile(identifier: string): Promise<JiraUser>;
  
  // Agile related
  getAgileBoards(filters?: BoardFilters): Promise<JiraBoard[]>;
  getBoardIssues(boardId: string, options?: BoardIssueOptions): Promise<SearchResult<JiraIssue>>;
  getSprintsFromBoard(boardId: string, state?: SprintState): Promise<JiraSprint[]>;
  getSprintIssues(sprintId: string, fields?: string[]): Promise<SearchResult<JiraIssue>>;
  
  // Attachment related
  downloadAttachments(issueKey: string, targetDir: string): Promise<AttachmentDownloadResult>;
}
```

## 🎯 MCP Implementation Strategy

For detailed tool and resource specifications, see [API Design](./API_DESIGN.md).

## 🔧 Field Selection Implementation Details

> **Note:** The field filtering logic is the core of the **Field Processing Engine** (Task `API-UTIL-001`). It is a specialized component, not a generic utility.

## 🔐 Authentication and Configuration

Authentication is handled via Personal Access Token (PAT). Configuration is loaded from environment variables. See `.env.example` for details.

##  workflow

For team structure, roles, and development process, see the [**Team & Development Workflow**](./WORKFLOW.md) document.

## 🔗 Related Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [API Design](./API_DESIGN.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Team & Development Workflow](./WORKFLOW.md)
