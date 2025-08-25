/**
 * Tools Module Index
 * 
 * Central export point for all MCP tool definitions.
 * This provides a clean interface for importing tool definitions
 * from various specialized modules.
 */

// Issue Tools
export {
  getIssueToolDefinition,
  getIssueTransitionsToolDefinition,
  searchIssuesToolDefinition,
  getIssueWorklogsToolDefinition,
  downloadAttachmentsToolDefinition,
  getIssueTools
} from './issue-tools.js';

// Project Tools
export {
  getAllProjectsToolDefinition,
  getProjectToolDefinition,
  getProjectIssuesToolDefinition,
  getProjectVersionsToolDefinition,
  getProjectTools
} from './project-tools.js';

// User Tools
export {
  getCurrentUserToolDefinition,
  getUserProfileToolDefinition,
  getUserTools
} from './user-tools.js';

// Agile Tools
export {
  getAgileBoardsToolDefinition,
  getBoardIssuesToolDefinition,
  getSprintsFromBoardToolDefinition,
  getSprintIssuesToolDefinition,
  getSprintToolDefinition,
  getAgileTools
} from './agile-tools.js';

// System Tools
export {
  searchFieldsToolDefinition,
  getSystemInfoToolDefinition,
  getServerInfoToolDefinition,
  getSystemTools
} from './system-tools.js';

// Import for internal use
import { getIssueTools } from './issue-tools.js';
import { getProjectTools } from './project-tools.js';
import { getUserTools } from './user-tools.js';
import { getAgileTools } from './agile-tools.js';
import { getSystemTools } from './system-tools.js';

// Re-export all tools as a single collection
export function getAllTools() {
  // Complete set of extracted tool modules:
  // - Issue tools (5 tools): getIssue, getIssueTransitions, searchIssues, getIssueWorklogs, downloadAttachments
  // - Project tools (4 tools): getAllProjects, getProject, getProjectIssues, getProjectVersions
  // - User tools (2 tools): getCurrentUser, getUserProfile
  // - Agile tools (5 tools): getAgileBoards, getBoardIssues, getSprintsFromBoard, getSprintIssues, getSprint
  // - System tools (3 tools): searchFields, getSystemInfo, getServerInfo
  // Total: 19 tools (Phase 1 complete)
  
  return [
    ...getIssueTools(),
    ...getProjectTools(),
    ...getUserTools(),
    ...getAgileTools(),
    ...getSystemTools()
  ];
}