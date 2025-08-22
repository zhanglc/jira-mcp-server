/**
 * MCP Server Implementation
 * 
 * This module implements the main MCP server logic, including:
 * - Tool registration and handling
 * - Resource registration and handling  
 * - Request/response processing
 * - Error handling and logging
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Logger } from 'winston';
import type { JiraServerConfig } from './types/config';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';

/**
 * Create and configure the MCP server
 */
export async function createMCPServer(
  config: JiraServerConfig,
  logger: Logger
): Promise<McpServer> {
  const server = new McpServer(
    {
      name: 'jira-server-mcp',
      version: '1.0.0',
    },
    {
      // Enable notification debouncing for better performance
      debouncedNotificationMethods: [
        'notifications/tools/list_changed',
        'notifications/resources/list_changed',
        'notifications/prompts/list_changed'
      ]
    }
  );

  // Register tools and resources
  await registerTools(server, config, logger);
  await registerResources(server, config, logger);

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server created and connected');
  return server;
}