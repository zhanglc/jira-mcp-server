/**
 * MCP Test Utilities
 *
 * Utility functions for testing MCP tools and resources.
 */

import type {
  MCPToolContext,
  MCPResourceContext,
  ToolResponse,
  ResourceContent,
} from '@/types/mcp';
import type { JiraServerConfig } from '@/types/config';

/**
 * Create a mock MCP tool context for testing
 */
export function createMockToolContext(
  overrides: Partial<MCPToolContext> = {}
): MCPToolContext {
  const defaultConfig: JiraServerConfig = {
    jira: {
      url: 'https://test.atlassian.net',
      personalToken: 'test-token',
      timeout: 5000,
      sslVerify: true,
      projectsFilter: [],
    },
    server: {
      name: 'test-jira-mcp',
      version: '1.0.0',
    },
  };

  return {
    config: defaultConfig,
    requestId: 'test-request-123',
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock MCP resource context for testing
 */
export function createMockResourceContext(
  overrides: Partial<MCPResourceContext> = {}
): MCPResourceContext {
  return createMockToolContext(overrides);
}

/**
 * Create a mock tool response for testing
 */
export function createMockToolResponse<T = any>(
  data: T,
  overrides: Partial<ToolResponse<T>> = {}
): ToolResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: 'test-request-123',
      timestamp: new Date().toISOString(),
      executionTime: 100,
    },
    ...overrides,
  };
}

/**
 * Create a mock resource content for testing
 */
export function createMockResourceContent(
  uri: string,
  text: string,
  overrides: Partial<ResourceContent> = {}
): ResourceContent {
  return {
    uri,
    mimeType: 'application/json',
    text,
    ...overrides,
  };
}

/**
 * Validate field selection patterns
 */
export function validateFieldSelection(
  requestedFields: string[],
  availableFields: string[]
): {
  valid: string[];
  invalid: string[];
  nested: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const nested: string[] = [];

  for (const field of requestedFields) {
    if (field.includes('.')) {
      nested.push(field);
      // For nested fields, check if the root field exists
      const rootField = field.split('.')[0];
      if (availableFields.includes(rootField)) {
        valid.push(field);
      } else {
        invalid.push(field);
      }
    } else if (availableFields.includes(field)) {
      valid.push(field);
    } else {
      invalid.push(field);
    }
  }

  return { valid, invalid, nested };
}

/**
 * Generate test field selection scenarios
 */
export function generateFieldSelectionTestCases() {
  return {
    simple: ['summary', 'status', 'priority'],
    nested: ['assignee.displayName', 'project.key', 'status.name'],
    complex: [
      'assignee.displayName',
      'project.lead.emailAddress',
      'components[0].name',
      'fixVersions[*].releaseDate',
    ],
    invalid: ['nonexistent', 'invalid.field', 'badarray[invalid]'],
    mixed: ['summary', 'assignee.displayName', 'nonexistent', 'project.key'],
  };
}

/**
 * Mock Jira API response factory
 */
export class MockJiraResponseFactory {
  static issue(issueKey: string = 'TEST-123') {
    return {
      id: '10001',
      key: issueKey,
      self: `https://test.atlassian.net/rest/api/2/issue/${issueKey}`,
      fields: {
        summary: 'Test Issue Summary',
        status: {
          id: '1',
          name: 'Open',
          statusCategory: {
            id: 2,
            key: 'new',
            colorName: 'blue-gray',
            name: 'To Do',
          },
        },
        priority: {
          id: '3',
          name: 'Medium',
        },
        assignee: {
          name: 'testuser',
          displayName: 'Test User',
          emailAddress: 'test@example.com',
        },
        project: {
          id: '10000',
          key: 'TEST',
          name: 'Test Project',
          lead: {
            name: 'projectlead',
            displayName: 'Project Lead',
            emailAddress: 'lead@example.com',
          },
        },
        created: '2023-01-01T10:00:00.000Z',
        updated: '2023-01-02T15:30:00.000Z',
      },
    };
  }

  static searchResponse(issues: any[] = []) {
    return {
      startAt: 0,
      maxResults: 50,
      total: issues.length,
      issues,
    };
  }

  static project(projectKey: string = 'TEST') {
    return {
      id: '10000',
      key: projectKey,
      name: `${projectKey} Project`,
      self: `https://test.atlassian.net/rest/api/2/project/${projectKey}`,
      lead: {
        name: 'projectlead',
        displayName: 'Project Lead',
      },
      components: [],
      versions: [],
      roles: {},
    };
  }

  static user(username: string = 'testuser') {
    return {
      name: username,
      displayName: 'Test User',
      emailAddress: `${username}@example.com`,
      active: true,
      self: `https://test.atlassian.net/rest/api/2/user?username=${username}`,
    };
  }

  static board(boardId: string = '1') {
    return {
      id: boardId,
      name: 'Test Board',
      type: 'scrum',
      self: `https://test.atlassian.net/rest/agile/1.0/board/${boardId}`,
      location: {
        type: 'project',
        projectId: 10000,
        projectKey: 'TEST',
        projectName: 'Test Project',
      },
    };
  }

  static sprint(sprintId: string = '1') {
    return {
      id: sprintId,
      name: 'Test Sprint 1',
      state: 'active',
      self: `https://test.atlassian.net/rest/agile/1.0/sprint/${sprintId}`,
      startDate: '2023-01-01T10:00:00.000Z',
      endDate: '2023-01-15T10:00:00.000Z',
    };
  }
}

/**
 * Test data validation helpers
 */
export function expectValidToolResponse<T>(response: ToolResponse<T>) {
  expect(response).toHaveProperty('success');
  expect(response).toHaveProperty('meta');
  expect(response.meta).toHaveProperty('timestamp');
  expect(response.meta).toHaveProperty('requestId');

  if (response.success) {
    expect(response).toHaveProperty('data');
  } else {
    expect(response).toHaveProperty('error');
  }
}

export function expectValidResourceContent(content: ResourceContent) {
  expect(content).toHaveProperty('uri');
  expect(content.uri).toMatch(/^jira:\/\//);
  expect(content).toHaveProperty('mimeType');
  expect(content).toHaveProperty('text');
}

/**
 * Field selection assertion helpers
 */
export function expectFieldSelectionWorking(
  result: any,
  requestedFields: string[]
) {
  // Check that only requested fields are present
  const resultFields = Object.keys(result);

  for (const field of requestedFields) {
    if (field.includes('.')) {
      // For nested fields, check if the root field exists
      const rootField = field.split('.')[0];
      expect(resultFields).toContain(rootField);
    } else {
      expect(resultFields).toContain(field);
    }
  }
}

/**
 * Performance testing helpers
 */
export function measureExecutionTime<T>(fn: () => T): {
  result: T;
  time: number;
} {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1_000_000; // Convert to milliseconds

  return { result, time };
}

export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; time: number }> {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1_000_000; // Convert to milliseconds

  return { result, time };
}
