import {
  ISSUE_FIELD_DEFINITIONS,
  PROJECT_FIELD_DEFINITIONS,
  USER_FIELD_DEFINITIONS,
  AGILE_FIELD_DEFINITIONS,
} from './static-definitions/index.js';
import type { McpResource } from '../../types/mcp-types.js';
import type {
  ResourceDefinition,
  BatchValidationResult,
  AccessPath,
} from '../../types/field-definition.js';

/**
 * JiraResourceHandler implements the MCP Resource protocol for Jira field definitions.
 * Provides resource discovery, content access, and field path validation capabilities.
 *
 * Currently supports static field definitions with future hybrid dynamic support.
 */
export class JiraResourceHandler {
  private static readonly RESOURCE_DEFINITIONS: Record<
    string,
    ResourceDefinition
  > = {
    'jira://issue/fields': ISSUE_FIELD_DEFINITIONS,
    'jira://project/fields': PROJECT_FIELD_DEFINITIONS,
    'jira://user/fields': USER_FIELD_DEFINITIONS,
    'jira://agile/fields': AGILE_FIELD_DEFINITIONS,
  };

  /**
   * List all available MCP resources.
   * Returns metadata for resource discovery by MCP clients.
   */
  async listResources(): Promise<{ resources: McpResource[] }> {
    const resources: McpResource[] = Object.entries(
      JiraResourceHandler.RESOURCE_DEFINITIONS
    ).map(([uri, definition]) => ({
      uri,
      name: this.getResourceDisplayName(definition.entityType),
      description: this.getResourceDescription(definition),
      mimeType: 'application/json',
    }));

    return { resources };
  }

  /**
   * Read content of a specific resource by URI.
   * Returns the complete field definitions as JSON content.
   */
  async readResource(
    uri: string
  ): Promise<{
    contents: Array<{ type: 'text'; text: string; mimeType: string; uri: string }>;
  }> {
    if (!uri) {
      throw new Error('Resource URI is required');
    }

    if (!this.isValidResourceUri(uri)) {
      throw new Error(`Invalid resource URI format: ${uri}`);
    }

    const definition = JiraResourceHandler.RESOURCE_DEFINITIONS[uri];
    if (!definition) {
      throw new Error(`Unknown resource URI: ${uri}`);
    }

    try {
      const jsonContent = JSON.stringify(definition, null, 2);

      return {
        contents: [
          {
            type: 'text',
            text: jsonContent,
            mimeType: 'application/json',
            uri: uri,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read resource: ${errorMessage}`);
    }
  }

  /**
   * Validate an array of field paths for a given entity type.
   * Uses static field definitions with O(1) path lookups via pathIndex.
   */
  validateFieldPaths(
    entityType: string,
    paths: string[]
  ): BatchValidationResult {
    // Check if entity type is supported
    const resourceUri = `jira://${entityType}/fields`;
    const definition = JiraResourceHandler.RESOURCE_DEFINITIONS[resourceUri];

    if (!definition) {
      return {
        isValid: false,
        validPaths: [],
        invalidPaths: paths,
        error: `Unknown entity type: ${entityType}. Supported types: ${this.getSupportedEntityTypes().join(', ')}`,
      };
    }

    const validPaths: string[] = [];
    const invalidPaths: string[] = [];
    const pathInfo: Record<
      string,
      { fieldId: string; type: string; description: string }
    > = {};
    const suggestions: Record<string, string[]> = {};

    // Validate each path
    for (const path of paths) {
      if (this.isValidFieldPath(path, definition)) {
        validPaths.push(path);

        // Add path information
        const fieldId = definition.pathIndex[path];
        if (fieldId) {
          const field = definition.fields[fieldId];
          if (field) {
            const accessPath = field.accessPaths.find(ap => ap.path === path);
            if (accessPath) {
              pathInfo[path] = {
                fieldId,
                type: accessPath.type,
                description: accessPath.description,
              };
            }
          }
        }
      } else {
        invalidPaths.push(path);

        // Generate suggestions for similar paths
        const similarPaths = this.findSimilarPaths(path, definition);
        if (similarPaths.length > 0) {
          suggestions[path] = similarPaths;
        }
      }
    }

    const result: BatchValidationResult = {
      isValid: invalidPaths.length === 0,
      validPaths,
      invalidPaths,
    };

    if (Object.keys(pathInfo).length > 0) {
      result.pathInfo = pathInfo;
    }

    if (Object.keys(suggestions).length > 0) {
      result.suggestions = suggestions;
    }

    return result;
  }

  /**
   * Check if a field path is valid for the given resource definition.
   * Supports both direct path lookups and custom field pattern matching.
   */
  private isValidFieldPath(
    path: string,
    definition: ResourceDefinition
  ): boolean {
    // Check direct path index lookup (O(1))
    const hasPath = definition.pathIndex[path];
    const result = Boolean(hasPath);

    if (hasPath) {
      return true;
    }

    // Check custom field pattern (customfield_XXXXX)
    if (this.isCustomFieldPattern(path)) {
      return true;
    }

    return false;
  }

  /**
   * Check if a path matches the custom field pattern.
   */
  private isCustomFieldPattern(path: string): boolean {
    return /^customfield_\d+$/.test(path);
  }

  /**
   * Find similar paths for suggestions using simple string similarity.
   */
  private findSimilarPaths(
    targetPath: string,
    definition: ResourceDefinition
  ): string[] {
    const allPaths = Object.keys(definition.pathIndex);
    const suggestions: string[] = [];

    for (const path of allPaths) {
      if (this.calculateSimilarity(targetPath, path) > 0.6) {
        suggestions.push(path);
      }
    }

    // Sort by similarity and return top 3
    return suggestions
      .sort(
        (a, b) =>
          this.calculateSimilarity(targetPath, b) -
          this.calculateSimilarity(targetPath, a)
      )
      .slice(0, 3);
  }

  /**
   * Calculate string similarity using simple character-based approach.
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    // Simple character matching similarity
    let matches = 0;
    const minLen = Math.min(len1, len2);

    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  /**
   * Check if a URI follows the valid resource URI pattern.
   */
  private isValidResourceUri(uri: string): boolean {
    // Check pattern case-insensitively, but allow case-sensitive matching to fail in lookup
    return /^jira:\/\/\w+\/\w+$/i.test(uri);
  }

  /**
   * Get supported entity types from available resource definitions.
   */
  private getSupportedEntityTypes(): string[] {
    return Object.keys(JiraResourceHandler.RESOURCE_DEFINITIONS)
      .map(uri => uri.split('/')[2])
      .filter((entityType): entityType is string => Boolean(entityType));
  }

  /**
   * Generate display name for resource based on entity type.
   */
  private getResourceDisplayName(entityType: string): string {
    const titleCase = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    return `Jira ${titleCase} Fields`;
  }

  /**
   * Generate description for resource based on definition metadata.
   */
  private getResourceDescription(definition: ResourceDefinition): string {
    return `Complete field definitions for Jira ${definition.entityType} entities. Includes ${definition.totalFields} fields with nested access paths for comprehensive data access.`;
  }
}
