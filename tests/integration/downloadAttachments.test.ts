import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { loadConfig } from '../../src/utils/config.js';
import { ApiError } from '../../src/types/api-error.js';

describe('JiraClientWrapper.downloadAttachments Integration Tests', () => {
  let wrapper: JiraClientWrapper;

  beforeAll(async () => {
    try {
      const config = loadConfig();
      wrapper = new JiraClientWrapper(config);
    } catch (error) {
      console.warn('Skipping integration tests: Missing environment configuration');
    }
  });

  describe('Real Jira Server Integration', () => {
    it('should handle issue without attachments gracefully', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      // Use our known test issue - it might not have attachments
      const result = await wrapper.downloadAttachments('DSCWA-428');
      
      // Should return empty array if no attachments, or array of attachments if they exist
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
      
      console.log(`DSCWA-428 has ${result.length} attachments`);
      
      // If there are attachments, validate their structure
      if (result.length > 0) {
        result.forEach((attachment, index) => {
          console.log(`Attachment ${index + 1}:`, {
            id: attachment.id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
            author: attachment.author.displayName,
            created: attachment.created,
            hasContent: !!attachment.content,
            hasThumbnail: !!attachment.thumbnail
          });

          // Validate required fields
          expect(attachment.id).toBeDefined();
          expect(typeof attachment.id).toBe('string');
          expect(attachment.self).toBeDefined();
          expect(typeof attachment.self).toBe('string');
          expect(attachment.filename).toBeDefined();
          expect(typeof attachment.filename).toBe('string');
          expect(attachment.author).toBeDefined();
          expect(attachment.author.displayName).toBeDefined();
          expect(attachment.created).toBeDefined();
          expect(typeof attachment.created).toBe('string');
          expect(attachment.size).toBeDefined();
          expect(typeof attachment.size).toBe('number');
          expect(attachment.size).toBeGreaterThan(0);
          expect(attachment.mimeType).toBeDefined();
          expect(typeof attachment.mimeType).toBe('string');
          expect(attachment.content).toBeDefined();
          expect(typeof attachment.content).toBe('string');
          expect(attachment.content).toMatch(/^https?:\/\//); // Should be a valid URL

          // Validate optional thumbnail field
          if (attachment.thumbnail) {
            expect(typeof attachment.thumbnail).toBe('string');
            expect(attachment.thumbnail).toMatch(/^https?:\/\//); // Should be a valid URL
          }

          // Validate author structure
          expect(attachment.author.self).toBeDefined();
          expect(attachment.author.name).toBeDefined();
          expect(attachment.author.displayName).toBeDefined();
          expect(attachment.author.emailAddress).toBeDefined();
          expect(typeof attachment.author.active).toBe('boolean');
        });
      }
    }, 30000);

    it('should throw ApiError for non-existent issue', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      await expect(wrapper.downloadAttachments('NONEXISTENT-999999')).rejects.toThrow(ApiError);
    }, 30000);

    it('should handle empty issue key appropriately', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      await expect(wrapper.downloadAttachments('')).rejects.toThrow(ApiError);
    }, 30000);

    it('should handle malformed issue key appropriately', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      await expect(wrapper.downloadAttachments('INVALID_FORMAT')).rejects.toThrow(ApiError);
    }, 30000);

    it('should validate attachment URL format', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      const result = await wrapper.downloadAttachments('DSCWA-428');
      
      if (result.length > 0) {
        result.forEach((attachment) => {
          // Content URL should be properly formatted
          expect(attachment.content).toMatch(/^https?:\/\/.*\/secure\/attachment\/\d+\/.+/);
          
          // If thumbnail exists, it should also be properly formatted
          if (attachment.thumbnail) {
            expect(attachment.thumbnail).toMatch(/^https?:\/\/.*\/secure\/(thumbnail|attachment)\/\d+\/.+/);
          }
        });
        
        console.log('All attachment URLs are properly formatted');
      } else {
        console.log('No attachments found - URL validation skipped');
      }
    }, 30000);

    it('should verify attachment field types match interface', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      const result = await wrapper.downloadAttachments('DSCWA-428');
      
      if (result.length > 0) {
        const attachment = result[0];
        
        // Verify all field types match our JiraAttachment interface
        expect(typeof attachment.id).toBe('string');
        expect(typeof attachment.self).toBe('string');
        expect(typeof attachment.filename).toBe('string');
        expect(typeof attachment.author).toBe('object');
        expect(typeof attachment.created).toBe('string');
        expect(typeof attachment.size).toBe('number');
        expect(typeof attachment.mimeType).toBe('string');
        expect(typeof attachment.content).toBe('string');
        
        if (attachment.thumbnail !== undefined) {
          expect(typeof attachment.thumbnail).toBe('string');
        }
        
        // Verify author object structure
        expect(typeof attachment.author.self).toBe('string');
        expect(typeof attachment.author.name).toBe('string');
        expect(typeof attachment.author.displayName).toBe('string');
        expect(typeof attachment.author.emailAddress).toBe('string');
        expect(typeof attachment.author.active).toBe('boolean');
        
        console.log('All field types match JiraAttachment interface');
      } else {
        console.log('No attachments found - type validation skipped');
      }
    }, 30000);

    it('should handle issue with specific attachment types', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      // Try to find an issue with different types of attachments
      const result = await wrapper.downloadAttachments('DSCWA-428');
      
      if (result.length > 0) {
        // Categorize attachments by type
        const images = result.filter(att => att.mimeType.startsWith('image/'));
        const documents = result.filter(att => att.mimeType.includes('pdf') || att.mimeType.includes('document'));
        const others = result.filter(att => !att.mimeType.startsWith('image/') && !att.mimeType.includes('pdf') && !att.mimeType.includes('document'));
        
        console.log(`Found ${images.length} images, ${documents.length} documents, ${others.length} other files`);
        
        // Images should potentially have thumbnails
        images.forEach(img => {
          console.log(`Image: ${img.filename} (${img.mimeType}), has thumbnail: ${!!img.thumbnail}`);
        });
        
        // All attachments should have valid content URLs
        result.forEach(att => {
          expect(att.content).toMatch(/^https?:\/\//);
        });
      } else {
        console.log('No attachments found in DSCWA-428');
      }
    }, 30000);

    it('should verify download URLs are accessible format', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      const result = await wrapper.downloadAttachments('DSCWA-428');
      
      if (result.length > 0) {
        result.forEach((attachment) => {
          // Verify content URL format matches expected Jira pattern
          const contentUrlPattern = /^https:\/\/[^\/]+\/secure\/attachment\/\d+\/.+/;
          expect(attachment.content).toMatch(contentUrlPattern);
          
          console.log(`Content URL: ${attachment.content}`);
          
          // If thumbnail exists, verify its format
          if (attachment.thumbnail) {
            const thumbnailUrlPattern = /^https:\/\/[^\/]+\/secure\/(thumbnail|attachment)\/\d+\/.+/;
            expect(attachment.thumbnail).toMatch(thumbnailUrlPattern);
            console.log(`Thumbnail URL: ${attachment.thumbnail}`);
          }
        });
      }
    }, 30000);

    it('should handle issues with large numbers of attachments', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      // This test should handle pagination if an issue has many attachments
      const result = await wrapper.downloadAttachments('DSCWA-428');
      
      // Should handle any number of attachments without timeout
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 10) {
        console.log(`Issue has ${result.length} attachments - testing large attachment list handling`);
        
        // Verify all attachments have required fields
        result.forEach((attachment, index) => {
          expect(attachment.id).toBeDefined();
          expect(attachment.filename).toBeDefined();
          expect(attachment.content).toBeDefined();
          
          if (index < 3) { // Log first 3 for verification
            console.log(`Attachment ${index + 1}: ${attachment.filename} (${attachment.size} bytes)`);
          }
        });
      } else {
        console.log(`Issue has ${result.length} attachments (not testing large list scenario)`);
      }
    }, 30000);

    it('should verify API response data model validation', async () => {
      if (!wrapper) {
        console.warn('Skipping: Jira client not configured');
        return;
      }

      const result = await wrapper.downloadAttachments('DSCWA-428');
      
      if (result.length > 0) {
        const attachment = result[0];
        
        // Log actual data structure for documentation
        console.log('Actual attachment data model:', {
          id: attachment.id,
          self: attachment.self,
          filename: attachment.filename,
          authorName: attachment.author.name,
          authorDisplayName: attachment.author.displayName,
          authorEmail: attachment.author.emailAddress,
          created: attachment.created,
          size: attachment.size,
          mimeType: attachment.mimeType,
          contentUrl: attachment.content,
          thumbnailUrl: attachment.thumbnail || 'N/A'
        });
        
        // Validate the model matches our interface expectations
        expect(attachment).toHaveProperty('id');
        expect(attachment).toHaveProperty('self');
        expect(attachment).toHaveProperty('filename');
        expect(attachment).toHaveProperty('author');
        expect(attachment).toHaveProperty('created');
        expect(attachment).toHaveProperty('size');
        expect(attachment).toHaveProperty('mimeType');
        expect(attachment).toHaveProperty('content');
        
        expect(attachment.author).toHaveProperty('self');
        expect(attachment.author).toHaveProperty('name');
        expect(attachment.author).toHaveProperty('displayName');
        expect(attachment.author).toHaveProperty('emailAddress');
        expect(attachment.author).toHaveProperty('active');
        
        console.log('Data model validation completed successfully');
      } else {
        console.log('No attachments found - data model validation skipped');
      }
    }, 30000);
  });
});