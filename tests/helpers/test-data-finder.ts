import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';

/**
 * Helper utilities to find suitable test data dynamically
 */
export class TestDataFinder {
  private wrapper: JiraClientWrapper;

  constructor(config: JiraConfig) {
    this.wrapper = new JiraClientWrapper(config);
  }

  /**
   * Find a project that has agile boards for testing
   */
  async findProjectWithBoards(): Promise<{
    projectKey: string;
    boardId: number;
  } | null> {
    try {
      // Get all projects
      const projects = await this.wrapper.getAllProjects();

      // Try to find a project with boards
      for (const project of projects.slice(0, 10)) {
        // Limit to first 10 projects to avoid too many API calls
        try {
          const boards = await this.wrapper.getAgileBoards(project.key);
          if (boards.length > 0) {
            console.log(
              `Found project ${project.key} with ${boards.length} boards`
            );
            return {
              projectKey: project.key,
              boardId: boards[0].id,
            };
          }
        } catch (error) {
          // Skip projects that don't support agile boards
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding project with boards:', error);
      return null;
    }
  }

  /**
   * Find a project with issues for testing
   */
  async findProjectWithIssues(): Promise<string | null> {
    try {
      const projects = await this.wrapper.getAllProjects();

      // Try to find a project with issues
      for (const project of projects.slice(0, 5)) {
        try {
          const result = await this.wrapper.getProjectIssues(project.key, {
            maxResults: 1,
          });
          if (result.total > 0) {
            console.log(
              `Found project ${project.key} with ${result.total} issues`
            );
            return project.key;
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding project with issues:', error);
      return null;
    }
  }

  /**
   * Find any valid issue key for testing
   */
  async findAnyIssue(): Promise<string | null> {
    try {
      const result = await this.wrapper.searchIssues('ORDER BY created DESC', {
        maxResults: 1,
      });
      if (result.issues.length > 0) {
        const issueKey = result.issues[0].key;
        console.log(`Found test issue: ${issueKey}`);
        return issueKey;
      }
      return null;
    } catch (error) {
      console.error('Error finding test issue:', error);
      return null;
    }
  }

  /**
   * Get basic connection info for testing
   */
  async getServerInfo() {
    try {
      return await this.wrapper.getServerInfo();
    } catch (error) {
      console.error('Error getting server info:', error);
      throw error;
    }
  }
}
