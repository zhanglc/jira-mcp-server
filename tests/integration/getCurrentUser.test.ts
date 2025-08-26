import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { loadConfig } from '../../src/utils/config.js';

// Integration tests for getCurrentUser method using real Jira Server
// These tests run against actual Jira Server environment
describe('JiraClientWrapper.getCurrentUser Integration Tests', () => {
  let wrapper: JiraClientWrapper;
  let config: JiraConfig;

  beforeAll(() => {
    // Load real configuration from environment
    config = loadConfig();
    wrapper = new JiraClientWrapper(config);
  });

  describe('getCurrentUser() - Real Jira Server Tests', () => {
    it('should retrieve current user information from real Jira Server', async () => {
      // Act
      const user = await wrapper.getCurrentUser();

      // Assert - Validate basic structure
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

      console.log('✅ Current user retrieved successfully:', {
        name: user.name,
        displayName: user.displayName,
        emailAddress: user.emailAddress,
        key: user.key,
        active: user.active,
        timeZone: user.timeZone,
      });
    });

    it('should return user with expected authentication context', async () => {
      // Act
      const user = await wrapper.getCurrentUser();

      // Assert - Authentication verification
      expect(user.active).toBe(true); // Should be active user for valid authentication
      expect(user.name).toContain('@'); // Username is typically email in this environment
      expect(user.emailAddress).toEqual(user.name); // In this setup, name and email should match

      console.log('✅ Authentication verified for user:', user.displayName);
    });

    it('should return user with all expected Jira Server fields', async () => {
      // Act
      const user = await wrapper.getCurrentUser();

      // Assert - Server-specific field validation
      expect(user.key).toBeDefined();
      expect(user.key).toMatch(/^JIRAUSER\d+$/); // Server format: JIRAUSER{number}

      expect(user.deleted).toBeDefined();
      expect(typeof user.deleted).toBe('boolean');
      expect(user.deleted).toBe(false); // Active user should not be deleted

      if (user.locale) {
        expect(typeof user.locale).toBe('string');
      }

      if (user.groups) {
        expect(typeof user.groups).toBe('object');
        expect(user.groups).toHaveProperty('size');
        expect(user.groups).toHaveProperty('items');
        expect(typeof user.groups.size).toBe('number');
        expect(Array.isArray(user.groups.items)).toBe(true);
      }

      if (user.applicationRoles) {
        expect(typeof user.applicationRoles).toBe('object');
        expect(user.applicationRoles).toHaveProperty('size');
        expect(user.applicationRoles).toHaveProperty('items');
        expect(typeof user.applicationRoles.size).toBe('number');
        expect(Array.isArray(user.applicationRoles.items)).toBe(true);
      }

      console.log('✅ All Jira Server fields validated for user:', user.key);
    });

    it('should return consistent user information across multiple calls', async () => {
      // Act - Call getCurrentUser multiple times
      const user1 = await wrapper.getCurrentUser();
      const user2 = await wrapper.getCurrentUser();

      // Assert - Results should be identical
      expect(user1.self).toEqual(user2.self);
      expect(user1.name).toEqual(user2.name);
      expect(user1.key).toEqual(user2.key);
      expect(user1.displayName).toEqual(user2.displayName);
      expect(user1.emailAddress).toEqual(user2.emailAddress);
      expect(user1.active).toEqual(user2.active);
      expect(user1.timeZone).toEqual(user2.timeZone);

      console.log('✅ Consistent user information across multiple calls');
    });

    it('should validate avatar URLs are accessible', async () => {
      // Act
      const user = await wrapper.getCurrentUser();

      // Assert - Avatar URLs structure
      expect(user.avatarUrls).toBeDefined();
      expect(typeof user.avatarUrls).toBe('object');

      const avatarSizes = Object.keys(user.avatarUrls);
      expect(avatarSizes.length).toBeGreaterThan(0);

      // Common avatar sizes should be present
      const expectedSizes = ['16x16', '24x24', '32x32', '48x48'];
      const presentSizes = expectedSizes.filter(size => user.avatarUrls[size]);
      expect(presentSizes.length).toBeGreaterThan(0);

      // All avatar URLs should be valid URLs
      for (const [size, url] of Object.entries(user.avatarUrls)) {
        expect(typeof url).toBe('string');
        expect(url).toMatch(/^https?:\/\/.+/);
        console.log(`✅ Avatar URL (${size}): ${url}`);
      }
    });

    it('should validate user belongs to expected domain', async () => {
      // Act
      const user = await wrapper.getCurrentUser();

      // Assert - Domain validation for the test environment
      expect(user.emailAddress).toMatch(/@dentsplysirona\.com$/);
      expect(user.name).toMatch(/@dentsplysirona\.com$/);
      expect(user.self).toMatch(/^https:\/\/jira\.dentsplysirona\.com/);

      console.log('✅ User domain validation passed for:', user.emailAddress);
    });

    it('should demonstrate authentication base functionality', async () => {
      // This test verifies that getCurrentUser serves as authentication verification

      // Act
      const user = await wrapper.getCurrentUser();

      // Assert - Key authentication indicators
      expect(user.active).toBe(true);
      expect(user.deleted).toBe(false);
      expect(user.name).toBeTruthy();
      expect(user.emailAddress).toBeTruthy();

      // Log authentication summary
      console.log('🔐 Authentication Verification Summary:');
      console.log(`   Authenticated User: ${user.displayName}`);
      console.log(`   Email: ${user.emailAddress}`);
      console.log(`   User Key: ${user.key}`);
      console.log(`   Status: ${user.active ? 'Active' : 'Inactive'}`);
      console.log(`   Timezone: ${user.timeZone}`);
      console.log(`   Locale: ${user.locale || 'Not specified'}`);
      console.log(`   Server: ${new URL(user.self).origin}`);

      if (user.groups) {
        console.log(`   Groups: ${user.groups.size} total`);
      }

      if (user.applicationRoles) {
        console.log(
          `   Application Roles: ${user.applicationRoles.size} total`
        );
      }

      console.log('✅ Authentication base functionality verified');
    });
  });

  describe('Error Handling - Real Jira Server', () => {
    it('should handle authentication gracefully when valid token is used', async () => {
      // This test ensures our current valid token works
      // If this fails, it indicates an authentication issue

      try {
        const user = await wrapper.getCurrentUser();
        expect(user).toBeDefined();
        expect(user.active).toBe(true);
        console.log('✅ Valid authentication confirmed');
      } catch (error) {
        // If this test fails, we have an authentication problem
        console.error('❌ Authentication failed - check token/credentials');
        throw error;
      }
    });
  });
});
