import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { ApiError } from '../../src/types/api-error.js';
import { JiraConfig } from '../../src/types/config-types.js';

// Mock the jira-client module
const mockDoRequest = jest.fn();
const mockGetAllBoards = jest.fn();

jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => ({
    doRequest: mockDoRequest,
    getAllBoards: mockGetAllBoards,
  }));
});

describe('JiraClientWrapper.getAgileBoards', () => {
  let wrapper: JiraClientWrapper;
  let mockConfig: JiraConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      url: 'https://test.atlassian.net',
      bearer: 'test-token',
    };

    wrapper = new JiraClientWrapper(mockConfig);
  });

  describe('Basic functionality', () => {
    it('should retrieve all boards when no project filter is provided', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 3,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/1',
            name: 'Test Board 1',
            type: 'scrum',
          },
          {
            id: 2,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/2',
            name: 'Test Board 2',
            type: 'kanban',
            location: {
              type: 'project',
              projectKey: 'TEST',
              projectId: 10001,
              projectName: 'Test Project',
              projectTypeKey: 'software',
            },
          },
          {
            id: 3,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/3',
            name: 'Test Board 3',
            type: 'scrum',
            admins: {
              users: [],
              groups: [],
            },
            canEdit: true,
            isPrivate: false,
            favourite: false,
          },
        ],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(mockGetAllBoards).toHaveBeenCalledWith();
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 1,
        self: 'https://test.atlassian.net/rest/agile/1.0/board/1',
        name: 'Test Board 1',
        type: 'scrum',
      });
      expect(result[1]).toEqual({
        id: 2,
        self: 'https://test.atlassian.net/rest/agile/1.0/board/2',
        name: 'Test Board 2',
        type: 'kanban',
        location: {
          type: 'project',
          projectKey: 'TEST',
          projectId: 10001,
          projectName: 'Test Project',
          projectTypeKey: 'software',
        },
      });
      expect(result[2]).toMatchObject({
        id: 3,
        name: 'Test Board 3',
        type: 'scrum',
        admins: { users: [], groups: [] },
        canEdit: true,
        isPrivate: false,
        favourite: false,
      });
    });

    it('should filter boards by project when projectKey is provided', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 5,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/1',
            name: 'Test Board 1',
            type: 'scrum',
            location: {
              type: 'project',
              projectKey: 'DSCWA',
              projectId: 10001,
            },
          },
          {
            id: 2,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/2',
            name: 'Test Board 2',
            type: 'kanban',
            location: {
              type: 'project',
              projectKey: 'OTHER',
              projectId: 10002,
            },
          },
          {
            id: 3,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/3',
            name: 'Test Board 3',
            type: 'scrum',
            location: {
              type: 'project',
              projectKey: 'DSCWA',
              projectId: 10001,
            },
          },
          {
            id: 4,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/4',
            name: 'Test Board 4',
            type: 'kanban',
            // No location - should be excluded
          },
          {
            id: 5,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/5',
            name: 'Test Board 5',
            type: 'scrum',
            location: {
              type: 'user',
              // Not project type - should be excluded
            },
          },
        ],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards('DSCWA');

      // Assert
      expect(mockGetAllBoards).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].location?.projectKey).toBe('DSCWA');
      expect(result[1].id).toBe(3);
      expect(result[1].location?.projectKey).toBe('DSCWA');
    });

    it('should return empty array when no boards exist', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 0,
        isLast: true,
        values: [],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(mockGetAllBoards).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should return empty array when no boards match project filter', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 2,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/1',
            name: 'Test Board 1',
            type: 'scrum',
            location: {
              type: 'project',
              projectKey: 'OTHER1',
              projectId: 10001,
            },
          },
          {
            id: 2,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/2',
            name: 'Test Board 2',
            type: 'kanban',
            location: {
              type: 'project',
              projectKey: 'OTHER2',
              projectId: 10002,
            },
          },
        ],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards('DSCWA');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle null response gracefully', async () => {
      // Arrange
      mockGetAllBoards.mockResolvedValue(null);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle undefined response gracefully', async () => {
      // Arrange
      mockGetAllBoards.mockResolvedValue(undefined);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle response without values property', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 0,
        isLast: true,
        // Missing values property
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle response with non-array values property', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 0,
        isLast: true,
        values: 'not-an-array',
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw ApiError for authentication failures', async () => {
      // Arrange
      const authError = new Error('Unauthorized');
      (authError as any).statusCode = 401;
      mockGetAllBoards.mockRejectedValue(authError);

      // Act & Assert
      await expect(wrapper.getAgileBoards()).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for forbidden access', async () => {
      // Arrange
      const forbiddenError = new Error('Forbidden');
      (forbiddenError as any).statusCode = 403;
      mockGetAllBoards.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(wrapper.getAgileBoards()).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for agile functionality not available', async () => {
      // Arrange
      const notFoundError = new Error('Not Found');
      (notFoundError as any).statusCode = 404;
      mockGetAllBoards.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(wrapper.getAgileBoards()).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for server errors', async () => {
      // Arrange
      const serverError = new Error('Internal Server Error');
      (serverError as any).statusCode = 500;
      mockGetAllBoards.mockRejectedValue(serverError);

      // Act & Assert
      await expect(wrapper.getAgileBoards()).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for network errors', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockGetAllBoards.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.getAgileBoards()).rejects.toThrow(ApiError);
    });
  });

  describe('Input validation', () => {
    it('should handle empty string projectKey', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 1,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/1',
            name: 'Test Board 1',
            type: 'scrum',
          },
        ],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards('');

      // Assert
      expect(result).toHaveLength(1);
      expect(mockGetAllBoards).toHaveBeenCalledWith();
    });

    it('should handle whitespace-only projectKey', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 1,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/1',
            name: 'Test Board 1',
            type: 'scrum',
          },
        ],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards('   ');

      // Assert
      expect(result).toHaveLength(1);
      expect(mockGetAllBoards).toHaveBeenCalledWith();
    });

    it('should handle case-sensitive project key matching', async () => {
      // Arrange
      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 2,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/1',
            name: 'Test Board 1',
            type: 'scrum',
            location: {
              type: 'project',
              projectKey: 'DSCWA',
              projectId: 10001,
            },
          },
          {
            id: 2,
            self: 'https://test.atlassian.net/rest/agile/1.0/board/2',
            name: 'Test Board 2',
            type: 'kanban',
            location: {
              type: 'project',
              projectKey: 'dscwa', // lowercase
              projectId: 10002,
            },
          },
        ],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards('DSCWA');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].location?.projectKey).toBe('DSCWA');
    });
  });

  describe('Data integrity', () => {
    it('should preserve all board properties correctly', async () => {
      // Arrange
      const mockBoard = {
        id: 123,
        self: 'https://test.atlassian.net/rest/agile/1.0/board/123',
        name: 'Complete Test Board',
        type: 'kanban',
        admins: {
          users: [
            {
              self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
              name: 'testuser',
              displayName: 'Test User',
              emailAddress: 'test@example.com',
            },
          ],
          groups: [],
        },
        location: {
          type: 'project',
          projectKey: 'TEST',
          projectId: 10001,
          projectName: 'Test Project',
          projectTypeKey: 'software',
          avatarURI: 'https://test.atlassian.net/avatar/123',
          name: 'Test Project Board Location',
        },
        canEdit: true,
        isPrivate: false,
        favourite: true,
      };

      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 1,
        isLast: true,
        values: [mockBoard],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockBoard);
    });

    it('should handle boards with minimal properties', async () => {
      // Arrange
      const mockBoard = {
        id: 456,
        self: 'https://test.atlassian.net/rest/agile/1.0/board/456',
        name: 'Minimal Board',
        type: 'scrum',
      };

      const mockResponse = {
        maxResults: 50,
        startAt: 0,
        total: 1,
        isLast: true,
        values: [mockBoard],
      };

      mockGetAllBoards.mockResolvedValue(mockResponse);

      // Act
      const result = await wrapper.getAgileBoards();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockBoard);
    });
  });
});
