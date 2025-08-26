import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Integration tests for getUserProfile MCP tool using real Jira Server
// These tests run against actual Jira Server environment through MCP server
describe('MCP getUserProfile Tool Integration Tests', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    mcpServer = new JiraMcpServer();
  });

  describe('getUserProfile MCP Tool - Real Jira Server Tests', () => {
    it('should retrieve user profile through MCP server with current user email', async () => {
      // First get current user to extract email address for testing
      const currentUserResult = await mcpServer['handleGetCurrentUser']({});
      const currentUserData = JSON.parse(currentUserResult.content[0].text);
      const currentUserEmail = currentUserData.emailAddress;

      // Act - Call the handler directly
      const result = await mcpServer['handleGetUserProfile']({
        username: currentUserEmail,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBe(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBeDefined();

      // Parse the JSON response
      const user = JSON.parse(result.content[0].text);

      // Validate user structure
      expect(user).toBeDefined();
      expect(typeof user).toBe('object');

      // Required fields validation
      expect(user.self).toBeDefined();
      expect(typeof user.self).toBe('string');
      expect(user.self).toMatch(/^https?:\/\/.+\/rest\/api\/2\/user/);

      expect(user.name).toBeDefined();
      expect(typeof user.name).toBe('string');
      expect(user.name).toBeTruthy();

      expect(user.displayName).toBeDefined();
      expect(typeof user.displayName).toBe('string');
      expect(user.displayName).toBeTruthy();

      expect(user.emailAddress).toBeDefined();
      expect(typeof user.emailAddress).toBe('string');
      expect(user.emailAddress).toMatch(/^.+@.+\..+$/);

      expect(user.active).toBeDefined();
      expect(typeof user.active).toBe('boolean');

      expect(user.timeZone).toBeDefined();
      expect(typeof user.timeZone).toBe('string');
      expect(user.timeZone).toBeTruthy();

      expect(user.avatarUrls).toBeDefined();
      expect(typeof user.avatarUrls).toBe('object');
      expect(Object.keys(user.avatarUrls).length).toBeGreaterThan(0);

      // Jira Server specific fields
      expect(user.key).toBeDefined();
      expect(typeof user.key).toBe('string');
      expect(user.key).toBeTruthy();

      console.log('✅ MCP getUserProfile tool retrieved user successfully:', {
        name: user.name,
        displayName: user.displayName,
        emailAddress: user.emailAddress,
        key: user.key,
        active: user.active,
        timeZone: user.timeZone,
      });
    });

    it('should return consistent data between getUserProfile and getCurrentUser MCP tools', async () => {
      // Get current user first
      const currentUserResult = await mcpServer['handleGetCurrentUser']({});
      const currentUser = JSON.parse(currentUserResult.content[0].text);

      // Get user profile for the same user
      const userProfileResult = await mcpServer['handleGetUserProfile']({
        username: currentUser.emailAddress,
      });
      const userProfile = JSON.parse(userProfileResult.content[0].text);

      // Assert - Data should be consistent
      expect(userProfile.self).toEqual(currentUser.self);
      expect(userProfile.name).toEqual(currentUser.name);
      expect(userProfile.key).toEqual(currentUser.key);
      expect(userProfile.displayName).toEqual(currentUser.displayName);
      expect(userProfile.emailAddress).toEqual(currentUser.emailAddress);
      expect(userProfile.active).toEqual(currentUser.active);
      expect(userProfile.timeZone).toEqual(currentUser.timeZone);

      console.log(
        '✅ Consistent data between getCurrentUser and getUserProfile MCP tools'
      );
    });

    it('should validate Jira Server field format in MCP response', async () => {
      // First get current user to extract email address
      const currentUserResult = await mcpServer['handleGetCurrentUser']({});
      const currentUserData = JSON.parse(currentUserResult.content[0].text);
      const currentUserEmail = currentUserData.emailAddress;

      // Act
      const userProfileResult = await mcpServer['handleGetUserProfile']({
        username: currentUserEmail,
      });
      const user = JSON.parse(userProfileResult.content[0].text);

      // Assert - Server-specific field validation
      expect(user.key).toBeDefined();
      expect(user.key).toMatch(/^JIRAUSER\d+$/); // Server format: JIRAUSER{number}

      expect(user.deleted).toBeDefined();
      expect(typeof user.deleted).toBe('boolean');
      expect(user.deleted).toBe(false); // Active user should not be deleted

      if (user.locale) {
        expect(typeof user.locale).toBe('string');
      }

      // Domain validation for the test environment
      expect(user.emailAddress).toMatch(/@dentsplysirona\.com$/);
      expect(user.name).toMatch(/@dentsplysirona\.com$/);
      expect(user.self).toMatch(/^https:\/\/jira\.dentsplysirona\.com/);

      console.log(
        '✅ MCP Server field format validation passed for user:',
        user.key
      );
    });

    it('should handle MCP tool parameter validation', async () => {
      // Test missing username parameter
      try {
        await mcpServer['handleGetUserProfile']({});
        throw new Error(
          'Expected getUserProfile to throw an error for missing username'
        );
      } catch (error: any) {
        expect(error.message).toContain('username is required');
        expect(error.statusCode).toBe(400);
      }

      // Test invalid username parameter type
      try {
        await mcpServer['handleGetUserProfile']({ username: 123 });
        throw new Error(
          'Expected getUserProfile to throw an error for invalid username type'
        );
      } catch (error: any) {
        expect(error.message).toContain(
          'username is required and must be a string'
        );
        expect(error.statusCode).toBe(400);
      }

      console.log('✅ MCP tool parameter validation working correctly');
    });

    it('should handle nonexistent user through MCP tool', async () => {
      // Test with definitely nonexistent user
      const nonexistentUser = 'definitely.nonexistent.user.12345';

      try {
        await mcpServer['handleGetUserProfile']({ username: nonexistentUser });
        throw new Error(
          'Expected getUserProfile to throw an error for nonexistent user'
        );
      } catch (error: any) {
        expect(error.message).toContain('User not found');
        expect(error.statusCode).toBe(404);
      }

      console.log('✅ MCP tool nonexistent user error handling confirmed');
    });

    it('should demonstrate MCP tool functionality for user management', async () => {
      // First get current user
      const currentUserResult = await mcpServer['handleGetCurrentUser']({});
      const currentUser = JSON.parse(currentUserResult.content[0].text);

      // Use getUserProfile to get detailed profile
      const userProfileResult = await mcpServer['handleGetUserProfile']({
        username: currentUser.emailAddress,
      });
      const userProfile = JSON.parse(userProfileResult.content[0].text);

      // Log MCP tool functionality summary
      console.log('🔧 MCP getUserProfile Tool Functionality Summary:');
      console.log(`   Tool Name: getUserProfile`);
      console.log(`   Input: username (${currentUser.emailAddress})`);
      console.log(`   Output: Complete user profile information`);
      console.log(`   User Retrieved: ${userProfile.displayName}`);
      console.log(`   User Key: ${userProfile.key}`);
      console.log(`   Status: ${userProfile.active ? 'Active' : 'Inactive'}`);
      console.log(`   Timezone: ${userProfile.timeZone}`);
      console.log(`   Server: ${new URL(userProfile.self).origin}`);
      console.log(`   MCP Response Format: JSON text content`);

      if (userProfile.groups) {
        console.log(`   Groups: ${userProfile.groups.size} total`);
      }

      if (userProfile.applicationRoles) {
        console.log(
          `   Application Roles: ${userProfile.applicationRoles.size} total`
        );
      }

      console.log('✅ MCP getUserProfile tool functionality demonstrated');
    });
  });

  describe('MCP Tool Error Handling - Real Jira Server', () => {
    it('should handle MCP tool errors gracefully', async () => {
      // Test empty username
      try {
        await mcpServer['handleGetUserProfile']({ username: '' });
        throw new Error('Expected error for empty username');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.statusCode).toBe(400); // MCP server validates before calling searchUsers
      }

      console.log('✅ MCP tool empty username error handling confirmed');
    });

    it('should validate MCP response structure consistency', async () => {
      // Get current user email for testing
      const currentUserResult = await mcpServer['handleGetCurrentUser']({});
      const currentUserData = JSON.parse(currentUserResult.content[0].text);
      const currentUserEmail = currentUserData.emailAddress;

      // Test MCP response structure
      const result = await mcpServer['handleGetUserProfile']({
        username: currentUserEmail,
      });

      // Validate MCP response structure
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBe(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
      expect(typeof result.content[0].text).toBe('string');

      // Validate JSON content
      const userData = JSON.parse(result.content[0].text);
      expect(userData).toBeDefined();
      expect(typeof userData).toBe('object');

      console.log('✅ MCP response structure validation passed');
    });
  });

  describe('MCP Tool Integration Verification', () => {
    it('should confirm getUserProfile tool is properly integrated in MCP server', async () => {
      // Access the setupHandlers to verify tool registration
      // We'll indirectly test this by ensuring the handleGetUserProfile method exists and works
      expect(typeof mcpServer['handleGetUserProfile']).toBe('function');

      // Test that the method is callable and works as expected
      const currentUserResult = await mcpServer['handleGetCurrentUser']({});
      const currentUserData = JSON.parse(currentUserResult.content[0].text);
      const currentUserEmail = currentUserData.emailAddress;

      const result = await mcpServer['handleGetUserProfile']({
        username: currentUserEmail,
      });
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const userData = JSON.parse(result.content[0].text);
      expect(userData.emailAddress).toBe(currentUserEmail);

      console.log('✅ getUserProfile tool properly integrated in MCP server');
      console.log(`   Tool handler exists and functions correctly`);
      console.log(`   Returns proper MCP response format`);
    });
  });
});
