# Gemini Code Assistant Context

This document provides a comprehensive overview of the Jira Server MCP TypeScript Implementation project, designed to be used as a context file for the Gemini Code Assistant.

## Project Overview

This project is a TypeScript-based MCP (Model Context Protocol) server for Jira Server and Data Center. The primary goal is to provide a secure and efficient way for AI assistants to access Jira Server data. The server is built using the official MCP TypeScript SDK and focuses on read-only operations in its initial phase.

The project follows a well-defined architecture with a clear separation of concerns, as detailed in the `docs/PROJECT_STRUCTURE.md` and `docs/DEVELOPMENT_GUIDE.md` files. It utilizes a technology stack that includes TypeScript, Node.js, Axios, Zod, and Winston.

A unique aspect of this project is its AI-driven development strategy, which aims to accelerate the development process significantly by using AI tools like Gemini and Claude. The development process is guided by the `docs/IMPLEMENTATION_PLAN.md` file, which outlines the roles and responsibilities of different AI engineers.

## Building and Running

The project is managed with npm and includes a comprehensive set of scripts for development and production workflows.

**Development:**

```bash
# Run the development server with hot reload
npm run dev
```

**Building:**

```bash
# Compile the TypeScript code
npm run build
```

**Running:**

```bash
# Start the production server
npm run start
```

**Testing:**

```bash
# Run the test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Linting and Formatting:**

```bash
# Lint the codebase
npm run lint

# Fix linting errors
npm run lint:fix

# Format the codebase
npm run format

# Check formatting
npm run format:check
```

## Development Conventions

The project follows a set of well-defined development conventions to ensure code quality and consistency.

**Coding Style:**

The project uses ESLint and Prettier to enforce a consistent coding style. The configuration for these tools can be found in the `.eslintrc.js` and `.prettierrc` files.

**Naming Conventions:**

The project follows a set of naming conventions for files, classes, functions, and variables, as detailed in the `docs/PROJECT_STRUCTURE.md` file.

**Architectural Principles:**

The project is built on a set of architectural principles, including separation of concerns, a clear dependency flow, and well-defined module boundaries. These principles are documented in the `docs/PROJECT_STRUCTURE.md` file.

**Git Workflow:**

The project uses a feature-branch-based Git workflow, with a `develop` branch for integration and a `main` branch for production releases. The commit messages follow a specific convention, as detailed in the `docs/IMPLEMENTATION_PLAN.md` file.

## Project Structure

The project follows a modular structure with a clear separation of concerns. The main directories are:

*   `src`: Contains the source code, organized into modules for configuration, core business logic, MCP resources, tools, and types.
*   `tests`: Contains the test files, organized into unit and integration tests.
*   `docs`: Contains the project documentation.
*   `scripts`: Contains build and development scripts.

A detailed overview of the project structure can be found in the `docs/PROJECT_STRUCTURE.md` file.
