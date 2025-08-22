/**
 * Jira Server API Advanced Type Tests
 * 
 * Tests for advanced use cases, edge cases, and Server/DC specific features
 * that are critical for real-world usage.
 */

import {
  type JiraIssue,
  type JiraIssueFields,
  type JiraUser,
  type JiraProject,
  type JiraSearchResponse,
  type JiraCustomFieldValue,
  type JiraChangelog,
  type JiraChangelogHistory,
  type JiraChangelogItem,
  type JiraEditMeta,
  type JiraFieldMeta,
  type JiraFieldSchema,
  type AttachmentDownloadResult,
  type JiraBoardConfiguration,
  type JiraWorklog,
  type SearchResult,
} from '@/types/index';

describe('Jira Server API Advanced Type Tests', () => {
  
  describe('Server/DC Specific Features', () => {
    it('should handle Server/DC user identification correctly', () => {
      // Server/DC uses 'name' and 'key' instead of 'accountId'
      const serverUser: JiraUser = {
        self: "http://example.com/jira/rest/api/2/user?username=john.doe",
        id: "10001",
        name: "john.doe", // Server/DC specific
        key: "john.doe", // Server/DC specific
        displayName: "John Doe",
        emailAddress: "john.doe@company.com",
        active: true,
        avatarUrls: {
          "16x16": "http://example.com/avatar16.png",
          "24x24": "http://example.com/avatar24.png",
          "32x32": "http://example.com/avatar32.png",
          "48x48": "http://example.com/avatar48.png"
        },
        timeZone: "America/New_York",
        locale: "en_US"
      };

      expect(serverUser.name).toBe("john.doe");
      expect(serverUser.key).toBe("john.doe");
      expect(serverUser.emailAddress).toBe("john.doe@company.com");
      
      // Verify Server/DC doesn't have accountId (Cloud feature)
      expect((serverUser as any).accountId).toBeUndefined();
    });

    it('should support common Server/DC custom field patterns', () => {
      const issueWithServerFields: Partial<JiraIssueFields> = {
        summary: "Server/DC Issue",
        
        // Epic Link (common in Server/DC)
        customfield_10008: "EPIC-123",
        
        // Story Points (common in Server/DC)  
        customfield_10009: 8,
        
        // Sprint field (Server/DC Agile)
        customfield_10010: [
          {
            id: 1,
            name: "Sprint 1",
            state: "ACTIVE",
            boardId: 1,
            goal: "Complete user authentication"
          }
        ],
        
        // Team field (custom select)
        customfield_10011: {
          value: "Backend Team",
          id: "10001"
        },
        
        // Labels array
        customfield_10012: ["bug", "urgent", "backend"],
        
        // Components array
        customfield_10013: [
          { name: "Authentication", id: "10001" },
          { name: "Database", id: "10002" }
        ],
        
        // Date field
        customfield_10014: "2023-12-31",
        
        // DateTime field
        customfield_10015: "2023-12-31T23:59:59.000+0000",
        
        // User picker
        customfield_10016: {
          name: "tech.lead",
          key: "tech.lead", 
          displayName: "Tech Lead",
          emailAddress: "tech.lead@company.com"
        },
        
        // Multi-user picker
        customfield_10017: [
          {
            name: "developer1",
            key: "developer1",
            displayName: "Developer One"
          },
          {
            name: "developer2", 
            key: "developer2",
            displayName: "Developer Two"
          }
        ],
        
        // Complex nested object (plugin fields)
        customfield_10018: {
          value: {
            id: "10001",
            name: "Complex Object",
            metadata: {
              created: "2023-01-01T00:00:00.000Z",
              properties: {
                color: "blue",
                priority: "high"
              }
            }
          }
        }
      };

      expect(issueWithServerFields.customfield_10008).toBe("EPIC-123");
      expect(issueWithServerFields.customfield_10009).toBe(8);
      expect(Array.isArray(issueWithServerFields.customfield_10010)).toBe(true);
      expect((issueWithServerFields.customfield_10011 as any).value).toBe("Backend Team");
      expect(Array.isArray(issueWithServerFields.customfield_10012)).toBe(true);
      expect((issueWithServerFields.customfield_10016 as any).name).toBe("tech.lead");
      expect(Array.isArray(issueWithServerFields.customfield_10017)).toBe(true);
    });

    it('should handle Server/DC SSL and authentication specifics', () => {
      // Server/DC often uses self-signed certificates
      const serverIssue: Partial<JiraIssue> = {
        self: "https://jira-server.company.internal:8443/rest/api/2/issue/PROJ-123",
        key: "PROJ-123",
        id: "10001",
        fields: {
          summary: "Internal Server Issue",
          project: {
            self: "https://jira-server.company.internal:8443/rest/api/2/project/PROJ",
            id: "10000",
            key: "PROJ",
            name: "Internal Project",
            components: [],
            issueTypes: [],
            versions: [],
            roles: {},
            avatarUrls: {
              "16x16": "https://jira-server.company.internal:8443/secure/projectavatar?size=xsmall&pid=10000",
              "24x24": "https://jira-server.company.internal:8443/secure/projectavatar?size=small&pid=10000", 
              "32x32": "https://jira-server.company.internal:8443/secure/projectavatar?size=medium&pid=10000",
              "48x48": "https://jira-server.company.internal:8443/secure/projectavatar?size=large&pid=10000"
            }
          },
          issuetype: {
            self: "https://jira-server.company.internal:8443/rest/api/2/issuetype/1",
            id: "1",
            name: "Task",
            description: "A task",
            iconUrl: "https://jira-server.company.internal:8443/images/icons/issuetypes/task.png",
            subtask: false
          },
          status: {
            self: "https://jira-server.company.internal:8443/rest/api/2/status/1",
            id: "1",
            name: "Open",
            description: "Issue is open",
            iconUrl: "https://jira-server.company.internal:8443/images/icons/statuses/open.png",
            statusCategory: {
              self: "https://jira-server.company.internal:8443/rest/api/2/statuscategory/2",
              id: 2,
              key: "new",
              colorName: "blue-gray",
              name: "To Do"
            }
          },
          created: "2023-01-15T10:30:00.000+0000",
          updated: "2023-01-15T14:30:00.000+0000"
        }
      };

      expect(serverIssue.self).toContain("jira-server.company.internal:8443");
      expect(serverIssue.fields?.project.self).toContain("https://");
      expect(serverIssue.key).toBe("PROJ-123");
    });
  });

  describe('Changelog and History', () => {
    it('should handle complete changelog structure', () => {
      const fullChangelog: JiraChangelog = {
        startAt: 0,
        maxResults: 50,
        total: 2,
        histories: [
          {
            id: "10001",
            author: {
              self: "http://example.com/jira/rest/api/2/user?username=admin",
              name: "admin",
              key: "admin",
              displayName: "Administrator",
              emailAddress: "admin@company.com",
              active: true,
              avatarUrls: {
                "16x16": "http://example.com/avatar16.png",
                "24x24": "http://example.com/avatar24.png",
                "32x32": "http://example.com/avatar32.png",
                "48x48": "http://example.com/avatar48.png"
              },
              id: "10000"
            },
            created: "2023-01-15T10:30:00.000+0000",
            items: [
              {
                field: "status",
                fieldtype: "jira",
                fieldId: "status",
                from: "1",
                fromString: "Open",
                to: "3", 
                toString: "In Progress"
              },
              {
                field: "assignee",
                fieldtype: "jira",
                fieldId: "assignee",
                from: "admin",
                fromString: "Administrator",
                to: "john.doe",
                toString: "John Doe"
              }
            ]
          },
          {
            id: "10002",
            author: {
              self: "http://example.com/jira/rest/api/2/user?username=john.doe",
              name: "john.doe",
              key: "john.doe",
              displayName: "John Doe",
              emailAddress: "john.doe@company.com",
              active: true,
              avatarUrls: {
                "16x16": "http://example.com/avatar16.png",
                "24x24": "http://example.com/avatar24.png",
                "32x32": "http://example.com/avatar32.png",
                "48x48": "http://example.com/avatar48.png"
              },
              id: "10001"
            },
            created: "2023-01-15T14:30:00.000+0000",
            items: [
              {
                field: "resolution",
                fieldtype: "jira",
                fieldId: "resolution",
                from: null,
                fromString: null,
                to: "1",
                toString: "Fixed"
              },
              {
                field: "status",
                fieldtype: "jira", 
                fieldId: "status",
                from: "3",
                fromString: "In Progress",
                to: "6",
                toString: "Closed"
              }
            ]
          }
        ]
      };

      expect(fullChangelog.total).toBe(2);
      expect(fullChangelog.histories.length).toBe(2);
      expect(fullChangelog.histories[0]?.items.length).toBe(2);
      expect(fullChangelog.histories[0]?.items[0]?.field).toBe("status");
      expect(fullChangelog.histories[1]?.items[1]?.toString).toBe("Closed");
    });
  });

  describe('Edit Metadata and Field Schemas', () => {
    it('should handle complex edit metadata structure', () => {
      const editMeta: JiraEditMeta = {
        fields: {
          "summary": {
            required: true,
            schema: {
              type: "string",
              system: "summary"
            },
            name: "Summary",
            hasDefaultValue: false,
            operations: ["set"],
            autoCompleteUrl: undefined,
            defaultValue: undefined
          },
          "assignee": {
            required: false,
            schema: {
              type: "user",
              system: "assignee"
            },
            name: "Assignee",
            hasDefaultValue: false,
            operations: ["set"],
            autoCompleteUrl: "http://example.com/jira/rest/api/2/user/assignable/search?project=PROJ",
            allowedValues: undefined
          },
          "customfield_10008": {
            required: false,
            schema: {
              type: "any",
              custom: "com.pyxis.greenhopper.jira:gh-epic-link",
              customId: 10008
            },
            name: "Epic Link",
            hasDefaultValue: false,
            operations: ["set"],
            autoCompleteUrl: "http://example.com/jira/rest/api/2/epic/none/issue/picker"
          },
          "priority": {
            required: false,
            schema: {
              type: "priority",
              system: "priority"
            },
            name: "Priority",
            hasDefaultValue: true,
            operations: ["set"],
            allowedValues: [
              {
                self: "http://example.com/jira/rest/api/2/priority/1",
                iconUrl: "http://example.com/jira/images/icons/priorities/blocker.png",
                name: "Blocker",
                id: "1"
              },
              {
                self: "http://example.com/jira/rest/api/2/priority/2", 
                iconUrl: "http://example.com/jira/images/icons/priorities/critical.png",
                name: "Critical",
                id: "2"
              }
            ],
            defaultValue: {
              self: "http://example.com/jira/rest/api/2/priority/3",
              iconUrl: "http://example.com/jira/images/icons/priorities/major.png",
              name: "Major",
              id: "3"
            }
          }
        }
      };

      expect(editMeta.fields.summary?.required).toBe(true);
      expect(editMeta.fields.assignee?.autoCompleteUrl).toContain("assignable/search");
      expect(editMeta.fields.customfield_10008?.schema.customId).toBe(10008);
      expect(editMeta.fields.priority?.allowedValues?.length).toBe(2);
      expect(editMeta.fields.priority?.defaultValue?.name).toBe("Major");
    });
  });

  describe('Complex Search Scenarios', () => {
    it('should handle search with all expansions and fields', () => {
      const complexSearchResult: JiraSearchResponse = {
        expand: "names,schema,operations,editmeta,changelog,versionedRepresentations,renderedFields",
        startAt: 0,
        maxResults: 2,
        total: 150,
        issues: [
          {
            expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
            id: "10001",
            self: "http://example.com/jira/rest/api/2/issue/10001",
            key: "PROJ-1",
            fields: {
              summary: "Complex Issue with All Fields",
              description: "This issue demonstrates all possible field types",
              issuetype: {
                self: "http://example.com/jira/rest/api/2/issuetype/10001",
                id: "10001",
                description: "A user story",
                iconUrl: "http://example.com/jira/images/icons/issuetypes/story.png",
                name: "Story",
                subtask: false,
                avatarId: 10315,
                hierarchyLevel: 0
              },
              project: {
                self: "http://example.com/jira/rest/api/2/project/PROJ",
                id: "10000",
                key: "PROJ",
                name: "Sample Project",
                avatarUrls: {
                  "16x16": "http://example.com/jira/secure/projectavatar?size=xsmall&pid=10000",
                  "24x24": "http://example.com/jira/secure/projectavatar?size=small&pid=10000",
                  "32x32": "http://example.com/jira/secure/projectavatar?size=medium&pid=10000",
                  "48x48": "http://example.com/jira/secure/projectavatar?size=large&pid=10000"
                },
                projectCategory: {
                  self: "http://example.com/jira/rest/api/2/projectCategory/10000",
                  id: "10000",
                  name: "Development",
                  description: "Development projects"
                },
                components: [],
                issueTypes: [],
                versions: [],
                roles: {}
              },
              status: {
                self: "http://example.com/jira/rest/api/2/status/10001",
                description: "This issue is in the backlog",
                iconUrl: "http://example.com/jira/images/icons/statuses/generic.png",
                name: "Backlog",
                id: "10001",
                statusCategory: {
                  self: "http://example.com/jira/rest/api/2/statuscategory/2",
                  id: 2,
                  key: "new",
                  colorName: "blue-gray",
                  name: "To Do"
                }
              },
              created: "2023-01-01T09:00:00.000+0000",
              updated: "2023-01-15T16:30:00.000+0000",
              
              // All time tracking fields
              timeoriginalestimate: 28800,
              timeestimate: 14400,
              timespent: 7200,
              aggregatetimeoriginalestimate: 50400,
              aggregatetimeestimate: 25200,
              aggregatetimespent: 18000,
              
              // Security level
              security: {
                self: "http://example.com/jira/rest/api/2/securitylevel/10000",
                id: "10000",
                name: "Internal",
                description: "Internal security level"
              },
              
              // Parent issue (for subtasks)
              parent: {
                id: "10000",
                key: "PROJ-0",
                fields: {
                  summary: "Parent Epic",
                  status: {
                    self: "http://example.com/jira/rest/api/2/status/3",
                    description: "This issue is being actively worked on",
                    iconUrl: "http://example.com/jira/images/icons/statuses/inprogress.png",
                    name: "In Progress",
                    id: "3",
                    statusCategory: {
                      self: "http://example.com/jira/rest/api/2/statuscategory/4",
                      id: 4,
                      key: "indeterminate",
                      colorName: "yellow",
                      name: "In Progress"
                    }
                  },
                  priority: {
                    self: "http://example.com/jira/rest/api/2/priority/2",
                    iconUrl: "http://example.com/jira/images/icons/priorities/high.svg",
                    name: "High",
                    id: "2",
                    statusColor: "#ff5722",
                    description: "High priority"
                  },
                  issuetype: {
                    self: "http://example.com/jira/rest/api/2/issuetype/10000",
                    id: "10000",
                    description: "A large user story that can be broken down",
                    iconUrl: "http://example.com/jira/images/icons/issuetypes/epic.png",
                    name: "Epic",
                    subtask: false
                  }
                }
              }
            },
            
            // Additional expansion fields
            renderedFields: {
              description: "<p>This issue demonstrates all possible field types</p>",
              comment: "<p>Rendered comment content</p>"
            },
            
            properties: {
              "custom.property": "custom value"
            },
            
            names: {
              "summary": "Summary",
              "description": "Description"
            },
            
            schema: {
              "summary": {
                type: "string",
                system: "summary"
              },
              "description": {
                type: "string",
                system: "description"
              }
            },
            
            operations: {
              linkIssue: {
                id: "link-issue",
                styleClass: "issue-link",
                iconClass: "aui-icon-link",
                label: "Link",
                title: "Link this issue",
                href: "/secure/LinkJiraIssue.jspa?id=10001",
                weight: 10
              }
            },
            
            editmeta: {
              fields: {
                summary: {
                  required: true,
                  schema: {
                    type: "string",
                    system: "summary"
                },
                  name: "Summary",
                  hasDefaultValue: false,
                  operations: ["set"]
                }
              }
            }
          }
        ],
        warningMessages: ["JQL query execution took longer than expected"],
        names: {
          "summary": "Summary",
          "issuetype": "Issue Type",
          "status": "Status",
          "description": "Description",
          "project": "Project",
          "created": "Created",
          "updated": "Updated"
        },
        schema: {
          "summary": {
            type: "string",
            system: "summary"
          },
          "issuetype": {
            type: "issuetype",
            system: "issuetype"
          },
          "status": {
            type: "status",
            system: "status"
          },
          "customfield_10008": {
            type: "any",
            custom: "com.pyxis.greenhopper.jira:gh-epic-link",
            customId: 10008
          }
        }
      };

      expect(complexSearchResult.total).toBe(150);
      expect(complexSearchResult.issues.length).toBe(1);
      expect(complexSearchResult.issues[0]?.fields.parent?.key).toBe("PROJ-0");
      expect(complexSearchResult.issues[0]?.renderedFields?.description).toContain("<p>");
      expect(complexSearchResult.issues[0]?.operations?.linkIssue?.label).toBe("Link");
      expect(complexSearchResult.warningMessages?.[0]).toContain("execution took longer");
      expect(complexSearchResult.schema?.customfield_10008?.customId).toBe(10008);
    });
  });

  describe('Worklog Advanced Features', () => {
    it('should handle worklog with visibility and properties', () => {
      const advancedWorklog: JiraWorklog = {
        self: "http://example.com/jira/rest/api/2/issue/10000/worklog/10000",
        author: {
          self: "http://example.com/jira/rest/api/2/user?username=developer",
          name: "developer",
          key: "developer",
          displayName: "Lead Developer",
          emailAddress: "developer@company.com",
          active: true,
          avatarUrls: {
            "16x16": "http://example.com/avatar16.png",
            "24x24": "http://example.com/avatar24.png",
            "32x32": "http://example.com/avatar32.png",
            "48x48": "http://example.com/avatar48.png"
          },
          id: "10001"
        },
        updateAuthor: {
          self: "http://example.com/jira/rest/api/2/user?username=manager",
          name: "manager",
          key: "manager",
          displayName: "Project Manager",
          emailAddress: "manager@company.com",
          active: true,
          avatarUrls: {
            "16x16": "http://example.com/avatar16.png",
            "24x24": "http://example.com/avatar24.png",
            "32x32": "http://example.com/avatar32.png",
            "48x48": "http://example.com/avatar48.png"
          },
          id: "10002"
        },
        comment: "Implemented authentication middleware with OAuth2 support",
        created: "2023-01-15T09:00:00.000+0000",
        updated: "2023-01-15T09:05:00.000+0000",
        started: "2023-01-15T08:30:00.000+0000",
        timeSpent: "4h 30m",
        timeSpentSeconds: 16200,
        id: "10000",
        issueId: "10000",
        visibility: {
          type: "group",
          value: "developers",
          identifier: "developers"
        },
        properties: [
          {
            key: "work.category",
            value: "development"
          },
          {
            key: "billing.code",
            value: "AUTH-001"
          },
          {
            key: "complexity",
            value: {
              level: "high",
              factors: ["security", "integration", "testing"]
            }
          }
        ]
      };

      expect(advancedWorklog.timeSpentSeconds).toBe(16200);
      expect(advancedWorklog.visibility?.type).toBe("group");
      expect(advancedWorklog.visibility?.value).toBe("developers");
      expect(advancedWorklog.properties?.length).toBe(3);
      expect(advancedWorklog.properties?.[0]?.key).toBe("work.category");
      expect(advancedWorklog.properties?.[2]?.value).toEqual({
        level: "high",
        factors: ["security", "integration", "testing"]
      });
    });
  });

  describe('Attachment Download Results', () => {
    it('should handle attachment download results correctly', () => {
      const downloadResult: AttachmentDownloadResult = {
        issueKey: "PROJ-123",
        attachments: [
          {
            id: "10001",
            filename: "requirements.pdf",
            size: 2048576,
            downloadPath: "/tmp/downloads/requirements.pdf",
            success: true
          },
          {
            id: "10002", 
            filename: "screenshot.png",
            size: 1024000,
            downloadPath: "/tmp/downloads/screenshot.png",
            success: true
          },
          {
            id: "10003",
            filename: "large-file.zip",
            size: 0,
            downloadPath: "",
            success: false,
            error: "File size exceeds maximum allowed limit"
          }
        ],
        totalSize: 3072576,
        downloadPath: "/tmp/downloads/PROJ-123",
        success: true,
        errors: ["File size exceeds maximum allowed limit"]
      };

      expect(downloadResult.issueKey).toBe("PROJ-123");
      expect(downloadResult.attachments.length).toBe(3);
      expect(downloadResult.attachments[0]?.success).toBe(true);
      expect(downloadResult.attachments[2]?.success).toBe(false);
      expect(downloadResult.attachments[2]?.error).toContain("exceeds maximum");
      expect(downloadResult.totalSize).toBe(3072576);
      expect(downloadResult.errors?.length).toBe(1);
    });
  });

  describe('Board Configuration Advanced', () => {
    it('should handle complex board configuration', () => {
      const boardConfig: JiraBoardConfiguration = {
        id: 1,
        name: "Scrum Board Configuration",
        type: "scrum",
        self: "http://example.com/jira/rest/agile/1.0/board/1/configuration",
        location: {
          type: "project",
          projectId: 10000,
          displayName: "Sample Project",
          projectName: "Sample Project",
          projectKey: "PROJ",
          projectTypeKey: "software",
          avatarURI: "http://example.com/jira/secure/projectavatar?size=medium&pid=10000",
          name: "Sample Project"
        },
        filter: {
          id: "10000",
          self: "http://example.com/jira/rest/api/2/filter/10000"
        },
        subQuery: {
          query: "fixVersion in unreleasedVersions() OR fixVersion is EMPTY"
        },
        columnConfig: {
          columns: [
            {
              name: "To Do",
              statuses: [
                {
                  id: "1",
                  self: "http://example.com/jira/rest/api/2/status/1"
                },
                {
                  id: "10000",
                  self: "http://example.com/jira/rest/api/2/status/10000"
                }
              ]
            },
            {
              name: "In Progress",
              statuses: [
                {
                  id: "3",
                  self: "http://example.com/jira/rest/api/2/status/3"
                }
              ],
              min: 1,
              max: 5
            },
            {
              name: "Done",
              statuses: [
                {
                  id: "6",
                  self: "http://example.com/jira/rest/api/2/status/6"
                }
              ]
            }
          ],
          constraintType: "issueCount"
        },
        estimation: {
          type: "field",
          field: {
            fieldId: "customfield_10009",
            displayName: "Story Points"
          }
        },
        ranking: {
          rankCustomFieldId: 10020
        }
      };

      expect(boardConfig.type).toBe("scrum");
      expect(boardConfig.columnConfig.columns.length).toBe(3);
      expect(boardConfig.columnConfig.columns[1]?.min).toBe(1);
      expect(boardConfig.columnConfig.columns[1]?.max).toBe(5);
      expect(boardConfig.estimation?.field?.fieldId).toBe("customfield_10009");
      expect(boardConfig.ranking?.rankCustomFieldId).toBe(10020);
      expect(boardConfig.subQuery?.query).toContain("unreleasedVersions");
    });
  });

  describe('Type Guards and Runtime Validation', () => {
    it('should validate issue structure at runtime', () => {
      const validateIssue = (data: any): data is JiraIssue => {
        return (
          typeof data === 'object' &&
          data !== null &&
          typeof data.id === 'string' &&
          typeof data.key === 'string' &&
          typeof data.self === 'string' &&
          typeof data.fields === 'object' &&
          data.fields !== null &&
          typeof data.fields.summary === 'string'
        );
      };

      const validIssue = {
        id: "10001",
        key: "PROJ-1",
        self: "http://example.com/jira/rest/api/2/issue/10001",
        fields: {
          summary: "Valid issue",
          issuetype: { id: "1", name: "Task", subtask: false },
          project: { id: "10000", key: "PROJ", name: "Project" },
          status: { id: "1", name: "Open" },
          created: "2023-01-01T00:00:00.000Z",
          updated: "2023-01-01T00:00:00.000Z"
        }
      };

      const invalidIssue = {
        id: 10001, // Should be string
        key: "PROJ-1",
        fields: {
          // Missing summary
        }
      };

      expect(validateIssue(validIssue)).toBe(true);
      expect(validateIssue(invalidIssue)).toBe(false);
      expect(validateIssue(null)).toBe(false);
      expect(validateIssue(undefined)).toBe(false);
    });
  });
});