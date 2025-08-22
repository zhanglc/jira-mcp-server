#!/usr/bin/env node

/**
 * Jira Server MCP - Main entry point
 * 
 * This is the main entry point for the Jira Server/Data Center MCP server.
 * It initializes the MCP server with all tools and resources.
 */

import { createMCPServer } from './server.js';
import { loadConfig } from './config/index.js';
import { createLogger } from './lib/utils/logger.js';

async function main(): Promise<void> {
  try {
    // Load configuration
    const config = await loadConfig();
    
    // Create logger
    const logger = createLogger(config);
    logger.info('Starting Jira Server MCP...');
    
    // Create and start MCP server
    const _server = await createMCPServer(config, logger);
    
    // Handle process termination
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });
    
    logger.info('Jira Server MCP started successfully');
    
  } catch (error) {
    console.error('Failed to start Jira Server MCP:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}