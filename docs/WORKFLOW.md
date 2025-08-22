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

1.  **任务分解 (Task Breakdown)**: If a task is large, break it down into smaller, logical sub-tasks. Create a clear plan for these sub-tasks and present it for review before implementation.
2.  **分支管理 (Branch Management)**: Before starting a task, create and switch to a dedicated feature branch from `develop`. The branch must follow the naming convention: `feature/ai-[TASK-ID]`.
3.  **文档同步 (Documentation Sync)**: Upon starting a task, immediately update its status to `🔄 IN_PROGRESS` in the `IMPLEMENTATION_PLAN.md`. When finished and the PR is created, update it to `🔎 IN_REVIEW`. After the PR is merged, update it to `✅ DONE`.
4.  **测试驱动 (Test-Driven)**: Unit tests must be written alongside the implementation. All new code requires corresponding tests. **Important: Any modification to existing test cases, unless fixing a syntax error, requires prior approval.**
5.  **代码规范 (Code Conventions)**: Adhere strictly to the project's existing code style, formatting (`.prettierrc`), and architectural patterns.
6.  **小步快提 (Commit Frequently)**: Commit your changes frequently with clear, descriptive messages.

## 🔎 Code Review Workflow

A rigorous code review process is mandatory to ensure code quality and prevent integration issues.

1.  **Create Pull Request**: Once a task is complete, the engineer must create a Pull Request (PR) from their feature branch (`feature/ai-[TASK-ID]`) to the `develop` branch. This should be done using the GitHub CLI:
    ```bash
    gh pr create --title "[TASK-ID] - Task Description" --body "Detailed description of changes."
    ```

2.  **Update Task Status**: After creating the PR, the task status in `IMPLEMENTATION_PLAN.md` must be updated from `🔄 IN_PROGRESS` to `🔎 IN_REVIEW`.

3.  **Peer Review**: The other engineer is responsible for reviewing the PR in a timely manner. The review should focus on correctness, code style, test coverage, and adherence to architectural principles.

4.  **Merge and Cleanup**: Once the PR is approved and passes all automated checks, it can be merged into the `develop` branch. The feature branch should be deleted after the merge.

5.  **Start Next Task**: Only after the PR is merged can the engineer proceed to their next assigned task.

6.  **Verify Merge**: Before starting a new task, the engineer should verify that their previous PR has been merged using the command `gh pr status` or by checking the PR status in our conversation.

## 🔀 Parallel Development Coordination

- **Branch Strategy**: `feature/ai-[TASK-ID]` per task. Regular merges to `develop`.
- **Handoffs**: Critical handoff points are defined in the [Implementation Plan](./IMPLEMENTATION_PLAN.md).
- **Conflict Resolution**: AI Engineer 1 owns the `types/` and `lib/` directories. AI Engineer 2 owns `tools/`, `resources/`, and `tests/`. Request changes from the owner.

## 🛠️ 推荐工具：Git Worktree 与分支管理

为了高效地进行并行开发，我们推荐每个工程师维护一个独立的 Git Worktree，并在该工作区内通过切换分支来管理不同的任务。

**初始设置 (每个工程师执行一次)**:
为每位工程师创建一个独立的工作区。例如：
```bash
git worktree add -b develop ../jira-mcp-server-ai1 develop # AI Engineer 1
git worktree add -b develop ../jira-mcp-server-ai2 develop # AI Engineer 2
```
这将创建两个新的目录 (`../jira-mcp-server-ai1` 和 `../jira-mcp-server-ai2`)，每个目录都是项目的一个完整克隆，并默认检出 `develop` 分支。

**任务切换流程 (在各自的工作区内执行)**:
当一个任务完成并合并到 `develop` 分支后，工程师可以在其工作区内执行以下步骤来开始下一个任务：
1.  **切换到 `develop` 分支并拉取最新代码**:
    ```bash
    git switch develop
    git pull origin develop
    ```
2.  **创建并切换到新任务分支**:
    ```bash
    git switch -c feature/ai-[下一个任务ID]
    ```
    请确保 `[下一个任务ID]` 替换为实际的任务ID。