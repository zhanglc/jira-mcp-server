import { JiraMcpServer } from '../../../src/server/jira-mcp-server.js';
import { HybridResourceHandler } from '../../../src/server/resources/hybrid-resource-handler.js';
import { JiraClientWrapper } from '../../../src/client/jira-client-wrapper.js';

// Mock loadHybridConfig to avoid needing real environment variables
jest.mock('../../../src/utils/config.js', () => ({
  loadHybridConfig: jest.fn(() => ({
    url: 'https://test.atlassian.net',
    bearer: 'test-token-12345',
    enableDynamicFields: true,
    dynamicFieldCacheTtl: 3600,
    dynamicFieldAnalysis: false,
    fieldAnalysisSampleSize: 50,
    sslVerify: true,
    timeout: 30000,
    projectsFilter: [],
  })),
}));

// Mock JiraClientWrapper to avoid real API calls
jest.mock('../../../src/client/jira-client-wrapper.js', () => ({
  JiraClientWrapper: jest.fn().mockImplementation(() => ({
    searchFields: jest.fn().mockResolvedValue([]),
    getCurrentUser: jest.fn(),
    getServerInfo: jest.fn(),
  })),
}));

describe('JiraMcpServer Hybrid Integration (Real Implementation)', () => {
  let server: JiraMcpServer;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (server) {
      // Clean up any resources if needed
    }
  });

  describe('Real Implementation Verification', () => {
    it('should instantiate HybridResourceHandler with real classes', () => {
      server = new JiraMcpServer();

      // Verify that the resource handler is actually a HybridResourceHandler
      const resourceHandler = server.getResourceHandler();
      expect(resourceHandler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should properly initialize JiraClientWrapper', () => {
      server = new JiraMcpServer();

      // Verify JiraClientWrapper was instantiated with correct config
      expect(JiraClientWrapper).toHaveBeenCalledWith({
        url: 'https://test.atlassian.net',
        bearer: 'test-token-12345',
      });
    });

    it('should pass JiraClient to HybridResourceHandler', () => {
      server = new JiraMcpServer();

      const resourceHandler = server.getResourceHandler();
      
      // The resource handler should be properly initialized
      expect(resourceHandler).toBeDefined();
      expect(resourceHandler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should maintain server structure and capabilities', () => {
      server = new JiraMcpServer();

      // Verify all expected methods exist
      expect(typeof server.connect).toBe('function');
      expect(typeof server.getToolHandler).toBe('function');
      expect(typeof server.getResourceHandler).toBe('function');

      // Verify backward compatibility methods
      expect(typeof server.handleGetIssue).toBe('function');
      expect(typeof server.handleSearchIssues).toBe('function');
      expect(typeof server.handleGetCurrentUser).toBe('function');
    });

    it('should handle dynamic fields disabled configuration', () => {
      // Mock config with dynamic fields disabled
      const { loadHybridConfig } = require('../../../src/utils/config.js');
      loadHybridConfig.mockReturnValueOnce({
        url: 'https://test.atlassian.net',
        bearer: 'test-token-12345',
        enableDynamicFields: false,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: false,
        fieldAnalysisSampleSize: 50,
        sslVerify: true,
        timeout: 30000,
        projectsFilter: [],
      });

      server = new JiraMcpServer();

      // Should still create HybridResourceHandler but with dynamic fields disabled
      const resourceHandler = server.getResourceHandler();
      expect(resourceHandler).toBeInstanceOf(HybridResourceHandler);
    });
  });

  describe('Resource Operations', () => {
    beforeEach(() => {
      server = new JiraMcpServer();
    });

    it('should provide listResources functionality', async () => {
      const resourceHandler = server.getResourceHandler();
      
      // Should be able to call listResources without error
      const result = await resourceHandler.listResources();
      
      expect(result).toBeDefined();
      expect(result.resources).toBeDefined();
      expect(Array.isArray(result.resources)).toBe(true);
    });

    it('should provide readResource functionality', async () => {
      const resourceHandler = server.getResourceHandler();
      
      // Should be able to call readResource for valid URI
      const result = await resourceHandler.readResource('jira://issue/fields');
      
      expect(result).toBeDefined();
      expect(result.contents).toBeDefined();
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents.length).toBeGreaterThan(0);
      expect(result.contents[0].type).toBe('text');
      expect(result.contents[0].mimeType).toBe('application/json');
    });

    it('should provide validateFieldPaths functionality', () => {
      const resourceHandler = server.getResourceHandler();
      
      // Should be able to call validateFieldPaths
      const result = resourceHandler.validateFieldPaths('issue', ['summary', 'status']);
      
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.validPaths)).toBe(true);
      expect(Array.isArray(result.invalidPaths)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw configuration errors during initialization', () => {
      // Mock loadHybridConfig to throw an error
      const { loadHybridConfig } = require('../../../src/utils/config.js');
      loadHybridConfig.mockImplementationOnce(() => {
        throw new Error('Missing required environment variable: JIRA_URL');
      });

      expect(() => new JiraMcpServer()).toThrow('Missing required environment variable: JIRA_URL');
    });

    it('should throw client initialization errors', () => {
      // Mock JiraClientWrapper to throw an error
      const MockedJiraClientWrapper = JiraClientWrapper as jest.MockedClass<typeof JiraClientWrapper>;
      MockedJiraClientWrapper.mockImplementationOnce(() => {
        throw new Error('Invalid authentication credentials');
      });

      expect(() => new JiraMcpServer()).toThrow('Invalid authentication credentials');
    });
  });
});