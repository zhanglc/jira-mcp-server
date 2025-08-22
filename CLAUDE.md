# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with hot reload using tsx
- `npm run build` - Build TypeScript to JavaScript (uses tsconfig.build.json)
- `npm run build:watch` - Build with watch mode
- `npm start` - Run the built application

### Testing
- `npm test` - Run all tests using Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- Tests are located in `tests/` directory with pattern `**/*.test.ts` and `**/*.spec.ts`

### Code Quality
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking without emitting files

### Utilities
- `npm run clean` - Remove dist directory
- `npm run prepare` - Build before publishing (runs automatically)

## Architecture

This is a **Jira Server/Data Center MCP (Model Context Protocol) server** implementation in TypeScript. It focuses on read-only operations in Phase 1, providing AI assistants with secure access to Jira Server data.

### Core Structure
- **Entry Point**: `src/index.ts` - Main application entry with MCP server initialization
- **MCP Server**: `src/server.ts` - Core MCP server logic, tool and resource registration
- **Configuration**: `src/config/` - Environment-based config management with Zod validation
- **Jira Integration**: `src/lib/jira/` - Jira Server API wrapper layer
- **HTTP Client**: `src/lib/client/` - Generic HTTP client with PAT authentication
- **MCP Tools**: `src/tools/` - MCP tool implementations (search, operations)
- **MCP Resources**: `src/resources/` - Field definition resources for tools
- **Type System**: `src/types/` - Comprehensive TypeScript definitions

### Key Features
- **Authentication**: PAT (Personal Access Token) only - configured via `JIRA_PERSONAL_TOKEN`
- **Field Selection**: Tools support field filtering with dot notation (e.g., `assignee.displayName`)
- **Server/DC Focus**: Designed specifically for Jira Server/Data Center (not Cloud)
- **Path Aliases**: Uses `@/` prefix for imports (configured in tsconfig.json and jest.config.js)

### Configuration
Environment variables (see `.env.example`):
- `JIRA_URL` - Jira Server URL (required)
- `JIRA_PERSONAL_TOKEN` - PAT token (required)
- `JIRA_SSL_VERIFY` - SSL verification for self-signed certificates
- `JIRA_TIMEOUT` - Request timeout in milliseconds
- `JIRA_PROJECTS_FILTER` - Comma-separated project filter list

### MCP Implementation
- **Tools**: Issue operations, search, project/user management, agile features
- **Resources**: Field definition resources (`jira://fields/issue`, etc.) that describe available fields for tool selection
- **Field Processing**: Advanced filtering engine supporting nested field selection

### Development Patterns
- **Module Structure**: Clear separation between HTTP client, Jira API, and MCP layers
- **Error Handling**: Comprehensive error handling with context preservation
- **Type Safety**: Strict TypeScript configuration with exhaustive type definitions
- **Testing**: Jest with ts-jest, high coverage targets (80%+)
- **Code Quality**: ESLint + Prettier with strict rules

### Important Files
- `src/types/config.ts` - Configuration type definitions
- `src/types/jira-api.ts` - Jira Server API response types
- `src/types/mcp.ts` - MCP protocol types and extensions
- `jest.config.js` - Test configuration with path mapping
- `tsconfig.json` - Main TypeScript config with path aliases
- `tsconfig.build.json` - Build-specific TypeScript config

### Testing Approach
- **Unit Tests**: `tests/unit/` - Test individual modules and functions
- **Integration Tests**: `tests/integration/` - Test Jira API integration
- **Fixtures**: `tests/fixtures/` - JSON test data for consistent testing
- **Setup**: `tests/setup.ts` - Global test configuration

### Build Output
- Compiled JavaScript in `dist/` directory
- Type declarations generated for library usage
- Source maps for debugging
- CommonJS module format for Node.js compatibility