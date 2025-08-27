# Fields Parameter Support Analysis

## Overview

This document provides a comprehensive analysis of the current state of fields parameter support across all 19 MCP tools in the Jira MCP Server implementation. It serves as the foundation for implementing Task-0.1 through Task-0.6 of Phase 0: Universal Fields Parameter Support.

## Current State Summary

### Tools WITH Fields Support (5 tools)
✅ **Existing Implementation** - These tools already have fields parameter support implemented:

| Tool | Status | Implementation Notes |
|------|--------|---------------------|
| `getIssue` | ✅ Complete | Native Jira API support via `findIssue(key, '', fields)` |
| `searchIssues` | ✅ Complete | Native Jira API support via `searchJira(jql, {fields})` |
| `getProjectIssues` | ✅ Complete | Leverages `searchIssues` internally with fields support |
| `getBoardIssues` | ✅ Complete | Native Jira API support via `getIssuesForBoard(..., fields)` |
| `getSprintIssues` | ✅ Complete | Leverages `searchIssues` internally with fields support |

### Tools WITHOUT Fields Support (14 tools)
❌ **Needs Implementation** - These tools require fields parameter support:

| Tool | Category | Priority | JiraClient Method | Implementation Strategy |
|------|----------|----------|------------------|------------------------|
| `getAllProjects` | Project Management | High | `listProjects()` | Client-side filtering |
| `getProject` | Project Management | High | `getProject(key)` | Client-side filtering |
| `getProjectVersions` | Project Management | Medium | `getVersions(projectKey)` | Client-side filtering |
| `getCurrentUser` | User Management | High | `getCurrentUser()` | Client-side filtering |
| `getUserProfile` | User Management | High | `searchUsers({...})` | Client-side filtering |
| `getAgileBoards` | Agile Management | High | `getAllBoards()` | Client-side filtering |
| `getSprintsFromBoard` | Agile Management | Medium | `getAllSprints(boardId)` | Client-side filtering |
| `getSprint` | Agile Management | Medium | `getSprint(sprintId)` | Client-side filtering |
| `getIssueTransitions` | Issue Operations | Low | `listTransitions(issueKey)` | Client-side filtering |
| `getIssueWorklogs` | Issue Operations | Low | `getIssueWorklogs(issueKey)` | Client-side filtering |
| `searchFields` | System Information | Low | `listFields()` | Client-side filtering |
| `getSystemInfo` | System Information | Low | `getServerInfo()` | Client-side filtering |
| `getServerInfo` | System Information | Low | `getServerInfo()` | Client-side filtering |
| `downloadAttachments` | Issue Operations | Low | `findIssue(key, '', 'attachment')` | Already optimized |

## Implementation Categories

### Category A: Native API Support
**Tools where Jira REST API natively supports fields parameter**

| Tool | JiraClient Method | API Endpoint | Fields Support | Status |
|------|------------------|--------------|----------------|--------|
| `getIssue` | `findIssue(key, '', fields)` | `/rest/api/2/issue/{key}` | ✅ Native | Already implemented |
| `searchIssues` | `searchJira(jql, {fields})` | `/rest/api/2/search` | ✅ Native | Already implemented |
| `getBoardIssues` | `getIssuesForBoard(..., fields)` | `/rest/agile/1.0/board/{id}/issue` | ✅ Native | Already implemented |
| `downloadAttachments` | `findIssue(key, '', 'attachment')` | `/rest/api/2/issue/{key}` | ✅ Native | Already optimized |

**Note**: `getProjectIssues` and `getSprintIssues` use internal delegation to `searchIssues`, so they inherit native support.

### Category B: No API Support - Client-Side Filtering Required
**Tools where Jira REST API does NOT support fields parameter**

| Tool | JiraClient Method | API Endpoint | Implementation Strategy |
|------|------------------|--------------|------------------------|
| `getAllProjects` | `listProjects()` | `/rest/api/2/project` | Client-side filtering using FieldFilter utility |
| `getProject` | `getProject(key)` | `/rest/api/2/project/{key}` | Client-side filtering using FieldFilter utility |
| `getProjectVersions` | `getVersions(projectKey)` | `/rest/api/2/project/{key}/versions` | Client-side filtering using FieldFilter utility |
| `getCurrentUser` | `getCurrentUser()` | `/rest/api/2/myself` | Client-side filtering using FieldFilter utility |
| `getUserProfile` | `searchUsers({...})` | `/rest/api/2/user/search` | Client-side filtering using FieldFilter utility |
| `getAgileBoards` | `getAllBoards()` | `/rest/agile/1.0/board` | Client-side filtering using FieldFilter utility |
| `getSprintsFromBoard` | `getAllSprints(boardId)` | `/rest/agile/1.0/board/{id}/sprint` | Client-side filtering using FieldFilter utility |
| `getSprint` | `getSprint(sprintId)` | `/rest/agile/1.0/sprint/{id}` | Client-side filtering using FieldFilter utility |
| `getIssueTransitions` | `listTransitions(issueKey)` | `/rest/api/2/issue/{key}/transitions` | Client-side filtering using FieldFilter utility |
| `getIssueWorklogs` | `getIssueWorklogs(issueKey)` | `/rest/api/2/issue/{key}/worklog` | Client-side filtering using FieldFilter utility |
| `searchFields` | `listFields()` | `/rest/api/2/field` | Client-side filtering using FieldFilter utility |
| `getSystemInfo` | `getServerInfo()` | `/rest/api/2/serverInfo` | Client-side filtering using FieldFilter utility |
| `getServerInfo` | `getServerInfo()` | `/rest/api/2/serverInfo` | Client-side filtering using FieldFilter utility |

## Implementation Priority

### High Priority (User-Facing Data Tools)
**Tools that return substantial user data and would benefit most from field filtering**

1. **Project Management Tools** (3 tools)
   - `getAllProjects` - Returns arrays of project objects with extensive metadata
   - `getProject` - Returns detailed project information with nested structures
   - `getProjectVersions` - Returns version arrays with metadata

2. **User Management Tools** (2 tools)
   - `getCurrentUser` - Returns current user profile with detailed information
   - `getUserProfile` - Returns user profile data with extensive metadata

3. **Agile Management Tools** (3 tools)
   - `getAgileBoards` - Returns board arrays with configuration details
   - `getSprintsFromBoard` - Returns sprint arrays with dates and metadata
   - `getSprint` - Returns detailed sprint information

### Medium Priority (System Information Tools)
**Tools that return system/configuration data**

4. **System Information Tools** (3 tools)
   - `getSystemInfo` - Returns server version and system configuration
   - `getServerInfo` - Returns server runtime information
   - `searchFields` - Returns field definitions and metadata

### Low Priority (Meta Tools)
**Tools with specialized use cases or smaller response payloads**

5. **Issue Metadata Tools** (3 tools)
   - `getIssueTransitions` - Returns available status transitions
   - `getIssueWorklogs` - Returns work log entries
   - `downloadAttachments` - Already optimized (returns attachment metadata only)

## Detailed Tool Analysis

### Issue Tools (5 tools)

#### ✅ getIssue
- **Current Status**: Fields support implemented
- **JiraClient Method**: `findIssue(issueKey, '', fields.join(','))`
- **API Support**: ✅ Native Jira API support
- **Implementation**: Complete
- **Resource Reference**: `jira://issue/fields`

#### ❌ getIssueTransitions
- **Current Status**: No fields support
- **JiraClient Method**: `listTransitions(issueKey)`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering
- **Suggested Fields**: `["id", "name", "to.name", "to.statusCategory.key"]`
- **Resource Reference**: `jira://issue/fields` (transition-specific subset)

#### ✅ searchIssues
- **Current Status**: Fields support implemented
- **JiraClient Method**: `searchJira(jql, {fields})`
- **API Support**: ✅ Native Jira API support
- **Implementation**: Complete
- **Resource Reference**: `jira://issue/fields`

#### ❌ getIssueWorklogs
- **Current Status**: No fields support
- **JiraClient Method**: `getIssueWorklogs(issueKey)`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering
- **Suggested Fields**: `["id", "author.displayName", "created", "timeSpent", "comment"]`
- **Resource Reference**: `jira://issue/fields` (worklog-specific subset)

#### ⚠️ downloadAttachments
- **Current Status**: Already optimized
- **JiraClient Method**: `findIssue(issueKey, '', 'attachment')`
- **API Support**: ✅ Native Jira API support (pre-filtered)
- **Implementation Strategy**: No action needed - already uses optimized field selection
- **Note**: Returns attachment metadata only, not file content

### Project Tools (4 tools)

#### ❌ getAllProjects
- **Current Status**: No fields support
- **JiraClient Method**: `listProjects()`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["key", "name", "projectCategory.name", "lead.displayName", "projectTypeKey"]`
- **Resource Reference**: `jira://project/fields`
- **Performance Impact**: High - returns all projects, significant data reduction potential

#### ❌ getProject
- **Current Status**: No fields support
- **JiraClient Method**: `getProject(projectKey)`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["key", "name", "description", "lead.displayName", "components[].name", "versions[].name"]`
- **Resource Reference**: `jira://project/fields`
- **Performance Impact**: Medium - detailed project object with nested structures

#### ✅ getProjectIssues
- **Current Status**: Fields support implemented
- **JiraClient Method**: Delegates to `searchIssues(jql, options)`
- **API Support**: ✅ Native Jira API support (via delegation)
- **Implementation**: Complete via internal `searchIssues` call
- **Resource Reference**: `jira://issue/fields`

#### ❌ getProjectVersions
- **Current Status**: No fields support
- **JiraClient Method**: `getVersions(projectKey)`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["id", "name", "released", "archived", "releaseDate", "description"]`
- **Resource Reference**: `jira://project/fields` (version-specific subset)
- **Performance Impact**: Low - version arrays typically small

### User Tools (2 tools)

#### ❌ getCurrentUser
- **Current Status**: No fields support
- **JiraClient Method**: `getCurrentUser()`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["name", "displayName", "emailAddress", "active", "timeZone", "groups.items[].name"]`
- **Resource Reference**: `jira://user/fields`
- **Performance Impact**: Low - single user object

#### ❌ getUserProfile
- **Current Status**: No fields support
- **JiraClient Method**: `searchUsers(query, maxResults)` (searches by username)
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["name", "displayName", "emailAddress", "active", "avatarUrls", "timeZone"]`
- **Resource Reference**: `jira://user/fields`
- **Performance Impact**: Low - single user object

### Agile Tools (5 tools)

#### ❌ getAgileBoards
- **Current Status**: No fields support
- **JiraClient Method**: `getAllBoards()`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["id", "name", "type", "location.projectKey", "location.name"]`
- **Resource Reference**: `jira://agile/fields`
- **Performance Impact**: Medium - board arrays with configuration metadata

#### ✅ getBoardIssues
- **Current Status**: Fields support implemented
- **JiraClient Method**: `getIssuesForBoard(boardId, startAt, maxResults, jql, validateQuery, fieldsString)`
- **API Support**: ✅ Native Jira API support
- **Implementation**: Complete
- **Resource Reference**: `jira://issue/fields`

#### ❌ getSprintsFromBoard
- **Current Status**: No fields support
- **JiraClient Method**: `getAllSprints(boardId)`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["id", "name", "state", "startDate", "endDate", "completeDate", "goal"]`
- **Resource Reference**: `jira://agile/fields`
- **Performance Impact**: Medium - sprint arrays with date metadata

#### ✅ getSprintIssues
- **Current Status**: Fields support implemented
- **JiraClient Method**: Delegates to `searchIssues(jql, options)` where `jql = "sprint = {sprintId}"`
- **API Support**: ✅ Native Jira API support (via delegation)
- **Implementation**: Complete via internal `searchIssues` call
- **Resource Reference**: `jira://issue/fields`

#### ❌ getSprint
- **Current Status**: No fields support
- **JiraClient Method**: `getSprint(sprintId)`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["id", "name", "state", "startDate", "endDate", "completeDate", "goal", "originBoardId"]`
- **Resource Reference**: `jira://agile/fields`
- **Performance Impact**: Low - single sprint object

### System Tools (3 tools)

#### ❌ searchFields
- **Current Status**: No fields support
- **JiraClient Method**: `listFields()`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["id", "name", "custom", "searchable", "orderable", "schema.type"]`
- **Resource Reference**: `jira://system/fields` (meta-field definitions)
- **Performance Impact**: Low - field definition arrays

#### ❌ getSystemInfo
- **Current Status**: No fields support
- **JiraClient Method**: `getServerInfo()`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["version", "versionNumbers", "deploymentType", "buildNumber", "buildDate", "serverTitle"]`
- **Resource Reference**: `jira://system/fields`
- **Performance Impact**: Low - single system info object

#### ❌ getServerInfo
- **Current Status**: No fields support
- **JiraClient Method**: `getServerInfo()`
- **API Support**: ❌ No native fields parameter support
- **Implementation Strategy**: Client-side filtering with `FieldFilter.filterFields()`
- **Suggested Fields**: `["baseUrl", "version", "versionNumbers", "serverTime", "scmInfo"]`
- **Resource Reference**: `jira://system/fields`
- **Performance Impact**: Low - single server info object

## Implementation Strategy

### Phase 0 Implementation Plan

#### Task-0.1: Tool Definition Analysis & Planning ✅
- **Status**: Complete (this document)
- **Deliverable**: Comprehensive analysis of current vs required fields support

#### Task-0.2: Client-Side Field Filtering Utility
- **File**: `src/utils/field-filter.ts`
- **Purpose**: Generic field filtering for APIs without native fields parameter support
- **Key Features**:
  - Nested field path support (e.g., `assignee.displayName`, `status.statusCategory.key`)
  - Entity type awareness for validation
  - Performance optimization for large response arrays
  - Debug logging for field filtering operations

#### Task-0.3: Tool Definition Updates (14 tools)
- **Files**: All tool definition files in `src/server/tools/`
- **Action**: Add `fields` parameter to all tool definitions without it
- **Template**:
  ```typescript
  fields: {
    type: 'array',
    items: { type: 'string' },
    description: `Optional field selection with nested access support.

📋 Complete field reference: jira://{entityType}/fields

🔥 Enhanced capabilities:
• System fields: Full nested structure support (field.subfield.property)
• Custom fields: Pattern matching with validation  
• Smart validation: Real-time field validation with suggestions

🎯 Example field combinations:
• Basic: ["name", "key", "status"]
• Nested: ["assignee.displayName", "status.statusCategory.key"]
• Custom: ["customfield_10001", "customfield_10002.value"]

⚠️ Note: Uses client-side filtering (API doesn't support native fields parameter)`
  }
  ```

#### Task-0.4: JiraClientWrapper Enhancement
- **File**: `src/client/jira-client-wrapper.ts`
- **Action**: Add fields parameter where API supports it (minimal changes needed)
- **Note**: Most methods already support fields where API allows it

#### Task-0.5: Tool Handler Implementation
- **File**: `src/server/handlers/tool-handler.ts`
- **Action**: Implement fields parameter processing with client-side filtering fallback
- **Pattern**:
  ```typescript
  // Apply client-side field filtering if fields specified
  let responseData = result;
  if (args.fields && args.fields.length > 0) {
    responseData = FieldFilter.filterFields(result, args.fields, {
      entityType: 'project', // or 'user', 'agile', 'issue', 'system'
      respectNesting: true,
      logFiltering: true
    });
  }
  ```

#### Task-0.6: Enhanced Tool Descriptions
- **Files**: All tool definition files
- **Action**: Update descriptions to reference correct field resources and explain fields parameter usage
- **Pattern**: Add resource references like `"Enhanced field access available via jira://project/fields resource."`

## Benefits of Universal Fields Parameter Support

### 1. Immediate User Value
- **Consistent Interface**: All 19 tools support fields parameter with identical syntax
- **Performance Optimization**: Reduced data transfer for tools with native API support
- **Response Size Control**: Client-side filtering reduces response payload sizes

### 2. Developer Experience
- **Uniform API**: Consistent fields parameter across all tools
- **Resource Integration**: Proper mapping to field definition resources
- **Better Documentation**: Clear field usage examples and resource references

### 3. Foundation for Future Phases
- **Hybrid Resource Architecture**: Prepares infrastructure for dynamic field discovery
- **Field Validation**: Enables field path validation and suggestions
- **Performance Monitoring**: Establishes patterns for field usage analytics

### 4. Production Readiness
- **Graceful Fallbacks**: Client-side filtering provides universal support
- **Error Handling**: Comprehensive error handling for invalid field paths
- **Logging**: Debug information for field filtering operations

## Resource Mapping

### Field Resource URIs
- `jira://issue/fields` - Issue and issue-related operations (7 tools)
- `jira://project/fields` - Project-related operations (4 tools)  
- `jira://user/fields` - User-related operations (2 tools)
- `jira://agile/fields` - Agile/board/sprint operations (5 tools)
- `jira://system/fields` - System information operations (3 tools)

### Tool-to-Resource Mapping
```
Issue Operations (7): getIssue, searchIssues, getProjectIssues, getBoardIssues, getSprintIssues, getIssueTransitions, getIssueWorklogs → jira://issue/fields

Project Operations (4): getAllProjects, getProject, getProjectVersions, downloadAttachments → jira://project/fields

User Operations (2): getCurrentUser, getUserProfile → jira://user/fields

Agile Operations (5): getAgileBoards, getSprintsFromBoard, getSprint → jira://agile/fields

System Operations (3): searchFields, getSystemInfo, getServerInfo → jira://system/fields
```

## Success Criteria

### Task Completion
- [ ] All 14 tools without fields support have been updated
- [ ] FieldFilter utility implemented and tested
- [ ] Tool handlers support client-side filtering
- [ ] Enhanced tool descriptions reference correct resources
- [ ] Test coverage ≥ 80% for all new functionality

### Quality Assurance
- [ ] ESLint compliance for all modified code
- [ ] TypeScript strict mode passes
- [ ] Integration tests pass with real Jira Server instance
- [ ] Code review approval from code-reviewer-simple agent

### User Experience
- [ ] Consistent fields parameter interface across all 19 tools
- [ ] Proper error handling for invalid field paths
- [ ] Performance optimization where API supports native fields
- [ ] Clear documentation and examples for field usage

---

**Document Status**: Complete
**Last Updated**: 2024-01-26
**Phase**: 0 - Universal Fields Parameter Support (Foundation)
**Next Task**: Task-0.2 - Client-Side Field Filtering Utility Implementation