/**
 * MCP Tool Handlers
 *
 * This module exports the ToolHandler class which contains all CallTool handling logic
 * for the Jira MCP Server. The handlers are organized by tool category:
 *
 * - Issue handlers: getIssue, getIssueTransitions, searchIssues, getIssueWorklogs, downloadAttachments
 * - Project handlers: getAllProjects, getProject, getProjectIssues, getProjectVersions
 * - User handlers: getCurrentUser, getUserProfile
 * - Agile handlers: getAgileBoards, getBoardIssues, getSprintsFromBoard, getSprintIssues, getSprint
 * - System handlers: searchFields, getSystemInfo, getServerInfo
 *
 * Usage:
 * ```typescript
 * import { ToolHandler } from './handlers/index.js';
 *
 * const toolHandler = new ToolHandler(jiraClient);
 * const result = await toolHandler.handleTool(toolName, args);
 * ```
 */

export { ToolHandler } from './tool-handler.js';
