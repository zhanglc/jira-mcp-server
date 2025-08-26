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
3. **Sample Issues**: Identify 1-2 representative issue keys with rich fields (e.g., `DSCWA-428`) for analysis
4. **Testing Setup**: Verify Jest configuration and test environment

---

## Phase 1: Static Core Implementation (MVP)

**Goal**: Quickly deploy complete nested path support for most commonly used system fields (status, assignee, project, etc.)

**Duration**: 3-5 days

| Task ID | Task | Key Files | Deliverable | TDD Priority |
|---------|------|-----------|-------------|-------------|
| **Task-1** | **Field Definition Generation Script** | `scripts/generate-field-definitions.ts`<br>`tests/scripts/generate-definitions.test.ts` | Script to connect to Jira, fetch complete issue data, and save as JSON | Red-Green-Refactor |
| **Task-2** | **Static Definition Files & Types** | `src/types/field-definition.ts`<br>`src/resources/static-definitions/issue-fields.ts`<br>`tests/unit/types/field-definition.test.ts` | Type definitions and static field definitions for core fields | Test-First |
| **Task-3** | **Basic Resource Handler** | `src/resources/resource-handler.ts`<br>`tests/unit/resources/resource-handler.test.ts` | `JiraResourceHandler` class handling ListResources and ReadResource requests | TDD |
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
  const issueKey = 'DSCWA-428'; // Use your representative issue
  
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
// src/resources/static-definitions/issue-fields.ts
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
// src/resources/resource-handler.ts
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
| **Task-7** | **Hybrid Resource Handler Core** | `src/resources/hybrid-resource-handler.ts`<br>`tests/unit/resources/hybrid-resource-handler.test.ts` | `HybridResourceHandler` extending base handler with dynamic capabilities | TDD Implementation |
| **Task-8** | **Dynamic Field Discovery & Caching** | `src/resources/hybrid-resource-handler.ts`<br>`tests/unit/resources/dynamic-field-discovery.test.ts` | `getDynamicCustomFields()` method with intelligent caching | Cache Testing |
| **Task-9** | **Definition Fusion Logic** | `src/resources/hybrid-resource-handler.ts`<br>`tests/unit/resources/definition-fusion.test.ts` | Merge static system fields with dynamic custom fields | Integration Testing |
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
// src/resources/hybrid-resource-handler.ts
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
| **Task-12** | **Field Usage Analyzer** | `src/resources/field-usage-analyzer.ts`<br>`tests/unit/resources/field-usage-analyzer.test.ts`<br>`tests/fixtures/sample-issues.json` | `FieldUsageAnalyzer` for analyzing actual field structures through JQL queries | Mock-Based TDD |
| **Task-13** | **Enhanced Field Validator** | `src/resources/enhanced-field-validator.ts`<br>`tests/unit/resources/enhanced-field-validator.test.ts` | Smart path validation with similarity matching and suggestions | Algorithm TDD |
| **Task-14** | **Smart Suggestions Integration** | `src/resources/hybrid-resource-handler.ts`<br>`src/server/handlers/tool-handler.ts`<br>`tests/integration/smart-validation.test.ts` | Integrate analyzer and enhanced validator into hybrid handler | Integration TDD |
| **Task-15** | **Comprehensive Testing & Validation** | `tests/e2e/complete-workflow.test.ts`<br>`tests/integration/error-handling.test.ts` | End-to-end workflow validation and error handling scenarios | E2E Testing |

---

## Summary & Next Steps

After completing these three phases, your MCP Server will have an industry-leading, feature-complete, and highly intelligent Resource system.

### Key Achievements
- **Phase 1**: MVP with static core field support (42 system fields)
- **Phase 2**: Dynamic custom field discovery (170+ fields)
- **Phase 3**: Smart analysis and intelligent suggestions

### Implementation Standards
- **Test Coverage**: ≥ 80% for all new code
- **Code Quality**: ESLint compliance, TypeScript strict mode
- **Agent Collaboration**: typescript-pro develops, code-reviewer-simple reviews
- **Error Handling**: Graceful fallbacks and comprehensive error recovery

### Future Enhancements (Optional)
- **Performance Monitoring**: Add monitoring for dynamic field fetch performance and cache hit rates *(moved to optional)*
- **Multi-Instance Support**: Associate cache keys with Jira instance URLs for multiple server support
- **Automated Updates**: Enhance `generate-field-definitions.ts` script for automatic static definition updates

### Development Timeline
- **Phase 1**: 3-5 days (Static Core MVP)
- **Phase 2**: 2-3 days (Hybrid Dynamic)
- **Phase 3**: 3-4 days (Smart Analysis)
- **Total**: 8-12 days

This plan provides a clear path from rapid value delivery to building a long-term robust system with English code, TDD methodology, and agent collaboration ensuring high code quality throughout the implementation process.
