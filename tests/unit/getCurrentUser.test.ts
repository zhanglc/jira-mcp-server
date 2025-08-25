import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { JiraUser } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock jira-client
jest.mock('jira-client');

const mockJiraClient = {
  getCurrentUser: jest.fn()
};

// Mock the jira-client module
jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => mockJiraClient);
});

describe('JiraClientWrapper.getCurrentUser', () => {
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

  describe('getCurrentUser()', () => {
    it('should return current user information when called successfully', async () => {
      // Arrange
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=test.user@company.com',
        key: 'JIRAUSER12345',
        name: 'test.user@company.com',
        emailAddress: 'test.user@company.com',
        displayName: 'Test User',
        active: true,
        deleted: false,
        timeZone: 'America/New_York',
        locale: 'en_US',
        avatarUrls: {
          '16x16': 'https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=JIRAUSER12345',
          '24x24': 'https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=JIRAUSER12345',
          '32x32': 'https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=JIRAUSER12345',
          '48x48': 'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER12345'
        },
        groups: {
          size: 3,
          items: []
        },
        applicationRoles: {
          size: 1,
          items: []
        },
        expand: 'groups,applicationRoles'
      };

      mockJiraClient.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      const result = await wrapper.getCurrentUser();

      // Assert
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
      expect(result).toEqual(mockUser);
      expect(result.name).toBe('test.user@company.com');
      expect(result.displayName).toBe('Test User');
      expect(result.active).toBe(true);
    });

    it('should return current user with minimal fields when server returns basic user info', async () => {
      // Arrange
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=minimal.user@company.com',
        key: 'JIRAUSER67890',
        name: 'minimal.user@company.com',
        emailAddress: 'minimal.user@company.com',
        displayName: 'Minimal User',
        active: true,
        timeZone: 'UTC',
        avatarUrls: {
          '48x48': 'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER67890'
        }
      };

      mockJiraClient.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      const result = await wrapper.getCurrentUser();

      // Assert
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
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

    it('should handle user with Cloud accountId field', async () => {
      // Arrange
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
          '48x48': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png'
        }
      };

      mockJiraClient.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      const result = await wrapper.getCurrentUser();

      // Assert
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
      expect(result).toEqual(mockUser);
      expect(result.accountId).toBe('123456:abcd-efgh');
    });

    it('should handle inactive user', async () => {
      // Arrange
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=inactive.user@company.com',
        key: 'JIRAUSER99999',
        name: 'inactive.user@company.com',
        emailAddress: 'inactive.user@company.com',
        displayName: 'Inactive User',
        active: false,
        deleted: true,
        timeZone: 'UTC',
        avatarUrls: {
          '48x48': 'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER99999'
        }
      };

      mockJiraClient.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      const result = await wrapper.getCurrentUser();

      // Assert
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
      expect(result).toEqual(mockUser);
      expect(result.active).toBe(false);
      expect(result.deleted).toBe(true);
    });

    it('should throw ApiError when authentication fails (401)', async () => {
      // Arrange
      const authError = new Error('Authentication failed');
      (authError as any).statusCode = 401;
      mockJiraClient.getCurrentUser.mockRejectedValue(authError);

      // Act & Assert
      await expect(wrapper.getCurrentUser()).rejects.toThrow(ApiError);
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
    });

    it('should throw ApiError when access is forbidden (403)', async () => {
      // Arrange
      const forbiddenError = new Error('Forbidden');
      (forbiddenError as any).statusCode = 403;
      mockJiraClient.getCurrentUser.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(wrapper.getCurrentUser()).rejects.toThrow(ApiError);
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
    });

    it('should throw ApiError when network connection fails', async () => {
      // Arrange
      const networkError = new Error('ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockJiraClient.getCurrentUser.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.getCurrentUser()).rejects.toThrow(ApiError);
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
    });

    it('should throw ApiError when server returns 500 error', async () => {
      // Arrange
      const serverError = new Error('Internal Server Error');
      (serverError as any).statusCode = 500;
      mockJiraClient.getCurrentUser.mockRejectedValue(serverError);

      // Act & Assert
      await expect(wrapper.getCurrentUser()).rejects.toThrow(ApiError);
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
    });

    it('should handle null response from jira-client', async () => {
      // Arrange
      mockJiraClient.getCurrentUser.mockResolvedValue(null);

      // Act & Assert
      await expect(wrapper.getCurrentUser()).rejects.toThrow(ApiError);
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
    });

    it('should handle undefined response from jira-client', async () => {
      // Arrange
      mockJiraClient.getCurrentUser.mockResolvedValue(undefined);

      // Act & Assert
      await expect(wrapper.getCurrentUser()).rejects.toThrow(ApiError);
      expect(mockJiraClient.getCurrentUser).toHaveBeenCalledWith();
    });

    it('should validate that returned user has all required fields', async () => {
      // Arrange
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=complete.user@company.com',
        key: 'JIRAUSER11111',
        name: 'complete.user@company.com',
        emailAddress: 'complete.user@company.com',
        displayName: 'Complete User',
        active: true,
        timeZone: 'America/New_York',
        avatarUrls: {
          '48x48': 'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER11111'
        }
      };

      mockJiraClient.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      const result = await wrapper.getCurrentUser();

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
      const mockUser: JiraUser = {
        self: 'https://jira.dentsplysirona.com/rest/api/2/user?username=full.user@company.com',
        key: 'JIRAUSER22222',
        name: 'full.user@company.com',
        emailAddress: 'full.user@company.com',
        displayName: 'Full User',
        active: true,
        deleted: false,
        timeZone: 'America/New_York',
        locale: 'en_US',
        avatarUrls: {
          '16x16': 'https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=JIRAUSER22222',
          '24x24': 'https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=JIRAUSER22222',
          '32x32': 'https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=JIRAUSER22222',
          '48x48': 'https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER22222'
        },
        groups: {
          size: 5,
          items: []
        },
        applicationRoles: {
          size: 2,
          items: []
        },
        expand: 'groups,applicationRoles',
        accountId: 'cloud-account-id'
      };

      mockJiraClient.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      const result = await wrapper.getCurrentUser();

      // Assert
      expect(result.deleted).toBe(false);
      expect(result.locale).toBe('en_US');
      expect(result.groups).toEqual({ size: 5, items: [] });
      expect(result.applicationRoles).toEqual({ size: 2, items: [] });
      expect(result.expand).toBe('groups,applicationRoles');
      expect(result.accountId).toBe('cloud-account-id');
    });
  });
});