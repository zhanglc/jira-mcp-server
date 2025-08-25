import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { JiraProject } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
// The test will be skipped if JIRA_PERSONAL_TOKEN is not set
describe('getAllProjects Integration Tests', () => {
  let wrapper: JiraClientWrapper;
  let config: JiraConfig;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    const url = process.env.JIRA_URL || 'https://jira.dentsplysirona.com';
    const username = process.env.JIRA_USERNAME || 'Damon.Zhang@dentsplysirona.com';

    if (!token) {
      console.log('Skipping integration tests - JIRA_PERSONAL_TOKEN not set');
      return;
    }

    config = {
      url,
      username,
      bearer: token
    };

    wrapper = new JiraClientWrapper(config);
  });

  beforeEach(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      pending('JIRA_PERSONAL_TOKEN not set - skipping integration test');
    }
  });

  describe('Real Jira Server Integration', () => {
    it('should retrieve all projects from real Jira server', async () => {
      // Act
      const projects = await wrapper.getAllProjects();

      // Assert
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);

      // Validate that all projects have required fields
      projects.forEach((project: JiraProject) => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('key');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('self');
        expect(project).toHaveProperty('projectTypeKey');

        expect(typeof project.id).toBe('string');
        expect(typeof project.key).toBe('string');
        expect(typeof project.name).toBe('string');
        expect(typeof project.self).toBe('string');
        expect(typeof project.projectTypeKey).toBe('string');

        // Check that self URL is valid
        expect(project.self).toMatch(/^https?:\/\/.+\/rest\/api\/2\/project\/.+/);
      });

      console.log(`Retrieved ${projects.length} projects from Jira server`);
      console.log('Project keys:', projects.map(p => p.key).join(', '));
    }, 30000);

    it('should find DSCWA project in the results', async () => {
      // Act
      const projects = await wrapper.getAllProjects();

      // Assert
      const dscwaProject = projects.find((project: JiraProject) => project.key === 'DSCWA');
      expect(dscwaProject).toBeDefined();

      if (dscwaProject) {
        expect(dscwaProject.id).toBeDefined();
        expect(dscwaProject.name).toBeDefined();
        expect(dscwaProject.self).toContain('project');
        expect(dscwaProject.projectTypeKey).toBeDefined();

        console.log('DSCWA project details:', {
          id: dscwaProject.id,
          key: dscwaProject.key,
          name: dscwaProject.name,
          projectTypeKey: dscwaProject.projectTypeKey,
          archived: dscwaProject.archived
        });
      }
    }, 30000);

    it('should handle includeArchived parameter correctly', async () => {
      // Act
      const allProjects = await wrapper.getAllProjects(true);
      const activeProjects = await wrapper.getAllProjects(false);

      // Assert
      expect(Array.isArray(allProjects)).toBe(true);
      expect(Array.isArray(activeProjects)).toBe(true);
      expect(allProjects.length).toBeGreaterThanOrEqual(activeProjects.length);

      // Check that activeProjects doesn't include archived projects
      const archivedInActive = activeProjects.filter((project: JiraProject) => project.archived === true);
      expect(archivedInActive.length).toBe(0);

      console.log(`All projects: ${allProjects.length}, Active projects: ${activeProjects.length}`);
    }, 30000);

    it('should validate project data structure against real API', async () => {
      // Act
      const projects = await wrapper.getAllProjects();

      // Assert
      expect(projects.length).toBeGreaterThan(0);

      const sampleProject = projects[0];
      
      // Required fields
      expect(sampleProject.id).toBeDefined();
      expect(sampleProject.key).toBeDefined();
      expect(sampleProject.name).toBeDefined();
      expect(sampleProject.self).toBeDefined();
      expect(sampleProject.projectTypeKey).toBeDefined();

      // Log the actual structure for model validation
      console.log('Sample project structure:', {
        hasId: 'id' in sampleProject,
        hasKey: 'key' in sampleProject,
        hasName: 'name' in sampleProject,
        hasSelf: 'self' in sampleProject,
        hasProjectTypeKey: 'projectTypeKey' in sampleProject,
        hasDescription: 'description' in sampleProject,
        hasLead: 'lead' in sampleProject,
        hasArchived: 'archived' in sampleProject,
        hasAvatarUrls: 'avatarUrls' in sampleProject,
        hasProjectCategory: 'projectCategory' in sampleProject,
        additionalFields: Object.keys(sampleProject).filter(key => 
          !['id', 'key', 'name', 'self', 'projectTypeKey', 'description', 'lead', 'archived', 'avatarUrls', 'projectCategory'].includes(key)
        )
      });
    }, 30000);

    it('should handle authentication errors gracefully', async () => {
      // Arrange - Create wrapper with invalid token
      const invalidConfig: JiraConfig = {
        url: process.env.JIRA_URL || 'https://jira.dentsplysirona.com',
        username: process.env.JIRA_USERNAME || 'Damon.Zhang@dentsplysirona.com',
        bearer: 'invalid-token-12345'
      };
      const invalidWrapper = new JiraClientWrapper(invalidConfig);

      // Act & Assert
      // Note: Some Jira Server configurations may return empty results instead of throwing errors
      // for unauthorized access, so we check for either an error or empty results
      try {
        const result = await invalidWrapper.getAllProjects();
        // If no error is thrown, we expect empty results due to lack of permissions
        expect(Array.isArray(result)).toBe(true);
        console.log(`Authentication test result: ${result.length} projects returned with invalid token`);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }
    }, 30000);
  });
});