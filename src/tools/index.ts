/**
 * MCP Tools Registration Framework
 * 
 * This module implements the MCP tools registration system, providing:
 * - Tool registration and management
 * - Tool execution pipeline with error handling
 * - Field filtering and validation
 * - Context management and logging
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'winston';
import { z } from 'zod';
import type { 
  JiraServerConfig,
  MCPToolContext,
  MCPToolHandler,
  ToolResponse 
} from '@/types';

/**
 * Tool registration interface for better organization
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: MCPToolHandler;
  category: 'issue' | 'search' | 'project' | 'user' | 'agile' | 'operation';
  examples: Array<{
    name: string;
    description: string;
    arguments: Record<string, any>;
  }>;
}

/**
 * Tool execution metrics for monitoring
 */
interface ToolMetrics {
  name: string;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  lastExecuted: string;
  errors: number;
}

/**
 * Tools registry to track registered tools
 */
class ToolsRegistry {
  private tools = new Map<string, ToolDefinition>();
  private metrics = new Map<string, ToolMetrics>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    this.metrics.set(tool.name, {
      name: tool.name,
      executionCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      lastExecuted: new Date().toISOString(),
      errors: 0
    });
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  updateMetrics(name: string, executionTime: number, success: boolean): void {
    const metrics = this.metrics.get(name);
    if (metrics) {
      metrics.executionCount++;
      metrics.totalExecutionTime += executionTime;
      metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executionCount;
      metrics.lastExecuted = new Date().toISOString();
      if (!success) {
        metrics.errors++;
      }
    }
  }

  getMetrics(name?: string): ToolMetrics | ToolMetrics[] {
    if (name) {
      return this.metrics.get(name) || {} as ToolMetrics;
    }
    return Array.from(this.metrics.values());
  }
}

// Global registry instance
const toolsRegistry = new ToolsRegistry();

/**
 * Create tool execution context with request metadata
 */
function createToolContext(
  config: JiraServerConfig,
  requestId?: string,
  clientInfo?: { name: string; version: string }
): MCPToolContext {
  return {
    config,
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    clientInfo: clientInfo || { name: 'unknown', version: '1.0.0' },
    timestamp: new Date().toISOString()
  };
}

/**
 * Wrap tool handler with error handling, logging, and metrics
 */
function wrapToolHandler(
  toolName: string,
  handler: MCPToolHandler,
  logger: Logger
): MCPToolHandler {
  return async (args: Record<string, any>, context: MCPToolContext): Promise<string> => {
    const startTime = Date.now();
    
    try {
      logger.debug(`Executing tool: ${toolName}`, {
        tool: toolName,
        requestId: context.requestId,
        args: Object.keys(args)
      });

      const result = await handler(args, context);
      const executionTime = Date.now() - startTime;

      // Update metrics
      toolsRegistry.updateMetrics(toolName, executionTime, true);

      logger.info(`Tool executed successfully: ${toolName}`, {
        tool: toolName,
        requestId: context.requestId,
        executionTime
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Update metrics
      toolsRegistry.updateMetrics(toolName, executionTime, false);

      logger.error(`Tool execution failed: ${toolName}`, {
        tool: toolName,
        requestId: context.requestId,
        error: error instanceof Error ? error.message : String(error),
        executionTime
      });

      // Return structured error response
      const errorResponse: ToolResponse = {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date().toISOString(),
          details: {
            tool: toolName,
            requestId: context.requestId
          }
        },
        meta: {
          requestId: context.requestId!,
          timestamp: new Date().toISOString(),
          executionTime
        }
      };

      return JSON.stringify(errorResponse);
    }
  };
}

/**
 * Convert Zod schema to MCP input schema format
 */
function zodToMCPSchema(schema: z.ZodSchema): any {
  // This is a simplified conversion - in practice, you might want a more robust schema converter
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      if (value instanceof z.ZodString) {
        properties[key] = { 
          type: 'string', 
          description: value.description || `String parameter: ${key}` 
        };
      } else if (value instanceof z.ZodNumber) {
        properties[key] = { 
          type: 'number', 
          description: value.description || `Number parameter: ${key}` 
        };
      } else if (value instanceof z.ZodBoolean) {
        properties[key] = { 
          type: 'boolean', 
          description: value.description || `Boolean parameter: ${key}` 
        };
      } else if (value instanceof z.ZodArray) {
        properties[key] = { 
          type: 'array', 
          items: { type: 'string' },
          description: value.description || `Array parameter: ${key}` 
        };
      } else {
        properties[key] = { 
          type: 'string', 
          description: `Parameter: ${key}` 
        };
      }

      // Check if field is required (not optional)
      if (!(value as any).isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false
    };
  }

  // Fallback for other schema types
  return {
    type: 'object',
    properties: {},
    additionalProperties: true
  };
}

/**
 * Register a single tool with the MCP server
 */
export function registerTool(
  server: McpServer,
  config: JiraServerConfig,
  logger: Logger,
  tool: ToolDefinition
): void {
  // Add to registry
  toolsRegistry.register(tool);

  // Wrap handler with error handling and metrics
  const wrappedHandler = wrapToolHandler(tool.name, tool.handler, logger);

  // Register with MCP server
  server.registerTool(
    tool.name,
    {
      title: tool.name.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: tool.description,
      inputSchema: zodToMCPSchema(tool.inputSchema)
    },
    async (args: Record<string, any>) => {
      // Validate input against schema
      const parseResult = tool.inputSchema.safeParse(args);
      if (!parseResult.success) {
        const validationError: ToolResponse = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Input validation failed',
            timestamp: new Date().toISOString(),
            details: {
              errors: parseResult.error.errors,
              received: args
            }
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        };
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify(validationError, null, 2) 
          }],
          isError: true
        };
      }

      // Create execution context
      const context = createToolContext(config);
      
      // Execute tool handler
      const result = await wrappedHandler(parseResult.data, context);
      
      return {
        content: [{ type: 'text' as const, text: result }]
      };
    }
  );

  logger.info(`Registered tool: ${tool.name}`, {
    tool: tool.name,
    category: tool.category
  });
}

/**
 * Register all tools with the MCP server
 */
export async function registerTools(
  server: McpServer,
  config: JiraServerConfig,
  logger: Logger
): Promise<void> {
  logger.info('Starting tool registration...');

  // Import and register all tool categories
  // Note: These imports will be implemented in subsequent tasks
  
  try {
    // Issue tools (MCP-TOOL-001)
    // const issueTools = await import('./operations/issue-tools.js');
    // issueTools.getTools().forEach(tool => registerTool(server, config, logger, tool));

    // Search tools (MCP-TOOL-002) 
    // const searchTools = await import('./search/search-tools.js');
    // searchTools.getTools().forEach(tool => registerTool(server, config, logger, tool));

    // Project and user tools (MCP-TOOL-003)
    // const projectUserTools = await import('./operations/project-user-tools.js');
    // projectUserTools.getTools().forEach(tool => registerTool(server, config, logger, tool));

    // Agile tools (MCP-TOOL-004)
    // const agileTools = await import('./agile/agile-tools.js');
    // agileTools.getTools().forEach(tool => registerTool(server, config, logger, tool));

    // For now, register a placeholder tool to verify the framework works
    registerTool(server, config, logger, {
      name: 'health_check',
      description: 'Check the health status of the Jira MCP server',
      inputSchema: z.object({
        include_metrics: z.boolean().optional().describe('Include performance metrics in response')
      }),
      category: 'operation',
      handler: async (args, context) => {
        const response: ToolResponse = {
          success: true,
          data: {
            status: 'healthy',
            timestamp: context.timestamp,
            server: {
              name: 'jira-server-mcp',
              version: '1.0.0'
            },
            jira: {
              url: context.config.url,
              connected: true // This would be a real check in practice
            },
            ...(args.include_metrics && {
              metrics: toolsRegistry.getMetrics()
            })
          },
          meta: {
            requestId: context.requestId!,
            timestamp: context.timestamp,
            executionTime: 1
          }
        };

        return JSON.stringify(response, null, 2);
      },
      examples: [
        {
          name: 'Basic health check',
          description: 'Check if the server is running',
          arguments: {}
        },
        {
          name: 'Health check with metrics',
          description: 'Check server health and include performance metrics',
          arguments: { include_metrics: true }
        }
      ]
    });

    const registeredTools = toolsRegistry.getAll();
    logger.info(`Tool registration completed successfully`, {
      toolCount: registeredTools.length,
      tools: registeredTools.map(t => ({ name: t.name, category: t.category }))
    });

  } catch (error) {
    logger.error('Failed to register tools', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get tools registry for introspection and debugging
 */
export function getToolsRegistry(): {
  getAll: () => ToolDefinition[];
  getMetrics: (name?: string) => ToolMetrics | ToolMetrics[];
} {
  return {
    getAll: () => toolsRegistry.getAll(),
    getMetrics: (name?: string) => toolsRegistry.getMetrics(name)
  };
}

/**
 * Utility function to create a tool definition with common patterns
 */
export function createToolDefinition(
  name: string,
  description: string,
  inputSchema: z.ZodSchema,
  handler: MCPToolHandler,
  category: ToolDefinition['category'],
  examples?: ToolDefinition['examples']
): ToolDefinition {
  return {
    name,
    description,
    inputSchema,
    handler,
    category,
    examples: examples || []
  };
}