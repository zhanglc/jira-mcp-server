# Jira MCP Server

A Model Context Protocol (MCP) server implementation for Jira Server/Data Center, providing AI assistants with secure access to Jira data through 19 comprehensive tools.

## ✨ Features

- **19 MCP Tools** for comprehensive Jira data access
- **Jira Server/DC Only** - No cloud dependencies
- **PAT Authentication** - Secure personal access token authentication
- **Type-Safe** - Full TypeScript implementation with 95%+ test coverage
- **Production Ready** - 624 passing tests with real Jira Server validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Jira Server/Data Center instance
- Personal Access Token (PAT) for authentication

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd jira-mcp-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Jira Server details
```

### Configuration

Create a `.env` file with your Jira Server configuration:

```env
JIRA_URL=https://your-jira-server.com
JIRA_USERNAME=your.email@company.com
JIRA_PERSONAL_TOKEN=your_personal_access_token
TEST_ISSUE_KEY=PROJECT-123
```

### Running the MCP Server

```bash
# Build the project
npm run build

# Start the MCP server
node dist/index.js
```

For Claude Desktop, add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/path/to/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "https://your-jira-server.com",
        "JIRA_USERNAME": "your.email@company.com", 
        "JIRA_PERSONAL_TOKEN": "your_personal_access_token"
      }
    }
  }
}
```

## 🛠️ Available Tools

### Issue Management
- **getIssue** - Get detailed issue information
- **searchIssues** - Search issues using JQL (Jira Query Language)
- **getIssueTransitions** - Get available status transitions
- **getIssueWorklogs** - Get work log entries
- **downloadAttachments** - Get attachment metadata

### Project Management  
- **getAllProjects** - List all accessible projects
- **getProject** - Get detailed project information
- **getProjectIssues** - Get all issues for a project
- **getProjectVersions** - Get project versions/releases

### User Management
- **getCurrentUser** - Get current authenticated user info
- **getUserProfile** - Get user profile by username/email

### Agile/Scrum Tools
- **getAgileBoards** - List Scrum/Kanban boards
- **getBoardIssues** - Get issues from a specific board
- **getSprintsFromBoard** - Get sprints from a board
- **getSprintIssues** - Get issues from a specific sprint
- **getSprint** - Get detailed sprint information

### System Tools
- **searchFields** - Search available Jira fields
- **getSystemInfo** - Get Jira system information
- **getServerInfo** - Get server runtime information

## 📖 Usage Examples

### Basic Issue Search
```typescript
// Search for recent issues in a project
{
  "tool": "searchIssues",
  "arguments": {
    "jql": "project = MYPROJ AND created >= -7d ORDER BY created DESC",
    "maxResults": 10
  }
}
```

### Get Project Issues with Pagination
```typescript
{
  "tool": "getProjectIssues", 
  "arguments": {
    "projectKey": "MYPROJ",
    "startAt": 0,
    "maxResults": 50,
    "fields": ["summary", "status", "assignee", "priority"]
  }
}
```

### Sprint Analysis
```typescript
// Get current sprint for a board
{
  "tool": "getSprintsFromBoard",
  "arguments": {
    "boardId": 123
  }
}

// Get issues in current sprint  
{
  "tool": "getSprintIssues",
  "arguments": {
    "sprintId": 456,
    "fields": ["summary", "status", "assignee", "storyPoints"]
  }
}
```

## 🧪 Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run type checking
npm run typecheck

# Verify Jira connection
node scripts/verify-connection.js
```

### Project Structure
```
src/
├── client/              # Jira API client wrapper
├── server/             # MCP server implementation  
│   ├── handlers/       # Request handlers
│   └── tools/          # MCP tool definitions
├── types/              # TypeScript type definitions
└── utils/              # Utilities and configuration

tests/
├── unit/               # Unit tests
└── integration/        # Integration tests with real Jira
```

## 🛠️ Technology Stack

### Runtime Dependencies
- **@modelcontextprotocol/sdk** ^1.17.4 - Official MCP SDK
- **jira-client** ^8.2.2 - Mature Jira REST API client
- **dotenv** ^17.2.1 - Environment configuration
- **zod** ^3.25.76 - Runtime type validation

### Development Tools
- **TypeScript** ^5.7.2 - Type safety and modern JavaScript
- **Jest** ^29.7.0 - Testing framework
- **ESLint + Prettier** - Code quality and formatting

## 📚 Documentation

- [**Implementation Plan**](./docs/IMPLEMENTATION_PLAN.md) - Complete development roadmap
- [**MCP Architecture**](./docs/MCP_ARCHITECTURE.md) - Technical architecture details  
- [**Phase 1 User Guide**](./docs/PHASE1_USER_GUIDE.md) - Detailed usage guide

## 🔐 Security

- **PAT Authentication Only** - No password storage
- **No Write Operations** - Read-only access in Phase 1
- **Environment Variables** - Secure credential management
- **Type Validation** - Runtime input validation with Zod

## 🚧 Roadmap

### Phase 1 ✅ (Current)
- 19 core read-only MCP tools
- Comprehensive test coverage (624 tests)
- Production-ready with real Jira Server validation

### Phase 2 (Planned)
- Write operations (create/update issues)
- Comment and worklog management  
- Status transitions and field updates

### Phase 3 (Future)
- Batch operations
- Advanced caching
- Custom field management
- Performance optimizations

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## 🆘 Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Documentation**: Check the `docs/` directory for detailed guides
- **Testing**: Run `node scripts/verify-connection.js` to test your setup