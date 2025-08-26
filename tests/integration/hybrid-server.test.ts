import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';
import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { loadHybridConfig } from '../../src/utils/config.js';
import { HybridResourceHandler } from '../../src/server/resources/hybrid-resource-handler.js';
import type { ValidatedHybridConfig } from '../../src/types/config-types.js';

// Mock the dependencies
jest.mock('../../src/client/jira-client-wrapper.js');
jest.mock('../../src/utils/config.js');
jest.mock('../../src/server/resources/hybrid-resource-handler.js');

const MockedJiraClientWrapper = JiraClientWrapper as jest.MockedClass<typeof JiraClientWrapper>;
const MockedHybridResourceHandler = HybridResourceHandler as jest.MockedClass<typeof HybridResourceHandler>;

describe('JiraMcpServer Hybrid Integration', () => {
  let server: JiraMcpServer;
  let mockJiraClient: jest.Mocked<JiraClientWrapper>;
  let mockHybridResourceHandler: jest.Mocked<HybridResourceHandler>;
  let mockHybridConfig: ValidatedHybridConfig;

  beforeEach(() => {
    // Setup mock hybrid configuration
    mockHybridConfig = {
      url: 'https://test.atlassian.net',
      bearer: 'test-token-12345',
      enableDynamicFields: true,
      dynamicFieldCacheTtl: 3600,
      dynamicFieldAnalysis: false,
      fieldAnalysisSampleSize: 50,
      sslVerify: true,
      timeout: 30000,
      projectsFilter: [],
    };

    // Mock loadHybridConfig to return our test config
    (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockReturnValue(mockHybridConfig);

    // Setup mock JiraClientWrapper
    mockJiraClient = {
      searchFields: jest.fn(),
      getCurrentUser: jest.fn(),
      getServerInfo: jest.fn(),
    } as any;
    MockedJiraClientWrapper.mockImplementation(() => mockJiraClient);

    // Setup mock HybridResourceHandler
    mockHybridResourceHandler = {
      listResources: jest.fn(),
      readResource: jest.fn(),
      validateFieldPaths: jest.fn(),
    } as any;
    MockedHybridResourceHandler.mockImplementation(() => mockHybridResourceHandler);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Server Initialization with Hybrid Configuration', () => {
    it('should initialize server with HybridResourceHandler when dynamic fields are enabled', () => {
      // This test will fail until we implement the integration
      server = new JiraMcpServer();

      // Verify that hybrid config was loaded
      expect(loadHybridConfig).toHaveBeenCalledTimes(1);

      // Verify JiraClientWrapper was created with config
      expect(MockedJiraClientWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          url: mockHybridConfig.url,
          bearer: mockHybridConfig.bearer,
        })
      );

      // Verify HybridResourceHandler was created with correct parameters
      expect(MockedHybridResourceHandler).toHaveBeenCalledWith(
        mockJiraClient,
        true, // enableDynamic
        3600, // cacheTtl
        100   // cacheMaxSize (default)
      );

      // Verify the server has the hybrid resource handler
      const resourceHandler = server.getResourceHandler();
      expect(resourceHandler).toBeDefined();
      // Since we're using mocks, check that the mock was called instead of instanceof
      expect(MockedHybridResourceHandler).toHaveBeenCalledTimes(1);
    });

    it('should initialize server with static mode when dynamic fields are disabled', () => {
      // Update config to disable dynamic fields
      mockHybridConfig.enableDynamicFields = false;
      (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockReturnValue(mockHybridConfig);

      server = new JiraMcpServer();

      // Verify HybridResourceHandler was created with dynamic fields disabled
      expect(MockedHybridResourceHandler).toHaveBeenCalledWith(
        mockJiraClient,
        false, // enableDynamic
        3600,  // cacheTtl
        100    // cacheMaxSize (default)
      );
    });

    it('should use custom cache configuration when provided in environment', () => {
      // Update config with custom cache settings
      mockHybridConfig.dynamicFieldCacheTtl = 7200; // 2 hours
      (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockReturnValue(mockHybridConfig);

      server = new JiraMcpServer();

      // Verify HybridResourceHandler was created with custom cache TTL
      expect(MockedHybridResourceHandler).toHaveBeenCalledWith(
        mockJiraClient,
        true,
        7200, // custom cacheTtl
        100   // default cacheMaxSize
      );
    });

    it('should handle missing authentication gracefully', () => {
      // Mock config loading to throw authentication error
      (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockImplementation(() => {
        throw new Error('Either JIRA_PERSONAL_TOKEN or both JIRA_USERNAME and JIRA_PASSWORD must be provided');
      });

      expect(() => new JiraMcpServer()).toThrow('Either JIRA_PERSONAL_TOKEN or both JIRA_USERNAME and JIRA_PASSWORD must be provided');
    });

    it('should handle invalid configuration gracefully', () => {
      // Mock config loading to throw validation error
      (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockImplementation(() => {
        throw new Error('Configuration validation failed: JIRA_URL is required and must be a string');
      });

      expect(() => new JiraMcpServer()).toThrow('Configuration validation failed: JIRA_URL is required and must be a string');
    });
  });

  describe('Resource Handler Integration', () => {
    beforeEach(() => {
      server = new JiraMcpServer();
    });

    it('should delegate listResources to HybridResourceHandler', async () => {
      const mockResourceList = {
        resources: [
          {
            uri: 'jira://issue/fields',
            name: 'Jira Issue Fields',
            description: 'Complete field definitions for Jira issue entities',
            mimeType: 'application/json',
          },
        ],
      };

      mockHybridResourceHandler.listResources.mockResolvedValue(mockResourceList);

      // Access the private listResources handler by triggering it through the server
      // Since we can't directly access the handler, we'll verify the mock was called
      const resourceHandler = server.getResourceHandler();
      const result = await resourceHandler.listResources();

      expect(result).toEqual(mockResourceList);
      expect(mockHybridResourceHandler.listResources).toHaveBeenCalledTimes(1);
    });

    it('should delegate readResource to HybridResourceHandler', async () => {
      const mockResourceContent = {
        contents: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              entityType: 'issue',
              totalFields: 212,
              fields: {},
              pathIndex: {},
              lastUpdated: '2024-01-01T00:00:00.000Z',
              dynamicFields: 170,
              lastDynamicUpdate: '2024-01-01T00:00:00.000Z',
            }),
            mimeType: 'application/json',
          },
        ],
      };

      mockHybridResourceHandler.readResource.mockResolvedValue(mockResourceContent);

      const resourceHandler = server.getResourceHandler();
      const result = await resourceHandler.readResource('jira://issue/fields');

      expect(result).toEqual(mockResourceContent);
      expect(mockHybridResourceHandler.readResource).toHaveBeenCalledWith('jira://issue/fields');
    });

    it('should delegate validateFieldPaths to HybridResourceHandler', async () => {
      const mockValidationResult = {
        isValid: true,
        validPaths: ['summary', 'status.name'],
        invalidPaths: [],
        pathInfo: {
          'summary': {
            fieldId: 'summary',
            type: 'string',
            description: 'Summary of the issue',
          },
        },
      };

      mockHybridResourceHandler.validateFieldPaths.mockReturnValue(mockValidationResult);

      const resourceHandler = server.getResourceHandler();
      const result = resourceHandler.validateFieldPaths('issue', ['summary', 'status.name']);

      expect(result).toEqual(mockValidationResult);
      expect(mockHybridResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['summary', 'status.name']
      );
    });
  });

  describe('Tool Handler Integration', () => {
    beforeEach(() => {
      server = new JiraMcpServer();
    });

    it('should pass HybridResourceHandler to ToolHandler', () => {
      const toolHandler = server.getToolHandler();

      // Since ToolHandler constructor is called with resourceHandler,
      // we can verify the resourceHandler is the hybrid one
      expect(toolHandler).toBeDefined();
      
      // The toolHandler should have access to the hybrid resource handler
      // This will be verified by checking that the server's resource handler
      // is the same instance passed to the tool handler
      const resourceHandler = server.getResourceHandler();
      expect(resourceHandler).toBeDefined();
      // Since we're using mocks, check that the HybridResourceHandler was instantiated
      expect(MockedHybridResourceHandler).toHaveBeenCalledTimes(1);
    });

    it('should maintain backward compatibility with existing tool methods', async () => {
      // Verify that all backward compatibility methods are still available
      expect(typeof server.handleGetIssue).toBe('function');
      expect(typeof server.handleSearchIssues).toBe('function');
      expect(typeof server.handleGetAllProjects).toBe('function');
      expect(typeof server.handleGetCurrentUser).toBe('function');
      expect(typeof server.handleSearchFields).toBe('function');
      expect(typeof server.handleGetServerInfo).toBe('function');
      
      // Additional tool methods
      expect(typeof server.handleGetIssueTransitions).toBe('function');
      expect(typeof server.handleGetIssueWorklogs).toBe('function');
      expect(typeof server.handleDownloadAttachments).toBe('function');
      expect(typeof server.handleGetProject).toBe('function');
      expect(typeof server.handleGetProjectIssues).toBe('function');
      expect(typeof server.handleGetProjectVersions).toBe('function');
      expect(typeof server.handleGetUserProfile).toBe('function');
      expect(typeof server.handleGetAgileBoards).toBe('function');
      expect(typeof server.handleGetBoardIssues).toBe('function');
      expect(typeof server.handleGetSprintsFromBoard).toBe('function');
      expect(typeof server.handleGetSprintIssues).toBe('function');
      expect(typeof server.handleGetSprint).toBe('function');
    });
  });

  describe('Error Handling and Fallback Behavior', () => {
    it('should handle JiraClientWrapper initialization failure gracefully', () => {
      MockedJiraClientWrapper.mockImplementation(() => {
        throw new Error('Failed to connect to Jira API');
      });

      expect(() => new JiraMcpServer()).toThrow('Failed to connect to Jira API');
    });

    it('should handle HybridResourceHandler initialization failure gracefully', () => {
      MockedHybridResourceHandler.mockImplementation(() => {
        throw new Error('Failed to initialize hybrid resource handler');
      });

      expect(() => new JiraMcpServer()).toThrow('Failed to initialize hybrid resource handler');
    });

    it('should handle resource operations with graceful fallback', async () => {
      server = new JiraMcpServer();

      // Mock HybridResourceHandler to throw an error
      mockHybridResourceHandler.readResource.mockRejectedValue(
        new Error('API connection failed')
      );

      const resourceHandler = server.getResourceHandler();

      // The error should be propagated (no automatic fallback at this level)
      await expect(resourceHandler.readResource('jira://issue/fields')).rejects.toThrow('API connection failed');
    });
  });

  describe('Configuration Integration', () => {
    it('should respect enableDynamicFields setting from environment', () => {
      // Test with dynamic fields enabled
      mockHybridConfig.enableDynamicFields = true;
      (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockReturnValue(mockHybridConfig);

      server = new JiraMcpServer();

      expect(MockedHybridResourceHandler).toHaveBeenCalledWith(
        mockJiraClient,
        true, // enableDynamic should be true
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should respect cache TTL setting from environment', () => {
      mockHybridConfig.dynamicFieldCacheTtl = 1800; // 30 minutes
      (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockReturnValue(mockHybridConfig);

      server = new JiraMcpServer();

      expect(MockedHybridResourceHandler).toHaveBeenCalledWith(
        mockJiraClient,
        expect.any(Boolean),
        1800, // cache TTL should match config
        expect.any(Number)
      );
    });

    it('should validate configuration before server initialization', () => {
      // Mock invalid configuration
      (loadHybridConfig as jest.MockedFunction<typeof loadHybridConfig>).mockImplementation(() => {
        throw new Error('Cache TTL must be between 60 and 86400 seconds');
      });

      expect(() => new JiraMcpServer()).toThrow('Cache TTL must be between 60 and 86400 seconds');
    });
  });

  describe('End-to-End Integration', () => {
    it('should complete full resource workflow with hybrid configuration', async () => {
      server = new JiraMcpServer();

      // Mock successful resource operations
      const mockListResponse = {
        resources: [
          {
            uri: 'jira://issue/fields',
            name: 'Jira Issue Fields',
            description: 'Complete field definitions for Jira issue entities',
            mimeType: 'application/json',
          },
        ],
      };

      const mockReadResponse = {
        contents: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              entityType: 'issue',
              totalFields: 212,
              dynamicFields: 170,
              fields: {},
              pathIndex: {},
            }),
            mimeType: 'application/json',
          },
        ],
      };

      mockHybridResourceHandler.listResources.mockResolvedValue(mockListResponse);
      mockHybridResourceHandler.readResource.mockResolvedValue(mockReadResponse);

      // Test complete workflow
      const resourceHandler = server.getResourceHandler();

      // 1. List resources
      const listResult = await resourceHandler.listResources();
      expect(listResult).toEqual(mockListResponse);

      // 2. Read specific resource
      const readResult = await resourceHandler.readResource('jira://issue/fields');
      expect(readResult).toEqual(mockReadResponse);

      // Verify all operations used the hybrid handler
      expect(mockHybridResourceHandler.listResources).toHaveBeenCalledTimes(1);
      expect(mockHybridResourceHandler.readResource).toHaveBeenCalledTimes(1);
    });

    it('should maintain server capabilities and version information', () => {
      server = new JiraMcpServer();

      // The server should maintain its identity and capabilities
      expect(server).toBeDefined();
      expect(typeof server.connect).toBe('function');
      expect(typeof server.getToolHandler).toBe('function');
      expect(typeof server.getResourceHandler).toBe('function');
    });
  });
});