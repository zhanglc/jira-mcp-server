import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { JiraSystemInfo } from '../../src/types/jira-types.js';

// Integration tests for real Jira Server
describe('JiraClientWrapper.getSystemInfo Integration Tests', () => {
  let wrapper: JiraClientWrapper;
  let config: JiraConfig;

  beforeAll(() => {
    // Verify test environment variables are available
    if (!process.env.JIRA_URL || !process.env.JIRA_PERSONAL_TOKEN) {
      throw new Error('Integration tests require JIRA_URL and JIRA_PERSONAL_TOKEN environment variables');
    }

    config = {
      url: process.env.JIRA_URL,
      bearer: process.env.JIRA_PERSONAL_TOKEN
    };

    wrapper = new JiraClientWrapper(config);
  });

  describe('real Jira Server system info retrieval', () => {
    test('should retrieve actual system information from Jira Server', async () => {
      // Act
      const systemInfo: JiraSystemInfo = await wrapper.getSystemInfo();

      // Assert basic structure
      expect(systemInfo).toBeDefined();
      expect(typeof systemInfo).toBe('object');

      // Assert required fields exist
      expect(systemInfo.baseUrl).toBeDefined();
      expect(typeof systemInfo.baseUrl).toBe('string');
      expect(systemInfo.baseUrl).toContain('https://');

      expect(systemInfo.version).toBeDefined();
      expect(typeof systemInfo.version).toBe('string');
      expect(systemInfo.version).toMatch(/\d+\.\d+/); // Should contain version numbers

      expect(systemInfo.versionNumbers).toBeDefined();
      expect(Array.isArray(systemInfo.versionNumbers)).toBe(true);
      expect(systemInfo.versionNumbers.length).toBeGreaterThan(0);
      expect(systemInfo.versionNumbers.every(n => typeof n === 'number')).toBe(true);

      expect(systemInfo.deploymentType).toBeDefined();
      expect(typeof systemInfo.deploymentType).toBe('string');
      // For Jira Server, should be 'Server' or 'Data Center'
      expect(['Server', 'Data Center', 'Cloud'].includes(systemInfo.deploymentType)).toBe(true);

      expect(systemInfo.buildNumber).toBeDefined();
      expect(typeof systemInfo.buildNumber).toBe('number');
      expect(systemInfo.buildNumber).toBeGreaterThan(0);

      expect(systemInfo.buildDate).toBeDefined();
      expect(typeof systemInfo.buildDate).toBe('string');
      // Should be a valid date string
      expect(new Date(systemInfo.buildDate).getTime()).not.toBeNaN();

      expect(systemInfo.scmInfo).toBeDefined();
      expect(typeof systemInfo.scmInfo).toBe('string');

      // Log the actual system info for documentation purposes
      console.log('=== Actual Jira Server System Info ===');
      console.log(`Base URL: ${systemInfo.baseUrl}`);
      console.log(`Version: ${systemInfo.version}`);
      console.log(`Version Numbers: [${systemInfo.versionNumbers.join(', ')}]`);
      console.log(`Deployment Type: ${systemInfo.deploymentType}`);
      console.log(`Build Number: ${systemInfo.buildNumber}`);
      console.log(`Build Date: ${systemInfo.buildDate}`);
      console.log(`SCM Info: ${systemInfo.scmInfo}`);

      // Optional fields logging
      if (systemInfo.serverTitle) {
        console.log(`Server Title: ${systemInfo.serverTitle}`);
      }
      if (systemInfo.healthChecks) {
        console.log(`Health Checks: ${systemInfo.healthChecks.length} checks`);
        systemInfo.healthChecks.forEach(check => {
          console.log(`  - ${check.name}: ${check.status}`);
        });
      }
      if (systemInfo.systemInfoService) {
        console.log(`System Info Service: ${Object.keys(systemInfo.systemInfoService).length} properties`);
      }
      console.log('=====================================');
    }, 10000); // 10 second timeout for real API call

    test('should handle version parsing correctly', async () => {
      // Act
      const systemInfo: JiraSystemInfo = await wrapper.getSystemInfo();

      // Assert version consistency
      const versionString = systemInfo.version;
      const versionNumbers = systemInfo.versionNumbers;

      // Extract major, minor from version string and compare with versionNumbers
      const versionParts = versionString.split('.').map(part => {
        // Remove any non-numeric suffixes (like '-beta1', '-SNAPSHOT')
        const numericPart = part.match(/^\d+/);
        return numericPart ? parseInt(numericPart[0], 10) : 0;
      });

      // The first few elements should match
      expect(versionNumbers[0]).toBe(versionParts[0]); // Major version
      if (versionParts.length > 1) {
        expect(versionNumbers[1]).toBe(versionParts[1]); // Minor version
      }
      if (versionParts.length > 2) {
        expect(versionNumbers[2]).toBe(versionParts[2]); // Patch version
      }
    });

    test('should have Server deployment type for our test environment', async () => {
      // Act
      const systemInfo: JiraSystemInfo = await wrapper.getSystemInfo();

      // Assert
      // Based on the test environment (https://jira.dentsplysirona.com), this should be Server
      expect(systemInfo.deploymentType).toBe('Server');
    });

    test('should have valid build information', async () => {
      // Act
      const systemInfo: JiraSystemInfo = await wrapper.getSystemInfo();

      // Assert build information validity
      expect(systemInfo.buildNumber).toBeGreaterThan(0);
      
      // Build date should be a valid ISO date
      const buildDate = new Date(systemInfo.buildDate);
      expect(buildDate.getTime()).not.toBeNaN();
      
      // Build date should be in the past
      expect(buildDate.getTime()).toBeLessThan(Date.now());
      
      // SCM info should be a non-empty string (usually a commit hash)
      expect(systemInfo.scmInfo.length).toBeGreaterThan(0);
    });

    test('should maintain consistent data across multiple calls', async () => {
      // Act - Make multiple calls
      const systemInfo1 = await wrapper.getSystemInfo();
      const systemInfo2 = await wrapper.getSystemInfo();

      // Assert consistency
      expect(systemInfo1.baseUrl).toBe(systemInfo2.baseUrl);
      expect(systemInfo1.version).toBe(systemInfo2.version);
      expect(systemInfo1.versionNumbers).toEqual(systemInfo2.versionNumbers);
      expect(systemInfo1.deploymentType).toBe(systemInfo2.deploymentType);
      expect(systemInfo1.buildNumber).toBe(systemInfo2.buildNumber);
      expect(systemInfo1.buildDate).toBe(systemInfo2.buildDate);
      expect(systemInfo1.scmInfo).toBe(systemInfo2.scmInfo);
    });
  });

  describe('model validation', () => {
    test('should match our TypeScript interface definition', async () => {
      // Act
      const systemInfo: JiraSystemInfo = await wrapper.getSystemInfo();

      // Assert interface compliance
      // Required fields
      expect(systemInfo).toHaveProperty('baseUrl');
      expect(systemInfo).toHaveProperty('version');
      expect(systemInfo).toHaveProperty('versionNumbers');
      expect(systemInfo).toHaveProperty('deploymentType');
      expect(systemInfo).toHaveProperty('buildNumber');
      expect(systemInfo).toHaveProperty('buildDate');
      expect(systemInfo).toHaveProperty('scmInfo');

      // Type validation
      expect(typeof systemInfo.baseUrl).toBe('string');
      expect(typeof systemInfo.version).toBe('string');
      expect(Array.isArray(systemInfo.versionNumbers)).toBe(true);
      expect(typeof systemInfo.deploymentType).toBe('string');
      expect(typeof systemInfo.buildNumber).toBe('number');
      expect(typeof systemInfo.buildDate).toBe('string');
      expect(typeof systemInfo.scmInfo).toBe('string');

      // Optional fields type validation (if present)
      if (systemInfo.serverTitle !== undefined) {
        expect(typeof systemInfo.serverTitle).toBe('string');
      }
      if (systemInfo.healthChecks !== undefined) {
        expect(Array.isArray(systemInfo.healthChecks)).toBe(true);
        systemInfo.healthChecks.forEach(check => {
          expect(typeof check.name).toBe('string');
          expect(typeof check.description).toBe('string');
          expect(typeof check.status).toBe('string');
        });
      }
      if (systemInfo.systemInfoService !== undefined) {
        expect(typeof systemInfo.systemInfoService).toBe('object');
      }
    });
  });
});