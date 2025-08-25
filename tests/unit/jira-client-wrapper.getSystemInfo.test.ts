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

describe('JiraClientWrapper.getSystemInfo', () => {
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

  describe('successful system info retrieval', () => {
    test('should return system info when API returns valid data', async () => {
      // Arrange
      const mockSystemInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        scmInfo: 'abc123def456',
        serverTitle: 'Test Jira Server',
        healthChecks: [
          {
            name: 'Database Connectivity',
            description: 'Tests database connection',
            status: 'PASS'
          }
        ],
        systemInfoService: {
          version: '9.12.5',
          edition: 'Enterprise'
        }
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockSystemInfo);

      // Act
      const result = await wrapper.getSystemInfo();

      // Assert
      expect(result).toEqual(mockSystemInfo);
      expect(mockJiraClient.getServerInfo).toHaveBeenCalledTimes(1);
      expect(mockJiraClient.getServerInfo).toHaveBeenCalledWith();
    });

    test('should handle system info with minimal required fields', async () => {
      // Arrange
      const mockMinimalSystemInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '8.20.1',
        versionNumbers: [8, 20, 1],
        deploymentType: 'Server',
        buildNumber: 800001,
        buildDate: '2023-01-15T09:00:00.000Z',
        scmInfo: 'xyz789abc123'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockMinimalSystemInfo);

      // Act
      const result = await wrapper.getSystemInfo();

      // Assert
      expect(result).toEqual(mockMinimalSystemInfo);
      expect(result.serverTitle).toBeUndefined();
      expect(result.healthChecks).toBeUndefined();
      expect(result.systemInfoService).toBeUndefined();
    });

    test('should handle version parsing correctly', async () => {
      // Arrange
      const mockSystemInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '10.0.0-beta1',
        versionNumbers: [10, 0, 0],
        deploymentType: 'Server',
        buildNumber: 1000000,
        buildDate: '2024-01-01T00:00:00.000Z',
        scmInfo: 'beta123'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockSystemInfo);

      // Act
      const result = await wrapper.getSystemInfo();

      // Assert
      expect(result.version).toBe('10.0.0-beta1');
      expect(result.versionNumbers).toEqual([10, 0, 0]);
    });
  });

  describe('error handling', () => {
    test('should throw ApiError when jira-client throws error', async () => {
      // Arrange
      const jiraError = new Error('Unauthorized');
      (jiraError as any).statusCode = 401;
      mockJiraClient.getServerInfo.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('Unauthorized');
    });

    test('should throw ApiError when response is null', async () => {
      // Arrange
      mockJiraClient.getServerInfo.mockResolvedValue(null);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('No system information received from server');
    });

    test('should throw ApiError when response is undefined', async () => {
      // Arrange
      mockJiraClient.getServerInfo.mockResolvedValue(undefined);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('No system information received from server');
    });

    test('should throw ApiError when required fields are missing', async () => {
      // Arrange
      const incompleteSystemInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5'
        // Missing required fields: versionNumbers, deploymentType, buildNumber, buildDate, scmInfo
      };

      mockJiraClient.getServerInfo.mockResolvedValue(incompleteSystemInfo);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('Invalid system information received from server');
    });

    test('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network timeout');
      mockJiraClient.getServerInfo.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
    });

    test('should handle permissions error', async () => {
      // Arrange
      const permissionError = new Error('Forbidden');
      (permissionError as any).statusCode = 403;
      mockJiraClient.getServerInfo.mockRejectedValue(permissionError);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('Forbidden');
    });
  });

  describe('logging behavior', () => {
    test('should log successful system info retrieval', async () => {
      // Arrange
      const mockSystemInfo = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(mockSystemInfo);

      // Mock console.log to capture logs
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await wrapper.getSystemInfo();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Getting system information')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully retrieved system info: Server 9.12.5')
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
      await expect(wrapper.getSystemInfo()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get system information:'),
        jiraError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('data validation', () => {
    test('should validate baseUrl field', async () => {
      // Arrange
      const systemInfoWithoutBaseUrl = {
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(systemInfoWithoutBaseUrl);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('Invalid system information received from server');
    });

    test('should validate version field', async () => {
      // Arrange
      const systemInfoWithoutVersion = {
        baseUrl: 'https://test-jira.example.com',
        versionNumbers: [9, 12, 5],
        deploymentType: 'Server',
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(systemInfoWithoutVersion);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('Invalid system information received from server');
    });

    test('should validate deploymentType field', async () => {
      // Arrange
      const systemInfoWithoutDeploymentType = {
        baseUrl: 'https://test-jira.example.com',
        version: '9.12.5',
        versionNumbers: [9, 12, 5],
        buildNumber: 900000,
        buildDate: '2023-10-15T10:30:00.000Z',
        scmInfo: 'abc123def456'
      };

      mockJiraClient.getServerInfo.mockResolvedValue(systemInfoWithoutDeploymentType);

      // Act & Assert
      await expect(wrapper.getSystemInfo()).rejects.toThrow(ApiError);
      await expect(wrapper.getSystemInfo()).rejects.toThrow('Invalid system information received from server');
    });
  });
});