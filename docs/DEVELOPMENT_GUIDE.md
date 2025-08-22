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

#### MCP Tool Definition Example
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const getIssueTool: Tool = {
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
        type: "string",
        description: "Comma-separated list of fields to return",
        default: "summary,status,assignee,reporter,created,updated"
      }
    },
    required: ["issueKey"]
  }
};
```

## 🎯 MCP Implementation Strategy (Field-Selectable Tools + Field Definition Resources)

### MCP Resources (Field Definitions) - **Auxiliary Feature**
**Provide field metadata so clients know which fields are available for selection**

#### Field Definition Resources
- `jira://fields/issue` - Available issue field definitions
- `jira://fields/project` - Available project field definitions  
- `jira://fields/user` - Available user field definitions
- `jira://fields/board` - Available board field definitions
- `jira://fields/sprint` - Available sprint field definitions
- `jira://fields/worklog` - Available worklog field definitions
- `jira://fields/custom` - Custom field definitions

### MCP Tools (Field Selection Support) - **Main Feature**

#### Issue Related Tools (4)
- `jira_get_issue` - Get issue details + **field selection**
- `jira_get_transitions` - Get status transitions
- `jira_get_worklog` - Get worklogs + **field selection**
- `jira_download_attachments` - Download attachments

#### Search Related Tools (3)
- `jira_search` - JQL search issues + **field selection**
- `jira_search_fields` - Field search
- `jira_get_project_issues` - Project issue search + **field selection**

#### Project Related Tools (2)
- `jira_get_all_projects` - Get all projects + **field selection**
- `jira_get_project_versions` - Get project versions

#### User Related Tools (1)
- `jira_get_user_profile` - Get user profile + **field selection**

#### Agile Related Tools (4)
- `jira_get_agile_boards` - Get boards + **field selection**
- `jira_get_board_issues` - Get board issues + **field selection**
- `jira_get_sprints_from_board` - Get sprints + **field selection**
- `jira_get_sprint_issues` - Get sprint issues + **field selection**

#### Link Related Tools (1)
- `jira_get_link_types` - Get link types

## 🔧 Field Selection Implementation Details

### MCP Resources - Field Definition Provider
```typescript
// Field definition resource
async function readResource(uri: string): Promise<ResourceContent> {
  if (uri === "jira://fields/issue") {
    return {
      contents: [{
        type: "text",
        text: JSON.stringify({
          // Basic fields
          summary: { type: "string", description: "Issue title" },
          status: { type: "object", description: "Issue status" },
          description: { type: "string", description: "Issue description" },
          
          // Nested fields (supports . syntax)
          "assignee.displayName": { type: "string", description: "Assignee name" },
          "assignee.email": { type: "string", description: "Assignee email" },
          "reporter.displayName": { type: "string", description: "Reporter name" },
          "status.name": { type: "string", description: "Status name" },
          "status.category.name": { type: "string", description: "Status category" },
          
          // Custom fields
          "customfield_10008": { type: "string", description: "Epic Link" },
          "customfield_10009": { type: "number", description: "Story Points" }
        }, null, 2)
      }]
    };
  }
  // ...other field definitions
}
```

### MCP Tools - Field Selection Support
```typescript
// Enhanced Tool definition
export const jiraGetIssueTool: Tool = {
  name: "jira_get_issue",
  description: "Get Jira issue with optional field selection",
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
};

// Tool handler function
async function handleGetIssue(args: any): Promise<string> {
  const { issueKey, fields } = args;
  
  // 1. Call Jira API (request all needed fields)
  const jiraFields = extractJiraFields(fields);
  const issue = await jiraClient.getIssue(issueKey, { fields: jiraFields.join(',') });
  
  // 2. Filter results based on field selection (supports nested fields)
  const filteredIssue = filterFieldsWithDotNotation(issue, fields);
  
  return JSON.stringify(filteredIssue, null, 2);
}
```

### Nested Field Filtering Implementation
```typescript
function filterFieldsWithDotNotation(data: any, requestedFields: string[]): any {
  const result: any = {};
  
  for (const field of requestedFields) {
    if (field.includes('.')) {
      // Handle nested fields assignee.displayName
      const [parent, child] = field.split('.', 2);
      if (data[parent] && data[parent][child] !== undefined) {
        if (!result[parent]) result[parent] = {};
        result[parent][child] = data[parent][child];
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

function extractJiraFields(requestedFields: string[]): string[] {
  // Extract Jira API required fields from nested fields
  const jiraFields = new Set<string>();
  
  for (const field of requestedFields) {
    if (field.includes('.')) {
      // assignee.displayName -> assignee
      jiraFields.add(field.split('.')[0]);
    } else {
      jiraFields.add(field);
    }
  }
  
  return Array.from(jiraFields);
}
```

## 🔐 Authentication Configuration

### Simplified Authentication Configuration
```typescript
interface AuthConfig {
  personalToken: string;  // PAT support only
}

// HTTP request headers
headers: {
  'Authorization': `Bearer ${config.personalToken}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

## 🌍 Server/DC Specific Handling

- **User Identifiers**: Use `name`/`key` instead of `accountId`
- **Custom Fields**: Epic field is typically `customfield_10008`
- **API Endpoints**: Mainly use REST API v2, some v3 features
- **SSL Verification**: Support self-signed certificate configuration

## 🌍 Environment Variable Configuration

```bash
# Required configuration
JIRA_URL=https://jira.company.com
JIRA_PERSONAL_TOKEN=your_pat_token

# Optional configuration
JIRA_SSL_VERIFY=false                    # Self-signed certificate support
JIRA_PROJECTS_FILTER=PROJ1,PROJ2,PROJ3   # Project filter
JIRA_TIMEOUT=30000                       # Request timeout(ms)
```

## 🛠️ Development Environment Setup

### Prerequisites
- Node.js 18+
- TypeScript 5.3+
- Jest for testing
- ESLint + Prettier for code quality

### Installation
```bash
# Install dependencies
npm install

# Install development tools
npm install -D typescript @types/node jest @types/jest eslint prettier

# Setup pre-commit hooks
npm install -D husky lint-staged
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

## 📦 Module Organization

The project follows TypeScript best practices with clear separation of concerns:

- **`config/`** - Configuration management and validation
- **`lib/client/`** - HTTP client and authentication layer
- **`lib/jira/`** - Jira API wrapper and business logic
- **`lib/models/`** - Data models and type definitions
- **`lib/utils/`** - Utility functions and helpers
- **`resources/`** - MCP resource handlers
- **`tools/`** - MCP tool definitions and handlers
- **`types/`** - TypeScript type definitions

See [Project Structure](./PROJECT_STRUCTURE.md) for detailed directory layout.

## 👥 Team Assignment & AI Development Strategy

### AI Engineer Roles & Responsibilities (2-Engineer Team)

#### AI Engineer 1 (Foundation & API Specialist)
- **Primary Tools**: Claude Code
- **Git Branch**: `feature/foundation-api`
- **Task Domains**: ARCH-* + API-* tasks (9 tasks total)
- **Responsibilities**:
  - **ARCH-CORE-001**: ✅ Project Skeleton Setup
  - **ARCH-CORE-002**: ✅ Type System Foundation  
  - **ARCH-CORE-003**: ⏸️ Configuration System
  - **ARCH-UTIL-001**: ⏸️ HTTP Client Infrastructure
  - **ARCH-UTIL-002**: ⏸️ Logging and Utilities
  - **API-CORE-001**: ⏸️ Data Models
  - **API-CORE-002**: ⏸️ Core Jira Operations
  - **API-CORE-003**: ⏸️ Agile Operations
  - **API-UTIL-001**: ⏸️ Field Processing Engine
- **Specialization**: Project foundation, type systems, configuration management, HTTP client infrastructure, Jira Server API integration, data models, field processing engine

#### AI Engineer 2 (MCP & Integration Specialist)
- **Primary Tools**: Claude Code
- **Git Branch**: `feature/mcp-integration`
- **Task Domains**: MCP-* + TEST-* + INTG-* tasks (11 tasks total)
- **Responsibilities**:
  - **MCP-CORE-001**: ⏸️ Tools Framework
  - **MCP-TOOL-001**: ⏸️ Issue Management Tools  
  - **MCP-TOOL-002**: ⏸️ Search Tools
  - **MCP-TOOL-003**: ⏸️ Project and User Tools
  - **MCP-TOOL-004**: ⏸️ Agile Tools
  - **MCP-RES-001**: ⏸️ Resources Framework
  - **MCP-RES-002**: ⏸️ Field Definition Resources
  - **TEST-CORE-001**: ⏸️ Test Framework Setup
  - **TEST-CORE-002**: ⏸️ Unit Test Suite
  - **TEST-CORE-003**: ⏸️ Integration Test Suite
  - **INTG-CORE-001**: ⏸️ MCP Server Integration
  - **INTG-CORE-002**: ⏸️ End-to-End Validation
- **Specialization**: MCP tools implementation, MCP resources, field definitions, testing infrastructure, system integration, quality assurance

### 🔄 Task Execution Rules

#### Before Starting Any Task
1. **Dependency Verification**: Check that all dependency tasks are marked as ✅ DONE
2. **Status Update**: Update task status to 🔄 IN_PROGRESS in Implementation Plan
3. **Branch Management**: Ensure working on correct feature branch
4. **Context Review**: Read related API Design and Project Structure docs

#### During Task Execution
1. **Follow Conventions**: Use established code patterns from CLAUDE.md
2. **Incremental Development**: Commit frequently with descriptive messages  
3. **Testing First**: Write tests alongside implementation
4. **Documentation Updates**: Update relevant docs as you implement

#### Task Completion Criteria
1. **All Deliverables Complete**: Every item in "Key Deliverables" must be implemented
2. **Tests Passing**: Unit tests written and passing (where applicable)
3. **TypeScript Compilation**: No TypeScript errors
4. **Linting**: ESLint rules passing
5. **Status Update**: Mark task as ✅ DONE in Implementation Plan

#### Integration Ready Checklist
- All tasks in parallel group completed
- Feature branch tests passing
- No merge conflicts with develop branch
- Code review completed (if working with other AI engineers)

### 🤖 AI Development Behavior Guidelines

#### Development Process Flow
All AI development must follow this structured process to ensure quality and consistency:

```
1. PLANNING → 2. REVIEW → 3. TEST DESIGN → 4. REVIEW → 5. IMPLEMENTATION → 6. VALIDATION
```

#### Phase 1: Planning & Design
**Objective**: Create detailed implementation plan before writing any code

**Required Deliverables**:
- [ ] **Architecture Design**: Define interfaces, classes, and module structure
- [ ] **Implementation Approach**: Explain how the solution will work
- [ ] **Dependencies Analysis**: Identify required imports and external dependencies
- [ ] **Error Handling Strategy**: Define how errors will be caught and handled
- [ ] **Integration Points**: Identify how this integrates with existing code

**AI Prompt Template**:
```
I need to implement task [TASK-ID]: [TASK_DESCRIPTION]

Dependencies: [LIST_DEPENDENCIES]
Key Deliverables: [LIST_DELIVERABLES]

Phase 1 - Planning:
Please create a detailed implementation plan covering:
1. Architecture design (interfaces, classes, module structure)
2. Implementation approach and key algorithms
3. Dependencies and imports needed
4. Error handling strategy
5. Integration points with existing code
6. File structure and naming conventions

Do NOT write any implementation code yet. Focus only on the design and planning.
```

#### Phase 2: Design Review
**Objective**: Validate the plan before proceeding

**Review Checklist**:
- [ ] Architecture follows project conventions from CLAUDE.md
- [ ] All dependencies are available or planned
- [ ] Error handling is comprehensive
- [ ] Integration approach is sound
- [ ] File naming follows kebab-case convention
- [ ] TypeScript types are properly designed

**AI Prompt Template**:
```
Please review the implementation plan above against these criteria:
1. Does it follow the project conventions in CLAUDE.md?
2. Are all dependencies available in the current codebase?
3. Is the error handling comprehensive?
4. Does the integration approach make sense?
5. Are there any potential issues or improvements?

Please provide feedback and suggest any necessary revisions before proceeding.
```

#### Phase 3: Test Case Design
**Objective**: Define comprehensive test cases before implementation

**Required Test Types**:
- [ ] **Unit Tests**: Test individual functions and methods
- [ ] **Integration Tests**: Test interaction with Jira API (if applicable)
- [ ] **Error Cases**: Test error handling and edge cases
- [ ] **Validation Tests**: Test input validation and type checking
- [ ] **Performance Tests**: Test with realistic data volumes (if applicable)

**AI Prompt Template**:
```
Phase 3 - Test Case Design:
Based on the approved implementation plan, please design comprehensive test cases:

1. Unit Tests:
   - List all functions/methods that need testing
   - Define test scenarios for each function
   - Include edge cases and boundary conditions

2. Integration Tests (if applicable):
   - Define tests for Jira API integration
   - Mock strategies for external dependencies

3. Error Handling Tests:
   - Invalid inputs
   - Network failures
   - Authentication errors
   - Malformed responses

4. Test Data Requirements:
   - Mock data structures needed
   - Test fixtures required

Please provide detailed test descriptions but do NOT implement the tests yet.
```

#### Phase 4: Test Review
**Objective**: Ensure test coverage is comprehensive

**Review Checklist**:
- [ ] All public methods are tested
- [ ] Edge cases are covered
- [ ] Error scenarios are tested
- [ ] Mock strategies are appropriate
- [ ] Test data is realistic
- [ ] Tests align with implementation plan

**AI Prompt Template**:
```
Please review the test case design for completeness:
1. Are all public methods and functions covered?
2. Are edge cases and error scenarios adequately tested?
3. Is the mock strategy appropriate for external dependencies?
4. Are there any missing test scenarios?
5. Do the tests align with the implementation plan?

Provide feedback and suggest additional test cases if needed.
```

#### Phase 5: Implementation
**Objective**: Implement the solution following the approved plan

**Implementation Order**:
1. **Types & Interfaces**: Define TypeScript types first
2. **Core Logic**: Implement main functionality
3. **Error Handling**: Add comprehensive error handling
4. **Integration**: Connect with existing systems
5. **Tests**: Implement all planned test cases
6. **Documentation**: Add JSDoc comments

**AI Prompt Template**:
```
Phase 5 - Implementation:
Now implement the solution following the approved plan and test design.

Implementation order:
1. Create TypeScript types and interfaces
2. Implement core functionality
3. Add error handling
4. Add integration points
5. Write and run all test cases
6. Add JSDoc documentation

Requirements:
- Follow the exact plan from Phase 1
- Implement all test cases from Phase 3
- Use existing code patterns from the codebase
- Add comprehensive error handling
- Include detailed JSDoc comments
```

#### Phase 6: Validation & Quality Check
**Objective**: Ensure implementation meets all requirements

**Validation Checklist**:
- [ ] All planned deliverables are implemented
- [ ] All tests pass (>95% coverage target)
- [ ] TypeScript compilation succeeds
- [ ] ESLint rules pass
- [ ] JSDoc documentation is complete
- [ ] Integration with existing code works
- [ ] Error handling is functional
- [ ] Performance is acceptable

**AI Prompt Template**:
```
Phase 6 - Final Validation:
Please validate the implementation:

1. Run all tests and ensure they pass
2. Check TypeScript compilation
3. Run ESLint and fix any issues
4. Verify all deliverables from Phase 1 are complete
5. Test integration with existing code
6. Validate error handling works as designed
7. Check JSDoc documentation completeness

Only mark the task as DONE when all validation checks pass.
```

#### 🚫 Anti-Patterns (What NOT to Do)

**DO NOT**:
- Start coding without a detailed plan
- Skip the review phases
- Implement without test cases
- Write tests after implementation
- Ignore error handling until the end
- Skip documentation
- Mark tasks complete without validation

**Red Flags**:
- "Let me start implementing..." (without planning)
- "I'll add tests later..." (tests should be planned upfront)
- "This should work..." (needs validation)
- "Quick implementation..." (violates process)

#### 🔄 Process Enforcement

**Phase Gates**: Each phase must be completed and reviewed before proceeding to the next phase.

**Quality Gates**: Implementation cannot proceed without:
- ✅ Approved design plan
- ✅ Comprehensive test cases
- ✅ All reviews completed

**Rollback Triggers**: Return to earlier phase if:
- Implementation doesn't match plan
- Tests reveal design flaws
- Integration issues emerge
- Performance problems discovered

### 🎯 AI Prompting Guidelines

#### Task Initiation Prompts
```
I need to implement task [TASK-ID] from the Implementation Plan. 

Task: [TASK_DESCRIPTION]
Dependencies: [LIST_DEPENDENCIES] 
Deliverables: [LIST_DELIVERABLES]

Please help me:
1. Review the task requirements and dependencies
2. Check that all dependencies are completed  
3. Create a detailed implementation plan
4. Implement the solution following project conventions
5. Write appropriate tests
6. Update task status to completed
```

#### Implementation Patterns
```
Please implement this following these patterns:
- Use the existing code style from CLAUDE.md conventions
- Follow the type definitions in types/ directory
- Use the configuration system from config/ 
- Follow error handling patterns from existing modules
- Add comprehensive JSDoc documentation
- Include unit tests with high coverage
```

#### Quality Assurance Prompts
```
Before marking this task complete, please:
1. Run TypeScript compilation and fix any errors
2. Run ESLint and fix any issues  
3. Verify all unit tests pass
4. Check that all deliverables are implemented
5. Update the task status in IMPLEMENTATION_PLAN.md
6. Commit changes with descriptive message
```

### 🔀 Parallel Development Coordination

#### Branch Strategy (2-Engineer Team)
- **AI Engineer 1**: `feature/foundation-api` branch
- **AI Engineer 2**: `feature/mcp-integration` branch  
- Regular merges to `develop` branch when major milestones complete
- Final integration on `main` branch

#### 2-Engineer Coordination Protocol
- **Daily Status Updates**: Both engineers update task status in Implementation Plan
- **Dependency Handoffs**: AI Engineer 1 completes foundation tasks before AI Engineer 2 starts dependent MCP tasks
- **Shared Component Strategy**: Common types and utilities discussed before implementation
- **Integration Points**: Clear interfaces defined between foundation/API layer and MCP layer

#### Critical Handoff Points
1. **After ARCH-CORE-002** (Type System): AI Engineer 2 can start MCP-CORE-001, MCP-RES-001, TEST-CORE-001
2. **After ARCH-CORE-003** (Configuration): Both engineers can work in parallel on their respective domains
3. **After API-CORE-002** (Core Jira Operations): AI Engineer 2 can start all MCP-TOOL-* implementations
4. **After API-CORE-003** (Agile Operations): AI Engineer 2 can complete MCP-TOOL-004

#### Conflict Resolution (2-Engineer)
- **Types & Interfaces**: AI Engineer 1 owns `types/` directory, AI Engineer 2 requests additions
- **Common Utilities**: Coordinate through shared documentation before implementation
- **API Contracts**: AI Engineer 1 defines interfaces, AI Engineer 2 implements MCP tools against them
- **Testing Strategy**: AI Engineer 2 writes tests for AI Engineer 1's components

### 推荐工具：使用 Git Worktree 进行并行开发

为了让多名工程师（或AI）在同一台机器上高效协作且互不干扰，我们强烈推荐使用 `git worktree`。该工具允许你从单个 Git 仓库中检出多个工作目录，每个目录关联一个独立的分支。

**核心优势**:
- **物理隔离**: 每个开发者在自己的目录中工作，完全隔离了文件、依赖 (`node_modules`) 和构建产物。
- **无需切换分支**: 无需在同一个目录中频繁使用 `git checkout`，极大地提升了效率。
- **共享历史**: 所有 worktree 共享底层的 Git 历史记录，合并代码非常方便。

**操作指南**:

假设项目主目录位于 `jira-mcp-server`，并且你想为两位工程师（AI Engineer 1, AI Engineer 2）创建独立的开发环境。

1.  **为 AI Engineer 1 创建 Worktree**:
    在主项目录 (`jira-mcp-server`) 的终端中运行：
    ```bash
    # 这会创建一个名为 `feature/ai-1` 的新分支，并检出到 `../jira-mcp-server-ai1` 目录
    git worktree add -b feature/ai-1 ../jira-mcp-server-ai1
    ```
    AI Engineer 1 现在应该只在 `../jira-mcp-server-ai1` 目录中工作。

2.  **为 AI Engineer 2 创建 Worktree**:
    同样，在主项目录中运行：
    ```bash
    git worktree add -b feature/ai-2 ../jira-mcp-server-ai2
    ```
    AI Engineer 2 现在应该只在 `../jira-mcp-server-ai2` 目录中工作。

3.  **管理 Worktrees**:
    - 查看所有 worktree: `git worktree list`
    - 当一个功能分支合并后，可以安全地移除其 worktree: `git worktree remove <path-to-worktree>`

通过这种方式，两个开发流程可以完全独立地进行，直到需要将各自的功能分支合并到主开发分支（如 `develop` 或 `main`）时为止。

## 🔗 Related Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Task list and parallel execution groups
- [API Design](./API_DESIGN.md) - MCP tools and resources specifications
- [Project Structure](./PROJECT_STRUCTURE.md) - Directory layout and organization
