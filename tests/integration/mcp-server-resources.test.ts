import { JiraMcpServer } from '@/server/jira-mcp-server';
import { JiraResourceHandler } from '@/server/resources/resource-handler';

// Mock JiraResourceHandler for testing
jest.mock('@/server/resources/resource-handler');

describe('JiraMcpServer - Resource Integration', () => {
  let server: JiraMcpServer;
  let mockResourceHandler: jest.Mocked<JiraResourceHandler>;

  beforeEach(() => {
    // Create a mock instance
    mockResourceHandler = {
      listResources: jest.fn(),
      readResource: jest.fn(),
      validateFieldPaths: jest.fn(),
    } as any;

    // Mock the constructor to return our mock
    (
      JiraResourceHandler as jest.MockedClass<typeof JiraResourceHandler>
    ).mockImplementation(() => mockResourceHandler);

    server = new JiraMcpServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Resource Handler Integration', () => {
    it('should initialize with resource handler', () => {
      expect(JiraResourceHandler).toHaveBeenCalledTimes(1);
    });

    it('should have resource handler accessible for testing', () => {
      const resourceHandler = server.getResourceHandler();
      expect(resourceHandler).toBeDefined();
      expect(resourceHandler).toBe(mockResourceHandler);
    });
  });

  describe('ListResources Request', () => {
    it('should delegate to resource handler for listing resources', async () => {
      const expectedResources = {
        resources: [
          {
            uri: 'jira://issue/fields',
            name: 'Jira Issue Fields',
            description: 'Complete field definitions for Jira issue entities',
            mimeType: 'application/json',
          },
        ],
      };

      mockResourceHandler.listResources.mockResolvedValue(expectedResources);

      // Test by calling the resource handler directly through the public method
      const resourceHandler = server.getResourceHandler();
      const result = await resourceHandler.listResources();

      expect(mockResourceHandler.listResources).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResources);
    });

    it('should handle resource handler errors gracefully', async () => {
      const error = new Error('Resource handler failed');
      mockResourceHandler.listResources.mockRejectedValue(error);

      const resourceHandler = server.getResourceHandler();

      await expect(resourceHandler.listResources()).rejects.toThrow(
        'Resource handler failed'
      );
    });
  });

  describe('ReadResource Request', () => {
    it('should delegate to resource handler for reading resource content', async () => {
      const uri = 'jira://issue/fields';
      const expectedContent = {
        contents: [
          {
            type: 'text' as const,
            text: '{"entityType": "issue", "fields": {}}',
            mimeType: 'application/json',
          },
        ],
      };

      mockResourceHandler.readResource.mockResolvedValue(expectedContent);

      const resourceHandler = server.getResourceHandler();
      const result = await resourceHandler.readResource(uri);

      expect(mockResourceHandler.readResource).toHaveBeenCalledWith(uri);
      expect(result).toEqual(expectedContent);
    });

    it('should handle invalid resource URIs', async () => {
      const uri = 'invalid-uri';
      const error = new Error(`Invalid resource URI format: ${uri}`);

      mockResourceHandler.readResource.mockRejectedValue(error);

      const resourceHandler = server.getResourceHandler();

      await expect(resourceHandler.readResource(uri)).rejects.toThrow(
        'Invalid resource URI format: invalid-uri'
      );
    });

    it('should handle unknown resource URIs', async () => {
      const uri = 'jira://unknown/fields';
      const error = new Error(`Unknown resource URI: ${uri}`);

      mockResourceHandler.readResource.mockRejectedValue(error);

      const resourceHandler = server.getResourceHandler();

      await expect(resourceHandler.readResource(uri)).rejects.toThrow(
        'Unknown resource URI: jira://unknown/fields'
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing tool functionality', () => {
      // Ensure all backward compatibility methods are still available
      expect(typeof server.handleGetIssue).toBe('function');
      expect(typeof server.handleSearchIssues).toBe('function');
      expect(typeof server.handleGetAllProjects).toBe('function');
      expect(typeof server.handleGetCurrentUser).toBe('function');
      expect(typeof server.handleGetAgileBoards).toBe('function');
      expect(typeof server.handleSearchFields).toBe('function');
      expect(typeof server.handleGetSystemInfo).toBe('function');
    });

    it('should have tool handler accessible', () => {
      const toolHandler = server.getToolHandler();
      expect(toolHandler).toBeDefined();
    });
  });

  describe('Server Capabilities', () => {
    it('should have both tool and resource handlers initialized', () => {
      const toolHandler = server.getToolHandler();
      const resourceHandler = server.getResourceHandler();

      expect(toolHandler).toBeDefined();
      expect(resourceHandler).toBeDefined();
    });
  });

  describe('End-to-End Resource Protocol', () => {
    it('should support complete resource discovery and access workflow', async () => {
      // Setup mock responses
      const resourceList = {
        resources: [
          {
            uri: 'jira://issue/fields',
            name: 'Jira Issue Fields',
            description:
              'Complete field definitions for Jira issue entities. Includes 42 fields with nested access paths.',
            mimeType: 'application/json',
          },
        ],
      };

      const resourceContent = {
        contents: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                entityType: 'issue',
                totalFields: 42,
                fields: {
                  key: {
                    id: 'key',
                    name: 'Key',
                    type: 'string',
                    accessPaths: [
                      { path: 'key', type: 'string', description: 'Issue key' },
                    ],
                  },
                },
                pathIndex: {
                  key: 'key',
                },
              },
              null,
              2
            ),
            mimeType: 'application/json',
          },
        ],
      };

      mockResourceHandler.listResources.mockResolvedValue(resourceList);
      mockResourceHandler.readResource.mockResolvedValue(resourceContent);

      const resourceHandler = server.getResourceHandler();

      // Test 1: List available resources
      const listResult = await resourceHandler.listResources();
      expect(listResult).toEqual(resourceList);

      // Test 2: Read specific resource content
      const readResult = await resourceHandler.readResource(
        'jira://issue/fields'
      );
      expect(readResult).toEqual(resourceContent);

      // Verify complete workflow
      expect(mockResourceHandler.listResources).toHaveBeenCalledTimes(1);
      expect(mockResourceHandler.readResource).toHaveBeenCalledWith(
        'jira://issue/fields'
      );
    });
  });
});
