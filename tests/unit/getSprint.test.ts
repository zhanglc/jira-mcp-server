import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraSprint } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import JiraClient from 'jira-client';

// Mock the jira-client module
jest.mock('jira-client');
const MockedJiraClient = JiraClient as jest.MockedClass<typeof JiraClient>;

describe('JiraClientWrapper.getSprint - Unit Tests', () => {
  let client: JiraClientWrapper;
  let mockJiraClientInstance: jest.Mocked<JiraClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock instance of JiraClient
    mockJiraClientInstance = {
      getSprint: jest.fn(),
    } as any;
    
    // Mock the constructor to return our mock instance
    MockedJiraClient.mockImplementation(() => mockJiraClientInstance);
    
    // Create client with mock config
    client = new JiraClientWrapper({
      url: 'https://jira.example.com',
      bearer: 'mock-bearer-token'
    });
  });

  describe('successful sprint retrieval', () => {
    it('should return sprint details for valid sprint ID', async () => {
      // Arrange
      const sprintId = 123;
      const mockSprintResponse: JiraSprint = {
        id: 123,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/123',
        state: 'active',
        name: 'Test Sprint 1',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-14T23:59:59.999Z',
        originBoardId: 456,
        goal: 'Complete feature X'
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await client.getSprint(sprintId);

      // Assert
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith(sprintId.toString());
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSprintResponse);
      expect(result.id).toBe(123);
      expect(result.state).toBe('active');
      expect(result.name).toBe('Test Sprint 1');
    });

    it('should handle closed sprint with complete date', async () => {
      // Arrange
      const sprintId = 456;
      const mockSprintResponse: JiraSprint = {
        id: 456,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/456',
        state: 'closed',
        name: 'Completed Sprint',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-14T23:59:59.999Z',
        completeDate: '2023-01-15T10:30:00.000Z',
        originBoardId: 789,
        goal: 'Deliver milestone 1'
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await client.getSprint(sprintId);

      // Assert
      expect(result).toEqual(mockSprintResponse);
      expect(result.state).toBe('closed');
      expect(result.completeDate).toBe('2023-01-15T10:30:00.000Z');
    });

    it('should handle future sprint without dates', async () => {
      // Arrange
      const sprintId = 789;
      const mockSprintResponse: JiraSprint = {
        id: 789,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/789',
        state: 'future',
        name: 'Future Sprint',
        originBoardId: 123
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await client.getSprint(sprintId);

      // Assert
      expect(result).toEqual(mockSprintResponse);
      expect(result.state).toBe('future');
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
      expect(result.completeDate).toBeUndefined();
      expect(result.goal).toBeUndefined();
    });

    it('should handle sprint with minimal required fields', async () => {
      // Arrange
      const sprintId = 321;
      const mockSprintResponse: JiraSprint = {
        id: 321,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/321',
        state: 'active',
        name: 'Minimal Sprint'
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await client.getSprint(sprintId);

      // Assert
      expect(result).toEqual(mockSprintResponse);
      expect(result.id).toBe(321);
      expect(result.self).toBe('https://jira.example.com/rest/agile/1.0/sprint/321');
      expect(result.state).toBe('active');
      expect(result.name).toBe('Minimal Sprint');
    });
  });

  describe('error handling', () => {
    it('should throw ApiError for non-existent sprint', async () => {
      // Arrange
      const sprintId = 999999;
      const jiraError = new Error('{"errorMessages":[],"errors":{"sprint":"The requested sprint cannot be viewed because it either does not exist or you do not have permission to view it."}}');
      
      mockJiraClientInstance.getSprint.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(client.getSprint(sprintId)).rejects.toThrow(ApiError);
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith(sprintId.toString());
    });

    it('should throw ApiError for permission denied', async () => {
      // Arrange
      const sprintId = 123;
      const jiraError = new Error('{"errorMessages":["You do not have permission to view this sprint."],"errors":{}}');
      
      mockJiraClientInstance.getSprint.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(client.getSprint(sprintId)).rejects.toThrow(ApiError);
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith(sprintId.toString());
    });

    it('should throw ApiError for agile functionality unavailable', async () => {
      // Arrange
      const sprintId = 123;
      const jiraError = new Error('{"errorMessages":["The functionality you are trying to access is not available in this edition of JIRA."],"errors":{}}');
      
      mockJiraClientInstance.getSprint.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(client.getSprint(sprintId)).rejects.toThrow(ApiError);
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith(sprintId.toString());
    });

    it('should handle null/undefined response gracefully', async () => {
      // Arrange
      const sprintId = 123;
      mockJiraClientInstance.getSprint.mockResolvedValue(null as any);

      // Act & Assert
      await expect(client.getSprint(sprintId)).rejects.toThrow(ApiError);
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith(sprintId.toString());
    });

    it('should handle malformed response gracefully', async () => {
      // Arrange
      const sprintId = 123;
      const malformedResponse = { invalid: 'response' };
      mockJiraClientInstance.getSprint.mockResolvedValue(malformedResponse);

      // Act & Assert
      await expect(client.getSprint(sprintId)).rejects.toThrow(ApiError);
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith(sprintId.toString());
    });
  });

  describe('parameter validation', () => {
    it('should convert sprint ID to string for jira-client', async () => {
      // Arrange
      const sprintId = 42;
      const mockSprintResponse: JiraSprint = {
        id: 42,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/42',
        state: 'active',
        name: 'Test Sprint'
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(mockSprintResponse);

      // Act
      await client.getSprint(sprintId);

      // Assert
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith('42');
    });

    it('should handle large sprint IDs correctly', async () => {
      // Arrange
      const sprintId = 999999999;
      const mockSprintResponse: JiraSprint = {
        id: 999999999,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/999999999',
        state: 'closed',
        name: 'Large ID Sprint'
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await client.getSprint(sprintId);

      // Assert
      expect(mockJiraClientInstance.getSprint).toHaveBeenCalledWith('999999999');
      expect(result.id).toBe(999999999);
    });
  });

  describe('sprint states', () => {
    it.each([
      ['active', 'Active Sprint'],
      ['closed', 'Closed Sprint'],  
      ['future', 'Future Sprint']
    ])('should handle sprint with state: %s', async (state, name) => {
      // Arrange
      const sprintId = 123;
      const mockSprintResponse: JiraSprint = {
        id: 123,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/123',
        state: state,
        name: name
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await client.getSprint(sprintId);

      // Assert
      expect(result.state).toBe(state);
      expect(result.name).toBe(name);
    });
  });

  describe('data structure validation', () => {
    it('should preserve all JiraSprint interface fields', async () => {
      // Arrange
      const sprintId = 123;
      const completeSprintResponse: JiraSprint = {
        id: 123,
        self: 'https://jira.example.com/rest/agile/1.0/sprint/123',
        state: 'closed',
        name: 'Complete Sprint',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-14T23:59:59.999Z',
        completeDate: '2023-01-15T10:30:00.000Z',
        originBoardId: 456,
        goal: 'Complete all user stories'
      };

      mockJiraClientInstance.getSprint.mockResolvedValue(completeSprintResponse);

      // Act
      const result = await client.getSprint(sprintId);

      // Assert - Verify all interface fields are preserved
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('self');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('completeDate');
      expect(result).toHaveProperty('originBoardId');
      expect(result).toHaveProperty('goal');
      
      expect(result).toEqual(completeSprintResponse);
    });
  });
});