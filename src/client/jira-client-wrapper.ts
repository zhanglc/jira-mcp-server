import JiraClient from 'jira-client';
import { JiraConfig } from '../types/config-types.js';
import { JiraIssue, JiraTransition, SearchOptions, SearchResult, JiraProject, JiraUser, JiraWorklog, JiraVersion, JiraBoard, JiraSprint, JiraField, JiraAttachment, JiraSystemInfo, JiraServerInfo } from '../types/jira-types.js';
import { ApiError } from '../types/api-error.js';
import { logger } from '../utils/logger.js';

export class JiraClientWrapper {
  private client: JiraClient;
  
  // Allowed field names for security validation
  private static readonly ALLOWED_FIELDS = [
    'summary', 'status', 'assignee', 'reporter', 'description', 'project', 
    'issuetype', 'priority', 'created', 'updated', 'creator', 'parent',
    'components', 'versions', 'fixVersions', 'labels', 'environment',
    'duedate', 'resolution', 'resolutiondate', 'worklog', 'comment',
    'attachment', 'issuelinks', 'subtasks', 'watches', 'timeoriginalestimate',
    'timeestimate', 'timespent', 'aggregatetimeoriginalestimate', 'aggregatetimeestimate',
    'aggregatetimespent', 'workratio', 'progress', 'votes'
  ];

  constructor(config: JiraConfig) {
    const clientConfig: any = {
      protocol: 'https',
      host: new URL(config.url).hostname,
      port: '443',
      apiVersion: '2',
      strictSSL: true
    };

    // 支持Bearer Token认证（基于任务1.1验证结果）
    if (config.bearer) {
      clientConfig.bearer = config.bearer;
      logger.log('Jira client initialized with Bearer Token', { host: new URL(config.url).hostname });
    } else if (config.username && config.password) {
      clientConfig.username = config.username;
      clientConfig.password = config.password;
      logger.log('Jira client initialized with Basic Auth', { host: new URL(config.url).hostname, username: config.username });
    } else {
      throw new Error('Either bearer token or username/password must be provided');
    }

    this.client = new JiraClient(clientConfig);
  }

  /**
   * Retrieves a Jira issue by its key.
   * 
   * @param issueKey - The unique key of the Jira issue (e.g., 'PROJECT-123')
   * @param fields - Optional array of field names to retrieve. If omitted, all fields are returned.
   *                 Standard fields: summary, status, assignee, reporter, description, project, etc.
   *                 Custom fields: customfield_XXXXX format
   *                 Invalid field names are filtered out for security
   * @returns Promise that resolves to the Jira issue object
   * @throws {ApiError} When the issue doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all fields
   * const issue = await client.getIssue('PROJECT-123');
   * 
   * // Get specific fields only
   * const issue = await client.getIssue('PROJECT-123', ['summary', 'status']);
   * ```
   */
  async getIssue(issueKey: string, fields?: string[]): Promise<JiraIssue> {
    try {
      logger.log(`Getting issue: ${issueKey}`);
      
      let issue: JiraIssue;
      if (fields !== undefined) {
        // Validate and filter field names for security
        const validFields = fields.filter(field => 
          JiraClientWrapper.ALLOWED_FIELDS.includes(field) || 
          field.startsWith('customfield_') ||
          field === '*all' ||
          field === '*navigable'
        );
        
        if (validFields.length !== fields.length) {
          const invalidFields = fields.filter(field => !validFields.includes(field));
          logger.log(`Filtered invalid field names: ${invalidFields.join(', ')}`);
        }
        
        // When fields parameter is provided (even if empty), use the fields-specific call
        issue = await this.client.findIssue(issueKey, '', validFields.join(',')) as JiraIssue;
      } else {
        // Default behavior - get all fields
        issue = await this.client.findIssue(issueKey) as JiraIssue;
      }
      
      logger.log(`Successfully retrieved issue: ${issueKey}`);
      return issue;
    } catch (error) {
      logger.error(`Failed to get issue ${issueKey}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves available transitions for a Jira issue.
   * 
   * @param issueKey - The unique key of the Jira issue (e.g., 'PROJECT-123')
   * @returns Promise that resolves to an array of available transitions
   * @throws {ApiError} When the issue doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * const transitions = await client.getIssueTransitions('PROJECT-123');
   * console.log(transitions); // [{ id: '21', name: 'In Progress', to: {...} }, ...]
   * ```
   */
  async getIssueTransitions(issueKey: string): Promise<JiraTransition[]> {
    try {
      logger.log(`Getting transitions for issue: ${issueKey}`);
      
      const response = await this.client.listTransitions(issueKey);
      
      // Handle null or undefined response
      if (!response) {
        logger.log(`No response received for issue transitions: ${issueKey}`);
        return [];
      }
      
      // Handle response without transitions property
      if (!response.transitions) {
        logger.log(`No transitions property in response for issue: ${issueKey}`);
        return [];
      }
      
      const transitions = response.transitions as JiraTransition[];
      logger.log(`Successfully retrieved ${transitions.length} transitions for issue: ${issueKey}`);
      
      return transitions;
    } catch (error) {
      logger.error(`Failed to get transitions for issue ${issueKey}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Searches for Jira issues using JQL (Jira Query Language).
   * 
   * @param jql - The JQL query string to search for issues
   * @param options - Optional search parameters including pagination and field selection
   * @returns Promise that resolves to a SearchResult containing matching issues
   * @throws {ApiError} When the JQL is invalid, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Basic search
   * const result = await client.searchIssues('project = DSCWA');
   * 
   * // Search with pagination
   * const result = await client.searchIssues('project = DSCWA', { 
   *   startAt: 0, 
   *   maxResults: 20 
   * });
   * 
   * // Search with field selection
   * const result = await client.searchIssues('project = DSCWA', { 
   *   fields: ['summary', 'status', 'assignee'] 
   * });
   * ```
   */
  async searchIssues(jql: string, options?: SearchOptions): Promise<SearchResult<JiraIssue>> {
    try {
      logger.log(`Searching issues with JQL: ${jql}`);
      
      // Prepare search options
      const searchOptions: any = {};
      
      if (options?.startAt !== undefined) {
        searchOptions.startAt = options.startAt;
      }
      
      if (options?.maxResults !== undefined) {
        searchOptions.maxResults = options.maxResults;
      }
      
      if (options?.fields !== undefined) {
        // Validate and filter field names for security
        const validFields = options.fields.filter(field => 
          JiraClientWrapper.ALLOWED_FIELDS.includes(field) || 
          field.startsWith('customfield_') ||
          field === '*all' ||
          field === '*navigable'
        );
        
        if (validFields.length !== options.fields.length) {
          const invalidFields = options.fields.filter(field => !validFields.includes(field));
          logger.log(`Filtered invalid field names: ${invalidFields.join(', ')}`);
        }
        
        searchOptions.fields = validFields;
      }
      
      const result = await this.client.searchJira(jql, searchOptions);
      
      // Handle null or undefined response
      if (!result) {
        logger.log(`No response received for JQL search: ${jql}`);
        return {
          expand: '',
          startAt: 0,
          maxResults: 0,
          total: 0,
          issues: []
        };
      }
      
      logger.log(`Successfully found ${result.total} issues for JQL: ${jql}`);
      
      return result as SearchResult<JiraIssue>;
    } catch (error) {
      logger.error(`Failed to search issues with JQL ${jql}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves all projects from Jira.
   * 
   * @param includeArchived - Optional flag to include archived projects. If true, includes archived projects.
   *                          If false, filters out archived projects. If undefined, returns all projects.
   * @returns Promise that resolves to an array of Jira projects
   * @throws {ApiError} When access is denied or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all projects (including archived)
   * const allProjects = await client.getAllProjects();
   * 
   * // Get only active projects
   * const activeProjects = await client.getAllProjects(false);
   * 
   * // Explicitly get all projects including archived
   * const allProjectsExplicit = await client.getAllProjects(true);
   * ```
   */
  async getAllProjects(includeArchived?: boolean): Promise<JiraProject[]> {
    try {
      logger.log('Getting all projects');
      
      const response = await this.client.listProjects();
      
      // Handle null or undefined response
      if (!response) {
        logger.log('No response received for project list');
        return [];
      }
      
      let projects = response as JiraProject[];
      
      // Handle empty array
      if (!Array.isArray(projects)) {
        logger.log('Response is not an array, returning empty array');
        return [];
      }
      
      // Filter archived projects if requested
      if (includeArchived === false) {
        projects = projects.filter(project => project.archived !== true);
        logger.log(`Filtered out archived projects, ${projects.length} active projects remaining`);
      }
      
      logger.log(`Successfully retrieved ${projects.length} projects`);
      return projects;
    } catch (error) {
      logger.error('Failed to get all projects:', error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves information about the currently authenticated user.
   * 
   * This method is essential for authentication verification and provides
   * complete user profile information including display name, email, timezone,
   * avatar URLs, groups, and application roles.
   * 
   * @returns Promise that resolves to the current user information
   * @throws {ApiError} When authentication fails, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get current user info for authentication verification
   * const currentUser = await client.getCurrentUser();
   * console.log(`Authenticated as: ${currentUser.displayName} (${currentUser.emailAddress})`);
   * console.log(`User key: ${currentUser.key}`);
   * console.log(`Active: ${currentUser.active}`);
   * console.log(`Timezone: ${currentUser.timeZone}`);
   * ```
   */
  async getCurrentUser(): Promise<JiraUser> {
    try {
      logger.log('Getting current user information');
      
      const user = await this.client.getCurrentUser();
      
      // Handle null or undefined response
      if (!user) {
        logger.error('No user information received from getCurrentUser API');
        throw new ApiError('No user information received from server', 500);
      }
      
      // Validate required fields
      if (!user.self || !user.name || !user.displayName || !user.emailAddress) {
        logger.error('Invalid user response - missing required fields', user);
        throw new ApiError('Invalid user information received from server', 500);
      }
      
      logger.log(`Successfully retrieved current user: ${user.displayName} (${user.name})`);
      
      return user as JiraUser;
    } catch (error) {
      logger.error('Failed to get current user:', error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves worklogs for a specific Jira issue.
   * 
   * This method fetches all work log entries associated with an issue, including
   * information about time spent, comments, authors, and timestamps. Worklogs
   * provide a detailed history of time tracking and work performed on an issue.
   * 
   * @param issueKey - The unique key of the Jira issue (e.g., 'PROJECT-123')
   * @returns Promise that resolves to an array of worklog entries
   * @throws {ApiError} When the issue doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all worklogs for an issue
   * const worklogs = await client.getIssueWorklogs('PROJECT-123');
   * console.log(`Issue has ${worklogs.length} worklog entries`);
   * 
   * // Analyze time tracking
   * const totalTime = worklogs.reduce((sum, log) => sum + log.timeSpentSeconds, 0);
   * console.log(`Total time logged: ${totalTime} seconds`);
   * 
   * // Review work history
   * worklogs.forEach(log => {
   *   console.log(`${log.author.displayName}: ${log.timeSpent} on ${log.started}`);
   *   if (log.comment) console.log(`Comment: ${log.comment}`);
   * });
   * ```
   */
  async getIssueWorklogs(issueKey: string): Promise<JiraWorklog[]> {
    try {
      logger.log(`Getting worklogs for issue: ${issueKey}`);
      
      const response = await this.client.getIssueWorklogs(issueKey);
      
      // Handle null or undefined response
      if (!response) {
        logger.log(`No response received for issue worklogs: ${issueKey}`);
        return [];
      }
      
      // Handle response without worklogs property
      if (!response.worklogs) {
        logger.log(`No worklogs property in response for issue: ${issueKey}`);
        return [];
      }
      
      const worklogs = response.worklogs as JiraWorklog[];
      logger.log(`Successfully retrieved ${worklogs.length} worklogs for issue: ${issueKey}`);
      
      return worklogs;
    } catch (error) {
      logger.error(`Failed to get worklogs for issue ${issueKey}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves all issues for a specific project using JQL search.
   * 
   * This method is a convenience wrapper around searchIssues that automatically
   * constructs the JQL query to find all issues within a specified project.
   * It supports all the same search options as searchIssues including pagination
   * and field selection.
   * 
   * @param projectKey - The unique key of the Jira project (e.g., 'DSCWA', 'PROJECT-123')
   * @param options - Optional search parameters including pagination and field selection
   * @returns Promise that resolves to a SearchResult containing all project issues
   * @throws {ApiError} When the project doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all issues from a project
   * const result = await client.getProjectIssues('DSCWA');
   * console.log(`Project has ${result.total} issues`);
   * 
   * // Get project issues with pagination
   * const result = await client.getProjectIssues('DSCWA', { 
   *   startAt: 0, 
   *   maxResults: 20 
   * });
   * 
   * // Get project issues with specific fields only
   * const result = await client.getProjectIssues('DSCWA', { 
   *   fields: ['summary', 'status', 'assignee'] 
   * });
   * 
   * // Analyze project issues
   * result.issues.forEach(issue => {
   *   console.log(`${issue.key}: ${issue.fields.summary}`);
   *   console.log(`Status: ${issue.fields.status.name}`);
   *   console.log(`Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);
   * });
   * ```
   */
  async getProjectIssues(projectKey: string, options?: SearchOptions): Promise<SearchResult<JiraIssue>> {
    try {
      logger.log(`Getting issues for project: ${projectKey}`);
      
      // Construct JQL query for the project
      // Quote project key if it contains special characters (spaces, dashes, etc.)
      let jqlProjectKey = projectKey;
      if (/[\s\-]/.test(projectKey)) {
        jqlProjectKey = `"${projectKey}"`;
      }
      
      const jql = `project = ${jqlProjectKey}`;
      
      // Use the existing searchIssues method to leverage all its functionality
      const result = await this.searchIssues(jql, options);
      
      logger.log(`Successfully retrieved ${result.total} issues for project: ${projectKey}`);
      
      return result;
    } catch (error) {
      logger.error(`Failed to get issues for project ${projectKey}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves all versions for a specific Jira project.
   * 
   * This method fetches all version information for a project, including both
   * released and unreleased versions. Versions represent project milestones,
   * releases, or iterations and contain important metadata like release dates,
   * status, and project associations.
   * 
   * @param projectKey - The unique key of the Jira project (e.g., 'DSCWA', 'PROJECT-123')
   * @returns Promise that resolves to an array of project versions
   * @throws {ApiError} When the project doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all versions for a project
   * const versions = await client.getProjectVersions('DSCWA');
   * console.log(`Project has ${versions.length} versions`);
   * 
   * // Analyze version status
   * versions.forEach(version => {
   *   console.log(`${version.name}: ${version.released ? 'Released' : 'Unreleased'}`);
   *   if (version.archived) console.log(`  - Archived`);
   *   if (version.overdue) console.log(`  - Overdue`);
   *   if (version.releaseDate) console.log(`  - Release Date: ${version.releaseDate}`);
   * });
   * 
   * // Filter active versions
   * const activeVersions = versions.filter(v => !v.archived && !v.released);
   * console.log(`${activeVersions.length} active versions in development`);
   * 
   * // Get released versions
   * const releasedVersions = versions.filter(v => v.released);
   * console.log(`${releasedVersions.length} versions have been released`);
   * ```
   */
  async getProjectVersions(projectKey: string): Promise<JiraVersion[]> {
    try {
      logger.log(`Getting versions for project: ${projectKey}`);
      
      const response = await this.client.getVersions(projectKey);
      
      // Handle null or undefined response
      if (!response) {
        logger.log(`No response received for project versions: ${projectKey}`);
        return [];
      }
      
      // Handle non-array response
      if (!Array.isArray(response)) {
        logger.log(`Response is not an array for project versions: ${projectKey}`);
        return [];
      }
      
      const versions = response as JiraVersion[];
      logger.log(`Successfully retrieved ${versions.length} versions for project: ${projectKey}`);
      
      return versions;
    } catch (error) {
      logger.error(`Failed to get versions for project ${projectKey}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves detailed information for a specific Jira project.
   * 
   * This method fetches comprehensive project details including metadata,
   * components, versions, roles, issue types, and project configuration.
   * It provides more detailed information than what's available in getAllProjects
   * and is essential for project-specific operations and analysis.
   * 
   * @param projectKey - The unique key of the Jira project (e.g., 'DSCWA', 'PROJECT-123')
   * @returns Promise that resolves to the complete project information
   * @throws {ApiError} When the project doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get complete project details
   * const project = await client.getProject('DSCWA');
   * console.log(`Project: ${project.name} (${project.key})`);
   * console.log(`Type: ${project.projectTypeKey}`);
   * console.log(`Lead: ${project.lead?.displayName}`);
   * console.log(`Components: ${project.components?.length || 0}`);
   * console.log(`Versions: ${project.versions?.length || 0}`);
   * 
   * // Check project status
   * if (project.archived) {
   *   console.log('Project is archived');
   * }
   * 
   * // Analyze project components
   * project.components?.forEach(component => {
   *   console.log(`Component: ${component.name} - ${component.description || 'No description'}`);
   * });
   * 
   * // Review project versions
   * project.versions?.forEach(version => {
   *   console.log(`Version: ${version.name} (${version.released ? 'Released' : 'In Development'})`);
   * });
   * ```
   */
  async getProject(projectKey: string): Promise<JiraProject> {
    try {
      logger.log(`Getting project details: ${projectKey}`);
      
      const response = await this.client.getProject(projectKey);
      
      // Handle null or undefined response
      if (!response) {
        logger.error(`No project information received for: ${projectKey}`);
        throw new ApiError(`Project not found: ${projectKey}`, 404);
      }
      
      // Validate required fields
      const project = response as JiraProject;
      if (!project.id || !project.key || !project.name || !project.self || !project.projectTypeKey) {
        logger.error(`Invalid project response - missing required fields for: ${projectKey}`, project);
        throw new ApiError(`Invalid project information received for: ${projectKey}`, 500);
      }
      
      logger.log(`Successfully retrieved project: ${project.name} (${project.key})`);
      
      return project;
    } catch (error) {
      logger.error(`Failed to get project ${projectKey}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves detailed profile information for a specific Jira user.
   * 
   * This method fetches comprehensive user profile details including display name,
   * email address, timezone, avatar URLs, groups, and application roles for any
   * user by their username. It provides the same data structure as getCurrentUser
   * but allows querying other users' profiles, subject to permission restrictions.
   * 
   * @param username - The username of the Jira user (e.g., 'JIRAUSER23511', 'user@domain.com')
   * @returns Promise that resolves to the user profile information
   * @throws {ApiError} When the user doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get user profile by username
   * const user = await client.getUserProfile('JIRAUSER23511');
   * console.log(`User: ${user.displayName} (${user.emailAddress})`);
   * console.log(`Key: ${user.key}`);
   * console.log(`Active: ${user.active}`);
   * console.log(`Timezone: ${user.timeZone}`);
   * 
   * // Get user profile by email address
   * const user = await client.getUserProfile('user.name@company.com');
   * console.log(`Display Name: ${user.displayName}`);
   * 
   * // Check user status
   * if (!user.active) {
   *   console.log('User is inactive');
   * }
   * if (user.deleted) {
   *   console.log('User is deleted');
   * }
   * 
   * // Analyze user permissions
   * console.log(`Groups: ${user.groups?.size || 0}`);
   * console.log(`Application Roles: ${user.applicationRoles?.size || 0}`);
   * ```
   */
  async getUserProfile(username: string): Promise<JiraUser> {
    try {
      logger.log(`Getting user profile: ${username}`);
      
      // Use searchUsers API for Jira Server compatibility
      // This works with both username and email address
      const response = await this.client.searchUsers({
        query: username,
        username: username, // Keep for backward compatibility
        maxResults: 1,
        includeActive: true,
        includeInactive: true
      });
      
      // Handle null or undefined response
      if (!response) {
        logger.error(`No response received for user search: ${username}`);
        throw new ApiError(`User not found: ${username}`, 404);
      }
      
      // searchUsers returns an array of users
      const users = Array.isArray(response) ? response : [response];
      
      if (users.length === 0) {
        logger.error(`No users found for: ${username}`);
        throw new ApiError(`User not found: ${username}`, 404);
      }
      
      const user = users[0];
      
      // Validate required fields
      if (!user.self || !user.name || !user.displayName || !user.emailAddress) {
        logger.error(`Invalid user response - missing required fields for: ${username}`, user);
        throw new ApiError(`Invalid user information received for: ${username}`, 500);
      }
      
      logger.log(`Successfully retrieved user profile: ${user.displayName} (${user.name})`);
      
      return user as JiraUser;
    } catch (error) {
      logger.error(`Failed to get user profile ${username}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves all agile boards from Jira with optional project filtering.
   * 
   * This method fetches agile boards (Scrum, Kanban, etc.) from the Jira Agile plugin.
   * It supports filtering by project to return only boards associated with a specific project.
   * The method handles both server environments that may not have agile functionality enabled
   * and provides comprehensive error handling for authentication and permission issues.
   * 
   * @param projectKey - Optional project key to filter boards (e.g., 'DSCWA', 'PROJECT-123')
   *                     If provided, only boards associated with this project will be returned.
   *                     If omitted, all accessible boards are returned.
   * @returns Promise that resolves to an array of agile boards
   * @throws {ApiError} When agile functionality is not available, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all accessible agile boards
   * const allBoards = await client.getAgileBoards();
   * console.log(`Found ${allBoards.length} boards`);
   * 
   * // Get boards for a specific project
   * const projectBoards = await client.getAgileBoards('DSCWA');
   * console.log(`DSCWA project has ${projectBoards.length} boards`);
   * 
   * // Analyze board types
   * allBoards.forEach(board => {
   *   console.log(`${board.name}: ${board.type} board`);
   *   if (board.location?.projectKey) {
   *     console.log(`  - Associated with project: ${board.location.projectKey}`);
   *   }
   *   if (board.admins?.users?.length) {
   *     console.log(`  - Admins: ${board.admins.users.map(u => u.displayName).join(', ')}`);
   *   }
   * });
   * 
   * // Filter by board type
   * const scrumBoards = allBoards.filter(board => board.type === 'scrum');
   * const kanbanBoards = allBoards.filter(board => board.type === 'kanban');
   * console.log(`${scrumBoards.length} Scrum boards, ${kanbanBoards.length} Kanban boards`);
   * ```
   */
  async getAgileBoards(projectKey?: string): Promise<JiraBoard[]> {
    try {
      logger.log('Getting agile boards', { projectKey });
      
      const response = await this.client.getAllBoards();
      
      // Handle null or undefined response
      if (!response) {
        logger.log('No response received for agile boards');
        return [];
      }
      
      // Handle response without values property
      if (!response.values) {
        logger.log('No values property in agile boards response');
        return [];
      }
      
      // Handle non-array values
      if (!Array.isArray(response.values)) {
        logger.log('Values property is not an array in agile boards response');
        return [];
      }
      
      let boards = response.values as JiraBoard[];
      
      // Apply project filtering if requested
      if (projectKey !== undefined && projectKey.trim() !== '') {
        const trimmedProjectKey = projectKey.trim();
        boards = boards.filter(board => {
          // Check if board has a location with project information
          if (!board.location || board.location.type !== 'project') {
            return false;
          }
          
          // Match project key exactly (case-sensitive)
          return board.location.projectKey === trimmedProjectKey;
        });
        
        logger.log(`Filtered to ${boards.length} boards for project: ${trimmedProjectKey}`);
      }
      
      logger.log(`Successfully retrieved ${boards.length} agile boards`);
      return boards;
    } catch (error) {
      logger.error('Failed to get agile boards:', error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves issues from a specific agile board.
   * 
   * This method fetches all issues associated with an agile board (Scrum, Kanban, etc.)
   * using the Jira Agile REST API. It supports pagination and field selection similar to
   * searchIssues, allowing efficient retrieval of board-specific issues with customizable
   * result sets. The method provides comprehensive error handling for board access,
   * permissions, and agile functionality availability.
   * 
   * @param boardId - The numeric ID of the agile board (e.g., 123, 456)
   * @param options - Optional search parameters including pagination and field selection
   * @returns Promise that resolves to a SearchResult containing board issues
   * @throws {ApiError} When the board doesn't exist, access is denied, agile functionality is unavailable, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all issues from a board
   * const result = await client.getBoardIssues(123);
   * console.log(`Board has ${result.total} issues`);
   * 
   * // Get board issues with pagination
   * const result = await client.getBoardIssues(123, { 
   *   startAt: 0, 
   *   maxResults: 20 
   * });
   * 
   * // Get board issues with specific fields only
   * const result = await client.getBoardIssues(123, { 
   *   fields: ['summary', 'status', 'assignee'] 
   * });
   * 
   * // Analyze board issues
   * result.issues.forEach(issue => {
   *   console.log(`${issue.key}: ${issue.fields.summary}`);
   *   console.log(`Status: ${issue.fields.status.name}`);
   *   console.log(`Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);
   * });
   * 
   * // Compare with searchIssues for validation
   * const searchResult = await client.searchIssues('project = DSCWA');
   * console.log(`Board issues: ${result.total}, Search results: ${searchResult.total}`);
   * ```
   */
  async getBoardIssues(boardId: number, options?: SearchOptions): Promise<SearchResult<JiraIssue>> {
    try {
      logger.log(`Getting issues for board: ${boardId}`);
      
      // Prepare parameters for jira-client getIssuesForBoard method
      const startAt = options?.startAt ?? 0;
      const maxResults = options?.maxResults ?? 50;
      let fieldsString: string | undefined = undefined;
      
      if (options?.fields !== undefined) {
        // Validate and filter field names for security (same as searchIssues)
        const validFields = options.fields.filter(field => 
          JiraClientWrapper.ALLOWED_FIELDS.includes(field) || 
          field.startsWith('customfield_') ||
          field === '*all' ||
          field === '*navigable'
        );
        
        if (validFields.length !== options.fields.length) {
          const invalidFields = options.fields.filter(field => !validFields.includes(field));
          logger.log(`Filtered invalid field names: ${invalidFields.join(', ')}`);
        }
        
        // Convert array to comma-separated string as expected by jira-client
        fieldsString = validFields.length > 0 ? validFields.join(',') : undefined;
      }
      
      // Call jira-client getIssuesForBoard method
      // Parameters: boardId, startAt, maxResults, jql, validateQuery, fields
      const result = await this.client.getIssuesForBoard(
        boardId.toString(), // Convert to string as expected by jira-client
        startAt, 
        maxResults, 
        undefined, // jql - not used for basic board issues
        true,      // validateQuery - default
        fieldsString // fields as comma-separated string or undefined
      );
      
      // Handle null or undefined response
      if (!result) {
        logger.log(`No response received for board issues: ${boardId}`);
        return {
          expand: '',
          startAt: 0,
          maxResults: 0,
          total: 0,
          issues: []
        };
      }
      
      logger.log(`Successfully found ${result.total} issues for board: ${boardId}`);
      
      return result as SearchResult<JiraIssue>;
    } catch (error) {
      logger.error(`Failed to get issues for board ${boardId}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves all sprints from a specific agile board.
   * 
   * This method fetches all sprints associated with an agile board (primarily Scrum boards)
   * using the Jira Agile REST API. It returns sprint information including state (active, closed, future),
   * dates, goals, and other sprint metadata. Kanban boards typically don't have sprints, so this
   * method is most useful for Scrum boards. The method provides comprehensive error handling
   * for board access, permissions, and agile functionality availability.
   * 
   * @param boardId - The numeric ID of the agile board (e.g., 123, 456)
   * @returns Promise that resolves to an array of sprints for the board
   * @throws {ApiError} When the board doesn't exist, access is denied, agile functionality is unavailable, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all sprints from a board
   * const sprints = await client.getSprintsFromBoard(123);
   * console.log(`Board has ${sprints.length} sprints`);
   * 
   * // Analyze sprint states
   * sprints.forEach(sprint => {
   *   console.log(`${sprint.name}: ${sprint.state}`);
   *   if (sprint.startDate) console.log(`  - Start: ${sprint.startDate}`);
   *   if (sprint.endDate) console.log(`  - End: ${sprint.endDate}`);
   *   if (sprint.completeDate) console.log(`  - Completed: ${sprint.completeDate}`);
   *   if (sprint.goal) console.log(`  - Goal: ${sprint.goal}`);
   * });
   * 
   * // Filter by sprint state
   * const activeSprints = sprints.filter(sprint => sprint.state === 'active');
   * const closedSprints = sprints.filter(sprint => sprint.state === 'closed');
   * const futureSprints = sprints.filter(sprint => sprint.state === 'future');
   * 
   * console.log(`Active: ${activeSprints.length}, Closed: ${closedSprints.length}, Future: ${futureSprints.length}`);
   * 
   * // Find current active sprint
   * const currentSprint = sprints.find(sprint => sprint.state === 'active');
   * if (currentSprint) {
   *   console.log(`Current active sprint: ${currentSprint.name}`);
   * }
   * ```
   */
  async getSprintsFromBoard(boardId: number): Promise<JiraSprint[]> {
    try {
      logger.log(`Getting sprints for board: ${boardId}`);
      
      // Call jira-client getAllSprints method with board ID
      const response = await this.client.getAllSprints(boardId.toString());
      
      // Handle null or undefined response
      if (!response) {
        logger.log(`No response received for board sprints: ${boardId}`);
        return [];
      }
      
      // Handle response without values property
      if (response.values === undefined) {
        logger.log(`No values property in board sprints response for board: ${boardId}`);
        return [];
      }
      
      // Handle non-array values property
      if (!Array.isArray(response.values)) {
        logger.log(`Values property is not an array in board sprints response for board: ${boardId}`);
        return [];
      }
      
      const sprints = response.values as JiraSprint[];
      logger.log(`Successfully retrieved ${sprints.length} sprints for board: ${boardId}`);
      
      return sprints;
    } catch (error) {
      logger.error(`Failed to get sprints for board ${boardId}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves detailed information for a specific sprint by its ID.
   * 
   * This method fetches comprehensive sprint details including state (active, closed, future),
   * dates, goals, and other sprint metadata using the Jira Agile REST API. It provides more
   * detailed information than what might be available in getSprintsFromBoard for a single sprint
   * and is essential for sprint-specific operations and analysis.
   * 
   * @param sprintId - The numeric ID of the sprint (e.g., 123, 456)
   * @returns Promise that resolves to the complete sprint information
   * @throws {ApiError} When the sprint doesn't exist, access is denied, agile functionality is unavailable, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get complete sprint details
   * const sprint = await client.getSprint(123);
   * console.log(`Sprint: ${sprint.name} (${sprint.state})`);
   * console.log(`Board ID: ${sprint.originBoardId}`);
   * 
   * // Check sprint status and dates
   * if (sprint.startDate) {
   *   console.log(`Started: ${sprint.startDate}`);
   * }
   * if (sprint.endDate) {
   *   console.log(`Ends: ${sprint.endDate}`);
   * }
   * if (sprint.completeDate) {
   *   console.log(`Completed: ${sprint.completeDate}`);
   * }
   * 
   * // Check sprint goal
   * if (sprint.goal) {
   *   console.log(`Goal: ${sprint.goal}`);
   * }
   * 
   * // Compare with getSprintsFromBoard results
   * const boardSprints = await client.getSprintsFromBoard(sprint.originBoardId);
   * const matchingSprint = boardSprints.find(s => s.id === sprint.id);
   * console.log(`Data consistency: ${JSON.stringify(sprint) === JSON.stringify(matchingSprint)}`);
   * ```
   */
  async getSprint(sprintId: number): Promise<JiraSprint> {
    try {
      logger.log(`Getting sprint details: ${sprintId}`);
      
      const response = await this.client.getSprint(sprintId.toString());
      
      // Handle null or undefined response
      if (!response) {
        logger.error(`No sprint information received for: ${sprintId}`);
        throw new ApiError(`Sprint not found: ${sprintId}`, 404);
      }
      
      // Validate required fields
      const sprint = response as JiraSprint;
      if (!sprint.id || !sprint.self || !sprint.state || !sprint.name) {
        logger.error(`Invalid sprint response - missing required fields for: ${sprintId}`, sprint);
        throw new ApiError(`Invalid sprint information received for: ${sprintId}`, 500);
      }
      
      logger.log(`Successfully retrieved sprint: ${sprint.name} (${sprint.state})`);
      
      return sprint;
    } catch (error) {
      logger.error(`Failed to get sprint ${sprintId}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves issues from a specific sprint with optional pagination and field selection.
   * 
   * This method fetches all issues associated with a sprint using JQL search with sprint filtering.
   * It supports pagination and field selection similar to searchIssues, allowing efficient
   * retrieval of sprint-specific issues with customizable result sets. The method leverages the
   * existing searchIssues functionality to provide consistent behavior and comprehensive error handling.
   * 
   * @param sprintId - The numeric ID of the sprint (e.g., 123, 456)
   * @param options - Optional search parameters including pagination and field selection
   * @returns Promise that resolves to a SearchResult containing sprint issues
   * @throws {ApiError} When the sprint doesn't exist, access is denied, JQL fails, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all issues from a sprint
   * const result = await client.getSprintIssues(123);
   * console.log(`Sprint has ${result.total} issues`);
   * 
   * // Get sprint issues with pagination
   * const result = await client.getSprintIssues(123, { 
   *   startAt: 0, 
   *   maxResults: 20 
   * });
   * 
   * // Get sprint issues with specific fields only
   * const result = await client.getSprintIssues(123, { 
   *   fields: ['summary', 'status', 'assignee'] 
   * });
   * 
   * // Analyze sprint issues
   * result.issues.forEach(issue => {
   *   console.log(`${issue.key}: ${issue.fields.summary}`);
   *   console.log(`Status: ${issue.fields.status.name}`);
   *   console.log(`Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);
   * });
   * 
   * // Compare with searchIssues for validation
   * const searchResult = await client.searchIssues('sprint = 123');
   * console.log(`Sprint issues: ${result.total}, Search results: ${searchResult.total}`);
   * ```
   */
  async getSprintIssues(sprintId: number, options?: SearchOptions): Promise<SearchResult<JiraIssue>> {
    try {
      logger.log(`Getting issues for sprint: ${sprintId}`);
      
      // Construct JQL query to find issues in the specific sprint
      const jql = `sprint = ${sprintId}`;
      
      // Use the existing searchIssues method to leverage all its functionality
      // This ensures consistent behavior with pagination, field filtering, and error handling
      const result = await this.searchIssues(jql, options);
      
      logger.log(`Successfully found ${result.total} issues for sprint: ${sprintId}`);
      
      return result;
    } catch (error) {
      logger.error(`Failed to get issues for sprint ${sprintId}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Searches for Jira fields with optional query filtering.
   * 
   * This method retrieves all available fields from Jira, including both system fields
   * and custom fields. It supports optional query filtering to find fields by name,
   * ID, or other field attributes. The filtering is case-insensitive and performs
   * partial matching on field names to make field discovery easier.
   * 
   * @param query - Optional query string to filter fields by name (case-insensitive partial match)
   * @returns Promise that resolves to an array of matching Jira fields
   * @throws {ApiError} When access is denied, permissions are insufficient, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all available fields
   * const allFields = await client.searchFields();
   * console.log(`Found ${allFields.length} total fields`);
   * 
   * // Search for fields containing 'summary'
   * const summaryFields = await client.searchFields('summary');
   * console.log(`Found ${summaryFields.length} fields matching 'summary'`);
   * 
   * // Search for custom fields
   * const customFields = await client.searchFields('custom');
   * console.log(`Found ${customFields.length} custom fields`);
   * 
   * // Analyze field properties
   * allFields.forEach(field => {
   *   console.log(`${field.name} (${field.id}): ${field.custom ? 'Custom' : 'System'} field`);
   *   console.log(`  - Searchable: ${field.searchable}`);
   *   console.log(`  - Orderable: ${field.orderable}`);
   *   if (field.clauseNames) {
   *     console.log(`  - JQL Names: ${field.clauseNames.join(', ')}`);
   *   }
   * });
   * 
   * // Find specific field by ID
   * const specificField = await client.searchFields('customfield_10001');
   * if (specificField.length > 0) {
   *   console.log(`Field ${specificField[0].name} found`);
   * }
   * ```
   */
  async searchFields(query?: string): Promise<JiraField[]> {
    try {
      if (query !== undefined) {
        logger.log(`Searching fields with query: ${query}`);
      } else {
        logger.log('Searching fields');
      }
      
      const response = await this.client.listFields();
      
      // Handle null or undefined response
      if (!response) {
        logger.log('No response received for fields list');
        return [];
      }
      
      // Handle non-array response
      if (!Array.isArray(response)) {
        logger.log('Response is not an array for fields list');
        return [];
      }
      
      let fields = response as JiraField[];
      logger.log(`Successfully retrieved ${fields.length} fields`);
      
      // Apply query filtering if provided
      if (query !== undefined && query.trim() !== '') {
        const trimmedQuery = query.trim().toLowerCase();
        fields = fields.filter(field => 
          field.name.toLowerCase().includes(trimmedQuery) ||
          field.id.toLowerCase().includes(trimmedQuery)
        );
        logger.log(`Filtered to ${fields.length} fields matching query: ${query}`);
      }
      
      return fields;
    } catch (error) {
      logger.error('Failed to search fields:', error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Downloads attachment metadata for a specific Jira issue.
   * 
   * This method retrieves information about all attachments associated with an issue,
   * including file metadata, download URLs, and author details. It returns attachment
   * metadata only and does not download the actual file content. The content field
   * provides the URL that can be used to download the actual file.
   * 
   * @param issueKey - The unique key of the Jira issue (e.g., 'PROJECT-123')
   * @returns Promise that resolves to an array of attachment metadata
   * @throws {ApiError} When the issue doesn't exist, access is denied, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get all attachments for an issue
   * const attachments = await client.downloadAttachments('PROJECT-123');
   * console.log(`Issue has ${attachments.length} attachments`);
   * 
   * // Analyze attachment types
   * attachments.forEach(attachment => {
   *   console.log(`${attachment.filename}: ${attachment.mimeType} (${attachment.size} bytes)`);
   *   console.log(`Author: ${attachment.author.displayName}`);
   *   console.log(`Created: ${attachment.created}`);
   *   console.log(`Download URL: ${attachment.content}`);
   *   if (attachment.thumbnail) {
   *     console.log(`Thumbnail URL: ${attachment.thumbnail}`);
   *   }
   * });
   * 
   * // Filter by file type
   * const images = attachments.filter(att => att.mimeType.startsWith('image/'));
   * const documents = attachments.filter(att => att.mimeType === 'application/pdf');
   * console.log(`${images.length} images, ${documents.length} PDF documents`);
   * 
   * // Calculate total size
   * const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
   * console.log(`Total attachment size: ${totalSize} bytes`);
   * ```
   */
  async downloadAttachments(issueKey: string): Promise<JiraAttachment[]> {
    try {
      logger.log(`Getting attachments for issue: ${issueKey}`);
      
      // Fetch issue with only attachment field to minimize data transfer
      const issue = await this.client.findIssue(issueKey, '', 'attachment');
      
      // Handle null or undefined response
      if (!issue) {
        logger.error(`No issue information received for: ${issueKey}`);
        throw new ApiError(`No issue information received for: ${issueKey}`, 500);
      }
      
      // Validate issue has fields property
      if (!issue.fields) {
        logger.error(`Invalid issue response - missing fields for: ${issueKey}`, issue);
        throw new ApiError(`Invalid issue response - missing fields for: ${issueKey}`, 500);
      }
      
      // Handle missing or null attachment field
      if (!issue.fields.attachment) {
        logger.log(`No attachments found for issue: ${issueKey}`);
        return [];
      }
      
      // Handle empty attachment array
      if (!Array.isArray(issue.fields.attachment)) {
        logger.log(`Invalid attachment field type for issue: ${issueKey}`);
        return [];
      }
      
      const attachments = issue.fields.attachment as JiraAttachment[];
      logger.log(`Successfully retrieved ${attachments.length} attachments for issue: ${issueKey}`);
      
      return attachments;
    } catch (error) {
      logger.error(`Failed to get attachments for issue ${issueKey}:`, error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves system information from the Jira server.
   * 
   * This method fetches comprehensive system information including version details,
   * deployment type, build information, and optional health checks. The information
   * is essential for system monitoring, version compatibility checks, and server
   * administration tasks. Some fields may require administrative privileges.
   * 
   * @returns Promise that resolves to the complete system information
   * @throws {ApiError} When access is denied, system info is unavailable, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get complete system information
   * const systemInfo = await client.getSystemInfo();
   * console.log(`Jira ${systemInfo.deploymentType}: ${systemInfo.version}`);
   * console.log(`Build: ${systemInfo.buildNumber} (${systemInfo.buildDate})`);
   * console.log(`Base URL: ${systemInfo.baseUrl}`);
   * 
   * // Check deployment type
   * if (systemInfo.deploymentType === 'Server') {
   *   console.log('Running on Jira Server/DC');
   * } else {
   *   console.log('Running on Jira Cloud');
   * }
   * 
   * // Analyze version compatibility
   * const [major, minor, patch] = systemInfo.versionNumbers;
   * if (major >= 9) {
   *   console.log('Modern Jira version with latest features');
   * }
   * 
   * // Check system health
   * if (systemInfo.healthChecks) {
   *   systemInfo.healthChecks.forEach(check => {
   *     console.log(`${check.name}: ${check.status}`);
   *     if (check.status !== 'PASS') {
   *       console.warn(`Health check failed: ${check.description}`);
   *     }
   *   });
   * }
   * ```
   */
  async getSystemInfo(): Promise<JiraSystemInfo> {
    try {
      logger.log('Getting system information');
      
      const response = await this.client.getServerInfo();
      
      // Handle null or undefined response
      if (!response) {
        logger.error('No system information received from getServerInfo API');
        throw new ApiError('No system information received from server', 500);
      }
      
      // Validate required fields
      const systemInfo = response as JiraSystemInfo;
      if (!systemInfo.baseUrl || !systemInfo.version || !systemInfo.versionNumbers || 
          !systemInfo.deploymentType || systemInfo.buildNumber === undefined || 
          !systemInfo.buildDate || !systemInfo.scmInfo) {
        logger.error('Invalid system information response - missing required fields', systemInfo);
        throw new ApiError('Invalid system information received from server', 500);
      }
      
      logger.log(`Successfully retrieved system info: ${systemInfo.deploymentType} ${systemInfo.version}`);
      
      return systemInfo;
    } catch (error) {
      logger.error('Failed to get system information:', error);
      throw ApiError.fromJiraClientError(error);
    }
  }

  /**
   * Retrieves server information from the Jira server.
   * 
   * This method fetches server-specific information including real-time server details,
   * current server time, default locale settings, and server runtime configuration.
   * It provides more server-specific details compared to getSystemInfo, focusing on
   * server runtime state and configuration rather than system health and monitoring.
   * 
   * @returns Promise that resolves to the complete server information
   * @throws {ApiError} When access is denied, server info is unavailable, or other API errors occur
   * 
   * @example
   * ```typescript
   * // Get complete server information
   * const serverInfo = await client.getServerInfo();
   * console.log(`Jira Server: ${serverInfo.version} at ${serverInfo.baseUrl}`);
   * console.log(`Server Time: ${serverInfo.serverTime}`);
   * console.log(`Default Locale: ${serverInfo.defaultLocale?.locale || 'Not set'}`);
   * 
   * // Check server status
   * if (serverInfo.deploymentType === 'Server') {
   *   console.log('Running on Jira Server/DC');
   * }
   * 
   * // Compare server time vs build time
   * console.log(`Built: ${serverInfo.buildDate}`);
   * console.log(`Current Server Time: ${serverInfo.serverTime}`);
   * 
   * // Analyze locale settings
   * if (serverInfo.defaultLocale) {
   *   console.log(`Server configured for locale: ${serverInfo.defaultLocale.locale}`);
   * }
   * ```
   */
  async getServerInfo(): Promise<JiraServerInfo> {
    try {
      logger.log('Getting server information');
      
      const response = await this.client.getServerInfo();
      
      // Handle null or undefined response
      if (!response) {
        logger.error('No server information received from getServerInfo API');
        throw new ApiError('No server information received from server', 500);
      }
      
      // Transform the response to add server-specific fields that distinguish it from getSystemInfo
      const rawServerInfo = response as any;
      
      // Create serverTime as current timestamp if not provided by API
      const currentTime = new Date().toISOString();
      
      // Build the server info object with server-specific fields
      const serverInfo: JiraServerInfo = {
        baseUrl: rawServerInfo.baseUrl,
        version: rawServerInfo.version,
        versionNumbers: rawServerInfo.versionNumbers,
        deploymentType: rawServerInfo.deploymentType,
        buildNumber: rawServerInfo.buildNumber,
        buildDate: rawServerInfo.buildDate,
        serverTime: rawServerInfo.serverTime || currentTime, // Add real-time server timestamp
        scmInfo: rawServerInfo.scmInfo,
        serverTitle: rawServerInfo.serverTitle,
        defaultLocale: rawServerInfo.defaultLocale // Add locale information if available
      };
      
      // Validate required fields
      if (!serverInfo.baseUrl || !serverInfo.version || !serverInfo.versionNumbers || 
          !serverInfo.deploymentType || serverInfo.buildNumber === undefined || 
          !serverInfo.buildDate || !serverInfo.serverTime || !serverInfo.scmInfo) {
        logger.error('Invalid server information response - missing required fields', serverInfo);
        throw new ApiError('Invalid server information received from server', 500);
      }
      
      logger.log(`Successfully retrieved server info: ${serverInfo.deploymentType} ${serverInfo.version}`);
      
      return serverInfo;
    } catch (error) {
      logger.error('Failed to get server information:', error);
      throw ApiError.fromJiraClientError(error);
    }
  }
}