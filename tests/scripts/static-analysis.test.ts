/**
 * Test Suite for Static Field Analysis Generator
 * 
 * Mock-Based TDD for analyzing Jira entities and generating static suggestion data
 * Tests all 4 entity types: issues, projects, users, agile
 */

import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import { JiraClientWrapper } from '@/client/jira-client-wrapper';
import {
  generateStaticAnalysis,
  analyzeIssueFields,
  analyzeProjectFields,
  analyzeUserFields,
  analyzeAgileFields,
  generateTypoCorrections,
  analyzeFieldUsage,
  getTopUsedFields,
  extractCustomFieldPatterns,
  generateSuggestionFile,
  StaticAnalysisResult
} from '@/scripts/generate-static-analysis';

// Mock all dependencies
jest.mock('@/client/jira-client-wrapper');
jest.mock('@/utils/config', () => ({
  config: {
    url: 'https://test.atlassian.net',
    bearer: 'mock-token'
  }
}));
jest.mock('fs/promises');

// Mock data fixtures
const mockIssues = [
  {
    key: 'TEST-1',
    fields: {
      summary: 'Test issue 1',
      status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } },
      assignee: { displayName: 'John Doe', accountId: 'user1' },
      reporter: { displayName: 'Jane Smith', accountId: 'user2' },
      description: 'Test description',
      project: { key: 'TEST', name: 'Test Project' },
      issuetype: { name: 'Bug' },
      priority: { name: 'High' },
      created: '2024-01-01T10:00:00.000Z',
      updated: '2024-01-02T15:30:00.000Z',
      customfield_10001: 'Custom value 1',
      customfield_10002: { value: 'Custom select' },
      customfield_10003: null
    }
  },
  {
    key: 'TEST-2',
    fields: {
      summary: 'Test issue 2',
      status: { name: 'Done', statusCategory: { key: 'done' } },
      assignee: null,
      reporter: { displayName: 'Bob Wilson', accountId: 'user3' },
      description: null,
      project: { key: 'TEST', name: 'Test Project' },
      issuetype: { name: 'Story' },
      priority: { name: 'Medium' },
      created: '2024-01-03T09:00:00.000Z',
      updated: '2024-01-03T16:45:00.000Z',
      customfield_10001: 'Custom value 2',
      customfield_10002: null,
      customfield_10003: ['Option A', 'Option B']
    }
  }
];

const mockProjects = [
  {
    key: 'TEST',
    name: 'Test Project',
    description: 'Test project description',
    lead: { displayName: 'Project Lead', accountId: 'lead1' },
    projectCategory: { name: 'Development' },
    projectTypeKey: 'software',
    archived: false,
    deleted: false,
    components: [{ name: 'Frontend' }, { name: 'Backend' }],
    versions: [{ name: '1.0.0' }]
  },
  {
    key: 'DEMO',
    name: 'Demo Project',
    description: null,
    lead: { displayName: 'Demo Lead', accountId: 'lead2' },
    projectCategory: null,
    projectTypeKey: 'business',
    archived: false,
    deleted: false,
    components: [],
    versions: []
  }
];

const mockUsers = [
  {
    accountId: 'user1',
    displayName: 'John Doe',
    emailAddress: 'john@example.com',
    active: true,
    timeZone: 'America/New_York',
    locale: 'en_US',
    groups: { items: [{ name: 'developers' }] },
    avatarUrls: { '48x48': 'avatar1.png' }
  },
  {
    accountId: 'user2',
    displayName: 'Jane Smith',
    emailAddress: 'jane@example.com',
    active: true,
    timeZone: 'Europe/London',
    locale: 'en_GB',
    groups: { items: [{ name: 'testers' }] },
    avatarUrls: { '48x48': 'avatar2.png' }
  }
];

const mockBoards = [
  {
    id: 1,
    name: 'Scrum Board',
    type: 'scrum',
    location: { projectId: 10001 },
    favourite: false
  },
  {
    id: 2,
    name: 'Kanban Board',
    type: 'kanban',
    location: { projectId: 10002 },
    favourite: true
  }
];

const mockSprints = [
  {
    id: 101,
    name: 'Sprint 1',
    state: 'active',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-01-14T23:59:59.000Z',
    originBoardId: 1,
    goal: 'Complete user authentication'
  },
  {
    id: 102,
    name: 'Sprint 2',
    state: 'closed',
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-01-28T23:59:59.000Z',
    originBoardId: 1,
    goal: 'Implement dashboard features'
  }
];

describe('Static Field Analysis Generator', () => {
  let mockJiraClient: jest.Mocked<JiraClientWrapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJiraClient = {
      searchIssues: jest.fn(),
      getAllProjects: jest.fn(),
      searchUsers: jest.fn(),
      getAgileBoards: jest.fn(),
      getSprintsFromBoard: jest.fn()
    } as any;

    // Mock constructor
    (JiraClientWrapper as jest.MockedClass<typeof JiraClientWrapper>).mockImplementation(
      () => mockJiraClient
    );

    // Mock fs operations
    (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined);
    (fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockResolvedValue(undefined);
  });

  describe('analyzeIssueFields', () => {
    beforeEach(() => {
      mockJiraClient.searchIssues.mockResolvedValue({
        issues: mockIssues,
        startAt: 0,
        maxResults: 50,
        total: mockIssues.length,
        expand: ''
      } as any);
    });

    it('should analyze issue fields and return static analysis result', async () => {
      const result = await analyzeIssueFields(mockJiraClient);

      expect(result.entityType).toBe('issue');
      expect(result.typoCorrections).toBeDefined();
      expect(result.usageStatistics).toBeDefined();
      expect(result.contextualSuggestions).toBeDefined();
      expect(result.customFieldPatterns).toBeDefined();
      expect(result.lastAnalyzed).toBeDefined();
      expect(new Date(result.lastAnalyzed)).toBeInstanceOf(Date);
    });

    it('should call searchIssues with correct parameters', async () => {
      await analyzeIssueFields(mockJiraClient);

      expect(mockJiraClient.searchIssues).toHaveBeenCalledWith(
        'ORDER BY created DESC',
        {
          maxResults: 50,
          fields: ['*all']
        }
      );
    });

    it('should analyze field usage correctly', async () => {
      const result = await analyzeIssueFields(mockJiraClient);

      // Should have high frequency fields with availability rates
      expect(result.usageStatistics.summary).toEqual({
        frequency: 'high',
        availability: 1.0 // Both test issues have summary
      });
      
      expect(result.usageStatistics.assignee).toEqual({
        frequency: 'medium',
        availability: 0.5 // Only first issue has assignee
      });

      expect(result.usageStatistics.description).toEqual({
        frequency: 'medium',
        availability: 0.5 // Only first issue has description
      });
    });

    it('should extract custom field patterns', async () => {
      const result = await analyzeIssueFields(mockJiraClient);

      expect(result.customFieldPatterns).toEqual({
        'customfield_10001': ['string'], // Both issues have string values
        'customfield_10002': ['object'], // First issue has object, second is null
        'customfield_10003': ['array']   // Only second issue has array
      });
    });

    it('should generate typo corrections for issue fields', async () => {
      const result = await analyzeIssueFields(mockJiraClient);

      expect(result.typoCorrections).toEqual({
        'stat': 'status',
        'statu': 'status',
        'statuc': 'status',
        'assigne': 'assignee',
        'asignee': 'assignee',
        'sumary': 'summary',
        'summry': 'summary',
        'discription': 'description',
        'descripion': 'description',
        'priorty': 'priority',
        'priorit': 'priority',
        'reporte': 'reporter',
        'reportr': 'reporter',
        'projec': 'project',
        'issutyp': 'issuetype',
        'creatd': 'created',
        'updated': 'updated'
      });
    });

    it('should generate contextual suggestions', async () => {
      const result = await analyzeIssueFields(mockJiraClient);

      expect(result.contextualSuggestions).toEqual([
        'summary',
        'status',
        'reporter',
        'project',
        'issuetype',
        'priority',
        'created',
        'updated',
        'customfield_10001',
        'assignee'
      ]);
    });
  });

  describe('analyzeProjectFields', () => {
    beforeEach(() => {
      mockJiraClient.getAllProjects.mockResolvedValue(mockProjects as any);
    });

    it('should analyze project fields and return static analysis result', async () => {
      const result = await analyzeProjectFields(mockJiraClient);

      expect(result.entityType).toBe('project');
      expect(result.typoCorrections).toBeDefined();
      expect(result.usageStatistics).toBeDefined();
      expect(result.contextualSuggestions).toBeDefined();
      expect(result.customFieldPatterns).toEqual({}); // Projects don't have custom field patterns
      expect(result.lastAnalyzed).toBeDefined();
    });

    it('should call getAllProjects and sample correctly', async () => {
      // Mock more projects to test sampling
      const manyProjects = Array.from({ length: 25 }, (_, i) => ({
        ...mockProjects[0],
        key: `PROJ${i}`,
        name: `Project ${i}`
      }));
      mockJiraClient.getAllProjects.mockResolvedValue(manyProjects as any);

      await analyzeProjectFields(mockJiraClient);

      expect(mockJiraClient.getAllProjects).toHaveBeenCalledWith();
      // Should only analyze first 20 projects
    });

    it('should analyze project field usage correctly', async () => {
      const result = await analyzeProjectFields(mockJiraClient);

      expect(result.usageStatistics.name).toEqual({
        frequency: 'high',
        availability: 1.0
      });

      expect(result.usageStatistics.description).toEqual({
        frequency: 'medium',
        availability: 0.5 // Only first project has description
      });

      expect(result.usageStatistics.projectCategory).toEqual({
        frequency: 'medium',
        availability: 0.5 // Only first project has category
      });
    });
  });

  describe('analyzeUserFields', () => {
    beforeEach(() => {
      mockJiraClient.searchUsers.mockResolvedValue(mockUsers as any);
    });

    it('should analyze user fields and return static analysis result', async () => {
      const result = await analyzeUserFields(mockJiraClient);

      expect(result.entityType).toBe('user');
      expect(result.typoCorrections).toBeDefined();
      expect(result.usageStatistics).toBeDefined();
      expect(result.contextualSuggestions).toBeDefined();
      expect(result.customFieldPatterns).toEqual({});
      expect(result.lastAnalyzed).toBeDefined();
    });

    it('should call searchUsers with correct parameters', async () => {
      await analyzeUserFields(mockJiraClient);

      expect(mockJiraClient.searchUsers).toHaveBeenCalledWith('', 30);
    });

    it('should analyze user field usage correctly', async () => {
      const result = await analyzeUserFields(mockJiraClient);

      expect(result.usageStatistics.displayName).toEqual({
        frequency: 'high',
        availability: 1.0
      });

      expect(result.usageStatistics.emailAddress).toEqual({
        frequency: 'high',
        availability: 1.0
      });

      expect(result.usageStatistics.active).toEqual({
        frequency: 'high',
        availability: 1.0
      });
    });
  });

  describe('analyzeAgileFields', () => {
    beforeEach(() => {
      mockJiraClient.getAgileBoards.mockResolvedValue(mockBoards as any);
      mockJiraClient.getSprintsFromBoard.mockResolvedValue(mockSprints as any);
    });

    it('should analyze agile fields and return static analysis result', async () => {
      const result = await analyzeAgileFields(mockJiraClient);

      expect(result.entityType).toBe('agile');
      expect(result.typoCorrections).toBeDefined();
      expect(result.usageStatistics).toBeDefined();
      expect(result.contextualSuggestions).toBeDefined();
      expect(result.customFieldPatterns).toEqual({});
      expect(result.lastAnalyzed).toBeDefined();
    });

    it('should call agile APIs with correct parameters', async () => {
      await analyzeAgileFields(mockJiraClient);

      expect(mockJiraClient.getAgileBoards).toHaveBeenCalledWith();
      expect(mockJiraClient.getSprintsFromBoard).toHaveBeenCalledWith(1);
      expect(mockJiraClient.getSprintsFromBoard).toHaveBeenCalledWith(2);
    });

    it('should analyze combined board and sprint data', async () => {
      const result = await analyzeAgileFields(mockJiraClient);

      // Should analyze both boards and sprints
      expect(result.usageStatistics.name).toEqual({
        frequency: 'high',
        availability: 1.0 // All boards and sprints have names
      });

      expect(result.usageStatistics.id).toEqual({
        frequency: 'high',
        availability: 1.0 // All entities have IDs
      });
    });
  });

  describe('generateTypoCorrections', () => {
    it('should generate typo corrections for issue entity', () => {
      const corrections = generateTypoCorrections('issue');

      expect(corrections).toEqual({
        'stat': 'status',
        'statu': 'status',
        'statuc': 'status',
        'assigne': 'assignee',
        'asignee': 'assignee',
        'sumary': 'summary',
        'summry': 'summary',
        'discription': 'description',
        'descripion': 'description',
        'priorty': 'priority',
        'priorit': 'priority',
        'reporte': 'reporter',
        'reportr': 'reporter',
        'projec': 'project',
        'issutyp': 'issuetype',
        'creatd': 'created',
        'updated': 'updated'
      });
    });

    it('should generate typo corrections for project entity', () => {
      const corrections = generateTypoCorrections('project');

      expect(corrections).toEqual({
        'nam': 'name',
        'nme': 'name',
        'discription': 'description',
        'descripion': 'description',
        'ley': 'key',
        'kye': 'key',
        'leed': 'lead',
        'led': 'lead',
        'categry': 'projectCategory',
        'catgory': 'projectCategory',
        'archvd': 'archived',
        'archved': 'archived',
        'deletd': 'deleted',
        'delet': 'deleted'
      });
    });

    it('should generate typo corrections for user entity', () => {
      const corrections = generateTypoCorrections('user');

      expect(corrections).toEqual({
        'displayNam': 'displayName',
        'displyName': 'displayName',
        'emailAdress': 'emailAddress',
        'emailAdres': 'emailAddress',
        'acountId': 'accountId',
        'accountd': 'accountId',
        'activ': 'active',
        'actve': 'active',
        'timeZon': 'timeZone',
        'timZone': 'timeZone',
        'local': 'locale',
        'locle': 'locale'
      });
    });

    it('should generate typo corrections for agile entity', () => {
      const corrections = generateTypoCorrections('agile');

      expect(corrections).toEqual({
        'nam': 'name',
        'nme': 'name',
        'stat': 'state',
        'stae': 'state',
        'typ': 'type',
        'tpe': 'type',
        'startDat': 'startDate',
        'startDte': 'startDate',
        'endDat': 'endDate',
        'endDte': 'endDate',
        'gol': 'goal',
        'goa': 'goal',
        'boardI': 'originBoardId',
        'boardd': 'originBoardId'
      });
    });
  });

  describe('analyzeFieldUsage', () => {
    it('should calculate correct usage statistics for issues', () => {
      const usage = analyzeFieldUsage(mockIssues, 'issue');

      expect(usage.summary).toEqual({
        frequency: 'high',
        availability: 1.0
      });

      expect(usage.assignee).toEqual({
        frequency: 'medium',
        availability: 0.5
      });

      expect(usage.description).toEqual({
        frequency: 'medium',
        availability: 0.5
      });
    });

    it('should handle empty arrays gracefully', () => {
      const usage = analyzeFieldUsage([], 'issue');

      expect(usage).toEqual({});
    });

    it('should classify frequency correctly', () => {
      const testData = [
        { fields: { always: 'value', sometimes: 'value', rarely: 'value' } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } },
        { fields: { always: 'value', sometimes: null, rarely: null } }
      ];

      const usage = analyzeFieldUsage(testData, 'issue');

      expect(usage.always.frequency).toBe('high'); // 100% availability
      expect(usage.sometimes.frequency).toBe('low'); // 10% availability
      expect(usage.rarely.frequency).toBe('low'); // 10% availability
    });
  });

  describe('getTopUsedFields', () => {
    it('should return top used fields sorted by availability', () => {
      const usage = {
        field1: { frequency: 'high' as const, availability: 0.9 },
        field2: { frequency: 'medium' as const, availability: 0.8 },
        field3: { frequency: 'high' as const, availability: 0.95 },
        field4: { frequency: 'low' as const, availability: 0.3 }
      };

      const top = getTopUsedFields(usage, 3);

      expect(top).toEqual(['field3', 'field1', 'field2']);
    });

    it('should limit results to specified count', () => {
      const usage = {
        field1: { frequency: 'high' as const, availability: 0.9 },
        field2: { frequency: 'medium' as const, availability: 0.8 },
        field3: { frequency: 'high' as const, availability: 0.95 },
        field4: { frequency: 'medium' as const, availability: 0.7 }
      };

      const top = getTopUsedFields(usage, 2);

      expect(top).toHaveLength(2);
      expect(top).toEqual(['field3', 'field1']);
    });
  });

  describe('extractCustomFieldPatterns', () => {
    it('should extract custom field patterns from issues', () => {
      const patterns = extractCustomFieldPatterns(mockIssues);

      expect(patterns).toEqual({
        'customfield_10001': ['string'],
        'customfield_10002': ['object'],
        'customfield_10003': ['array']
      });
    });

    it('should handle issues without custom fields', () => {
      const issuesWithoutCustomFields = [
        { fields: { summary: 'Test', status: { name: 'Open' } } }
      ];

      const patterns = extractCustomFieldPatterns(issuesWithoutCustomFields);

      expect(patterns).toEqual({});
    });
  });

  describe('generateSuggestionFile', () => {
    it('should generate correct file content and write to file system', async () => {
      const mockResult: StaticAnalysisResult = {
        entityType: 'issue',
        typoCorrections: { stat: 'status' },
        usageStatistics: { summary: { frequency: 'high', availability: 0.9 } },
        contextualSuggestions: ['summary', 'status'],
        customFieldPatterns: { 'customfield_10001': ['string'] },
        lastAnalyzed: '2024-01-01T12:00:00.000Z'
      };

      await generateSuggestionFile(mockResult);

      const expectedPath = 'src/server/resources/static-suggestions/issue-suggestions.ts';
      const expectedContent = `// Auto-generated static suggestions for issue fields
// Generated on: 2024-01-01T12:00:00.000Z
// DO NOT EDIT MANUALLY - This file is generated by scripts/generate-static-analysis.ts

import type { StaticSuggestionData } from '../types/static-suggestions.js';

export const ISSUE_STATIC_SUGGESTIONS: StaticSuggestionData = ${JSON.stringify(mockResult, null, 2)};
`;

      expect(fs.mkdir).toHaveBeenCalledWith('src/server/resources/static-suggestions', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, expectedContent);
    });
  });

  describe('generateStaticAnalysis (main function)', () => {
    beforeEach(() => {
      mockJiraClient.searchIssues.mockResolvedValue({
        issues: mockIssues,
        startAt: 0,
        maxResults: 50,
        total: mockIssues.length,
        expand: ''
      } as any);
      mockJiraClient.getAllProjects.mockResolvedValue(mockProjects as any);
      mockJiraClient.searchUsers.mockResolvedValue(mockUsers as any);
      mockJiraClient.getAgileBoards.mockResolvedValue(mockBoards as any);
      mockJiraClient.getSprintsFromBoard.mockResolvedValue(mockSprints as any);
    });

    it('should analyze all entity types and generate files', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await generateStaticAnalysis();

      expect(mockJiraClient.searchIssues).toHaveBeenCalled();
      expect(mockJiraClient.getAllProjects).toHaveBeenCalled();
      expect(mockJiraClient.searchUsers).toHaveBeenCalled();
      expect(mockJiraClient.getAgileBoards).toHaveBeenCalled();

      // Should generate 4 files
      expect(fs.writeFile).toHaveBeenCalledTimes(4);
      expect(fs.writeFile).toHaveBeenCalledWith(
        'src/server/resources/static-suggestions/issue-suggestions.ts',
        expect.stringContaining('ISSUE_STATIC_SUGGESTIONS')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        'src/server/resources/static-suggestions/project-suggestions.ts',
        expect.stringContaining('PROJECT_STATIC_SUGGESTIONS')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        'src/server/resources/static-suggestions/user-suggestions.ts',
        expect.stringContaining('USER_STATIC_SUGGESTIONS')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        'src/server/resources/static-suggestions/agile-suggestions.ts',
        expect.stringContaining('AGILE_STATIC_SUGGESTIONS')
      );

      expect(consoleSpy).toHaveBeenCalledWith('Starting static analysis generation...');
      expect(consoleSpy).toHaveBeenCalledWith('Static analysis generation completed successfully');

      consoleSpy.mockRestore();
    });

    it('should handle errors and re-throw them', async () => {
      const error = new Error('Jira connection failed');
      // Reset the mock to return the error
      mockJiraClient.searchIssues.mockReset();
      mockJiraClient.searchIssues.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(generateStaticAnalysis()).rejects.toThrow('Jira connection failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating static analysis:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});