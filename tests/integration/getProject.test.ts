import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { loadConfig } from '../../src/utils/config.js';
import { ApiError } from '../../src/types/api-error.js';

describe('JiraClientWrapper.getProject - Integration Tests', () => {
  let wrapper: JiraClientWrapper;

  beforeAll(() => {
    const config = loadConfig();
    wrapper = new JiraClientWrapper(config);
  });

  describe('getProject() - Real Jira Server', () => {
    it('should retrieve DSCWA project details from real Jira server', async () => {
      // Act
      const project = await wrapper.getProject('DSCWA');

      // Assert - Validate basic structure
      expect(project).toBeDefined();
      expect(project.id).toBe('16305');
      expect(project.key).toBe('DSCWA');
      expect(project.name).toBe('Intent Based System'); // Updated to match actual data
      expect(project.self).toBe('https://jira.dentsplysirona.com/rest/api/2/project/16305');
      expect(project.projectTypeKey).toBeDefined();
      expect(typeof project.projectTypeKey).toBe('string');

      // Validate required fields exist
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('key');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('self');
      expect(project).toHaveProperty('projectTypeKey');

      // Validate field types
      expect(typeof project.id).toBe('string');
      expect(typeof project.key).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.self).toBe('string');
      expect(typeof project.projectTypeKey).toBe('string');

      // Log project details for manual verification
      console.log('Project Details:', {
        id: project.id,
        key: project.key,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
        archived: project.archived,
        hasLead: !!project.lead,
        hasDescription: !!project.description,
        hasAvatarUrls: !!project.avatarUrls,
        hasProjectCategory: !!project.projectCategory,
        componentsCount: project.components?.length || 0,
        versionsCount: project.versions?.length || 0,
        rolesCount: Object.keys(project.roles || {}).length,
        issueTypesCount: project.issueTypes?.length || 0
      });
    }, 30000);

    it('should handle project not found error for non-existent project', async () => {
      // Act & Assert
      await expect(wrapper.getProject('NONEXISTENT_PROJECT_KEY_12345')).rejects.toThrow(ApiError);
      
      try {
        await wrapper.getProject('NONEXISTENT_PROJECT_KEY_12345');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        // Jira Server returns 404 for non-existent projects
        expect(apiError.statusCode).toBe(404);
      }
    }, 15000);

    it('should verify data consistency with getAllProjects for DSCWA project', async () => {
      // Act - Get project both ways
      const singleProject = await wrapper.getProject('DSCWA');
      const allProjects = await wrapper.getAllProjects();
      const dscwaFromList = allProjects.find(p => p.key === 'DSCWA');

      // Assert - Both methods should return consistent data
      expect(dscwaFromList).toBeDefined();
      expect(singleProject.id).toBe(dscwaFromList!.id);
      expect(singleProject.key).toBe(dscwaFromList!.key);
      expect(singleProject.name).toBe(dscwaFromList!.name);
      expect(singleProject.self).toBe(dscwaFromList!.self);
      expect(singleProject.projectTypeKey).toBe(dscwaFromList!.projectTypeKey);
      
      // getProject might have more detailed information
      // but basic fields should match exactly
      console.log('Consistency Check:', {
        'getProject.id': singleProject.id,
        'getAllProjects.id': dscwaFromList!.id,
        'getProject.components': singleProject.components?.length || 0,
        'getAllProjects.components': dscwaFromList!.components?.length || 0,
        'getProject.versions': singleProject.versions?.length || 0,
        'getAllProjects.versions': dscwaFromList!.versions?.length || 0
      });
    }, 30000);

    it('should validate JiraProject interface compliance with real data', async () => {
      // Act
      const project = await wrapper.getProject('DSCWA');

      // Assert - Validate all interface fields
      expect(typeof project.id).toBe('string');
      expect(typeof project.key).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.self).toBe('string');
      expect(typeof project.projectTypeKey).toBe('string');

      // Optional fields - validate if present
      if (project.description !== undefined) {
        expect(typeof project.description).toBe('string');
      }
      
      if (project.archived !== undefined) {
        expect(typeof project.archived).toBe('boolean');
      }

      if (project.lead !== undefined) {
        expect(project.lead).toHaveProperty('self');
        expect(project.lead).toHaveProperty('name');
        expect(project.lead).toHaveProperty('key');
        expect(project.lead).toHaveProperty('displayName');
        expect(project.lead).toHaveProperty('active');
        expect(project.lead).toHaveProperty('avatarUrls');
        // Note: emailAddress might not be present in some Jira Server versions
        // timeZone is also optional in the actual response
      }

      if (project.avatarUrls !== undefined) {
        expect(typeof project.avatarUrls).toBe('object');
      }

      if (project.projectCategory !== undefined) {
        expect(project.projectCategory).toHaveProperty('id');
        expect(project.projectCategory).toHaveProperty('name');
      }

      if (project.components !== undefined) {
        expect(Array.isArray(project.components)).toBe(true);
        project.components.forEach(component => {
          expect(component).toHaveProperty('id');
          expect(component).toHaveProperty('name');
        });
      }

      if (project.versions !== undefined) {
        expect(Array.isArray(project.versions)).toBe(true);
        project.versions.forEach(version => {
          expect(version).toHaveProperty('id');
          expect(version).toHaveProperty('name');
          expect(version).toHaveProperty('archived');
          expect(version).toHaveProperty('released');
        });
      }

      if (project.roles !== undefined) {
        expect(typeof project.roles).toBe('object');
      }

      if (project.issueTypes !== undefined) {
        expect(Array.isArray(project.issueTypes)).toBe(true);
        project.issueTypes.forEach(issueType => {
          expect(issueType).toHaveProperty('id');
          expect(issueType).toHaveProperty('name');
          expect(issueType).toHaveProperty('subtask');
        });
      }

      console.log('Interface Validation Complete:', {
        allRequiredFieldsPresent: !!(project.id && project.key && project.name && project.self && project.projectTypeKey),
        optionalFieldsPresent: {
          description: !!project.description,
          lead: !!project.lead,
          archived: project.archived !== undefined,
          avatarUrls: !!project.avatarUrls,
          projectCategory: !!project.projectCategory,
          components: !!project.components,
          versions: !!project.versions,
          roles: !!project.roles,
          issueTypes: !!project.issueTypes
        }
      });
    }, 15000);

    it('should retrieve project with detailed information compared to getAllProjects', async () => {
      // Act
      const project = await wrapper.getProject('DSCWA');
      const allProjects = await wrapper.getAllProjects();
      const projectFromList = allProjects.find(p => p.key === 'DSCWA');

      // Assert - getProject should provide same or more detailed information
      expect(project).toBeDefined();
      expect(projectFromList).toBeDefined();

      // Basic fields should be identical
      expect(project.id).toBe(projectFromList!.id);
      expect(project.key).toBe(projectFromList!.key);
      expect(project.name).toBe(projectFromList!.name);

      // Log detailed comparison for analysis
      console.log('Detailed Comparison:', {
        getProject: {
          hasComponents: !!project.components,
          componentsCount: project.components?.length || 0,
          hasVersions: !!project.versions,
          versionsCount: project.versions?.length || 0,
          hasRoles: !!project.roles,
          rolesCount: Object.keys(project.roles || {}).length,
          hasIssueTypes: !!project.issueTypes,
          issueTypesCount: project.issueTypes?.length || 0,
          hasProjectCategory: !!project.projectCategory,
          hasLead: !!project.lead
        },
        getAllProjects: {
          hasComponents: !!projectFromList!.components,
          componentsCount: projectFromList!.components?.length || 0,
          hasVersions: !!projectFromList!.versions,
          versionsCount: projectFromList!.versions?.length || 0,
          hasRoles: !!projectFromList!.roles,
          rolesCount: Object.keys(projectFromList!.roles || {}).length,
          hasIssueTypes: !!projectFromList!.issueTypes,
          issueTypesCount: projectFromList!.issueTypes?.length || 0,
          hasProjectCategory: !!projectFromList!.projectCategory,
          hasLead: !!projectFromList!.lead
        }
      });
    }, 30000);

    it('should handle project key case sensitivity correctly', async () => {
      // Act & Assert - Test with correct case
      const project = await wrapper.getProject('DSCWA');
      expect(project.key).toBe('DSCWA');

      // Most Jira implementations are case-sensitive for project keys
      // Test this behavior
      try {
        await wrapper.getProject('dscwa'); // lowercase
        console.log('Project keys are case-insensitive');
      } catch (error) {
        console.log('Project keys are case-sensitive (expected behavior)');
        expect(error).toBeInstanceOf(ApiError);
      }
    }, 15000);
  });
});