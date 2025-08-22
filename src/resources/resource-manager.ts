/**
 * Resource Manager - Core resource management and routing
 * 
 * Handles resource registration, URI routing, and content delivery
 */

import type { Logger } from 'winston';
import type { 
  ResourceUriPattern, 
  ResourceMetadata
} from '@/types';
import type { ResourceCache } from './resource-cache';
import type { FieldDefinitionProvider } from './field-definitions';
import { ResourceValidator } from './resource-validator';

export class ResourceManager {
  private resources = new Map<ResourceUriPattern, ResourceInfo>();
  private validator: ResourceValidator;
  
  constructor(
    private cache: ResourceCache,
    private fieldProvider: FieldDefinitionProvider,
    private logger: Logger
  ) {
    this.validator = new ResourceValidator(logger);
  }

  /**
   * Register a resource with the manager
   */
  async registerResource(
    uri: ResourceUriPattern,
    name: string,
    description: string
  ): Promise<void> {
    // Validate URI before registration
    const uriValidation = this.validator.validateUri(uri);
    if (!uriValidation.valid) {
      throw new Error(`Invalid resource URI: ${uriValidation.error}`);
    }

    const resourceInfo: ResourceInfo = {
      uri,
      name,
      description,
      registeredAt: new Date().toISOString(),
      handler: this.createResourceHandler(uri)
    };
    
    this.resources.set(uri, resourceInfo);
    this.logger.debug(`Registered resource: ${uri}`);
  }

  /**
   * List all available resources
   */
  async listResources(): Promise<{ resources: ResourceMetadata[] }> {
    const resources: ResourceMetadata[] = [];
    
    for (const [uri, info] of this.resources) {
      const metadata: ResourceMetadata = {
        uri,
        name: info.name,
        description: info.description,
        version: '1.0.0',
        lastModified: info.registeredAt,
        contentType: 'application/json',
        cacheControl: {
          maxAge: 3600, // 1 hour
          private: false,
          noStore: false
        }
      };
      resources.push(metadata);
    }
    
    return { resources };
  }

  /**
   * Get resource content by URI
   */
  async getResource(uri: ResourceUriPattern, requestOrigin?: string): Promise<any> {
    const resourceInfo = this.resources.get(uri);
    if (!resourceInfo) {
      throw new Error(`Resource not found: ${uri}`);
    }

    // Validate access
    const accessValidation = this.validator.validateAccess(uri, requestOrigin);
    if (!accessValidation.allowed) {
      throw new Error(`Access denied for resource ${uri}: ${accessValidation.reason}`);
    }

    // Check cache first
    const cached = await this.cache.get(uri);
    if (cached) {
      this.logger.debug(`Serving cached resource: ${uri}`);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(cached.content, null, 2)
          }
        ]
      };
    }

    // Generate content
    try {
      const content = await resourceInfo.handler();
      
      // Validate content if it's a field schema
      if (content.fields && content.metadata) {
        const validation = this.validator.validateFieldSchema(content);
        if (!validation.valid) {
          this.logger.error(`Field schema validation failed for ${uri}:`, validation.errors);
          // Still proceed but log warnings
        }
        
        if (validation.warnings.length > 0) {
          this.logger.warn(`Field schema warnings for ${uri}:`, validation.warnings);
        }
      }

      // Check content limits
      const limitsValidation = this.validator.validateContentLimits(content);
      if (limitsValidation.warnings.length > 0) {
        this.logger.warn(`Content limits warnings for ${uri}:`, limitsValidation.warnings);
      }
      
      // Cache the result
      await this.cache.set(uri, content, {
        uri,
        name: resourceInfo.name,
        description: resourceInfo.description,
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        contentType: 'application/json'
      });

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(content, null, 2)
          }
        ]
      };
    } catch (error) {
      this.logger.error(`Failed to generate resource content for ${uri}:`, error);
      throw error;
    }
  }

  /**
   * Create a resource handler for a specific URI
   */
  private createResourceHandler(uri: ResourceUriPattern): () => Promise<any> {
    switch (uri) {
      case 'jira://fields/issue':
        return () => this.fieldProvider.getIssueFields();
      case 'jira://fields/project':
        return () => this.fieldProvider.getProjectFields();
      case 'jira://fields/user':
        return () => this.fieldProvider.getUserFields();
      case 'jira://fields/board':
        return () => this.fieldProvider.getBoardFields();
      case 'jira://fields/sprint':
        return () => this.fieldProvider.getSprintFields();
      case 'jira://fields/worklog':
        return () => this.fieldProvider.getWorklogFields();
      case 'jira://fields/custom':
        return () => this.fieldProvider.getCustomFields();
      default:
        throw new Error(`Unknown resource URI: ${uri}`);
    }
  }

  /**
   * Clear resource cache
   */
  async clearCache(uri?: ResourceUriPattern): Promise<void> {
    if (uri) {
      await this.cache.delete(uri);
      this.logger.debug(`Cleared cache for resource: ${uri}`);
    } else {
      await this.cache.clear();
      this.logger.debug('Cleared all resource cache');
    }
  }

  /**
   * Get resource registry for debugging
   */
  getRegisteredResources(): Map<ResourceUriPattern, ResourceInfo> {
    return new Map(this.resources);
  }
}

/**
 * Internal resource information
 */
interface ResourceInfo {
  uri: ResourceUriPattern;
  name: string;
  description: string;
  registeredAt: string;
  handler: () => Promise<any>;
}