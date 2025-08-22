# API Design

## 🎯 MCP Tools Specification

### Issue Related Tools (4 tools)

#### 1. `jira_get_issue`
Get details of a specific Jira issue with optional field selection.

```typescript
{
  name: "jira_get_issue",
  description: "Get details of a specific Jira issue",
  inputSchema: {
    type: "object",
    properties: {
      issueKey: {
        type: "string",
        description: "Jira issue key (e.g., 'PROJ-123')"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include. Supports nested fields with dot notation (e.g., 'assignee.displayName', 'status.name'). See jira://fields/issue resource for available fields.",
        default: ["summary", "status", "assignee.displayName", "reporter.displayName", "created", "updated"]
      }
    },
    required: ["issueKey"]
  }
}
```

#### 2. `jira_get_transitions`
Get available status transitions for a Jira issue.

```typescript
{
  name: "jira_get_transitions",
  description: "Get available status transitions for a Jira issue",
  inputSchema: {
    type: "object",
    properties: {
      issueKey: {
        type: "string",
        description: "Jira issue key (e.g., 'PROJ-123')"
      }
    },
    required: ["issueKey"]
  }
}
```

#### 3. `jira_get_worklog`
Get worklog entries for a Jira issue with optional field selection.

```typescript
{
  name: "jira_get_worklog",
  description: "Get worklog entries for a Jira issue",
  inputSchema: {
    type: "object",
    properties: {
      issueKey: {
        type: "string",
        description: "Jira issue key (e.g., 'PROJ-123')"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include for worklog entries",
        default: ["author.displayName", "timeSpent", "comment", "created"]
      }
    },
    required: ["issueKey"]
  }
}
```

#### 4. `jira_download_attachments`
Download attachments from a Jira issue.

```typescript
{
  name: "jira_download_attachments",
  description: "Download attachments from a Jira issue",
  inputSchema: {
    type: "object",
    properties: {
      issueKey: {
        type: "string",
        description: "Jira issue key (e.g., 'PROJ-123')"
      },
      targetDir: {
        type: "string",
        description: "Directory where attachments should be saved"
      }
    },
    required: ["issueKey", "targetDir"]
  }
}
```

### Search Related Tools (3 tools)

#### 5. `jira_search`
Search Jira issues using JQL with field selection.

```typescript
{
  name: "jira_search",
  description: "Search Jira issues using JQL (Jira Query Language)",
  inputSchema: {
    type: "object",
    properties: {
      jql: {
        type: "string",
        description: "JQL query string (e.g., 'project = PROJ AND status = \"In Progress\"')"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include in results",
        default: ["summary", "status", "assignee.displayName", "priority"]
      },
      limit: {
        type: "number",
        description: "Maximum number of results (1-50)",
        default: 10,
        minimum: 1,
        maximum: 50
      },
      startAt: {
        type: "number",
        description: "Starting index for pagination (0-based)",
        default: 0,
        minimum: 0
      }
    },
    required: ["jql"]
  }
}
```

#### 6. `jira_search_fields`
Search Jira fields by keyword with fuzzy matching.

```typescript
{
  name: "jira_search_fields",
  description: "Search Jira fields by keyword with fuzzy match",
  inputSchema: {
    type: "object",
    properties: {
      keyword: {
        type: "string",
        description: "Keyword for fuzzy search",
        default: ""
      },
      limit: {
        type: "number",
        description: "Maximum number of results",
        default: 10,
        minimum: 1
      },
      refresh: {
        type: "boolean",
        description: "Whether to force refresh the field list",
        default: false
      }
    }
  }
}
```

#### 7. `jira_get_project_issues`
Get all issues for a specific project with field selection.

```typescript
{
  name: "jira_get_project_issues",
  description: "Get all issues for a specific Jira project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., 'PROJ')"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include in results",
        default: ["summary", "status", "assignee.displayName", "created"]
      },
      limit: {
        type: "number",
        description: "Maximum number of results (1-50)",
        default: 10,
        minimum: 1,
        maximum: 50
      },
      startAt: {
        type: "number",
        description: "Starting index for pagination (0-based)",
        default: 0,
        minimum: 0
      }
    },
    required: ["projectKey"]
  }
}
```

### Project Related Tools (2 tools)

#### 8. `jira_get_all_projects`
Get all accessible Jira projects with field selection.

```typescript
{
  name: "jira_get_all_projects",
  description: "Get all Jira projects accessible to the current user",
  inputSchema: {
    type: "object",
    properties: {
      includeArchived: {
        type: "boolean",
        description: "Whether to include archived projects",
        default: false
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include for each project",
        default: ["key", "name", "projectTypeKey", "lead.displayName"]
      }
    }
  }
}
```

#### 9. `jira_get_project_versions`
Get all fix versions for a specific project.

```typescript
{
  name: "jira_get_project_versions",
  description: "Get all fix versions for a specific Jira project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "Jira project key (e.g., 'PROJ')"
      }
    },
    required: ["projectKey"]
  }
}
```

### User Related Tools (1 tool)

#### 10. `jira_get_user_profile`
Get user profile information with field selection.

```typescript
{
  name: "jira_get_user_profile",
  description: "Retrieve profile information for a specific Jira user",
  inputSchema: {
    type: "object",
    properties: {
      userIdentifier: {
        type: "string",
        description: "User identifier (email address, username, account ID, or key for Server/DC)"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include in user profile",
        default: ["displayName", "emailAddress", "active", "timeZone"]
      }
    },
    required: ["userIdentifier"]
  }
}
```

### Agile Related Tools (4 tools)

#### 11. `jira_get_agile_boards`
Get Jira agile boards with field selection.

```typescript
{
  name: "jira_get_agile_boards",
  description: "Get jira agile boards by name, project key, or type",
  inputSchema: {
    type: "object",
    properties: {
      boardName: {
        type: "string",
        description: "(Optional) The name of board, supports fuzzy search"
      },
      projectKey: {
        type: "string",
        description: "(Optional) Jira project key (e.g., 'PROJ')"
      },
      boardType: {
        type: "string",
        description: "(Optional) The type of jira board (e.g., 'scrum', 'kanban')"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include for each board",
        default: ["id", "name", "type", "location.projectKey"]
      },
      startAt: {
        type: "number",
        description: "Starting index for pagination (0-based)",
        default: 0,
        minimum: 0
      },
      limit: {
        type: "number",
        description: "Maximum number of results (1-50)",
        default: 10,
        minimum: 1,
        maximum: 50
      }
    }
  }
}
```

#### 12. `jira_get_board_issues`
Get all issues linked to a specific board with field selection.

```typescript
{
  name: "jira_get_board_issues",
  description: "Get all issues linked to a specific board filtered by JQL",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "The id of the board (e.g., '1001')"
      },
      jql: {
        type: "string",
        description: "JQL query string to filter issues"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include in results",
        default: ["summary", "status", "assignee.displayName", "priority"]
      },
      startAt: {
        type: "number",
        description: "Starting index for pagination (0-based)",
        default: 0,
        minimum: 0
      },
      limit: {
        type: "number",
        description: "Maximum number of results (1-50)",
        default: 10,
        minimum: 1,
        maximum: 50
      }
    },
    required: ["boardId", "jql"]
  }
}
```

#### 13. `jira_get_sprints_from_board`
Get sprints from a board with field selection.

```typescript
{
  name: "jira_get_sprints_from_board",
  description: "Get jira sprints from board by state",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "The id of board (e.g., '1000')"
      },
      state: {
        type: "string",
        description: "Sprint state (e.g., 'active', 'future', 'closed')"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include for each sprint",
        default: ["id", "name", "state", "startDate", "endDate", "goal"]
      },
      startAt: {
        type: "number",
        description: "Starting index for pagination (0-based)",
        default: 0,
        minimum: 0
      },
      limit: {
        type: "number",
        description: "Maximum number of results (1-50)",
        default: 10,
        minimum: 1,
        maximum: 50
      }
    },
    required: ["boardId"]
  }
}
```

#### 14. `jira_get_sprint_issues`
Get issues from a specific sprint with field selection.

```typescript
{
  name: "jira_get_sprint_issues",
  description: "Get jira issues from sprint",
  inputSchema: {
    type: "object",
    properties: {
      sprintId: {
        type: "string",
        description: "The id of sprint (e.g., '10001')"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Optional fields to include in results",
        default: ["summary", "status", "assignee.displayName", "priority"]
      },
      startAt: {
        type: "number",
        description: "Starting index for pagination (0-based)",
        default: 0,
        minimum: 0
      },
      limit: {
        type: "number",
        description: "Maximum number of results (1-50)",
        default: 10,
        minimum: 1,
        maximum: 50
      }
    },
    required: ["sprintId"]
  }
}
```

### Link Related Tools (1 tool)

#### 15. `jira_get_link_types`
Get all available issue link types.

```typescript
{
  name: "jira_get_link_types",
  description: "Get all available issue link types",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

## 📋 MCP Resources Specification

### Field Definition Resources

#### Issue Fields Resource
**URI**: `jira://fields/issue`

Provides available field definitions for Jira issues, including basic fields, nested fields, and custom fields.

```json
{
  "summary": { "type": "string", "description": "Issue title" },
  "status": { "type": "object", "description": "Issue status" },
  "description": { "type": "string", "description": "Issue description" },
  "assignee.displayName": { "type": "string", "description": "Assignee name" },
  "assignee.emailAddress": { "type": "string", "description": "Assignee email" },
  "reporter.displayName": { "type": "string", "description": "Reporter name" },
  "status.name": { "type": "string", "description": "Status name" },
  "status.category.name": { "type": "string", "description": "Status category" },
  "priority.name": { "type": "string", "description": "Priority name" },
  "issuetype.name": { "type": "string", "description": "Issue type name" },
  "customfield_10008": { "type": "string", "description": "Epic Link" },
  "customfield_10009": { "type": "number", "description": "Story Points" }
}
```

#### Project Fields Resource
**URI**: `jira://fields/project`

```json
{
  "key": { "type": "string", "description": "Project key" },
  "name": { "type": "string", "description": "Project name" },
  "projectTypeKey": { "type": "string", "description": "Project type" },
  "lead.displayName": { "type": "string", "description": "Project lead name" },
  "lead.emailAddress": { "type": "string", "description": "Project lead email" },
  "description": { "type": "string", "description": "Project description" }
}
```

#### User Fields Resource
**URI**: `jira://fields/user`

```json
{
  "displayName": { "type": "string", "description": "User display name" },
  "emailAddress": { "type": "string", "description": "User email address" },
  "active": { "type": "boolean", "description": "User active status" },
  "timeZone": { "type": "string", "description": "User timezone" },
  "avatarUrls.48x48": { "type": "string", "description": "User avatar URL" }
}
```

#### Board Fields Resource
**URI**: `jira://fields/board`

```json
{
  "id": { "type": "number", "description": "Board ID" },
  "name": { "type": "string", "description": "Board name" },
  "type": { "type": "string", "description": "Board type (scrum/kanban)" },
  "location.projectKey": { "type": "string", "description": "Associated project key" },
  "location.name": { "type": "string", "description": "Associated project name" }
}
```

#### Sprint Fields Resource
**URI**: `jira://fields/sprint`

```json
{
  "id": { "type": "number", "description": "Sprint ID" },
  "name": { "type": "string", "description": "Sprint name" },
  "state": { "type": "string", "description": "Sprint state (active/future/closed)" },
  "startDate": { "type": "string", "description": "Sprint start date" },
  "endDate": { "type": "string", "description": "Sprint end date" },
  "goal": { "type": "string", "description": "Sprint goal" }
}
```

#### Worklog Fields Resource
**URI**: `jira://fields/worklog`

```json
{
  "author.displayName": { "type": "string", "description": "Worklog author name" },
  "timeSpent": { "type": "string", "description": "Time spent" },
  "timeSpentSeconds": { "type": "number", "description": "Time spent in seconds" },
  "comment": { "type": "string", "description": "Worklog comment" },
  "created": { "type": "string", "description": "Creation date" },
  "started": { "type": "string", "description": "Work start date" }
}
```

#### Custom Fields Resource
**URI**: `jira://fields/custom`

Provides definitions for commonly used custom fields in Jira Server/DC environments.

```json
{
  "customfield_10008": { "type": "string", "description": "Epic Link" },
  "customfield_10009": { "type": "number", "description": "Story Points" },
  "customfield_10010": { "type": "string", "description": "Epic Name" },
  "customfield_10011": { "type": "string", "description": "Epic Status" },
  "customfield_10012": { "type": "array", "description": "Sprint" }
}
```

## 🔧 Field Filtering Implementation

### Core Filtering Function
```typescript
function filterFieldsWithDotNotation(data: any, requestedFields: string[]): any {
  const result: any = {};
  
  for (const field of requestedFields) {
    if (field.includes('.')) {
      // Handle nested fields like assignee.displayName
      const parts = field.split('.');
      let current = data;
      let resultCurrent = result;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) break;
        
        if (!resultCurrent[part]) {
          resultCurrent[part] = {};
        }
        current = current[part];
        resultCurrent = resultCurrent[part];
      }
      
      const finalPart = parts[parts.length - 1];
      if (current && current[finalPart] !== undefined) {
        resultCurrent[finalPart] = current[finalPart];
      }
    } else {
      // Handle top-level fields
      if (data[field] !== undefined) {
        result[field] = data[field];
      }
    }
  }
  
  return result;
}
```

### Jira API Field Extraction
```typescript
function extractJiraFields(requestedFields: string[]): string[] {
  const jiraFields = new Set<string>();
  
  for (const field of requestedFields) {
    if (field.includes('.')) {
      // For nested fields, request the parent field from Jira API
      jiraFields.add(field.split('.')[0]);
    } else {
      jiraFields.add(field);
    }
  }
  
  return Array.from(jiraFields);
}
```

## 🔗 Related Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - Technical implementation details
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Development timeline and phases
- [Project Structure](./PROJECT_STRUCTURE.md) - Directory layout and organization