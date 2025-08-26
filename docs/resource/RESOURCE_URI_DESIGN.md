# Jira MCP Resource URI 设计文档

## 概述

本文档定义了 Jira MCP Server 的 Resource URI 设计方案，用于为 AI 助手提供完整的 Jira 字段选择指导。

## 设计目标

1. **直观易用**: URI 结构符合自然语言习惯
2. **完整覆盖**: 支持所有 Jira 字段，包括嵌套字段访问
3. **高性能**: 基于静态预定义，避免运行时开销
4. **准确性**: 基于真实 Jira 数据，确保字段定义准确

## URI 结构设计

### 核心 URI 格式

```
jira://{domain}/fields[/{field-path}][?{query-params}]
```

### Domain 分层设计

```yaml
# 核心业务域
jira://issue/fields          # 问题域 - 所有问题相关字段
jira://project/fields        # 项目域 - 所有项目相关字段  
jira://user/fields           # 用户域 - 所有用户相关字段

# 敏捷域
jira://agile/fields          # 敏捷域 - 看板、迭代等字段
jira://board/fields          # 看板子域
jira://sprint/fields         # 迭代子域

# 系统域
jira://system/fields         # 系统域 - 系统信息字段
jira://worklog/fields        # 工作日志域
jira://attachment/fields     # 附件域
```

### 设计演进

#### 初始方案
```
jira://fields/issue          # 字段优先
jira://fields/agile/board    # 层级深
```

#### 优化方案 (当前)
```
jira://issue/fields          # 域优先 ✅
jira://board/fields          # 扁平化 ✅
```

**优化原因**:
- 更符合自然语言习惯 (`issue的字段` vs `字段的issue`)
- 更好的域边界划分
- 扩展性更强

## 字段过滤策略

### 架构层级

```
用户请求 → MCP Server (验证) → Jira Server API (过滤) → 返回数据
```

### 关键发现

通过分析 jira-client 库发现：

```typescript
// jira-client 支持 fields 参数，过滤在 Jira Server API 层面执行
issue = await this.client.findIssue(issueKey, '', validFields.join(','))
result = await this.client.searchJira(jql, { fields: validFields })
```

**优势**:
- 减少网络传输数据量
- 提高 API 响应速度
- 利用服务器端查询优化
- 支持嵌套字段选择 (`assignee.displayName`)

### MCP Server 职责

1. **字段验证**: 基于 Resource URI 定义验证字段路径
2. **安全过滤**: 防止无效字段注入
3. **格式转换**: 将数组转换为 Jira API 期望的逗号分隔字符串
4. **传递过滤**: 将验证后的字段参数传递给 jira-client

## 字段来源分析

### searchFields() API 特性

```typescript
// 返回全局字段列表
const fields = await jiraClient.searchFields(); // 356 个字段定义
```

**关键发现**:
- Issue 和 Project 共享相同的全局字段列表
- 不同实体类型使用字段的不同子集
- 字段适用性通过上下文确定，而非不同 API

### 字段适用性差异

#### Issue 字段示例
```yaml
适用字段:
  - summary, description, status, assignee, reporter
  - created, updated, priority, labels, components
  - customfield_10001, customfield_10002
  
嵌套访问:
  - assignee.displayName, assignee.emailAddress
  - status.statusCategory.name
  - project.key, project.name
```

#### Project 字段示例
```yaml
适用字段:
  - key, name, description, lead, projectCategory
  - components[], versions[], issueTypes[]
  
嵌套访问:
  - lead.displayName, lead.emailAddress
  - projectCategory.name
  - components[].name, versions[].name
```

## 嵌套字段结构问题

### 核心挑战

**searchFields() 局限性**:
```json
{
  "id": "status",
  "schema": { "type": "status" }  // ❌ 缺乏嵌套结构信息
}
```

**实际数据复杂性**:
```json
{
  "status": {
    "name": "Done",
    "id": "10002",
    "statusCategory": {
      "name": "Done",
      "key": "done",
      "colorName": "success"
    }
  }
}
```

**LLM 需要知道的路径**:
```yaml
- status.name                    # 状态名称
- status.statusCategory.name     # 状态分类名称
- status.statusCategory.key      # 状态分类键值
- assignee.displayName          # 经办人姓名
- project.projectCategory.name  # 项目分类
```

## 解决方案：静态预定义

### 核心思路

通过预先访问真实 Issue 数据，分析完整字段结构：

```typescript
// 开发时执行
const issue = await client.findIssue('DSCWA-428'); // 获取完整数据
const structures = analyzeFieldStructures(issue.fields); // 分析嵌套结构
const definitions = buildStaticDefinitions(structures); // 生成静态定义
```

### 实际数据发现

从真实 Jira 环境 (jira.dentsplysirona.com) 的分析：

```yaml
总字段数: 212 个实际字段 (vs searchFields 的 356 个定义)
系统字段: 42 个 (11.8%)
自定义字段: 172 个 (88.2%) 

核心字段访问路径:
- status: 11 个访问路径
- assignee: 12 个访问路径  
- project: 15 个访问路径
- priority: 4 个访问路径
```

## Resource URI 内容格式

### 字段定义结构

```typescript
interface FieldDefinition {
  id: string;                    // 字段ID
  name: string;                  // 字段名称 (来自 searchFields)
  description: string;           // 字段描述 (人工增强)
  type: 'object' | 'string' | 'array';
  accessPaths: string[];         // 所有可访问路径
  structure: Record<string, string>; // 嵌套结构说明
  examples: string[];            // 使用示例
  commonUsage: string[][];       // 常用组合
}
```

### 示例 Resource 内容

```json
{
  "uri": "jira://issue/fields",
  "entityType": "issue",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "fields": {
    "status": {
      "name": "Status",
      "description": "问题状态信息",
      "type": "object",
      "structure": {
        "name": "状态名称",
        "id": "状态ID",
        "statusCategory.name": "状态分类名称",
        "statusCategory.key": "状态分类键值 (todo/progress/done)",
        "statusCategory.colorName": "状态颜色主题"
      },
      "examples": ["status.name", "status.statusCategory.key"],
      "commonUsage": [
        ["status.name", "status.statusCategory.key"],
        ["status.id", "status.statusCategory.id"]
      ]
    }
  }
}
```

## 工具集成示例

### MCP Tool 描述增强

```typescript
export function getIssueToolDefinition(): Tool {
  return {
    name: 'getIssue',
    inputSchema: {
      properties: {
        fields: {
          type: 'array',
          description: `字段选择支持，完整字段列表: jira://issue/fields

常用字段模式:
• 基础: ["summary", "status.name", "assignee.displayName"]
• 详细: ["summary", "assignee.displayName", "priority.name", "created"]  
• 完整: ["key", "summary", "description", "status.name", "assignee.displayName", "project.key"]

嵌套字段访问:
• status.name, status.statusCategory.key - 状态信息
• assignee.displayName, assignee.emailAddress - 用户信息
• project.key, project.projectCategory.name - 项目信息`
        }
      }
    }
  };
}
```

## 性能考虑

### 静态定义优势

```yaml
方案对比:
  静态预定义 ✅:
    - 性能: 极快 (纯内存访问)
    - 准确性: 基于真实数据
    - 维护成本: 低 (偶尔更新)
  
  动态查询 ❌:
    - 性能: 慢 (运行时API调用)
    - 准确性: 实时但复杂
    - 维护成本: 高 (运行时处理)
```

### 缓存策略

Resource Handler 使用内存缓存：

```typescript
export class PerformantResourceManager {
  private resourceCache = new Map<string, any>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟
  
  async getResource(uri: string): Promise<any> {
    // 静态定义直接返回，无需缓存逻辑
    return STATIC_DEFINITIONS[uri];
  }
}
```

## 扩展性设计

### 新域添加

```yaml
# 未来可轻松添加新域
jira://workflow/fields       # 工作流域
jira://permission/fields     # 权限域
jira://dashboard/fields      # 仪表板域
jira://custom/fields         # 全局自定义字段
```

### 版本支持

```yaml
# 支持版本特定字段
jira://issue/fields?version=8.x
jira://issue/fields?version=9.x
```

## 总结

这个 Resource URI 设计解决了核心问题：**如何让 LLM 知道复杂嵌套字段的完整访问路径**。

通过 Domain 导向的 URI 结构和基于真实数据的静态预定义，我们提供了：
- 直观的字段发现机制
- 完整的嵌套路径支持  
- 高性能的运行时响应
- 准确的字段定义

这为 Jira MCP Server 的 19 个工具提供了强大的字段选择基础。