# Team & Development Workflow

This document outlines the team structure, roles, and the development workflow for the Jira MCP Server project.

## 👥 AI Engineer Roles

| Engineer | Role | Task Domains | Responsibilities |
|----------|------|--------------|------------------|
| **AI Engineer 1** | Foundation & API Specialist | `ARCH-*`, `API-*` | Core architecture, HTTP client, Jira API layer, data models. |
| **AI Engineer 2** | MCP & Integration Specialist| `MCP-*`, `TEST-*`, `INTG-*`| MCP tools, resources, testing, and final integration. |

For a detailed and up-to-date list of tasks, see the [**Implementation Plan**](./IMPLEMENTATION_PLAN.md).

## 📋 Core Development Workflow

All development must follow these core principles:

1.  **分支管理 (Branch Management)**: Before starting a task, create and switch to a dedicated feature branch from `develop`. The branch must follow the naming convention: `feature/ai-[TASK-ID]`.
2.  **文档同步 (Documentation Sync)**: Upon starting a task, immediately update its status to `🔄 IN_PROGRESS` in the `IMPLEMENTATION_PLAN.md`. When finished, update it to `✅ DONE`.
3.  **计划先行 (Plan First)**: Before writing implementation code, ensure you have a clear plan.
4.  **测试驱动 (Test-Driven)**: Unit tests must be written alongside the implementation. All new code requires corresponding tests.
5.  **代码规范 (Code Conventions)**: Adhere strictly to the project's existing code style, formatting (`.prettierrc`), and architectural patterns.
6.  **小步快提 (Commit Frequently)**: Commit your changes frequently with clear, descriptive messages.

## 🔀 Parallel Development Coordination

- **Branch Strategy**: `feature/ai-[TASK-ID]` per task. Regular merges to `develop`.
- **Handoffs**: Critical handoff points are defined in the [Implementation Plan](./IMPLEMENTATION_PLAN.md).
- **Conflict Resolution**: AI Engineer 1 owns the `types/` and `lib/` directories. AI Engineer 2 owns `tools/`, `resources/`, and `tests/`. Request changes from the owner.

## 🛠️ 推荐工具：使用 Git Worktree

To enable efficient parallel development, we strongly recommend using `git worktree`.

**Setup for AI Engineer 1:**
```bash
git worktree add -b feature/ai-[TASK-ID] ../jira-mcp-server-ai1 develop
```

**Setup for AI Engineer 2:**
```bash
git worktree add -b feature/ai-[TASK-ID] ../jira-mcp-server-ai2 develop
```
