import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Integration test for getServerInfo MCP tool
// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
describe('MCP Server - getServerInfo Integration Tests', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log('Skipping MCP Server getServerInfo integration tests - JIRA_PERSONAL_TOKEN not set');
      return;
    }

    mcpServer = new JiraMcpServer();
  });

  beforeEach(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      pending('JIRA_PERSONAL_TOKEN not set - skipping MCP Server integration test');
    }
  });

  describe('getServerInfo MCP Tool', () => {
    it('should return server information when called via MCP handler', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetServerInfo({});

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBe(1);
      expect(response.content[0].type).toBe('text');
      
      const serverInfo = JSON.parse(response.content[0].text);
      
      // Validate structure
      expect(serverInfo).toBeDefined();
      expect(typeof serverInfo.baseUrl).toBe('string');
      expect(typeof serverInfo.version).toBe('string');
      expect(Array.isArray(serverInfo.versionNumbers)).toBe(true);
      expect(typeof serverInfo.deploymentType).toBe('string');
      expect(typeof serverInfo.buildNumber).toBe('number');
      expect(typeof serverInfo.buildDate).toBe('string');
      expect(typeof serverInfo.serverTime).toBe('string');
      expect(typeof serverInfo.scmInfo).toBe('string');

      // Validate server time is present
      expect(serverInfo).toHaveProperty('serverTime');
      expect(new Date(serverInfo.serverTime)).toBeInstanceOf(Date);

      // Should match environment
      expect(serverInfo.baseUrl).toContain('jira.dentsplysirona.com');
      expect(serverInfo.deploymentType).toBe('Server');

      console.log('MCP getServerInfo response:', {
        baseUrl: serverInfo.baseUrl,
        version: serverInfo.version,
        deploymentType: serverInfo.deploymentType,
        serverTime: serverInfo.serverTime,
        defaultLocale: serverInfo.defaultLocale?.locale || 'Not set'
      });
    }, 30000);

    it('should reject invalid parameters', async () => {
      // Act & Assert
      await expect(
        (mcpServer as any).handleGetServerInfo({ invalidParam: 'test' })
      ).rejects.toThrow('getServerInfo does not accept any parameters');
    });

    it('should return server time that is current', async () => {
      // Act
      const response = await (mcpServer as any).handleGetServerInfo({});
      const serverInfo = JSON.parse(response.content[0].text);

      // Assert - Server time should be reasonably current
      const serverTime = new Date(serverInfo.serverTime);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - serverTime.getTime());
      
      // Should be within 5 minutes (allowing for server processing time)
      expect(timeDiff).toBeLessThan(5 * 60 * 1000);

      // Should be more recent than build date
      const buildTime = new Date(serverInfo.buildDate);
      expect(serverTime.getTime()).toBeGreaterThan(buildTime.getTime());

      console.log('Time comparison:', {
        buildDate: serverInfo.buildDate,
        serverTime: serverInfo.serverTime,
        timeDifferenceMs: timeDiff
      });
    }, 30000);

    it('should handle locale information if available', async () => {
      // Act
      const response = await (mcpServer as any).handleGetServerInfo({});
      const serverInfo = JSON.parse(response.content[0].text);

      // Assert - If locale is present, it should be valid
      if (serverInfo.defaultLocale) {
        expect(typeof serverInfo.defaultLocale).toBe('object');
        expect(typeof serverInfo.defaultLocale.locale).toBe('string');
        expect(serverInfo.defaultLocale.locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/); // e.g., en_US, de_DE
        
        console.log('Default locale found:', serverInfo.defaultLocale.locale);
      } else {
        console.log('No default locale information available');
      }
    }, 30000);

    it('should validate response format matches MCP expectations', async () => {
      // Act
      const response = await (mcpServer as any).handleGetServerInfo({});

      // Assert - MCP response format
      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toHaveProperty('type');
      expect(response.content[0].type).toBe('text');
      expect(response.content[0]).toHaveProperty('text');
      expect(typeof response.content[0].text).toBe('string');

      // JSON should be valid and parseable
      const serverInfo = JSON.parse(response.content[0].text);
      expect(serverInfo).toBeDefined();
      expect(typeof serverInfo).toBe('object');

      // Should be formatted nicely for readability
      const formatted = JSON.stringify(serverInfo, null, 2);
      expect(response.content[0].text).toBe(formatted);
    }, 30000);
  });
});