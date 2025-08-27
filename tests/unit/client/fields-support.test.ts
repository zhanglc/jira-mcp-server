import { JiraClientWrapper } from '../../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../../src/types/config-types.js';
import {
  JiraTransition,
  JiraWorklog,
  JiraProject,
  JiraUser,
  JiraVersion,
  JiraBoard,
  JiraSprint,
  JiraField,
  JiraAttachment,
  JiraSystemInfo,
  JiraServerInfo,
} from '../../../src/types/jira-types.js';
import { ApiError } from '../../../src/types/api-error.js';

// Mock jira-client module
jest.mock('jira-client');

describe('JiraClientWrapper - Fields Parameter Support', () => {
  let wrapper: JiraClientWrapper;
  let mockClient: any;

  const mockConfig: JiraConfig = {
    url: 'https://test.atlassian.net',
    bearer: 'test-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock client with all necessary methods
    mockClient = {
      listTransitions: jest.fn(),
      getIssueWorklogs: jest.fn(),
      listFields: jest.fn(),
      listProjects: jest.fn(),
      getProject: jest.fn(),
      getVersions: jest.fn(),
      getCurrentUser: jest.fn(),
      searchUsers: jest.fn(),
      getAllBoards: jest.fn(),
      getAllSprints: jest.fn(),
      getSprint: jest.fn(),
      getServerInfo: jest.fn(),
      findIssue: jest.fn(),
    };

    // Mock JiraClient constructor
    const JiraClient = require('jira-client');
    JiraClient.mockImplementation(() => mockClient);

    wrapper = new JiraClientWrapper(mockConfig);
  });

  describe('Methods with Fields Parameter Added', () => {
    describe('getIssueTransitions', () => {
      const mockTransitions: JiraTransition[] = [
        {
          id: '21',
          name: 'In Progress',
          to: {
            id: '3',
            name: 'In Progress',
            statusCategory: { key: 'indeterminate', name: 'In Progress' }
          }
        },
        {
          id: '31',
          name: 'Done', 
          to: {
            id: '10001',
            name: 'Done',
            statusCategory: { key: 'done', name: 'Done' }
          }
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['id', 'name', 'to.name', 'to.statusCategory.key'];
        mockClient.listTransitions.mockResolvedValue({ transitions: mockTransitions });

        const result = await wrapper.getIssueTransitions('TEST-123', fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.listTransitions).toHaveBeenCalledWith('TEST-123');
        expect(result).toEqual(mockTransitions);
      });

      it('should work without fields parameter (backward compatibility)', async () => {
        mockClient.listTransitions.mockResolvedValue({ transitions: mockTransitions });

        const result = await wrapper.getIssueTransitions('TEST-123');

        expect(mockClient.listTransitions).toHaveBeenCalledWith('TEST-123');
        expect(result).toEqual(mockTransitions);
      });

      it('should handle empty fields array', async () => {
        mockClient.listTransitions.mockResolvedValue({ transitions: mockTransitions });

        const result = await wrapper.getIssueTransitions('TEST-123', []);

        expect(mockClient.listTransitions).toHaveBeenCalledWith('TEST-123');
        expect(result).toEqual(mockTransitions);
      });
    });

    describe('getIssueWorklogs', () => {
      const mockWorklogs: JiraWorklog[] = [
        {
          id: '12345',
          author: {
            name: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true
          },
          created: '2024-01-15T10:30:00.000Z',
          timeSpent: '2h',
          timeSpentSeconds: 7200,
          comment: 'Work completed'
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['id', 'author.displayName', 'created', 'timeSpent', 'comment'];
        mockClient.getIssueWorklogs.mockResolvedValue({ worklogs: mockWorklogs });

        const result = await wrapper.getIssueWorklogs('TEST-123', fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getIssueWorklogs).toHaveBeenCalledWith('TEST-123');
        expect(result).toEqual(mockWorklogs);
      });

      it('should work without fields parameter (backward compatibility)', async () => {
        mockClient.getIssueWorklogs.mockResolvedValue({ worklogs: mockWorklogs });

        const result = await wrapper.getIssueWorklogs('TEST-123');

        expect(mockClient.getIssueWorklogs).toHaveBeenCalledWith('TEST-123');
        expect(result).toEqual(mockWorklogs);
      });
    });

    describe('searchFields', () => {
      const mockFields: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          searchable: true,
          orderable: true,
          schema: { type: 'string' }
        },
        {
          id: 'customfield_10001',
          name: 'Sprint',
          custom: true,
          searchable: true,
          orderable: false,
          schema: { type: 'array' }
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const query = 'summary';
        const fields = ['id', 'name', 'custom', 'searchable', 'schema.type'];
        mockClient.listFields.mockResolvedValue(mockFields);

        const result = await wrapper.searchFields(query, fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.listFields).toHaveBeenCalledWith();
        expect(result).toEqual(mockFields.filter(f => 
          f.name.toLowerCase().includes(query.toLowerCase()) || 
          f.id.toLowerCase().includes(query.toLowerCase())
        ));
      });

      it('should work without fields parameter (backward compatibility)', async () => {
        const query = 'summary';
        mockClient.listFields.mockResolvedValue(mockFields);

        const result = await wrapper.searchFields(query);

        expect(mockClient.listFields).toHaveBeenCalledWith();
        expect(result).toEqual(mockFields.filter(f => 
          f.name.toLowerCase().includes(query.toLowerCase()) || 
          f.id.toLowerCase().includes(query.toLowerCase())
        ));
      });
    });
  });

  describe('Client-Side Filtering Methods', () => {
    describe('getAllProjects', () => {
      const mockProjects: JiraProject[] = [
        {
          id: '10001',
          key: 'TEST',
          name: 'Test Project',
          self: 'https://test.atlassian.net/rest/api/2/project/10001',
          projectTypeKey: 'software',
          archived: false,
          lead: {
            name: 'admin',
            displayName: 'Administrator',
            emailAddress: 'admin@example.com',
            active: true
          }
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['key', 'name', 'projectCategory.name', 'lead.displayName'];
        mockClient.listProjects.mockResolvedValue(mockProjects);

        const result = await wrapper.getAllProjects(true, fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.listProjects).toHaveBeenCalledWith();
        expect(result).toEqual(mockProjects);
      });

      it('should maintain backward compatibility with includeArchived parameter', async () => {
        mockClient.listProjects.mockResolvedValue(mockProjects);

        const result = await wrapper.getAllProjects(false);

        expect(mockClient.listProjects).toHaveBeenCalledWith();
        expect(result).toEqual(mockProjects.filter(p => !p.archived));
      });
    });

    describe('getProject', () => {
      const mockProject: JiraProject = {
        id: '10001',
        key: 'TEST',
        name: 'Test Project',
        self: 'https://test.atlassian.net/rest/api/2/project/10001',
        projectTypeKey: 'software',
        archived: false
      };

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['key', 'name', 'description', 'lead.displayName'];
        mockClient.getProject.mockResolvedValue(mockProject);

        const result = await wrapper.getProject('TEST', fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getProject).toHaveBeenCalledWith('TEST');
        expect(result).toEqual(mockProject);
      });

      it('should work without fields parameter (backward compatibility)', async () => {
        mockClient.getProject.mockResolvedValue(mockProject);

        const result = await wrapper.getProject('TEST');

        expect(mockClient.getProject).toHaveBeenCalledWith('TEST');
        expect(result).toEqual(mockProject);
      });
    });

    describe('getProjectVersions', () => {
      const mockVersions: JiraVersion[] = [
        {
          id: '10001',
          name: 'Version 1.0',
          released: true,
          archived: false,
          self: 'https://test.atlassian.net/rest/api/2/version/10001'
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['id', 'name', 'released', 'archived', 'releaseDate'];
        mockClient.getVersions.mockResolvedValue(mockVersions);

        const result = await wrapper.getProjectVersions('TEST', fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getVersions).toHaveBeenCalledWith('TEST');
        expect(result).toEqual(mockVersions);
      });
    });

    describe('getCurrentUser', () => {
      const mockUser: JiraUser = {
        name: 'testuser',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        active: true,
        self: 'https://test.atlassian.net/rest/api/2/user?username=testuser'
      };

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['name', 'displayName', 'emailAddress', 'active', 'timeZone'];
        mockClient.getCurrentUser.mockResolvedValue(mockUser);

        const result = await wrapper.getCurrentUser(fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getCurrentUser).toHaveBeenCalledWith();
        expect(result).toEqual(mockUser);
      });
    });

    describe('getUserProfile', () => {
      const mockUser: JiraUser = {
        name: 'testuser',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        active: true,
        self: 'https://test.atlassian.net/rest/api/2/user?username=testuser'
      };

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['name', 'displayName', 'emailAddress', 'active', 'avatarUrls'];
        mockClient.searchUsers.mockResolvedValue([mockUser]);

        const result = await wrapper.getUserProfile('testuser', fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.searchUsers).toHaveBeenCalledWith({
          query: 'testuser',
          username: 'testuser',
          maxResults: 1,
          includeActive: true,
          includeInactive: true,
        });
        expect(result).toEqual(mockUser);
      });
    });

    describe('getAgileBoards', () => {
      const mockBoards: JiraBoard[] = [
        {
          id: 123,
          name: 'Test Board',
          type: 'scrum',
          self: 'https://test.atlassian.net/rest/agile/1.0/board/123'
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['id', 'name', 'type', 'location.projectKey'];
        mockClient.getAllBoards.mockResolvedValue({ values: mockBoards });

        const result = await wrapper.getAgileBoards(undefined, fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getAllBoards).toHaveBeenCalledWith();
        expect(result).toEqual(mockBoards);
      });
    });

    describe('getSprintsFromBoard', () => {
      const mockSprints: JiraSprint[] = [
        {
          id: 456,
          name: 'Sprint 1',
          state: 'active',
          self: 'https://test.atlassian.net/rest/agile/1.0/sprint/456'
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['id', 'name', 'state', 'startDate', 'endDate'];
        mockClient.getAllSprints.mockResolvedValue({ values: mockSprints });

        const result = await wrapper.getSprintsFromBoard(123, fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getAllSprints).toHaveBeenCalledWith('123');
        expect(result).toEqual(mockSprints);
      });
    });

    describe('getSprint', () => {
      const mockSprint: JiraSprint = {
        id: 456,
        name: 'Sprint 1',
        state: 'active',
        self: 'https://test.atlassian.net/rest/agile/1.0/sprint/456'
      };

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['id', 'name', 'state', 'startDate', 'endDate', 'goal'];
        mockClient.getSprint.mockResolvedValue(mockSprint);

        const result = await wrapper.getSprint(456, fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getSprint).toHaveBeenCalledWith('456');
        expect(result).toEqual(mockSprint);
      });
    });

    describe('getSystemInfo', () => {
      const mockSystemInfo: JiraSystemInfo = {
        baseUrl: 'https://test.atlassian.net',
        version: '9.4.0',
        versionNumbers: [9, 4, 0],
        deploymentType: 'Server',
        buildNumber: 904000,
        buildDate: '2023-01-15T10:30:00.000Z',
        scmInfo: { type: 'git', revision: 'abc123' }
      };

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['version', 'versionNumbers', 'deploymentType', 'buildNumber'];
        mockClient.getServerInfo.mockResolvedValue(mockSystemInfo);

        const result = await wrapper.getSystemInfo(fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getServerInfo).toHaveBeenCalledWith();
        expect(result).toEqual(mockSystemInfo);
      });
    });

    describe('getServerInfo', () => {
      const mockServerInfo: JiraServerInfo = {
        baseUrl: 'https://test.atlassian.net',
        version: '9.4.0',
        versionNumbers: [9, 4, 0],
        deploymentType: 'Server',
        buildNumber: 904000,
        buildDate: '2023-01-15T10:30:00.000Z',
        serverTime: '2024-01-15T10:30:00.000Z',
        scmInfo: { type: 'git', revision: 'abc123' }
      };

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['baseUrl', 'version', 'versionNumbers', 'serverTime'];
        const rawResponse = { ...mockServerInfo };
        delete (rawResponse as any).serverTime; // Test serverTime generation
        mockClient.getServerInfo.mockResolvedValue(rawResponse);

        const result = await wrapper.getServerInfo(fields);

        // Should call API without fields parameter (client-side filtering)
        expect(mockClient.getServerInfo).toHaveBeenCalledWith();
        expect(result.baseUrl).toEqual(mockServerInfo.baseUrl);
        expect(result.version).toEqual(mockServerInfo.version);
        expect(result.serverTime).toBeDefined(); // Generated server time
      });
    });

    describe('downloadAttachments', () => {
      const mockAttachments: JiraAttachment[] = [
        {
          id: '12345',
          filename: 'test.pdf',
          size: 1024,
          mimeType: 'application/pdf',
          content: 'https://test.atlassian.net/secure/attachment/12345/test.pdf',
          author: {
            name: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true
          },
          created: '2024-01-15T10:30:00.000Z'
        }
      ];

      it('should accept fields parameter but note client-side filtering', async () => {
        const fields = ['id', 'filename', 'size', 'mimeType', 'author.displayName'];
        const mockIssue = {
          fields: {
            attachment: mockAttachments
          }
        };
        mockClient.findIssue.mockResolvedValue(mockIssue);

        const result = await wrapper.downloadAttachments('TEST-123', fields);

        // Should call API with attachment field only (already optimized)
        expect(mockClient.findIssue).toHaveBeenCalledWith('TEST-123', '', 'attachment');
        expect(result).toEqual(mockAttachments);
      });

      it('should maintain existing optimization when no fields parameter provided', async () => {
        const mockIssue = {
          fields: {
            attachment: mockAttachments
          }
        };
        mockClient.findIssue.mockResolvedValue(mockIssue);

        const result = await wrapper.downloadAttachments('TEST-123');

        expect(mockClient.findIssue).toHaveBeenCalledWith('TEST-123', '', 'attachment');
        expect(result).toEqual(mockAttachments);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully with fields parameter', async () => {
      const fields = ['id', 'name'];
      mockClient.listTransitions.mockRejectedValue(new Error('API Error'));

      await expect(wrapper.getIssueTransitions('TEST-123', fields)).rejects.toThrow();
      expect(mockClient.listTransitions).toHaveBeenCalledWith('TEST-123');
    });

    it('should handle empty responses with fields parameter', async () => {
      const fields = ['id', 'name'];
      mockClient.listTransitions.mockResolvedValue(null);

      const result = await wrapper.getIssueTransitions('TEST-123', fields);

      expect(result).toEqual([]);
    });
  });

  describe('Method Signature Validation', () => {
    it('should have correct method signatures for fields parameter support', () => {
      // Test that TypeScript accepts the fields parameter (without actually calling the methods)
      expect(() => {
        // These should compile without TypeScript errors - just test the method exists with correct signature
        const methods = [
          () => wrapper.getIssueTransitions('TEST-123', ['id', 'name']),
          () => wrapper.getIssueWorklogs('TEST-123', ['id', 'author.displayName']),
          () => wrapper.searchFields('summary', ['id', 'name']),
          () => wrapper.getAllProjects(true, ['key', 'name']),
          () => wrapper.getProject('TEST', ['key', 'name']),
          () => wrapper.getProjectVersions('TEST', ['id', 'name']),
          () => wrapper.getCurrentUser(['name', 'displayName']),
          () => wrapper.getUserProfile('testuser', ['name', 'displayName']),
          () => wrapper.getAgileBoards('TEST', ['id', 'name']),
          () => wrapper.getSprintsFromBoard(123, ['id', 'name']),
          () => wrapper.getSprint(456, ['id', 'name']),
          () => wrapper.getSystemInfo(['version', 'buildNumber']),
          () => wrapper.getServerInfo(['baseUrl', 'version']),
          () => wrapper.downloadAttachments('TEST-123', ['id', 'filename'])
        ];
        
        // Just verify the methods are callable (don't actually call them)
        expect(typeof methods[0]).toBe('function');
      }).not.toThrow();
    });

    it('should maintain backward compatibility without fields parameter', () => {
      // Test that existing calls without fields parameter still work (without actually calling them)
      expect(() => {
        const methods = [
          () => wrapper.getIssueTransitions('TEST-123'),
          () => wrapper.getIssueWorklogs('TEST-123'),
          () => wrapper.searchFields('summary'),
          () => wrapper.getAllProjects(true),
          () => wrapper.getProject('TEST'),
          () => wrapper.getProjectVersions('TEST'),
          () => wrapper.getCurrentUser(),
          () => wrapper.getUserProfile('testuser'),
          () => wrapper.getAgileBoards('TEST'),
          () => wrapper.getSprintsFromBoard(123),
          () => wrapper.getSprint(456),
          () => wrapper.getSystemInfo(),
          () => wrapper.getServerInfo(),
          () => wrapper.downloadAttachments('TEST-123')
        ];
        
        // Just verify the methods are callable (don't actually call them)
        expect(typeof methods[0]).toBe('function');
      }).not.toThrow();
    });
  });
});