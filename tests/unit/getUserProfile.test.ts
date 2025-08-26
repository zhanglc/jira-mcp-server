import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { JiraUser } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock jira-client
jest.mock('jira-client');

const mockJiraClient = {
  searchUsers: jest.fn(),
};

// Mock the jira-client module
jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => mockJiraClient);
});

describe('JiraClientWrapper.getUserProfile', () => {
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

  describe('getUserProfile(username)', () => {
    it('should return user profile information when called successfully with valid username', async () => {
      // Arrange
      const username = 'JIRAUSER23511';
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=JIRAUSER23511',
        key: 'JIRAUSER23511',
        name: 'JIRAUSER23511',
        emailAddress: 'test.user@dentsplysirona.com',
        displayName: 'Test User',
        active: true,
        deleted: false,
        timeZone: 'America/New_York',
        locale: 'en_US',
        avatarUrls: {
          '16x16':
            'https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=JIRAUSER23511',
          '24x24':
            'https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=JIRAUSER23511',
          '32x32':
            'https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=JIRAUSER23511',
          '48x48':
            'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER23511',
        },
        groups: {
          size: 3,
          items: [],
        },
        applicationRoles: {
          size: 1,
          items: [],
        },
        expand: 'groups,applicationRoles',
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
      expect(result).toEqual(mockUser);
      expect(result.name).toBe('JIRAUSER23511');
      expect(result.displayName).toBe('Test User');
      expect(result.active).toBe(true);
    });

    it('should return user profile with minimal fields when server returns basic user info', async () => {
      // Arrange
      const username = 'JIRAUSER12345';
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=JIRAUSER12345',
        key: 'JIRAUSER12345',
        name: 'JIRAUSER12345',
        emailAddress: 'minimal.user@dentsplysirona.com',
        displayName: 'Minimal User',
        active: true,
        timeZone: 'UTC',
        avatarUrls: {
          '48x48':
            'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER12345',
        },
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
      expect(result).toEqual(mockUser);
      expect(result.self).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.emailAddress).toBeDefined();
      expect(result.displayName).toBeDefined();
      expect(result.active).toBeDefined();
      expect(result.timeZone).toBeDefined();
      expect(result.avatarUrls).toBeDefined();
    });

    it('should handle user profile with Cloud accountId field', async () => {
      // Arrange
      const username = 'cloud.user@company.com';
      const mockUser: JiraUser = {
        self: 'https://company.atlassian.net/rest/api/2/user?accountId=123456:abcd-efgh',
        accountId: '123456:abcd-efgh',
        name: 'cloud.user@company.com',
        key: 'cloud.user@company.com',
        emailAddress: 'cloud.user@company.com',
        displayName: 'Cloud User',
        active: true,
        timeZone: 'America/Los_Angeles',
        avatarUrls: {
          '48x48':
            'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        },
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
      expect(result).toEqual(mockUser);
      expect(result.accountId).toBe('123456:abcd-efgh');
    });

    it('should handle inactive user profile', async () => {
      // Arrange
      const username = 'JIRAUSER99999';
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=JIRAUSER99999',
        key: 'JIRAUSER99999',
        name: 'JIRAUSER99999',
        emailAddress: 'inactive.user@dentsplysirona.com',
        displayName: 'Inactive User',
        active: false,
        deleted: true,
        timeZone: 'UTC',
        avatarUrls: {
          '48x48':
            'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER99999',
        },
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
      expect(result).toEqual(mockUser);
      expect(result.active).toBe(false);
      expect(result.deleted).toBe(true);
    });

    it('should handle email address as username parameter', async () => {
      // Arrange
      const username = 'user.name@dentsplysirona.com';
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=user.name%40dentsplysirona.com',
        key: 'JIRAUSER56789',
        name: 'user.name@dentsplysirona.com',
        emailAddress: 'user.name@dentsplysirona.com',
        displayName: 'User Name',
        active: true,
        timeZone: 'America/New_York',
        avatarUrls: {
          '48x48':
            'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER56789',
        },
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
      expect(result).toEqual(mockUser);
      expect(result.name).toBe('user.name@dentsplysirona.com');
    });

    it('should throw ApiError when user does not exist (404)', async () => {
      // Arrange
      const username = 'nonexistent.user';
      const notFoundError = new Error('User not found');
      (notFoundError as any).statusCode = 404;
      mockJiraClient.searchUsers.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should throw ApiError when access is denied to user profile (403)', async () => {
      // Arrange
      const username = 'restricted.user';
      const forbiddenError = new Error('Forbidden');
      (forbiddenError as any).statusCode = 403;
      mockJiraClient.searchUsers.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should throw ApiError when authentication fails (401)', async () => {
      // Arrange
      const username = 'some.user';
      const authError = new Error('Authentication failed');
      (authError as any).statusCode = 401;
      mockJiraClient.searchUsers.mockRejectedValue(authError);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should throw ApiError when network connection fails', async () => {
      // Arrange
      const username = 'some.user';
      const networkError = new Error('ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockJiraClient.searchUsers.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should throw ApiError when server returns 500 error', async () => {
      // Arrange
      const username = 'some.user';
      const serverError = new Error('Internal Server Error');
      (serverError as any).statusCode = 500;
      mockJiraClient.searchUsers.mockRejectedValue(serverError);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should handle null response from jira-client', async () => {
      // Arrange
      const username = 'some.user';
      mockJiraClient.searchUsers.mockResolvedValue(null);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should handle undefined response from jira-client', async () => {
      // Arrange
      const username = 'some.user';
      mockJiraClient.searchUsers.mockResolvedValue(undefined);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should handle empty array response from jira-client', async () => {
      // Arrange
      const username = 'nonexistent.user';
      mockJiraClient.searchUsers.mockResolvedValue([]);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should validate that returned user has all required fields', async () => {
      // Arrange
      const username = 'JIRAUSER11111';
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=JIRAUSER11111',
        key: 'JIRAUSER11111',
        name: 'JIRAUSER11111',
        emailAddress: 'complete.user@dentsplysirona.com',
        displayName: 'Complete User',
        active: true,
        timeZone: 'America/New_York',
        avatarUrls: {
          '48x48':
            'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER11111',
        },
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(result).toHaveProperty('self');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('emailAddress');
      expect(result).toHaveProperty('displayName');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('timeZone');
      expect(result).toHaveProperty('avatarUrls');

      expect(typeof result.self).toBe('string');
      expect(typeof result.key).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.emailAddress).toBe('string');
      expect(typeof result.displayName).toBe('string');
      expect(typeof result.active).toBe('boolean');
      expect(typeof result.timeZone).toBe('string');
      expect(typeof result.avatarUrls).toBe('object');
    });

    it('should preserve all optional fields when present in response', async () => {
      // Arrange
      const username = 'JIRAUSER22222';
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=JIRAUSER22222',
        key: 'JIRAUSER22222',
        name: 'JIRAUSER22222',
        emailAddress: 'full.user@dentsplysirona.com',
        displayName: 'Full User',
        active: true,
        deleted: false,
        timeZone: 'America/New_York',
        locale: 'en_US',
        avatarUrls: {
          '16x16':
            'https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=JIRAUSER22222',
          '24x24':
            'https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=JIRAUSER22222',
          '32x32':
            'https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=JIRAUSER22222',
          '48x48':
            'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER22222',
        },
        groups: {
          size: 5,
          items: [],
        },
        applicationRoles: {
          size: 2,
          items: [],
        },
        expand: 'groups,applicationRoles',
        accountId: 'cloud-account-id',
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(result.deleted).toBe(false);
      expect(result.locale).toBe('en_US');
      expect(result.groups).toEqual({ size: 5, items: [] });
      expect(result.applicationRoles).toEqual({ size: 2, items: [] });
      expect(result.expand).toBe('groups,applicationRoles');
      expect(result.accountId).toBe('cloud-account-id');
    });

    it('should handle empty username parameter', async () => {
      // Arrange
      const username = '';
      const badRequestError = new Error('Bad Request');
      (badRequestError as any).statusCode = 400;
      mockJiraClient.searchUsers.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });

    it('should handle username with special characters', async () => {
      // Arrange
      const username = 'user.name-with_special+chars@domain.com';
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=user.name-with_special%2Bchars%40domain.com',
        key: 'JIRAUSER77777',
        name: 'user.name-with_special+chars@domain.com',
        emailAddress: 'user.name-with_special+chars@domain.com',
        displayName: 'Special User',
        active: true,
        timeZone: 'UTC',
        avatarUrls: {
          '48x48':
            'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER77777',
        },
      };

      mockJiraClient.searchUsers.mockResolvedValue([mockUser]);

      // Act
      const result = await wrapper.getUserProfile(username);

      // Assert
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
      expect(result).toEqual(mockUser);
      expect(result.displayName).toBe('Special User');
    });

    it('should throw ApiError if returned user is missing required fields', async () => {
      // Arrange
      const username = 'invalid.user';
      const invalidUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=invalid.user',
        // Missing key, name, emailAddress, displayName
        active: true,
        timeZone: 'UTC',
      };

      mockJiraClient.searchUsers.mockResolvedValue(invalidUser);

      // Act & Assert
      await expect(wrapper.getUserProfile(username)).rejects.toThrow(ApiError);
      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith({
        query: username,
        username: username,
        maxResults: 1,
        includeActive: true,
        includeInactive: true,
      });
    });
  });
});
