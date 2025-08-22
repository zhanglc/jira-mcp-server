/**
 * Search Model Unit Tests
 *
 * Tests for search-related data model classes and their functionality.
 */

import {
  SearchResultModel,
  IssueSearchResultModel,
  JQLQueryBuilder,
  SearchOptionsBuilder,
} from '@/lib/models/search';
import type { JiraSearchResponse } from '@/types/jira-api';
import { mockIssueData } from './issue.test';

describe('SearchResultModel', () => {
  const mockSearchResult = {
    startAt: 0,
    maxResults: 50,
    total: 125,
    items: ['item1', 'item2', 'item3'],
    isLast: false,
  };

  let searchResult: SearchResultModel<string>;

  beforeEach(() => {
    searchResult = new SearchResultModel(mockSearchResult);
  });

  describe('Basic Properties', () => {
    it('should return pagination information', () => {
      expect(searchResult.startAt).toBe(0);
      expect(searchResult.maxResults).toBe(50);
      expect(searchResult.total).toBe(125);
      expect(searchResult.isLast).toBe(false);
      expect(searchResult.hasMore).toBe(true);
    });

    it('should return current page information', () => {
      expect(searchResult.currentPage).toBe(1);
      expect(searchResult.totalPages).toBe(3); // Math.ceil(125 / 50)
      expect(searchResult.isFirstPage).toBe(true);
      expect(searchResult.isLastPage).toBe(false);
    });

    it('should return items information', () => {
      expect(searchResult.items).toEqual(['item1', 'item2', 'item3']);
      expect(searchResult.count).toBe(3);
      expect(searchResult.isEmpty).toBe(false);
    });
  });

  describe('Pagination Summary', () => {
    it('should return correct pagination summary', () => {
      const summary = searchResult.getPaginationSummary();
      expect(summary).toEqual({
        startAt: 0,
        maxResults: 50,
        total: 125,
        currentPage: 1,
        totalPages: 3,
        isFirstPage: true,
        isLastPage: false,
        hasMore: true,
        showing: '1-3 of 125',
      });
    });
  });

  describe('Pagination Navigation', () => {
    it('should return next page options', () => {
      const nextOptions = searchResult.getNextPageOptions();
      expect(nextOptions).toEqual({
        startAt: 50,
        maxResults: 50,
      });
    });

    it('should return null for next page when on last page', () => {
      const lastPageResult = new SearchResultModel({
        ...mockSearchResult,
        startAt: 100,
        isLast: true,
      });
      expect(lastPageResult.getNextPageOptions()).toBeNull();
    });

    it('should return null for previous page when on first page', () => {
      expect(searchResult.getPreviousPageOptions()).toBeNull();
    });

    it('should return previous page options', () => {
      const secondPageResult = new SearchResultModel({
        ...mockSearchResult,
        startAt: 50,
      });
      const prevOptions = secondPageResult.getPreviousPageOptions();
      expect(prevOptions).toEqual({
        startAt: 0,
        maxResults: 50,
      });
    });

    it('should return page options for specific page', () => {
      const pageOptions = searchResult.getPageOptions(2);
      expect(pageOptions).toEqual({
        startAt: 50,
        maxResults: 50,
      });
    });

    it('should return null for invalid page numbers', () => {
      expect(searchResult.getPageOptions(0)).toBeNull();
      expect(searchResult.getPageOptions(4)).toBeNull();
    });
  });

  describe('Object Conversion', () => {
    it('should convert to object', () => {
      const obj = searchResult.toObject();
      expect(obj).toHaveProperty('items', ['item1', 'item2', 'item3']);
      expect(obj).toHaveProperty('pagination');
      expect(obj.pagination).toHaveProperty('total', 125);
    });
  });

  describe('Static Methods', () => {
    it('should create SearchResultModel from data', () => {
      const model = SearchResultModel.from(mockSearchResult);
      expect(model).toBeInstanceOf(SearchResultModel);
      expect(model.total).toBe(125);
    });
  });
});

describe('IssueSearchResultModel', () => {
  const mockJiraSearchResponse: JiraSearchResponse = {
    startAt: 0,
    maxResults: 2,
    total: 2,
    issues: [mockIssueData, { ...mockIssueData, id: '10002', key: 'TEST-124' }],
    warningMessages: ['This is a warning'],
    expand: 'changelog,transitions',
    names: {
      summary: 'Summary',
      status: 'Status',
    },
    schema: {
      summary: {
        type: 'string',
        system: 'summary',
      },
      status: {
        type: 'status',
        system: 'status',
      },
    },
  };

  let issueSearchResult: IssueSearchResultModel;

  beforeEach(() => {
    issueSearchResult = new IssueSearchResultModel(mockJiraSearchResponse);
  });

  describe('Basic Properties', () => {
    it('should return issue-specific properties', () => {
      expect(issueSearchResult.issues).toHaveLength(2);
      expect(issueSearchResult.issueCollection.count).toBe(2);
      expect(issueSearchResult.warningMessages).toEqual(['This is a warning']);
      expect(issueSearchResult.hasWarnings).toBe(true);
    });

    it('should return field information', () => {
      expect(issueSearchResult.fieldNames).toEqual({
        summary: 'Summary',
        status: 'Status',
      });
      expect(issueSearchResult.fieldSchemas).toHaveProperty('summary');
      expect(issueSearchResult.expandedFields).toEqual(['changelog', 'transitions']);
    });
  });

  describe('Field Operations', () => {
    it('should check if field is expanded', () => {
      expect(issueSearchResult.isFieldExpanded('changelog')).toBe(true);
      expect(issueSearchResult.isFieldExpanded('comments')).toBe(false);
    });

    it('should get field display name', () => {
      expect(issueSearchResult.getFieldDisplayName('summary')).toBe('Summary');
      expect(issueSearchResult.getFieldDisplayName('unknownField')).toBe('unknownField');
    });

    it('should get field schema', () => {
      const schema = issueSearchResult.getFieldSchema('summary');
      expect(schema).toEqual({
        type: 'string',
        system: 'summary',
      });
      expect(issueSearchResult.getFieldSchema('unknownField')).toBeUndefined();
    });
  });

  describe('Filtering', () => {
    it('should filter issues by status', () => {
      const filtered = issueSearchResult.filterByStatus('Open');
      expect(filtered.issues).toHaveLength(2); // Both mock issues have 'Open' status
    });

    it('should filter issues by assignee', () => {
      const filtered = issueSearchResult.filterByAssignee('john.doe');
      expect(filtered.issues).toHaveLength(2); // Both mock issues have same assignee
    });
  });

  describe('Sorting', () => {
    it('should sort issues by created date', () => {
      const sorted = issueSearchResult.sortByCreated(true);
      expect(sorted.issues).toHaveLength(2);
      expect(sorted).toBeInstanceOf(IssueSearchResultModel);
    });

    it('should sort issues by updated date', () => {
      const sorted = issueSearchResult.sortByUpdated(false);
      expect(sorted.issues).toHaveLength(2);
      expect(sorted).toBeInstanceOf(IssueSearchResultModel);
    });
  });

  describe('Object Conversion', () => {
    it('should convert to object with issue data', () => {
      const obj = issueSearchResult.toObject();
      expect(obj).toHaveProperty('issues');
      expect(obj).toHaveProperty('pagination');
      expect(obj).toHaveProperty('warnings', ['This is a warning']);
      expect(obj).toHaveProperty('fieldNames');
      expect(obj).toHaveProperty('expandedFields');
    });

    it('should convert to object with field selection', () => {
      const obj = issueSearchResult.toObject(['key', 'summary']);
      expect(obj.issues).toHaveLength(2);
      expect(obj.issues[0]).toHaveProperty('key');
      expect(obj.issues[0]).toHaveProperty('summary');
    });
  });

  describe('Static Methods', () => {
    it('should create IssueSearchResultModel from JiraSearchResponse', () => {
      const model = IssueSearchResultModel.from(mockJiraSearchResponse);
      expect(model).toBeInstanceOf(IssueSearchResultModel);
      expect(model.total).toBe(2);
    });
  });
});

describe('JQLQueryBuilder', () => {
  let builder: JQLQueryBuilder;

  beforeEach(() => {
    builder = new JQLQueryBuilder();
  });

  describe('Basic Conditions', () => {
    it('should add custom conditions', () => {
      builder.addCondition('custom = "value"');
      expect(builder.build()).toBe('custom = "value"');
    });

    it('should chain multiple conditions with AND', () => {
      builder
        .addCondition('field1 = "value1"')
        .addCondition('field2 = "value2"');
      expect(builder.build()).toBe('field1 = "value1" AND field2 = "value2"');
    });
  });

  describe('Project Conditions', () => {
    it('should add single project condition', () => {
      builder.project('TEST');
      expect(builder.build()).toBe('project = "TEST"');
    });

    it('should add multiple project condition', () => {
      builder.project(['TEST', 'DEMO']);
      expect(builder.build()).toBe('project IN ("TEST", "DEMO")');
    });
  });

  describe('Assignee Conditions', () => {
    it('should add assignee condition', () => {
      builder.assignee('john.doe');
      expect(builder.build()).toBe('assignee = "john.doe"');
    });

    it('should add unassigned condition', () => {
      builder.assignee(null);
      expect(builder.build()).toBe('assignee IS EMPTY');
    });
  });

  describe('Status Conditions', () => {
    it('should add single status condition', () => {
      builder.status('Open');
      expect(builder.build()).toBe('status = "Open"');
    });

    it('should add multiple status condition', () => {
      builder.status(['Open', 'In Progress']);
      expect(builder.build()).toBe('status IN ("Open", "In Progress")');
    });
  });

  describe('Date Conditions', () => {
    it('should add created after condition', () => {
      builder.createdAfter('2024-01-01');
      expect(builder.build()).toBe('created >= "2024-01-01"');
    });

    it('should add created before condition', () => {
      builder.createdBefore('2024-01-31');
      expect(builder.build()).toBe('created <= "2024-01-31"');
    });

    it('should add created between condition', () => {
      builder.createdBetween('2024-01-01', '2024-01-31');
      expect(builder.build()).toBe('created >= "2024-01-01" AND created <= "2024-01-31"');
    });
  });

  describe('Text Search Conditions', () => {
    it('should add text search condition', () => {
      builder.textSearch('bug');
      expect(builder.build()).toBe('text ~ "bug"');
    });

    it('should add summary search condition', () => {
      builder.summaryContains('error');
      expect(builder.build()).toBe('summary ~ "error"');
    });

    it('should add description search condition', () => {
      builder.descriptionContains('crash');
      expect(builder.build()).toBe('description ~ "crash"');
    });
  });

  describe('Custom Field Conditions', () => {
    it('should add custom field condition with string value', () => {
      builder.customField('10001', 'value');
      expect(builder.build()).toBe('cf[10001] = "value"');
    });

    it('should add custom field condition with number value', () => {
      builder.customField('10001', 42);
      expect(builder.build()).toBe('cf[10001] = 42');
    });

    it('should add empty custom field condition', () => {
      builder.customField('10001', null);
      expect(builder.build()).toBe('cf[10001] IS EMPTY');
    });
  });

  describe('Order By Clauses', () => {
    it('should add order by clause with default ASC', () => {
      builder.project('TEST').orderBy('created');
      expect(builder.build()).toBe('project = "TEST" ORDER BY created ASC');
    });

    it('should add order by clause with DESC', () => {
      builder.project('TEST').orderBy('updated', 'DESC');
      expect(builder.build()).toBe('project = "TEST" ORDER BY updated DESC');
    });

    it('should add multiple order by clauses', () => {
      builder.project('TEST').orderBy('priority', 'DESC').orderBy('created', 'ASC');
      expect(builder.build()).toBe('project = "TEST" ORDER BY priority DESC, created ASC');
    });
  });

  describe('Complex Queries', () => {
    it('should build complex query with multiple conditions', () => {
      const jql = builder
        .project(['TEST', 'DEMO'])
        .status(['Open', 'In Progress'])
        .assignee('john.doe')
        .createdAfter('2024-01-01')
        .orderBy('updated', 'DESC')
        .build();

      expect(jql).toBe(
        'project IN ("TEST", "DEMO") AND status IN ("Open", "In Progress") AND assignee = "john.doe" AND created >= "2024-01-01" ORDER BY updated DESC'
      );
    });
  });

  describe('Utility Methods', () => {
    it('should clear all conditions and order by', () => {
      builder.project('TEST').status('Open').orderBy('created');
      builder.clear();
      expect(builder.build()).toBe('');
      expect(builder.getConditions()).toEqual([]);
      expect(builder.getOrderBy()).toEqual([]);
    });

    it('should return current conditions and order by', () => {
      builder.project('TEST').status('Open').orderBy('created');
      expect(builder.getConditions()).toEqual(['project = "TEST"', 'status = "Open"']);
      expect(builder.getOrderBy()).toEqual(['created ASC']);
    });
  });

  describe('Static Methods', () => {
    it('should create new query builder', () => {
      const newBuilder = JQLQueryBuilder.create();
      expect(newBuilder).toBeInstanceOf(JQLQueryBuilder);
      expect(newBuilder.build()).toBe('');
    });
  });
});

describe('SearchOptionsBuilder', () => {
  let builder: SearchOptionsBuilder;

  beforeEach(() => {
    builder = new SearchOptionsBuilder();
  });

  describe('Field Selection', () => {
    it('should set fields', () => {
      const options = builder.fields(['summary', 'status']).build();
      expect(options.fields).toEqual(['summary', 'status']);
    });

    it('should add individual fields', () => {
      const options = builder
        .addField('summary')
        .addField('status')
        .build();
      expect(options.fields).toEqual(['summary', 'status']);
    });
  });

  describe('Expand Options', () => {
    it('should set expand options', () => {
      const options = builder.expand(['changelog', 'transitions']).build();
      expect(options.expand).toEqual(['changelog', 'transitions']);
    });

    it('should add individual expand options', () => {
      const options = builder
        .addExpand('changelog')
        .addExpand('transitions')
        .build();
      expect(options.expand).toEqual(['changelog', 'transitions']);
    });
  });

  describe('Pagination', () => {
    it('should set pagination options', () => {
      const options = builder.pagination(25, 100).build();
      expect(options.startAt).toBe(25);
      expect(options.maxResults).toBe(100);
    });

    it('should set individual pagination options', () => {
      const options = builder
        .startAt(50)
        .maxResults(25)
        .build();
      expect(options.startAt).toBe(50);
      expect(options.maxResults).toBe(25);
    });
  });

  describe('Other Options', () => {
    it('should set properties', () => {
      const options = builder.properties(['prop1', 'prop2']).build();
      expect(options.properties).toEqual(['prop1', 'prop2']);
    });

    it('should set query validation', () => {
      const options = builder.validateQuery(true).build();
      expect(options.validateQuery).toBe(true);
    });
  });

  describe('Complex Options', () => {
    it('should build complex options object', () => {
      const options = builder
        .fields(['summary', 'status', 'assignee'])
        .expand(['changelog'])
        .pagination(0, 50)
        .validateQuery(true)
        .build();

      expect(options).toEqual({
        fields: ['summary', 'status', 'assignee'],
        expand: ['changelog'],
        startAt: 0,
        maxResults: 50,
        validateQuery: true,
      });
    });
  });

  describe('Utility Methods', () => {
    it('should clear all options', () => {
      builder.fields(['summary']).expand(['changelog']);
      builder.clear();
      expect(builder.build()).toEqual({});
    });
  });

  describe('Static Methods', () => {
    it('should create new options builder', () => {
      const newBuilder = SearchOptionsBuilder.create();
      expect(newBuilder).toBeInstanceOf(SearchOptionsBuilder);
      expect(newBuilder.build()).toEqual({});
    });
  });
});