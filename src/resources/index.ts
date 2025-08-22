/**
 * MCP Resources Registration Framework
 * 
 * This module implements the MCP resources registration system for Jira field definitions.
 * Provides 7 field definition resources for MCP clients to understand available fields.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'winston';
import type { JiraServerConfig, ResourceUriPattern } from '@/types';
import { ResourceManager } from './resource-manager';
import { FieldDefinitionProvider } from './field-definitions';
import { ResourceCache } from './resource-cache';

/**
 * Resource registry storing all available resources
 */
const resourceRegistry = new Map<ResourceUriPattern, ResourceHandler>();

/**
 * Resource handler interface
 */
export interface ResourceHandler {
  uri: ResourceUriPattern;
  name: string;
  description: string;
  handler: (params?: Record<string, any>) => Promise<any>;
  cacheEnabled: boolean;
  cacheTtl?: number;
}

/**
 * Register all resources with the MCP server
 * 
 * @param server - The MCP server instance
 * @param config - Server configuration
 * @param logger - Logger instance
 */
export async function registerResources(
  server: McpServer,
  config: JiraServerConfig,
  logger: Logger
): Promise<void> {
  logger.info('Registering MCP resources framework...');
  
  try {
    // Initialize resource components
    const cache = new ResourceCache(logger);
    const fieldProvider = new FieldDefinitionProvider(config, logger);
    const resourceManager = new ResourceManager(cache, fieldProvider, logger);
    
    // Register field definition resources
    await registerFieldDefinitionResources(resourceManager, logger);
    
    // Register resources with MCP server
    for (const [uri, info] of resourceManager.getRegisteredResources()) {
      server.registerResource(
        info.name,
        uri,
        {
          name: info.name,
          description: info.description,
          mimeType: 'application/json'
        },
        async () => {
          const content = await resourceManager.getResource(uri);
          return content.contents[0];
        }
      );
    }
    
    logger.info(`Successfully registered ${resourceRegistry.size} MCP resources`);
    
  } catch (error) {
    logger.error('Failed to register MCP resources:', error);
    throw error;
  }
}

/**
 * Register all field definition resources
 */
async function registerFieldDefinitionResources(
  resourceManager: ResourceManager,
  logger: Logger
): Promise<void> {
  const resources: Array<{
    uri: ResourceUriPattern;
    name: string;
    description: string;
  }> = [
    {
      uri: 'jira://fields/issue',
      name: 'Issue Fields',
      description: 'Available field definitions for Jira issues, including nested fields and custom fields'
    },
    {
      uri: 'jira://fields/project',
      name: 'Project Fields',
      description: 'Available field definitions for Jira projects'
    },
    {
      uri: 'jira://fields/user',
      name: 'User Fields',
      description: 'Available field definitions for Jira users'
    },
    {
      uri: 'jira://fields/board',
      name: 'Board Fields',
      description: 'Available field definitions for Jira agile boards'
    },
    {
      uri: 'jira://fields/sprint',
      name: 'Sprint Fields',
      description: 'Available field definitions for Jira sprints'
    },
    {
      uri: 'jira://fields/worklog',
      name: 'Worklog Fields',
      description: 'Available field definitions for Jira worklog entries'
    },
    {
      uri: 'jira://fields/custom',
      name: 'Custom Fields',
      description: 'Common custom field definitions for Jira Server/DC environments'
    }
  ];
  
  for (const resource of resources) {
    await resourceManager.registerResource(resource.uri, resource.name, resource.description);
    logger.debug(`Registered resource: ${resource.uri}`);
  }
}

/**
 * Export the resource registry for testing
 */
export { resourceRegistry };

/**
 * Export resource components
 */
export { ResourceManager } from './resource-manager';
export { FieldDefinitionProvider } from './field-definitions';
export { ResourceCache } from './resource-cache';
export { ResourceValidator } from './resource-validator';