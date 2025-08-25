import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { loadConfig } from '../../src/utils/config.js';

describe('JiraClientWrapper.getServerInfo Integration Tests', () => {
  let client: JiraClientWrapper;

  beforeAll(() => {
    const config = loadConfig();
    client = new JiraClientWrapper(config);
  });

  describe('Real Jira Server Integration', () => {
    test('should retrieve server information from real Jira instance', async () => {
      // Act
      const serverInfo = await client.getServerInfo();

      // Assert - Validate structure and required fields
      expect(serverInfo).toBeDefined();
      expect(typeof serverInfo.baseUrl).toBe('string');
      expect(typeof serverInfo.version).toBe('string');
      expect(Array.isArray(serverInfo.versionNumbers)).toBe(true);
      expect(typeof serverInfo.deploymentType).toBe('string');
      expect(typeof serverInfo.buildNumber).toBe('number');
      expect(typeof serverInfo.buildDate).toBe('string');
      expect(typeof serverInfo.serverTime).toBe('string');
      expect(typeof serverInfo.scmInfo).toBe('string');

      // Validate version numbers array
      expect(serverInfo.versionNumbers.length).toBeGreaterThan(0);
      serverInfo.versionNumbers.forEach(num => {
        expect(typeof num).toBe('number');
      });

      // Validate deployment type
      expect(['Server', 'Cloud', 'Data Center']).toContain(serverInfo.deploymentType);

      // Validate date formats
      expect(new Date(serverInfo.buildDate)).toBeInstanceOf(Date);
      expect(new Date(serverInfo.serverTime)).toBeInstanceOf(Date);

      // Log actual data for verification
      console.log('Server Info Response:');
      console.log(`Base URL: ${serverInfo.baseUrl}`);
      console.log(`Version: ${serverInfo.version}`);
      console.log(`Version Numbers: [${serverInfo.versionNumbers.join(', ')}]`);
      console.log(`Deployment Type: ${serverInfo.deploymentType}`);
      console.log(`Build Number: ${serverInfo.buildNumber}`);
      console.log(`Build Date: ${serverInfo.buildDate}`);
      console.log(`Server Time: ${serverInfo.serverTime}`);
      console.log(`SCM Info: ${serverInfo.scmInfo}`);
      console.log(`Server Title: ${serverInfo.serverTitle || 'Not set'}`);
      console.log(`Default Locale: ${serverInfo.defaultLocale?.locale || 'Not set'}`);

      // Additional validations based on expected Jira Server environment
      expect(serverInfo.baseUrl).toContain('jira.dentsplysirona.com');
      expect(serverInfo.deploymentType).toBe('Server');
    }, 30000);

    test('should return server time different from build date', async () => {
      // Act
      const serverInfo = await client.getServerInfo();

      // Assert - Server time should be current time, different from build date
      const buildTime = new Date(serverInfo.buildDate);
      const serverTime = new Date(serverInfo.serverTime);
      
      // Server time should be more recent than build time
      expect(serverTime.getTime()).toBeGreaterThan(buildTime.getTime());
      
      // Server time should be reasonably recent (within last hour)
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(serverTime.getTime()).toBeGreaterThan(oneHourAgo.getTime());
      
      console.log(`Build Time: ${serverInfo.buildDate}`);
      console.log(`Server Time: ${serverInfo.serverTime}`);
      console.log(`Time Difference: ${serverTime.getTime() - buildTime.getTime()}ms`);
    }, 30000);

    test('should handle serverTime field appropriately', async () => {
      // Act
      const serverInfo = await client.getServerInfo();

      // Assert - serverTime should be a valid ISO timestamp
      expect(serverInfo.serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      // Should be parseable as a Date
      const serverTime = new Date(serverInfo.serverTime);
      expect(serverTime).toBeInstanceOf(Date);
      expect(isNaN(serverTime.getTime())).toBe(false);

      // Should be close to current time (within 5 minutes for server processing)
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - serverTime.getTime());
      expect(timeDiff).toBeLessThan(5 * 60 * 1000); // 5 minutes tolerance
    }, 30000);

    test('should match expected Jira Server environment specifics', async () => {
      // Act
      const serverInfo = await client.getServerInfo();

      // Assert - Environment-specific validations
      expect(serverInfo.baseUrl).toContain('https://jira.dentsplysirona.com');
      expect(serverInfo.deploymentType).toBe('Server');
      
      // Jira Server version should be reasonable
      expect(serverInfo.versionNumbers[0]).toBeGreaterThanOrEqual(8);
      
      // Build number should be positive
      expect(serverInfo.buildNumber).toBeGreaterThan(0);
      
      // SCM info should be present
      expect(serverInfo.scmInfo).toBeTruthy();
      expect(serverInfo.scmInfo.length).toBeGreaterThan(0);
    }, 30000);

    test('should provide distinct data structure from getSystemInfo', async () => {
      // Act
      const serverInfo = await client.getServerInfo();
      const systemInfo = await client.getSystemInfo();

      // Assert - Both should have common fields but different focus
      // Common fields should match (both use same underlying API)
      expect(serverInfo.baseUrl).toBe(systemInfo.baseUrl);
      expect(serverInfo.version).toBe(systemInfo.version);
      expect(serverInfo.versionNumbers).toEqual(systemInfo.versionNumbers);
      expect(serverInfo.deploymentType).toBe(systemInfo.deploymentType);
      expect(serverInfo.buildNumber).toBe(systemInfo.buildNumber);
      expect(serverInfo.buildDate).toBe(systemInfo.buildDate);
      expect(serverInfo.scmInfo).toBe(systemInfo.scmInfo);

      // Both may have serverTime from the same API response
      // The key difference is in the TypeScript interface and data focus
      expect(serverInfo).toHaveProperty('serverTime');

      // serverInfo focuses on server runtime details
      expect(serverInfo).toHaveProperty('serverTime');
      if (serverInfo.defaultLocale) {
        expect(typeof serverInfo.defaultLocale.locale).toBe('string');
      }

      // systemInfo may include additional system monitoring fields
      // Note: Both use same API endpoint but represent different perspectives

      console.log('ServerInfo focus - runtime details:', {
        serverTime: serverInfo.serverTime,
        defaultLocale: serverInfo.defaultLocale?.locale || 'Not available',
        serverTitle: serverInfo.serverTitle || 'Not set'
      });
      console.log('SystemInfo focus - system monitoring:', {
        hasHealthChecks: systemInfo.healthChecks ? true : false,
        hasSystemInfoService: systemInfo.systemInfoService ? true : false,
        buildDate: systemInfo.buildDate
      });

      // The distinction is primarily in interface design and intended use case
      // serverInfo: server runtime state and configuration
      // systemInfo: system health and monitoring perspective
    }, 30000);

    test('should validate real server response structure', async () => {
      // Act
      const serverInfo = await client.getServerInfo();

      // Assert - Comprehensive structure validation
      const requiredFields = [
        'baseUrl', 'version', 'versionNumbers', 'deploymentType',
        'buildNumber', 'buildDate', 'serverTime', 'scmInfo'
      ];

      requiredFields.forEach(field => {
        expect(serverInfo).toHaveProperty(field);
        expect(serverInfo[field as keyof typeof serverInfo]).toBeDefined();
      });

      // Optional fields may or may not be present
      const optionalFields = ['serverTitle', 'defaultLocale'];
      optionalFields.forEach(field => {
        if (serverInfo[field as keyof typeof serverInfo] !== undefined) {
          expect(serverInfo[field as keyof typeof serverInfo]).toBeTruthy();
        }
      });

      // Type validations
      expect(typeof serverInfo.baseUrl).toBe('string');
      expect(typeof serverInfo.version).toBe('string');
      expect(Array.isArray(serverInfo.versionNumbers)).toBe(true);
      expect(typeof serverInfo.deploymentType).toBe('string');
      expect(typeof serverInfo.buildNumber).toBe('number');
      expect(typeof serverInfo.buildDate).toBe('string');
      expect(typeof serverInfo.serverTime).toBe('string');
      expect(typeof serverInfo.scmInfo).toBe('string');

      if (serverInfo.serverTitle) {
        expect(typeof serverInfo.serverTitle).toBe('string');
      }

      if (serverInfo.defaultLocale) {
        expect(typeof serverInfo.defaultLocale).toBe('object');
        expect(typeof serverInfo.defaultLocale.locale).toBe('string');
      }
    }, 30000);
  });
});