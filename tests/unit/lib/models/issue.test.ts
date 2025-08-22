/**
 * Issue Model Unit Tests
 *
 * Tests for the Issue data model classes and their functionality.
 */

import { IssueModel, IssueCollectionModel } from '@/lib/models/issue';
import type { JiraIssue, JiraIssueFields } from '@/types/jira-api';

describe('IssueModel', () => {
  const mockIssueData: JiraIssue = {
    id: '10001',
    key: 'TEST-123',
    self: 'https://jira.example.com/rest/api/2/issue/10001',
    fields: {
      summary: 'Test Issue',
      description: 'This is a test issue',
      status: {
        self: 'https://jira.example.com/rest/api/2/status/1',
        id: '1',
        name: 'Open',
        description: 'The issue is open',
        iconUrl: 'https://jira.example.com/images/icons/statuses/open.png',
        statusCategory: {
          self: 'https://jira.example.com/rest/api/2/statuscategory/2',
          id: 2,
          key: 'new',
          colorName: 'blue-gray',
          name: 'To Do',
        },
      },
      priority: {
        self: 'https://jira.example.com/rest/api/2/priority/3',
        id: '3',
        name: 'Medium',
        iconUrl: 'https://jira.example.com/images/icons/priorities/medium.svg',
        statusColor: '#ffd351',
      },
      issuetype: {
        self: 'https://jira.example.com/rest/api/2/issuetype/1',
        id: '1',
        name: 'Bug',
        description: 'A problem with the software',
        iconUrl: 'https://jira.example.com/images/icons/issuetypes/bug.png',
        subtask: false,
      },
      project: {
        self: 'https://jira.example.com/rest/api/2/project/10000',
        id: '10000',
        key: 'TEST',
        name: 'Test Project',
        components: [],
        issueTypes: [],
        versions: [],
        roles: {},
        avatarUrls: {
          '16x16': 'https://jira.example.com/secure/projectavatar?size=xsmall&pid=10000',
          '24x24': 'https://jira.example.com/secure/projectavatar?size=small&pid=10000',
          '32x32': 'https://jira.example.com/secure/projectavatar?size=medium&pid=10000',
          '48x48': 'https://jira.example.com/secure/projectavatar?pid=10000',
        },
      },
      assignee: {
        self: 'https://jira.example.com/rest/api/2/user?username=john.doe',
        id: '1001',
        name: 'john.doe',
        key: 'john.doe',
        displayName: 'John Doe',
        emailAddress: 'john.doe@example.com',
        active: true,
        avatarUrls: {
          '16x16': 'https://jira.example.com/secure/useravatar?size=xsmall&ownerId=john.doe',
          '24x24': 'https://jira.example.com/secure/useravatar?size=small&ownerId=john.doe',
          '32x32': 'https://jira.example.com/secure/useravatar?size=medium&ownerId=john.doe',
          '48x48': 'https://jira.example.com/secure/useravatar?ownerId=john.doe',
        },
      },
      reporter: {
        self: 'https://jira.example.com/rest/api/2/user?username=jane.smith',
        id: '1002',
        name: 'jane.smith',
        key: 'jane.smith',
        displayName: 'Jane Smith',
        emailAddress: 'jane.smith@example.com',
        active: true,
        avatarUrls: {
          '16x16': 'https://jira.example.com/secure/useravatar?size=xsmall&ownerId=jane.smith',
          '24x24': 'https://jira.example.com/secure/useravatar?size=small&ownerId=jane.smith',
          '32x32': 'https://jira.example.com/secure/useravatar?size=medium&ownerId=jane.smith',
          '48x48': 'https://jira.example.com/secure/useravatar?ownerId=jane.smith',
        },
      },
      creator: {
        self: 'https://jira.example.com/rest/api/2/user?username=jane.smith',
        id: '1002',
        name: 'jane.smith',
        key: 'jane.smith',
        displayName: 'Jane Smith',
        emailAddress: 'jane.smith@example.com',
        active: true,
        avatarUrls: {
          '16x16': 'https://jira.example.com/secure/useravatar?size=xsmall&ownerId=jane.smith',
          '24x24': 'https://jira.example.com/secure/useravatar?size=small&ownerId=jane.smith',
          '32x32': 'https://jira.example.com/secure/useravatar?size=medium&ownerId=jane.smith',
          '48x48': 'https://jira.example.com/secure/useravatar?ownerId=jane.smith',
        },
      },
      created: '2024-01-15T10:30:00.000+0000',
      updated: '2024-01-16T14:15:00.000+0000',
      resolutiondate: undefined,
      duedate: '2024-01-20T00:00:00.000+0000',
      resolution: undefined,
      components: [],
      fixVersions: [],
      versions: [],
      labels: ['bug', 'urgent'],
      timeoriginalestimate: 28800, // 8 hours in seconds
      timeestimate: 14400, // 4 hours in seconds
      timespent: 14400, // 4 hours in seconds
      customfield_10001: 'Custom field value',
    } as JiraIssueFields,
  };

  let issueModel: IssueModel;

  beforeEach(() => {
    issueModel = new IssueModel(mockIssueData);
  });

  describe('Basic Properties', () => {
    it('should return basic identification properties', () => {
      expect(issueModel.id).toBe('10001');
      expect(issueModel.key).toBe('TEST-123');
      expect(issueModel.self).toBe('https://jira.example.com/rest/api/2/issue/10001');
    });

    it('should return core issue fields', () => {
      expect(issueModel.summary).toBe('Test Issue');
      expect(issueModel.description).toBe('This is a test issue');
      expect(issueModel.status.name).toBe('Open');
      expect(issueModel.priority?.name).toBe('Medium');
      expect(issueModel.issueType.name).toBe('Bug');
      expect(issueModel.project.key).toBe('TEST');
    });

    it('should return people information', () => {
      expect(issueModel.assignee?.displayName).toBe('John Doe');
      expect(issueModel.reporter?.displayName).toBe('Jane Smith');
      expect(issueModel.creator?.displayName).toBe('Jane Smith');
    });

    it('should return date information', () => {
      expect(issueModel.created).toBe('2024-01-15T10:30:00.000+0000');
      expect(issueModel.updated).toBe('2024-01-16T14:15:00.000+0000');
      expect(issueModel.dueDate).toBe('2024-01-20T00:00:00.000+0000');
    });
  });

  describe('Resolution Status', () => {
    it('should correctly identify unresolved issues', () => {
      expect(issueModel.resolution).toBeUndefined();
      expect(issueModel.isResolved).toBe(false);
      expect(issueModel.resolutionDate).toBeUndefined();
    });

    it('should correctly identify resolved issues', () => {
      const resolvedData = {
        ...mockIssueData,
        fields: {
          ...mockIssueData.fields,
          resolution: {
            self: 'https://jira.example.com/rest/api/2/resolution/1',
            id: '1',
            name: 'Fixed',
            description: 'A fix for this issue is checked into the tree.',
          },
          resolutiondate: '2024-01-17T16:00:00.000+0000',
        },
      };
      const resolvedIssue = new IssueModel(resolvedData);

      expect(resolvedIssue.resolution?.name).toBe('Fixed');
      expect(resolvedIssue.isResolved).toBe(true);
      expect(resolvedIssue.resolutionDate).toBe('2024-01-17T16:00:00.000+0000');
    });
  });

  describe('Classifications', () => {
    it('should return classification arrays', () => {
      expect(issueModel.components).toEqual([]);
      expect(issueModel.fixVersions).toEqual([]);
      expect(issueModel.affectedVersions).toEqual([]);
      expect(issueModel.labels).toEqual(['bug', 'urgent']);
    });
  });

  describe('Relationships', () => {
    it('should handle issues without subtasks or parent', () => {
      expect(issueModel.parent).toBeUndefined();
      expect(issueModel.subtasks).toBeUndefined();
      expect(issueModel.isSubtask).toBe(false);
      expect(issueModel.hasSubtasks).toBe(false);
    });

    it('should correctly identify subtasks', () => {
      const subtaskData = {
        ...mockIssueData,
        fields: {
          ...mockIssueData.fields,
          issuetype: {
            ...mockIssueData.fields.issuetype,
            subtask: true,
          },
          parent: {
            id: '10000',
            key: 'TEST-122',
            fields: {
              summary: 'Parent Issue',
              status: mockIssueData.fields.status,
              priority: mockIssueData.fields.priority,
              issuetype: mockIssueData.fields.issuetype,
            },
          },
        },
      };
      const subtaskIssue = new IssueModel(subtaskData);

      expect(subtaskIssue.isSubtask).toBe(true);
      expect(subtaskIssue.parent?.key).toBe('TEST-122');
    });
  });

  describe('Time Tracking', () => {
    it('should return time tracking information', () => {
      const timeTracking = issueModel.timeTracking;
      expect(timeTracking.originalEstimate).toBe(28800);
      expect(timeTracking.remainingEstimate).toBe(14400);
      expect(timeTracking.timeSpent).toBe(14400);
    });
  });

  describe('Custom Fields', () => {
    it('should return custom field values', () => {
      expect(issueModel.getCustomField('customfield_10001')).toBe('Custom field value');
      expect(issueModel.getCustomField('customfield_nonexistent')).toBeUndefined();
    });

    it('should return all custom fields', () => {
      const customFields = issueModel.getCustomFields();
      expect(customFields).toHaveProperty('customfield_10001', 'Custom field value');
    });
  });

  describe('Field Extraction', () => {
    it('should extract simple fields', () => {
      const extracted = issueModel.extractFields(['summary', 'key']);
      expect(extracted).toEqual({
        summary: 'Test Issue',
        key: 'TEST-123',
      });
    });

    it('should extract nested fields with dot notation', () => {
      const extracted = issueModel.extractFields(['assignee.displayName', 'status.name']);
      expect(extracted).toEqual({
        'assignee.displayName': 'John Doe',
        'status.name': 'Open',
      });
    });

    it('should handle undefined nested fields', () => {
      const extracted = issueModel.extractFields(['resolution.name', 'nonexistent.field']);
      expect(extracted).toEqual({});
    });
  });

  describe('Object Conversion', () => {
    it('should convert to object without field selection', () => {
      const obj = issueModel.toObject();
      expect(obj).toHaveProperty('id', '10001');
      expect(obj).toHaveProperty('key', 'TEST-123');
      expect(obj).toHaveProperty('fields');
    });

    it('should convert to object with field selection', () => {
      const obj = issueModel.toObject(['summary', 'assignee.displayName']);
      expect(obj).toEqual({
        summary: 'Test Issue',
        'assignee.displayName': 'John Doe',
      });
    });
  });

  describe('Static Methods', () => {
    it('should create IssueModel from raw data', () => {
      const model = IssueModel.from(mockIssueData);
      expect(model).toBeInstanceOf(IssueModel);
      expect(model.key).toBe('TEST-123');
    });

    it('should create multiple IssueModels from array', () => {
      const models = IssueModel.fromArray([mockIssueData, mockIssueData]);
      expect(models).toHaveLength(2);
      expect(models[0]).toBeInstanceOf(IssueModel);
      expect(models[1]).toBeInstanceOf(IssueModel);
    });
  });
});

describe('IssueCollectionModel', () => {
  const mockIssues: JiraIssue[] = [
    {
      ...mockIssueData,
      id: '10001',
      key: 'TEST-123',
      fields: {
        ...mockIssueData.fields,
        summary: 'First Issue',
        status: { ...mockIssueData.fields.status, name: 'Open' },
        assignee: { ...mockIssueData.fields.assignee!, key: 'john.doe' },
      },
    },
    {
      ...mockIssueData,
      id: '10002',
      key: 'TEST-124',
      fields: {
        ...mockIssueData.fields,
        summary: 'Second Issue',
        status: { ...mockIssueData.fields.status, name: 'In Progress' },
        assignee: undefined,
      },
    },
    {
      ...mockIssueData,
      id: '10003',
      key: 'TEST-125',
      fields: {
        ...mockIssueData.fields,
        summary: 'Third Issue',
        status: { ...mockIssueData.fields.status, name: 'Open' },
        assignee: { ...mockIssueData.fields.assignee!, key: 'jane.smith' },
        project: { ...mockIssueData.fields.project, key: 'OTHER' },
      },
    },
  ];

  let collection: IssueCollectionModel;

  beforeEach(() => {
    collection = IssueCollectionModel.from(mockIssues);
  });

  describe('Basic Properties', () => {
    it('should return correct count', () => {
      expect(collection.count).toBe(3);
    });

    it('should return all issues as IssueModel instances', () => {
      const issues = collection.issues;
      expect(issues).toHaveLength(3);
      expect(issues[0]).toBeInstanceOf(IssueModel);
      expect(issues[1]).toBeInstanceOf(IssueModel);
      expect(issues[2]).toBeInstanceOf(IssueModel);
    });
  });

  describe('Filtering', () => {
    it('should filter issues by status', () => {
      const openIssues = collection.filterByStatus('Open');
      expect(openIssues.count).toBe(2);
      expect(openIssues.issues[0].key).toBe('TEST-123');
      expect(openIssues.issues[1].key).toBe('TEST-125');
    });

    it('should filter issues by assignee', () => {
      const johnIssues = collection.filterByAssignee('john.doe');
      expect(johnIssues.count).toBe(1);
      expect(johnIssues.issues[0].key).toBe('TEST-123');

      const unassignedIssues = collection.filterByAssignee(undefined);
      expect(unassignedIssues.count).toBe(1);
      expect(unassignedIssues.issues[0].key).toBe('TEST-124');
    });

    it('should filter issues by project', () => {
      const testProjectIssues = collection.filterByProject('TEST');
      expect(testProjectIssues.count).toBe(2);

      const otherProjectIssues = collection.filterByProject('OTHER');
      expect(otherProjectIssues.count).toBe(1);
      expect(otherProjectIssues.issues[0].key).toBe('TEST-125');
    });

    it('should filter issues by issue type', () => {
      const bugIssues = collection.filterByIssueType('Bug');
      expect(bugIssues.count).toBe(3); // All issues are bugs in our mock data
    });
  });

  describe('Grouping', () => {
    it('should group issues by status', () => {
      const grouped = collection.groupByStatus();
      expect(grouped.has('Open')).toBe(true);
      expect(grouped.has('In Progress')).toBe(true);
      expect(grouped.get('Open')).toHaveLength(2);
      expect(grouped.get('In Progress')).toHaveLength(1);
    });

    it('should group issues by assignee', () => {
      const grouped = collection.groupByAssignee();
      expect(grouped.has('john.doe')).toBe(true);
      expect(grouped.has('jane.smith')).toBe(true);
      expect(grouped.has('unassigned')).toBe(true);
      expect(grouped.get('john.doe')).toHaveLength(1);
      expect(grouped.get('jane.smith')).toHaveLength(1);
      expect(grouped.get('unassigned')).toHaveLength(1);
    });
  });

  describe('Sorting', () => {
    it('should sort issues by created date', () => {
      const sorted = collection.sortByCreated(true);
      expect(sorted.issues[0].key).toBe('TEST-123'); // All have same date in mock
    });

    it('should sort issues by updated date', () => {
      const sorted = collection.sortByUpdated(false);
      expect(sorted.issues[0].key).toBe('TEST-123'); // All have same date in mock
    });
  });

  describe('Conversion', () => {
    it('should convert to array without field selection', () => {
      const array = collection.toArray();
      expect(array).toHaveLength(3);
      expect(array[0]).toHaveProperty('key', 'TEST-123');
    });

    it('should convert to array with field selection', () => {
      const array = collection.toArray(['key', 'summary']);
      expect(array).toHaveLength(3);
      expect(array[0]).toEqual({
        key: 'TEST-123',
        summary: 'First Issue',
      });
    });
  });

  describe('Static Methods', () => {
    it('should create collection from JiraIssue array', () => {
      const newCollection = IssueCollectionModel.from(mockIssues);
      expect(newCollection).toBeInstanceOf(IssueCollectionModel);
      expect(newCollection.count).toBe(3);
    });
  });
});

// Re-use mockIssueData for other tests
export { mockIssueData };