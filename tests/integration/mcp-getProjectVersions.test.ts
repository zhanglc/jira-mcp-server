import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';
import { ApiError } from '../../src/types/api-error.js';

// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
// The test will be skipped if JIRA_PERSONAL_TOKEN is not set
describe('MCP Server - getProjectVersions Integration Tests', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log(
        'Skipping MCP Server integration tests - JIRA_PERSONAL_TOKEN not set'
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

  describe('getProjectVersions MCP Tool', () => {
    it('should handle getProjectVersions tool call with valid project key', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetProjectVersions({
        projectKey: 'DSCWA',
      });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      // Parse the JSON response
      const versions = JSON.parse(response.content[0].text);
      expect(Array.isArray(versions)).toBe(true);

      console.log(`\n=== MCP Server getProjectVersions Results ===`);
      console.log(`Found ${versions.length} versions for DSCWA project`);

      if (versions.length > 0) {
        // Validate version structure
        const sampleVersion = versions[0];
        expect(sampleVersion).toHaveProperty('id');
        expect(sampleVersion).toHaveProperty('name');
        expect(sampleVersion).toHaveProperty('self');
        expect(sampleVersion).toHaveProperty('archived');
        expect(sampleVersion).toHaveProperty('released');
        expect(sampleVersion).toHaveProperty('projectId');

        console.log('Sample version from MCP Server:', {
          id: sampleVersion.id,
          name: sampleVersion.name,
          archived: sampleVersion.archived,
          released: sampleVersion.released,
          projectId: sampleVersion.projectId,
        });

        // Validate all versions have required fields
        versions.forEach((version: any) => {
          expect(version.self).toBeDefined();
          expect(version.id).toBeDefined();
          expect(version.name).toBeDefined();
          expect(typeof version.archived).toBe('boolean');
          expect(typeof version.released).toBe('boolean');
          expect(typeof version.projectId).toBe('number');
        });
      }
    }, 30000);

    it('should handle getProjectVersions with missing projectKey parameter', async () => {
      // Act & Assert - Test the handler directly with missing parameter
      await expect(
        (mcpServer as any).handleGetProjectVersions({})
      ).rejects.toThrow(ApiError);
    }, 10000);

    it('should handle getProjectVersions with invalid projectKey type', async () => {
      // Act & Assert - Test the handler directly with invalid parameter
      await expect(
        (mcpServer as any).handleGetProjectVersions({ projectKey: 123 })
      ).rejects.toThrow(ApiError);
    }, 10000);

    it('should handle getProjectVersions with empty projectKey', async () => {
      // Act & Assert - Test the handler directly with empty parameter
      await expect(
        (mcpServer as any).handleGetProjectVersions({ projectKey: '' })
      ).rejects.toThrow(ApiError);
    }, 10000);

    it('should handle getProjectVersions with non-existent project', async () => {
      // Act & Assert - Test the handler directly with non-existent project
      await expect(
        (mcpServer as any).handleGetProjectVersions({
          projectKey: 'NONEXISTENT',
        })
      ).rejects.toThrow(ApiError);
    }, 15000);

    it('should validate MCP response format compliance', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetProjectVersions({
        projectKey: 'DSCWA',
      });

      // Assert MCP protocol compliance
      expect(response).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.any(String),
          }),
        ]),
      });

      // Validate JSON structure
      const jsonText = response.content[0].text;
      expect(() => JSON.parse(jsonText)).not.toThrow();

      const parsedData = JSON.parse(jsonText);
      expect(Array.isArray(parsedData)).toBe(true);

      console.log('\n=== MCP Response Format Validation ===');
      console.log('✓ Response follows MCP protocol structure');
      console.log('✓ Content contains valid JSON');
      console.log('✓ JSON parses to expected array format');
      console.log(`✓ Contains ${parsedData.length} version objects`);
    }, 20000);

    it('should validate version data consistency across MCP calls', async () => {
      // Act - Test the handler directly multiple times
      const response1 = await (mcpServer as any).handleGetProjectVersions({
        projectKey: 'DSCWA',
      });
      const response2 = await (mcpServer as any).handleGetProjectVersions({
        projectKey: 'DSCWA',
      });

      // Parse responses
      const versions1 = JSON.parse(response1.content[0].text);
      const versions2 = JSON.parse(response2.content[0].text);

      // Assert - Same project should return same versions
      expect(versions1.length).toBe(versions2.length);

      if (versions1.length > 0) {
        for (let i = 0; i < versions1.length; i++) {
          expect(versions1[i].id).toBe(versions2[i].id);
          expect(versions1[i].name).toBe(versions2[i].name);
          expect(versions1[i].projectId).toBe(versions2[i].projectId);
        }

        console.log(
          `✓ Version data consistency verified across MCP calls (${versions1.length} versions)`
        );
      }
    }, 25000);
  });

  describe('ListTools Integration', () => {
    it('should include getProjectVersions in MCP server definition', async () => {
      // This test verifies that the getProjectVersions tool is properly defined
      // We can test this by checking if the handler function exists
      expect((mcpServer as any).handleGetProjectVersions).toBeDefined();
      expect(typeof (mcpServer as any).handleGetProjectVersions).toBe(
        'function'
      );

      console.log(
        'getProjectVersions handler successfully defined in MCP Server'
      );
    });
  });

  describe('Error handling in MCP context', () => {
    it('should properly propagate ApiError through MCP layer', async () => {
      try {
        // Act - Test the handler directly with invalid project
        await (mcpServer as any).handleGetProjectVersions({
          projectKey: 'INVALID_PROJECT_KEY',
        });
        fail('Expected ApiError to be thrown');
      } catch (error: any) {
        // Assert
        expect(error).toBeInstanceOf(ApiError);
        console.log('\n=== Error Handling Validation ===');
        console.log(`✓ ApiError properly propagated: ${error.message}`);
      }
    }, 15000);

    it('should handle concurrent requests correctly', async () => {
      // Act - Make multiple concurrent requests to the handler
      const requests = Array(3)
        .fill(null)
        .map(() =>
          (mcpServer as any).handleGetProjectVersions({ projectKey: 'DSCWA' })
        );

      const responses = await Promise.all(requests);

      // Assert
      expect(responses).toHaveLength(3);
      responses.forEach((response: any) => {
        expect(response.content).toBeDefined();
        expect(response.content[0].type).toBe('text');

        const versions = JSON.parse(response.content[0].text);
        expect(Array.isArray(versions)).toBe(true);
      });

      console.log('\n=== Concurrent Request Test ===');
      console.log(
        `✓ Successfully handled ${responses.length} concurrent MCP requests`
      );
    }, 45000);
  });

  describe('Model validation against real data through MCP', () => {
    it('should validate JiraVersion interface matches MCP response data', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetProjectVersions({
        projectKey: 'DSCWA',
      });
      const versions = JSON.parse(response.content[0].text);

      if (versions.length > 0) {
        console.log('\n=== Model Validation via MCP ===');
        const sampleVersion = versions[0];

        console.log('Sample version from MCP response:');
        console.log(JSON.stringify(sampleVersion, null, 2));

        // Test interface compliance via MCP
        const interfaceFields = [
          'self',
          'id',
          'name',
          'archived',
          'released',
          'projectId',
        ];

        const optionalFields = [
          'description',
          'startDate',
          'releaseDate',
          'overdue',
          'userStartDate',
          'userReleaseDate',
        ];

        // Required fields must be present
        interfaceFields.forEach(field => {
          expect(sampleVersion).toHaveProperty(field);
          expect(sampleVersion[field]).not.toBeNull();
          expect(sampleVersion[field]).not.toBeUndefined();
        });

        // Optional fields should have correct types when present
        optionalFields.forEach(field => {
          if (sampleVersion.hasOwnProperty(field)) {
            const value = sampleVersion[field];
            if (value !== null && value !== undefined) {
              if (field === 'overdue') {
                expect(typeof value).toBe('boolean');
              } else {
                expect(typeof value).toBe('string');
              }
            }
          }
        });

        console.log('✓ JiraVersion interface validation passed via MCP');
      }
    }, 15000);
  });
});
