import { JiraClientWrapper } from '../../client/jira-client-wrapper.js';
import { ApiError } from '../../types/api-error.js';
import { loadConfig } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import { FieldFilter } from '../../utils/field-filter.js';
import { ToolArgs, ToolResponse } from '../../types/mcp-types.js';
import { JiraResourceHandler } from '../resources/resource-handler.js';
import { HybridResourceHandler } from '../resources/hybrid-resource-handler.js';
import type { BatchValidationResult } from '../../types/field-definition.js';

/**
 * MCP Tool Handler for Jira Server
 *
 * Handles all CallTool requests for Jira MCP Server tools.
 * Organizes tool handlers by category: Issue, Project, User, Agile, and System.
 */
export class ToolHandler {
  private jiraClient?: JiraClientWrapper;
  private resourceHandler?: JiraResourceHandler;

  constructor(
    jiraClient?: JiraClientWrapper,
    resourceHandler?: JiraResourceHandler
  ) {
    if (jiraClient) {
      this.jiraClient = jiraClient;
    }
    if (resourceHandler) {
      this.resourceHandler = resourceHandler;
    }
  }

  /**
   * Check if the resource handler supports enhanced validation.
   */
  private isHybridResourceHandler(): boolean {
    return this.resourceHandler !== undefined && this.resourceHandler instanceof HybridResourceHandler;
  }

  /**
   * Get resource handler as HybridResourceHandler (with type assertion).
   * Should only be called after isHybridResourceHandler() returns true.
   */
  private getHybridResourceHandler(): HybridResourceHandler {
    return this.resourceHandler as HybridResourceHandler;
  }

  /**
   * Main entry point for handling tool calls
   * Delegates to specific handler methods based on tool name
   */
  async handleTool(name: string, args: ToolArgs): Promise<ToolResponse> {
    switch (name) {
      // Issue tools
      case 'getIssue':
        return await this.handleGetIssue(args);
      case 'getIssueTransitions':
        return await this.handleGetIssueTransitions(args);
      case 'searchIssues':
        return await this.handleSearchIssues(args);
      case 'getIssueWorklogs':
        return await this.handleGetIssueWorklogs(args);
      case 'downloadAttachments':
        return await this.handleDownloadAttachments(args);

      // Project tools
      case 'getAllProjects':
        return await this.handleGetAllProjects(args);
      case 'getProject':
        return await this.handleGetProject(args);
      case 'getProjectIssues':
        return await this.handleGetProjectIssues(args);
      case 'getProjectVersions':
        return await this.handleGetProjectVersions(args);

      // User tools
      case 'getCurrentUser':
        return await this.handleGetCurrentUser(args);
      case 'getUserProfile':
        return await this.handleGetUserProfile(args);

      // Agile tools
      case 'getAgileBoards':
        return await this.handleGetAgileBoards(args);
      case 'getBoardIssues':
        return await this.handleGetBoardIssues(args);
      case 'getSprintsFromBoard':
        return await this.handleGetSprintsFromBoard(args);
      case 'getSprintIssues':
        return await this.handleGetSprintIssues(args);
      case 'getSprint':
        return await this.handleGetSprint(args);

      // System tools
      case 'searchFields':
        return await this.handleSearchFields(args);
      case 'getSystemInfo':
        return await this.handleGetSystemInfo(args);
      case 'getServerInfo':
        return await this.handleGetServerInfo(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Ensures Jira client is initialized with validated configuration
   * @throws Error if configuration validation fails
   */
  private ensureJiraClient(): void {
    if (!this.jiraClient) {
      try {
        const config = loadConfig(); // loadConfig now includes validateConfig
        this.jiraClient = new JiraClientWrapper(config);
      } catch (error) {
        logger.error('Failed to initialize Jira client:', error);
        throw new ApiError(
          `Configuration error: ${error instanceof Error ? error.message : 'Unknown configuration error'}`,
          500,
          error
        );
      }
    }
  }

  /**
   * Centralized error handling for all tool methods
   * Eliminates code duplication and ensures consistent error handling
   */
  private handleToolError(error: unknown, toolName: string): never {
    logger.error(`Error in ${toolName}:`, error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Internal server error', 500, error);
  }

  /**
   * Validates field paths for issue-related operations and returns filtered valid fields.
   * Uses enhanced validation when available, with intelligent suggestions and metadata.
   *
   * @param fields Array of field paths to validate
   * @returns Object containing valid fields and warning message if any fields were filtered
   */
  private async validateAndFilterFields(fields: string[]): Promise<{
    validFields: string[];
    warningMessage?: string;
  }> {
    if (!this.resourceHandler) {
      // If no resource handler available, return all fields as-is (backward compatibility)
      return { validFields: fields };
    }

    try {
      let validation: BatchValidationResult | { isValid: boolean; validPaths: string[]; invalidPaths: string[]; suggestions: Record<string, string[]> };

      // Use enhanced validation with static suggestions if available
      if (this.isHybridResourceHandler()) {
        validation = this.getHybridResourceHandler().validateFieldPathsWithSuggestions('issue', fields);
      } else {
        validation = this.resourceHandler!.validateFieldPaths('issue', fields);
      }

      if (validation.isValid) {
        // All fields are valid
        return { validFields: fields };
      }

      if (validation.validPaths.length === 0) {
        // No valid fields - throw error with static suggestions
        const errorMessage = 'All provided fields are invalid.';
        const suggestions = this.formatFieldSuggestions(validation);
        throw new ApiError(`${errorMessage}${suggestions}`, 400);
      }

      // Some fields are invalid - filter and warn
      const warningMessage = this.formatFieldValidationWarning(validation);
      return {
        validFields: validation.validPaths,
        warningMessage,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Log validation error but don't fail the request
      logger.error('Field validation error:', error);
      return { validFields: fields };
    }
  }

  /**
   * Formats field validation warnings with static suggestions
   */
  private formatFieldValidationWarning(
    validation: BatchValidationResult | { isValid: boolean; validPaths: string[]; invalidPaths: string[]; suggestions: Record<string, string[]> }
  ): string {
    const invalidFields = validation.invalidPaths.join(', ');
    let message = `WARNING: Some fields were invalid and filtered out.\nInvalid fields: ${invalidFields}`;

    if ('suggestions' in validation && validation.suggestions && Object.keys(validation.suggestions).length > 0) {
      message += '\n' + this.formatFieldSuggestions(validation);
    }

    return message;
  }

  /**
   * Formats field suggestions using static suggestion engine
   */
  private formatFieldSuggestions(
    validation: BatchValidationResult | { isValid: boolean; validPaths: string[]; invalidPaths: string[]; suggestions: Record<string, string[]> }
  ): string {
    if (!('suggestions' in validation) || !validation.suggestions || Object.keys(validation.suggestions).length === 0) {
      return '';
    }

    const suggestionLines = Object.entries(validation.suggestions)
      .map(([field, fieldSuggestions]) => {
        return `Suggestions for "${field}": ${fieldSuggestions.join(', ')}`;
      })
      .join('\n');

    return `\n${suggestionLines}`;
  }

  /**
   * Wraps API response with validation warnings if any fields were filtered
   */
  private wrapResponseWithWarnings(
    response: any,
    warningMessage?: string
  ): ToolResponse {
    if (!warningMessage) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }

    const responseWithWarning = {
      warning: warningMessage,
      data: response,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(responseWithWarning, null, 2),
        },
      ],
    };
  }

  // =============================================================================
  // ISSUE TOOL HANDLERS
  // =============================================================================

  /**
   * Get a Jira issue by key or ID
   */
  private async handleGetIssue(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { issueKey, fields, expand } = args;

      if (!issueKey || typeof issueKey !== 'string') {
        throw new ApiError('issueKey is required and must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      if (expand !== undefined && !Array.isArray(expand)) {
        throw new ApiError('expand must be an array of strings', 400);
      }

      // Validate expand parameter values if provided
      if (expand && expand.length > 0) {
        const validExpandOptions = [
          'changelog',
          'renderedFields',
          'names',
          'schema',
          'transitions',
          'operations',
          'editmeta',
          'versionedRepresentations'
        ];

        const invalidExpandOptions = expand.filter(option => 
          typeof option !== 'string' || !validExpandOptions.includes(option)
        );

        if (invalidExpandOptions.length > 0) {
          throw new ApiError(
            `Invalid expand options: ${invalidExpandOptions.join(', ')}. ` +
            `Valid options are: ${validExpandOptions.join(', ')}`,
            400
          );
        }
      }

      // Validate and filter fields if provided
      let validatedFields: string[] | undefined = fields;
      let warningMessage: string | undefined;

      if (fields && fields.length > 0) {
        const validation = await this.validateAndFilterFields(fields);
        validatedFields = validation.validFields;
        warningMessage = validation.warningMessage;
      }

      this.ensureJiraClient();
      const issue = await this.jiraClient!.getIssue(issueKey, validatedFields, expand);

      return this.wrapResponseWithWarnings(issue, warningMessage);
    } catch (error) {
      this.handleToolError(error, 'getIssue');
    }
  }

  /**
   * Get available status transitions for a Jira issue
   */
  private async handleGetIssueTransitions(
    args: ToolArgs
  ): Promise<ToolResponse> {
    try {
      const { issueKey, fields } = args;

      if (!issueKey || typeof issueKey !== 'string') {
        throw new ApiError('issueKey is required and must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const transitions = await this.jiraClient!.getIssueTransitions(issueKey);

      // Apply client-side field filtering if fields specified
      let responseData = transitions;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(transitions, fields, {
            entityType: 'issue',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = transitions;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getIssueTransitions');
    }
  }

  /**
   * Search for Jira issues using JQL (Jira Query Language)
   */
  private async handleSearchIssues(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { jql, startAt, maxResults, fields } = args;

      if (!jql || typeof jql !== 'string') {
        throw new ApiError('jql is required and must be a string', 400);
      }

      if (
        startAt !== undefined &&
        (typeof startAt !== 'number' || startAt < 0)
      ) {
        throw new ApiError('startAt must be a non-negative number', 400);
      }

      if (
        maxResults !== undefined &&
        (typeof maxResults !== 'number' || maxResults <= 0)
      ) {
        throw new ApiError('maxResults must be a positive number', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      // Validate and filter fields if provided
      let validatedFields: string[] | undefined = fields;
      let warningMessage: string | undefined;

      if (fields && fields.length > 0) {
        const validation = await this.validateAndFilterFields(fields);
        validatedFields = validation.validFields;
        warningMessage = validation.warningMessage;
      }

      this.ensureJiraClient();

      const options: any = {};
      if (startAt !== undefined) options.startAt = startAt;
      if (maxResults !== undefined) options.maxResults = maxResults;
      if (validatedFields !== undefined) options.fields = validatedFields;

      const result = await this.jiraClient!.searchIssues(jql, options);

      return this.wrapResponseWithWarnings(result, warningMessage);
    } catch (error) {
      this.handleToolError(error, 'searchIssues');
    }
  }

  /**
   * Get work log entries for a Jira issue
   */
  private async handleGetIssueWorklogs(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { issueKey, fields } = args;

      if (!issueKey || typeof issueKey !== 'string') {
        throw new ApiError('issueKey is required and must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const worklogs = await this.jiraClient!.getIssueWorklogs(issueKey);

      // Apply client-side field filtering if fields specified
      let responseData = worklogs;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(worklogs, fields, {
            entityType: 'issue',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = worklogs;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getIssueWorklogs');
    }
  }

  /**
   * Download attachment metadata for a Jira issue
   */
  private async handleDownloadAttachments(
    args: ToolArgs
  ): Promise<ToolResponse> {
    try {
      const { issueKey, fields } = args || {};

      if (!issueKey || typeof issueKey !== 'string') {
        throw new ApiError('issueKey is required and must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const attachments = await this.jiraClient!.downloadAttachments(issueKey);

      // Apply client-side field filtering if fields specified
      let responseData = attachments;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(attachments, fields, {
            entityType: 'issue',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = attachments;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'downloadAttachments');
    }
  }

  // =============================================================================
  // PROJECT TOOL HANDLERS
  // =============================================================================

  /**
   * Get all projects from Jira with optional filtering for archived projects
   */
  private async handleGetAllProjects(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { includeArchived, fields } = args;

      if (
        includeArchived !== undefined &&
        typeof includeArchived !== 'boolean'
      ) {
        throw new ApiError('includeArchived must be a boolean', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const projects = await this.jiraClient!.getAllProjects(includeArchived);

      // Apply client-side field filtering if fields specified
      let responseData = projects;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(projects, fields, {
            entityType: 'project',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = projects;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getAllProjects');
    }
  }

  /**
   * Get detailed information for a specific project
   */
  private async handleGetProject(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { projectKey, fields } = args;

      if (!projectKey || typeof projectKey !== 'string') {
        throw new ApiError('projectKey is required and must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const project = await this.jiraClient!.getProject(projectKey);

      // Apply client-side field filtering if fields specified
      let responseData = project;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(project, fields, {
            entityType: 'project',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = project;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getProject');
    }
  }

  /**
   * Get all issues for a specific project
   */
  private async handleGetProjectIssues(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { projectKey, startAt, maxResults, fields } = args;

      if (!projectKey || typeof projectKey !== 'string') {
        throw new ApiError('projectKey is required and must be a string', 400);
      }

      if (
        startAt !== undefined &&
        (typeof startAt !== 'number' || startAt < 0)
      ) {
        throw new ApiError('startAt must be a non-negative number', 400);
      }

      if (
        maxResults !== undefined &&
        (typeof maxResults !== 'number' || maxResults <= 0)
      ) {
        throw new ApiError('maxResults must be a positive number', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      // Validate and filter fields if provided
      let validatedFields: string[] | undefined = fields;
      let warningMessage: string | undefined;

      if (fields && fields.length > 0) {
        const validation = await this.validateAndFilterFields(fields);
        validatedFields = validation.validFields;
        warningMessage = validation.warningMessage;
      }

      this.ensureJiraClient();

      const options: any = {};
      if (startAt !== undefined) options.startAt = startAt;
      if (maxResults !== undefined) options.maxResults = maxResults;
      if (validatedFields !== undefined) options.fields = validatedFields;

      const result = await this.jiraClient!.getProjectIssues(
        projectKey,
        options
      );

      return this.wrapResponseWithWarnings(result, warningMessage);
    } catch (error) {
      this.handleToolError(error, 'getProjectIssues');
    }
  }

  /**
   * Get all versions for a specific project
   */
  private async handleGetProjectVersions(
    args: ToolArgs
  ): Promise<ToolResponse> {
    try {
      const { projectKey, fields } = args;

      if (!projectKey || typeof projectKey !== 'string') {
        throw new ApiError('projectKey is required and must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const versions = await this.jiraClient!.getProjectVersions(projectKey);

      // Apply client-side field filtering if fields specified
      let responseData = versions;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(versions, fields, {
            entityType: 'project',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = versions;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getProjectVersions');
    }
  }

  // =============================================================================
  // USER TOOL HANDLERS
  // =============================================================================

  /**
   * Get information about the currently authenticated user
   */
  private async handleGetCurrentUser(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { fields } = args || {};

      // Only allow fields parameter
      const allowedKeys = ['fields'];
      const providedKeys = Object.keys(args || {});
      const invalidKeys = providedKeys.filter(key => !allowedKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        throw new ApiError(
          `getCurrentUser only accepts 'fields' parameter. Invalid parameters: ${invalidKeys.join(', ')}`,
          400
        );
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const user = await this.jiraClient!.getCurrentUser();

      // Apply client-side field filtering if fields specified
      let responseData = user;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(user, fields, {
            entityType: 'user',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = user;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getCurrentUser');
    }
  }

  /**
   * Get detailed profile information for a specific Jira user
   */
  private async handleGetUserProfile(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { username, fields } = args;

      if (!username || typeof username !== 'string') {
        throw new ApiError('username is required and must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const user = await this.jiraClient!.getUserProfile(username);

      // Apply client-side field filtering if fields specified
      let responseData = user;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(user, fields, {
            entityType: 'user',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = user;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getUserProfile');
    }
  }

  // =============================================================================
  // AGILE TOOL HANDLERS
  // =============================================================================

  /**
   * Get all agile boards (Scrum, Kanban) from Jira
   */
  private async handleGetAgileBoards(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { projectKey, fields } = args;

      if (projectKey !== undefined && typeof projectKey !== 'string') {
        throw new ApiError('projectKey must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const boards = await this.jiraClient!.getAgileBoards(projectKey);

      // Apply client-side field filtering if fields specified
      let responseData = boards;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(boards, fields, {
            entityType: 'agile',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = boards;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getAgileBoards');
    }
  }

  /**
   * Get issues from a specific agile board
   */
  private async handleGetBoardIssues(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { boardId, startAt, maxResults, fields } = args;

      if (!boardId || typeof boardId !== 'number') {
        throw new ApiError('boardId is required and must be a number', 400);
      }

      if (
        startAt !== undefined &&
        (typeof startAt !== 'number' || startAt < 0)
      ) {
        throw new ApiError('startAt must be a non-negative number', 400);
      }

      if (
        maxResults !== undefined &&
        (typeof maxResults !== 'number' || maxResults <= 0)
      ) {
        throw new ApiError('maxResults must be a positive number', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      // Validate and filter fields if provided
      let validatedFields: string[] | undefined = fields;
      let warningMessage: string | undefined;

      if (fields && fields.length > 0) {
        const validation = await this.validateAndFilterFields(fields);
        validatedFields = validation.validFields;
        warningMessage = validation.warningMessage;
      }

      this.ensureJiraClient();

      const options: any = {};
      if (startAt !== undefined) options.startAt = startAt;
      if (maxResults !== undefined) options.maxResults = maxResults;
      if (validatedFields !== undefined) options.fields = validatedFields;

      const result = await this.jiraClient!.getBoardIssues(boardId, options);

      return this.wrapResponseWithWarnings(result, warningMessage);
    } catch (error) {
      this.handleToolError(error, 'getBoardIssues');
    }
  }

  /**
   * Get all sprints from a specific agile board
   */
  private async handleGetSprintsFromBoard(
    args: ToolArgs
  ): Promise<ToolResponse> {
    try {
      const { boardId, fields } = args;

      if (!boardId || typeof boardId !== 'number') {
        throw new ApiError('boardId is required and must be a number', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const sprints = await this.jiraClient!.getSprintsFromBoard(boardId);

      // Apply client-side field filtering if fields specified
      let responseData = sprints;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(sprints, fields, {
            entityType: 'agile',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = sprints;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getSprintsFromBoard');
    }
  }

  /**
   * Get issues from a specific sprint
   */
  private async handleGetSprintIssues(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { sprintId, startAt, maxResults, fields } = args;

      if (!sprintId || typeof sprintId !== 'number') {
        throw new ApiError('sprintId is required and must be a number', 400);
      }

      // Prepare search options
      const options: any = {};

      if (startAt !== undefined) {
        if (typeof startAt !== 'number' || startAt < 0) {
          throw new ApiError('startAt must be a non-negative number', 400);
        }
        options.startAt = startAt;
      }

      if (maxResults !== undefined) {
        if (typeof maxResults !== 'number' || maxResults <= 0) {
          throw new ApiError('maxResults must be a positive number', 400);
        }
        options.maxResults = maxResults;
      }

      // Validate and filter fields if provided
      let validatedFields: string[] | undefined = undefined;
      let warningMessage: string | undefined;

      if (fields !== undefined) {
        if (!Array.isArray(fields)) {
          throw new ApiError('fields must be an array of strings', 400);
        }

        // Validate that all fields are strings
        if (fields.some(field => typeof field !== 'string')) {
          throw new ApiError('all fields must be strings', 400);
        }

        if (fields.length > 0) {
          const validation = await this.validateAndFilterFields(fields);
          validatedFields = validation.validFields;
          warningMessage = validation.warningMessage;
        } else {
          validatedFields = fields;
        }
      }

      if (validatedFields !== undefined) {
        options.fields = validatedFields;
      }

      this.ensureJiraClient();
      const result = await this.jiraClient!.getSprintIssues(sprintId, options);

      return this.wrapResponseWithWarnings(result, warningMessage);
    } catch (error) {
      this.handleToolError(error, 'getSprintIssues');
    }
  }

  /**
   * Get detailed information for a specific sprint
   */
  private async handleGetSprint(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { sprintId, fields } = args;

      if (!sprintId || typeof sprintId !== 'number') {
        throw new ApiError('sprintId is required and must be a number', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const sprint = await this.jiraClient!.getSprint(sprintId);

      // Apply client-side field filtering if fields specified
      let responseData = sprint;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(sprint, fields, {
            entityType: 'agile',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = sprint;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getSprint');
    }
  }

  // =============================================================================
  // SYSTEM TOOL HANDLERS
  // =============================================================================

  /**
   * Search for Jira fields with optional query filtering
   */
  private async handleSearchFields(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { query, fields } = args || {};

      if (query !== undefined && typeof query !== 'string') {
        throw new ApiError('query must be a string', 400);
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const fieldResults = await this.jiraClient!.searchFields(query);

      // Apply client-side field filtering if fields specified
      let responseData = fieldResults;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(fieldResults, fields, {
            entityType: 'system',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = fieldResults;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'searchFields');
    }
  }

  /**
   * Get system information from the Jira server
   */
  private async handleGetSystemInfo(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { fields } = args || {};

      // Only allow fields parameter
      const allowedKeys = ['fields'];
      const providedKeys = Object.keys(args || {});
      const invalidKeys = providedKeys.filter(key => !allowedKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        throw new ApiError(
          `getSystemInfo only accepts 'fields' parameter. Invalid parameters: ${invalidKeys.join(', ')}`,
          400
        );
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const systemInfo = await this.jiraClient!.getSystemInfo();

      // Apply client-side field filtering if fields specified
      let responseData = systemInfo;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(systemInfo, fields, {
            entityType: 'system',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = systemInfo;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getSystemInfo');
    }
  }

  /**
   * Get server-specific information from the Jira server
   */
  private async handleGetServerInfo(args: ToolArgs): Promise<ToolResponse> {
    try {
      const { fields } = args || {};

      // Only allow fields parameter
      const allowedKeys = ['fields'];
      const providedKeys = Object.keys(args || {});
      const invalidKeys = providedKeys.filter(key => !allowedKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        throw new ApiError(
          `getServerInfo only accepts 'fields' parameter. Invalid parameters: ${invalidKeys.join(', ')}`,
          400
        );
      }

      if (fields !== undefined && !Array.isArray(fields)) {
        throw new ApiError('fields must be an array of strings', 400);
      }

      this.ensureJiraClient();
      const serverInfo = await this.jiraClient!.getServerInfo();

      // Apply client-side field filtering if fields specified
      let responseData = serverInfo;
      if (fields && fields.length > 0) {
        try {
          responseData = FieldFilter.filterFields(serverInfo, fields, {
            entityType: 'system',
            respectNesting: true,
            logFiltering: true
          });
        } catch (filterError) {
          logger.error('Field filtering failed:', filterError);
          // Fall back to original response if filtering fails
          responseData = serverInfo;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleToolError(error, 'getServerInfo');
    }
  }
}
