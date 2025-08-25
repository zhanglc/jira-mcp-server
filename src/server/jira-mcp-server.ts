import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ReadResourceRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ToolHandler } from './handlers/index.js';
import { getAllTools } from './tools/index.js';
import { logger } from '../utils/logger.js';
import { BackwardCompatibilityLayer } from './backward-compatibility.js';

export class JiraMcpServer {
  private server: Server;
  private toolHandler: ToolHandler;
  private backwardCompatibility: BackwardCompatibilityLayer;

  constructor() {
    this.server = new Server({
      name: 'jira-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    this.toolHandler = new ToolHandler();
    this.backwardCompatibility = new BackwardCompatibilityLayer(this.toolHandler);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.log('ListTools request received');
      return {
        tools: getAllTools()
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.log(`CallTool request: ${name}`, args);

      const result = await this.toolHandler.handleTool(name, args || {});
      return result as any; // Cast to satisfy MCP SDK type requirements
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      logger.log('ListResources request received');
      return {
        resources: []
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.log(`GetResource request: ${uri}`);
      throw new Error(`Resource not found: ${uri}`);
    });
  }

  /**
   * Get the tool handler instance for testing purposes
   */
  getToolHandler(): ToolHandler {
    return this.toolHandler;
  }

  // =============================================================================
  // BACKWARD COMPATIBILITY METHODS FOR TESTS
  // These methods delegate to the BackwardCompatibilityLayer
  // =============================================================================

  async handleGetIssue(args: any) {
    return await this.backwardCompatibility.handleGetIssue(args);
  }

  async handleGetIssueTransitions(args: any) {
    return await this.backwardCompatibility.handleGetIssueTransitions(args);
  }

  async handleSearchIssues(args: any) {
    return await this.backwardCompatibility.handleSearchIssues(args);
  }

  async handleGetIssueWorklogs(args: any) {
    return await this.backwardCompatibility.handleGetIssueWorklogs(args);
  }

  async handleDownloadAttachments(args: any) {
    return await this.backwardCompatibility.handleDownloadAttachments(args);
  }

  async handleGetAllProjects(args: any) {
    return await this.backwardCompatibility.handleGetAllProjects(args);
  }

  async handleGetProject(args: any) {
    return await this.backwardCompatibility.handleGetProject(args);
  }

  async handleGetProjectIssues(args: any) {
    return await this.backwardCompatibility.handleGetProjectIssues(args);
  }

  async handleGetProjectVersions(args: any) {
    return await this.backwardCompatibility.handleGetProjectVersions(args);
  }

  async handleGetCurrentUser(args: any) {
    return await this.backwardCompatibility.handleGetCurrentUser(args);
  }

  async handleGetUserProfile(args: any) {
    return await this.backwardCompatibility.handleGetUserProfile(args);
  }

  async handleGetAgileBoards(args: any) {
    return await this.backwardCompatibility.handleGetAgileBoards(args);
  }

  async handleGetBoardIssues(args: any) {
    return await this.backwardCompatibility.handleGetBoardIssues(args);
  }

  async handleGetSprintsFromBoard(args: any) {
    return await this.backwardCompatibility.handleGetSprintsFromBoard(args);
  }

  async handleGetSprintIssues(args: any) {
    return await this.backwardCompatibility.handleGetSprintIssues(args);
  }

  async handleGetSprint(args: any) {
    return await this.backwardCompatibility.handleGetSprint(args);
  }

  async handleSearchFields(args: any) {
    return await this.backwardCompatibility.handleSearchFields(args);
  }

  async handleGetSystemInfo(args: any) {
    return await this.backwardCompatibility.handleGetSystemInfo(args);
  }

  async handleGetServerInfo(args: any) {
    return await this.backwardCompatibility.handleGetServerInfo(args);
  }

  async connect(transport: any) {
    await this.server.connect(transport);
  }
}