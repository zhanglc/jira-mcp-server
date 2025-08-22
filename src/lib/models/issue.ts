/**
 * Issue Data Model
 *
 * Provides a clean abstraction layer over the raw Jira Issue API types.
 * Handles field processing, validation, and transformation.
 */

import type {
  JiraIssue,
  JiraIssueFields,
  JiraStatus,
  JiraPriority,
  JiraIssueType,
  JiraUser,
  JiraProject,
  JiraComponent,
  JiraVersion,
  JiraResolution,
  JiraIssueLink,
  JiraAttachment,
  JiraComment,
  JiraWorklog,
  JiraTransition,
} from '@/types/jira-api';
import type { FieldSelection, DeepPartial, IsoDateString } from '@/types/common';

/**
 * Issue Model Class
 * Wraps JiraIssue with additional helper methods and field processing
 */
export class IssueModel {
  private readonly _data: JiraIssue;

  constructor(data: JiraIssue) {
    this._data = data;
  }

  /**
   * Get the raw Jira issue data
   */
  get raw(): JiraIssue {
    return this._data;
  }

  /**
   * Get basic issue identification
   */
  get id(): string {
    return this._data.id;
  }

  get key(): string {
    return this._data.key;
  }

  get self(): string {
    return this._data.self;
  }

  /**
   * Get core issue fields
   */
  get summary(): string {
    return this._data.fields.summary;
  }

  get description(): string | undefined {
    return this._data.fields.description;
  }

  get status(): JiraStatus {
    return this._data.fields.status;
  }

  get priority(): JiraPriority | undefined {
    return this._data.fields.priority;
  }

  get issueType(): JiraIssueType {
    return this._data.fields.issuetype;
  }

  get project(): JiraProject {
    return this._data.fields.project;
  }

  /**
   * Get people related to the issue
   */
  get assignee(): JiraUser | undefined {
    return this._data.fields.assignee;
  }

  get reporter(): JiraUser | undefined {
    return this._data.fields.reporter;
  }

  get creator(): JiraUser | undefined {
    return this._data.fields.creator;
  }

  /**
   * Get date information
   */
  get created(): IsoDateString {
    return this._data.fields.created;
  }

  get updated(): IsoDateString {
    return this._data.fields.updated;
  }

  get resolutionDate(): IsoDateString | undefined {
    return this._data.fields.resolutiondate;
  }

  get dueDate(): IsoDateString | undefined {
    return this._data.fields.duedate;
  }

  /**
   * Get resolution information
   */
  get resolution(): JiraResolution | undefined {
    return this._data.fields.resolution;
  }

  get isResolved(): boolean {
    return this.resolution !== undefined;
  }

  /**
   * Get classifications
   */
  get components(): JiraComponent[] {
    return this._data.fields.components;
  }

  get fixVersions(): JiraVersion[] {
    return this._data.fields.fixVersions;
  }

  get affectedVersions(): JiraVersion[] {
    return this._data.fields.versions;
  }

  get labels(): string[] {
    return this._data.fields.labels;
  }

  /**
   * Get relationship information
   */
  get parent(): JiraIssue['fields']['parent'] | undefined {
    return this._data.fields.parent;
  }

  get subtasks(): JiraIssue['fields']['subtasks'] | undefined {
    return this._data.fields.subtasks;
  }

  get issueLinks(): JiraIssueLink[] | undefined {
    return this._data.fields.issuelinks;
  }

  get isSubtask(): boolean {
    return this.issueType.subtask;
  }

  get hasSubtasks(): boolean {
    return this.subtasks !== undefined && this.subtasks.length > 0;
  }

  /**
   * Get time tracking information
   */
  get timeTracking(): {
    originalEstimate?: number;
    remainingEstimate?: number;
    timeSpent?: number;
    aggregateOriginalEstimate?: number;
    aggregateRemainingEstimate?: number;
    aggregateTimeSpent?: number;
  } {
    const result: {
      originalEstimate?: number;
      remainingEstimate?: number;
      timeSpent?: number;
      aggregateOriginalEstimate?: number;
      aggregateRemainingEstimate?: number;
      aggregateTimeSpent?: number;
    } = {};
    
    if (this._data.fields.timeoriginalestimate !== undefined) {
      result.originalEstimate = this._data.fields.timeoriginalestimate;
    }
    if (this._data.fields.timeestimate !== undefined) {
      result.remainingEstimate = this._data.fields.timeestimate;
    }
    if (this._data.fields.timespent !== undefined) {
      result.timeSpent = this._data.fields.timespent;
    }
    if (this._data.fields.aggregatetimeoriginalestimate !== undefined) {
      result.aggregateOriginalEstimate = this._data.fields.aggregatetimeoriginalestimate;
    }
    if (this._data.fields.aggregatetimeestimate !== undefined) {
      result.aggregateRemainingEstimate = this._data.fields.aggregatetimeestimate;
    }
    if (this._data.fields.aggregatetimespent !== undefined) {
      result.aggregateTimeSpent = this._data.fields.aggregatetimespent;
    }
    
    return result;
  }

  /**
   * Get worklog information
   */
  get worklogs(): JiraWorklog[] | undefined {
    return this._data.fields.worklog?.worklogs;
  }

  get worklogTotal(): number {
    return this._data.fields.worklog?.total ?? 0;
  }

  /**
   * Get attachments
   */
  get attachments(): JiraAttachment[] | undefined {
    return this._data.fields.attachment;
  }

  get hasAttachments(): boolean {
    return this.attachments !== undefined && this.attachments.length > 0;
  }

  /**
   * Get comments
   */
  get comments(): JiraComment[] | undefined {
    return this._data.fields.comment?.comments;
  }

  get commentTotal(): number {
    return this._data.fields.comment?.total ?? 0;
  }

  /**
   * Get voting and watching information
   */
  get votes(): {
    count: number;
    hasVoted: boolean;
    voters: JiraUser[];
  } | undefined {
    const votes = this._data.fields.votes;
    return votes ? {
      count: votes.votes,
      hasVoted: votes.hasVoted,
      voters: votes.voters,
    } : undefined;
  }

  get watches(): {
    count: number;
    isWatching: boolean;
    watchers: JiraUser[];
  } | undefined {
    const watches = this._data.fields.watches;
    return watches ? {
      count: watches.watchCount,
      isWatching: watches.isWatching,
      watchers: watches.watchers,
    } : undefined;
  }

  /**
   * Get security level
   */
  get securityLevel(): {
    id: string;
    name: string;
    description: string;
  } | undefined {
    return this._data.fields.security;
  }

  /**
   * Get environment
   */
  get environment(): string | undefined {
    return this._data.fields.environment;
  }

  /**
   * Get custom field value by field key
   */
  getCustomField(fieldKey: string): any {
    return this._data.fields[fieldKey as keyof JiraIssueFields];
  }

  /**
   * Get all custom fields
   */
  getCustomFields(): Record<string, any> {
    const customFields: Record<string, any> = {};
    Object.keys(this._data.fields).forEach(key => {
      if (key.startsWith('customfield_')) {
        customFields[key] = this._data.fields[key as keyof JiraIssueFields];
      }
    });
    return customFields;
  }

  /**
   * Get transitions if available
   */
  get transitions(): JiraTransition[] | undefined {
    return this._data.transitions;
  }

  /**
   * Get available transitions
   */
  getAvailableTransitions(): JiraTransition[] {
    return this.transitions?.filter(t => t.isAvailable !== false) ?? [];
  }

  /**
   * Check if a specific transition is available
   */
  canTransitionTo(transitionId: string): boolean {
    return this.getAvailableTransitions().some(t => t.id === transitionId);
  }

  /**
   * Get expanded fields
   */
  get expandedFields(): string[] {
    return this._data.expand?.split(',').map(s => s.trim()) ?? [];
  }

  /**
   * Check if a field is expanded
   */
  isExpanded(field: string): boolean {
    return this.expandedFields.includes(field);
  }

  /**
   * Extract selected fields using dot notation
   * This method supports nested field selection like 'assignee.displayName'
   */
  extractFields<T = any>(fields: string[]): Record<string, T> {
    const result: Record<string, any> = {};
    
    fields.forEach(field => {
      const value = this.getNestedValue(field);
      if (value !== undefined) {
        result[field] = value;
      }
    });
    
    return result;
  }

  /**
   * Get nested field value using dot notation
   */
  private getNestedValue(path: string): any {
    const parts = path.split('.');
    let current: any = this._data.fields;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Convert to plain object with selected fields
   */
  toObject(fields?: string[]): Record<string, any> {
    if (!fields) {
      return {
        id: this.id,
        key: this.key,
        self: this.self,
        fields: this._data.fields,
      };
    }
    
    return this.extractFields(fields);
  }

  /**
   * Convert to JSON string
   */
  toJSON(): string {
    return JSON.stringify(this._data);
  }

  /**
   * Create a partial update object for JIRA operations
   */
  createUpdatePayload(updates: DeepPartial<JiraIssueFields>): {
    fields: DeepPartial<JiraIssueFields>;
  } {
    return {
      fields: updates,
    };
  }

  /**
   * Static method to create IssueModel from raw data
   */
  static from(data: JiraIssue): IssueModel {
    return new IssueModel(data);
  }

  /**
   * Static method to create multiple IssueModels from array
   */
  static fromArray(data: JiraIssue[]): IssueModel[] {
    return data.map(issue => new IssueModel(issue));
  }
}

/**
 * Issue Collection Model
 * Provides utilities for working with collections of issues
 */
export class IssueCollectionModel {
  private readonly _issues: IssueModel[];

  constructor(issues: IssueModel[]) {
    this._issues = issues;
  }

  /**
   * Get all issues
   */
  get issues(): IssueModel[] {
    return this._issues;
  }

  /**
   * Get count of issues
   */
  get count(): number {
    return this._issues.length;
  }

  /**
   * Filter issues by status
   */
  filterByStatus(statusName: string): IssueCollectionModel {
    const filtered = this._issues.filter(issue => 
      issue.status.name.toLowerCase() === statusName.toLowerCase()
    );
    return new IssueCollectionModel(filtered);
  }

  /**
   * Filter issues by assignee
   */
  filterByAssignee(assigneeKey?: string): IssueCollectionModel {
    const filtered = this._issues.filter(issue => {
      if (!assigneeKey) {
        return issue.assignee === undefined;
      }
      return issue.assignee?.key === assigneeKey;
    });
    return new IssueCollectionModel(filtered);
  }

  /**
   * Filter issues by project
   */
  filterByProject(projectKey: string): IssueCollectionModel {
    const filtered = this._issues.filter(issue => 
      issue.project.key === projectKey
    );
    return new IssueCollectionModel(filtered);
  }

  /**
   * Filter issues by issue type
   */
  filterByIssueType(issueTypeName: string): IssueCollectionModel {
    const filtered = this._issues.filter(issue => 
      issue.issueType.name.toLowerCase() === issueTypeName.toLowerCase()
    );
    return new IssueCollectionModel(filtered);
  }

  /**
   * Group issues by status
   */
  groupByStatus(): Map<string, IssueModel[]> {
    const groups = new Map<string, IssueModel[]>();
    
    this._issues.forEach(issue => {
      const statusName = issue.status.name;
      if (!groups.has(statusName)) {
        groups.set(statusName, []);
      }
      groups.get(statusName)!.push(issue);
    });
    
    return groups;
  }

  /**
   * Group issues by assignee
   */
  groupByAssignee(): Map<string, IssueModel[]> {
    const groups = new Map<string, IssueModel[]>();
    
    this._issues.forEach(issue => {
      const assigneeKey = issue.assignee?.key ?? 'unassigned';
      if (!groups.has(assigneeKey)) {
        groups.set(assigneeKey, []);
      }
      groups.get(assigneeKey)!.push(issue);
    });
    
    return groups;
  }

  /**
   * Sort issues by created date
   */
  sortByCreated(ascending = true): IssueCollectionModel {
    const sorted = [...this._issues].sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new IssueCollectionModel(sorted);
  }

  /**
   * Sort issues by updated date
   */
  sortByUpdated(ascending = true): IssueCollectionModel {
    const sorted = [...this._issues].sort((a, b) => {
      const dateA = new Date(a.updated).getTime();
      const dateB = new Date(b.updated).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new IssueCollectionModel(sorted);
  }

  /**
   * Convert to array of plain objects
   */
  toArray(fields?: string[]): Record<string, any>[] {
    return this._issues.map(issue => issue.toObject(fields));
  }

  /**
   * Static method to create from JiraIssue array
   */
  static from(issues: JiraIssue[]): IssueCollectionModel {
    const models = IssueModel.fromArray(issues);
    return new IssueCollectionModel(models);
  }
}

/**
 * Type definitions for issue-related operations
 */
export interface IssueCreatePayload {
  fields: DeepPartial<JiraIssueFields>;
}

export interface IssueUpdatePayload {
  fields: DeepPartial<JiraIssueFields>;
}

export interface IssueTransitionPayload {
  transition: {
    id: string;
  };
  fields?: DeepPartial<JiraIssueFields>;
}

export interface IssueSearchOptions {
  jql?: string;
  fields?: string[];
  expand?: string[];
  startAt?: number;
  maxResults?: number;
  validateQuery?: boolean;
}