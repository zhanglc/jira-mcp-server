/**
 * MCP Tool Response Fixtures
 * 
 * Expected MCP tool response payloads for testing.
 */

import type { ToolResponse } from '@/types/mcp';

export const toolResponses = {
  // Issue Operations
  jira_get_issue: {
    success: {
      success: true,
      data: {
        id: '10001',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/2/issue/TEST-123',
        fields: {
          summary: 'Test Issue Summary',
          status: {
            name: 'Open'
          },
          assignee: {
            displayName: 'Test User'
          }
        }
      },
      meta: {
        requestId: 'test-request-123',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 150
      }
    } as ToolResponse,

    notFound: {
      success: false,
      error: {
        type: 'jira_api_error',
        code: 'ISSUE_NOT_FOUND',
        message: 'Issue does not exist or you do not have permission to see it.',
        details: {
          issueKey: 'ERROR-404',
          statusCode: 404
        }
      },
      meta: {
        requestId: 'test-request-404',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 100
      }
    } as ToolResponse,

    fieldFiltered: {
      success: true,
      data: {
        id: '10001',
        key: 'TEST-123',
        fields: {
          summary: 'Test Issue Summary',
          assignee: {
            displayName: 'Test User'
          }
          // Note: Only requested fields are included
        }
      },
      meta: {
        requestId: 'test-request-fields',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 120,
        fieldSelection: {
          requestedFields: ['summary', 'assignee.displayName'],
          resolvedFields: ['summary', 'assignee.displayName'],
          skippedFields: []
        }
      }
    } as ToolResponse
  },

  jira_get_transitions: {
    success: {
      success: true,
      data: {
        transitions: [
          {
            id: '11',
            name: 'To Do',
            to: {
              id: '1',
              name: 'To Do',
              statusCategory: { key: 'new' }
            }
          },
          {
            id: '21',
            name: 'In Progress',
            to: {
              id: '3',
              name: 'In Progress',
              statusCategory: { key: 'indeterminate' }
            }
          }
        ]
      },
      meta: {
        requestId: 'test-transitions',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 80
      }
    } as ToolResponse
  },

  jira_get_worklog: {
    success: {
      success: true,
      data: {
        startAt: 0,
        maxResults: 20,
        total: 1,
        worklogs: [
          {
            id: '10000',
            author: {
              displayName: 'Test User'
            },
            timeSpent: '1h',
            comment: 'Test worklog entry'
          }
        ]
      },
      meta: {
        requestId: 'test-worklog',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 200
      }
    } as ToolResponse
  },

  // Search Operations
  jira_search: {
    success: {
      success: true,
      data: {
        startAt: 0,
        maxResults: 50,
        total: 2,
        issues: [
          {
            id: '10001',
            key: 'TEST-1',
            fields: {
              summary: 'First Test Issue',
              status: { name: 'Open' },
              assignee: { displayName: 'Test User' }
            }
          },
          {
            id: '10002',
            key: 'TEST-2',
            fields: {
              summary: 'Second Test Issue',
              status: { name: 'In Progress' },
              assignee: { displayName: 'Another User' }
            }
          }
        ]
      },
      meta: {
        requestId: 'test-search',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 300
      }
    } as ToolResponse,

    empty: {
      success: true,
      data: {
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: []
      },
      meta: {
        requestId: 'test-search-empty',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 150
      }
    } as ToolResponse
  },

  jira_search_fields: {
    success: {
      success: true,
      data: [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          searchable: true,
          schema: { type: 'string', system: 'summary' }
        },
        {
          id: 'customfield_10001',
          name: 'Custom Text Field',
          custom: true,
          searchable: true,
          schema: { type: 'string', custom: 'textfield', customId: 10001 }
        }
      ],
      meta: {
        requestId: 'test-fields',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 100
      }
    } as ToolResponse
  },

  // Project Operations
  jira_get_all_projects: {
    success: {
      success: true,
      data: [
        {
          id: '10000',
          key: 'TEST',
          name: 'Test Project',
          lead: { displayName: 'Project Lead' }
        },
        {
          id: '10001',
          key: 'DEMO',
          name: 'Demo Project',
          lead: { displayName: 'Demo Lead' }
        }
      ],
      meta: {
        requestId: 'test-projects',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 200
      }
    } as ToolResponse
  },

  jira_get_user_profile: {
    success: {
      success: true,
      data: {
        name: 'testuser',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        active: true
      },
      meta: {
        requestId: 'test-user',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 120
      }
    } as ToolResponse
  },

  // Agile Operations
  jira_get_agile_boards: {
    success: {
      success: true,
      data: {
        startAt: 0,
        maxResults: 50,
        total: 2,
        values: [
          {
            id: '1',
            name: 'Test Board',
            type: 'scrum',
            location: { projectKey: 'TEST' }
          },
          {
            id: '2',
            name: 'Demo Board',
            type: 'kanban',
            location: { projectKey: 'DEMO' }
          }
        ]
      },
      meta: {
        requestId: 'test-boards',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 180
      }
    } as ToolResponse
  },

  jira_get_sprints_from_board: {
    success: {
      success: true,
      data: {
        startAt: 0,
        maxResults: 50,
        total: 2,
        values: [
          {
            id: '1',
            name: 'Sprint 1',
            state: 'active',
            startDate: '2023-01-01T10:00:00.000Z',
            endDate: '2023-01-15T10:00:00.000Z'
          },
          {
            id: '2',
            name: 'Sprint 2',
            state: 'future',
            startDate: '2023-01-16T10:00:00.000Z',
            endDate: '2023-01-30T10:00:00.000Z'
          }
        ]
      },
      meta: {
        requestId: 'test-sprints',
        timestamp: '2023-01-01T10:00:00.000Z',
        executionTime: 160
      }
    } as ToolResponse
  }
};

/**
 * Error Response Templates
 */
export const errorResponses = {
  notFound: {
    success: false,
    error: {
      type: 'jira_api_error',
      code: 'NOT_FOUND',
      message: 'Resource not found or you do not have permission to access it.'
    },
    meta: {
      requestId: 'error-404',
      timestamp: '2023-01-01T10:00:00.000Z',
      executionTime: 100
    }
  } as ToolResponse,

  forbidden: {
    success: false,
    error: {
      type: 'jira_api_error',
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this operation.'
    },
    meta: {
      requestId: 'error-403',
      timestamp: '2023-01-01T10:00:00.000Z',
      executionTime: 80
    }
  } as ToolResponse,

  validation: {
    success: false,
    error: {
      type: 'mcp_validation_error',
      code: 'INVALID_INPUT',
      message: 'Invalid input parameters provided.',
      field: 'issueKey',
      value: ''
    },
    meta: {
      requestId: 'error-validation',
      timestamp: '2023-01-01T10:00:00.000Z',
      executionTime: 10
    }
  } as ToolResponse,

  network: {
    success: false,
    error: {
      type: 'network_error',
      code: 'CONNECTION_FAILED',
      message: 'Failed to connect to Jira server.'
    },
    meta: {
      requestId: 'error-network',
      timestamp: '2023-01-01T10:00:00.000Z',
      executionTime: 5000
    }
  } as ToolResponse,

  timeout: {
    success: false,
    error: {
      type: 'timeout_error',
      code: 'REQUEST_TIMEOUT',
      message: 'Request timed out waiting for server response.'
    },
    meta: {
      requestId: 'error-timeout',
      timestamp: '2023-01-01T10:00:00.000Z',
      executionTime: 10000
    }
  } as ToolResponse
};

/**
 * Field Selection Response Examples
 */
export const fieldSelectionResponses = {
  simpleFields: {
    success: true,
    data: {
      summary: 'Test Issue',
      status: 'Open',
      priority: 'Medium'
    },
    meta: {
      fieldSelection: {
        requestedFields: ['summary', 'status', 'priority'],
        resolvedFields: ['summary', 'status', 'priority'],
        skippedFields: []
      }
    }
  } as ToolResponse,

  nestedFields: {
    success: true,
    data: {
      assignee: {
        displayName: 'Test User'
      },
      project: {
        key: 'TEST'
      },
      status: {
        name: 'Open'
      }
    },
    meta: {
      fieldSelection: {
        requestedFields: ['assignee.displayName', 'project.key', 'status.name'],
        resolvedFields: ['assignee.displayName', 'project.key', 'status.name'],
        skippedFields: []
      }
    }
  } as ToolResponse,

  partialFields: {
    success: true,
    data: {
      summary: 'Test Issue',
      assignee: {
        displayName: 'Test User'
      },
      project: {
        key: 'TEST'
      }
    },
    meta: {
      fieldSelection: {
        requestedFields: ['summary', 'assignee.displayName', 'nonexistent', 'project.key'],
        resolvedFields: ['summary', 'assignee.displayName', 'project.key'],
        skippedFields: ['nonexistent']
      }
    }
  } as ToolResponse
};