import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock jira-client
const mockJiraClient = {
  getServerInfo: jest.fn()
};

jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => mockJiraClient);
});

describe('JiraClientWrapper.getServerInfo', () => {
  let wrapper: JiraClientWrapper;
  let config: JiraConfig;

  beforeEach(() => {
    config = {
      url: 'https://test-jira.example.com',
      bearer: 'test-token'
    };
    wrapper = new JiraClientWrapper(config);
    jest.clearAllMocks();
  });

  describe('successful server info retrieval', () => {
    test('should return server info when API returns valid data', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456',
        serverTitle: 'Test Jira Server',
        defaultLocale: {
          locale: 'en_US'
        }
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result).toEqual(mockServerInfo);
      expect(mockJiraClient.getServerInfo).toHaveBeenCalledTimes(1);
      expect(mockJiraClient.getServerInfo).toHaveBeenCalledWith();
    });

    test('should handle server info with minimal required fields', async () => {
      // Arrange
      const mockMinimalServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '8.20.1',
        versionNumbers: [8, 20, 1],
        deploymentType: 'Server',
        buildNumber: 800001,
        buildDate: '2023-01-15T09:00:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'xyz789abc123'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockMinimalServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result).toEqual(mockMinimalServerInfo);
      expect(result.serverTitle).toBeUndefined();
      expect(result.defaultLocale).toBeUndefined();
    });

    test('should handle version parsing correctly', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '10.0.0-beta1',
        versionNumbers: [10, 0, 0],
        deploymentType: 'Server',
        buildNumber: 1000000,
        buildDate: '2024-01-01T00:00:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'beta123'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result.version).toBe('10.0.0-beta1');
      expect(result.versionNumbers).toEqual([10, 0, 0]);
    });

    test('should handle different locale formats', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456',
        defaultLocale: {
          locale: 'de_DE'
        }
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result.defaultLocale?.locale).toBe('de_DE');
    });

    test('should handle server time in different formats', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123+0000',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result.serverTime).toBe('2024-01-15T14:30:45.123+0000');
    });
  });

  describe('error handling', () => {
    test('should throw ApiError when jira-client throws error', async () => {
      // Arrange
      const jiraError = new Error('Unauthorized');
      (jiraError as any).statusCode = 401;
      mockJiraClient.getServerInfo.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('Unauthorized');
    });

    test('should throw ApiError when response is null', async () => {
      // Arrange
      mockJiraClient.getServerInfo.mockResolvedValue(null);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('No server information received from server');
    });

    test('should throw ApiError when response is undefined', async () => {
      // Arrange
      mockJiraClient.getServerInfo.mockResolvedValue(undefined);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('No server information received from server');
    });

    test('should throw ApiError when required fields are missing', async () => {
      // Arrange
      const incompleteServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5'
        // Missing required fields: versionNumbers, deploymentType, buildNumber, buildDate, serverTime, scmInfo
      };

      mockJiraClient.getServerInfo.mockResolvedValue(incompleteServerInfo);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('Invalid server information received from server');
    });

    test('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network timeout');
      mockJiraClient.getServerInfo.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
    });

    test('should handle permissions error', async () => {
      // Arrange
      const permissionError = new Error('Forbidden');
      (permissionError as any).statusCode = 403;
      mockJiraClient.getServerInfo.mockRejectedValue(permissionError);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('Forbidden');
    });

    test('should handle server info API not available', async () => {
      // Arrange
      const notFoundError = new Error('Not Found');
      (notFoundError as any).statusCode = 404;
      mockJiraClient.getServerInfo.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('Not Found');
    });
  });

  describe('logging behavior', () => {
    test('should log successful server info retrieval', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Mock console.log to capture logs
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await wrapper.getServerInfo();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Getting server information')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully retrieved server info: Server 9.12.5')
      );

      consoleSpy.mockRestore();
    });

    test('should log errors when API call fails', async () => {
      // Arrange
      const jiraError = new Error('API Error');
      mockJiraClient.getServerInfo.mockRejectedValue(jiraError);

      // Mock console.error to capture error logs
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get server information:'),
        jiraError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('data validation', () => {
    test('should validate baseUrl field', async () => {
      // Arrange
      const serverInfoWithoutBaseUrl = {
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(serverInfoWithoutBaseUrl);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('Invalid server information received from server');
    });

    test('should validate version field', async () => {
      // Arrange
      const serverInfoWithoutVersion = {
        baseUrl: 'https://test-jira.example.com',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(serverInfoWithoutVersion);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('Invalid server information received from server');
    });

    test('should provide current serverTime when not in API response', async () => {
      // Arrange
      const serverInfoWithoutServerTime = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(serverInfoWithoutServerTime);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result).toHaveProperty('serverTime');
      expect(result.serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO timestamp format
      expect(new Date(result.serverTime)).toBeInstanceOf(Date);
    });

    test('should validate deploymentType field', async () => {
      // Arrange
      const serverInfoWithoutDeploymentType = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(serverInfoWithoutDeploymentType);

      // Act & Assert
      await expect(wrapper.getServerInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getServerInfo()).rejects.toThrow('Invalid server information received from server');
    });
  });

  describe('field differences from getSystemInfo', () => {
    test('should return serverTime field that distinguishes it from getSystemInfo', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result).toHaveProperty('serverTime');
      expect(result.serverTime).toBe('2024-01-15T14:30:45.123Z');
      // serverTime should be a real-time timestamp, different from buildDate
      expect(result.serverTime).not.toBe(result.buildDate);
    });

    test('should return defaultLocale field that distinguishes it from getSystemInfo', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456',
        defaultLocale: {
          locale: 'en_US'
        }
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result).toHaveProperty('defaultLocale');
      expect(result.defaultLocale?.locale).toBe('en_US');
    });

    test('should not include healthChecks field (specific to getSystemInfo)', async () => {
      // Arrange
      const mockServerInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        serverTime: '2024-01-15T14:30:45.123Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockServerInfo);

      // Act
      const result = await wrapper.getServerInfo();

      // Assert
      expect(result).not.toHaveProperty('healthChecks');
      expect(result).not.toHaveProperty('systemInfoService');
    });
  });
});