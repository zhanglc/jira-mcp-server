/**
 * MSW Mock Server Setup for Jira API
 *
 * Mock server configuration for testing Jira Server/Data Center API interactions.
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MockJiraResponseFactory } from './mcp-test-utils';

/**
 * Jira API endpoints for mocking
 */
const JIRA_BASE_URL = 'https://test.atlassian.net';

/**
 * Mock handlers for Jira Server API endpoints
 */
export const jiraApiHandlers = [
  // Issue endpoints
  http.get(`${JIRA_BASE_URL}/rest/api/2/issue/:issueKey`, ({ params }) => {
    const { issueKey } = params;
    const issue = MockJiraResponseFactory.issue(issueKey as string);
    return HttpResponse.json(issue);
  }),

  http.get(
    `${JIRA_BASE_URL}/rest/api/2/issue/:issueKey/transitions`,
    ({ params }) => {
      const { issueKey: _issueKey } = params;
      return HttpResponse.json({
        transitions: [
          {
            id: '11',
            name: 'To Do',
            to: {
              id: '1',
              name: 'To Do',
              statusCategory: { key: 'new' },
            },
          },
          {
            id: '21',
            name: 'In Progress',
            to: {
              id: '3',
              name: 'In Progress',
              statusCategory: { key: 'indeterminate' },
            },
          },
          {
            id: '31',
            name: 'Done',
            to: {
              id: '10001',
              name: 'Done',
              statusCategory: { key: 'done' },
            },
          },
        ],
      });
    }
  ),

  http.get(
    `${JIRA_BASE_URL}/rest/api/2/issue/:issueKey/worklog`,
    ({ params }) => {
      const { issueKey } = params;
      return HttpResponse.json({
        startAt: 0,
        maxResults: 20,
        total: 1,
        worklogs: [
          {
            id: '10000',
            self: `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}/worklog/10000`,
            author: MockJiraResponseFactory.user('testuser'),
            comment: 'Test worklog entry',
            started: '2023-01-01T10:00:00.000Z',
            timeSpent: '1h',
            timeSpentSeconds: 3600,
            created: '2023-01-01T10:00:00.000Z',
            updated: '2023-01-01T10:00:00.000Z',
          },
        ],
      });
    }
  ),

  // Search endpoints
  http.get(`${JIRA_BASE_URL}/rest/api/2/search`, ({ request }) => {
    const url = new URL(request.url);
    const _jql = url.searchParams.get('jql') || '';
    const startAt = parseInt(url.searchParams.get('startAt') || '0');
    const maxResults = parseInt(url.searchParams.get('maxResults') || '50');

    // Generate mock issues based on JQL
    const issues = [];
    for (let i = 0; i < Math.min(maxResults, 5); i++) {
      issues.push(MockJiraResponseFactory.issue(`TEST-${startAt + i + 1}`));
    }

    return HttpResponse.json(MockJiraResponseFactory.searchResponse(issues));
  }),

  // Field endpoints
  http.get(`${JIRA_BASE_URL}/rest/api/2/field`, () => {
    return HttpResponse.json([
      {
        id: 'summary',
        name: 'Summary',
        custom: false,
        orderable: true,
        navigable: true,
        searchable: true,
        clauseNames: ['summary'],
        schema: { type: 'string', system: 'summary' },
      },
      {
        id: 'status',
        name: 'Status',
        custom: false,
        orderable: false,
        navigable: true,
        searchable: true,
        clauseNames: ['status'],
        schema: { type: 'status', system: 'status' },
      },
      {
        id: 'customfield_10001',
        name: 'Custom Text Field',
        custom: true,
        orderable: true,
        navigable: true,
        searchable: true,
        clauseNames: ['cf[10001]', 'Custom Text Field'],
        schema: {
          type: 'string',
          custom: 'com.atlassian.jira.plugin.system.customfieldtypes:textfield',
          customId: 10001,
        },
      },
    ]);
  }),

  // Project endpoints
  http.get(`${JIRA_BASE_URL}/rest/api/2/project`, () => {
    return HttpResponse.json([
      MockJiraResponseFactory.project('TEST'),
      MockJiraResponseFactory.project('DEMO'),
    ]);
  }),

  http.get(`${JIRA_BASE_URL}/rest/api/2/project/:projectKey`, ({ params }) => {
    const { projectKey } = params;
    return HttpResponse.json(
      MockJiraResponseFactory.project(projectKey as string)
    );
  }),

  http.get(
    `${JIRA_BASE_URL}/rest/api/2/project/:projectKey/version`,
    ({ params }) => {
      const { projectKey: _projectKey } = params;
      return HttpResponse.json([
        {
          id: '10000',
          name: 'Version 1.0',
          archived: false,
          released: true,
          releaseDate: '2023-01-01',
          self: `${JIRA_BASE_URL}/rest/api/2/version/10000`,
          projectId: 10000,
        },
        {
          id: '10001',
          name: 'Version 2.0',
          archived: false,
          released: false,
          self: `${JIRA_BASE_URL}/rest/api/2/version/10001`,
          projectId: 10000,
        },
      ]);
    }
  ),

  // User endpoints
  http.get(`${JIRA_BASE_URL}/rest/api/2/user`, ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('username') || 'testuser';
    return HttpResponse.json(MockJiraResponseFactory.user(username));
  }),

  // Issue link types
  http.get(`${JIRA_BASE_URL}/rest/api/2/issueLinkType`, () => {
    return HttpResponse.json({
      issueLinkTypes: [
        {
          id: '10000',
          name: 'Blocks',
          inward: 'is blocked by',
          outward: 'blocks',
          self: `${JIRA_BASE_URL}/rest/api/2/issueLinkType/10000`,
        },
        {
          id: '10001',
          name: 'Relates',
          inward: 'relates to',
          outward: 'relates to',
          self: `${JIRA_BASE_URL}/rest/api/2/issueLinkType/10001`,
        },
      ],
    });
  }),

  // Agile API endpoints
  http.get(`${JIRA_BASE_URL}/rest/agile/1.0/board`, () => {
    return HttpResponse.json({
      startAt: 0,
      maxResults: 50,
      total: 2,
      values: [
        MockJiraResponseFactory.board('1'),
        MockJiraResponseFactory.board('2'),
      ],
    });
  }),

  http.get(`${JIRA_BASE_URL}/rest/agile/1.0/board/:boardId`, ({ params }) => {
    const { boardId } = params;
    return HttpResponse.json(MockJiraResponseFactory.board(boardId as string));
  }),

  http.get(
    `${JIRA_BASE_URL}/rest/agile/1.0/board/:boardId/issue`,
    ({ params, request }) => {
      const { boardId } = params;
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0');
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50');

      const issues = [];
      for (let i = 0; i < Math.min(maxResults, 3); i++) {
        issues.push(
          MockJiraResponseFactory.issue(`BOARD-${boardId}-${startAt + i + 1}`)
        );
      }

      return HttpResponse.json({
        startAt,
        maxResults,
        total: issues.length,
        issues,
      });
    }
  ),

  http.get(
    `${JIRA_BASE_URL}/rest/agile/1.0/board/:boardId/sprint`,
    ({ params }) => {
      const { boardId: _boardId } = params;
      return HttpResponse.json({
        startAt: 0,
        maxResults: 50,
        total: 2,
        values: [
          MockJiraResponseFactory.sprint('1'),
          MockJiraResponseFactory.sprint('2'),
        ],
      });
    }
  ),

  http.get(`${JIRA_BASE_URL}/rest/agile/1.0/sprint/:sprintId`, ({ params }) => {
    const { sprintId } = params;
    return HttpResponse.json(
      MockJiraResponseFactory.sprint(sprintId as string)
    );
  }),

  http.get(
    `${JIRA_BASE_URL}/rest/agile/1.0/sprint/:sprintId/issue`,
    ({ params, request }) => {
      const { sprintId } = params;
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0');
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50');

      const issues = [];
      for (let i = 0; i < Math.min(maxResults, 3); i++) {
        issues.push(
          MockJiraResponseFactory.issue(`SPRINT-${sprintId}-${startAt + i + 1}`)
        );
      }

      return HttpResponse.json({
        startAt,
        maxResults,
        total: issues.length,
        issues,
      });
    }
  ),

  // Error handling scenarios
  http.get(`${JIRA_BASE_URL}/rest/api/2/issue/ERROR-404`, () => {
    return HttpResponse.json(
      {
        errorMessages: [
          'Issue does not exist or you do not have permission to see it.',
        ],
      },
      { status: 404 }
    );
  }),

  http.get(`${JIRA_BASE_URL}/rest/api/2/issue/ERROR-403`, () => {
    return HttpResponse.json(
      { errorMessages: ['You do not have permission to view this issue.'] },
      { status: 403 }
    );
  }),

  http.get(`${JIRA_BASE_URL}/rest/api/2/issue/ERROR-500`, () => {
    return HttpResponse.json(
      { errorMessages: ['Internal server error.'] },
      { status: 500 }
    );
  }),
];

/**
 * Create and configure the mock server
 */
export const mockServer = setupServer(...jiraApiHandlers);

/**
 * Helper functions for test setup
 */
export function setupMockServer() {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });
}

/**
 * Override handlers for specific test scenarios
 */
export function overrideHandlers(...handlers: any[]) {
  mockServer.use(...handlers);
}

/**
 * Custom response builders for specific test scenarios
 */
export class MockScenarios {
  static emptySearchResults() {
    return http.get(`${JIRA_BASE_URL}/rest/api/2/search`, () => {
      return HttpResponse.json(MockJiraResponseFactory.searchResponse([]));
    });
  }

  static networkError(endpoint: string) {
    return http.get(`${JIRA_BASE_URL}${endpoint}`, () => {
      return HttpResponse.error();
    });
  }

  static timeoutError(endpoint: string) {
    return http.get(`${JIRA_BASE_URL}${endpoint}`, async () => {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate timeout
      return HttpResponse.json({});
    });
  }

  static largeResponse(endpoint: string, size: number = 1000) {
    return http.get(`${JIRA_BASE_URL}${endpoint}`, () => {
      const issues = [];
      for (let i = 0; i < size; i++) {
        issues.push(MockJiraResponseFactory.issue(`LARGE-${i + 1}`));
      }
      return HttpResponse.json(MockJiraResponseFactory.searchResponse(issues));
    });
  }
}
