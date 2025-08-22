/**
 * Jira Server API Types Official Documentation Compliance Tests
 *
 * These tests verify that our type definitions match the official Jira Server REST API
 * documentation from https://developer.atlassian.com/server/jira/platform/rest/
 */

import {
  type JiraIssue,
  type JiraIssueFields,
  type JiraUser,
  type JiraProject,
  type JiraTransition,
  type JiraBoard,
  type JiraSprint,
  type JiraSearchResponse,
  type JiraField,
  type JiraCustomFieldValue,
} from '@/types/index';

describe('Jira Server API Official Documentation Compliance', () => {
  describe('Issue Entity (/rest/api/2/issue)', () => {
    it('should match official issue response structure', () => {
      // Based on GET /rest/api/2/issue/{issueIdOrKey}
      const officialIssueResponse: JiraIssue = {
        expand:
          'renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations',
        id: '10002',
        self: 'http://www.example.com/jira/rest/api/2/issue/10002',
        key: 'EX-1',
        fields: {
          // Core fields
          summary: 'Fix login issue',
          description: 'Users cannot log in with their credentials',
          issuetype: {
            self: 'http://www.example.com/jira/rest/api/2/issuetype/1',
            id: '1',
            description: 'A task that needs to be done.',
            iconUrl:
              'http://www.example.com/jira/images/icons/issuetypes/task.png',
            name: 'Task',
            subtask: false,
          },
          project: {
            self: 'http://www.example.com/jira/rest/api/2/project/EX',
            id: '10000',
            key: 'EX',
            name: 'Example',
            avatarUrls: {
              '48x48':
                'http://www.example.com/jira/secure/projectavatar?size=large&pid=10000',
              '24x24':
                'http://www.example.com/jira/secure/projectavatar?size=small&pid=10000',
              '16x16':
                'http://www.example.com/jira/secure/projectavatar?size=xsmall&pid=10000',
              '32x32':
                'http://www.example.com/jira/secure/projectavatar?size=medium&pid=10000',
            },
            projectCategory: {
              self: 'http://www.example.com/jira/rest/api/2/projectCategory/10000',
              id: '10000',
              name: 'FIRST',
              description: 'First Project Category',
            },
            components: [],
            issueTypes: [],
            versions: [],
            roles: {
              Administrators:
                'http://www.example.com/jira/rest/api/2/project/EX/role/10002',
            },
          },
          status: {
            self: 'http://www.example.com/jira/rest/api/2/status/1',
            description:
              'The issue is open and ready for the assignee to start work on it.',
            iconUrl:
              'http://www.example.com/jira/images/icons/statuses/open.png',
            name: 'Open',
            id: '1',
            statusCategory: {
              self: 'http://www.example.com/jira/rest/api/2/statuscategory/2',
              id: 2,
              key: 'new',
              colorName: 'blue-gray',
              name: 'To Do',
            },
          },
          priority: {
            self: 'http://www.example.com/jira/rest/api/2/priority/3',
            iconUrl:
              'http://www.example.com/jira/images/icons/priorities/medium.svg',
            name: 'Medium',
            id: '3',
            statusColor: '#ffab00',
            description: 'Medium priority',
          },

          // People
          assignee: {
            self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
            name: 'fred',
            key: 'fred',
            displayName: 'Fred F. User',
            emailAddress: 'fred@example.com',
            avatarUrls: {
              '48x48':
                'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
              '24x24':
                'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
              '16x16':
                'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
              '32x32':
                'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
            },
            active: true,
            timeZone: 'Australia/Sydney',
            id: '10000',
          },
          reporter: {
            self: 'http://www.example.com/jira/rest/api/2/user?username=admin',
            name: 'admin',
            key: 'admin',
            displayName: 'Administrator',
            emailAddress: 'admin@example.com',
            avatarUrls: {
              '48x48':
                'http://www.example.com/jira/secure/useravatar?size=large&ownerId=admin',
              '24x24':
                'http://www.example.com/jira/secure/useravatar?size=small&ownerId=admin',
              '16x16':
                'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=admin',
              '32x32':
                'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=admin',
            },
            active: true,
            id: '10001',
          },
          creator: {
            self: 'http://www.example.com/jira/rest/api/2/user?username=admin',
            name: 'admin',
            key: 'admin',
            displayName: 'Administrator',
            emailAddress: 'admin@example.com',
            avatarUrls: {
              '48x48':
                'http://www.example.com/jira/secure/useravatar?size=large&ownerId=admin',
              '24x24':
                'http://www.example.com/jira/secure/useravatar?size=small&ownerId=admin',
              '16x16':
                'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=admin',
              '32x32':
                'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=admin',
            },
            active: true,
            id: '10001',
          },

          // Dates
          created: '2023-01-15T14:30:00.000+0000',
          updated: '2023-01-15T16:45:00.000+0000',
          resolutiondate: '2023-01-16T10:00:00.000+0000',
          duedate: '2023-01-20',

          // Resolution
          resolution: {
            self: 'http://www.example.com/jira/rest/api/2/resolution/1',
            id: '1',
            description:
              'A fix for this issue is checked into the tree and tested.',
            name: 'Fixed',
          },

          // Classifications
          components: [
            {
              self: 'http://www.example.com/jira/rest/api/2/component/10000',
              id: '10000',
              name: 'Authentication',
              description: 'Authentication related components',
              lead: {
                self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
                name: 'fred',
                key: 'fred',
                displayName: 'Fred F. User',
                emailAddress: 'fred@example.com',
                avatarUrls: {
                  '48x48':
                    'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                  '24x24':
                    'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                  '16x16':
                    'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                  '32x32':
                    'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
                },
                active: true,
                id: '10000',
              },
              assigneeType: 'PROJECT_LEAD',
              realAssigneeType: 'PROJECT_LEAD',
              isAssigneeTypeValid: true,
              project: 'EX',
              projectId: 10000,
            },
          ],
          fixVersions: [
            {
              self: 'http://www.example.com/jira/rest/api/2/version/10000',
              id: '10000',
              name: '1.0',
              description: 'First major release',
              archived: false,
              released: false,
              startDate: '2023-01-01',
              releaseDate: '2023-06-01',
              overdue: false,
              userStartDate: '01/Jan/23',
              userReleaseDate: '01/Jun/23',
              project: 'EX',
              projectId: 10000,
              moveUnfixedIssuesTo:
                'http://www.example.com/jira/rest/api/2/version/10001',
              operations: [],
              remotelinks: [],
            },
          ],
          versions: [],
          labels: ['bugfix', 'authentication'],

          // Time tracking
          timeoriginalestimate: 28800, // 8 hours in seconds
          timeestimate: 14400, // 4 hours in seconds
          timespent: 14400, // 4 hours in seconds
          aggregatetimeoriginalestimate: 28800,
          aggregatetimeestimate: 14400,
          aggregatetimespent: 14400,

          // Custom fields (Server/DC specific)
          customfield_10008: 'EX-10', // Epic Link
          customfield_10009: 5, // Story Points
          customfield_10010: { value: 'High', id: '10000' }, // Select field
          customfield_10011: [
            { value: 'Frontend', id: '10001' },
            { value: 'Backend', id: '10002' },
          ], // Multi-select field

          // Environment
          environment: 'Production',

          // Subtasks
          subtasks: [
            {
              id: '10003',
              key: 'EX-2',
              fields: {
                summary: 'Fix database connection',
                status: {
                  self: 'http://www.example.com/jira/rest/api/2/status/3',
                  description: 'This issue is being actively worked on.',
                  iconUrl:
                    'http://www.example.com/jira/images/icons/statuses/inprogress.png',
                  name: 'In Progress',
                  id: '3',
                  statusCategory: {
                    self: 'http://www.example.com/jira/rest/api/2/statuscategory/4',
                    id: 4,
                    key: 'indeterminate',
                    colorName: 'yellow',
                    name: 'In Progress',
                  },
                },
                priority: {
                  self: 'http://www.example.com/jira/rest/api/2/priority/2',
                  iconUrl:
                    'http://www.example.com/jira/images/icons/priorities/high.svg',
                  name: 'High',
                  id: '2',
                  statusColor: '#ff5722',
                  description: 'High priority',
                },
                issuetype: {
                  self: 'http://www.example.com/jira/rest/api/2/issuetype/5',
                  id: '5',
                  description:
                    'A small piece of work that is part of a larger task.',
                  iconUrl:
                    'http://www.example.com/jira/images/icons/issuetypes/subtask.png',
                  name: 'Sub-task',
                  subtask: true,
                },
              },
            },
          ],

          // Issue links
          issuelinks: [
            {
              id: '10001',
              type: {
                id: '10000',
                name: 'Blocks',
                inward: 'is blocked by',
                outward: 'blocks',
                self: 'http://www.example.com/jira/rest/api/2/issueLinkType/10000',
              },
              outwardIssue: {
                id: '10004',
                key: 'EX-3',
                self: 'http://www.example.com/jira/rest/api/2/issue/10004',
                fields: {
                  summary: 'Update documentation',
                  status: {
                    self: 'http://www.example.com/jira/rest/api/2/status/1',
                    description:
                      'The issue is open and ready for the assignee to start work on it.',
                    iconUrl:
                      'http://www.example.com/jira/images/icons/statuses/open.png',
                    name: 'Open',
                    id: '1',
                    statusCategory: {
                      self: 'http://www.example.com/jira/rest/api/2/statuscategory/2',
                      id: 2,
                      key: 'new',
                      colorName: 'blue-gray',
                      name: 'To Do',
                    },
                  },
                  priority: {
                    self: 'http://www.example.com/jira/rest/api/2/priority/4',
                    iconUrl:
                      'http://www.example.com/jira/images/icons/priorities/low.svg',
                    name: 'Low',
                    id: '4',
                    statusColor: '#2e7d32',
                    description: 'Low priority',
                  },
                  issuetype: {
                    self: 'http://www.example.com/jira/rest/api/2/issuetype/1',
                    id: '1',
                    description: 'A task that needs to be done.',
                    iconUrl:
                      'http://www.example.com/jira/images/icons/issuetypes/task.png',
                    name: 'Task',
                    subtask: false,
                  },
                },
              },
            },
          ],
        },
      };

      // Verify core structure
      expect(officialIssueResponse.id).toBe('10002');
      expect(officialIssueResponse.key).toBe('EX-1');
      expect(officialIssueResponse.self).toContain('/rest/api/2/issue/10002');

      // Verify fields structure
      expect(officialIssueResponse.fields.summary).toBe('Fix login issue');
      expect(officialIssueResponse.fields.issuetype.subtask).toBe(false);
      expect(officialIssueResponse.fields.project.key).toBe('EX');

      // Verify Server/DC specific features
      expect(officialIssueResponse.fields.assignee?.name).toBe('fred'); // Server uses 'name'
      expect(officialIssueResponse.fields.assignee?.key).toBe('fred'); // Server uses 'key'
      expect(officialIssueResponse.fields.customfield_10008).toBe('EX-10'); // Epic Link
      expect(officialIssueResponse.fields.customfield_10009).toBe(5); // Story Points

      // Verify nested structures
      expect(officialIssueResponse.fields.status.statusCategory.key).toBe(
        'new'
      );
      expect(officialIssueResponse.fields.components[0]?.lead?.name).toBe(
        'fred'
      );
      expect(
        officialIssueResponse.fields.subtasks?.[0]?.fields.issuetype.subtask
      ).toBe(true);
    });

    it('should support all standard issue fields from API', () => {
      const issueFields: Partial<JiraIssueFields> = {
        // Core identification
        summary: 'Test Issue',
        description: 'This is a test issue',

        // Time tracking fields
        timeoriginalestimate: 28800,
        timeestimate: 14400,
        timespent: 14400,
        aggregatetimeoriginalestimate: 28800,
        aggregatetimeestimate: 14400,
        aggregatetimespent: 14400,

        // Worklog with official structure
        worklog: {
          startAt: 0,
          maxResults: 50,
          total: 1,
          worklogs: [
            {
              self: 'http://www.example.com/jira/rest/api/2/issue/10010/worklog/10000',
              author: {
                self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
                name: 'fred',
                key: 'fred',
                displayName: 'Fred F. User',
                emailAddress: 'fred@example.com',
                avatarUrls: {
                  '48x48':
                    'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                  '24x24':
                    'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                  '16x16':
                    'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                  '32x32':
                    'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
                },
                active: true,
                id: '10000',
              },
              updateAuthor: {
                self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
                name: 'fred',
                key: 'fred',
                displayName: 'Fred F. User',
                emailAddress: 'fred@example.com',
                avatarUrls: {
                  '48x48':
                    'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                  '24x24':
                    'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                  '16x16':
                    'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                  '32x32':
                    'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
                },
                active: true,
                id: '10000',
              },
              comment: 'Fixed authentication issue',
              created: '2023-01-15T14:30:00.000+0000',
              updated: '2023-01-15T14:35:00.000+0000',
              started: '2023-01-15T09:00:00.000+0000',
              timeSpent: '4h',
              timeSpentSeconds: 14400,
              id: '10000',
              issueId: '10002',
              visibility: {
                type: 'group',
                value: 'jira-developers',
                identifier: 'jira-developers',
              },
            },
          ],
        },

        // Attachments
        attachment: [
          {
            self: 'http://www.example.com/jira/rest/api/2/attachment/10000',
            id: '10000',
            filename: 'error-log.txt',
            author: {
              self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
              name: 'fred',
              key: 'fred',
              displayName: 'Fred F. User',
              emailAddress: 'fred@example.com',
              avatarUrls: {
                '48x48':
                  'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                '24x24':
                  'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                '16x16':
                  'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                '32x32':
                  'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
              },
              active: true,
              id: '10000',
            },
            created: '2023-01-15T14:30:00.000+0000',
            size: 2048,
            mimeType: 'text/plain',
            content:
              'http://www.example.com/jira/secure/attachment/10000/error-log.txt',
            thumbnail: 'http://www.example.com/jira/secure/thumbnail/10000',
          },
        ],

        // Comments
        comment: {
          startAt: 0,
          maxResults: 50,
          total: 1,
          comments: [
            {
              self: 'http://www.example.com/jira/rest/api/2/issue/10010/comment/10000',
              id: '10000',
              author: {
                self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
                name: 'fred',
                key: 'fred',
                displayName: 'Fred F. User',
                emailAddress: 'fred@example.com',
                avatarUrls: {
                  '48x48':
                    'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                  '24x24':
                    'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                  '16x16':
                    'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                  '32x32':
                    'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
                },
                active: true,
                id: '10000',
              },
              body: 'This issue has been resolved. Please test and verify.',
              updateAuthor: {
                self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
                name: 'fred',
                key: 'fred',
                displayName: 'Fred F. User',
                emailAddress: 'fred@example.com',
                avatarUrls: {
                  '48x48':
                    'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                  '24x24':
                    'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                  '16x16':
                    'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                  '32x32':
                    'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
                },
                active: true,
                id: '10000',
              },
              created: '2023-01-15T14:30:00.000+0000',
              updated: '2023-01-15T14:35:00.000+0000',
              visibility: {
                type: 'role',
                value: 'Administrators',
              },
            },
          ],
        },

        // Votes and watches
        votes: {
          self: 'http://www.example.com/jira/rest/api/2/issue/EX-1/votes',
          votes: 5,
          hasVoted: false,
          voters: [],
        },
        watches: {
          self: 'http://www.example.com/jira/rest/api/2/issue/EX-1/watchers',
          watchCount: 3,
          isWatching: true,
          watchers: [],
        },
      };

      expect(issueFields.worklog?.total).toBe(1);
      expect(issueFields.attachment?.[0]?.mimeType).toBe('text/plain');
      expect(issueFields.comment?.comments[0]?.author.name).toBe('fred');
      expect(issueFields.votes?.votes).toBe(5);
      expect(issueFields.watches?.isWatching).toBe(true);
    });
  });

  describe('User Entity (/rest/api/2/user)', () => {
    it('should match official user response structure', () => {
      // Based on GET /rest/api/2/user?username={username}
      const officialUserResponse: JiraUser = {
        self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
        key: 'fred',
        name: 'fred', // Server/DC specific
        emailAddress: 'fred@example.com',
        avatarUrls: {
          '48x48':
            'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
          '24x24':
            'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
          '16x16':
            'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
          '32x32':
            'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
        },
        displayName: 'Fred F. User',
        active: true,
        timeZone: 'Australia/Sydney',
        locale: 'en_AU',
        groups: {
          size: 3,
          items: [
            {
              name: 'jira-administrators',
              self: 'http://www.example.com/jira/rest/api/2/group?groupname=jira-administrators',
              id: '10000',
            },
            {
              name: 'jira-developers',
              self: 'http://www.example.com/jira/rest/api/2/group?groupname=jira-developers',
              id: '10001',
            },
          ],
        },
        id: '10000',
      };

      // Verify Server/DC specific fields
      expect(officialUserResponse.name).toBe('fred'); // Server uses 'name'
      expect(officialUserResponse.key).toBe('fred'); // Server uses 'key'
      expect(officialUserResponse.emailAddress).toBe('fred@example.com');
      expect(officialUserResponse.active).toBe(true);
      expect(officialUserResponse.timeZone).toBe('Australia/Sydney');
      expect(officialUserResponse.groups?.size).toBe(3);
      expect(officialUserResponse.groups?.items[0]?.name).toBe(
        'jira-administrators'
      );
    });
  });

  describe('Project Entity (/rest/api/2/project)', () => {
    it('should match official project response structure', () => {
      // Based on GET /rest/api/2/project/{projectIdOrKey}
      const officialProjectResponse: JiraProject = {
        expand:
          'description,lead,issueTypes,url,projectKeys,permissions,insight',
        self: 'http://www.example.com/jira/rest/api/2/project/EX',
        id: '10000',
        key: 'EX',
        description: 'This project was created as an example for REST.',
        lead: {
          self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
          key: 'fred',
          name: 'fred',
          avatarUrls: {
            '48x48':
              'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
            '24x24':
              'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
            '16x16':
              'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
            '32x32':
              'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
          },
          displayName: 'Fred F. User',
          active: true,
          id: '10000',
        },
        components: [
          {
            self: 'http://www.example.com/jira/rest/api/2/component/10000',
            id: '10000',
            name: 'Component 1',
            description: 'This is a Jira component',
            lead: {
              self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
              key: 'fred',
              name: 'fred',
              avatarUrls: {
                '48x48':
                  'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                '24x24':
                  'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                '16x16':
                  'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                '32x32':
                  'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
              },
              displayName: 'Fred F. User',
              active: true,
              id: '10000',
            },
            assigneeType: 'PROJECT_LEAD',
            assignee: {
              self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
              key: 'fred',
              name: 'fred',
              avatarUrls: {
                '48x48':
                  'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                '24x24':
                  'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                '16x16':
                  'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                '32x32':
                  'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
              },
              displayName: 'Fred F. User',
              active: true,
              id: '10000',
            },
            realAssigneeType: 'PROJECT_LEAD',
            realAssignee: {
              self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
              key: 'fred',
              name: 'fred',
              avatarUrls: {
                '48x48':
                  'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
                '24x24':
                  'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
                '16x16':
                  'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
                '32x32':
                  'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
              },
              displayName: 'Fred F. User',
              active: true,
              id: '10000',
            },
            isAssigneeTypeValid: true,
            project: 'EX',
            projectId: 10000,
          },
        ],
        issueTypes: [
          {
            self: 'http://www.example.com/jira/rest/api/2/issuetype/1',
            id: '1',
            description: 'A task that needs to be done.',
            iconUrl:
              'http://www.example.com/jira/images/icons/issuetypes/task.png',
            name: 'Task',
            subtask: false,
            avatarId: 10318,
            hierarchyLevel: 0,
          },
          {
            self: 'http://www.example.com/jira/rest/api/2/issuetype/5',
            id: '5',
            description: 'The sub-task of the issue',
            iconUrl:
              'http://www.example.com/jira/images/icons/issuetypes/subtask_alternate.png',
            name: 'Sub-task',
            subtask: true,
            avatarId: 10316,
            hierarchyLevel: -1,
          },
        ],
        url: 'http://www.example.com/jira/browse/EX',
        email: 'from-jira@example.com',
        assigneeType: 'PROJECT_LEAD',
        versions: [
          {
            self: 'http://www.example.com/jira/rest/api/2/version/10000',
            id: '10000',
            name: '1.0',
            description: 'First Full Functionality Release',
            archived: false,
            released: false,
            startDate: '2010-07-06',
            releaseDate: '2010-07-06',
            overdue: true,
            userStartDate: '06/Jul/10',
            userReleaseDate: '06/Jul/10',
            project: 'EX',
            projectId: 10000,
            moveUnfixedIssuesTo:
              'http://www.example.com/jira/rest/api/2/version/10001',
            operations: [],
            remotelinks: [],
          },
        ],
        name: 'Example',
        roles: {
          Administrators:
            'http://www.example.com/jira/rest/api/2/project/EX/role/10002',
          Developers:
            'http://www.example.com/jira/rest/api/2/project/EX/role/10001',
        },
        avatarUrls: {
          '48x48':
            'http://www.example.com/jira/secure/projectavatar?size=large&pid=10000',
          '24x24':
            'http://www.example.com/jira/secure/projectavatar?size=small&pid=10000',
          '16x16':
            'http://www.example.com/jira/secure/projectavatar?size=xsmall&pid=10000',
          '32x32':
            'http://www.example.com/jira/secure/projectavatar?size=medium&pid=10000',
        },
        projectCategory: {
          self: 'http://www.example.com/jira/rest/api/2/projectCategory/10000',
          id: '10000',
          name: 'FIRST',
          description: 'First Project Category',
        },
        projectTypeKey: 'software',
        archived: false,
        insight: {
          totalIssueCount: 100,
          lastIssueUpdateTime: '2023-01-15T16:45:00.000+0000',
        },
      };

      expect(officialProjectResponse.key).toBe('EX');
      expect(officialProjectResponse.lead?.name).toBe('fred'); // Server uses 'name'
      expect(officialProjectResponse.components[0]?.assigneeType).toBe(
        'PROJECT_LEAD'
      );
      expect(officialProjectResponse.issueTypes.length).toBe(2);
      expect(officialProjectResponse.roles['Administrators']).toContain(
        '/role/10002'
      );
      expect(officialProjectResponse.insight?.totalIssueCount).toBe(100);
    });
  });

  describe('Search Response (/rest/api/2/search)', () => {
    it('should match official search response structure', () => {
      // Based on POST /rest/api/2/search
      const officialSearchResponse: JiraSearchResponse = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 1,
        issues: [
          {
            expand: '',
            id: '10001',
            self: 'http://www.example.com/jira/rest/api/2/issue/10001',
            key: 'HSP-1',
            fields: {
              summary: 'Sample Issue',
              issuetype: {
                self: 'http://www.example.com/jira/rest/api/2/issuetype/1',
                id: '1',
                description: 'A task that needs to be done.',
                iconUrl:
                  'http://www.example.com/jira/images/icons/issuetypes/task.png',
                name: 'Task',
                subtask: false,
              },
              project: {
                self: 'http://www.example.com/jira/rest/api/2/project/HSP',
                id: '10001',
                key: 'HSP',
                name: 'Sample Project',
                avatarUrls: {
                  '48x48':
                    'http://www.example.com/jira/secure/projectavatar?size=large&pid=10001',
                  '24x24':
                    'http://www.example.com/jira/secure/projectavatar?size=small&pid=10001',
                  '16x16':
                    'http://www.example.com/jira/secure/projectavatar?size=xsmall&pid=10001',
                  '32x32':
                    'http://www.example.com/jira/secure/projectavatar?size=medium&pid=10001',
                },
                components: [],
                issueTypes: [],
                versions: [],
                roles: {},
              },
              status: {
                self: 'http://www.example.com/jira/rest/api/2/status/1',
                description:
                  'The issue is open and ready for the assignee to start work on it.',
                iconUrl:
                  'http://www.example.com/jira/images/icons/statuses/open.png',
                name: 'Open',
                id: '1',
                statusCategory: {
                  self: 'http://www.example.com/jira/rest/api/2/statuscategory/2',
                  id: 2,
                  key: 'new',
                  colorName: 'blue-gray',
                  name: 'To Do',
                },
              },
              created: '2023-01-15T14:30:00.000+0000',
              updated: '2023-01-15T16:45:00.000+0000',
            },
          },
        ],
        warningMessages: [],
        names: {
          summary: 'Summary',
          issuetype: 'Issue Type',
          status: 'Status',
          project: 'Project',
        },
        schema: {
          summary: {
            type: 'string',
            system: 'summary',
          },
          issuetype: {
            type: 'issuetype',
            system: 'issuetype',
          },
        },
      };

      expect(officialSearchResponse.total).toBe(1);
      expect(officialSearchResponse.issues[0]?.key).toBe('HSP-1');
      expect(officialSearchResponse.names?.summary).toBe('Summary');
      expect(officialSearchResponse.schema?.summary?.type).toBe('string');
    });
  });

  describe('Agile Entities (/rest/agile/1.0)', () => {
    it('should match official board response structure', () => {
      // Based on GET /rest/agile/1.0/board/{boardId}
      const officialBoardResponse: JiraBoard = {
        id: '84',
        self: 'http://www.example.com/jira/rest/agile/1.0/board/84',
        name: 'scrum board',
        type: 'scrum',
        location: {
          type: 'project',
          projectId: 10000,
          displayName: 'Project name',
          projectName: 'Project name',
          projectKey: 'PROJ',
          projectTypeKey: 'software',
          avatarURI:
            'http://www.example.com/jira/secure/projectavatar?size=medium&pid=10000',
          name: 'Project name',
        },
        canEdit: true,
        isPrivate: false,
        favourite: false,
      };

      expect(officialBoardResponse.type).toBe('scrum');
      expect(officialBoardResponse.location.type).toBe('project');
      expect(officialBoardResponse.location.projectKey).toBe('PROJ');
    });

    it('should match official sprint response structure', () => {
      // Based on GET /rest/agile/1.0/sprint/{sprintId}
      const officialSprintResponse: JiraSprint = {
        id: '37',
        self: 'http://www.example.com/jira/rest/agile/1.0/sprint/23',
        state: 'closed',
        name: 'sprint 1',
        startDate: '2015-04-11T15:22:00.000+10:00',
        endDate: '2015-04-20T01:22:00.000+10:00',
        completeDate: '2015-04-20T11:04:00.000+10:00',
        originBoardId: 5,
        goal: 'sprint 1 goal',
      };

      expect(officialSprintResponse.state).toBe('closed');
      expect(officialSprintResponse.originBoardId).toBe(5);
      expect(officialSprintResponse.goal).toBe('sprint 1 goal');
    });
  });

  describe('Field Definitions (/rest/api/2/field)', () => {
    it('should match official field response structure', () => {
      // Based on GET /rest/api/2/field
      const officialFieldResponse: JiraField = {
        id: 'summary',
        key: 'summary',
        name: 'Summary',
        custom: false,
        orderable: true,
        navigable: true,
        searchable: true,
        clauseNames: ['summary'],
        self: 'http://www.example.com/jira/rest/api/2/field/summary',
        schema: {
          type: 'string',
          system: 'summary',
        },
      };

      const customFieldResponse: JiraField = {
        id: 'customfield_10008',
        key: 'customfield_10008',
        name: 'Epic Link',
        custom: true,
        orderable: true,
        navigable: true,
        searchable: true,
        clauseNames: ['cf[10008]', 'Epic Link'],
        self: 'http://www.example.com/jira/rest/api/2/field/customfield_10008',
        schema: {
          type: 'any',
          custom: 'com.pyxis.greenhopper.jira:gh-epic-link',
          customId: 10008,
        },
        description: 'Epic to which the issue belongs',
        isLocked: false,
        screensCount: 5,
        contextsCount: 2,
        lastUsed: {
          type: 'TRACKED',
          project: {
            id: '10000',
            key: 'PROJ',
            name: 'Project Name',
          },
        },
      };

      expect(officialFieldResponse.custom).toBe(false);
      expect(officialFieldResponse.schema.system).toBe('summary');
      expect(customFieldResponse.custom).toBe(true);
      expect(customFieldResponse.schema.customId).toBe(10008);
      expect(customFieldResponse.clauseNames).toContain('Epic Link');
    });
  });

  describe('Custom Field Values', () => {
    it('should support all custom field value types', () => {
      // Text fields
      const textValue: JiraCustomFieldValue = 'Simple text value';

      // Number fields
      const numberValue: JiraCustomFieldValue = 42;

      // Boolean fields
      const booleanValue: JiraCustomFieldValue = true;

      // Null values
      const nullValue: JiraCustomFieldValue = null;

      // Single select (option)
      const singleSelectValue: JiraCustomFieldValue = {
        value: 'High',
        id: '10000',
      };

      // Multi-select (options)
      const multiSelectValue: JiraCustomFieldValue = [
        { value: 'Frontend', id: '10001' },
        { value: 'Backend', id: '10002' },
      ];

      // User picker
      const userValue: JiraCustomFieldValue = {
        self: 'http://www.example.com/jira/rest/api/2/user?username=fred',
        name: 'fred',
        key: 'fred',
        displayName: 'Fred F. User',
        emailAddress: 'fred@example.com',
        avatarUrls: {
          '48x48':
            'http://www.example.com/jira/secure/useravatar?size=large&ownerId=fred',
          '24x24':
            'http://www.example.com/jira/secure/useravatar?size=small&ownerId=fred',
          '16x16':
            'http://www.example.com/jira/secure/useravatar?size=xsmall&ownerId=fred',
          '32x32':
            'http://www.example.com/jira/secure/useravatar?size=medium&ownerId=fred',
        },
        active: true,
        id: '10000',
      };

      // Multi-user picker
      const multiUserValue: JiraCustomFieldValue = [userValue];

      // Version picker
      const versionValue: JiraCustomFieldValue = {
        self: 'http://www.example.com/jira/rest/api/2/version/10000',
        id: '10000',
        name: '1.0',
        description: 'First major release',
        archived: false,
        released: false,
        startDate: '2023-01-01',
        releaseDate: '2023-06-01',
        overdue: false,
        userStartDate: '01/Jan/23',
        userReleaseDate: '01/Jun/23',
        project: 'EX',
        projectId: 10000,
        moveUnfixedIssuesTo:
          'http://www.example.com/jira/rest/api/2/version/10001',
        operations: [],
        remotelinks: [],
      };

      // Complex object
      const complexValue: JiraCustomFieldValue = {
        customProperty: 'value',
        nestedObject: {
          property: 'nested value',
        },
        arrayProperty: ['item1', 'item2'],
      };

      expect(typeof textValue).toBe('string');
      expect(typeof numberValue).toBe('number');
      expect(typeof booleanValue).toBe('boolean');
      expect(nullValue).toBeNull();
      expect((singleSelectValue as any).value).toBe('High');
      expect(Array.isArray(multiSelectValue)).toBe(true);
      expect((userValue as any).name).toBe('fred');
      expect(Array.isArray(multiUserValue)).toBe(true);
      expect((versionValue as any).name).toBe('1.0');
      expect(typeof complexValue).toBe('object');
    });
  });

  describe('Transitions (/rest/api/2/issue/{issueIdOrKey}/transitions)', () => {
    it('should match official transitions response structure', () => {
      const officialTransitionResponse: JiraTransition = {
        id: '2',
        name: 'Close Issue',
        to: {
          self: 'http://www.example.com/jira/rest/api/2/status/6',
          description:
            'The issue is considered finished, the resolution is correct. Issues which are closed can be reopened.',
          iconUrl:
            'http://www.example.com/jira/images/icons/statuses/closed.png',
          name: 'Closed',
          id: '6',
          statusCategory: {
            self: 'http://www.example.com/jira/rest/api/2/statuscategory/3',
            id: 3,
            key: 'done',
            colorName: 'green',
            name: 'Done',
          },
        },
        hasScreen: true,
        isGlobal: false,
        isInitial: false,
        isAvailable: true,
        isConditional: false,
        fields: {
          resolution: {
            required: true,
            schema: {
              type: 'resolution',
              system: 'resolution',
            },
            name: 'Resolution',
            hasDefaultValue: false,
            operations: ['set'],
            allowedValues: [
              {
                self: 'http://www.example.com/jira/rest/api/2/resolution/1',
                id: '1',
                description:
                  'A fix for this issue is checked into the tree and tested.',
                name: 'Fixed',
              },
            ],
          },
        },
        expand: 'fields',
        looped: false,
      };

      expect(officialTransitionResponse.name).toBe('Close Issue');
      expect(officialTransitionResponse.to.statusCategory.key).toBe('done');
      expect(officialTransitionResponse.hasScreen).toBe(true);
      expect(officialTransitionResponse.fields?.resolution?.required).toBe(
        true
      );
    });
  });
});
