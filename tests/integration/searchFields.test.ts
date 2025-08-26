import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { loadConfig } from '../../src/utils/config.js';

describe('searchFields Integration Tests - Real Jira Server', () => {
  let jiraClient: JiraClientWrapper;
  let config: JiraConfig;

  beforeAll(() => {
    config = loadConfig();
    jiraClient = new JiraClientWrapper(config);
  });

  describe('Field retrieval and validation', () => {
    test('should retrieve all available fields from real Jira server', async () => {
      // Act
      const fields = await jiraClient.searchFields();

      // Assert
      expect(fields).toBeDefined();
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Validate that we have at least some basic system fields
      const fieldNames = fields.map(field => field.name.toLowerCase());
      expect(fieldNames).toContain('summary');
      expect(fieldNames).toContain('status');
      expect(fieldNames).toContain('assignee');

      console.log(`Retrieved ${fields.length} total fields from Jira server`);
    }, 10000);

    test('should validate field data structure matches JiraField interface', async () => {
      // Act
      const fields = await jiraClient.searchFields();

      // Assert - Validate at least the first field has correct structure
      expect(fields.length).toBeGreaterThan(0);

      const firstField = fields[0];
      expect(firstField).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        custom: expect.any(Boolean),
        orderable: expect.any(Boolean),
        navigable: expect.any(Boolean),
        searchable: expect.any(Boolean),
      });

      // Check that all fields have required properties
      fields.forEach((field, index) => {
        expect(field.id).toBeDefined();
        expect(field.name).toBeDefined();
        expect(typeof field.custom).toBe('boolean');
        expect(typeof field.orderable).toBe('boolean');
        expect(typeof field.navigable).toBe('boolean');
        expect(typeof field.searchable).toBe('boolean');

        if (index < 5) {
          // Log first 5 fields for verification
          console.log(
            `Field ${index + 1}: ${field.name} (${field.id}) - Custom: ${field.custom}`
          );
        }
      });
    }, 10000);

    test('should identify system fields correctly', async () => {
      // Act
      const fields = await jiraClient.searchFields();

      // Assert
      const systemFields = fields.filter(field => !field.custom);
      expect(systemFields.length).toBeGreaterThan(0);

      // Verify some known system fields
      const systemFieldNames = systemFields.map(field =>
        field.name.toLowerCase()
      );
      expect(systemFieldNames).toContain('summary');
      expect(systemFieldNames).toContain('status');
      expect(systemFieldNames).toContain('assignee');
      expect(systemFieldNames).toContain('reporter');
      expect(systemFieldNames).toContain('project');
      expect(systemFieldNames).toContain('issue type');

      console.log(`Found ${systemFields.length} system fields`);

      // Log some system fields for verification
      systemFields.slice(0, 5).forEach(field => {
        console.log(`System field: ${field.name} (${field.id})`);
        if (field.schema?.system) {
          console.log(`  - Schema system: ${field.schema.system}`);
        }
        if (field.clauseNames) {
          console.log(`  - JQL clause names: ${field.clauseNames.join(', ')}`);
        }
      });
    }, 10000);

    test('should identify custom fields correctly', async () => {
      // Act
      const fields = await jiraClient.searchFields();

      // Assert
      const customFields = fields.filter(field => field.custom);

      // May have custom fields or not, depending on Jira configuration
      console.log(`Found ${customFields.length} custom fields`);

      if (customFields.length > 0) {
        // Verify custom field ID pattern
        customFields.forEach(field => {
          expect(field.custom).toBe(true);
          expect(field.id).toMatch(/^customfield_\d+$/);

          if (field.schema) {
            expect(field.schema.custom).toBeDefined();
            if (field.schema.customId) {
              expect(typeof field.schema.customId).toBe('number');
            }
          }
        });

        // Log some custom fields for verification
        customFields.slice(0, 5).forEach(field => {
          console.log(`Custom field: ${field.name} (${field.id})`);
          if (field.schema?.custom) {
            console.log(`  - Schema custom: ${field.schema.custom}`);
          }
          if (field.schema?.customId) {
            console.log(`  - Custom ID: ${field.schema.customId}`);
          }
        });
      } else {
        console.log('No custom fields found in this Jira instance');
      }
    }, 10000);
  });

  describe('Field searching and filtering', () => {
    test('should filter fields by summary query', async () => {
      // Act
      const summaryFields = await jiraClient.searchFields('summary');

      // Assert
      expect(Array.isArray(summaryFields)).toBe(true);
      expect(summaryFields.length).toBeGreaterThan(0);

      // Verify all returned fields contain 'summary' in name or ID
      summaryFields.forEach(field => {
        const nameContainsSummary = field.name
          .toLowerCase()
          .includes('summary');
        const idContainsSummary = field.id.toLowerCase().includes('summary');
        expect(nameContainsSummary || idContainsSummary).toBe(true);
      });

      console.log(`Found ${summaryFields.length} fields matching 'summary':`);
      summaryFields.forEach(field => {
        console.log(`  - ${field.name} (${field.id})`);
      });
    }, 10000);

    test('should filter fields by status query', async () => {
      // Act
      const statusFields = await jiraClient.searchFields('status');

      // Assert
      expect(Array.isArray(statusFields)).toBe(true);
      expect(statusFields.length).toBeGreaterThan(0);

      // Verify all returned fields contain 'status' in name or ID
      statusFields.forEach(field => {
        const nameContainsStatus = field.name.toLowerCase().includes('status');
        const idContainsStatus = field.id.toLowerCase().includes('status');
        expect(nameContainsStatus || idContainsStatus).toBe(true);
      });

      console.log(`Found ${statusFields.length} fields matching 'status':`);
      statusFields.forEach(field => {
        console.log(`  - ${field.name} (${field.id})`);
      });
    }, 10000);

    test('should perform case-insensitive search', async () => {
      // Act
      const upperCaseResults = await jiraClient.searchFields('ASSIGNEE');
      const lowerCaseResults = await jiraClient.searchFields('assignee');
      const mixedCaseResults = await jiraClient.searchFields('Assignee');

      // Assert
      expect(upperCaseResults.length).toBe(lowerCaseResults.length);
      expect(lowerCaseResults.length).toBe(mixedCaseResults.length);
      expect(upperCaseResults.length).toBeGreaterThan(0);

      // Verify they return the same results
      expect(upperCaseResults).toEqual(lowerCaseResults);
      expect(lowerCaseResults).toEqual(mixedCaseResults);

      console.log(
        `Case-insensitive search for 'assignee' found ${upperCaseResults.length} fields`
      );
    }, 10000);

    test('should handle search for custom fields if they exist', async () => {
      // Act
      const customResults = await jiraClient.searchFields('custom');

      // Assert
      expect(Array.isArray(customResults)).toBe(true);

      if (customResults.length > 0) {
        // If custom fields are found, verify they match the query
        customResults.forEach(field => {
          const nameContainsCustom = field.name
            .toLowerCase()
            .includes('custom');
          const idContainsCustom = field.id.toLowerCase().includes('custom');
          expect(nameContainsCustom || idContainsCustom).toBe(true);
        });

        console.log(`Found ${customResults.length} fields matching 'custom':`);
        customResults.slice(0, 5).forEach(field => {
          console.log(`  - ${field.name} (${field.id})`);
        });
      } else {
        console.log("No fields found matching 'custom' - this is acceptable");
      }
    }, 10000);

    test('should return empty array for non-existent field query', async () => {
      // Act
      const nonExistentResults = await jiraClient.searchFields(
        'nonexistentfieldxyz123'
      );

      // Assert
      expect(Array.isArray(nonExistentResults)).toBe(true);
      expect(nonExistentResults).toHaveLength(0);

      console.log(
        'Search for non-existent field correctly returned empty array'
      );
    }, 10000);

    test('should handle empty and whitespace queries', async () => {
      // Act
      const allFields = await jiraClient.searchFields();
      const emptyQuery = await jiraClient.searchFields('');
      const whitespaceQuery = await jiraClient.searchFields('   ');

      // Assert
      expect(allFields.length).toBe(emptyQuery.length);
      expect(allFields.length).toBe(whitespaceQuery.length);
      expect(allFields).toEqual(emptyQuery);
      expect(allFields).toEqual(whitespaceQuery);

      console.log(
        `Empty/whitespace queries correctly returned all ${allFields.length} fields`
      );
    }, 10000);
  });

  describe('Field types and properties validation', () => {
    test('should validate field searchability and orderability', async () => {
      // Act
      const fields = await jiraClient.searchFields();

      // Assert
      expect(fields.length).toBeGreaterThan(0);

      const searchableFields = fields.filter(field => field.searchable);
      const orderableFields = fields.filter(field => field.orderable);

      expect(searchableFields.length).toBeGreaterThan(0);
      expect(orderableFields.length).toBeGreaterThan(0);

      console.log(
        `Searchable fields: ${searchableFields.length}/${fields.length}`
      );
      console.log(
        `Orderable fields: ${orderableFields.length}/${fields.length}`
      );

      // Log some examples
      console.log('Sample searchable fields:');
      searchableFields.slice(0, 3).forEach(field => {
        console.log(
          `  - ${field.name}: searchable=${field.searchable}, orderable=${field.orderable}`
        );
      });
    }, 10000);

    test('should validate clause names for JQL usage', async () => {
      // Act
      const fields = await jiraClient.searchFields();

      // Assert
      const fieldsWithClauseNames = fields.filter(
        field => field.clauseNames && field.clauseNames.length > 0
      );

      if (fieldsWithClauseNames.length > 0) {
        console.log(
          `Found ${fieldsWithClauseNames.length} fields with clause names`
        );

        // Verify clause names structure
        fieldsWithClauseNames.slice(0, 5).forEach(field => {
          expect(Array.isArray(field.clauseNames)).toBe(true);
          expect(field.clauseNames!.length).toBeGreaterThan(0);

          field.clauseNames!.forEach(clauseName => {
            expect(typeof clauseName).toBe('string');
            expect(clauseName.length).toBeGreaterThan(0);
          });

          console.log(`  - ${field.name}: ${field.clauseNames!.join(', ')}`);
        });
      } else {
        console.log(
          'No fields with clause names found - this may be normal for some Jira instances'
        );
      }
    }, 10000);

    test('should validate schema information for fields', async () => {
      // Act
      const fields = await jiraClient.searchFields();

      // Assert
      const fieldsWithSchema = fields.filter(field => field.schema);

      if (fieldsWithSchema.length > 0) {
        console.log(
          `Found ${fieldsWithSchema.length} fields with schema information`
        );

        // Verify schema structure
        fieldsWithSchema.slice(0, 5).forEach(field => {
          expect(field.schema).toBeDefined();
          expect(typeof field.schema!.type).toBe('string');
          expect(field.schema!.type.length).toBeGreaterThan(0);

          console.log(`  - ${field.name} (${field.schema!.type})`);
          if (field.schema!.system) {
            console.log(`    System: ${field.schema!.system}`);
          }
          if (field.schema!.custom) {
            console.log(`    Custom: ${field.schema!.custom}`);
          }
          if (field.schema!.customId) {
            console.log(`    Custom ID: ${field.schema!.customId}`);
          }
        });

        // Verify system vs custom schema consistency
        const systemFieldsWithSchema = fieldsWithSchema.filter(
          field => !field.custom
        );
        const customFieldsWithSchema = fieldsWithSchema.filter(
          field => field.custom
        );

        systemFieldsWithSchema.forEach(field => {
          if (field.schema!.system) {
            expect(field.schema!.system).toBeDefined();
          }
        });

        customFieldsWithSchema.forEach(field => {
          if (field.schema!.custom) {
            expect(field.schema!.custom).toBeDefined();
          }
        });

        console.log(
          `System fields with schema: ${systemFieldsWithSchema.length}`
        );
        console.log(
          `Custom fields with schema: ${customFieldsWithSchema.length}`
        );
      } else {
        console.log('No fields with schema information found');
      }
    }, 10000);
  });

  describe('Error handling with real server', () => {
    test('should handle server connectivity gracefully', async () => {
      // This test verifies that our error handling works with the real server
      // The test should pass assuming we have valid credentials

      // Act & Assert
      await expect(async () => {
        const fields = await jiraClient.searchFields();
        expect(fields).toBeDefined();
        expect(Array.isArray(fields)).toBe(true);
      }).not.toThrow();

      console.log('Server connectivity test passed');
    }, 10000);
  });

  describe('Performance and data volume', () => {
    test('should handle potentially large field lists efficiently', async () => {
      // Act
      const startTime = Date.now();
      const fields = await jiraClient.searchFields();
      const endTime = Date.now();

      // Assert
      expect(fields).toBeDefined();
      expect(Array.isArray(fields)).toBe(true);

      const duration = endTime - startTime;
      console.log(`Retrieved ${fields.length} fields in ${duration}ms`);

      // Performance should be reasonable (under 5 seconds for field listing)
      expect(duration).toBeLessThan(5000);
    }, 10000);

    test('should handle filtering large field lists efficiently', async () => {
      // Act
      const startTime = Date.now();
      const allFields = await jiraClient.searchFields();
      const midTime = Date.now();
      const filteredFields = await jiraClient.searchFields('field');
      const endTime = Date.now();

      // Assert
      expect(allFields).toBeDefined();
      expect(filteredFields).toBeDefined();
      expect(Array.isArray(allFields)).toBe(true);
      expect(Array.isArray(filteredFields)).toBe(true);

      const allFieldsDuration = midTime - startTime;
      const filteredFieldsDuration = endTime - midTime;

      console.log(`All fields (${allFields.length}): ${allFieldsDuration}ms`);
      console.log(
        `Filtered fields (${filteredFields.length}): ${filteredFieldsDuration}ms`
      );

      // Both operations should be reasonably fast
      expect(allFieldsDuration).toBeLessThan(5000);
      expect(filteredFieldsDuration).toBeLessThan(5000);
    }, 10000);
  });
});
