import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Integration test for searchFields MCP tool
// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
describe('MCP Server - searchFields Integration Tests', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log('Skipping MCP Server searchFields integration tests - JIRA_PERSONAL_TOKEN not set');
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

  describe('searchFields MCP Tool', () => {
    test('should return all fields when called without query parameter', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleSearchFields({});

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBe(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');
      
      // Parse the JSON response
      const fieldsText = response.content[0].text;
      expect(typeof fieldsText).toBe('string');
      
      const fields = JSON.parse(fieldsText);
      expect(fields).toBeDefined();
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Validate first field structure
      const firstField = fields[0];
      expect(firstField).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        custom: expect.any(Boolean),
        orderable: expect.any(Boolean),
        navigable: expect.any(Boolean),
        searchable: expect.any(Boolean)
      });

      console.log(`✅ MCP searchFields returned ${fields.length} fields without query`);
    }, 10000);

    test('should filter fields when called with query parameter', async () => {
      // Act - Test the handler directly with summary query
      const response = await (mcpServer as any).handleSearchFields({ query: 'summary' });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      
      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Verify all returned fields contain 'summary' in name or ID
      fields.forEach((field: any) => {
        const nameContainsSummary = field.name.toLowerCase().includes('summary');
        const idContainsSummary = field.id.toLowerCase().includes('summary');
        expect(nameContainsSummary || idContainsSummary).toBe(true);
      });

      console.log(`✅ MCP searchFields returned ${fields.length} fields matching 'summary'`);
      console.log(`   Fields: ${fields.map((f: any) => f.name).join(', ')}`);
    }, 10000);

    test('should filter fields by status query', async () => {
      // Act - Test the handler directly with status query
      const response = await (mcpServer as any).handleSearchFields({ query: 'status' });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      
      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Should contain the main Status field
      const statusField = fields.find((field: any) => field.id === 'status');
      expect(statusField).toBeDefined();
      expect(statusField.name).toBe('Status');
      expect(statusField.custom).toBe(false);

      console.log(`✅ MCP searchFields returned ${fields.length} fields matching 'status'`);
      console.log(`   Status field found: ${statusField ? 'Yes' : 'No'}`);
    }, 10000);

    test('should handle custom field queries', async () => {
      // Act - Test the handler directly with custom query
      const response = await (mcpServer as any).handleSearchFields({ query: 'custom' });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);

      if (fields.length > 0) {
        // If custom fields exist, verify they match the query
        fields.forEach((field: any) => {
          const nameContainsCustom = field.name.toLowerCase().includes('custom');
          const idContainsCustom = field.id.toLowerCase().includes('custom');
          expect(nameContainsCustom || idContainsCustom).toBe(true);
          
          // Most custom fields should have customfield_ ID pattern
          if (field.id.startsWith('customfield_')) {
            expect(field.custom).toBe(true);
          }
        });

        console.log(`✅ MCP searchFields returned ${fields.length} fields matching 'custom'`);
      } else {
        console.log('✅ MCP searchFields returned no fields matching \'custom\' - this is acceptable');
      }
    }, 10000);

    test('should handle empty query by returning all fields', async () => {
      // Act - Test the handler directly with empty query
      const response = await (mcpServer as any).handleSearchFields({ query: '' });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      console.log(`✅ MCP searchFields returned ${fields.length} fields with empty query`);
    }, 10000);

    test('should return empty array for non-existent query', async () => {
      // Act - Test the handler directly with non-existent query
      const response = await (mcpServer as any).handleSearchFields({ query: 'nonexistentfieldxyz123' });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields).toHaveLength(0);

      console.log('✅ MCP searchFields correctly returned empty array for non-existent query');
    }, 10000);
  });

  describe('searchFields error handling', () => {
    test('should reject invalid query parameter type', async () => {
      // Act & Assert - Test the handler directly with invalid parameters
      await expect((mcpServer as any).handleSearchFields({ query: 123 }))
        .rejects.toThrow('query must be a string');

      console.log('✅ MCP searchFields correctly rejected invalid query type');
    });

    test('should handle undefined arguments gracefully', async () => {
      // Act - Test the handler directly with undefined arguments
      const response = await (mcpServer as any).handleSearchFields(undefined);

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      console.log('✅ MCP searchFields handled undefined arguments gracefully');
    }, 10000);

    test('should handle null arguments gracefully', async () => {
      // Act - Test the handler directly with null arguments
      const response = await (mcpServer as any).handleSearchFields(null);

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      console.log('✅ MCP searchFields handled null arguments gracefully');
    }, 10000);
  });

  describe('searchFields response format validation', () => {
    test('should return properly formatted MCP response', async () => {
      // Act - Test the handler directly with assignee query
      const response = await (mcpServer as any).handleSearchFields({ query: 'assignee' });

      // Assert
      expect(response).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.any(String)
          })
        ])
      });

      // Validate JSON structure
      const jsonText = response.content[0].text;
      expect(() => JSON.parse(jsonText)).not.toThrow();

      const fields = JSON.parse(jsonText);
      expect(Array.isArray(fields)).toBe(true);

      // Validate each field has required properties
      fields.forEach((field: any) => {
        expect(field).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          custom: expect.any(Boolean),
          orderable: expect.any(Boolean),
          navigable: expect.any(Boolean),
          searchable: expect.any(Boolean)
        });
      });

      console.log('✅ MCP searchFields response format validation passed');
    }, 10000);

    test('should validate field schema structure in response', async () => {
      // Act - Test the handler directly with summary query
      const response = await (mcpServer as any).handleSearchFields({ query: 'summary' });

      // Assert
      const fields = JSON.parse(response.content[0].text);
      expect(fields.length).toBeGreaterThan(0);

      const summaryField = fields.find((field: any) => field.id === 'summary');
      expect(summaryField).toBeDefined();
      expect(summaryField.name).toBe('Summary');
      expect(summaryField.custom).toBe(false);
      expect(summaryField.searchable).toBe(true);

      if (summaryField.schema) {
        expect(summaryField.schema).toMatchObject({
          type: expect.any(String)
        });
        
        if (summaryField.schema.system) {
          expect(summaryField.schema.system).toBe('summary');
        }
      }

      if (summaryField.clauseNames) {
        expect(Array.isArray(summaryField.clauseNames)).toBe(true);
        expect(summaryField.clauseNames).toContain('summary');
      }

      console.log('✅ MCP searchFields schema validation passed for Summary field');
    }, 10000);

    test('should return well-formed JSON that can be parsed by MCP clients', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleSearchFields({ query: 'priority' });
      const fieldsText = response.content[0].text;

      // Assert - JSON formatting validation
      expect(() => JSON.parse(fieldsText)).not.toThrow();
      
      const fields = JSON.parse(fieldsText);
      const reformattedJson = JSON.stringify(fields, null, 2);
      
      // Verify it's properly formatted JSON (matches our formatting)
      expect(fieldsText).toBe(reformattedJson);
      
      // Verify all expected fields are present and properly typed
      if (fields.length > 0) {
        const firstField = fields[0];
        expect(typeof firstField.id).toBe('string');
        expect(typeof firstField.name).toBe('string');
        expect(typeof firstField.custom).toBe('boolean');
        expect(typeof firstField.orderable).toBe('boolean');
        expect(typeof firstField.navigable).toBe('boolean');
        expect(typeof firstField.searchable).toBe('boolean');
      }
      
      console.log('✅ MCP JSON formatting validation passed');
    }, 10000);
  });

  describe('searchFields performance and reliability', () => {
    test('should maintain consistent response times', async () => {
      // Act
      const startTime = Date.now();
      
      const response = await (mcpServer as any).handleSearchFields({ query: 'project' });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(response).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      const fields = JSON.parse(response.content[0].text);
      expect(Array.isArray(fields)).toBe(true);

      console.log(`✅ MCP searchFields completed in ${duration}ms`);
    }, 15000);

    test('should validate parameter validation works correctly', async () => {
      // Act & Assert - Test empty parameters (should work)
      const validResponse = await (mcpServer as any).handleSearchFields({});
      expect(validResponse).toBeDefined();
      expect(validResponse.content).toBeDefined();

      // Act & Assert - Test null parameters (should work)
      const nullResponse = await (mcpServer as any).handleSearchFields(null);
      expect(nullResponse).toBeDefined();
      expect(nullResponse.content).toBeDefined();

      // Act & Assert - Test with valid query (should work)
      const queryResponse = await (mcpServer as any).handleSearchFields({ query: 'assignee' });
      expect(queryResponse).toBeDefined();
      expect(queryResponse.content).toBeDefined();

      // Act & Assert - Test with invalid query type (should fail)
      await expect((mcpServer as any).handleSearchFields({ query: 123 }))
        .rejects.toThrow('query must be a string');
      
      console.log('✅ Parameter validation working correctly');
    });
  });

  describe('ListTools Integration', () => {
    test('should include searchFields in MCP server definition', async () => {
      // This test verifies that the searchFields tool is properly defined
      // We can test this by checking if the handler function exists
      expect((mcpServer as any).handleSearchFields).toBeDefined();
      expect(typeof (mcpServer as any).handleSearchFields).toBe('function');
      
      console.log('✅ searchFields handler successfully defined in MCP Server');
    });

    test('should provide comprehensive field information for MCP clients', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleSearchFields({});
      const fields = JSON.parse(response.content[0].text);

      // Assert - Verify we have a good variety of field types
      const systemFields = fields.filter((field: any) => !field.custom);
      const customFields = fields.filter((field: any) => field.custom);
      const searchableFields = fields.filter((field: any) => field.searchable);
      const orderableFields = fields.filter((field: any) => field.orderable);

      expect(systemFields.length).toBeGreaterThan(0);
      expect(searchableFields.length).toBeGreaterThan(0);
      expect(orderableFields.length).toBeGreaterThan(0);

      // Log field summary for MCP context
      console.log('🔍 MCP Field Information Summary:');
      console.log(`   Tool: searchFields`);
      console.log(`   Total Fields: ${fields.length}`);
      console.log(`   System Fields: ${systemFields.length}`);
      console.log(`   Custom Fields: ${customFields.length}`);
      console.log(`   Searchable Fields: ${searchableFields.length}`);
      console.log(`   Orderable Fields: ${orderableFields.length}`);
      
      console.log('✅ MCP field information summary completed');
    }, 10000);
  });
});