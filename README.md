# Jira Server MCP TypeScript Implementation

## 📋 Project Overview

This project develops a dedicated **Jira Server/Data Center** MCP (Model Context Protocol) server using TypeScript. Phase 1 focuses on **read operations**, providing AI assistants with secure and efficient access to Jira Server data.

## 🎯 Project Goals

### Core Objectives
- Build an independent MCP server based on the official MCP TypeScript SDK
- Focus on Jira Server/Data Center environments (exclude Cloud)
- Support only PAT (Personal Access Token) authentication
- Implement core read operations ensuring data access security and reliability

### Functional Scope
- ✅ **Read Operations**: Issue queries, search, users, projects, boards, worklogs, etc.
- ❌ **Write Operations**: Not implemented in Phase 1 (consider for Phase 2)
- ✅ **Authentication**: PAT authentication only, simplified configuration
- ✅ **MCP Protocol**: Standard MCP tools implementation
- ❌ **Proxy Features**: No proxy-related functionality

## ⚡ Key Advantages

1. **Focused** - Jira Server/DC only, simplified implementation
2. **Secure** - PAT authentication only, reduced security risks
3. **Performance** - TypeScript native performance, better type safety
4. **Maintainable** - Clear architecture, easy to extend and maintain
5. **Standardized** - Based on official MCP SDK, protocol compliant

## 🚀 Quick Start

### 1. Project Initialization
```bash

# Initialize package.json
npm init -y

# Install main dependencies
npm install @modelcontextprotocol/sdk axios zod winston

# Install development dependencies  
npm install -D typescript @types/node jest @types/jest eslint prettier
```

### 2. Basic Configuration
```bash
# TypeScript configuration
npx tsc --init

# ESLint configuration
npx eslint --init

# Create basic directory structure
mkdir -p src/{config,lib/{client,jira,models,utils},tools,types}
mkdir -p tests/{unit,integration,fixtures}
mkdir -p docs scripts
```

### 3. Development Workflow
1. **Phase 1**: Build basic infrastructure and configuration management
2. **Phase 2**: Implement Jira API wrapper layer
3. **Phase 3**: Develop MCP tools
4. **Phase 4**: Testing and documentation

### 4. Reference Python Implementation
- Study existing `src/mcp_atlassian/jira/` implementation
- Maintain the same API response format
- Understand Server/DC specific processing logic
- Reuse error handling and data transformation patterns

## 📋 Future Roadmap

### Phase 2 Goals (Write Operations)
- Issue creation, updates, deletion
- Comment and worklog management
- Status transitions and field updates
- Agile features (sprint management, version releases)

### Phase 3 Goals (Enhanced Features)  
- Batch operation support
- Data caching and performance optimization
- Advanced search and filtering
- Custom field management

## 📚 Documentation Navigation

- [**Development Guide**](./docs/DEVELOPMENT_GUIDE.md) - Technical architecture and implementation details
- [**Implementation Plan**](./docs/IMPLEMENTATION_PLAN.md) - AI-driven development timeline and phases
- [**API Design**](./docs/API_DESIGN.md) - MCP tools and resources specifications
- [**Project Structure**](./docs/PROJECT_STRUCTURE.md) - Directory layout and organization
- [**Documentation Index**](./docs/INDEX.md) - Complete documentation overview with reading paths

## 🛠️ Technology Stack

### Main Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",  // Official MCP SDK
  "axios": "^1.6.0",                      // HTTP client
  "zod": "^3.22.0",                       // Data validation
  "winston": "^3.11.0"                    // Logging
}
```

### Development Dependencies
```json
{
  "typescript": "^5.3.0",
  "@types/node": "^20.0.0",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.0",
  "eslint": "^8.55.0",
  "@typescript-eslint/parser": "^6.14.0",
  "prettier": "^3.1.0"
}
```

### Build Tools
- **TypeScript Compiler** - Compile to CommonJS/ESM
- **Jest** - Unit testing and integration testing  
- **ESLint + Prettier** - Code quality
- **Node.js 18+** - Runtime environment

This redesigned plan is more focused and practical, aligned with MCP server positioning and TypeScript best practices.