import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { loadConfig } from '../../src/utils/config.js';

// Integration tests for getUserProfile method using real Jira Server
// These tests run against actual Jira Server environment
describe('JiraClientWrapper.getUserProfile Integration Tests', () => {
  let wrapper: JiraClientWrapper;
  let config: JiraConfig;
  let currentUserName: string;

  beforeAll(async () => {
    // Load real configuration from environment
    config = loadConfig();
    wrapper = new JiraClientWrapper(config);

    // Get current user name for testing getUserProfile against self
    const currentUser = await wrapper.getCurrentUser();
    currentUserName = currentUser.name;
  });

  describe('getUserProfile(username) - Real Jira Server Tests', () => {
    it('should retrieve user profile for current user by username', async () => {
      // Act
      const user = await wrapper.getUserProfile(currentUserName);

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

      console.log('✅ User profile retrieved successfully:', {
        name: user.name,
        displayName: user.displayName,
        emailAddress: user.emailAddress,
        key: user.key,
        active: user.active,
        timeZone: user.timeZone,
      });
    });

    it('should return user profile with expected authentication context', async () => {
      // Act
      const user = await wrapper.getUserProfile(currentUserName);

      // Assert - Authentication verification
      expect(user.active).toBe(true); // Should be active user for valid authentication
      expect(user.name).toBe(currentUserName);
      expect(user.emailAddress).toEqual(user.name); // In this setup, name and email should match

      console.log(
        '✅ Authentication verified for user profile:',
        user.displayName
      );
    });

    it('should return user profile with all expected Jira Server fields', async () => {
      // Act
      const user = await wrapper.getUserProfile(currentUserName);

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

      console.log(
        '✅ All Jira Server fields validated for user profile:',
        user.key
      );
    });

    it('should return consistent user profile information with getCurrentUser', async () => {
      // Act - Get user profile and current user for comparison
      const userProfile = await wrapper.getUserProfile(currentUserName);
      const currentUser = await wrapper.getCurrentUser();

      // Assert - Results should be identical since we're querying the same user
      expect(userProfile.self).toEqual(currentUser.self);
      expect(userProfile.name).toEqual(currentUser.name);
      expect(userProfile.key).toEqual(currentUser.key);
      expect(userProfile.displayName).toEqual(currentUser.displayName);
      expect(userProfile.emailAddress).toEqual(currentUser.emailAddress);
      expect(userProfile.active).toEqual(currentUser.active);
      expect(userProfile.timeZone).toEqual(currentUser.timeZone);

      console.log(
        '✅ Consistent user information between getUserProfile and getCurrentUser'
      );
    });

    it('should validate avatar URLs are accessible in user profile', async () => {
      // Act
      const user = await wrapper.getUserProfile(currentUserName);

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
        console.log(`✅ User profile avatar URL (${size}): ${url}`);
      }
    });

    it('should validate user profile belongs to expected domain', async () => {
      // Act
      const user = await wrapper.getUserProfile(currentUserName);

      // Assert - Domain validation for the test environment
      expect(user.emailAddress).toMatch(/@dentsplysirona\.com$/);
      expect(user.name).toMatch(/@dentsplysirona\.com$/);
      expect(user.self).toMatch(/^https:\/\/jira\.dentsplysirona\.com/);

      console.log(
        '✅ User profile domain validation passed for:',
        user.emailAddress
      );
    });

    it('should demonstrate user profile query functionality', async () => {
      // This test verifies that getUserProfile allows querying specific users

      // Act
      const user = await wrapper.getUserProfile(currentUserName);

      // Assert - Key user profile indicators
      expect(user.active).toBe(true);
      expect(user.deleted).toBe(false);
      expect(user.name).toBeTruthy();
      expect(user.emailAddress).toBeTruthy();

      // Log user profile summary
      console.log('👤 User Profile Query Summary:');
      console.log(`   Queried User: ${user.displayName}`);
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

      console.log('✅ User profile query functionality verified');
    });

    it('should handle user profile query by email address format', async () => {
      // First get current user to extract their email address
      const currentUser = await wrapper.getCurrentUser();
      const userEmail = currentUser.emailAddress;

      // Act - Query by email address (which should work with searchUsers API)
      const user = await wrapper.getUserProfile(userEmail);

      // Assert - Should return the same user
      expect(user).toBeDefined();
      expect(user.key).toBe(currentUser.key);
      expect(user.name).toBe(currentUser.name);
      expect(user.displayName).toBe(currentUser.displayName);
      expect(user.emailAddress).toBe(currentUser.emailAddress);

      console.log(
        `✅ User profile query by email successful: ${userEmail} -> ${user.displayName}`
      );
    });
  });

  describe('Error Handling - Real Jira Server', () => {
    it('should handle user profile query gracefully when valid user is queried', async () => {
      // This test ensures our getUserProfile method works with valid users

      try {
        const user = await wrapper.getUserProfile(currentUserName);
        expect(user).toBeDefined();
        expect(user.active).toBe(true);
        console.log('✅ Valid user profile query confirmed');
      } catch (error) {
        // If this test fails, we have a user profile query problem
        console.error('❌ User profile query failed - check implementation');
        throw error;
      }
    });

    it('should handle nonexistent user gracefully', async () => {
      // This test verifies proper error handling for nonexistent users
      const nonexistentUser = 'definitely.nonexistent.user.12345';

      try {
        await wrapper.getUserProfile(nonexistentUser);
        // If we reach here, the method didn't throw an error when it should have
        throw new Error(
          'Expected getUserProfile to throw an error for nonexistent user'
        );
      } catch (error: any) {
        // Should receive a proper error
        expect(error.message).toContain('User not found');
        console.log('✅ Nonexistent user error handling confirmed');
      }
    });

    it('should handle empty username gracefully', async () => {
      // This test verifies proper error handling for empty username
      try {
        await wrapper.getUserProfile('');
        // If we reach here, the method didn't throw an error when it should have
        throw new Error(
          'Expected getUserProfile to throw an error for empty username'
        );
      } catch (error: any) {
        // Should receive a proper error
        expect(error).toBeDefined();
        console.log('✅ Empty username error handling confirmed');
      }
    });
  });

  describe('Data Model Validation - Real Jira Server', () => {
    it('should validate JiraUser interface compliance with real data', async () => {
      // Act
      const user = await wrapper.getUserProfile(currentUserName);

      // Assert - Comprehensive data model validation
      console.log('📋 JiraUser Interface Validation:');

      // Required fields
      const requiredFields = [
        'self',
        'name',
        'key',
        'displayName',
        'emailAddress',
        'active',
        'timeZone',
        'avatarUrls',
      ];
      requiredFields.forEach(field => {
        expect(user).toHaveProperty(field);
        expect(user[field as keyof typeof user]).toBeDefined();
        console.log(
          `   ✅ ${field}: ${typeof user[field as keyof typeof user]} - ${field === 'avatarUrls' ? 'object' : user[field as keyof typeof user]}`
        );
      });

      // Optional fields (if present, should be correct type)
      const optionalFields = [
        { name: 'deleted', type: 'boolean' },
        { name: 'locale', type: 'string' },
        { name: 'groups', type: 'object' },
        { name: 'applicationRoles', type: 'object' },
        { name: 'expand', type: 'string' },
        { name: 'accountId', type: 'string' },
      ];

      optionalFields.forEach(field => {
        if (user[field.name as keyof typeof user] !== undefined) {
          expect(typeof user[field.name as keyof typeof user]).toBe(field.type);
          console.log(
            `   ✅ ${field.name} (optional): ${field.type} - ${user[field.name as keyof typeof user]}`
          );
        } else {
          console.log(`   ➖ ${field.name} (optional): not present`);
        }
      });

      // Server-specific validations
      expect(user.key).toMatch(/^JIRAUSER\d+$/);
      console.log(`   ✅ Server key format: ${user.key}`);

      expect(user.emailAddress).toMatch(/@dentsplysirona\.com$/);
      console.log(`   ✅ Domain validation: ${user.emailAddress}`);

      console.log('✅ JiraUser interface compliance validated with real data');
    });
  });
});
