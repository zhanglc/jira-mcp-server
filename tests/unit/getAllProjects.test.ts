import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { JiraProject } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock jira-client
jest.mock('jira-client');

const mockJiraClient = {
  listProjects: jest.fn()
};

// Mock the jira-client module
jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => mockJiraClient);
});

describe('JiraClientWrapper.getAllProjects', () => {
  let wrapper: JiraClientWrapper;
  let config: JiraConfig;

  beforeEach(() => {
    config = {
      url: 'https://jira.dentsplysirona.com',
      bearer: 'test-token'
    };
    wrapper = new JiraClientWrapper(config);
    jest.clearAllMocks();
  });

  describe('getAllProjects()', () => {
    it('should return all projects when called without parameters', async () => {
      // Arrange
      const mockProjects: JiraProject[] = [
        {
          id: '10000',
          key: 'DSCWA',
          name: 'DS Core Web App',
          description: 'Core web application project',
          self: 'https://jira.dentsplysirona.com/rest/api/2/project/10000',
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
              '16x16': 'https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=john.doe',
              '24x24': 'https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=john.doe',
              '32x32': 'https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=john.doe',
              '48x48': 'https://jira.dentsplysirona.com/secure/useravatar?ownerId=john.doe'
            }
          }
        },
        {
          id: '10001',
          key: 'TEST',
          name: 'Test Project',
          description: 'Test project for development',
          self: 'https://jira.dentsplysirona.com/rest/api/2/project/10001',
          projectTypeKey: 'business',
          archived: true,
          lead: {
            self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=jane.smith',
            name: 'jane.smith',
            key: 'jane.smith',
            displayName: 'Jane Smith',
            emailAddress: 'jane.smith@dentsplysirona.com',
            active: true,
            timeZone: 'America/New_York',
            avatarUrls: {
              '16x16': 'https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=jane.smith',
              '24x24': 'https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=jane.smith',
              '32x32': 'https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=jane.smith',
              '48x48': 'https://jira.dentsplysirona.com/secure/useravatar?ownerId=jane.smith'
            }
          }
        }
      ];

      mockJiraClient.listProjects.mockResolvedValue(mockProjects);

      // Act
      const result = await wrapper.getAllProjects();

      // Assert
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('DSCWA');
      expect(result[1].key).toBe('TEST');
    });

    it('should return all projects including archived when includeArchived is true', async () => {
      // Arrange
      const mockProjects: JiraProject[] = [
        {
          id: '10000',
          key: 'DSCWA',
          name: 'DS Core Web App',
          self: 'https://jira.dentsplysirona.com/rest/api/2/project/10000',
          projectTypeKey: 'software',
          archived: false
        },
        {
          id: '10001',
          key: 'ARCHIVED',
          name: 'Archived Project',
          self: 'https://jira.dentsplysirona.com/rest/api/2/project/10001',
          projectTypeKey: 'business',
          archived: true
        }
      ];

      mockJiraClient.listProjects.mockResolvedValue(mockProjects);

      // Act
      const result = await wrapper.getAllProjects(true);

      // Assert
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(2);
      expect(result.some(p => p.archived === true)).toBe(true);
    });

    it('should filter out archived projects when includeArchived is false', async () => {
      // Arrange
      const mockProjects: JiraProject[] = [
        {
          id: '10000',
          key: 'DSCWA',
          name: 'DS Core Web App',
          self: 'https://jira.dentsplysirona.com/rest/api/2/project/10000',
          projectTypeKey: 'software',
          archived: false
        },
        {
          id: '10001',
          key: 'ARCHIVED',
          name: 'Archived Project',
          self: 'https://jira.dentsplysirona.com/rest/api/2/project/10001',
          projectTypeKey: 'business',
          archived: true
        }
      ];

      mockJiraClient.listProjects.mockResolvedValue(mockProjects);

      // Act
      const result = await wrapper.getAllProjects(false);

      // Assert
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('DSCWA');
      expect(result[0].archived).toBe(false);
    });

    it('should return empty array when no projects exist', async () => {
      // Arrange
      mockJiraClient.listProjects.mockResolvedValue([]);

      // Act
      const result = await wrapper.getAllProjects();

      // Assert
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle null response from jira-client', async () => {
      // Arrange
      mockJiraClient.listProjects.mockResolvedValue(null);

      // Act
      const result = await wrapper.getAllProjects();

      // Assert
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle undefined response from jira-client', async () => {
      // Arrange
      mockJiraClient.listProjects.mockResolvedValue(undefined);

      // Act
      const result = await wrapper.getAllProjects();

      // Assert
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw ApiError when jira-client throws an error', async () => {
      // Arrange
      const jiraError = new Error('Authentication failed');
      (jiraError as any).statusCode = 401;
      mockJiraClient.listProjects.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.getAllProjects()).rejects.toThrow(ApiError);
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
    });

    it('should throw ApiError when jira-client throws network error', async () => {
      // Arrange
      const networkError = new Error('ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockJiraClient.listProjects.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.getAllProjects()).rejects.toThrow(ApiError);
      expect(mockJiraClient.listProjects).toHaveBeenCalledWith();
    });

    it('should validate that returned projects have required fields', async () => {
      // Arrange
      const mockProjects: JiraProject[] = [
        {
          id: '10000',
          key: 'DSCWA',
          name: 'DS Core Web App',
          self: 'https://jira.dentsplysirona.com/rest/api/2/project/10000',
          projectTypeKey: 'software'
        }
      ];

      mockJiraClient.listProjects.mockResolvedValue(mockProjects);

      // Act
      const result = await wrapper.getAllProjects();

      // Assert
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('key');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('self');
      expect(result[0]).toHaveProperty('projectTypeKey');
      expect(typeof result[0].id).toBe('string');
      expect(typeof result[0].key).toBe('string');
      expect(typeof result[0].name).toBe('string');
      expect(typeof result[0].self).toBe('string');
      expect(typeof result[0].projectTypeKey).toBe('string');
    });
  });
});