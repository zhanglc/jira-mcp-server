import { jest } from '@jest/globals';
import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { ApiError } from '../../src/types/api-error.js';
import { JiraTransition } from '../../src/types/jira-types.js';

// Mock the jira-client module
const mockJiraClient = {
  listTransitions: jest.fn() as jest.MockedFunction<any>
};

jest.mock('jira-client', () => {
  return jest.fn(() => mockJiraClient);
});

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

describe('JiraClientWrapper.getIssueTransitions', () => {
  let jiraClient: JiraClientWrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    jiraClient = new JiraClientWrapper({
      url: 'https://test.atlassian.net',
      bearer: 'test-token'
    });
  });

  describe('successful transitions retrieval', () => {
    const mockTransitionsData = {
      transitions: [
        {
          id: '21',
          name: 'In Progress',
          to: {
            id: '3',
            name: 'In Progress',
            statusCategory: {
              id: 4,
              key: 'indeterminate',
              name: 'In Progress'
            }
          },
          hasScreen: false,
          isGlobal: true,
          isInitial: false,
          isAvailable: true,
          isConditional: false,
          fields: {}
        },
        {
          id: '31',
          name: 'Done',
          to: {
            id: '6',
            name: 'Done',
            statusCategory: {
              id: 3,
              key: 'done',
              name: 'Done'
            }
          },
          hasScreen: true,
          isGlobal: false,
          isInitial: false,
          isAvailable: true,
          isConditional: true,
          fields: {
            'customfield_10001': {
              required: true,
              schema: {
                type: 'string',
                system: 'resolution'
              },
              name: 'Resolution',
              hasDefaultValue: false,
              operations: ['set'],
              allowedValues: [
                { id: '1', name: 'Fixed' },
                { id: '2', name: 'Duplicate' }
              ]
            }
          }
        }
      ]
    };

    it('should return transitions for valid issue key', async () => {
      mockJiraClient.listTransitions.mockResolvedValue(mockTransitionsData);

      const result = await jiraClient.getIssueTransitions('PROJECT-123');

      expect(mockJiraClient.listTransitions).toHaveBeenCalledWith('PROJECT-123');
      expect(result).toHaveLength(2);
      
      // Verify first transition
      expect(result[0]).toEqual({
        id: '21',
        name: 'In Progress',
        to: {
          id: '3',
          name: 'In Progress',
          statusCategory: {
            id: 4,
            key: 'indeterminate',
            name: 'In Progress'
          }
        },
        hasScreen: false,
        isGlobal: true,
        isInitial: false,
        isAvailable: true,
        isConditional: false,
        fields: {}
      });

      // Verify second transition
      expect(result[1]).toEqual({
        id: '31',
        name: 'Done',
        to: {
          id: '6',
          name: 'Done',
          statusCategory: {
            id: 3,
            key: 'done',
            name: 'Done'
          }
        },
        hasScreen: true,
        isGlobal: false,
        isInitial: false,
        isAvailable: true,
        isConditional: true,
        fields: {
          'customfield_10001': {
            required: true,
            schema: {
              type: 'string',
              system: 'resolution'
            },
            name: 'Resolution',
            hasDefaultValue: false,
            operations: ['set'],
            allowedValues: [
              { id: '1', name: 'Fixed' },
              { id: '2', name: 'Duplicate' }
            ]
          }
        }
      });
    });

    it('should return empty array when no transitions available', async () => {
      mockJiraClient.listTransitions.mockResolvedValue({ transitions: [] });

      const result = await jiraClient.getIssueTransitions('CLOSED-123');

      expect(mockJiraClient.listTransitions).toHaveBeenCalledWith('CLOSED-123');
      expect(result).toEqual([]);
    });

    it('should handle transitions with minimal fields', async () => {
      const minimalTransition = {
        transitions: [
          {
            id: '11',
            name: 'Start Work',
            to: {
              id: '1',
              name: 'To Do',
              statusCategory: {
                id: 2,
                key: 'new',
                name: 'To Do'
              }
            }
          }
        ]
      };

      mockJiraClient.listTransitions.mockResolvedValue(minimalTransition);

      const result = await jiraClient.getIssueTransitions('MIN-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '11',
        name: 'Start Work',
        to: {
          id: '1',
          name: 'To Do',
          statusCategory: {
            id: 2,
            key: 'new',
            name: 'To Do'
          }
        }
      });
    });
  });

  describe('error handling', () => {
    it('should throw ApiError for 404 Not Found', async () => {
      const notFoundError = new Error('Issue does not exist') as any;
      notFoundError.statusCode = 404;
      mockJiraClient.listTransitions.mockRejectedValue(notFoundError);

      await expect(jiraClient.getIssueTransitions('NOTFOUND-123'))
        .rejects
        .toThrow(ApiError);

      try {
        await jiraClient.getIssueTransitions('NOTFOUND-123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
        expect((error as ApiError).message).toContain('Issue does not exist');
      }
    });

    it('should throw ApiError for 403 Forbidden', async () => {
      const forbiddenError = new Error('You do not have permission to view this issue') as any;
      forbiddenError.statusCode = 403;
      mockJiraClient.listTransitions.mockRejectedValue(forbiddenError);

      await expect(jiraClient.getIssueTransitions('RESTRICTED-123'))
        .rejects
        .toThrow(ApiError);

      try {
        await jiraClient.getIssueTransitions('RESTRICTED-123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(403);
        expect((error as ApiError).message).toContain('You do not have permission to view this issue');
      }
    });

    it('should throw ApiError for 401 Unauthorized', async () => {
      const unauthorizedError = new Error('Authentication required') as any;
      unauthorizedError.statusCode = 401;
      mockJiraClient.listTransitions.mockRejectedValue(unauthorizedError);

      await expect(jiraClient.getIssueTransitions('PROJECT-123'))
        .rejects
        .toThrow(ApiError);

      try {
        await jiraClient.getIssueTransitions('PROJECT-123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
        expect((error as ApiError).message).toContain('Authentication required');
      }
    });

    it('should throw ApiError for 500 Internal Server Error', async () => {
      const serverError = new Error('Internal server error') as any;
      serverError.statusCode = 500;
      mockJiraClient.listTransitions.mockRejectedValue(serverError);

      await expect(jiraClient.getIssueTransitions('PROJECT-123'))
        .rejects
        .toThrow(ApiError);

      try {
        await jiraClient.getIssueTransitions('PROJECT-123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(500);
        expect((error as ApiError).message).toContain('Internal server error');
      }
    });

    it('should throw ApiError for network errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      mockJiraClient.listTransitions.mockRejectedValue(networkError);

      await expect(jiraClient.getIssueTransitions('PROJECT-123'))
        .rejects
        .toThrow(ApiError);

      try {
        await jiraClient.getIssueTransitions('PROJECT-123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('ECONNREFUSED');
      }
    });

    it('should throw ApiError for unknown errors', async () => {
      const unknownError = new Error('Something went wrong');
      mockJiraClient.listTransitions.mockRejectedValue(unknownError);

      await expect(jiraClient.getIssueTransitions('PROJECT-123'))
        .rejects
        .toThrow(ApiError);

      try {
        await jiraClient.getIssueTransitions('PROJECT-123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Something went wrong');
      }
    });
  });

  describe('input validation and edge cases', () => {
    it('should handle empty issue key', async () => {
      const emptyKeyError = new Error('Issue key cannot be empty') as any;
      emptyKeyError.statusCode = 400;
      mockJiraClient.listTransitions.mockRejectedValue(emptyKeyError);

      await expect(jiraClient.getIssueTransitions(''))
        .rejects
        .toThrow(ApiError);
    });

    it('should handle malformed issue key', async () => {
      const malformedError = new Error('Invalid issue key format') as any;
      malformedError.statusCode = 400;
      mockJiraClient.listTransitions.mockRejectedValue(malformedError);

      await expect(jiraClient.getIssueTransitions('INVALID_KEY'))
        .rejects
        .toThrow(ApiError);
    });

    it('should handle null/undefined in response', async () => {
      mockJiraClient.listTransitions.mockResolvedValue(null);

      const result = await jiraClient.getIssueTransitions('NULL-123');

      expect(result).toEqual([]);
    });

    it('should handle response without transitions property', async () => {
      mockJiraClient.listTransitions.mockResolvedValue({});

      const result = await jiraClient.getIssueTransitions('EMPTY-123');

      expect(result).toEqual([]);
    });
  });

  describe('type validation', () => {
    it('should satisfy JiraTransition interface requirements', async () => {
      const mockData = {
        transitions: [
          {
            id: '21',
            name: 'In Progress',
            to: {
              id: '3',
              name: 'In Progress',
              statusCategory: {
                id: 4,
                key: 'indeterminate',
                name: 'In Progress'
              }
            }
          }
        ]
      };

      mockJiraClient.listTransitions.mockResolvedValue(mockData);

      const result: JiraTransition[] = await jiraClient.getIssueTransitions('TYPE-123');

      expect(result).toHaveLength(1);
      expect(typeof result[0].id).toBe('string');
      expect(typeof result[0].name).toBe('string');
      expect(typeof result[0].to.id).toBe('string');
      expect(typeof result[0].to.name).toBe('string');
      expect(typeof result[0].to.statusCategory.id).toBe('number');
      expect(typeof result[0].to.statusCategory.key).toBe('string');
      expect(typeof result[0].to.statusCategory.name).toBe('string');
    });
  });
});