/**
 * Unit Tests for Fields Parameter Support in Tool Definitions
 * 
 * Tests the addition of fields parameter to tool definitions that previously lacked it.
 * This covers Task-0.3: Tool Definition Updates (Phase 1) from the implementation plan.
 * 
 * Tests ensure:
 * - Fields parameter is properly defined in tool schemas
 * - Descriptions reference correct resource URIs
 * - Examples are entity-appropriate
 * - Backward compatibility is maintained
 */

import { describe, test, expect } from '@jest/globals';
import { 
  getAllProjectsToolDefinition,
  getProjectToolDefinition,
  getProjectVersionsToolDefinition
} from '@/server/tools/project-tools';
import {
  getCurrentUserToolDefinition,
  getUserProfileToolDefinition
} from '@/server/tools/user-tools';
import {
  getAgileBoardsToolDefinition,
  getSprintsFromBoardToolDefinition,
  getSprintToolDefinition
} from '@/server/tools/agile-tools';

describe('Fields Parameter Support - Tool Definition Updates', () => {
  
  describe('Project Tools', () => {
    
    test('getAllProjects should have fields parameter with correct schema and description', () => {
      const toolDef = getAllProjectsToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://project/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('Project fields');
      expect(fieldsProperty.description).toContain('name');
      expect(fieldsProperty.description).toContain('key');
      expect(fieldsProperty.description).toContain('lead.displayName');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
    test('getProject should have fields parameter with correct schema and description', () => {
      const toolDef = getProjectToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://project/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('Project fields');
      expect(fieldsProperty.description).toContain('components[].name');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
    test('getProjectVersions should have fields parameter with correct schema and description', () => {
      const toolDef = getProjectVersionsToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://project/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('Version fields');
      expect(fieldsProperty.description).toContain('released');
      expect(fieldsProperty.description).toContain('releaseDate');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
  });
  
  describe('User Tools', () => {
    
    test('getCurrentUser should have fields parameter with correct schema and description', () => {
      const toolDef = getCurrentUserToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://user/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('User fields');
      expect(fieldsProperty.description).toContain('displayName');
      expect(fieldsProperty.description).toContain('emailAddress');
      expect(fieldsProperty.description).toContain('groups.items[].name');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
    test('getUserProfile should have fields parameter with correct schema and description', () => {
      const toolDef = getUserProfileToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://user/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('User fields');
      expect(fieldsProperty.description).toContain('avatarUrls');
      expect(fieldsProperty.description).toContain('timeZone');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
  });
  
  describe('Agile Tools', () => {
    
    test('getAgileBoards should have fields parameter with correct schema and description', () => {
      const toolDef = getAgileBoardsToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://agile/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('Board fields');
      expect(fieldsProperty.description).toContain('location.projectKey');
      expect(fieldsProperty.description).toContain('location.name');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
    test('getSprintsFromBoard should have fields parameter with correct schema and description', () => {
      const toolDef = getSprintsFromBoardToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://agile/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('Sprint fields');
      expect(fieldsProperty.description).toContain('startDate');
      expect(fieldsProperty.description).toContain('endDate');
      expect(fieldsProperty.description).toContain('completeDate');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
    test('getSprint should have fields parameter with correct schema and description', () => {
      const toolDef = getSprintToolDefinition();
      
      expect(toolDef.inputSchema.properties).toHaveProperty('fields');
      
      const fieldsProperty = toolDef.inputSchema.properties.fields;
      expect(fieldsProperty.type).toBe('array');
      expect(fieldsProperty.items).toEqual({ type: 'string' });
      expect(fieldsProperty.description).toContain('jira://agile/fields');
      expect(fieldsProperty.description).toContain('client-side filtering');
      expect(fieldsProperty.description).toContain('Sprint fields');
      expect(fieldsProperty.description).toContain('originBoardId');
      expect(fieldsProperty.description).toContain('goal');
      
      // Ensure fields parameter is optional
      expect(toolDef.inputSchema.required || []).not.toContain('fields');
    });
    
  });
  
  describe('Backward Compatibility', () => {
    
    test('All tools maintain existing required parameters', () => {
      // Project tools
      const getAllProjects = getAllProjectsToolDefinition();
      expect(getAllProjects.inputSchema.required || []).toEqual([]);
      
      const getProject = getProjectToolDefinition();
      expect(getProject.inputSchema.required).toContain('projectKey');
      
      const getProjectVersions = getProjectVersionsToolDefinition();
      expect(getProjectVersions.inputSchema.required).toContain('projectKey');
      
      // User tools
      const getCurrentUser = getCurrentUserToolDefinition();
      expect(getCurrentUser.inputSchema.required || []).toEqual([]);
      
      const getUserProfile = getUserProfileToolDefinition();
      expect(getUserProfile.inputSchema.required).toContain('username');
      
      // Agile tools
      const getAgileBoards = getAgileBoardsToolDefinition();
      expect(getAgileBoards.inputSchema.required || []).toEqual([]);
      
      const getSprintsFromBoard = getSprintsFromBoardToolDefinition();
      expect(getSprintsFromBoard.inputSchema.required).toContain('boardId');
      
      const getSprint = getSprintToolDefinition();
      expect(getSprint.inputSchema.required).toContain('sprintId');
    });
    
    test('All tools maintain existing optional parameters', () => {
      // getAllProjects should still have includeArchived
      const getAllProjects = getAllProjectsToolDefinition();
      expect(getAllProjects.inputSchema.properties).toHaveProperty('includeArchived');
      
      // getAgileBoards should still have projectKey
      const getAgileBoards = getAgileBoardsToolDefinition();
      expect(getAgileBoards.inputSchema.properties).toHaveProperty('projectKey');
    });
    
  });
  
  describe('Schema Structure Validation', () => {
    
    test('All updated tools have proper JSON schema structure', () => {
      const tools = [
        getAllProjectsToolDefinition(),
        getProjectToolDefinition(),
        getProjectVersionsToolDefinition(),
        getCurrentUserToolDefinition(),
        getUserProfileToolDefinition(),
        getAgileBoardsToolDefinition(),
        getSprintsFromBoardToolDefinition(),
        getSprintToolDefinition()
      ];
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema.properties).toHaveProperty('fields');
        
        const fieldsProperty = tool.inputSchema.properties.fields;
        expect(fieldsProperty).toHaveProperty('type', 'array');
        expect(fieldsProperty).toHaveProperty('items');
        expect(fieldsProperty.items).toEqual({ type: 'string' });
        expect(fieldsProperty).toHaveProperty('description');
        expect(typeof fieldsProperty.description).toBe('string');
        expect(fieldsProperty.description.length).toBeGreaterThan(50);
      });
    });
    
  });
  
  describe('Resource URI References', () => {
    
    test('Project tools reference correct resource URI', () => {
      const projectTools = [
        getAllProjectsToolDefinition(),
        getProjectToolDefinition(),
        getProjectVersionsToolDefinition()
      ];
      
      projectTools.forEach(tool => {
        const fieldsDescription = tool.inputSchema.properties.fields.description;
        expect(fieldsDescription).toContain('jira://project/fields');
      });
    });
    
    test('User tools reference correct resource URI', () => {
      const userTools = [
        getCurrentUserToolDefinition(),
        getUserProfileToolDefinition()
      ];
      
      userTools.forEach(tool => {
        const fieldsDescription = tool.inputSchema.properties.fields.description;
        expect(fieldsDescription).toContain('jira://user/fields');
      });
    });
    
    test('Agile tools reference correct resource URI', () => {
      const agileTools = [
        getAgileBoardsToolDefinition(),
        getSprintsFromBoardToolDefinition(),
        getSprintToolDefinition()
      ];
      
      agileTools.forEach(tool => {
        const fieldsDescription = tool.inputSchema.properties.fields.description;
        expect(fieldsDescription).toContain('jira://agile/fields');
      });
    });
    
  });
  
  describe('Field Description Quality', () => {
    
    test('All field descriptions contain essential elements', () => {
      const tools = [
        getAllProjectsToolDefinition(),
        getProjectToolDefinition(),
        getProjectVersionsToolDefinition(),
        getCurrentUserToolDefinition(),
        getUserProfileToolDefinition(),
        getAgileBoardsToolDefinition(),
        getSprintsFromBoardToolDefinition(),
        getSprintToolDefinition()
      ];
      
      tools.forEach(tool => {
        const fieldsDescription = tool.inputSchema.properties.fields.description;
        
        // Check for required elements
        expect(fieldsDescription).toContain('Complete field reference:');
        expect(fieldsDescription).toContain('Enhanced capabilities:');
        expect(fieldsDescription).toContain('Example field combinations:');
        expect(fieldsDescription).toContain('client-side filtering');
        expect(fieldsDescription).toContain('nested access support');
        
        // Check for resource reference
        expect(fieldsDescription).toMatch(/jira:\/\/\w+\/fields/);
        
        // Check for examples
        expect(fieldsDescription).toContain('Basic:');
        expect(fieldsDescription).toContain('Detailed:');
        
        // Check for warning note
        expect(fieldsDescription).toContain('Note:');
        expect(fieldsDescription).toContain('API doesn\'t support native fields parameter');
      });
    });
    
  });

});