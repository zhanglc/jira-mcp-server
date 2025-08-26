#!/usr/bin/env node

import { JiraMcpServer } from './server/jira-mcp-server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new JiraMcpServer();
const transport = new StdioServerTransport();

async function main() {
  try {
    console.log('Starting Jira MCP Server...');
    await server.connect(transport);
    console.log('Jira MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start Jira MCP Server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error in main:', error);
    process.exit(1);
  });
}
