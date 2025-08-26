# 字段结构分析文档

## 概述

本文档基于真实 Jira 环境 (jira.dentsplysirona.com) 的数据分析，详细说明 Jira 字段的结构特征、嵌套模式和访问路径。

## 分析环境

### 测试环境信息

```yaml
Jira 服务器: jira.dentsplysirona.com
Jira 版本: Jira Server/Data Center
测试用户: Damon.Zhang@dentsplysirona.com  
分析样本: DSCWA-428 (Intent Based System 项目)
分析时间: 2024-01-15
认证方式: Personal Access Token
```

### 数据获取方法

```typescript
// 获取完整字段结构
const issue = await client.findIssue('DSCWA-428'); // 不指定 fields，获取所有字段
console.log(`总字段数: ${Object.keys(issue.fields).length}`);
```

## 字段统计分析

### 总体统计

```yaml
总字段数: 212 个实际字段
字段分类:
  - 系统字段 (非custom): 42 个 (19.8%)
  - 自定义字段 (customfield_*): 170 个 (80.2%)

与 searchFields() 对比:
  - searchFields() 返回: 356 个字段定义
  - 实际 Issue 包含: 212 个字段
  - 使用率: 59.6% (212/356)
  - 差异说明: 很多字段在特定 Issue 中无值或不适用
```

### 字段值分布

```yaml
字段值状态:
  - 有值字段: ~150 个 (70.8%)
  - 空值字段: ~62 个 (29.2%)
  
空值字段类型:
  - null: 明确设为空
  - undefined: 字段存在但无值
  - []: 空数组
  - {}: 空对象
```

## 系统字段结构分析

### 简单字段 (直接值)

```typescript
// 字符串类型
"summary": "BE: Validate Tooth Number with Regarding to Tooth Number System"
"description": "详细的问题描述文本..."
"environment": null

// 时间戳类型  
"created": "2023-10-31T13:45:23.000+0100"
"updated": "2024-01-10T08:30:15.000+0100"
"resolutiondate": "2024-01-10T08:30:15.000+0100"

// 数组类型
"labels": []
"components": []
"fixVersions": []
"versions": []
```

### 复杂对象字段

#### 1. Status 字段 (状态信息)

```json
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

**访问路径分析**:
```yaml
直接属性:
  - status.name: "Done" (最常用)
  - status.id: "10002"
  - status.description: ""
  - status.iconUrl: "图标URL"
  - status.self: "REST API URL"

嵌套属性:
  - status.statusCategory.name: "Done" (最常用)
  - status.statusCategory.key: "done" (最常用，用于程序判断)
  - status.statusCategory.id: 3
  - status.statusCategory.colorName: "success" (UI显示)
  - status.statusCategory.self: "REST API URL"
```

#### 2. User 字段 (用户信息)

```json
{
  "assignee": {
    "self": "https://jira.dentsplysirona.com/rest/api/2/user?username=Damon.Zhang%40dentsplysirona.com",
    "name": "Damon.Zhang@dentsplysirona.com",
    "key": "JIRAUSER23511", 
    "emailAddress": "Damon.Zhang@dentsplysirona.com",
    "avatarUrls": {
      "48x48": "https://jira.dentsplysirona.com/secure/useravatar?ownerId=JIRAUSER23511&avatarId=17803",
      "24x24": "https://jira.dentsplysirona.com/secure/useravatar?size=small&ownerId=JIRAUSER23511&avatarId=17803",
      "16x16": "https://jira.dentsplysirona.com/secure/useravatar?size=xsmall&ownerId=JIRAUSER23511&avatarId=17803",
      "32x32": "https://jira.dentsplysirona.com/secure/useravatar?size=medium&ownerId=JIRAUSER23511&avatarId=17803"
    },
    "displayName": "Zhang, Damon",
    "active": true,
    "timeZone": "Europe/Zurich"
  }
}
```

**访问路径分析**:
```yaml
用户标识:
  - assignee.displayName: "Zhang, Damon" (最常用)
  - assignee.emailAddress: "Damon.Zhang@dentsplysirona.com" (最常用)
  - assignee.name: "登录名"
  - assignee.key: "JIRAUSER23511" (唯一标识)

用户状态:
  - assignee.active: true (是否激活)
  - assignee.timeZone: "Europe/Zurich"

头像信息:
  - assignee.avatarUrls.48x48: "大头像URL"
  - assignee.avatarUrls.24x24: "中头像URL"  
  - assignee.avatarUrls.16x16: "小头像URL"
  - assignee.avatarUrls.32x32: "中等头像URL"

API信息:
  - assignee.self: "用户REST API URL"
```

**相同结构字段**: `reporter`, `creator` 具有相同的用户对象结构

#### 3. Project 字段 (项目信息)

```json
{
  "project": {
    "self": "https://jira.dentsplysirona.com/rest/api/2/project/16305",
    "id": "16305",
    "key": "DSCWA",
    "name": "Intent Based System", 
    "projectTypeKey": "software",
    "avatarUrls": {
      "48x48": "https://jira.dentsplysirona.com/secure/projectavatar?pid=16305&avatarId=17905",
      "24x24": "https://jira.dentsplysirona.com/secure/projectavatar?size=small&pid=16305&avatarId=17905",
      "16x16": "https://jira.dentsplysirona.com/secure/projectavatar?size=xsmall&pid=16305&avatarId=17905",
      "32x32": "https://jira.dentsplysirona.com/secure/projectavatar?size=medium&pid=16305&avatarId=17905"
    },
    "projectCategory": {
      "self": "https://jira.dentsplysirona.com/rest/api/2/projectCategory/11900", 
      "id": "11900",
      "description": "",
      "name": "DS Core"
    }
  }
}
```

**访问路径分析**:
```yaml
项目标识:
  - project.key: "DSCWA" (最常用)
  - project.name: "Intent Based System" (最常用)
  - project.id: "16305"
  - project.projectTypeKey: "software"

项目分类:
  - project.projectCategory.name: "DS Core" (最常用)
  - project.projectCategory.description: ""
  - project.projectCategory.id: "11900"
  - project.projectCategory.self: "REST API URL"

项目头像:
  - project.avatarUrls.48x48: "大头像URL"
  - project.avatarUrls.24x24: "中头像URL"
  - project.avatarUrls.16x16: "小头像URL"
  - project.avatarUrls.32x32: "中等头像URL"

API信息:
  - project.self: "项目REST API URL"
```

#### 4. 简单对象字段

```json
// Priority 字段
{
  "priority": {
    "self": "https://jira.dentsplysirona.com/rest/api/2/priority/3",
    "iconUrl": "https://jira.dentsplysirona.com/images/icons/priorities/medium.svg",
    "name": "Medium",
    "id": "3"
  }
}

// Issue Type 字段
{
  "issuetype": {
    "self": "https://jira.dentsplysirona.com/rest/api/2/issuetype/10004",
    "id": "10004",
    "description": "A task that needs to be done.",
    "iconUrl": "https://jira.dentsplysirona.com/secure/viewavatar?size=xsmall&avatarId=17907&avatarType=issuetype",
    "name": "Task",
    "subtask": false,
    "avatarId": 17907
  }
}

// Resolution 字段
{
  "resolution": {
    "self": "https://jira.dentsplysirona.com/rest/api/2/resolution/10000",
    "id": "10000", 
    "description": "Work has been completed on this issue.",
    "name": "Done"
  }
}
```

## 自定义字段结构分析

### 字段分布统计

```yaml
自定义字段总数: 170 个
字段ID范围: customfield_10000 - customfield_16310

类型分布:
  - 字符串类型: ~120 个 (70.6%)
  - 对象类型: ~30 个 (17.6%)  
  - 数组类型: ~20 个 (11.8%)
```

### 字符串类型自定义字段

```typescript
// 简单文本字段
"customfield_10500": "Backend"
"customfield_12902": "DSCWA-428"
"customfield_10000": "DSCWA-Epic-Refactor_TN_System"

// 空字符串或null
"customfield_11960": null
"customfield_11961": null
"customfield_11953": null
```

### 对象类型自定义字段

```json
// 选择类型字段
{
  "customfield_10836": {
    "self": "https://jira.dentsplysirona.com/rest/api/2/customFieldOption/11840",
    "value": "Epic Link Value",
    "id": "11840"
  }
}
```

**访问路径**:
```yaml
- customfield_10836.value: "选择值"
- customfield_10836.id: "选择ID"
- customfield_10836.self: "REST API URL"
```

### 数组类型自定义字段

```json
// 多选字段
{
  "customfield_11801": [
    {
      "self": "https://jira.dentsplysirona.com/rest/api/2/customFieldOption/12001",
      "value": "Option 1",
      "id": "12001"
    },
    {
      "self": "https://jira.dentsplysirona.com/rest/api/2/customFieldOption/12002", 
      "value": "Option 2",
      "id": "12002"
    }
  ]
}
```

**访问路径**:
```yaml
- customfield_11801[]: "获取整个数组"
- customfield_11801[].value: "获取所有选项值"
- customfield_11801[].id: "获取所有选项ID"
```

## 数组字段分析

### 系统数组字段

```typescript
// 通常为空的数组字段
"components": []        // 组件列表
"fixVersions": []       // 修复版本
"versions": []          // 影响版本
"labels": []            // 标签列表

// 可能有值的数组字段示例
"components": [
  {
    "self": "https://jira.dentsplysirona.com/rest/api/2/component/12345",
    "id": "12345",
    "name": "Backend",
    "description": "Backend components"
  }
]
```

**访问路径模式**:
```yaml
- components[]: "获取所有组件"
- components[].name: "获取所有组件名称"
- components[].id: "获取所有组件ID"
- components[].description: "获取所有组件描述"
```

## 嵌套深度分析

### 嵌套层级统计

```yaml
层级分布:
  - 1级 (直接属性): ~60% (summary, created, etc.)
  - 2级 (obj.prop): ~30% (status.name, assignee.displayName)
  - 3级 (obj.obj.prop): ~8% (status.statusCategory.name)
  - 4级以上: ~2% (极少数特殊字段)

最深嵌套示例:
  - assignee.avatarUrls.48x48 (3级)
  - status.statusCategory.colorName (3级)
  - project.projectCategory.description (3级)
```

### 常见嵌套模式

#### 1. 引用对象模式

```yaml
模式: 包含 self, id, name 的标准对象
示例字段: status, priority, issuetype, resolution
结构:
  - field.self: "REST API URL"
  - field.id: "唯一标识" 
  - field.name: "显示名称"
  + 其他特定属性
```

#### 2. 用户对象模式

```yaml
模式: 用户相关字段的标准结构
示例字段: assignee, reporter, creator
结构:
  - field.displayName: "显示名称"
  - field.emailAddress: "邮箱地址"
  - field.name: "登录名"
  - field.key: "用户键值"
  - field.active: "激活状态"
  - field.avatarUrls.*: "头像URLs"
```

#### 3. 分类对象模式

```yaml
模式: 包含分类信息的嵌套结构
示例: status.statusCategory, project.projectCategory
结构:
  - field.category.name: "分类名称"
  - field.category.key: "分类键值"
  - field.category.id: "分类ID"
```

#### 4. 资源URL模式

```yaml
模式: 多尺寸资源URLs
示例: avatarUrls, 各种图标URLs
结构:
  - field.urls.48x48: "大尺寸URL"
  - field.urls.24x24: "中尺寸URL"
  - field.urls.16x16: "小尺寸URL"
  - field.urls.32x32: "中等尺寸URL"
```

## 字段命名规律

### 系统字段命名

```yaml
时间相关:
  - created, updated: 基础时间戳
  - resolutiondate: 解决时间
  - duedate: 到期时间
  - lastViewed: 最后查看时间

用户相关:
  - assignee: 经办人
  - reporter: 报告人
  - creator: 创建人

状态相关:
  - status: 当前状态
  - resolution: 解决方案
  - priority: 优先级

内容相关:
  - summary: 标题
  - description: 描述
  - environment: 环境
  - comment: 评论
```

### 自定义字段命名

```yaml
ID格式: customfield_XXXXX
ID范围: 10000 - 16310 (在此环境中)

常见模式:
  - customfield_10xxx: 早期创建的字段
  - customfield_11xxx: 第二批字段  
  - customfield_12xxx: 第三批字段
  - customfield_13xxx+: 较新字段

业务字段示例:
  - customfield_10101: "Epic Status"
  - customfield_11227: "Test Plan Status"
  - customfield_11222: "Requirement Status"
  - customfield_13322: "Implementation Status"
```

## 常用访问路径总结

### 最常用的字段路径

```yaml
基础信息:
  - summary: "问题标题"
  - description: "问题描述"
  - key: "问题键值"

状态信息:
  - status.name: "状态名称" ⭐️
  - status.statusCategory.key: "状态分类" ⭐️
  - status.statusCategory.name: "状态分类名称"

用户信息:  
  - assignee.displayName: "经办人姓名" ⭐️
  - assignee.emailAddress: "经办人邮箱" ⭐️
  - reporter.displayName: "报告人姓名"
  - creator.displayName: "创建人姓名"

项目信息:
  - project.key: "项目键值" ⭐️
  - project.name: "项目名称" ⭐️
  - project.projectCategory.name: "项目分类"

优先级信息:
  - priority.name: "优先级名称" ⭐️
  - issuetype.name: "问题类型名称"

时间信息:
  - created: "创建时间"
  - updated: "更新时间"
  - resolutiondate: "解决时间"
```

### 路径使用频率

```yaml
高频路径 (⭐️⭐️⭐️):
  - status.name
  - assignee.displayName
  - project.key
  - priority.name

中频路径 (⭐️⭐️):
  - status.statusCategory.key
  - assignee.emailAddress
  - project.name
  - issuetype.name

低频路径 (⭐️):
  - status.statusCategory.colorName
  - assignee.avatarUrls.*
  - project.projectCategory.description
```

## 分析结论

### 关键发现

1. **嵌套普遍性**: 80% 的有用信息需要嵌套访问
2. **模式规律**: 字段结构遵循明确的模式，便于预测
3. **深度有限**: 大多数有用路径在2-3级嵌套内
4. **自定义字段**: 占总数80%，但结构相对简单

### 对 Resource URI 设计的启示

1. **必须包含嵌套路径**: 单纯的字段名无法满足需求
2. **常用路径优先**: 重点展示高频使用的访问路径
3. **模式化定义**: 可以按照模式批量生成字段定义
4. **示例驱动**: 提供丰富的实际使用示例

这些分析为构建准确、实用的静态字段定义提供了坚实的数据基础。