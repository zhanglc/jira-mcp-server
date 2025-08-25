import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraVersion } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import JiraClient from 'jira-client';

// Mock jira-client
jest.mock('jira-client');
const MockedJiraClient = JiraClient as jest.MockedClass<typeof JiraClient>;

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

describe('JiraClientWrapper.getProjectVersions', () => {
  let jiraWrapper: JiraClientWrapper;
  let mockJiraClient: jest.Mocked<JiraClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJiraClient = {
      getVersions: jest.fn(),
    } as any;
    
    MockedJiraClient.mockImplementation(() => mockJiraClient);
    
    jiraWrapper = new JiraClientWrapper({
      url: 'https://test.jira.com',
      username: 'test@example.com',
      password: 'test-password'
    });
  });

  describe('Successful version retrieval', () => {
    it('should return project versions for valid project key', async () => {
      // Arrange
      const projectKey = 'DSCWA';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'Version 1.0',
          description: 'First release',
          archived: false,
          released: true,
          startDate: '2023-01-01',
          releaseDate: '2023-01-31',
          overdue: false,
          userStartDate: '01/Jan/23',
          userReleaseDate: '31/Jan/23',
          projectId: 10001
        },
        {
          self: 'https://jira.example.com/rest/api/2/version/10001',
          id: '10001',
          name: 'Version 2.0',
          description: 'Second release',
          archived: false,
          released: false,
          startDate: '2023-02-01',
          releaseDate: '2023-02-28',
          overdue: true,
          userStartDate: '01/Feb/23',
          userReleaseDate: '28/Feb/23',
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result).toEqual(mockVersions);
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
      expect(mockJiraClient.getVersions).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when project has no versions', async () => {
      // Arrange
      const projectKey = 'EMPTY';
      mockJiraClient.getVersions.mockResolvedValue([]);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result).toEqual([]);
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
    });

    it('should handle versions with minimal required fields only', async () => {
      // Arrange
      const projectKey = 'MINIMAL';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'Minimal Version',
          archived: false,
          released: false,
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result).toEqual(mockVersions);
      expect(result[0]).toMatchObject({
        self: expect.any(String),
        id: expect.any(String),
        name: expect.any(String),
        archived: expect.any(Boolean),
        released: expect.any(Boolean),
        projectId: expect.any(Number)
      });
    });

    it('should handle versions with all optional fields', async () => {
      // Arrange
      const projectKey = 'FULL';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'Full Version',
          description: 'Version with all fields',
          archived: true,
          released: true,
          startDate: '2023-01-01',
          releaseDate: '2023-01-31',
          overdue: false,
          userStartDate: '01/Jan/23',
          userReleaseDate: '31/Jan/23',
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result).toEqual(mockVersions);
      expect(result[0]).toMatchObject({
        description: 'Version with all fields',
        startDate: '2023-01-01',
        releaseDate: '2023-01-31',
        overdue: false,
        userStartDate: '01/Jan/23',
        userReleaseDate: '31/Jan/23'
      });
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError when project does not exist', async () => {
      // Arrange
      const projectKey = 'NONEXISTENT';
      const jiraError = new Error('Project does not exist or you do not have permission to view it.');
      (jiraError as any).statusCode = 404;
      
      mockJiraClient.getVersions.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraWrapper.getProjectVersions(projectKey))
        .rejects
        .toThrow(ApiError);
      
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
    });

    it('should throw ApiError when access is denied', async () => {
      // Arrange
      const projectKey = 'FORBIDDEN';
      const jiraError = new Error('You do not have permission to access this project.');
      (jiraError as any).statusCode = 403;
      
      mockJiraClient.getVersions.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraWrapper.getProjectVersions(projectKey))
        .rejects
        .toThrow(ApiError);
      
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
    });

    it('should throw ApiError for invalid project key format', async () => {
      // Arrange
      const projectKey = 'INVALID-KEY-FORMAT';
      const jiraError = new Error('Invalid project key format.');
      (jiraError as any).statusCode = 400;
      
      mockJiraClient.getVersions.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraWrapper.getProjectVersions(projectKey))
        .rejects
        .toThrow(ApiError);
      
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
    });

    it('should handle null response gracefully', async () => {
      // Arrange
      const projectKey = 'NULL_RESPONSE';
      mockJiraClient.getVersions.mockResolvedValue(null as any);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result).toEqual([]);
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
    });

    it('should handle undefined response gracefully', async () => {
      // Arrange
      const projectKey = 'UNDEFINED_RESPONSE';
      mockJiraClient.getVersions.mockResolvedValue(undefined as any);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result).toEqual([]);
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
    });

    it('should handle network errors', async () => {
      // Arrange
      const projectKey = 'NETWORK_ERROR';
      const networkError = new Error('Network timeout');
      (networkError as any).code = 'ETIMEDOUT';
      
      mockJiraClient.getVersions.mockRejectedValue(networkError);

      // Act & Assert
      await expect(jiraWrapper.getProjectVersions(projectKey))
        .rejects
        .toThrow(ApiError);
      
      expect(mockJiraClient.getVersions).toHaveBeenCalledWith(projectKey);
    });
  });

  describe('Version status validation', () => {
    it('should handle released versions correctly', async () => {
      // Arrange
      const projectKey = 'RELEASED';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'Released Version',
          archived: false,
          released: true,
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result[0].released).toBe(true);
      expect(result[0].archived).toBe(false);
    });

    it('should handle archived versions correctly', async () => {
      // Arrange
      const projectKey = 'ARCHIVED';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'Archived Version',
          archived: true,
          released: true,
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result[0].archived).toBe(true);
      expect(result[0].released).toBe(true);
    });

    it('should handle overdue versions correctly', async () => {
      // Arrange
      const projectKey = 'OVERDUE';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'Overdue Version',
          archived: false,
          released: false,
          overdue: true,
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result[0].overdue).toBe(true);
      expect(result[0].released).toBe(false);
    });
  });

  describe('Date field handling', () => {
    it('should handle various date formats', async () => {
      // Arrange
      const projectKey = 'DATES';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'Date Version',
          archived: false,
          released: false,
          startDate: '2023-01-01',
          releaseDate: '2023-12-31',
          userStartDate: '01/Jan/23',
          userReleaseDate: '31/Dec/23',
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result[0].startDate).toBe('2023-01-01');
      expect(result[0].releaseDate).toBe('2023-12-31');
      expect(result[0].userStartDate).toBe('01/Jan/23');
      expect(result[0].userReleaseDate).toBe('31/Dec/23');
    });

    it('should handle missing date fields', async () => {
      // Arrange
      const projectKey = 'NO_DATES';
      const mockVersions: JiraVersion[] = [
        {
          self: 'https://jira.example.com/rest/api/2/version/10000',
          id: '10000',
          name: 'No Dates Version',
          archived: false,
          released: false,
          projectId: 10001
        }
      ];

      mockJiraClient.getVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await jiraWrapper.getProjectVersions(projectKey);

      // Assert
      expect(result[0].startDate).toBeUndefined();
      expect(result[0].releaseDate).toBeUndefined();
      expect(result[0].userStartDate).toBeUndefined();
      expect(result[0].userReleaseDate).toBeUndefined();
    });
  });
});