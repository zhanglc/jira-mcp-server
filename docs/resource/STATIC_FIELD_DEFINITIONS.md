# 静态字段定义方案

## 概述

本文档详细说明基于真实 Jira 数据构建静态字段定义的方案，解决 searchFields() API 无法提供嵌套结构信息的问题。

## 问题背景

### searchFields() API 局限性

```typescript
// searchFields() 只提供基础类型信息
{
  "id": "status",
  "name": "Status",
  "schema": { "type": "status", "system": "status" }
  // ❌ 缺乏嵌套结构详情
}
```

### 实际数据复杂性

```json
// 真实 Issue 返回的 status 字段
{
  "status": {
    "self": "https://jira.dentsplysirona.com/rest/api/2/status/10002",
    "description": "",
    "iconUrl": "https://jira.dentsplysirona.com/",
    "name": "Done",
    "id": "10002",
    "statusCategory": {
      "self": "https://jira.dentsplysirona.com/rest/api/2/statuscategory/3",
      "id": 3,
      "key": "done",
      "colorName": "success",
      "name": "Done"
    }
  }
}
```

**LLM 需要知道的访问路径**:
- `status.name` - 状态名称
- `status.statusCategory.name` - 状态分类名称
- `status.statusCategory.key` - 状态分类键值
- `status.statusCategory.colorName` - 状态颜色

## 解决方案：静态预定义

### 核心思路

1. **开发时分析**: 访问真实 Issue 数据，分析完整字段结构
2. **静态生成**: 将分析结果生成为静态定义文件
3. **运行时返回**: Resource Handler 直接返回预编译定义

### 实施流程

```typescript
// 1. 开发时数据提取
async function extractFieldStructures() {
  // 访问代表性 Issue
  const sampleIssues = [
    await client.findIssue('DSCWA-428'),
    await client.findIssue('PROJ-123'),
    // ... 更多样例
  ];
  
  // 分析字段结构
  const structures = analyzeFieldStructures(sampleIssues);
  
  // 生成静态定义
  return generateStaticDefinitions(structures);
}

// 2. 运行时静态返回
export class StaticFieldResourceHandler {
  async readResource(uri: string): Promise<string> {
    switch (uri) {
      case "jira://issue/fields":
        return JSON.stringify(STATIC_ISSUE_FIELD_DEFINITIONS);
      case "jira://project/fields":
        return JSON.stringify(STATIC_PROJECT_FIELD_DEFINITIONS);
    }
  }
}
```

## 真实数据分析结果

### 环境信息

- **Jira 服务器**: jira.dentsplysirona.com
- **测试 Issue**: DSCWA-428
- **分析时间**: 2024-01-15

### 字段统计

```yaml
字段总数: 212 个实际字段
字段分类:
  - 系统字段: 42 个 (19.8%)
  - 自定义字段: 170 个 (80.2%)
  
对比 searchFields():
  - searchFields 返回: 356 个字段定义
  - 实际 Issue 包含: 212 个字段
  - 差异: 144 个字段在该 Issue 中无值或不适用
```

### 核心系统字段结构

#### 1. Status 字段 (11个访问路径)

```typescript
const statusFieldDefinition = {
  id: "status",
  name: "Status",
  type: "object",
  accessPaths: [
    "status.self",
    "status.description", 
    "status.iconUrl",
    "status.name",                    // 最常用
    "status.id",
    "status.statusCategory",
    "status.statusCategory.self",
    "status.statusCategory.id",
    "status.statusCategory.key",      // 最常用
    "status.statusCategory.colorName",
    "status.statusCategory.name"      // 最常用
  ],
  structure: {
    name: "状态名称",
    id: "状态ID",
    description: "状态描述",
    iconUrl: "状态图标URL",
    self: "状态REST API URL",
    "statusCategory.name": "状态分类名称 (To Do/In Progress/Done)",
    "statusCategory.key": "状态分类键值 (todo/progress/done)",
    "statusCategory.id": "状态分类ID",
    "statusCategory.colorName": "状态颜色主题",
    "statusCategory.self": "状态分类REST API URL"
  },
  examples: ["status.name", "status.statusCategory.key"],
  commonUsage: [
    ["status.name", "status.statusCategory.key"],
    ["status.id", "status.statusCategory.id"]
  ]
};
```

#### 2. Assignee 字段 (12个访问路径)

```typescript
const assigneeFieldDefinition = {
  id: "assignee",
  name: "Assignee", 
  type: "object",
  accessPaths: [
    "assignee.self",
    "assignee.name",
    "assignee.key",
    "assignee.emailAddress",          // 最常用
    "assignee.avatarUrls",
    "assignee.avatarUrls.48x48",
    "assignee.avatarUrls.24x24", 
    "assignee.avatarUrls.16x16",
    "assignee.avatarUrls.32x32",
    "assignee.displayName",           // 最常用
    "assignee.active",
    "assignee.timeZone"
  ],
  structure: {
    displayName: "用户显示名称",
    emailAddress: "用户邮箱地址",
    name: "用户登录名",
    key: "用户唯一标识符",
    active: "用户激活状态 (boolean)",
    timeZone: "用户时区",
    self: "用户REST API URL",
    "avatarUrls.48x48": "48x48头像URL",
    "avatarUrls.24x24": "24x24头像URL",
    "avatarUrls.16x16": "16x16头像URL", 
    "avatarUrls.32x32": "32x32头像URL"
  },
  examples: ["assignee.displayName", "assignee.emailAddress"],
  commonUsage: [
    ["assignee.displayName", "assignee.emailAddress"],
    ["assignee.name", "assignee.active"]
  ]
};
```

#### 3. Project 字段 (15个访问路径)

```typescript
const projectFieldDefinition = {
  id: "project",
  name: "Project",
  type: "object", 
  accessPaths: [
    "project.self",
    "project.id",
    "project.key",                    // 最常用
    "project.name",                   // 最常用
    "project.projectTypeKey",
    "project.avatarUrls",
    "project.avatarUrls.48x48",
    "project.avatarUrls.24x24",
    "project.avatarUrls.16x16", 
    "project.avatarUrls.32x32",
    "project.projectCategory",
    "project.projectCategory.self",
    "project.projectCategory.id",
    "project.projectCategory.description",
    "project.projectCategory.name"    // 最常用
  ],
  structure: {
    key: "项目键值",
    name: "项目名称", 
    id: "项目ID",
    projectTypeKey: "项目类型键值",
    self: "项目REST API URL",
    "projectCategory.name": "项目分类名称",
    "projectCategory.description": "项目分类描述",
    "projectCategory.id": "项目分类ID",
    "projectCategory.self": "项目分类REST API URL",
    "avatarUrls.48x48": "48x48项目头像URL",
    "avatarUrls.24x24": "24x24项目头像URL",
    "avatarUrls.16x16": "16x16项目头像URL",
    "avatarUrls.32x32": "32x32项目头像URL"
  },
  examples: ["project.key", "project.name", "project.projectCategory.name"],
  commonUsage: [
    ["project.key", "project.name"],
    ["project.name", "project.projectCategory.name"]
  ]
};
```

#### 4. Priority 字段 (4个访问路径)

```typescript
const priorityFieldDefinition = {
  id: "priority",
  name: "Priority",
  type: "object",
  accessPaths: [
    "priority.self",
    "priority.iconUrl", 
    "priority.name",                  // 最常用
    "priority.id"
  ],
  structure: {
    name: "优先级名称",
    id: "优先级ID",
    iconUrl: "优先级图标URL",
    self: "优先级REST API URL"
  },
  examples: ["priority.name", "priority.id"],
  commonUsage: [["priority.name"]]
};
```

### 自定义字段分析

#### 统计信息

```yaml
自定义字段总数: 170个
字段类型分布:
  - string: ~120个 (70%)
  - object: ~30个 (18%)
  - array: ~20个 (12%)

有值字段示例:
  - customfield_10500: string
  - customfield_12902: string  
  - customfield_11801: array
  - customfield_10836: object (有嵌套结构)
  - customfield_10000: string
```

#### 复杂自定义字段示例

```typescript
// 对象型自定义字段
const complexCustomField = {
  id: "customfield_10836",
  name: "Epic Link", // 来自 searchFields
  type: "object",
  accessPaths: [
    "customfield_10836.self",
    "customfield_10836.value",
    "customfield_10836.id"
  ],
  structure: {
    value: "Epic值",
    id: "Epic ID",
    self: "Epic REST API URL"
  },
  examples: ["customfield_10836.value"]
};
```

## 常用字段组合

### 预定义组合模板

```typescript
const COMMON_FIELD_COMBINATIONS = {
  basic: {
    name: "基础信息",
    fields: ["summary", "status.name", "priority.name", "issuetype.name"],
    description: "获取问题的基本标识信息"
  },
  
  users: {
    name: "人员信息", 
    fields: ["assignee.displayName", "reporter.displayName", "creator.displayName"],
    description: "获取问题相关的用户信息"
  },
  
  project: {
    name: "项目信息",
    fields: ["project.key", "project.name", "project.projectCategory.name"],
    description: "获取问题所属项目的详细信息"
  },
  
  status: {
    name: "状态详情",
    fields: ["status.name", "status.statusCategory.name", "status.statusCategory.key"],
    description: "获取问题状态的完整信息"
  },
  
  timestamps: {
    name: "时间信息",
    fields: ["created", "updated", "resolutiondate"],
    description: "获取问题的时间戳信息"
  },
  
  detailed: {
    name: "详细信息",
    fields: [
      "key", "summary", "description", 
      "status.name", "assignee.displayName", 
      "priority.name", "project.key"
    ],
    description: "获取问题的完整详细信息"
  }
};
```

## 静态定义生成器

### 字段结构分析器

```typescript
function analyzeObjectStructure(obj: any, path = '', maxDepth = 3, currentDepth = 0) {
  const structure = {};
  
  if (currentDepth >= maxDepth || obj === null || obj === undefined) {
    return typeof obj;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      structure['[]'] = analyzeObjectStructure(obj[0], path + '[]', maxDepth, currentDepth + 1);
    }
    return structure;
  }
  
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      structure[key] = analyzeObjectStructure(value, newPath, maxDepth, currentDepth + 1);
    }
    return structure;
  }
  
  return typeof obj;
}
```

### 访问路径生成器

```typescript
function generateAccessPaths(obj: any, prefix = '', maxDepth = 3, currentDepth = 0): string[] {
  const paths = [];
  
  if (currentDepth >= maxDepth || obj === null || obj === undefined) {
    return paths;
  }
  
  if (Array.isArray(obj)) {
    paths.push(`${prefix}[]`);
    if (obj.length > 0 && typeof obj[0] === 'object') {
      const subPaths = generateAccessPaths(obj[0], `${prefix}[]`, maxDepth, currentDepth + 1);
      paths.push(...subPaths);
    }
    return paths;
  }
  
  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = prefix ? `${prefix}.${key}` : key;
      paths.push(newPath);
      
      const subPaths = generateAccessPaths(value, newPath, maxDepth, currentDepth + 1);
      paths.push(...subPaths);
    });
  }
  
  return paths;
}
```

## 字段说明处理

### 混合策略

```typescript
const ENHANCED_FIELD_DESCRIPTIONS = {
  // 系统字段：人工维护高质量说明
  status: {
    description: "问题状态信息",
    pathDescriptions: {
      "status.name": "当前状态名称",
      "status.statusCategory.name": "状态分类 (To Do/In Progress/Done)",
      "status.statusCategory.key": "状态分类键值 (todo/progress/done)",
      "status.statusCategory.colorName": "状态显示颜色主题"
    }
  },
  
  assignee: {
    description: "问题经办人用户信息",
    pathDescriptions: {
      "assignee.displayName": "用户显示名称",
      "assignee.emailAddress": "用户邮箱地址", 
      "assignee.active": "用户是否激活状态"
    }
  }
  
  // 自定义字段：使用 searchFields 的 name + 简单增强
  // customfield_10101: { name: "Epic Status", description: "Epic状态自定义字段" }
};
```

## 生成的静态定义文件

### 文件结构

```
src/resources/
├── static-definitions/
│   ├── issue-fields.ts         # Issue 字段定义
│   ├── project-fields.ts       # Project 字段定义 
│   ├── user-fields.ts          # User 字段定义
│   ├── agile-fields.ts         # Agile 字段定义
│   └── index.ts                # 统一导出
```

### 示例定义文件

```typescript
// src/resources/static-definitions/issue-fields.ts
export const ISSUE_FIELD_DEFINITIONS = {
  uri: "jira://issue/fields",
  entityType: "issue",
  lastUpdated: "2024-01-15T10:30:00Z",
  totalFields: 212,
  systemFields: 42,
  customFields: 170,
  
  fields: {
    status: statusFieldDefinition,
    assignee: assigneeFieldDefinition,
    project: projectFieldDefinition,
    priority: priorityFieldDefinition,
    // ... 所有字段定义
  },
  
  commonCombinations: COMMON_FIELD_COMBINATIONS,
  
  // 快速查找索引
  pathIndex: {
    "status.name": "status",
    "status.statusCategory.key": "status",
    "assignee.displayName": "assignee",
    // ... 所有路径到字段的映射
  }
};
```

## 性能优势

### 方案对比

| 特性 | 静态预定义 | 动态查询 | 硬编码文档 |
|------|------------|----------|------------|
| **响应时间** | <1ms | 100-500ms | <1ms |
| **准确性** | 基于真实数据 | 实时准确 | 可能过时 |
| **维护成本** | 低 | 高 | 高 |
| **网络依赖** | 无 | 有 | 无 |
| **复杂度** | 低 | 高 | 中 |

### 内存使用

```yaml
估算内存使用:
  - Issue 字段定义: ~50KB
  - Project 字段定义: ~20KB  
  - User 字段定义: ~15KB
  - Agile 字段定义: ~30KB
  - 总计: ~115KB (可忽略)
```

## 更新策略

### 定期更新

```bash
# 开发脚本
npm run update-field-definitions

# 自动化流程
1. 连接到 Jira 服务器
2. 获取最新字段列表 (searchFields)
3. 分析代表性 Issue 数据结构
4. 对比现有定义，检测变化
5. 生成新的静态定义文件
6. 更新版本号和时间戳
```

### 版本控制

```typescript
interface FieldDefinitionVersion {
  version: string;          // "1.0.0"
  jiraVersion: string;      // "8.20.0" 
  lastUpdated: string;      // ISO timestamp
  changeLog: string[];      // 变更记录
}
```

## 总结

静态预定义方案通过以下方式解决了嵌套字段结构问题：

1. **准确性**: 基于真实 Jira 数据，确保字段定义准确
2. **完整性**: 覆盖所有访问路径，包括深层嵌套结构
3. **性能**: 静态返回，无运行时开销
4. **可维护性**: 结构化定义，易于更新和扩展

这为 LLM 提供了完整的字段选择指导，使其能够自然地使用复杂嵌套字段路径如 `status.statusCategory.key` 和 `assignee.displayName`。