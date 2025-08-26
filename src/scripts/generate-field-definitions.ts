import * as fs from 'fs/promises';
import { JiraClientWrapper } from '../client/jira-client-wrapper.js';
import { config } from '../utils/config.js';

/**
 * Fetches a sample issue from Jira and saves it to JSON file for analysis
 * Uses configurable issue key via SAMPLE_ISSUE_KEY environment variable
 * Defaults to the representative issue DSCWA-373 for field structure analysis
 */
export async function getSampleIssue(): Promise<void> {
  const client = new JiraClientWrapper(config);
  const issueKey = process.env.SAMPLE_ISSUE_KEY || 'DSCWA-373';

  try {
    // Ensure output directory exists
    await fs.mkdir('data', { recursive: true });

    const issue = await client.getIssue(issueKey);
    const outputPath = 'data/sample-issue.json';

    await fs.writeFile(outputPath, JSON.stringify(issue, null, 2));
    console.log(`Sample issue saved to ${outputPath}`);

    // Generate field statistics
    const fieldCount = Object.keys(issue.fields).length;
    const customFields = Object.keys(issue.fields).filter(key =>
      key.startsWith('customfield_')
    );

    console.log(`Total fields: ${fieldCount}`);
    console.log(`Custom fields: ${customFields.length}`);
    console.log(`System fields: ${fieldCount - customFields.length}`);
  } catch (error) {
    console.error('Error generating sample issue:', error);
    throw error;
  }
}

// CLI interface - only run if this file is executed directly
// Check if running as main module (not being imported)
const isMainModule =
  process.argv[1] && process.argv[1].endsWith('generate-field-definitions.ts');
if (isMainModule) {
  getSampleIssue().catch(console.error);
}
