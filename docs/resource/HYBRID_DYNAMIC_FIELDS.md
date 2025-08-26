# 混合动静态字段架构设计

## 概述

本文档详细描述了如何将动态字段处理与现有静态字段定义完美融合，实现既保持高性能又支持实时字段发现的混合架构。

## 问题背景

### 静态字段定义的局限性

```yaml
现有问题:
  - 自定义字段经常变化（新增、删除、重命名）
  - 不同 Jira 实例字段配置差异很大
  - 字段定义可能与实际环境不匹配
  - 维护成本随环境数量增长

当前覆盖:
  - 系统字段: 42 个 (完整静态定义)
  - 自定义字段: 170 个 (仅 ID 模式验证)
```

### 动态字段的必要性

```yaml
需求驱动:
  - 实时反映 Jira 环境变化
  - 支持多 Jira 实例差异
  - 自动发现新增自定义字段
  - 提供准确的字段业务名称
```

## 融合架构设计

### 核心设计原则

```yaml
设计原则:
  1. 向后兼容: 现有静态定义完全保留
  2. 高性能: 静态字段瞬时响应，动态字段缓存优化
  3. 零破坏性: 不影响现有 API 和调用方式
  4. 可控升级: 支持渐进式启用动态功能
  5. 智能融合: 静态提供结构，动态提供时效性
```

### 分层架构

```typescript
┌─────────────────────────────────────────┐
│           MCP Client Request            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        HybridResourceHandler           │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │   Static    │    │    Dynamic      │ │
│  │  Core (42)  │    │  Custom (170+)  │ │
│  │             │    │                 │ │
│  │ • status    │    │ • searchFields  │ │
│  │ • assignee  │    │ • fieldAnalysis │ │
│  │ • project   │    │ • smartCache    │ │
│  └─────────────┘    └─────────────────┘ │
└─────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Enhanced Field Validator        │
└─────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Jira Server API              │
└─────────────────────────────────────────┘
```

## 技术实现方案

### 1. 混合资源处理器

```typescript
// src/resources/hybrid-resource-handler.ts
import { JiraResourceHandler } from './resource-handler.js';
import { JiraClientWrapper } from '../client/jira-client-wrapper.js';

export class HybridResourceHandler extends JiraResourceHandler {
  private jiraClient: JiraClientWrapper;
  private customFieldsCache = new Map<string, CustomFieldDefinitions>();
  private cacheExpiry = 60 * 60 * 1000; // 1小时TTL
  private enableDynamic = process.env.ENABLE_DYNAMIC_FIELDS === 'true';

  constructor(jiraClient: JiraClientWrapper) {
    super();
    this.jiraClient = jiraClient;
  }

  /**
   * 增强的资源读取 - 融合静态和动态字段
   */
  async readResource(uri: string): Promise<{ contents: any[] }> {
    // 1. 获取静态基础定义
    const baseDefinition = await super.readResource(uri);
    const staticDef = JSON.parse(baseDefinition.contents[0].text) as ResourceDefinition;
    
    if (!this.enableDynamic) {
      return baseDefinition; // 向后兼容模式
    }

    // 2. 动态扩展自定义字段
    const customFields = await this.getDynamicCustomFields();
    
    // 3. 融合定义
    const enhancedDefinition: EnhancedResourceDefinition = {
      ...staticDef,
      
      // 更新统计信息
      totalFields: staticDef.totalFields + Object.keys(customFields).length,
      dynamicFields: Object.keys(customFields).length,
      lastDynamicUpdate: new Date().toISOString(),
      cacheExpiry: new Date(Date.now() + this.cacheExpiry).toISOString(),
      
      // 融合字段定义
      fields: {
        ...staticDef.fields,     // 42个静态系统字段（完整定义）
        ...customFields          // 170+个动态自定义字段
      },
      
      // 扩展路径索引
      pathIndex: {
        ...staticDef.pathIndex,
        ...this.buildCustomFieldPathIndex(customFields)
      }
    };
    
    return {
      contents: [{
        type: "text",
        text: JSON.stringify(enhancedDefinition, null, 2),
        mimeType: "application/json"
      }]
    };
  }

  /**
   * 动态获取自定义字段定义
   */
  private async getDynamicCustomFields(): Promise<Record<string, FieldDefinition>> {
    const cacheKey = 'custom-fields';
    
    // 检查缓存
    if (this.isValidCache(cacheKey)) {
      return this.customFieldsCache.get(cacheKey)!;
    }
    
    try {
      // 1. 获取所有字段列表
      const allFields = await this.jiraClient.searchFields();
      const customFields = allFields.filter(f => f.id.startsWith('customfield_'));
      
      console.log(`🔍 发现 ${customFields.length} 个自定义字段`);
      
      // 2. 可选：分析字段实际使用情况
      const fieldUsage = await this.analyzeCustomFieldUsage(customFields);
      
      // 3. 生成字段定义
      const definitions: Record<string, FieldDefinition> = {};
      for (const field of customFields) {
        definitions[field.id] = this.buildCustomFieldDefinition(field, fieldUsage[field.id]);
      }
      
      // 4. 缓存结果
      this.customFieldsCache.set(cacheKey, definitions);
      
      console.log(`✅ 生成 ${Object.keys(definitions).length} 个自定义字段定义`);
      return definitions;
      
    } catch (error) {
      console.error('❌ 获取动态字段失败:', error);
      return {}; // 失败时返回空对象，不影响静态字段
    }
  }

  /**
   * 构建自定义字段定义
   */
  private buildCustomFieldDefinition(field: JiraField, usage?: FieldUsageAnalysis): FieldDefinition {
    const fieldType = this.inferFieldType(field);
    const accessPaths = this.generateAccessPaths(field, fieldType, usage);
    
    return {
      id: field.id,
      name: field.name,                    // 来自 searchFields API
      description: this.generateDescription(field),
      type: fieldType,
      accessPaths,
      structure: fieldType === 'object' ? this.inferObjectStructure(field, usage) : undefined,
      examples: this.generateExamples(field, accessPaths),
      commonUsage: this.generateCommonUsage(field, usage),
      source: 'dynamic',                   // 标识字段来源
      confidence: this.calculateConfidence(field, usage)
    };
  }

  /**
   * 字段类型推断
   */
  private inferFieldType(field: JiraField): FieldType {
    // 基于 searchFields 的 schema 信息推断
    if (field.schema) {
      switch (field.schema.type) {
        case 'array': return 'array';
        case 'option': 
        case 'user':
        case 'project':
        case 'issuetype': return 'object';
        case 'string':
        case 'number':
        case 'date':
        case 'datetime': return 'string';
        default: return 'string';
      }
    }
    
    // 基于字段名模式推断
    if (field.name.toLowerCase().includes('date')) return 'string';
    if (field.name.toLowerCase().includes('user')) return 'object';
    if (field.name.toLowerCase().includes('select')) return 'object';
    
    return 'string'; // 默认类型
  }

  /**
   * 生成访问路径
   */
  private generateAccessPaths(field: JiraField, type: FieldType, usage?: FieldUsageAnalysis): AccessPath[] {
    const paths: AccessPath[] = [];
    
    // 基础路径
    paths.push({
      path: field.id,
      description: field.name,
      type: type,
      frequency: 'high'
    });
    
    // 根据类型生成嵌套路径
    if (type === 'object') {
      // 常见对象字段的嵌套路径
      paths.push(
        {
          path: `${field.id}.value`,
          description: `${field.name}的值`,
          type: 'string',
          frequency: 'high'
        },
        {
          path: `${field.id}.id`,
          description: `${field.name}的ID`,
          type: 'string',
          frequency: 'medium'
        },
        {
          path: `${field.id}.self`,
          description: `${field.name}的REST API URL`,
          type: 'string',
          frequency: 'low'
        }
      );
    }
    
    if (type === 'array') {
      paths.push(
        {
          path: `${field.id}[]`,
          description: `${field.name}数组`,
          type: 'array',
          frequency: 'high'
        },
        {
          path: `${field.id}[].value`,
          description: `${field.name}数组元素值`,
          type: 'string',
          frequency: 'medium'
        }
      );
    }
    
    return paths;
  }

  /**
   * 缓存有效性检查
   */
  private isValidCache(key: string): boolean {
    const cached = this.customFieldsCache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheTime = cached.timestamp || 0;
    return (now - cacheTime) < this.cacheExpiry;
  }
}
```

### 2. 增强的字段验证器

```typescript
// src/resources/enhanced-field-validator.ts
export class EnhancedFieldValidator {
  private hybridResourceHandler: HybridResourceHandler;
  
  constructor(hybridResourceHandler: HybridResourceHandler) {
    this.hybridResourceHandler = hybridResourceHandler;
  }

  /**
   * 增强的字段路径验证
   */
  async validateFieldPaths(entityType: string, fieldPaths: string[]): Promise<ValidationResult> {
    // 1. 获取完整字段定义（静态+动态）
    const resourceUri = `jira://${entityType}/fields`;
    const fullDefinition = await this.hybridResourceHandler.readResource(resourceUri);
    const fieldDefs = JSON.parse(fullDefinition.contents[0].text) as EnhancedResourceDefinition;
    
    const errors: string[] = [];
    const validPaths: string[] = [];
    const suggestions: string[] = [];
    
    for (const path of fieldPaths) {
      const validation = this.validateSinglePath(path, fieldDefs);
      
      if (validation.valid) {
        validPaths.push(path);
      } else {
        errors.push(`Invalid field path: ${path}`);
        if (validation.suggestion) {
          suggestions.push(`Did you mean: ${validation.suggestion}?`);
        }
      }
    }
    
    return { 
      valid: errors.length === 0, 
      validPaths, 
      errors,
      suggestions 
    };
  }

  /**
   * 单个路径验证
   */
  private validateSinglePath(path: string, fieldDefs: EnhancedResourceDefinition): PathValidation {
    // 1. 检查完整路径索引
    if (fieldDefs.pathIndex && fieldDefs.pathIndex[path]) {
      return { valid: true, confidence: 'high' };
    }
    
    // 2. 检查基础字段存在性
    const baseField = path.split('.')[0];
    const fieldDef = fieldDefs.fields[baseField];
    
    if (!fieldDef) {
      return { 
        valid: false, 
        suggestion: this.findSimilarField(baseField, fieldDefs) 
      };
    }
    
    // 3. 验证嵌套路径
    if (path.includes('.')) {
      return this.validateNestedPath(path, fieldDef);
    }
    
    return { valid: true, confidence: fieldDef.source === 'static' ? 'high' : 'medium' };
  }

  /**
   * 嵌套路径验证
   */
  private validateNestedPath(path: string, fieldDef: FieldDefinition): PathValidation {
    const pathParts = path.split('.');
    
    // 检查字段定义中是否包含此路径
    if (fieldDef.accessPaths) {
      const foundPath = fieldDef.accessPaths.find(ap => ap.path === path);
      if (foundPath) {
        return { valid: true, confidence: 'high' };
      }
    }
    
    // 基于字段类型进行推断验证
    if (fieldDef.type === 'object' && pathParts.length === 2) {
      const subProperty = pathParts[1];
      if (['value', 'id', 'name', 'self'].includes(subProperty)) {
        return { valid: true, confidence: 'medium' };
      }
    }
    
    return { 
      valid: false, 
      suggestion: this.suggestValidPath(pathParts[0], fieldDef) 
    };
  }

  /**
   * 相似字段查找
   */
  private findSimilarField(input: string, fieldDefs: EnhancedResourceDefinition): string | undefined {
    const fieldIds = Object.keys(fieldDefs.fields);
    
    // 简单的字符串相似度匹配
    const similarities = fieldIds.map(id => ({
      id,
      score: this.calculateSimilarity(input.toLowerCase(), id.toLowerCase())
    }));
    
    const bestMatch = similarities
      .filter(s => s.score > 0.6)
      .sort((a, b) => b.score - a.score)[0];
    
    return bestMatch?.id;
  }

  /**
   * 字符串相似度计算
   */
  private calculateSimilarity(a: string, b: string): number {
    // 简单的编辑距离算法
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }
    
    const maxLength = Math.max(a.length, b.length);
    return 1 - (matrix[a.length][b.length] / maxLength);
  }
}
```

### 3. 字段使用分析器

```typescript
// src/resources/field-usage-analyzer.ts
export class FieldUsageAnalyzer {
  private jiraClient: JiraClientWrapper;
  
  constructor(jiraClient: JiraClientWrapper) {
    this.jiraClient = jiraClient;
  }

  /**
   * 分析自定义字段实际使用情况
   */
  async analyzeCustomFieldUsage(customFields: JiraField[]): Promise<Record<string, FieldUsageAnalysis>> {
    const usage: Record<string, FieldUsageAnalysis> = {};
    
    // 获取样本Issue进行分析
    const sampleIssues = await this.getSampleIssues();
    
    for (const field of customFields) {
      usage[field.id] = this.analyzeFieldInIssues(field, sampleIssues);
    }
    
    return usage;
  }

  /**
   * 获取分析样本Issue
   */
  private async getSampleIssues(limit = 10): Promise<JiraIssue[]> {
    try {
      // 获取最近创建的Issue作为样本
      const result = await this.jiraClient.searchIssues(
        'created >= -30d ORDER BY created DESC',
        { maxResults: limit }
      );
      
      return result.issues;
    } catch (error) {
      console.warn('获取样本Issue失败，使用空样本:', error);
      return [];
    }
  }

  /**
   * 分析字段在Issue中的使用情况
   */
  private analyzeFieldInIssues(field: JiraField, issues: JiraIssue[]): FieldUsageAnalysis {
    const analysis: FieldUsageAnalysis = {
      fieldId: field.id,
      usageCount: 0,
      sampleValues: [],
      detectedType: 'string',
      nestedStructure: {},
      confidence: 'low'
    };
    
    for (const issue of issues) {
      const fieldValue = issue.fields[field.id];
      
      if (fieldValue !== null && fieldValue !== undefined) {
        analysis.usageCount++;
        
        // 收集样本值
        if (analysis.sampleValues.length < 3) {
          analysis.sampleValues.push(fieldValue);
        }
        
        // 分析嵌套结构
        if (typeof fieldValue === 'object') {
          this.analyzeObjectStructure(fieldValue, analysis.nestedStructure);
          analysis.detectedType = Array.isArray(fieldValue) ? 'array' : 'object';
        }
      }
    }
    
    // 计算置信度
    analysis.confidence = this.calculateAnalysisConfidence(analysis, issues.length);
    
    return analysis;
  }

  /**
   * 分析对象结构
   */
  private analyzeObjectStructure(obj: any, structure: Record<string, any>, prefix = ''): void {
    if (obj === null || obj === undefined) return;
    
    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        this.analyzeObjectStructure(obj[0], structure, `${prefix}[]`);
      }
      return;
    }
    
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const path = prefix ? `${prefix}.${key}` : key;
        structure[path] = typeof obj[key];
        
        if (typeof obj[key] === 'object') {
          this.analyzeObjectStructure(obj[key], structure, path);
        }
      });
    }
  }

  /**
   * 计算分析置信度
   */
  private calculateAnalysisConfidence(analysis: FieldUsageAnalysis, sampleSize: number): 'high' | 'medium' | 'low' {
    const usageRate = analysis.usageCount / sampleSize;
    
    if (usageRate > 0.5 && analysis.sampleValues.length >= 2) {
      return 'high';
    } else if (usageRate > 0.2 || analysis.sampleValues.length >= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
```

## 类型定义扩展

```typescript
// src/types/hybrid-fields.ts
export interface EnhancedResourceDefinition extends ResourceDefinition {
  // 新增统计字段
  dynamicFields?: number;              // 动态字段数量
  lastDynamicUpdate?: string;          // 动态字段最后更新时间
  cacheExpiry?: string;                // 缓存过期时间
  
  // 扩展字段定义
  fields: Record<string, FieldDefinition & {
    source?: 'static' | 'dynamic';     // 字段来源标识
    confidence?: 'high' | 'medium' | 'low'; // 定义置信度
  }>;
}

export interface FieldUsageAnalysis {
  fieldId: string;
  usageCount: number;                  // 在样本中的使用次数
  sampleValues: any[];                 // 样本值
  detectedType: FieldType;             // 检测到的类型
  nestedStructure: Record<string, any>; // 嵌套结构
  confidence: 'high' | 'medium' | 'low'; // 分析置信度
}

export interface PathValidation {
  valid: boolean;
  confidence?: 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  validPaths: string[];
  errors: string[];
  suggestions: string[];
}

export interface AccessPath {
  path: string;                        // 访问路径
  description: string;                 // 路径描述
  type: string;                        // 返回值类型
  example?: any;                       // 示例值
  frequency: 'high' | 'medium' | 'low'; // 使用频率
}

export interface CustomFieldDefinitions {
  [fieldId: string]: FieldDefinition;
  timestamp?: number;                  // 缓存时间戳
}
```

## 渐进式升级策略

### 配置选项

```typescript
// .env 配置
ENABLE_DYNAMIC_FIELDS=true           # 启用动态字段扩展
DYNAMIC_FIELD_CACHE_TTL=3600        # 缓存TTL（秒）
DYNAMIC_FIELD_ANALYSIS=true         # 启用字段使用分析
FIELD_ANALYSIS_SAMPLE_SIZE=10       # 分析样本大小
```

### 升级路径

```yaml
Phase 1 - 基础混合架构:
  - 实现 HybridResourceHandler
  - 基础动态字段发现
  - 简单缓存机制
  
Phase 2 - 智能分析:
  - 字段使用情况分析
  - 结构推断和验证
  - 智能路径建议
  
Phase 3 - 高级功能:
  - 多实例支持
  - 项目级字段过滤
  - 性能监控和优化
```

## 集成到现有架构

### 更新 MCP Server

```typescript
// src/server/jira-mcp-server.ts (更新现有文件)
import { HybridResourceHandler } from '../resources/hybrid-resource-handler.js';

export class JiraMcpServer {
  private hybridResourceHandler: HybridResourceHandler;
  
  constructor() {
    // 初始化混合资源处理器
    this.hybridResourceHandler = new HybridResourceHandler(this.jiraClient);
    this.setupHandlers();
  }
  
  private setupHandlers() {
    // 使用混合资源处理器
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return await this.hybridResourceHandler.listResources();
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      return await this.hybridResourceHandler.readResource(uri);
    });
  }
}
```

### 工具描述增强

```typescript
// src/server/tools/issue-tools.ts (更新现有工具)
export function getIssueToolDefinition(): Tool {
  return {
    name: 'getIssue',
    description: 'Get a Jira issue by key or ID with enhanced field selection support',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key or ID (e.g., PROJ-123)'
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: `Field selection with nested access support and dynamic field discovery.

📋 Complete field reference: jira://issue/fields

🔥 Enhanced capabilities:
• System fields: Full nested structure support (status.statusCategory.key)
• Custom fields: Auto-discovered with business names
• Smart validation: Real-time field validation with suggestions
• Dynamic updates: Fields reflect current Jira configuration

🎯 Example field combinations:
• Basic: ["summary", "status.name", "assignee.displayName"]
• Custom: ["customfield_10001", "customfield_10002.value"]
• Mixed: ["summary", "status.statusCategory.key", "customfield_10101"]

Note: Invalid fields are automatically filtered with suggestions provided.`
        }
      },
      required: ['issueKey']
    }
  };
}
```

## 性能优化策略

### 缓存机制

```yaml
多层缓存架构:
  Level 1 - 内存缓存:
    - 热点字段定义 (1小时TTL)
    - 字段验证结果 (30分钟TTL)
    
  Level 2 - 本地存储:
    - 字段分析结果 (24小时TTL)
    - 结构推断缓存 (12小时TTL)
    
  Level 3 - API调用:
    - searchFields() 实时获取
    - 样本Issue分析
```

### 性能监控

```typescript
// src/utils/performance-monitor.ts
export class PerformanceMonitor {
  static async measureDynamicFieldLoad(): Promise<PerformanceMetrics> {
    const start = Date.now();
    
    // 测量各个环节的耗时
    const metrics = {
      searchFieldsTime: 0,
      analysisTime: 0,
      cacheHitRate: 0,
      totalTime: 0
    };
    
    // ... 性能测量逻辑
    
    return metrics;
  }
}
```

## 错误处理和降级

### 错误恢复策略

```typescript
export class FaultTolerantFieldHandler {
  async getDynamicFields(): Promise<Record<string, FieldDefinition>> {
    try {
      return await this.hybridResourceHandler.getDynamicCustomFields();
    } catch (error) {
      console.error('动态字段获取失败，使用降级策略:', error);
      
      // 降级策略1: 使用缓存
      const cached = this.getCachedFields();
      if (cached) return cached;
      
      // 降级策略2: 基础自定义字段支持
      return this.generateBasicCustomFieldSupport();
    }
  }
  
  private generateBasicCustomFieldSupport(): Record<string, FieldDefinition> {
    // 生成基础的自定义字段支持（仅 ID 验证）
    const basicSupport: Record<string, FieldDefinition> = {};
    
    // 假设常见的自定义字段范围
    for (let i = 10000; i <= 20000; i++) {
      const fieldId = `customfield_${i}`;
      basicSupport[fieldId] = {
        id: fieldId,
        name: `Custom Field ${i}`,
        description: `自定义字段 ${fieldId}`,
        type: 'string',
        accessPaths: [fieldId],
        examples: [fieldId],
        commonUsage: [],
        source: 'fallback',
        confidence: 'low'
      };
    }
    
    return basicSupport;
  }
}
```

## 监控和调试

### 调试信息

```typescript
export interface DynamicFieldDebugInfo {
  staticFields: number;
  dynamicFields: number;
  cacheHitRate: number;
  lastUpdate: string;
  failureCount: number;
  performanceMetrics: {
    avgResponseTime: number;
    cacheSize: number;
    analysisTime: number;
  };
}

// 调试端点
export class FieldDebugEndpoint {
  async getDebugInfo(): Promise<DynamicFieldDebugInfo> {
    return {
      staticFields: 42,
      dynamicFields: this.dynamicFieldCount,
      cacheHitRate: this.calculateCacheHitRate(),
      lastUpdate: this.lastDynamicUpdate,
      failureCount: this.failureCount,
      performanceMetrics: await this.getPerformanceMetrics()
    };
  }
}
```

## 测试策略

### 单元测试

```typescript
// tests/unit/hybrid-resource-handler.test.ts
describe('HybridResourceHandler', () => {
  it('should merge static and dynamic fields correctly', async () => {
    const handler = new HybridResourceHandler(mockJiraClient);
    const result = await handler.readResource('jira://issue/fields');
    const definition = JSON.parse(result.contents[0].text);
    
    expect(definition.totalFields).toBe(212); // 42 static + 170 dynamic
    expect(definition.fields.status).toBeDefined(); // Static field
    expect(definition.fields.customfield_10001).toBeDefined(); // Dynamic field
  });
  
  it('should handle dynamic field failures gracefully', async () => {
    const handler = new HybridResourceHandler(failingJiraClient);
    const result = await handler.readResource('jira://issue/fields');
    const definition = JSON.parse(result.contents[0].text);
    
    expect(definition.totalFields).toBe(42); // Only static fields
    expect(definition.fields.status).toBeDefined();
  });
});
```

### 集成测试

```typescript
// tests/integration/hybrid-fields.test.ts
describe('Hybrid Field Integration', () => {
  it('should validate mixed field paths correctly', async () => {
    const validator = new EnhancedFieldValidator(hybridHandler);
    const result = await validator.validateFieldPaths('issue', [
      'status.name',              // Static nested path
      'customfield_10001',        // Dynamic field
      'customfield_10001.value',  // Dynamic nested path
      'invalid.field'             // Invalid path
    ]);
    
    expect(result.validPaths).toHaveLength(3);
    expect(result.errors).toHaveLength(1);
    expect(result.suggestions).toHaveLength(1);
  });
});
```

## 总结

混合动静态字段架构通过以下方式实现了完美融合：

### 核心优势

1. **零破坏性升级**: 现有静态字段定义完全保留，API 调用方式不变
2. **高性能**: 静态字段瞬时响应，动态字段智能缓存
3. **100%覆盖**: 系统字段（42个）+ 自定义字段（170+个）= 完整覆盖
4. **智能化**: 自动发现、结构推断、路径验证、错误建议
5. **可控性**: 可配置启用/禁用，渐进式升级路径

### 技术特点

- **分层架构**: 静态核心 + 动态扩展，职责清晰
- **智能缓存**: 多层缓存策略，平衡性能和时效性
- **容错处理**: 完善的错误恢复和降级机制
- **可观测性**: 全面的监控、调试和性能分析

这个架构既保持了静态字段定义的所有优势（完整嵌套路径、高性能、准确性），又解决了动态字段的实时性需求，为 Jira MCP Server 提供了一个可持续发展的字段管理解决方案。