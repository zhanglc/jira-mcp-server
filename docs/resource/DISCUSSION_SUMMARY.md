# Jira MCP Resource URI 设计讨论总结

## 讨论概览

本次讨论围绕 Jira MCP Server 的 Resource URI 设计展开，重点解决如何为 AI 助手提供完整的 Jira 字段选择指导，特别是复杂嵌套字段的访问问题。

## 核心问题识别

### 1. 嵌套字段结构复杂性

**问题描述**: searchFields() API 只返回基础类型信息，无法指导 LLM 进行嵌套字段访问

```json
// searchFields() 返回
{"id": "status", "schema": {"type": "status"}}

// 实际数据结构
{
  "status": {
    "name": "Done",
    "statusCategory": {
      "name": "Done",
      "key": "done",
      "colorName": "success"
    }
  }
}
```

**影响**: LLM 无法知道如何访问 `status.statusCategory.name` 等有用的嵌套路径

### 2. 自定义字段占比高

**关键发现**: 
- 自定义字段占总字段数的 80.2% (170/212)
- 自定义字段结构相对简单，但数量庞大
- 需要兼顾系统字段的复杂性和自定义字段的简洁性

### 3. 字段过滤性能优化

**技术发现**: jira-client 支持服务器端字段过滤
```typescript
issue = await this.client.findIssue(issueKey, '', validFields.join(','))
```
**优势**: 减少网络传输，提高 API 响应速度

## 解决方案演进

### 阶段1: URI 结构优化

**从**: `jira://fields/issue` (字段优先)
**到**: `jira://issue/fields` (域优先)

**原因**: 
- 更符合自然语言习惯 ("issue的字段" vs "字段的issue")
- 更好的域边界划分
- 扩展性更强

### 阶段2: 静态预定义方案

**核心思路**: 开发时分析真实 Issue 数据，生成静态字段定义

**实施方法**:
1. 访问代表性 Issue (如 DSCWA-428)
2. 分析完整字段结构，包含嵌套路径
3. 生成静态定义文件
4. 运行时直接返回预编译定义

**优势对比**:
| 特性 | 静态预定义 | 动态查询 |
|------|------------|----------|
| 响应时间 | <1ms | 100-500ms |
| 准确性 | 基于真实数据 | 实时准确 |
| 维护成本 | 低 | 高 |
| 网络依赖 | 无 | 有 |

## 关键技术决策

### 1. 域导向的 URI 设计

```yaml
# 核心业务域
jira://issue/fields          # 问题域字段
jira://project/fields        # 项目域字段  
jira://user/fields           # 用户域字段

# 敏捷域
jira://agile/fields          # 敏捷域字段
jira://board/fields          # 看板字段
jira://sprint/fields         # 迭代字段
```

### 2. 字段定义结构

```typescript
interface FieldDefinition {
  id: string;                    // 字段ID
  name: string;                  // 字段名称 (来自 searchFields)
  description: string;           // 字段描述 (人工增强)
  type: FieldType;               // 字段类型
  accessPaths: AccessPath[];     // 访问路径列表
  structure?: FieldStructure;    // 嵌套结构
  examples: string[];            // 使用示例
  commonUsage: string[][];       // 常用组合
}
```

### 3. 字段描述混合策略

- **系统字段**: 人工维护高质量说明
- **自定义字段**: 使用 searchFields 的 name + 简单增强
- **嵌套路径**: 详细的路径描述和使用频率标注

## 实际数据分析成果

### 环境信息
- **Jira 服务器**: jira.dentsplysirona.com
- **测试样本**: DSCWA-428
- **字段总数**: 212 个实际字段 (vs searchFields 的 356 个定义)

### 核心字段发现

#### Status 字段 (11个访问路径)
```yaml
高频路径:
  - status.name: "状态名称"
  - status.statusCategory.key: "状态分类键值 (todo/progress/done)"
  - status.statusCategory.name: "状态分类名称"

中频路径:
  - status.id: "状态ID"
  - status.statusCategory.colorName: "状态颜色主题"
```

#### Assignee 字段 (12个访问路径)
```yaml
高频路径:
  - assignee.displayName: "用户显示名称"
  - assignee.emailAddress: "用户邮箱地址"

中频路径:
  - assignee.name: "用户登录名"
  - assignee.active: "用户激活状态"
  - assignee.avatarUrls.*: "头像URLs"
```

#### Project 字段 (15个访问路径)
```yaml
高频路径:
  - project.key: "项目键值"
  - project.name: "项目名称"
  - project.projectCategory.name: "项目分类名称"

中频路径:
  - project.id: "项目ID"
  - project.projectTypeKey: "项目类型"
```

## 常用字段组合模式

```typescript
const COMMON_PATTERNS = {
  basic: ["summary", "status.name", "priority.name", "issuetype.name"],
  users: ["assignee.displayName", "reporter.displayName", "creator.displayName"],
  project: ["project.key", "project.name", "project.projectCategory.name"],
  status: ["status.name", "status.statusCategory.name", "status.statusCategory.key"],
  detailed: ["key", "summary", "status.name", "assignee.displayName", "priority.name", "project.key"]
};
```

## 实施策略

### 开发流程
1. **数据收集**: 访问代表性 Issue，获取完整字段结构
2. **结构分析**: 自动分析嵌套路径，生成访问路径列表
3. **定义生成**: 结合 searchFields 信息，生成完整字段定义
4. **静态文件**: 生成 TypeScript 静态定义文件
5. **运行时服务**: Resource Handler 直接返回预编译定义

### 文件组织
```
src/resources/
├── static-definitions/
│   ├── issue-fields.ts         # Issue 域字段定义
│   ├── project-fields.ts       # Project 域字段定义
│   ├── user-fields.ts          # User 域字段定义
│   └── agile-fields.ts         # Agile 域字段定义
├── field-descriptions/
│   ├── system-descriptions.ts  # 系统字段人工说明
│   └── common-patterns.ts      # 常用字段组合
└── resource-handler.ts         # Resource 处理器
```

### 性能优化
- **内存占用**: 所有静态定义约 115KB (可忽略)
- **响应时间**: 纯内存访问，<1ms 响应
- **缓存策略**: 静态定义无需缓存逻辑

## 工具集成效果

### 增强的工具描述
```typescript
{
  fields: {
    description: `字段选择支持，完整字段列表: jira://issue/fields

常用字段模式:
• 基础: ["summary", "status.name", "assignee.displayName"]
• 详细: ["summary", "assignee.displayName", "priority.name", "created"]  

嵌套字段访问:
• status.name, status.statusCategory.key - 状态信息
• assignee.displayName, assignee.emailAddress - 用户信息
• project.key, project.projectCategory.name - 项目信息`
  }
}
```

### 字段验证集成
- MCP Server 基于 Resource URI 定义验证字段路径
- 安全过滤防止无效字段注入
- 将验证后的字段参数传递给 jira-client

## 未来扩展方向

### 新域支持
```yaml
jira://workflow/fields       # 工作流域
jira://permission/fields     # 权限域
jira://dashboard/fields      # 仪表板域
jira://custom/fields         # 全局自定义字段
```

### 版本特定支持
```yaml
jira://issue/fields?version=8.x
jira://issue/fields?version=9.x
```

### 动态更新机制
- 定期脚本更新字段定义
- 版本控制跟踪字段变化
- 自动化 CI/CD 集成

## 总结

本次讨论成功解决了 Jira MCP Server 字段选择的核心挑战：

1. **问题明确**: 识别 searchFields() API 无法提供嵌套结构信息的根本问题
2. **方案优化**: 从动态查询转向静态预定义，提升性能和准确性
3. **设计完善**: 确立域导向 URI 结构和完整的字段定义格式
4. **实施可行**: 提供详细的开发流程和代码示例
5. **文档完整**: 创建系统性文档支持后续开发和维护

这为 Jira MCP Server 的 19 个工具提供了强大的字段选择基础，使 AI 助手能够自然地使用复杂嵌套字段路径，如 `status.statusCategory.key` 和 `assignee.displayName`。

## 待讨论议题

根据用户提及，接下来需要进一步讨论：
- **动态字段问题**: 如何处理运行时字段变化
- **字段定义更新策略**: 自动化更新机制设计
- **多环境适配**: 不同 Jira 版本的字段差异处理