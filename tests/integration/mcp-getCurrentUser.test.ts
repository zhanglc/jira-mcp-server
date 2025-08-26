import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Integration test for getCurrentUser MCP tool
// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
describe('MCP Server - getCurrentUser Integration Tests', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log(
        'Skipping MCP Server getCurrentUser integration tests - JIRA_PERSONAL_TOKEN not set'
      );
      return;
    }

    mcpServer = new JiraMcpServer();
  });

  beforeEach(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      pending(
        'JIRA_PERSONAL_TOKEN not set - skipping MCP Server integration test'
      );
    }
  });

  describe('getCurrentUser MCP Tool', () => {
    it('should return current user information when called via MCP handler', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetCurrentUser({});

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBe(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      // Parse the JSON response
      const userText = response.content[0].text;
      expect(typeof userText).toBe('string');

      const user = JSON.parse(userText);
      expect(user).toBeDefined();
      expect(typeof user).toBe('object');

      // Validate user structure
      expect(user.self).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.key).toBeDefined();
      expect(user.displayName).toBeDefined();
      expect(user.emailAddress).toBeDefined();
      expect(user.active).toBeDefined();
      expect(user.timeZone).toBeDefined();
      expect(user.avatarUrls).toBeDefined();

      console.log('✅ MCP getCurrentUser tool returned user:', {
        name: user.name,
        displayName: user.displayName,
        key: user.key,
        active: user.active,
      });
    }, 10000);

    it('should reject requests with parameters', async () => {
      // Act & Assert - Test the handler directly with invalid parameters
      await expect(
        (mcpServer as any).handleGetCurrentUser({
          invalidParam: 'should be rejected',
        })
      ).rejects.toThrow('getCurrentUser does not accept any parameters');
    });

    it('should be consistent with expected authentication user', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetCurrentUser({});
      const user = JSON.parse(response.content[0].text);

      // Assert - Validate authentication user matches expected user
      expect(user.emailAddress).toMatch(/@dentsplysirona\.com$/);
      expect(user.name).toMatch(/@dentsplysirona\.com$/);
      expect(user.active).toBe(true);
      expect(user.key).toMatch(/^JIRAUSER\d+$/);

      console.log(
        '✅ MCP tool consistency verified for user:',
        user.displayName
      );
    }, 10000);

    it('should provide authentication verification capability via MCP', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetCurrentUser({});
      const user = JSON.parse(response.content[0].text);

      // Assert - Authentication verification indicators
      expect(user.active).toBe(true);
      expect(user.deleted).toBe(false);
      expect(user.name).toBeTruthy();
      expect(user.emailAddress).toBeTruthy();
      expect(user.displayName).toBeTruthy();

      // Log authentication summary for MCP context
      console.log('🔐 MCP Authentication Verification:');
      console.log(`   Tool: getCurrentUser`);
      console.log(`   User: ${user.displayName} (${user.emailAddress})`);
      console.log(`   Key: ${user.key}`);
      console.log(`   Status: ${user.active ? 'Active' : 'Inactive'}`);
      console.log(`   Authentication: ✅ Verified`);

      console.log('✅ MCP authentication verification completed');
    }, 10000);

    it('should return well-formed JSON that can be parsed by MCP clients', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetCurrentUser({});
      const userText = response.content[0].text;

      // Assert - JSON formatting validation
      expect(() => JSON.parse(userText)).not.toThrow();

      const user = JSON.parse(userText);
      const reformattedJson = JSON.stringify(user, null, 2);

      // Verify it's properly formatted JSON (matches our formatting)
      expect(userText).toBe(reformattedJson);

      // Verify all expected fields are present and properly typed
      expect(typeof user.self).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.key).toBe('string');
      expect(typeof user.displayName).toBe('string');
      expect(typeof user.emailAddress).toBe('string');
      expect(typeof user.active).toBe('boolean');
      expect(typeof user.timeZone).toBe('string');
      expect(typeof user.avatarUrls).toBe('object');

      console.log('✅ MCP JSON formatting validation passed');
    }, 10000);

    it('should validate parameter validation works correctly', async () => {
      // Act & Assert - Test empty parameters (should work)
      const validResponse = await (mcpServer as any).handleGetCurrentUser({});
      expect(validResponse).toBeDefined();
      expect(validResponse.content).toBeDefined();

      // Act & Assert - Test null parameters (should work)
      const nullResponse = await (mcpServer as any).handleGetCurrentUser(null);
      expect(nullResponse).toBeDefined();
      expect(nullResponse.content).toBeDefined();

      // Act & Assert - Test with parameters (should fail)
      await expect(
        (mcpServer as any).handleGetCurrentUser({ someParam: 'value' })
      ).rejects.toThrow('getCurrentUser does not accept any parameters');

      console.log('✅ Parameter validation working correctly');
    });
  });

  describe('ListTools Integration', () => {
    it('should include getCurrentUser in MCP server definition', async () => {
      // This test verifies that the getCurrentUser tool is properly defined
      // We can test this by checking if the handler function exists
      expect((mcpServer as any).handleGetCurrentUser).toBeDefined();
      expect(typeof (mcpServer as any).handleGetCurrentUser).toBe('function');

      console.log('getCurrentUser handler successfully defined in MCP Server');
    });
  });
});
