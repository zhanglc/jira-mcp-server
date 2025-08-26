/**
 * Tools Index Module Tests
 *
 * Verifies the tools index module properly exports and aggregates
 * all tool definitions from specialized modules.
 */

import {
  getAllTools,
  getIssueTools,
  getProjectTools,
  getUserTools,
  getAgileTools,
  getSystemTools,
} from '../../../src/server/tools/index.js';

describe('Tools Index Module', () => {
  it('should export getAllTools function', () => {
    expect(typeof getAllTools).toBe('function');
  });

  it('should export getIssueTools function', () => {
    expect(typeof getIssueTools).toBe('function');
  });

  it('should export getProjectTools function', () => {
    expect(typeof getProjectTools).toBe('function');
  });

  it('should export getUserTools function', () => {
    expect(typeof getUserTools).toBe('function');
  });

  it('should export getAgileTools function', () => {
    expect(typeof getAgileTools).toBe('function');
  });

  it('should export getSystemTools function', () => {
    expect(typeof getSystemTools).toBe('function');
  });

  it('should return all Issue, Project, User, Agile, and System tools from getAllTools', () => {
    const allTools = getAllTools();
    const issueTools = getIssueTools();
    const projectTools = getProjectTools();
    const userTools = getUserTools();
    const agileTools = getAgileTools();
    const systemTools = getSystemTools();

    expect(allTools).toHaveLength(19); // 5 issue + 4 project + 2 user + 5 agile + 3 system tools
    expect(allTools).toEqual([
      ...issueTools,
      ...projectTools,
      ...userTools,
      ...agileTools,
      ...systemTools,
    ]);
  });

  it('should return tools with valid names', () => {
    const allTools = getAllTools();
    const expectedNames = [
      // Issue tools
      'getIssue',
      'getIssueTransitions',
      'searchIssues',
      'getIssueWorklogs',
      'downloadAttachments',
      // Project tools
      'getAllProjects',
      'getProject',
      'getProjectIssues',
      'getProjectVersions',
      // User tools
      'getCurrentUser',
      'getUserProfile',
      // Agile tools
      'getAgileBoards',
      'getBoardIssues',
      'getSprintsFromBoard',
      'getSprintIssues',
      'getSprint',
      // System tools
      'searchFields',
      'getSystemInfo',
      'getServerInfo',
    ];

    expect(allTools.map(tool => tool.name)).toEqual(expectedNames);
  });

  it('should return Issue tools only from getIssueTools', () => {
    const issueTools = getIssueTools();
    const expectedIssueNames = [
      'getIssue',
      'getIssueTransitions',
      'searchIssues',
      'getIssueWorklogs',
      'downloadAttachments',
    ];

    expect(issueTools).toHaveLength(5);
    expect(issueTools.map(tool => tool.name)).toEqual(expectedIssueNames);
  });

  it('should return Project tools only from getProjectTools', () => {
    const projectTools = getProjectTools();
    const expectedProjectNames = [
      'getAllProjects',
      'getProject',
      'getProjectIssues',
      'getProjectVersions',
    ];

    expect(projectTools).toHaveLength(4);
    expect(projectTools.map(tool => tool.name)).toEqual(expectedProjectNames);
  });

  it('should return User tools only from getUserTools', () => {
    const userTools = getUserTools();
    const expectedUserNames = ['getCurrentUser', 'getUserProfile'];

    expect(userTools).toHaveLength(2);
    expect(userTools.map(tool => tool.name)).toEqual(expectedUserNames);
  });

  it('should return Agile tools only from getAgileTools', () => {
    const agileTools = getAgileTools();
    const expectedAgileNames = [
      'getAgileBoards',
      'getBoardIssues',
      'getSprintsFromBoard',
      'getSprintIssues',
      'getSprint',
    ];

    expect(agileTools).toHaveLength(5);
    expect(agileTools.map(tool => tool.name)).toEqual(expectedAgileNames);
  });

  it('should return System tools only from getSystemTools', () => {
    const systemTools = getSystemTools();
    const expectedSystemNames = [
      'searchFields',
      'getSystemInfo',
      'getServerInfo',
    ];

    expect(systemTools).toHaveLength(3);
    expect(systemTools.map(tool => tool.name)).toEqual(expectedSystemNames);
  });
});
