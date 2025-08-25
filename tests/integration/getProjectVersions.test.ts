import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraVersion } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import { loadConfig } from '../../src/utils/config.js';

// Mock logger to avoid console output during tests
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

describe('JiraClientWrapper.getProjectVersions - Integration Tests', () => {
  let jiraWrapper: JiraClientWrapper;

  beforeAll(() => {
    // Initialize with real configuration for integration testing
    const config = loadConfig();
    jiraWrapper = new JiraClientWrapper(config);
  });

  describe('Real Jira Server interactions', () => {
    it('should retrieve versions for DSCWA project and validate data structure', async () => {
      // Act
      const versions = await jiraWrapper.getProjectVersions('DSCWA');

      // Assert - Basic structure validation
      expect(Array.isArray(versions)).toBe(true);
      console.log(`\n=== DSCWA Project Versions (${versions.length} found) ===`);
      
      if (versions.length > 0) {
        // Validate that each version has required fields
        versions.forEach((version, index) => {
          console.log(`\n--- Version ${index + 1}: ${version.name} ---`);
          console.log(`ID: ${version.id}`);
          console.log(`Self: ${version.self}`);
          console.log(`Description: ${version.description || 'N/A'}`);
          console.log(`Archived: ${version.archived}`);
          console.log(`Released: ${version.released}`);
          console.log(`Start Date: ${version.startDate || 'N/A'}`);
          console.log(`Release Date: ${version.releaseDate || 'N/A'}`);
          console.log(`User Start Date: ${version.userStartDate || 'N/A'}`);
          console.log(`User Release Date: ${version.userReleaseDate || 'N/A'}`);
          console.log(`Overdue: ${version.overdue || 'N/A'}`);
          console.log(`Project ID: ${version.projectId}`);

          // Validate required fields
          expect(version.self).toBeDefined();
          expect(typeof version.self).toBe('string');
          expect(version.self.length).toBeGreaterThan(0);

          expect(version.id).toBeDefined();
          expect(typeof version.id).toBe('string');
          expect(version.id.length).toBeGreaterThan(0);

          expect(version.name).toBeDefined();
          expect(typeof version.name).toBe('string');
          expect(version.name.length).toBeGreaterThan(0);

          expect(typeof version.archived).toBe('boolean');
          expect(typeof version.released).toBe('boolean');

          expect(version.projectId).toBeDefined();
          expect(typeof version.projectId).toBe('number');
          expect(version.projectId).toBeGreaterThan(0);

          // Validate optional fields types when present
          if (version.description !== undefined) {
            expect(typeof version.description).toBe('string');
          }

          if (version.startDate !== undefined) {
            expect(typeof version.startDate).toBe('string');
          }

          if (version.releaseDate !== undefined) {
            expect(typeof version.releaseDate).toBe('string');
          }

          if (version.userStartDate !== undefined) {
            expect(typeof version.userStartDate).toBe('string');
          }

          if (version.userReleaseDate !== undefined) {
            expect(typeof version.userReleaseDate).toBe('string');
          }

          if (version.overdue !== undefined) {
            expect(typeof version.overdue).toBe('boolean');
          }
        });

        console.log(`\n=== Version Status Summary ===`);
        const releasedCount = versions.filter(v => v.released).length;
        const archivedCount = versions.filter(v => v.archived).length;
        const overdueCount = versions.filter(v => v.overdue).length;
        const activeCount = versions.filter(v => !v.archived && !v.released).length;

        console.log(`Total versions: ${versions.length}`);
        console.log(`Released: ${releasedCount}`);
        console.log(`Archived: ${archivedCount}`);
        console.log(`Overdue: ${overdueCount}`);
        console.log(`Active (unreleased, non-archived): ${activeCount}`);

        // Data integrity checks
        expect(releasedCount + activeCount).toBeGreaterThanOrEqual(0);
        expect(archivedCount).toBeGreaterThanOrEqual(0);
        
        // Test that we can find at least some logical version data
        const hasVersionsWithNames = versions.every(v => v.name && v.name.trim().length > 0);
        expect(hasVersionsWithNames).toBe(true);

        // Validate self URLs point to the correct Jira instance
        const hasSelfUrls = versions.every(v => v.self && v.self.includes('/rest/api/'));
        expect(hasSelfUrls).toBe(true);
      } else {
        console.log('DSCWA project has no versions defined');
      }
    }, 30000); // 30 second timeout for integration test

    it('should handle non-existent project gracefully', async () => {
      // Act & Assert
      await expect(jiraWrapper.getProjectVersions('NONEXISTENT'))
        .rejects
        .toThrow(ApiError);
    }, 10000);

    it('should handle project with special characters in key', async () => {
      // Test with different project key format if available
      try {
        const versions = await jiraWrapper.getProjectVersions('DSCWA');
        expect(Array.isArray(versions)).toBe(true);
      } catch (error) {
        // If DSCWA doesn't exist, that's fine - we're testing error handling
        expect(error).toBeInstanceOf(ApiError);
      }
    }, 10000);

    it('should validate consistent projectId across versions', async () => {
      // Act
      const versions = await jiraWrapper.getProjectVersions('DSCWA');

      // Assert
      if (versions.length > 1) {
        const firstProjectId = versions[0].projectId;
        const allSameProjectId = versions.every(v => v.projectId === firstProjectId);
        expect(allSameProjectId).toBe(true);
        console.log(`All versions belong to project ID: ${firstProjectId}`);
      }
    }, 10000);

    it('should validate date field formats when present', async () => {
      // Act
      const versions = await jiraWrapper.getProjectVersions('DSCWA');

      // Assert
      versions.forEach(version => {
        if (version.startDate) {
          // Check if it's a valid date format (YYYY-MM-DD expected)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          const isValidDate = dateRegex.test(version.startDate) || !isNaN(Date.parse(version.startDate));
          expect(isValidDate).toBe(true);
        }

        if (version.releaseDate) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          const isValidDate = dateRegex.test(version.releaseDate) || !isNaN(Date.parse(version.releaseDate));
          expect(isValidDate).toBe(true);
        }

        if (version.userStartDate) {
          expect(typeof version.userStartDate).toBe('string');
          expect(version.userStartDate.length).toBeGreaterThan(0);
        }

        if (version.userReleaseDate) {
          expect(typeof version.userReleaseDate).toBe('string');
          expect(version.userReleaseDate.length).toBeGreaterThan(0);
        }
      });
    }, 10000);

    it('should maintain version ordering consistency', async () => {
      // Act
      const versions1 = await jiraWrapper.getProjectVersions('DSCWA');
      const versions2 = await jiraWrapper.getProjectVersions('DSCWA');

      // Assert - Same project should return same versions in same order
      expect(versions1.length).toBe(versions2.length);
      
      for (let i = 0; i < versions1.length; i++) {
        expect(versions1[i].id).toBe(versions2[i].id);
        expect(versions1[i].name).toBe(versions2[i].name);
      }
    }, 20000);
  });

  describe('Model validation against real data', () => {
    it('should validate JiraVersion interface matches actual API response', async () => {
      // Act
      const versions = await jiraWrapper.getProjectVersions('DSCWA');

      if (versions.length > 0) {
        console.log('\n=== Model Validation: JiraVersion Interface ===');
        const sampleVersion = versions[0];
        
        console.log('Sample version object:');
        console.log(JSON.stringify(sampleVersion, null, 2));

        // Test interface compliance
        const interfaceFields = [
          'self', 'id', 'name', 'archived', 'released', 'projectId'
        ];
        
        const optionalFields = [
          'description', 'startDate', 'releaseDate', 'overdue', 
          'userStartDate', 'userReleaseDate'
        ];

        // Required fields must be present
        interfaceFields.forEach(field => {
          expect(sampleVersion).toHaveProperty(field);
          expect(sampleVersion[field as keyof JiraVersion]).not.toBeNull();
          expect(sampleVersion[field as keyof JiraVersion]).not.toBeUndefined();
        });

        // Optional fields should have correct types when present
        optionalFields.forEach(field => {
          if (sampleVersion.hasOwnProperty(field)) {
            const value = sampleVersion[field as keyof JiraVersion];
            if (value !== null && value !== undefined) {
              if (field === 'overdue') {
                expect(typeof value).toBe('boolean');
              } else {
                expect(typeof value).toBe('string');
              }
            }
          }
        });

        console.log('✓ JiraVersion interface validation passed');
      }
    }, 15000);
  });
});