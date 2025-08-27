# Hybrid Dynamic Fields Implementation Plan

## Overview

This document provides a detailed, phased implementation plan for the hybrid dynamic fields architecture in Jira MCP Server. The plan aims to significantly enhance AI assistant interaction capabilities with Jira through powerful field definition and discovery mechanisms.

The core approach adopts a **hybrid static-dynamic field architecture** that combines the high performance and accuracy of statically predefined system fields with the flexibility and real-time nature of dynamically discovered custom fields.

## Development Methodology

### TDD Approach with Agent Collaboration

**Agent Roles**:
- **typescript-pro**: Primary developer - writes tests and implementations
- **code-reviewer-simple**: Quality assurance - performs code reviews and provides feedback

**TDD Workflow for Each Task**:
1. **Red**: typescript-pro writes failing tests
2. **Green**: typescript-pro implements minimal code to pass tests
3. **Review**: code-reviewer-simple reviews implementation
4. **Fix**: typescript-pro addresses review feedback
5. **Refactor**: typescript-pro optimizes and refines code
6. **Repeat**: Steps 3-5 until review passes

**Quality Standards**:
- Test coverage ≥ 80%
- All TypeScript type checking passes
- ESLint compliance
- Code review approval
- Integration tests pass

---

## Prerequisites

1. **Environment Setup**: Ensure `.env` file is configured and can successfully connect to your Jira Server instance
2. **Dependencies**: Run `npm install` to ensure all dependencies are installed
3. **Sample Issues**: Identify 1-2 representative issue keys with rich fields (e.g., `DSCWA-428`，`DSCWA-373`) for analysis
4. **Testing Setup**: Verify Jest configuration and test environment

---

## Phase 0: Universal Fields Parameter Support (Foundation)

**Goal**: Add consistent fields parameter support across all MCP tools for optimal performance and user experience

**Priority**: **HIGHEST** - Foundation for all other phases

**Duration**: 2-3 days

| Task ID | Task | Key Files | Deliverable | TDD Priority |
|---------|------|-----------|-------------|-------------|
| **Task-0.1** | **Tool Definition Analysis & Planning** | `docs/FIELDS_SUPPORT_ANALYSIS.md`<br>`tests/unit/tools/fields-support-analysis.test.ts` | Complete analysis report of current vs required fields support across all 19 tools | Documentation-First |
| **Task-0.2** | **Client-Side Field Filtering Utility** | `src/utils/field-filter.ts`<br>`tests/unit/utils/field-filter.test.ts` | Generic field filtering utility for APIs that don't support native fields parameter | TDD Implementation |
| **Task-0.3** | **Tool Definition Updates (Phase 1)** | `src/server/tools/project-tools.ts`<br>`src/server/tools/user-tools.ts`<br>`src/server/tools/agile-tools.ts`<br>`src/server/tools/system-tools.ts`<br>`tests/unit/tools/fields-parameter.test.ts` | Add fields parameter to tool definitions for getAllProjects, getProject, getCurrentUser, getUserProfile, getAgileBoards, getSprint, getSprintsFromBoard | Test-First |
| **Task-0.4** | **JiraClientWrapper Enhancement** | `src/client/jira-client-wrapper.ts`<br>`tests/unit/client/fields-support.test.ts` | Add fields parameter support to wrapper methods where Jira API supports it | TDD Enhancement |
| **Task-0.5** | **Tool Handler Implementation** | `src/server/handlers/tool-handler.ts`<br>`tests/unit/handlers/fields-processing.test.ts` | Implement fields parameter processing in tool handlers with client-side filtering fallback | Integration TDD |
| **Task-0.6** | **Enhanced Tool Descriptions** | `src/server/tools/project-tools.ts`<br>`src/server/tools/user-tools.ts`<br>`src/server/tools/agile-tools.ts`<br>`src/server/tools/system-tools.ts` | Update all tool descriptions to reference correct field resources and explain fields parameter usage | Documentation Update |

### Task Implementation Details

#### Task-0.1: Tool Definition Analysis & Planning

**Create comprehensive analysis document**:

```markdown
# Fields Parameter Support Analysis

## Current State Summary
- ✅ **5 tools** with fields support: getIssue, searchIssues, getProjectIssues, getBoardIssues, getSprintIssues
- ❌ **14 tools** without fields support: Need implementation

## Implementation Categories

### Category A: Native API Support (Implement immediately)
| Tool | JiraClient Method | API Fields Support | Action |
|------|------------------|-------------------|--------|
| `downloadAttachments` | `findIssue(key, '', 'attachment')` | ✅ Already optimized | No action needed |

### Category B: No API Support - Client-Side Filtering Required
| Tool | JiraClient Method | Implementation Strategy |
|------|------------------|------------------------|
| `getAllProjects` | `listProjects()` | Client-side filtering |
| `getProject` | `getProject(key)` | Client-side filtering |
| `getProjectVersions` | `getVersions(projectKey)` | Client-side filtering |
| `getCurrentUser` | `getCurrentUser()` | Client-side filtering |
| `getUserProfile` | `searchUsers({...})` | Client-side filtering |
| `getAgileBoards` | `getAllBoards()` | Client-side filtering |
| `getSprintsFromBoard` | `getAllSprints(boardId)` | Client-side filtering |
| `getSprint` | `getSprint(sprintId)` | Client-side filtering |
| `getIssueTransitions` | `listTransitions(issueKey)` | Client-side filtering |
| `getIssueWorklogs` | `getIssueWorklogs(issueKey)` | Client-side filtering |
| `searchFields` | `listFields()` | Client-side filtering |
| `getSystemInfo` | `getServerInfo()` | Client-side filtering |
| `getServerInfo` | `getServerInfo()` | Client-side filtering |

## Implementation Priority
1. **High**: User-facing data tools (projects, users, agile)
2. **Medium**: System information tools
3. **Low**: Meta tools (transitions, worklogs, fields)
```

#### Task-0.2: Client-Side Field Filtering Utility

**TDD Implementation**:

```typescript
// src/utils/field-filter.ts
export interface FieldFilterOptions {
  entityType: 'issue' | 'project' | 'user' | 'agile' | 'system';
  respectNesting?: boolean;
  logFiltering?: boolean;
}

export class FieldFilter {
  /**
   * Filter response fields based on requested field paths
   */
  static filterFields(
    response: any,
    requestedFields: string[],
    options: FieldFilterOptions
  ): any {
    if (!requestedFields || requestedFields.length === 0) {
      return response;
    }

    if (options.logFiltering) {
      console.log(`Client-side filtering applied for ${options.entityType}:`, requestedFields);
    }

    return this.applyFieldFiltering(response, requestedFields, options.respectNesting);
  }

  /**
   * Apply nested field filtering with dot-notation support
   */
  private static applyFieldFiltering(
    obj: any,
    fields: string[],
    respectNesting: boolean = true
  ): any {
    if (!obj || typeof obj !== 'object') return obj;

    const result: any = {};
    
    for (const field of fields) {
      const value = this.extractFieldValue(obj, field);
      if (value !== undefined) {
        this.setNestedValue(result, field, value);
      }
    }

    return result;
  }

  /**
   * Extract field value using dot notation
   */
  private static extractFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in result object
   */
  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }
}
```

#### Task-0.3: Tool Definition Updates

**Add fields parameter to ALL tools without it**:

```typescript
// Example: Update getAllProjects tool definition
export function getAllProjectsToolDefinition() {
  return {
    name: 'getAllProjects',
    description: 'Get all projects from Jira with optional filtering for archived projects. Enhanced field access available via jira://project/fields resource.',
    inputSchema: {
      type: 'object',
      properties: {
        includeArchived: {
          type: 'boolean',
          description: 'Whether to include archived projects (default: true). Set to false to exclude archived projects.',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Optional field selection with nested access support.

📋 Complete field reference: jira://project/fields

🔥 Enhanced capabilities:
• Project fields: Full nested structure support (project.name, project.lead.displayName)
• Client-side filtering: Efficient response filtering for performance
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["name", "key", "projectCategory.name"]
• Detailed: ["name", "key", "lead.displayName", "description"]
• Custom: ["name", "projectTypeKey", "components[].name"]

⚠️ Note: Uses client-side filtering (API doesn't support native fields parameter)`
        }
      },
    },
  };
}
```

#### Task-0.4: JiraClientWrapper Enhancement

**Add fields support where possible**:

```typescript
// Example enhancement for getProject method
async getProject(projectKey: string, fields?: string[]): Promise<JiraProject> {
  try {
    logger.log(`Getting project details: ${projectKey}`, { fields });

    const response = await this.client.getProject(projectKey);
    // Note: Jira API doesn't support fields parameter for getProject
    // Fields filtering will be handled by tool handler using FieldFilter

    if (!response) {
      logger.error(`No project information received for: ${projectKey}`);
      throw new ApiError(`Project not found: ${projectKey}`, 404);
    }

    const project = response as JiraProject;
    // ... validation logic ...

    return project;
  } catch (error) {
    logger.error(`Failed to get project ${projectKey}:`, error);
    throw ApiError.fromJiraClientError(error);
  }
}
```

#### Task-0.5: Tool Handler Implementation

**Implement in tool handlers**:

```typescript
// Example: Update tool handler for getProject
async handleGetProject(args: GetProjectArgs): Promise<CallToolResult> {
  try {
    const project = await this.jiraClient.getProject(args.projectKey);
    
    // Apply client-side field filtering if fields specified
    let responseData = project;
    if (args.fields && args.fields.length > 0) {
      responseData = FieldFilter.filterFields(project, args.fields, {
        entityType: 'project',
        respectNesting: true,
        logFiltering: true
      });
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(responseData, null, 2),
        mimeType: "application/json"
      }]
    };
  } catch (error) {
    throw error;
  }
}
```

### Benefits of Phase 0

1. **Immediate User Value**: Consistent fields parameter across all 19 tools
2. **Performance Optimization**: Reduced data transfer where supported by API
3. **Foundation for Future Phases**: Provides base infrastructure for dynamic field support
4. **Better Resource Integration**: Proper mapping to field definition resources
5. **Enhanced User Experience**: Consistent interface and better performance

---

## Phase 1: Static Core Implementation (MVP)

**Goal**: Quickly deploy complete nested path support for most commonly used system fields (status, assignee, project, etc.)

**Duration**: 3-5 days

| Task ID | Task | Key Files | Deliverable | TDD Priority |
|---------|------|-----------|-------------|-------------|
| **Task-1** | **Field Definition Generation Script** | `scripts/generate-field-definitions.ts`<br>`tests/scripts/generate-definitions.test.ts` | Script to connect to Jira, fetch complete issue data, and save as JSON | Red-Green-Refactor |
| **Task-2** | **Static Definition Files & Types** | `src/types/field-definition.ts`<br>`src/server/resources/static-definitions/issue-fields.ts`<br>`tests/unit/types/field-definition.test.ts` | Type definitions and static field definitions for core fields | Test-First |
| **Task-3** | **Basic Resource Handler** | `src/server/resources/resource-handler.ts`<br>`tests/unit/server/resources/resource-handler.test.ts` | `JiraResourceHandler` class handling ListResources and ReadResource requests | TDD |
| **Task-4** | **MCP Server Integration** | `src/server/jira-mcp-server.ts`<br>`tests/integration/mcp-server-resources.test.ts` | Integrate resource handler into main MCP server | Integration Tests |
| **Task-5** | **Enhanced Tool Descriptions** | `src/server/tools/issue-tools.ts`<br>`tests/unit/tools/enhanced-descriptions.test.ts` | Update tool descriptions with field selection guidance | Test Coverage |
| **Task-6** | **Basic Field Validation** | `src/server/handlers/tool-handler.ts`<br>`tests/unit/handlers/field-validation.test.ts` | Implement field path validation in tool handlers | TDD Implementation |

### Task Implementation Details

#### Task-1 & Task-2: Field Definition Generation (TDD)

**TDD Workflow**:
1. **typescript-pro**: Write test for script functionality
2. **typescript-pro**: Implement script to connect to Jira and extract issue data
3. **code-reviewer-simple**: Review script implementation for error handling and maintainability
4. **typescript-pro**: Address review feedback and refine implementation

**Field Definition Generation Script**:

```typescript
// scripts/generate-field-definitions.ts
import { JiraClientWrapper } from '../src/client/jira-client-wrapper.js';
import { config } from '../src/utils/config.js';
import * as fs from 'fs/promises';

/**
 * Generate sample issue data for field structure analysis
 */
async function getSampleIssue(): Promise<void> {
  const client = new JiraClientWrapper(config);
  const issueKey = 'DSCWA-373'; // Use your representative issue
  
  try {
    const issue = await client.getIssue(issueKey);
    await fs.writeFile('sample-issue.json', JSON.stringify(issue, null, 2));
    console.log('Sample issue saved to sample-issue.json');
    
    // Generate field statistics
    const fieldCount = Object.keys(issue.fields).length;
    const customFields = Object.keys(issue.fields).filter(key => key.startsWith('customfield_'));
    
    console.log(`Total fields: ${fieldCount}`);
    console.log(`Custom fields: ${customFields.length}`);
    console.log(`System fields: ${fieldCount - customFields.length}`);
  } catch (error) {
    console.error('Error generating sample issue:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  getSampleIssue();
}
```

**Static Field Definitions**:

```typescript
// src/server/resources/static-definitions/issue-fields.ts
import { ResourceDefinition } from '../../types/field-definition.js';

export const ISSUE_FIELD_DEFINITIONS: ResourceDefinition = {
  uri: "jira://issue/fields",
  entityType: "issue",
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
  totalFields: 42, // System fields count
  
  fields: {
    "status": {
      id: "status",
      name: "Status",
      description: "Current issue status and its category",
      type: "object",
      accessPaths: [
        { path: "status.name", description: "Status name", type: "string", frequency: "high" },
        { path: "status.statusCategory.key", description: "Status category (todo/progress/done)", type: "string", frequency: "high" },
        { path: "status.statusCategory.name", description: "Status category name", type: "string", frequency: "medium" }
      ],
      examples: ["status.name", "status.statusCategory.key"],
      commonUsage: [
        ["status.name", "status.statusCategory.key"]
      ]
    },
    "assignee": {
      id: "assignee",
      name: "Assignee",
      description: "Issue assignee user information",
      type: "object",
      accessPaths: [
        { path: "assignee.displayName", description: "User display name", type: "string", frequency: "high" },
        { path: "assignee.emailAddress", description: "User email address", type: "string", frequency: "high" },
        { path: "assignee.active", description: "User active status", type: "boolean", frequency: "medium" }
      ],
      examples: ["assignee.displayName", "assignee.emailAddress"],
      commonUsage: [
        ["assignee.displayName", "assignee.emailAddress"]
      ]
    }
    // Additional core system fields...
  },
  
  pathIndex: {
    "status.name": "status",
    "status.statusCategory.key": "status",
    "assignee.displayName": "assignee",
    "assignee.emailAddress": "assignee"
    // Additional path mappings...
  }
};
```

#### Task-3: Resource Handler Implementation (TDD)

**TDD Workflow**:
1. **typescript-pro**: Write comprehensive tests for resource handler
2. **typescript-pro**: Implement handler with static definitions
3. **code-reviewer-simple**: Review handler logic and error handling
4. **typescript-pro**: Address review feedback

```typescript
// src/server/resources/resource-handler.ts
import { ISSUE_FIELD_DEFINITIONS } from './static-definitions/issue-fields.js';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';

export class JiraResourceHandler {
  private static readonly DEFINITIONS = {
    "jira://issue/fields": ISSUE_FIELD_DEFINITIONS,
  };

  /**
   * List all available resources
   */
  async listResources(): Promise<{ resources: Resource[] }> {
    const resources: Resource[] = [
      {
        uri: "jira://issue/fields",
        name: "Jira Issue Fields",
        description: "Complete field definitions for Jira issues with nested access paths",
        mimeType: "application/json"
      }
    ];
    
    return { resources };
  }

  /**
   * Read specific resource content
   */
  async readResource(uri: string): Promise<{ contents: any[] }> {
    const definition = JiraResourceHandler.DEFINITIONS[uri];
    
    if (!definition) {
      throw new Error(`Resource not found: ${uri}`);
    }
    
    return {
      contents: [{
        type: "text",
        text: JSON.stringify(definition, null, 2),
        mimeType: "application/json"
      }]
    };
  }

  /**
   * Validate field paths against resource definitions
   */
  validateFieldPaths(entityType: string, paths: string[]): ValidationResult {
    const resourceUri = `jira://${entityType}/fields`;
    const definition = JiraResourceHandler.DEFINITIONS[resourceUri];
    
    if (!definition) {
      return { valid: false, errors: [`Unknown entity type: ${entityType}`] };
    }
    
    const errors: string[] = [];
    const validPaths: string[] = [];
    
    for (const path of paths) {
      if (this.isValidFieldPath(path, definition)) {
        validPaths.push(path);
      } else {
        errors.push(`Invalid field path: ${path}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      validPaths,
      errors
    };
  }

  private isValidFieldPath(path: string, definition: any): boolean {
    // Check path index
    if (definition.pathIndex && definition.pathIndex[path]) {
      return true;
    }
    
    // Check base field name
    if (definition.fields && definition.fields[path]) {
      return true;
    }
    
    // Check custom field pattern
    if (path.startsWith('customfield_')) {
      return true;
    }
    
    return false;
  }
}

interface ValidationResult {
  valid: boolean;
  validPaths: string[];
  errors: string[];
}
```

---

## Phase 2: Hybrid Dynamic Capabilities

**Goal**: Add dynamic discovery and support for all custom fields on top of static core

**Duration**: 2-3 days

| Task ID | Task | Key Files | Deliverable | TDD Focus |
|---------|------|-----------|-------------|----------|
| **Task-7** | **Hybrid Resource Handler Core** | `src/server/resources/hybrid-resource-handler.ts`<br>`tests/unit/server/resources/hybrid-resource-handler.test.ts` | `HybridResourceHandler` extending base handler with dynamic capabilities | TDD Implementation |
| **Task-8** | **Dynamic Field Discovery & Caching** | `src/server/resources/hybrid-resource-handler.ts`<br>`tests/unit/server/resources/dynamic-field-discovery.test.ts` | `getDynamicCustomFields()` method with intelligent caching | Cache Testing |
| **Task-9** | **Definition Fusion Logic** | `src/server/resources/hybrid-resource-handler.ts`<br>`tests/unit/server/resources/definition-fusion.test.ts` | Merge static system fields with dynamic custom fields | Integration Testing |
| **Task-10** | **Configuration & Feature Toggle** | `src/types/config-types.ts`<br>`src/utils/config.ts`<br>`tests/unit/config/hybrid-config.test.ts` | Environment variables and configuration management | Config Testing |
| **Task-11** | **Server Integration Upgrade** | `src/server/jira-mcp-server.ts`<br>`tests/integration/hybrid-server.test.ts` | Switch to `HybridResourceHandler` in main server | Integration TDD |

### Task Implementation Details

#### Task-7 to Task-9: Hybrid Handler Implementation (TDD)

**TDD Workflow**:
1. **typescript-pro**: Write tests for hybrid behavior and caching
2. **typescript-pro**: Implement caching and fusion logic
3. **code-reviewer-simple**: Review caching strategy and error handling
4. **typescript-pro**: Optimize based on feedback

```typescript
// src/server/resources/hybrid-resource-handler.ts
import { JiraResourceHandler } from './resource-handler.js';
import { JiraClientWrapper } from '../client/jira-client-wrapper.js';
import type { JiraField } from '../types/jira-types.js';
import type { FieldDefinition, EnhancedResourceDefinition } from '../types/field-definition.js';

export class HybridResourceHandler extends JiraResourceHandler {
  private customFieldsCache: CustomFieldCache | null = null;
  private readonly cacheTtl = 60 * 60 * 1000; // 1 hour
  private readonly enableDynamic: boolean;

  constructor(private jiraClient: JiraClientWrapper) {
    super();
    this.enableDynamic = process.env.ENABLE_DYNAMIC_FIELDS === 'true';
  }

  /**
   * Enhanced resource reading with dynamic field fusion
   */
  async readResource(uri: string): Promise<{ contents: any[] }> {
    // 1. Get static base definition
    const baseResult = await super.readResource(uri);
    const staticDef = JSON.parse(baseResult.contents[0].text);

    // 2. Return static-only if dynamic is disabled
    if (!this.enableDynamic) {
      return baseResult;
    }

    try {
      // 3. Get dynamic custom fields (with caching)
      const dynamicFields = await this.getDynamicCustomFields();

      // 4. Fuse definitions
      const enhancedDefinition: EnhancedResourceDefinition = {
        ...staticDef,
        totalFields: staticDef.totalFields + Object.keys(dynamicFields).length,
        dynamicFields: Object.keys(dynamicFields).length,
        lastDynamicUpdate: new Date().toISOString(),
        
        fields: {
          ...staticDef.fields,     // Static system fields (42)
          ...dynamicFields         // Dynamic custom fields (170+)
        },
        
        pathIndex: {
          ...staticDef.pathIndex,
          ...this.buildDynamicPathIndex(dynamicFields)
        }
      };
      
      return {
        contents: [{
          type: "text",
          text: JSON.stringify(enhancedDefinition, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      console.error('Dynamic field discovery failed, falling back to static:', error);
      return baseResult; // Graceful fallback
    }
  }

  /**
   * Get dynamic custom field definitions with intelligent caching
   */
  private async getDynamicCustomFields(): Promise<Record<string, FieldDefinition>> {
    // Check cache validity
    if (this.isValidCache()) {
      return this.customFieldsCache!.data;
    }

    try {
      // Fetch all fields from Jira
      const allFields = await this.jiraClient.searchFields();
      const customFields = allFields.filter(f => f.id.startsWith('customfield_'));
      
      console.log(`Discovered ${customFields.length} custom fields`);
      
      // Generate field definitions
      const definitions: Record<string, FieldDefinition> = {};
      for (const field of customFields) {
        definitions[field.id] = this.buildCustomFieldDefinition(field);
      }
      
      // Update cache
      this.customFieldsCache = {
        timestamp: Date.now(),
        data: definitions
      };
      
      return definitions;
    } catch (error) {
      console.error('Failed to fetch dynamic fields:', error);
      throw error;
    }
  }

  /**
   * Build field definition for custom field
   */
  private buildCustomFieldDefinition(field: JiraField): FieldDefinition {
    const fieldType = this.inferFieldType(field);
    
    return {
      id: field.id,
      name: field.name,
      description: `Custom field: ${field.name}`,
      type: fieldType,
      accessPaths: this.generateAccessPaths(field, fieldType),
      examples: [field.id],
      commonUsage: [],
      source: 'dynamic',
      confidence: 'medium'
    };
  }

  /**
   * Infer field type from schema information
   */
  private inferFieldType(field: JiraField): 'string' | 'object' | 'array' {
    if (!field.schema) return 'string';
    
    switch (field.schema.type) {
      case 'array': return 'array';
      case 'option':
      case 'user':
      case 'project': return 'object';
      default: return 'string';
    }
  }

  /**
   * Generate access paths for custom field
   */
  private generateAccessPaths(field: JiraField, type: string): string[] {
    const paths = [field.id];
    
    if (type === 'object') {
      paths.push(`${field.id}.value`, `${field.id}.id`);
    } else if (type === 'array') {
      paths.push(`${field.id}[]`, `${field.id}[].value`);
    }
    
    return paths;
  }

  /**
   * Build path index for dynamic fields
   */
  private buildDynamicPathIndex(dynamicFields: Record<string, FieldDefinition>): Record<string, string> {
    const pathIndex: Record<string, string> = {};
    
    for (const [fieldId, definition] of Object.entries(dynamicFields)) {
      for (const path of definition.accessPaths || []) {
        pathIndex[path] = fieldId;
      }
    }
    
    return pathIndex;
  }

  /**
   * Check if cache is still valid
   */
  private isValidCache(): boolean {
    return this.customFieldsCache !== null && 
           (Date.now() - this.customFieldsCache.timestamp) < this.cacheTtl;
  }
}

interface CustomFieldCache {
  timestamp: number;
  data: Record<string, FieldDefinition>;
}
```

---

## Phase 3: Smart Analysis & Optimization

**Goal**: Enhance custom field definition accuracy and provide intelligent suggestions for invalid inputs

**Duration**: 3-4 days

| Task ID | Task | Key Files | Deliverable | TDD Approach |
|---------|------|-----------|-------------|-------------|
| **Task-12** | **Field Usage Analyzer** | `src/server/resources/field-usage-analyzer.ts`<br>`tests/unit/server/resources/field-usage-analyzer.test.ts`<br>`tests/fixtures/sample-issues.json` | `FieldUsageAnalyzer` for analyzing actual field structures through JQL queries | Mock-Based TDD |
| **Task-13** | **Enhanced Field Validator** | `src/server/resources/enhanced-field-validator.ts`<br>`tests/unit/server/resources/enhanced-field-validator.test.ts` | Smart path validation with similarity matching and suggestions | Algorithm TDD |
| **Task-14** | **Smart Suggestions Integration** | `src/server/resources/hybrid-resource-handler.ts`<br>`src/server/handlers/tool-handler.ts`<br>`tests/integration/smart-validation.test.ts` | Integrate analyzer and enhanced validator into hybrid handler | Integration TDD |
| **Task-15** | **Comprehensive Testing & Validation** | `tests/e2e/complete-workflow.test.ts`<br>`tests/integration/error-handling.test.ts` | End-to-end workflow validation and error handling scenarios | E2E Testing |

---

## Phase 4: Static Suggestion Engine for MCP Production

**Goal**: Convert dynamic analysis to static suggestion engine optimized for MCP's stateless, short-lived process model

**Duration**: 2-3 days

**Background**: Since MCP servers are stdio-based and start fresh with each LLM client connection, the dynamic caching and real-time analysis from Phase 3 provides limited value. Phase 4 refactors the intelligent suggestion system to work effectively in MCP's stateless environment.

| Task ID | Task | Key Files | Deliverable | TDD Approach |
|---------|------|-----------|-------------|-------------|
| **Task-16** | **Static Field Analysis Generator** | `scripts/generate-static-analysis.ts`<br>`tests/scripts/static-analysis.test.ts` | Build-time analysis script that connects to Jira and generates static suggestion data for all 4 entity types | Mock-Based TDD |
| **Task-17** | **Static Suggestion Data Files** | `src/server/resources/static-suggestions/`<br>`src/server/resources/static-suggestions/issue-suggestions.ts`<br>`src/server/resources/static-suggestions/project-suggestions.ts`<br>`src/server/resources/static-suggestions/user-suggestions.ts`<br>`src/server/resources/static-suggestions/agile-suggestions.ts` | Pre-computed suggestion mappings for typo corrections, usage statistics, and contextual recommendations | Test-First |
| **Task-18** | **Lightweight Suggestion Engine** | `src/server/resources/static-suggestion-engine.ts`<br>`tests/unit/server/resources/static-suggestion-engine.test.ts` | Fast, stateless suggestion engine using pre-computed data and simple string similarity | Algorithm TDD |
| **Task-19** | **Integration & Replacement** | `src/server/resources/hybrid-resource-handler.ts`<br>`src/server/handlers/tool-handler.ts`<br>`tests/integration/static-suggestions.test.ts` | Replace dynamic suggestion system with static engine, maintain API compatibility | Integration TDD |

### Task Implementation Details

#### Task-16: Static Field Analysis Generator (TDD)

**TDD Workflow**:
1. **typescript-pro**: Write tests for analysis script and data generation
2. **typescript-pro**: Implement script to analyze all 4 entity types and generate static data
3. **code-reviewer-simple**: Review analysis logic and data quality
4. **typescript-pro**: Optimize based on feedback

**Static Analysis Generator Script**:

```typescript
// scripts/generate-static-analysis.ts
import { JiraClientWrapper } from '../src/client/jira-client-wrapper.js';
import { loadHybridConfig } from '../src/utils/config.js';
import * as fs from 'fs/promises';

interface StaticAnalysisResult {
  entityType: 'issue' | 'project' | 'user' | 'agile';
  typoCorrections: Record<string, string>;
  usageStatistics: Record<string, { frequency: 'high' | 'medium' | 'low'; availability: number }>;
  contextualSuggestions: string[];
  customFieldPatterns: Record<string, string[]>;
  lastAnalyzed: string;
}

/**
 * Generate static analysis for all entity types
 */
async function generateStaticAnalysis(): Promise<void> {
  const config = loadHybridConfig();
  const client = new JiraClientWrapper(config);
  
  try {
    console.log('Starting static analysis generation...');
    
    // Analyze all 4 entity types
    const analysisResults = await Promise.all([
      analyzeIssueFields(client),
      analyzeProjectFields(client),
      analyzeUserFields(client),
      analyzeAgileFields(client)
    ]);
    
    // Generate static suggestion files
    for (const result of analysisResults) {
      await generateSuggestionFile(result);
    }
    
    console.log('Static analysis generation completed successfully');
  } catch (error) {
    console.error('Error generating static analysis:', error);
    throw error;
  }
}

/**
 * Analyze issue fields through JQL sampling
 */
async function analyzeIssueFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const sampleIssues = await client.searchIssues('ORDER BY created DESC', {
    maxResults: 50,
    fields: '*all'
  });
  
  const fieldUsage = analyzeFieldUsage(sampleIssues, 'issue');
  const typoPatterns = generateTypoCorrections('issue');
  
  return {
    entityType: 'issue',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 10),
    customFieldPatterns: extractCustomFieldPatterns(sampleIssues),
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Analyze project fields through REST API sampling
 */
async function analyzeProjectFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const projects = await client.getAllProjects();
  const sampleProjects = projects.slice(0, 20); // Sample subset
  
  const fieldUsage = analyzeFieldUsage(sampleProjects, 'project');
  const typoPatterns = generateTypoCorrections('project');
  
  return {
    entityType: 'project',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 8),
    customFieldPatterns: {},
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Analyze user fields through user search sampling
 */
async function analyzeUserFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const users = await client.searchUsers('', 30);
  
  const fieldUsage = analyzeFieldUsage(users, 'user');
  const typoPatterns = generateTypoCorrections('user');
  
  return {
    entityType: 'user',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 6),
    customFieldPatterns: {},
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Analyze agile fields through board and sprint sampling
 */
async function analyzeAgileFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const boards = await client.getAgileBoards({ maxResults: 10 });
  let sprints: any[] = [];
  
  for (const board of boards.slice(0, 3)) {
    const boardSprints = await client.getSprintsFromBoard(board.id, { maxResults: 5 });
    sprints.push(...boardSprints);
  }
  
  const fieldUsage = analyzeFieldUsage([...boards, ...sprints], 'agile');
  const typoPatterns = generateTypoCorrections('agile');
  
  return {
    entityType: 'agile',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 8),
    customFieldPatterns: {},
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Generate suggestion file for an entity type
 */
async function generateSuggestionFile(result: StaticAnalysisResult): Promise<void> {
  const content = `// Auto-generated static suggestions for ${result.entityType} fields
// Generated on: ${result.lastAnalyzed}
// DO NOT EDIT MANUALLY - This file is generated by scripts/generate-static-analysis.ts

import type { StaticSuggestionData } from '../types/static-suggestions.js';

export const ${result.entityType.toUpperCase()}_STATIC_SUGGESTIONS: StaticSuggestionData = ${JSON.stringify(result, null, 2)};
`;
  
  const filePath = `src/server/resources/static-suggestions/${result.entityType}-suggestions.ts`;
  await fs.writeFile(filePath, content);
  console.log(`Generated ${filePath}`);
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  generateStaticAnalysis();
}
```

#### Task-17: Static Suggestion Data Files

**Pre-computed Suggestion Structure**:

```typescript
// src/server/resources/static-suggestions/issue-suggestions.ts
export const ISSUE_STATIC_SUGGESTIONS: StaticSuggestionData = {
  entityType: 'issue',
  typoCorrections: {
    'stat': 'status',
    'statu': 'status',
    'statuc': 'status',
    'assigne': 'assignee',
    'asignee': 'assignee',
    'sumary': 'summary',
    'summry': 'summary',
    'discription': 'description',
    'descripion': 'description',
    'priorty': 'priority',
    'priorit': 'priority',
    'reporte': 'reporter',
    'reportr': 'reporter'
  },
  usageStatistics: {
    'summary': { frequency: 'high', availability: 0.99 },
    'status': { frequency: 'high', availability: 0.98 },
    'assignee': { frequency: 'high', availability: 0.85 },
    'description': { frequency: 'high', availability: 0.92 },
    'priority': { frequency: 'medium', availability: 0.78 },
    'reporter': { frequency: 'medium', availability: 0.95 },
    'created': { frequency: 'medium', availability: 1.0 },
    'updated': { frequency: 'medium', availability: 1.0 },
    'customfield_10001': { frequency: 'medium', availability: 0.65 },
    'customfield_10002': { frequency: 'low', availability: 0.23 }
  },
  contextualSuggestions: [
    'summary', 'status', 'assignee', 'description', 'priority', 
    'reporter', 'created', 'updated', 'status.name', 'assignee.displayName'
  ],
  customFieldPatterns: {
    'sprint': ['customfield_10001', 'customfield_10020'],
    'epic': ['customfield_10002', 'customfield_10014'],
    'story_points': ['customfield_10005']
  },
  lastAnalyzed: '2024-01-15T10:30:00.000Z'
};
```

#### Task-18: Lightweight Suggestion Engine

**Fast, Stateless Engine**:

```typescript
// src/server/resources/static-suggestion-engine.ts
import { ISSUE_STATIC_SUGGESTIONS } from './static-suggestions/issue-suggestions.js';
import { PROJECT_STATIC_SUGGESTIONS } from './static-suggestions/project-suggestions.js';
import { USER_STATIC_SUGGESTIONS } from './static-suggestions/user-suggestions.js';
import { AGILE_STATIC_SUGGESTIONS } from './static-suggestions/agile-suggestions.js';

export class StaticSuggestionEngine {
  private static readonly SUGGESTIONS_MAP = {
    'issue': ISSUE_STATIC_SUGGESTIONS,
    'project': PROJECT_STATIC_SUGGESTIONS,
    'user': USER_STATIC_SUGGESTIONS,
    'agile': AGILE_STATIC_SUGGESTIONS
  };

  /**
   * Get field suggestions for invalid input
   */
  suggest(entityType: string, input: string, maxSuggestions: number = 5): string[] {
    const suggestions = StaticSuggestionEngine.SUGGESTIONS_MAP[entityType];
    if (!suggestions) return [];

    // 1. Check direct typo correction
    const typoCorrection = suggestions.typoCorrections[input.toLowerCase()];
    if (typoCorrection) {
      return [typoCorrection];
    }

    // 2. String similarity matching
    const candidates = suggestions.contextualSuggestions;
    const similar = this.findSimilar(input, candidates, maxSuggestions);

    // 3. Sort by usage frequency and availability
    return similar.sort((a, b) => {
      const aStats = suggestions.usageStatistics[a];
      const bStats = suggestions.usageStatistics[b];
      
      if (!aStats && !bStats) return 0;
      if (!aStats) return 1;
      if (!bStats) return -1;
      
      // Prioritize by frequency, then availability
      const freqWeight = { high: 3, medium: 2, low: 1 };
      const aScore = freqWeight[aStats.frequency] * aStats.availability;
      const bScore = freqWeight[bStats.frequency] * bStats.availability;
      
      return bScore - aScore;
    });
  }

  /**
   * Simple Levenshtein distance calculation
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    
    const matrix = Array.from({ length: len1 + 1 }, () => 
      Array.from({ length: len2 + 1 }, () => 0)
    );
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    return 1 - distance / Math.max(len1, len2);
  }

  /**
   * Find similar strings using Levenshtein distance
   */
  private findSimilar(input: string, candidates: string[], maxResults: number): string[] {
    return candidates
      .map(candidate => ({
        field: candidate,
        similarity: this.calculateSimilarity(input.toLowerCase(), candidate.toLowerCase())
      }))
      .filter(item => item.similarity >= 0.4) // Configurable threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults)
      .map(item => item.field);
  }
}
```

#### Task-19: Integration & Replacement

**Replace Dynamic System with Static Engine**:

```typescript
// Update hybrid-resource-handler.ts
export class HybridResourceHandler extends JiraResourceHandler {
  private staticSuggestionEngine: StaticSuggestionEngine;

  constructor(/* ... */) {
    super();
    this.staticSuggestionEngine = new StaticSuggestionEngine();
  }

  /**
   * Enhanced field validation with static suggestions
   */
  async validateFieldPathsWithSuggestions(
    entityType: string, 
    paths: string[]
  ): Promise<EnhancedValidationResult[]> {
    const results: EnhancedValidationResult[] = [];
    
    for (const path of paths) {
      const baseResult = this.validateFieldPaths(entityType, [path]);
      
      if (baseResult.valid) {
        results.push({
          ...baseResult,
          confidence: 'high',
          sources: ['static']
        });
      } else {
        // Get static suggestions for invalid path
        const suggestions = this.staticSuggestionEngine.suggest(entityType, path, 3);
        
        results.push({
          ...baseResult,
          suggestions,
          confidence: 'low',
          sources: ['static_suggestions']
        });
      }
    }
    
    return results;
  }
}
```

---

## Summary & Next Steps

After completing these four phases, your MCP Server will have a production-optimized, stateless intelligent suggestion system perfectly suited for MCP's stdio-based architecture.

### Key Achievements
- **Phase 0**: Universal fields parameter support across all 19 tools (Foundation)
- **Phase 1**: MVP with static core field support (42 system fields)
- **Phase 2**: Dynamic custom field discovery (170+ fields)  
- **Phase 3**: Smart analysis and intelligent suggestions *(legacy, for learning)*
- **Phase 4**: Production-optimized static suggestion engine

### Implementation Standards
- **Test Coverage**: ≥ 80% for all new code
- **Code Quality**: ESLint compliance, TypeScript strict mode
- **Agent Collaboration**: typescript-pro develops, code-reviewer-simple reviews
- **Error Handling**: Graceful fallbacks and comprehensive error recovery
- **MCP Optimization**: Stateless, fast-startup design for stdio-based processes

### Phase 4 Benefits for MCP Production
- **Instant Startup**: No cache warm-up or dynamic analysis overhead
- **Consistent Performance**: Predictable response times across all instances  
- **Real Usage Data**: Pre-computed suggestions based on actual Jira analysis
- **Memory Efficient**: Minimal memory footprint with static data structures
- **Maintenance Friendly**: Update suggestions through build-time re-analysis

### Future Enhancements (Optional)
- **Multi-Instance Analysis**: Generate suggestions for multiple Jira instances
- **Custom Suggestion Profiles**: Tailor suggestions for different organizations
- **Automated Regeneration**: CI/CD integration for periodic suggestion updates
- **Advanced Algorithms**: Semantic similarity using embeddings for better suggestions

### Development Timeline
- **Phase 0**: 2-3 days (Universal Fields Parameter Support - Foundation)
- **Phase 1**: 3-5 days (Static Core MVP)
- **Phase 2**: 2-3 days (Hybrid Dynamic)
- **Phase 3**: 3-4 days (Smart Analysis) *(learning/prototyping)*  
- **Phase 4**: 2-3 days (Static Production Engine)
- **Total**: 12-18 days

### Recommended Implementation Path

**For Production MCP Servers**: Implement Phases 0, 1, 2, and 4
- **Phase 0** provides consistent fields parameter foundation across all tools
- **Phase 1** provides static core field definitions
- **Phase 2** adds dynamic field discovery capabilities
- **Phase 4** provides practical, fast suggestion system

**For Learning/Research**: Implement all phases
- Phase 3 demonstrates advanced algorithmic approaches
- Provides insight into dynamic analysis and caching strategies
- Useful for understanding complex field usage patterns

This plan provides a clear path from rapid value delivery to building a long-term robust system with English code, TDD methodology, and agent collaboration ensuring high code quality throughout the implementation process.
