import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Integration test for downloadAttachments MCP tool
// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
describe('MCP Server - downloadAttachments Integration Tests', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log('Skipping MCP Server downloadAttachments integration tests - JIRA_PERSONAL_TOKEN not set');
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

  describe('downloadAttachments MCP Tool', () => {
    it('should successfully get attachments for a valid issue via MCP handler', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleDownloadAttachments({
        issueKey: 'DSCWA-428'
      });

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBe(1);
    expect(response.content[0].type).toBe('text');

    // Parse the JSON response
    const attachments = JSON.parse(response.content[0].text);
    expect(Array.isArray(attachments)).toBe(true);
    
    console.log(`MCP tool returned ${attachments.length} attachments for DSCWA-428`);

    // If there are attachments, validate their structure
    if (attachments.length > 0) {
      attachments.forEach((attachment: any, index: number) => {
        console.log(`MCP Attachment ${index + 1}:`, {
          id: attachment.id,
          filename: attachment.filename,
          size: attachment.size,
          mimeType: attachment.mimeType,
          author: attachment.author.displayName,
          created: attachment.created,
          hasContent: !!attachment.content,
          hasThumbnail: !!attachment.thumbnail
        });

        // Validate required fields are present
        expect(attachment.id).toBeDefined();
        expect(attachment.self).toBeDefined();
        expect(attachment.filename).toBeDefined();
        expect(attachment.author).toBeDefined();
        expect(attachment.created).toBeDefined();
        expect(attachment.size).toBeDefined();
        expect(attachment.mimeType).toBeDefined();
        expect(attachment.content).toBeDefined();
      });
    }
  }, 30000);

    it('should throw appropriate error for non-existent issue via MCP handler', async () => {
      // This should throw an error
      await expect((mcpServer as any).handleDownloadAttachments({
        issueKey: 'NONEXISTENT-999999'
      })).rejects.toThrow();
    }, 30000);

    it('should throw appropriate error for missing issueKey via MCP handler', async () => {
      // This should throw an error
      await expect((mcpServer as any).handleDownloadAttachments({})).rejects.toThrow();
    }, 30000);

    it('should throw appropriate error for invalid issueKey type via MCP handler', async () => {
      // This should throw an error
      await expect((mcpServer as any).handleDownloadAttachments({
        issueKey: 123 // Should be string
      })).rejects.toThrow();
    }, 30000);

    it('should validate MCP handler response format', async () => {
      const response = await (mcpServer as any).handleDownloadAttachments({
        issueKey: 'DSCWA-428'
      });

    // Validate response structure follows MCP protocol
    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type');
    expect(response.content[0].type).toBe('text');
    expect(response.content[0]).toHaveProperty('text');
    
    // Validate the text is valid JSON
    expect(() => JSON.parse(response.content[0].text)).not.toThrow();
    
    const attachments = JSON.parse(response.content[0].text);
    expect(Array.isArray(attachments)).toBe(true);
    
      console.log('MCP handler response validation completed successfully');
    }, 30000);

    it('should handle edge cases consistently via MCP handler', async () => {
      // Test empty string
      await expect((mcpServer as any).handleDownloadAttachments({
        issueKey: ''
      })).rejects.toThrow();

      // Test whitespace-only string  
      await expect((mcpServer as any).handleDownloadAttachments({
        issueKey: '   '
      })).rejects.toThrow();
    }, 30000);

    it('should maintain consistent data format with direct API calls', async () => {
      // Test MCP handler call
      const mcpResponse = await (mcpServer as any).handleDownloadAttachments({
        issueKey: 'DSCWA-428'
      });
      const mcpAttachments = JSON.parse(mcpResponse.content[0].text);

      // Test direct API call (if possible)
      const jiraClient = (mcpServer as any).jiraClient;
      if (jiraClient) {
        const directAttachments = await jiraClient.downloadAttachments('DSCWA-428');
        
        // Compare results
        expect(mcpAttachments.length).toBe(directAttachments.length);
        expect(JSON.stringify(mcpAttachments)).toBe(JSON.stringify(directAttachments));
        
        console.log('MCP handler response matches direct API call response');
      } else {
        console.log('Direct API comparison skipped - jiraClient not initialized');
      }
    }, 30000);
  });
});