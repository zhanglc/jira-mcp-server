/**
 * MCP Tool Request Fixtures
 * 
 * Sample MCP tool request payloads for testing.
 */

export const toolRequests = {
  // Issue Operations
  jira_get_issue: {
    valid: {
      issueKey: 'TEST-123',
      fields: ['summary', 'status', 'assignee.displayName']
    },
    withAllFields: {
      issueKey: 'TEST-456',
      fields: [
        'summary',
        'description', 
        'status.name',
        'priority.name',
        'assignee.displayName',
        'assignee.emailAddress',
        'project.key',
        'project.name',
        'created',
        'updated'
      ]
    },
    minimal: {
      issueKey: 'TEST-789'
    },
    invalid: {
      issueKey: 'INVALID-KEY',
      fields: ['nonexistent.field']
    }
  },

  jira_get_transitions: {
    valid: {
      issueKey: 'TEST-123'
    },
    invalid: {
      issueKey: 'NONEXISTENT-123'
    }
  },

  jira_get_worklog: {
    valid: {
      issueKey: 'TEST-123',
      fields: ['author.displayName', 'timeSpent', 'comment']
    },
    minimal: {
      issueKey: 'TEST-456'
    }
  },

  jira_download_attachments: {
    valid: {
      issueKey: 'TEST-123',
      targetDir: '/tmp/attachments'
    },
    withSpecificAttachments: {
      issueKey: 'TEST-123',
      targetDir: '/tmp/attachments',
      attachmentIds: ['10001', '10002']
    }
  },

  // Search Operations
  jira_search: {
    basicJql: {
      jql: 'project = TEST',
      fields: ['summary', 'status.name', 'assignee.displayName'],
      maxResults: 50
    },
    complexJql: {
      jql: 'project = TEST AND status IN ("To Do", "In Progress") AND assignee = currentUser()',
      fields: [
        'summary',
        'description',
        'status.name',
        'priority.name',
        'assignee.displayName',
        'project.key',
        'created',
        'updated'
      ],
      maxResults: 100,
      startAt: 0
    },
    withPagination: {
      jql: 'project = TEST ORDER BY created DESC',
      fields: ['summary', 'status.name'],
      maxResults: 25,
      startAt: 50
    },
    minimal: {
      jql: 'assignee = currentUser()'
    }
  },

  jira_search_fields: {
    all: {},
    filtered: {
      searchTerm: 'custom'
    },
    customOnly: {
      customOnly: true
    }
  },

  jira_get_project_issues: {
    valid: {
      projectKey: 'TEST',
      fields: ['summary', 'status.name', 'assignee.displayName'],
      maxResults: 50
    },
    withFilters: {
      projectKey: 'TEST',
      fields: ['summary', 'status.name'],
      jql: 'status = "In Progress"',
      maxResults: 25
    }
  },

  // Project and User Operations
  jira_get_all_projects: {
    all: {
      fields: ['key', 'name', 'lead.displayName']
    },
    includeArchived: {
      includeArchived: true,
      fields: ['key', 'name', 'archived']
    },
    minimal: {}
  },

  jira_get_project_versions: {
    valid: {
      projectKey: 'TEST'
    },
    withArchived: {
      projectKey: 'TEST',
      includeArchived: true
    }
  },

  jira_get_user_profile: {
    byUsername: {
      username: 'testuser',
      fields: ['displayName', 'emailAddress', 'active']
    },
    minimal: {
      username: 'testuser'
    }
  },

  jira_get_link_types: {
    all: {}
  },

  // Agile Operations
  jira_get_agile_boards: {
    all: {
      fields: ['name', 'type', 'location.projectKey']
    },
    byType: {
      type: 'scrum',
      fields: ['name', 'type']
    },
    byProject: {
      projectKeyOrId: 'TEST',
      fields: ['name', 'type', 'location.projectName']
    }
  },

  jira_get_board_issues: {
    valid: {
      boardId: '1',
      fields: ['summary', 'status.name', 'assignee.displayName'],
      maxResults: 50
    },
    withFilters: {
      boardId: '1',
      fields: ['summary', 'status.name'],
      jql: 'sprint in openSprints()',
      maxResults: 25
    }
  },

  jira_get_sprints_from_board: {
    valid: {
      boardId: '1',
      fields: ['name', 'state', 'startDate', 'endDate']
    },
    activeOnly: {
      boardId: '1',
      state: 'active',
      fields: ['name', 'startDate', 'endDate']
    }
  },

  jira_get_sprint_issues: {
    valid: {
      sprintId: '1',
      fields: ['summary', 'status.name', 'assignee.displayName'],
      maxResults: 50
    },
    minimal: {
      sprintId: '1'
    }
  }
};

/**
 * Field Selection Test Cases
 */
export const fieldSelectionRequests = {
  simple: {
    fields: ['summary', 'status', 'priority']
  },
  nested: {
    fields: ['assignee.displayName', 'project.key', 'status.name']
  },
  complex: {
    fields: [
      'summary',
      'assignee.displayName',
      'assignee.emailAddress',
      'project.key',
      'project.name', 
      'project.lead.displayName',
      'status.name',
      'status.statusCategory.name',
      'priority.name',
      'components[0].name',
      'fixVersions[*].name'
    ]
  },
  invalid: {
    fields: ['nonexistent', 'invalid.field', 'badarray[invalid]']
  },
  mixed: {
    fields: [
      'summary',           // Valid simple
      'assignee.displayName', // Valid nested
      'nonexistent',       // Invalid
      'project.key'        // Valid nested
    ]
  }
};

/**
 * Error Scenario Requests
 */
export const errorScenarioRequests = {
  notFound: {
    issueKey: 'ERROR-404'
  },
  forbidden: {
    issueKey: 'ERROR-403'
  },
  serverError: {
    issueKey: 'ERROR-500'
  },
  invalidInput: {
    issueKey: '', // Empty issue key
    fields: null  // Invalid fields
  },
  networkError: {
    issueKey: 'NETWORK-ERROR'
  }
};