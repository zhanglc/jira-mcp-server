# Project Structure

## 📁 Directory Layout (TypeScript Best Practices)

```
jira-server-mcp/
├── src/                                  # Source code
│   ├── index.ts                         # Application entry point
│   ├── server.ts                        # MCP server main logic
│   ├── config/                          # Configuration management
│   │   ├── index.ts                     # Configuration exports
│   │   ├── schema.ts                    # Configuration validation schema
│   │   └── loader.ts                    # Configuration loader
│   ├── lib/                             # Core business logic
│   │   ├── client/                      # HTTP client layer
│   │   │   ├── index.ts                 # Client exports
│   │   │   ├── http-client.ts           # HTTP client base class
│   │   │   ├── auth.ts                  # PAT authentication handler
│   │   │   └── error-handler.ts         # Error handling utilities
│   │   ├── jira/                        # Jira API wrapper
│   │   │   ├── index.ts                 # Jira operations exports
│   │   │   ├── issues.ts                # Issue-related operations
│   │   │   ├── search.ts                # Search operations
│   │   │   ├── projects.ts              # Project operations
│   │   │   ├── users.ts                 # User operations
│   │   │   ├── fields.ts                # Field operations
│   │   │   ├── agile.ts                 # Agile functionality
│   │   │   ├── worklog.ts               # Worklog operations
│   │   │   └── attachments.ts           # Attachment operations
│   │   ├── models/                      # Data models
│   │   │   ├── index.ts                 # Model exports
│   │   │   ├── issue.ts                 # Issue model
│   │   │   ├── user.ts                  # User model
│   │   │   ├── project.ts               # Project model
│   │   │   ├── search.ts                # Search result models
│   │   │   ├── worklog.ts               # Worklog model
│   │   │   └── common.ts                # Common models
│   │   └── utils/                       # Utility functions
│   │       ├── index.ts                 # Utility exports
│   │       ├── logger.ts                # Logging utilities
│   │       ├── validation.ts            # Data validation
│   │       ├── uri-parser.ts            # URI parsing utilities
│   │       └── field-filter.ts          # Field filtering engine
│   ├── resources/                       # MCP resource handlers
│   │   ├── index.ts                     # Resource registration
│   │   ├── issues.ts                    # Issue resource handler
│   │   ├── projects.ts                  # Project resource handler
│   │   ├── users.ts                     # User resource handler
│   │   ├── boards.ts                    # Board resource handler
│   │   ├── sprints.ts                   # Sprint resource handler
│   │   └── fields.ts                    # Field resource handler
│   ├── tools/                           # MCP tool definitions
│   │   ├── index.ts                     # Tool registration
│   │   ├── search/                      # Search tools
│   │   │   ├── search-issues.ts         # Issue search tool
│   │   │   ├── search-projects.ts       # Project search tool
│   │   │   └── search-users.ts          # User search tool
│   │   └── operations/                  # Operation tools
│   │       ├── download-attachments.ts  # Attachment download tool
│   │       └── get-link-types.ts        # Link types tool
│   └── types/                           # TypeScript type definitions
│       ├── index.ts                     # Type exports
│       ├── config.ts                    # Configuration types
│       ├── jira-api.ts                  # Jira API response types
│       ├── mcp.ts                       # MCP-related types
│       ├── resources.ts                 # Resource types
│       └── common.ts                    # Common types
├── tests/                               # Test files
│   ├── setup.ts                        # Test configuration
│   ├── fixtures/                       # Test data fixtures
│   │   ├── issues.json                  # Issue test data
│   │   ├── projects.json                # Project test data
│   │   └── users.json                   # User test data
│   ├── unit/                            # Unit tests
│   │   ├── lib/                         # Library unit tests
│   │   │   ├── client/                  # Client tests
│   │   │   ├── jira/                    # Jira API tests
│   │   │   ├── models/                  # Model tests
│   │   │   └── utils/                   # Utility tests
│   │   ├── tools/                       # Tool unit tests
│   │   │   ├── search/                  # Search tool tests
│   │   │   └── operations/              # Operation tool tests
│   │   └── config/                      # Configuration tests
│   └── integration/                     # Integration tests
│       ├── jira-api.test.ts             # Jira API integration tests
│       ├── mcp-server.test.ts           # MCP server integration tests
│       └── field-filtering.test.ts      # Field filtering tests
├── docs/                                # Documentation
│   ├── README.md                        # Project overview
│   ├── DEVELOPMENT_GUIDE.md             # Development guide
│   ├── IMPLEMENTATION_PLAN.md           # Implementation plan
│   ├── API_DESIGN.md                    # API design specifications
│   ├── CONFIGURATION.md                 # Configuration guide
│   └── EXAMPLES.md                      # Usage examples
├── scripts/                             # Build and development scripts
│   ├── build.js                         # Build script
│   ├── dev.js                           # Development script
│   └── test.js                          # Test script
├── .env.example                         # Environment variables template
├── package.json                         # Package configuration
├── tsconfig.json                        # TypeScript configuration
├── tsconfig.build.json                  # Build-specific TypeScript config
├── jest.config.js                       # Jest test configuration
├── .eslintrc.js                         # ESLint configuration
├── .prettierrc                          # Prettier configuration
└── README.md                            # Project README
```

## 📋 Module Organization

### Source Code (`src/`)

#### Entry Points
- **`index.ts`** - Main application entry point, initializes MCP server
- **`server.ts`** - MCP server implementation, tool and resource registration

#### Configuration (`config/`)
- **`schema.ts`** - Zod schemas for configuration validation
- **`loader.ts`** - Environment variable loading and validation
- **`index.ts`** - Configuration interface exports

#### Core Library (`lib/`)

##### HTTP Client (`lib/client/`)
- **`http-client.ts`** - Base HTTP client with request/response handling
- **`auth.ts`** - PAT authentication implementation
- **`error-handler.ts`** - HTTP error handling and retry logic

##### Jira API Layer (`lib/jira/`)
- **`issues.ts`** - Issue CRUD operations and field handling
- **`search.ts`** - JQL search implementation
- **`projects.ts`** - Project listing and metadata
- **`users.ts`** - User profile and search operations
- **`fields.ts`** - Field definition and search
- **`agile.ts`** - Board and sprint operations
- **`worklog.ts`** - Worklog retrieval operations
- **`attachments.ts`** - Attachment download functionality

##### Data Models (`lib/models/`)
- **`issue.ts`** - Issue, IssueType, Priority models
- **`user.ts`** - User profile and authentication models
- **`project.ts`** - Project and version models
- **`search.ts`** - Search result and pagination models
- **`worklog.ts`** - Worklog entry models
- **`common.ts`** - Shared models (Status, Resolution, etc.)

##### Utilities (`lib/utils/`)
- **`logger.ts`** - Winston-based logging configuration
- **`validation.ts`** - Data validation utilities
- **`uri-parser.ts`** - MCP URI parsing for resources
- **`field-filter.ts`** - Nested field filtering engine

#### MCP Implementation

##### Resources (`resources/`)
- **`issues.ts`** - Issue field definitions resource
- **`projects.ts`** - Project field definitions resource
- **`users.ts`** - User field definitions resource
- **`boards.ts`** - Board field definitions resource
- **`sprints.ts`** - Sprint field definitions resource
- **`fields.ts`** - Custom field definitions resource

##### Tools (`tools/`)
- **`search/`** - Search-related MCP tools
  - `search-issues.ts` - JQL issue search tool
  - `search-projects.ts` - Project search tool
  - `search-users.ts` - User search tool
- **`operations/`** - Operation MCP tools
  - `download-attachments.ts` - Attachment download tool
  - `get-link-types.ts` - Issue link types tool

#### Type Definitions (`types/`)
- **`config.ts`** - Configuration interface types
- **`jira-api.ts`** - Jira Server API response types
- **`mcp.ts`** - MCP protocol types and extensions
- **`resources.ts`** - MCP resource types
- **`common.ts`** - Shared utility types

### Testing (`tests/`)

#### Test Structure
- **`setup.ts`** - Jest configuration and global setup
- **`fixtures/`** - JSON test data for consistent testing
- **`unit/`** - Unit tests with high coverage
- **`integration/`** - Integration tests with real API calls

### Documentation (`docs/`)
- **`README.md`** - Project overview and quick start
- **`DEVELOPMENT_GUIDE.md`** - Technical implementation details
- **`IMPLEMENTATION_PLAN.md`** - Development timeline
- **`API_DESIGN.md`** - MCP tools and resources specification
- **`CONFIGURATION.md`** - Configuration guide
- **`EXAMPLES.md`** - Usage examples

### Build and Development (`scripts/`)
- **`build.js`** - Production build script
- **`dev.js`** - Development server with hot reload
- **`test.js`** - Test runner with coverage

## 🔧 Naming Conventions

### File Naming
- **kebab-case** for file names (`field-filter.ts`, `search-issues.ts`)
- **PascalCase** for class files (`HttpClient.ts`, `JiraService.ts`)
- **camelCase** for utility files (`logger.ts`, `validation.ts`)

### Code Naming
- **PascalCase** for classes and interfaces (`JiraIssue`, `SearchResult`)
- **camelCase** for functions and variables (`getIssue`, `fieldFilter`)
- **UPPER_SNAKE_CASE** for constants (`DEFAULT_TIMEOUT`, `MAX_RESULTS`)

### Directory Naming
- **kebab-case** for multi-word directories (`field-definitions/`)
- **camelCase** for single-concept directories (`models/`, `utils/`)

## 🏗️ Architectural Principles

### Separation of Concerns
- **Configuration** - Isolated configuration management
- **HTTP Layer** - Generic HTTP client with authentication
- **Business Logic** - Jira-specific operations and transformations
- **MCP Layer** - Protocol-specific implementations
- **Types** - Centralized type definitions

### Dependency Flow
```
Tools → Jira API → HTTP Client → Configuration
  ↓       ↓           ↓
Resources ← Models ← Types
```

### Module Boundaries
- **No circular dependencies** between modules
- **Clear interfaces** between layers
- **Dependency injection** for testability
- **Single responsibility** for each module

### Error Handling Strategy
- **Layer-specific errors** with context preservation
- **Graceful degradation** for optional features
- **Structured logging** for debugging
- **User-friendly messages** for MCP clients

## 📦 Package Structure

### Main Dependencies Location
- **Runtime dependencies** in `package.json`
- **Type definitions** in `src/types/`
- **Configuration schemas** in `src/config/schema.ts`

### Build Artifacts
- **Compiled JavaScript** in `dist/`
- **Type declarations** in `dist/types/`
- **Source maps** for debugging

### Development Tools
- **TypeScript config** in `tsconfig.json`
- **Test config** in `jest.config.js`
- **Linting config** in `.eslintrc.js`
- **Formatting config** in `.prettierrc`

## 🔗 Related Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - Technical implementation details
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Development timeline and phases
- [API Design](./API_DESIGN.md) - MCP tools and resources specifications