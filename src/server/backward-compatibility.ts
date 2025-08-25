import { ToolHandler } from './handlers/tool-handler.js';

/**
 * Backward Compatibility Layer for MCP Server
 * 
 * This class provides backward compatibility methods for tests and legacy code.
 * These methods delegate to the ToolHandler for consistent behavior.
 * 
 * @deprecated Use ToolHandler.handleTool() directly for new code
 */
export class BackwardCompatibilityLayer {
  private toolHandler: ToolHandler;

  constructor(toolHandler: ToolHandler) {
    this.toolHandler = toolHandler;
  }

  // =============================================================================
  // ISSUE METHODS
  // =============================================================================

  async handleGetIssue(args: any) {
    return await this.toolHandler.handleTool('getIssue', args || {});
  }

  async handleGetIssueTransitions(args: any) {
    return await this.toolHandler.handleTool('getIssueTransitions', args || {});
  }

  async handleSearchIssues(args: any) {
    return await this.toolHandler.handleTool('searchIssues', args || {});
  }

  async handleGetIssueWorklogs(args: any) {
    return await this.toolHandler.handleTool('getIssueWorklogs', args || {});
  }

  async handleDownloadAttachments(args: any) {
    return await this.toolHandler.handleTool('downloadAttachments', args || {});
  }

  // =============================================================================
  // PROJECT METHODS
  // =============================================================================

  async handleGetAllProjects(args: any) {
    return await this.toolHandler.handleTool('getAllProjects', args || {});
  }

  async handleGetProject(args: any) {
    return await this.toolHandler.handleTool('getProject', args || {});
  }

  async handleGetProjectIssues(args: any) {
    return await this.toolHandler.handleTool('getProjectIssues', args || {});
  }

  async handleGetProjectVersions(args: any) {
    return await this.toolHandler.handleTool('getProjectVersions', args || {});
  }

  // =============================================================================
  // USER METHODS
  // =============================================================================

  async handleGetCurrentUser(args: any) {
    return await this.toolHandler.handleTool('getCurrentUser', args || {});
  }

  async handleGetUserProfile(args: any) {
    return await this.toolHandler.handleTool('getUserProfile', args || {});
  }

  // =============================================================================
  // AGILE METHODS
  // =============================================================================

  async handleGetAgileBoards(args: any) {
    return await this.toolHandler.handleTool('getAgileBoards', args || {});
  }

  async handleGetBoardIssues(args: any) {
    return await this.toolHandler.handleTool('getBoardIssues', args || {});
  }

  async handleGetSprintsFromBoard(args: any) {
    return await this.toolHandler.handleTool('getSprintsFromBoard', args || {});
  }

  async handleGetSprintIssues(args: any) {
    return await this.toolHandler.handleTool('getSprintIssues', args || {});
  }

  async handleGetSprint(args: any) {
    return await this.toolHandler.handleTool('getSprint', args || {});
  }

  // =============================================================================
  // SYSTEM METHODS
  // =============================================================================

  async handleSearchFields(args: any) {
    return await this.toolHandler.handleTool('searchFields', args || {});
  }

  async handleGetSystemInfo(args: any) {
    return await this.toolHandler.handleTool('getSystemInfo', args || {});
  }

  async handleGetServerInfo(args: any) {
    return await this.toolHandler.handleTool('getServerInfo', args || {});
  }
}