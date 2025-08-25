/**
 * Unit tests for Issue Tools Module
 * 
 * Tests the extracted Issue tool definitions to ensure they match
 * the original specifications and maintain MCP compliance.
 */

import {
  getIssueToolDefinition,
  getIssueTransitionsToolDefinition,
  searchIssuesToolDefinition,
  getIssueWorklogsToolDefinition,
  downloadAttachmentsToolDefinition,
  getIssueTools
} from '../../../src/server/tools/issue-tools.js';

describe('Issue Tools Module', () => {
  describe('Individual Tool Definitions', () => {
    it('should define getIssue tool correctly', () => {
      const tool = getIssueToolDefinition();
      
      expect(tool.name).toBe('getIssue');
      expect(tool.description).toBe('Get a Jira issue by key or ID');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['issueKey']);
      expect((tool.inputSchema.properties as any).issueKey.type).toBe('string');
      expect((tool.inputSchema.properties as any).fields.type).toBe('array');
    });

    it('should define getIssueTransitions tool correctly', () => {
      const tool = getIssueTransitionsToolDefinition();
      
      expect(tool.name).toBe('getIssueTransitions');
      expect(tool.description).toBe('Get available status transitions for a Jira issue');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['issueKey']);
      expect((tool.inputSchema.properties as any).issueKey.type).toBe('string');
    });

    it('should define searchIssues tool correctly', () => {
      const tool = searchIssuesToolDefinition();
      
      expect(tool.name).toBe('searchIssues');
      expect(tool.description).toBe('Search for Jira issues using JQL (Jira Query Language)');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['jql']);
      expect((tool.inputSchema.properties as any).jql.type).toBe('string');
      expect((tool.inputSchema.properties as any).startAt.type).toBe('number');
      expect((tool.inputSchema.properties as any).maxResults.type).toBe('number');
      expect((tool.inputSchema.properties as any).fields.type).toBe('array');
    });

    it('should define getIssueWorklogs tool correctly', () => {
      const tool = getIssueWorklogsToolDefinition();
      
      expect(tool.name).toBe('getIssueWorklogs');
      expect(tool.description).toBe('Get work log entries for a Jira issue, including time tracking and work history');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['issueKey']);
      expect((tool.inputSchema.properties as any).issueKey.type).toBe('string');
    });

    it('should define downloadAttachments tool correctly', () => {
      const tool = downloadAttachmentsToolDefinition();
      
      expect(tool.name).toBe('downloadAttachments');
      expect(tool.description).toContain('Download attachment metadata for a Jira issue');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['issueKey']);
      expect((tool.inputSchema.properties as any).issueKey.type).toBe('string');
    });
  });

  describe('getIssueTools() function', () => {
    it('should return all 5 Issue tools', () => {
      const tools = getIssueTools();
      
      expect(tools).toHaveLength(5);
      expect(tools.map(tool => tool.name)).toEqual([
        'getIssue',
        'getIssueTransitions', 
        'searchIssues',
        'getIssueWorklogs',
        'downloadAttachments'
      ]);
    });

    it('should return tools with valid MCP schema structure', () => {
      const tools = getIssueTools();
      
      tools.forEach(tool => {
        // Validate basic MCP tool structure
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        
        // Validate inputSchema structure
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
        
        // Validate that required fields exist in properties
        if (tool.inputSchema.required) {
          tool.inputSchema.required.forEach((requiredField: string) => {
            expect(tool.inputSchema.properties as any).toHaveProperty(requiredField);
          });
        }
      });
    });

    it('should return tools that match the specific Issue operations', () => {
      const tools = getIssueTools();
      
      // Verify each tool addresses Issue-specific operations
      const getIssueTool = tools.find(t => t.name === 'getIssue');
      expect(getIssueTool?.description).toContain('issue by key or ID');
      
      const transitionsTool = tools.find(t => t.name === 'getIssueTransitions');
      expect(transitionsTool?.description).toContain('transitions');
      
      const searchTool = tools.find(t => t.name === 'searchIssues');
      expect(searchTool?.description).toContain('JQL');
      
      const worklogsTool = tools.find(t => t.name === 'getIssueWorklogs');
      expect(worklogsTool?.description).toContain('work log');
      
      const attachmentsTool = tools.find(t => t.name === 'downloadAttachments');
      expect(attachmentsTool?.description).toContain('attachment');
    });
  });

  describe('Schema Validation', () => {
    it('should have consistent issueKey parameter across relevant tools', () => {
      const toolsWithIssueKey = [
        getIssueToolDefinition(),
        getIssueTransitionsToolDefinition(),
        getIssueWorklogsToolDefinition(),
        downloadAttachmentsToolDefinition()
      ];
      
      toolsWithIssueKey.forEach(tool => {
        const issueKeyProp = (tool.inputSchema.properties as any).issueKey;
        expect(issueKeyProp.type).toBe('string');
        expect(issueKeyProp.description).toContain('issue key or ID');
        expect(issueKeyProp.description).toContain('PROJ-123');
      });
    });

    it('should have consistent pagination parameters in searchIssues', () => {
      const tool = searchIssuesToolDefinition();
      
      expect((tool.inputSchema.properties as any).startAt.description).toContain('pagination');
      expect((tool.inputSchema.properties as any).startAt.description).toContain('default: 0');
      
      expect((tool.inputSchema.properties as any).maxResults.description).toContain('Maximum number');
      expect((tool.inputSchema.properties as any).maxResults.description).toContain('default: 50');
    });

    it('should have consistent fields parameter structure', () => {
      const toolsWithFields = [
        getIssueToolDefinition(),
        searchIssuesToolDefinition()
      ];
      
      toolsWithFields.forEach(tool => {
        const fieldsProp = (tool.inputSchema.properties as any).fields;
        expect(fieldsProp.type).toBe('array');
        expect(fieldsProp.items.type).toBe('string');
        expect(fieldsProp.description).toContain('field names');
      });
    });
  });
});