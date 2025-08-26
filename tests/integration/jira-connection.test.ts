import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { loadConfig } from '../../src/utils/config.js';

describe('Jira Integration Tests', () => {
  let jiraClient: JiraClientWrapper;

  beforeAll(() => {
    try {
      const config = loadConfig();
      jiraClient = new JiraClientWrapper(config);
    } catch (error) {
      console.warn(
        'Skipping integration tests: Missing environment configuration'
      );
    }
  });

  test('should connect to real Jira server and get issue DSCWA-428', async () => {
    if (!jiraClient) {
      console.warn('Skipping: Jira client not configured');
      return;
    }

    const issue = await jiraClient.getIssue('DSCWA-428');

    expect(issue).toBeDefined();
    expect(issue.key).toBe('DSCWA-428');
    expect(issue.fields).toBeDefined();
    expect(issue.fields.summary).toBeDefined();

    console.log(
      `Successfully retrieved issue: ${issue.key} - ${issue.fields.summary}`
    );
  }, 10000);

  test('should get issue DSCWA-428 with specific fields', async () => {
    if (!jiraClient) {
      console.warn('Skipping: Jira client not configured');
      return;
    }

    const fields = ['summary', 'status', 'assignee', 'project'];
    const issue = await jiraClient.getIssue('DSCWA-428', fields);

    expect(issue).toBeDefined();
    expect(issue.key).toBe('DSCWA-428');
    expect(issue.fields).toBeDefined();
    expect(issue.fields.summary).toBeDefined();
    expect(issue.fields.status).toBeDefined();
    expect(issue.fields.project).toBeDefined();

    console.log(
      `Issue with specific fields: ${issue.key} - Status: ${issue.fields.status.name}`
    );
  }, 10000);
});
