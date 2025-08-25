import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { ApiError } from '../../src/types/api-error.js';
import { logger } from '../../src/utils/logger.js';

// Mock jira-client
const mockJiraClient = {
  getAllSprints: jest.fn()
};

jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => mockJiraClient);
});

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

describe('JiraClientWrapper.getSprintsFromBoard', () => {
  let jiraClient: JiraClientWrapper;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      url: 'https://test.jira.com',
      bearer: 'fake-token'
    };
    
    jiraClient = new JiraClientWrapper(mockConfig);
  });

  describe('successful sprint retrieval', () => {
    it('should retrieve sprints for a board successfully', async () => {
      // Arrange
      const boardId = 123;
      const mockSprintResponse = {
        values: [
          {
            id: 1,
            self: 'https://test.jira.com/rest/agile/1.0/sprint/1',
            state: 'active',
            name: 'Sprint 1',
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-14T23:59:59.999Z',
            originBoardId: 123,
            goal: 'Complete feature A'
          },
          {
            id: 2,
            self: 'https://test.jira.com/rest/agile/1.0/sprint/2',
            state: 'closed',
            name: 'Sprint 2',
            startDate: '2024-01-15T00:00:00.000Z',
            endDate: '2024-01-28T23:59:59.999Z',
            completeDate: '2024-01-28T23:59:59.999Z',
            originBoardId: 123,
            goal: 'Complete feature B'
          }
        ]
      };

      mockJiraClient.getAllSprints.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        self: 'https://test.jira.com/rest/agile/1.0/sprint/1',
        state: 'active',
        name: 'Sprint 1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-14T23:59:59.999Z',
        originBoardId: 123,
        goal: 'Complete feature A'
      });
      expect(result[1]).toMatchObject({
        id: 2,
        self: 'https://test.jira.com/rest/agile/1.0/sprint/2',
        state: 'closed',
        name: 'Sprint 2',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-01-28T23:59:59.999Z',
        completeDate: '2024-01-28T23:59:59.999Z',
        originBoardId: 123,
        goal: 'Complete feature B'
      });

      expect(mockJiraClient.getAllSprints).toHaveBeenCalledWith(boardId.toString());
      expect(logger.log).toHaveBeenCalledWith('Getting sprints for board: 123');
      expect(logger.log).toHaveBeenCalledWith('Successfully retrieved 2 sprints for board: 123');
    });

    it('should retrieve sprints with minimal fields', async () => {
      // Arrange
      const boardId = 456;
      const mockSprintResponse = {
        values: [
          {
            id: 10,
            self: 'https://test.jira.com/rest/agile/1.0/sprint/10',
            state: 'future',
            name: 'Future Sprint'
            // Missing optional fields: startDate, endDate, completeDate, originBoardId, goal
          }
        ]
      };

      mockJiraClient.getAllSprints.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 10,
        self: 'https://test.jira.com/rest/agile/1.0/sprint/10',
        state: 'future',
        name: 'Future Sprint'
      });
      expect(result[0].startDate).toBeUndefined();
      expect(result[0].endDate).toBeUndefined();
      expect(result[0].completeDate).toBeUndefined();
      expect(result[0].originBoardId).toBeUndefined();
      expect(result[0].goal).toBeUndefined();

      expect(mockJiraClient.getAllSprints).toHaveBeenCalledWith('456');
    });

    it('should handle different sprint states correctly', async () => {
      // Arrange
      const boardId = 789;
      const mockSprintResponse = {
        values: [
          {
            id: 1,
            self: 'https://test.jira.com/rest/agile/1.0/sprint/1',
            state: 'active',
            name: 'Active Sprint'
          },
          {
            id: 2,
            self: 'https://test.jira.com/rest/agile/1.0/sprint/2',
            state: 'closed',
            name: 'Closed Sprint'
          },
          {
            id: 3,
            self: 'https://test.jira.com/rest/agile/1.0/sprint/3',
            state: 'future',
            name: 'Future Sprint'
          }
        ]
      };

      mockJiraClient.getAllSprints.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.find((s: any) => s.state === 'active')).toBeDefined();
      expect(result.find((s: any) => s.state === 'closed')).toBeDefined();
      expect(result.find((s: any) => s.state === 'future')).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should return empty array when no sprints exist', async () => {
      // Arrange
      const boardId = 999;
      const mockSprintResponse = {
        values: []
      };

      mockJiraClient.getAllSprints.mockResolvedValue(mockSprintResponse);

      // Act
      const result = await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(result).toEqual([]);
      expect(mockJiraClient.getAllSprints).toHaveBeenCalledWith('999');
      expect(logger.log).toHaveBeenCalledWith('Successfully retrieved 0 sprints for board: 999');
    });

    it('should handle null response gracefully', async () => {
      // Arrange
      const boardId = 111;
      mockJiraClient.getAllSprints.mockResolvedValue(null);

      // Act
      const result = await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(result).toEqual([]);
      expect(logger.log).toHaveBeenCalledWith('No response received for board sprints: 111');
    });

    it('should handle response without values property', async () => {
      // Arrange
      const boardId = 222;
      mockJiraClient.getAllSprints.mockResolvedValue({});

      // Act
      const result = await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(result).toEqual([]);
      expect(logger.log).toHaveBeenCalledWith('No values property in board sprints response for board: 222');
    });

    it('should handle non-array values property', async () => {
      // Arrange
      const boardId = 333;
      mockJiraClient.getAllSprints.mockResolvedValue({ values: null });

      // Act
      const result = await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(result).toEqual([]);
      expect(logger.log).toHaveBeenCalledWith('Values property is not an array in board sprints response for board: 333');
    });
  });

  describe('error handling', () => {
    it('should throw ApiError when board does not exist (404)', async () => {
      // Arrange
      const boardId = 404;
      const mockError = {
        statusCode: 404,
        message: 'Board not found'
      };
      mockJiraClient.getAllSprints.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintsFromBoard(boardId)).rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get sprints for board 404:', mockError);
    });

    it('should throw ApiError when access is denied (403)', async () => {
      // Arrange
      const boardId = 403;
      const mockError = {
        statusCode: 403,
        message: 'Forbidden'
      };
      mockJiraClient.getAllSprints.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintsFromBoard(boardId)).rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get sprints for board 403:', mockError);
    });

    it('should throw ApiError for general API errors', async () => {
      // Arrange
      const boardId = 500;
      const mockError = {
        statusCode: 500,
        message: 'Internal Server Error'
      };
      mockJiraClient.getAllSprints.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintsFromBoard(boardId)).rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get sprints for board 500:', mockError);
    });

    it('should handle board without agile functionality', async () => {
      // Arrange
      const boardId = 123;
      const mockError = {
        statusCode: 400,
        message: 'Board does not support sprints'
      };
      mockJiraClient.getAllSprints.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintsFromBoard(boardId)).rejects.toThrow(ApiError);
    });
  });

  describe('parameter validation', () => {
    it('should convert number boardId to string for API call', async () => {
      // Arrange
      const boardId = 12345;
      mockJiraClient.getAllSprints.mockResolvedValue({ values: [] });

      // Act
      await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(mockJiraClient.getAllSprints).toHaveBeenCalledWith('12345');
    });

    it('should handle zero boardId', async () => {
      // Arrange
      const boardId = 0;
      mockJiraClient.getAllSprints.mockResolvedValue({ values: [] });

      // Act
      await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(mockJiraClient.getAllSprints).toHaveBeenCalledWith('0');
    });

    it('should handle negative boardId (edge case)', async () => {
      // Arrange
      const boardId = -1;
      mockJiraClient.getAllSprints.mockResolvedValue({ values: [] });

      // Act
      await jiraClient.getSprintsFromBoard(boardId);

      // Assert
      expect(mockJiraClient.getAllSprints).toHaveBeenCalledWith('-1');
    });
  });
});