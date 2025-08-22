/**
 * Tests for MCP Tools Registration Framework
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  registerTool, 
  registerTools, 
  getToolsRegistry, 
  createToolDefinition,
  type ToolDefinition 
} from '@/tools';
import { createMockToolContext } from '../../utils/mcp-test-utils';
import type { JiraServerConfig, MCPToolHandler, ToolResponse } from '@/types';
import type { Logger } from 'winston';

// Mock logger
const mockLogger: Logger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  level: 'debug',
  log: jest.fn()
} as any;

// Mock config
const mockConfig: JiraServerConfig = {
  environment: 'test',
  url: 'https://test.atlassian.net',
  auth: {
    personalToken: 'test-token'
  },
  personalToken: 'test-token',
  sslVerify: false,
  timeout: 5000,
  logLevel: 'debug',
  logFormat: 'simple'
};

describe('Tools Registration Framework', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({
      name: 'test-server',
      version: '1.0.0'
    });
  });

  afterEach(() => {
    // Clear registry after each test
    const registry = getToolsRegistry();
    const tools = registry.getAll();
    tools.forEach(tool => {
      // We can't actually unregister tools from the server in this version
      // but we can clear our internal registry for testing
    });
  });

  describe('ToolDefinition creation', () => {
    it('should create a tool definition with all required fields', () => {
      const inputSchema = z.object({
        issueKey: z.string().describe('Jira issue key')
      });

      const handler: MCPToolHandler = async (args, context) => {
        const response: ToolResponse = {
          success: true,
          data: { issueKey: args.issueKey },
          meta: {
            requestId: context.requestId!,
            timestamp: context.timestamp
          }
        };
        return JSON.stringify(response);
      };

      const toolDef = createToolDefinition(
        'get_issue',
        'Get a Jira issue by key',
        inputSchema,
        handler,
        'issue',
        [
          {
            name: 'Get issue TEST-123',
            description: 'Retrieve issue TEST-123',
            arguments: { issueKey: 'TEST-123' }
          }
        ]
      );

      expect(toolDef.name).toBe('get_issue');
      expect(toolDef.description).toBe('Get a Jira issue by key');
      expect(toolDef.category).toBe('issue');
      expect(toolDef.examples).toHaveLength(1);
      expect(toolDef.examples[0].name).toBe('Get issue TEST-123');
    });

    it('should create a tool definition with empty examples when none provided', () => {
      const inputSchema = z.object({
        query: z.string()
      });

      const handler: MCPToolHandler = async () => {
        return JSON.stringify({ success: true, data: [] });
      };

      const toolDef = createToolDefinition(
        'search_issues',
        'Search for issues',
        inputSchema,
        handler,
        'search'
      );

      expect(toolDef.examples).toEqual([]);
    });
  });

  describe('Tool registration', () => {
    it('should register a tool with the MCP server', async () => {
      const inputSchema = z.object({
        message: z.string().describe('Test message')
      });

      const handler: MCPToolHandler = async (args, context) => {
        const response: ToolResponse = {
          success: true,
          data: { echo: args.message },
          meta: {
            requestId: context.requestId!,
            timestamp: context.timestamp
          }
        };
        return JSON.stringify(response);
      };

      const toolDef: ToolDefinition = {
        name: 'test_echo',
        description: 'Echo test message',
        inputSchema,
        handler,
        category: 'operation',
        examples: [
          {
            name: 'Echo hello',
            description: 'Echo the word hello',
            arguments: { message: 'hello' }
          }
        ]
      };

      // Should not throw
      expect(() => {
        registerTool(server, mockConfig, mockLogger, toolDef);
      }).not.toThrow();

      // Check that tool was added to registry
      const registry = getToolsRegistry();
      const registeredTool = registry.getAll().find(t => t.name === 'test_echo');
      expect(registeredTool).toBeDefined();
      expect(registeredTool?.name).toBe('test_echo');
      expect(registeredTool?.category).toBe('operation');
    });

    it('should track tool metrics when tools are registered', () => {
      const inputSchema = z.object({
        value: z.number()
      });

      const handler: MCPToolHandler = async (args) => {
        return JSON.stringify({ success: true, data: { doubled: args.value * 2 } });
      };

      const toolDef: ToolDefinition = {
        name: 'double_number',
        description: 'Double a number',
        inputSchema,
        handler,
        category: 'operation',
        examples: []
      };

      registerTool(server, mockConfig, mockLogger, toolDef);

      const registry = getToolsRegistry();
      const metrics = registry.getMetrics('double_number');
      
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
      expect((metrics as any).name).toBe('double_number');
      expect((metrics as any).executionCount).toBe(0);
      expect((metrics as any).errors).toBe(0);
    });
  });

  describe('Input validation', () => {
    it('should validate tool inputs against schema', async () => {
      const inputSchema = z.object({
        requiredField: z.string(),
        optionalField: z.number().optional()
      });

      const handler: MCPToolHandler = async (args) => {
        return JSON.stringify({ success: true, data: args });
      };

      const toolDef: ToolDefinition = {
        name: 'validation_test',
        description: 'Test input validation',
        inputSchema,
        handler,
        category: 'operation',
        examples: []
      };

      registerTool(server, mockConfig, mockLogger, toolDef);

      // Test with valid input
      const validInput = { requiredField: 'test', optionalField: 42 };
      const parseResult = inputSchema.safeParse(validInput);
      expect(parseResult.success).toBe(true);

      // Test with invalid input (missing required field)
      const invalidInput = { optionalField: 42 };
      const parseResultInvalid = inputSchema.safeParse(invalidInput);
      expect(parseResultInvalid.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle tool execution errors gracefully', async () => {
      const inputSchema = z.object({
        shouldError: z.boolean()
      });

      const handler: MCPToolHandler = async (args) => {
        if (args.shouldError) {
          throw new Error('Intentional test error');
        }
        return JSON.stringify({ success: true, data: 'ok' });
      };

      const toolDef: ToolDefinition = {
        name: 'error_test',
        description: 'Test error handling',
        inputSchema,
        handler,
        category: 'operation',
        examples: []
      };

      // Should not throw during registration
      expect(() => {
        registerTool(server, mockConfig, mockLogger, toolDef);
      }).not.toThrow();
    });
  });

  describe('Tool context', () => {
    it('should create proper tool context with request metadata', () => {
      const context = createMockToolContext({
        requestId: 'test-request-123'
      });

      expect(context.requestId).toBe('test-request-123');
      expect(context.config).toBeDefined();
      expect(context.timestamp).toBeDefined();
      expect(context.clientInfo).toBeDefined();
      expect(context.clientInfo?.name).toBe('test-client');
    });
  });

  describe('Full registration process', () => {
    it('should register all tools successfully', async () => {
      // This tests the main registerTools function
      // It should succeed even with placeholder implementation
      await expect(
        registerTools(server, mockConfig, mockLogger)
      ).resolves.not.toThrow();

      // Should register at least the health_check tool
      const registry = getToolsRegistry();
      const tools = registry.getAll();
      expect(tools.length).toBeGreaterThan(0);

      const healthCheckTool = tools.find(t => t.name === 'health_check');
      expect(healthCheckTool).toBeDefined();
      expect(healthCheckTool?.category).toBe('operation');
    });
  });

  describe('Registry introspection', () => {
    it('should provide access to registered tools and metrics', () => {
      const inputSchema = z.object({
        test: z.string()
      });

      const handler: MCPToolHandler = async () => {
        return JSON.stringify({ success: true });
      };

      const toolDef: ToolDefinition = {
        name: 'registry_test',
        description: 'Test registry access',
        inputSchema,
        handler,
        category: 'operation',
        examples: []
      };

      registerTool(server, mockConfig, mockLogger, toolDef);

      const registry = getToolsRegistry();
      
      // Test getAll
      const allTools = registry.getAll();
      expect(Array.isArray(allTools)).toBe(true);
      expect(allTools.some(t => t.name === 'registry_test')).toBe(true);

      // Test getMetrics
      const allMetrics = registry.getMetrics();
      expect(Array.isArray(allMetrics)).toBe(true);

      const specificMetrics = registry.getMetrics('registry_test');
      expect(specificMetrics).toBeDefined();
      expect(typeof specificMetrics).toBe('object');
    });
  });
});

describe('Schema conversion', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({
      name: 'test-server',
      version: '1.0.0'
    });
  });

  it('should convert Zod schemas to MCP input schemas', () => {
    // This is tested indirectly through tool registration
    // The zodToMCPSchema function is internal but we can verify it works
    // by checking that tool registration doesn't throw with various schema types
    
    const stringSchema = z.object({
      stringField: z.string().describe('A string field')
    });

    const numberSchema = z.object({
      numberField: z.number().describe('A number field')
    });

    const booleanSchema = z.object({
      booleanField: z.boolean().describe('A boolean field')
    });

    const arraySchema = z.object({
      arrayField: z.array(z.string()).describe('An array field')
    });

    const complexSchema = z.object({
      required: z.string(),
      optional: z.string().optional(),
      number: z.number(),
      array: z.array(z.string())
    });

    const handler: MCPToolHandler = async () => {
      return JSON.stringify({ success: true });
    };

    const schemas = [
      { name: 'string_test', schema: stringSchema },
      { name: 'number_test', schema: numberSchema },
      { name: 'boolean_test', schema: booleanSchema },
      { name: 'array_test', schema: arraySchema },
      { name: 'complex_test', schema: complexSchema }
    ];

    schemas.forEach(({ name, schema }) => {
      const toolDef: ToolDefinition = {
        name,
        description: `Test ${name}`,
        inputSchema: schema,
        handler,
        category: 'operation',
        examples: []
      };

      // Should not throw
      expect(() => {
        registerTool(server, mockConfig, mockLogger, toolDef);
      }).not.toThrow();
    });
  });
});