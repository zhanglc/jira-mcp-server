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

This is a **Jira Server/Data Center MCP (Model Context Protocol) server** implementation in TypeScript. It provides AI assistants with comprehensive access to Jira Server data through an advanced hybrid static-dynamic field architecture.

### Core Structure
- **Entry Point**: `src/index.ts` - Main application entry with MCP server initialization
- **MCP Server**: `src/server/jira-mcp-server.ts` - Core MCP server logic, tool and resource registration
- **Configuration**: `src/utils/config.ts` - Environment-based config management with Zod validation
- **Jira Integration**: `src/client/jira-client-wrapper.ts` - Jira Server API wrapper layer
- **MCP Tools**: `src/server/tools/` - MCP tool implementations (search, operations)
- **MCP Resources**: `src/server/resources/` - Hybrid field definition resources with static + dynamic capabilities
- **Tool Handlers**: `src/server/handlers/` - MCP tool request handlers
- **Type System**: `src/types/` - Comprehensive TypeScript definitions

### Key Features
- **Authentication**: PAT (Personal Access Token) only - configured via `JIRA_PERSONAL_TOKEN`
- **Hybrid Field Architecture**: Static system fields (42) + Dynamic custom fields (170+) with intelligent caching
- **Nested Field Access**: Complete support for complex paths like `status.statusCategory.key`, `assignee.displayName`
- **Real-time Field Discovery**: Dynamic custom field detection with business names via searchFields() API
- **High Performance**: <1ms static response, <5ms cached dynamic response
- **Server/DC Focus**: Designed specifically for Jira Server/Data Center (not Cloud)
- **Path Aliases**: Uses `@/` prefix for imports, with resources at `@/server/resources/` (configured in tsconfig.json and jest.config.js)

### Configuration
Environment variables (see `.env.example`):
- `JIRA_URL` - Jira Server URL (required)
- `JIRA_PERSONAL_TOKEN` - PAT token (required)
- `JIRA_SSL_VERIFY` - SSL verification for self-signed certificates
- `JIRA_TIMEOUT` - Request timeout in milliseconds
- `JIRA_PROJECTS_FILTER` - Comma-separated project filter list
- `ENABLE_DYNAMIC_FIELDS` - Enable/disable dynamic field discovery (default: false)
- `DYNAMIC_FIELD_CACHE_TTL` - Cache TTL for dynamic fields in seconds (default: 3600)

### MCP Implementation
- **Tools**: Issue operations, search, project/user management, agile features (19 tools total)
- **Resources**: Hybrid field definition resources (`jira://issue/fields`, `jira://project/fields`, etc.) with complete nested access paths
- **Field Processing**: Advanced filtering engine with hybrid static-dynamic field validation
- **Resource Architecture**: Domain-first URI design with intelligent field discovery and caching

### Development Patterns
- **Module Structure**: Clear separation between HTTP client, Jira API, and MCP layers
- **Error Handling**: Comprehensive error handling with graceful fallback strategies
- **Type Safety**: Strict TypeScript configuration with exhaustive type definitions
- **Testing**: Jest with ts-jest, TDD methodology, high coverage targets (80%+)
- **Code Quality**: ESLint + Prettier with strict rules
- **Agent Collaboration**: typescript-pro for development, code-reviewer-simple for reviews

### Important Files
- `src/types/config-types.ts` - Configuration type definitions
- `src/types/jira-types.ts` - Jira Server API response types
- `src/types/mcp-types.ts` - MCP protocol types and extensions
- `src/types/field-definition.ts` - Field definition interfaces for hybrid architecture
- `src/server/resources/resource-handler.ts` - Base resource handler with static field definitions
- `src/server/resources/static-definitions/` - Static field definitions for core Jira entities
- `src/server/handlers/tool-handler.ts` - MCP tool request handler with field validation
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

## Resource Architecture

This project implements a sophisticated **hybrid static-dynamic field architecture** for optimal AI assistant interaction with Jira fields.

### Field Coverage
- **Static System Fields**: 42 predefined fields with complete nested access paths
- **Dynamic Custom Fields**: 170+ automatically discovered fields with real-time business names
- **Total Coverage**: 212+ fields across all Jira entity types

### Key Capabilities
- **Nested Field Access**: Full support for complex paths like `status.statusCategory.key`, `assignee.displayName`, `project.projectCategory.name`
- **Intelligent Caching**: 1-hour TTL for dynamic fields with graceful fallback to static definitions
- **Real-time Discovery**: Live custom field detection via searchFields() API
- **Performance Optimization**: <1ms static response, <5ms cached dynamic response

### Resource URIs
- `jira://issue/fields` - Complete issue field definitions with nested paths
- `jira://project/fields` - Project field definitions
- `jira://user/fields` - User field definitions  
- `jira://agile/fields` - Agile/board/sprint field definitions

### Documentation
- `docs/RESOURCE_DESIGN.md` - Complete resource architecture design and implementation guide
- `docs/IMPLEMENTATION_PLAN.md` - Detailed 3-phase implementation plan with TDD methodology
- `docs/resource/` - Detailed design documents covering architecture evolution and technical specifications