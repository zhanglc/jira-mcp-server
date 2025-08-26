import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { JiraProject } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock jira-client
jest.mock('jira-client');

const mockJiraClient = {
  getProject: jest.fn(),
};

// Mock the jira-client module
jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => mockJiraClient);
});

describe('JiraClientWrapper.getProject', () => {
  let wrapper: JiraClientWrapper;
  let config: JiraConfig;

  beforeEach(() => {
    config = {
      url: 'https://jira.dentsplysirona.com',
      bearer: 'test-token',
    };
    wrapper = new JiraClientWrapper(config);
    jest.clearAllMocks();
  });

  describe('getProject()', () => {
    it('should return project details for valid project key', async () => {
      // Arrange
      const mockProject: JiraProject = {
        id: '16305',
        key: 'DSCWA',
        name: 'DS Core Web App',
        description: 'Core web application project for DentSply Sirona',
        self: 'https://jira.dentsplysirona.com/rest/api/2/project/16305',
        projectTypeKey: 'software',
        archived: false,
        lead: {
          self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=john.doe',
          name: 'john.doe',
          key: 'john.doe',
          displayName: 'John Doe',
          emailAddress: 'john.doe@dentsplysirona.com',
          active: true,
          timeZone: 'America/New_York',
          avatarUrls: {
            '16x16':
              'https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=john.doe',
            '24x24':
              'https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=john.doe',
            '32x32':
              'https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=john.doe',
            '48x48':
              'https://jira.dentsplysirona.com/secure/useravatar?ownerId=john.doe',
          },
        },
        avatarUrls: {
          '16x16':
            'https://jira.dentsplysirona.com/secure/projectavatar?size=xsmall&pid=16305',
          '24x24':
            'https://jira.dentsplysirona.com/secure/projectavatar?size=small&pid=16305',
          '32x32':
            'https://jira.dentsplysirona.com/secure/projectavatar?size=medium&pid=16305',
          '48x48':
            'https://jira.dentsplysirona.com/secure/projectavatar?pid=16305',
        },
        projectCategory: {
          id: '10100',
          name: 'Web Applications',
          description: 'Web application projects',
        },
        components: [
          {
            id: '10000',
            name: 'Frontend',
            description: 'Frontend components',
          },
          {
            id: '10001',
            name: 'Backend',
            description: 'Backend API components',
          },
        ],
        versions: [
          {
            id: '10200',
            name: 'v1.0.0',
            description: 'Initial release',
            archived: false,
            released: true,
            releaseDate: '2024-01-15',
          },
          {
            id: '10201',
            name: 'v1.1.0',
            description: 'Feature update',
            archived: false,
            released: false,
          },
        ],
        roles: {
          Administrators:
            'https://jira.dentsplysirona.com/rest/api/2/project/16305/role/10002',
          Developers:
            'https://jira.dentsplysirona.com/rest/api/2/project/16305/role/10001',
          Users:
            'https://jira.dentsplysirona.com/rest/api/2/project/16305/role/10000',
        },
        issueTypes: [
          {
            id: '10000',
            name: 'Bug',
            description:
              'A problem which impairs or prevents the functions of the product',
            iconUrl:
              'https://jira.dentsplysirona.com/secure/viewavatar?size=xsmall&avatarId=10303&avatarType=issuetype',
            subtask: false,
          },
          {
            id: '10001',
            name: 'Story',
            description: 'A user story',
            iconUrl:
              'https://jira.dentsplysirona.com/secure/viewavatar?size=xsmall&avatarId=10315&avatarType=issuetype',
            subtask: false,
          },
          {
            id: '10002',
            name: 'Task',
            description: 'A task that needs to be done',
            iconUrl:
              'https://jira.dentsplysirona.com/secure/viewavatar?size=xsmall&avatarId=10318&avatarType=issuetype',
            subtask: false,
          },
        ],
      };

      mockJiraClient.getProject.mockResolvedValue(mockProject);

      // Act
      const result = await wrapper.getProject('DSCWA');

      // Assert
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('DSCWA');
      expect(result).toEqual(mockProject);
      expect(result.key).toBe('DSCWA');
      expect(result.name).toBe('DS Core Web App');
      expect(result.id).toBe('16305');
      expect(result.projectTypeKey).toBe('software');
      expect(result.archived).toBe(false);
    });

    it('should return project with minimal data when only required fields are present', async () => {
      // Arrange
      const mockProject: JiraProject = {
        id: '16305',
        key: 'DSCWA',
        name: 'DS Core Web App',
        self: 'https://jira.dentsplysirona.com/rest/api/2/project/16305',
        projectTypeKey: 'software',
      };

      mockJiraClient.getProject.mockResolvedValue(mockProject);

      // Act
      const result = await wrapper.getProject('DSCWA');

      // Assert
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('DSCWA');
      expect(result).toEqual(mockProject);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('self');
      expect(result).toHaveProperty('projectTypeKey');
    });

    it('should handle project key with special characters', async () => {
      // Arrange
      const mockProject: JiraProject = {
        id: '12345',
        key: 'TEST-PROJ',
        name: 'Test Project with Dash',
        self: 'https://jira.dentsplysirona.com/rest/api/2/project/12345',
        projectTypeKey: 'business',
      };

      mockJiraClient.getProject.mockResolvedValue(mockProject);

      // Act
      const result = await wrapper.getProject('TEST-PROJ');

      // Assert
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('TEST-PROJ');
      expect(result).toEqual(mockProject);
      expect(result.key).toBe('TEST-PROJ');
    });

    it('should handle project key with spaces', async () => {
      // Arrange
      const mockProject: JiraProject = {
        id: '54321',
        key: 'TEST SPACE',
        name: 'Test Project with Space',
        self: 'https://jira.dentsplysirona.com/rest/api/2/project/54321',
        projectTypeKey: 'service_desk',
      };

      mockJiraClient.getProject.mockResolvedValue(mockProject);

      // Act
      const result = await wrapper.getProject('TEST SPACE');

      // Assert
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('TEST SPACE');
      expect(result).toEqual(mockProject);
      expect(result.key).toBe('TEST SPACE');
    });

    it('should throw ApiError when project does not exist (404)', async () => {
      // Arrange
      const jiraError = new Error('Project not found');
      (jiraError as any).statusCode = 404;
      mockJiraClient.getProject.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.getProject('NONEXISTENT')).rejects.toThrow(ApiError);
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('NONEXISTENT');
    });

    it('should throw ApiError when access is denied (403)', async () => {
      // Arrange
      const jiraError = new Error('Forbidden');
      (jiraError as any).statusCode = 403;
      mockJiraClient.getProject.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.getProject('RESTRICTED')).rejects.toThrow(ApiError);
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('RESTRICTED');
    });

    it('should throw ApiError when authentication fails (401)', async () => {
      // Arrange
      const jiraError = new Error('Unauthorized');
      (jiraError as any).statusCode = 401;
      mockJiraClient.getProject.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.getProject('DSCWA')).rejects.toThrow(ApiError);
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('DSCWA');
    });

    it('should throw ApiError when network error occurs', async () => {
      // Arrange
      const networkError = new Error('ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockJiraClient.getProject.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.getProject('DSCWA')).rejects.toThrow(ApiError);
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('DSCWA');
    });

    it('should handle null response from jira-client', async () => {
      // Arrange
      mockJiraClient.getProject.mockResolvedValue(null);

      // Act & Assert
      await expect(wrapper.getProject('DSCWA')).rejects.toThrow(ApiError);
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('DSCWA');
    });

    it('should handle undefined response from jira-client', async () => {
      // Arrange
      mockJiraClient.getProject.mockResolvedValue(undefined);

      // Act & Assert
      await expect(wrapper.getProject('DSCWA')).rejects.toThrow(ApiError);
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('DSCWA');
    });

    it('should validate that returned project has required fields', async () => {
      // Arrange
      const mockProject: JiraProject = {
        id: '16305',
        key: 'DSCWA',
        name: 'DS Core Web App',
        self: 'https://jira.dentsplysirona.com/rest/api/2/project/16305',
        projectTypeKey: 'software',
        description: 'Project description',
        archived: false,
      };

      mockJiraClient.getProject.mockResolvedValue(mockProject);

      // Act
      const result = await wrapper.getProject('DSCWA');

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('self');
      expect(result).toHaveProperty('projectTypeKey');
      expect(typeof result.id).toBe('string');
      expect(typeof result.key).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.self).toBe('string');
      expect(typeof result.projectTypeKey).toBe('string');
    });

    it('should handle invalid project key format (empty string)', async () => {
      // Arrange
      const jiraError = new Error('Invalid project key');
      (jiraError as any).statusCode = 400;
      mockJiraClient.getProject.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.getProject('')).rejects.toThrow(ApiError);
      expect(mockJiraClient.getProject).toHaveBeenCalledWith('');
    });

    it('should preserve all optional project fields when present', async () => {
      // Arrange
      const mockProject: JiraProject = {
        id: '16305',
        key: 'DSCWA',
        name: 'DS Core Web App',
        description: 'Detailed project description',
        self: 'https://jira.dentsplysirona.com/rest/api/2/project/16305',
        projectTypeKey: 'software',
        archived: false,
        lead: {
          self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=lead.user',
          name: 'lead.user',
          key: 'lead.user',
          displayName: 'Lead User',
          emailAddress: 'lead.user@dentsplysirona.com',
          active: true,
          timeZone: 'America/New_York',
          avatarUrls: {},
        },
        avatarUrls: {
          '48x48':
            'https://jira.dentsplysirona.com/secure/projectavatar?pid=16305',
        },
        projectCategory: {
          id: '10100',
          name: 'Web Applications',
        },
        components: [],
        versions: [],
        roles: {},
        issueTypes: [],
      };

      mockJiraClient.getProject.mockResolvedValue(mockProject);

      // Act
      const result = await wrapper.getProject('DSCWA');

      // Assert
      expect(result).toEqual(mockProject);
      expect(result.description).toBe('Detailed project description');
      expect(result.lead).toBeDefined();
      expect(result.avatarUrls).toBeDefined();
      expect(result.projectCategory).toBeDefined();
      expect(result.components).toBeDefined();
      expect(result.versions).toBeDefined();
      expect(result.roles).toBeDefined();
      expect(result.issueTypes).toBeDefined();
    });
  });
});
