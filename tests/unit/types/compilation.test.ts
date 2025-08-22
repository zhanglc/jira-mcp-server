/**
 * Type Compilation Tests
 * 
 * Verifies that all type definitions compile correctly and can be used together.
 */

import {
  // Common types
  type DeepPartial,
  type RequireOne,
  type Optional,
  type BaseError,
  type JiraError,
  type MCPError,
  type ValidationError,
  type SearchResult,
  type PaginationOptions,
  type LogLevel,
  type Environment,

  // Config types
  type JiraServerConfig,
  type AuthConfig,
  type ConnectionConfig,
  type LoggingConfig,
  type MCPServerConfig,
  DEFAULT_CONFIG,

  // Jira API types
  type JiraIssue,
  type JiraUser,
  type JiraProject,
  type JiraBoard,
  type JiraSprint,
  type JiraWorklog,
  type JiraAttachment,
  type JiraSearchResponse,
  type JiraSearchOptions,

  // MCP types
  type JiraMCPTool,
  type JiraMCPResource,
  type MCPToolContext,
  type MCPResourceContext,
  type ToolInputSchema,
  type ResourceUriPattern,
  type IssueToolArgs,
  type SearchToolArgs,

  // Resource types
  type FieldDefinition,
  type FieldSchema,
  type ResourceMetadata,
  type IssueFieldsResource,
  type CustomFieldDefinition,
} from '@/types/index';

describe('Type Compilation Tests', () => {
  describe('Common Types', () => {
    it('should compile utility types correctly', () => {
      interface TestInterface {
        required: string;
        optional?: number;
        nested: {
          value: boolean;
        };
      }

      // Test DeepPartial
      const partialTest: DeepPartial<TestInterface> = {
        nested: {
          // value is optional due to DeepPartial
        }
      };

      // Test RequireOne
      const requireOneTest: RequireOne<TestInterface, 'required' | 'optional'> = {
        required: 'test',
        nested: { value: true }
      };

      // Test Optional
      const optionalTest: Optional<TestInterface, 'required'> = {
        nested: { value: true }
        // required is now optional
      };

      expect(partialTest).toBeDefined();
      expect(requireOneTest).toBeDefined();
      expect(optionalTest).toBeDefined();
    });

    it('should compile error types correctly', () => {
      const baseError: BaseError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        timestamp: new Date().toISOString()
      };

      const jiraError: JiraError = {
        ...baseError,
        type: 'jira_api_error',
        statusCode: 404
      };

      const mcpError: MCPError = {
        ...baseError,
        type: 'mcp_error',
        toolName: 'test_tool'
      };

      const validationError: ValidationError = {
        ...baseError,
        type: 'validation_error',
        field: 'username',
        value: '',
        constraints: ['required']
      };

      expect(baseError).toBeDefined();
      expect(jiraError.type).toBe('jira_api_error');
      expect(mcpError.type).toBe('mcp_error');
      expect(validationError.type).toBe('validation_error');
    });

    it('should compile search and pagination types correctly', () => {
      const paginationOptions: PaginationOptions = {
        startAt: 0,
        maxResults: 50
      };

      const searchResult: SearchResult<string> = {
        items: ['item1', 'item2'],
        startAt: 0,
        maxResults: 50,
        total: 2
      };

      expect(paginationOptions.startAt).toBe(0);
      expect(searchResult.total).toBe(2);
    });

    it('should compile environment and logging types correctly', () => {
      const environment: Environment = 'development';
      const logLevel: LogLevel = 'info';
      
      const loggingConfig: LoggingConfig = {
        level: logLevel,
        format: 'json',
        console: {
          enabled: true,
          colorize: false
        }
      };

      expect(environment).toBe('development');
      expect(logLevel).toBe('info');
      expect(loggingConfig.level).toBe('info');
    });
  });

  describe('Configuration Types', () => {
    it('should compile configuration interfaces correctly', () => {
      const authConfig: AuthConfig = {
        personalToken: 'test-token',
        tokenType: 'bearer'
      };

      const connectionConfig: ConnectionConfig = {
        timeout: 30000,
        sslVerify: true,
        keepAlive: true
      };

      const mcpServerConfig: MCPServerConfig = {
        name: 'test-server',
        version: '1.0.0',
        capabilities: {
          tools: true,
          resources: true
        }
      };

      expect(authConfig.personalToken).toBe('test-token');
      expect(connectionConfig.timeout).toBe(30000);
      expect(mcpServerConfig.capabilities.tools).toBe(true);
    });

    it('should have valid default configuration', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(DEFAULT_CONFIG.environment).toBe('development');
      expect(DEFAULT_CONFIG.connection?.timeout).toBe(30000);
      expect(DEFAULT_CONFIG.mcp?.name).toBe('jira-server-mcp');
    });
  });

  describe('Jira API Types', () => {
    it('should compile Jira entity types correctly', () => {
      const jiraUser: Partial<JiraUser> = {
        id: '12345',
        self: 'http://example.com/user/12345',
        name: 'testuser',
        key: 'testuser',
        displayName: 'Test User',
        active: true,
        avatarUrls: {
          '16x16': 'http://example.com/avatar16.png',
          '24x24': 'http://example.com/avatar24.png',
          '32x32': 'http://example.com/avatar32.png',
          '48x48': 'http://example.com/avatar48.png'
        }
      };

      const jiraProject: Partial<JiraProject> = {
        id: '10000',
        self: 'http://example.com/project/10000',
        key: 'TEST',
        name: 'Test Project',
        components: [],
        issueTypes: [],
        versions: [],
        roles: {}
      };

      expect(jiraUser.name).toBe('testuser');
      expect(jiraProject.key).toBe('TEST');
    });

    it('should compile Agile types correctly', () => {
      const jiraBoard: Partial<JiraBoard> = {
        id: '1',
        self: 'http://example.com/board/1',
        name: 'Test Board',
        type: 'scrum',
        location: {
          type: 'project',
          projectId: 10000
        }
      };

      const jiraSprint: Partial<JiraSprint> = {
        id: '1',
        self: 'http://example.com/sprint/1',
        name: 'Sprint 1',
        state: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      };

      const jiraWorklog: Partial<JiraWorklog> = {
        id: '10000',
        self: 'http://example.com/worklog/10000',
        timeSpent: '2h',
        timeSpentSeconds: 7200,
        started: new Date().toISOString(),
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      const jiraAttachment: Partial<JiraAttachment> = {
        id: '10000',
        self: 'http://example.com/attachment/10000',
        filename: 'test.pdf',
        size: 1024,
        mimeType: 'application/pdf',
        content: 'http://example.com/attachment/content/10000',
        created: new Date().toISOString()
      };

      expect(jiraBoard.type).toBe('scrum');
      expect(jiraSprint.state).toBe('active');
      expect(jiraWorklog.timeSpentSeconds).toBe(7200);
      expect(jiraAttachment.mimeType).toBe('application/pdf');
    });

    it('should compile search response types correctly', () => {
      const searchResponse: Partial<JiraSearchResponse> = {
        issues: [],
        startAt: 0,
        maxResults: 50,
        total: 0,
        expand: 'names,schema'
      };

      const searchOptions: JiraSearchOptions = {
        jql: 'project = TEST',
        fields: ['summary', 'status'],
        maxResults: 100,
        startAt: 0
      };

      expect(searchResponse.total).toBe(0);
      expect(searchOptions.jql).toBe('project = TEST');
    });
  });

  describe('MCP Types', () => {
    it('should compile MCP tool types correctly', () => {
      const toolInputSchema: ToolInputSchema = {
        type: 'object',
        properties: {
          issueKey: {
            type: 'string',
            description: 'The issue key'
          }
        },
        required: ['issueKey']
      };

      const toolContext: MCPToolContext = {
        config: {
          environment: 'test',
          url: 'http://test.com',
          auth: { personalToken: 'token' },
          connection: { timeout: 30000, sslVerify: true },
          personalToken: 'token',
          sslVerify: true,
          timeout: 30000,
          logLevel: 'info',
          logFormat: 'simple'
        },
        timestamp: new Date().toISOString()
      };

      const issueToolArgs: IssueToolArgs = {
        issueKey: 'TEST-123',
        fields: ['summary', 'status']
      };

      expect(toolInputSchema.type).toBe('object');
      expect(toolContext.config.environment).toBe('test');
      expect(issueToolArgs.issueKey).toBe('TEST-123');
    });

    it('should compile resource URI patterns correctly', () => {
      const issueFieldsUri: ResourceUriPattern = 'jira://fields/issue';
      const projectFieldsUri: ResourceUriPattern = 'jira://fields/project';
      const customFieldsUri: ResourceUriPattern = 'jira://fields/custom';

      expect(issueFieldsUri).toBe('jira://fields/issue');
      expect(projectFieldsUri).toBe('jira://fields/project');
      expect(customFieldsUri).toBe('jira://fields/custom');
    });

    it('should compile MCP resource context correctly', () => {
      const resourceContext: MCPResourceContext = {
        config: {
          environment: 'test',
          url: 'http://test.com',
          auth: { personalToken: 'token' },
          connection: { timeout: 30000, sslVerify: true },
          personalToken: 'token',
          sslVerify: true,
          timeout: 30000,
          logLevel: 'info',
          logFormat: 'simple'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req-123'
      };

      expect(resourceContext.config.environment).toBe('test');
      expect(resourceContext.requestId).toBe('req-123');
    });
  });

  describe('Resource Types', () => {
    it('should compile field definition types correctly', () => {
      const fieldDefinition: FieldDefinition = {
        type: 'string',
        description: 'A string field',
        required: true,
        example: 'example value'
      };

      const customFieldDefinition: CustomFieldDefinition = {
        type: 'string',
        description: 'Custom field',
        fieldId: 'customfield_10008',
        fieldName: 'Epic Link',
        fieldType: 'com.pyxis.greenhopper.jira:gh-epic-link',
        isGlobal: true,
        isLocked: false
      };

      const fieldSchema: FieldSchema = {
        fields: {
          summary: fieldDefinition
        },
        metadata: {
          entityType: 'issue',
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          source: 'jira-server',
          customFieldsIncluded: false,
          totalFields: 1
        }
      };

      expect(fieldDefinition.type).toBe('string');
      expect(customFieldDefinition.fieldId).toBe('customfield_10008');
      expect(fieldSchema.metadata.entityType).toBe('issue');
    });

    it('should compile resource metadata correctly', () => {
      const resourceMetadata: ResourceMetadata = {
        uri: 'jira://fields/issue',
        name: 'Issue Fields',
        description: 'Field definitions for issues',
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        contentType: 'application/json'
      };

      expect(resourceMetadata.uri).toBe('jira://fields/issue');
      expect(resourceMetadata.contentType).toBe('application/json');
    });

    it('should compile issue fields resource correctly', () => {
      const issueFieldsResource: IssueFieldsResource = {
        uri: 'jira://fields/issue',
        content: {
          fields: {
            summary: {
              type: 'string',
              description: 'Issue summary'
            }
          },
          metadata: {
            entityType: 'issue',
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            source: 'jira-server',
            customFieldsIncluded: false,
            totalFields: 1
          }
        },
        includes: {
          coreFields: true,
          customFields: false,
          agileFields: false,
          timeTrackingFields: false,
          attachmentFields: false,
          commentFields: false,
          linkFields: false
        }
      };

      expect(issueFieldsResource.uri).toBe('jira://fields/issue');
      expect(issueFieldsResource.content.metadata.entityType).toBe('issue');
      expect(issueFieldsResource.includes.coreFields).toBe(true);
    });
  });

  describe('Type Integration', () => {
    it('should allow types to work together correctly', () => {
      // Test that types can be used together in complex scenarios
      const config: Partial<JiraServerConfig> = {
        ...DEFAULT_CONFIG,
        url: 'http://test-jira.com',
        auth: {
          personalToken: 'test-token'
        }
      };

      const searchArgs: SearchToolArgs = {
        jql: 'project = TEST AND status = "In Progress"',
        fields: ['summary', 'assignee.displayName', 'status.name'],
        maxResults: 50
      };

      const mockSearchResult: SearchResult<Partial<JiraIssue>> = {
        issues: [
          {
            id: '10001',
            key: 'TEST-1',
            self: 'http://test-jira.com/issue/10001',
            fields: {
              summary: 'Test issue',
              status: {
                id: '3',
                self: 'http://test-jira.com/status/3',
                name: 'In Progress',
                description: 'Issue is being worked on',
                iconUrl: 'http://test-jira.com/status-icon.png',
                statusCategory: {
                  self: 'http://test-jira.com/statuscategory/4',
                  id: 4,
                  key: 'indeterminate',
                  colorName: 'yellow',
                  name: 'In Progress'
                }
              },
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              issuetype: {
                id: '10001',
                self: 'http://test-jira.com/issuetype/10001',
                name: 'Task',
                description: 'A task',
                iconUrl: 'http://test-jira.com/task-icon.png',
                subtask: false
              },
              project: {
                id: '10000',
                self: 'http://test-jira.com/project/10000',
                key: 'TEST',
                name: 'Test Project',
                components: [],
                issueTypes: [],
                versions: [],
                roles: {},
                avatarUrls: {
                  '16x16': 'http://test-jira.com/project-icon-16.png',
                  '24x24': 'http://test-jira.com/project-icon-24.png',
                  '32x32': 'http://test-jira.com/project-icon-32.png',
                  '48x48': 'http://test-jira.com/project-icon-48.png'
                }
              }
            }
          }
        ],
        startAt: 0,
        maxResults: 50,
        total: 1
      };

      expect(config.url).toBe('http://test-jira.com');
      expect(searchArgs.fields).toContain('assignee.displayName');
      expect(mockSearchResult.issues?.[0]?.key).toBe('TEST-1');
    });
  });
});

// Type-only tests (compilation verification)
describe('Type-only Compilation', () => {
  it('should compile without runtime execution', () => {
    // These are compile-time only tests
    const _testTypes = (): void => {
      const _config: JiraServerConfig = {} as JiraServerConfig;
      const _user: JiraUser = {} as JiraUser;
      const _issue: JiraIssue = {} as JiraIssue;
      const _tool: JiraMCPTool = {} as JiraMCPTool;
      const _resource: JiraMCPResource = {} as JiraMCPResource;
      const _fieldDef: FieldDefinition = {} as FieldDefinition;
      
      // If this compiles, the types are structurally correct
      expect(true).toBe(true);
    };

    // Function is defined but not called - compilation test only
    expect(_testTypes).toBeDefined();
  });
});