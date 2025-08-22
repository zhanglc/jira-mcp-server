/**
 * Search Data Model
 *
 * Provides a clean abstraction layer over Jira search operations and results.
 * Handles JQL search results, pagination, and result processing.
 */

import type { JiraSearchResponse, JiraSearchOptions, JiraFieldSchema } from '@/types/jira-api';
import type { SearchResult, PaginationOptions } from '@/types/common';
import { IssueModel, IssueCollectionModel } from './issue';

/**
 * Search Result Model Class
 * Wraps JiraSearchResponse with additional helper methods and pagination support
 */
export class SearchResultModel<T = any> {
  private readonly _data: SearchResult<T>;
  private readonly _rawResponse?: JiraSearchResponse | undefined;

  constructor(data: SearchResult<T>, rawResponse?: JiraSearchResponse | undefined) {
    this._data = data;
    this._rawResponse = rawResponse;
  }

  /**
   * Get the raw search result data
   */
  get raw(): SearchResult<T> {
    return this._data;
  }

  /**
   * Get the raw Jira search response if available
   */
  get rawResponse(): JiraSearchResponse | undefined {
    return this._rawResponse;
  }

  /**
   * Get pagination information
   */
  get startAt(): number {
    return this._data.startAt;
  }

  get maxResults(): number {
    return this._data.maxResults;
  }

  get total(): number {
    return this._data.total;
  }

  get isLast(): boolean {
    return this._data.isLast ?? (this.startAt + this.maxResults >= this.total);
  }

  get hasMore(): boolean {
    return !this.isLast;
  }

  /**
   * Get current page information
   */
  get currentPage(): number {
    return Math.floor(this.startAt / this.maxResults) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.maxResults);
  }

  get isFirstPage(): boolean {
    return this.startAt === 0;
  }

  get isLastPage(): boolean {
    return this.isLast;
  }

  /**
   * Get items (generic accessor for different result types)
   */
  get items(): T[] {
    return this._data.issues ?? this._data.items ?? this._data.values ?? [];
  }

  get count(): number {
    return this.items.length;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Get pagination summary
   */
  getPaginationSummary(): {
    startAt: number;
    maxResults: number;
    total: number;
    currentPage: number;
    totalPages: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    hasMore: boolean;
    showing: string;
  } {
    const endAt = Math.min(this.startAt + this.count, this.total);
    return {
      startAt: this.startAt,
      maxResults: this.maxResults,
      total: this.total,
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      isFirstPage: this.isFirstPage,
      isLastPage: this.isLastPage,
      hasMore: this.hasMore,
      showing: `${this.startAt + 1}-${endAt} of ${this.total}`,
    };
  }

  /**
   * Get next page options
   */
  getNextPageOptions(): PaginationOptions | null {
    if (this.isLast) {
      return null;
    }
    return {
      startAt: this.startAt + this.maxResults,
      maxResults: this.maxResults,
    };
  }

  /**
   * Get previous page options
   */
  getPreviousPageOptions(): PaginationOptions | null {
    if (this.isFirstPage) {
      return null;
    }
    return {
      startAt: Math.max(0, this.startAt - this.maxResults),
      maxResults: this.maxResults,
    };
  }

  /**
   * Get page options for a specific page number
   */
  getPageOptions(pageNumber: number): PaginationOptions | null {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return null;
    }
    return {
      startAt: (pageNumber - 1) * this.maxResults,
      maxResults: this.maxResults,
    };
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      items: this.items,
      pagination: this.getPaginationSummary(),
      expand: this._data.expand,
    };
  }

  /**
   * Static method to create SearchResultModel from raw data
   */
  static from<T>(data: SearchResult<T>, rawResponse?: JiraSearchResponse | undefined): SearchResultModel<T> {
    return new SearchResultModel(data, rawResponse);
  }
}

/**
 * Issue Search Result Model
 * Specialized search result model for Jira issues
 */
export class IssueSearchResultModel {
  private readonly _data: JiraSearchResponse;
  private _issueCollection?: IssueCollectionModel;

  constructor(data: JiraSearchResponse) {
    this._data = data;
  }

  /**
   * Get the raw Jira search response
   */
  get rawResponse(): JiraSearchResponse {
    return this._data;
  }

  /**
   * Get pagination information
   */
  get startAt(): number {
    return this._data.startAt;
  }

  get maxResults(): number {
    return this._data.maxResults;
  }

  get total(): number {
    return this._data.total;
  }

  get isLast(): boolean {
    return this._data.startAt + this._data.maxResults >= this._data.total;
  }

  get hasMore(): boolean {
    return !this.isLast;
  }

  /**
   * Get current page information
   */
  get currentPage(): number {
    return Math.floor(this.startAt / this.maxResults) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.maxResults);
  }

  get isFirstPage(): boolean {
    return this.startAt === 0;
  }

  get isLastPage(): boolean {
    return this.isLast;
  }

  /**
   * Get pagination summary
   */
  getPaginationSummary(): {
    startAt: number;
    maxResults: number;
    total: number;
    currentPage: number;
    totalPages: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    hasMore: boolean;
    showing: string;
  } {
    const endAt = Math.min(this.startAt + this._data.issues.length, this.total);
    return {
      startAt: this.startAt,
      maxResults: this.maxResults,
      total: this.total,
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      isFirstPage: this.isFirstPage,
      isLastPage: this.isLastPage,
      hasMore: this.hasMore,
      showing: `${this.startAt + 1}-${endAt} of ${this.total}`,
    };
  }

  /**
   * Get issues as IssueModel instances
   */
  get issues(): IssueModel[] {
    if (!this._issueCollection) {
      this._issueCollection = IssueCollectionModel.from(this._data.issues);
    }
    return this._issueCollection.issues;
  }

  /**
   * Get issues as IssueCollectionModel
   */
  get issueCollection(): IssueCollectionModel {
    if (!this._issueCollection) {
      this._issueCollection = IssueCollectionModel.from(this._data.issues);
    }
    return this._issueCollection;
  }

  /**
   * Get warning messages if any
   */
  get warningMessages(): string[] {
    return this._data.warningMessages ?? [];
  }

  get hasWarnings(): boolean {
    return this.warningMessages.length > 0;
  }

  /**
   * Get field names mapping
   */
  get fieldNames(): Record<string, string> {
    return this._data.names ?? {};
  }

  /**
   * Get field schemas
   */
  get fieldSchemas(): Record<string, JiraFieldSchema> {
    return this._data.schema ?? {};
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
  isFieldExpanded(field: string): boolean {
    return this.expandedFields.includes(field);
  }

  /**
   * Get field display name
   */
  getFieldDisplayName(fieldKey: string): string {
    return this.fieldNames[fieldKey] ?? fieldKey;
  }

  /**
   * Get field schema
   */
  getFieldSchema(fieldKey: string): JiraFieldSchema | undefined {
    return this.fieldSchemas[fieldKey];
  }

  /**
   * Filter issues using the underlying collection
   */
  filterByStatus(statusName: string): IssueSearchResultModel {
    const filteredCollection = this.issueCollection.filterByStatus(statusName);
    const filteredResponse: JiraSearchResponse = {
      ...this._data,
      issues: filteredCollection.issues.map(issue => issue.raw),
      total: filteredCollection.count,
      maxResults: filteredCollection.count,
      startAt: 0,
    };
    return new IssueSearchResultModel(filteredResponse);
  }

  /**
   * Filter issues by assignee
   */
  filterByAssignee(assigneeKey?: string): IssueSearchResultModel {
    const filteredCollection = this.issueCollection.filterByAssignee(assigneeKey);
    const filteredResponse: JiraSearchResponse = {
      ...this._data,
      issues: filteredCollection.issues.map(issue => issue.raw),
      total: filteredCollection.count,
      maxResults: filteredCollection.count,
      startAt: 0,
    };
    return new IssueSearchResultModel(filteredResponse);
  }

  /**
   * Sort issues using the underlying collection
   */
  sortByCreated(ascending = true): IssueSearchResultModel {
    const sortedCollection = this.issueCollection.sortByCreated(ascending);
    const sortedResponse: JiraSearchResponse = {
      ...this._data,
      issues: sortedCollection.issues.map(issue => issue.raw),
    };
    return new IssueSearchResultModel(sortedResponse);
  }

  /**
   * Sort issues by updated date
   */
  sortByUpdated(ascending = true): IssueSearchResultModel {
    const sortedCollection = this.issueCollection.sortByUpdated(ascending);
    const sortedResponse: JiraSearchResponse = {
      ...this._data,
      issues: sortedCollection.issues.map(issue => issue.raw),
    };
    return new IssueSearchResultModel(sortedResponse);
  }

  /**
   * Convert to plain object with issue data
   */
  toObject(fields?: string[]): Record<string, any> {
    return {
      issues: this.issueCollection.toArray(fields),
      pagination: this.getPaginationSummary(),
      warnings: this.warningMessages,
      fieldNames: this.fieldNames,
      expandedFields: this.expandedFields,
    };
  }

  /**
   * Static method to create IssueSearchResultModel from JiraSearchResponse
   */
  static from(data: JiraSearchResponse): IssueSearchResultModel {
    return new IssueSearchResultModel(data);
  }
}

/**
 * JQL Query Builder
 * Helps construct JQL queries programmatically
 */
export class JQLQueryBuilder {
  private _conditions: string[] = [];
  private _orderBy: string[] = [];

  /**
   * Add a condition to the query
   */
  addCondition(condition: string): this {
    this._conditions.push(condition);
    return this;
  }

  /**
   * Add project condition
   */
  project(projectKey: string | string[]): this {
    if (Array.isArray(projectKey)) {
      const projects = projectKey.map(key => `"${key}"`).join(', ');
      this.addCondition(`project IN (${projects})`);
    } else {
      this.addCondition(`project = "${projectKey}"`);
    }
    return this;
  }

  /**
   * Add assignee condition
   */
  assignee(userKey: string | null): this {
    if (userKey === null) {
      this.addCondition('assignee IS EMPTY');
    } else {
      this.addCondition(`assignee = "${userKey}"`);
    }
    return this;
  }

  /**
   * Add reporter condition
   */
  reporter(userKey: string): this {
    this.addCondition(`reporter = "${userKey}"`);
    return this;
  }

  /**
   * Add status condition
   */
  status(statusName: string | string[]): this {
    if (Array.isArray(statusName)) {
      const statuses = statusName.map(status => `"${status}"`).join(', ');
      this.addCondition(`status IN (${statuses})`);
    } else {
      this.addCondition(`status = "${statusName}"`);
    }
    return this;
  }

  /**
   * Add issue type condition
   */
  issueType(typeName: string | string[]): this {
    if (Array.isArray(typeName)) {
      const types = typeName.map(type => `"${type}"`).join(', ');
      this.addCondition(`issuetype IN (${types})`);
    } else {
      this.addCondition(`issuetype = "${typeName}"`);
    }
    return this;
  }

  /**
   * Add priority condition
   */
  priority(priorityName: string | string[]): this {
    if (Array.isArray(priorityName)) {
      const priorities = priorityName.map(priority => `"${priority}"`).join(', ');
      this.addCondition(`priority IN (${priorities})`);
    } else {
      this.addCondition(`priority = "${priorityName}"`);
    }
    return this;
  }

  /**
   * Add component condition
   */
  component(componentName: string | string[]): this {
    if (Array.isArray(componentName)) {
      const components = componentName.map(comp => `"${comp}"`).join(', ');
      this.addCondition(`component IN (${components})`);
    } else {
      this.addCondition(`component = "${componentName}"`);
    }
    return this;
  }

  /**
   * Add fix version condition
   */
  fixVersion(versionName: string | string[]): this {
    if (Array.isArray(versionName)) {
      const versions = versionName.map(version => `"${version}"`).join(', ');
      this.addCondition(`fixVersion IN (${versions})`);
    } else {
      this.addCondition(`fixVersion = "${versionName}"`);
    }
    return this;
  }

  /**
   * Add labels condition
   */
  labels(labelName: string | string[]): this {
    if (Array.isArray(labelName)) {
      labelName.forEach(label => {
        this.addCondition(`labels = "${label}"`);
      });
    } else {
      this.addCondition(`labels = "${labelName}"`);
    }
    return this;
  }

  /**
   * Add created date condition
   */
  createdAfter(date: string): this {
    this.addCondition(`created >= "${date}"`);
    return this;
  }

  createdBefore(date: string): this {
    this.addCondition(`created <= "${date}"`);
    return this;
  }

  createdBetween(startDate: string, endDate: string): this {
    this.addCondition(`created >= "${startDate}" AND created <= "${endDate}"`);
    return this;
  }

  /**
   * Add updated date condition
   */
  updatedAfter(date: string): this {
    this.addCondition(`updated >= "${date}"`);
    return this;
  }

  updatedBefore(date: string): this {
    this.addCondition(`updated <= "${date}"`);
    return this;
  }

  updatedBetween(startDate: string, endDate: string): this {
    this.addCondition(`updated >= "${startDate}" AND updated <= "${endDate}"`);
    return this;
  }

  /**
   * Add text search condition
   */
  textSearch(searchText: string): this {
    this.addCondition(`text ~ "${searchText}"`);
    return this;
  }

  /**
   * Add summary search condition
   */
  summaryContains(text: string): this {
    this.addCondition(`summary ~ "${text}"`);
    return this;
  }

  /**
   * Add description search condition
   */
  descriptionContains(text: string): this {
    this.addCondition(`description ~ "${text}"`);
    return this;
  }

  /**
   * Add custom field condition
   */
  customField(fieldId: string, value: string | number | null): this {
    if (value === null) {
      this.addCondition(`cf[${fieldId}] IS EMPTY`);
    } else if (typeof value === 'string') {
      this.addCondition(`cf[${fieldId}] = "${value}"`);
    } else {
      this.addCondition(`cf[${fieldId}] = ${value}`);
    }
    return this;
  }

  /**
   * Add order by clause
   */
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBy.push(`${field} ${direction}`);
    return this;
  }

  /**
   * Build the JQL query string
   */
  build(): string {
    let jql = this._conditions.join(' AND ');
    
    if (this._orderBy.length > 0) {
      jql += ` ORDER BY ${this._orderBy.join(', ')}`;
    }
    
    return jql;
  }

  /**
   * Clear all conditions and order by clauses
   */
  clear(): this {
    this._conditions = [];
    this._orderBy = [];
    return this;
  }

  /**
   * Get current conditions
   */
  getConditions(): string[] {
    return [...this._conditions];
  }

  /**
   * Get current order by clauses
   */
  getOrderBy(): string[] {
    return [...this._orderBy];
  }

  /**
   * Static method to create a new query builder
   */
  static create(): JQLQueryBuilder {
    return new JQLQueryBuilder();
  }
}

/**
 * Search Options Builder
 * Helps construct search options for Jira APIs
 */
export class SearchOptionsBuilder {
  private _options: JiraSearchOptions = {};

  /**
   * Set fields to include in results
   */
  fields(fields: string[]): this {
    this._options.fields = fields;
    return this;
  }

  /**
   * Add field to include in results
   */
  addField(field: string): this {
    if (!this._options.fields) {
      this._options.fields = [];
    }
    this._options.fields.push(field);
    return this;
  }

  /**
   * Set expand options
   */
  expand(expand: string[]): this {
    this._options.expand = expand;
    return this;
  }

  /**
   * Add expand option
   */
  addExpand(expandOption: string): this {
    if (!this._options.expand) {
      this._options.expand = [];
    }
    this._options.expand.push(expandOption);
    return this;
  }

  /**
   * Set pagination options
   */
  pagination(startAt: number, maxResults: number): this {
    this._options.startAt = startAt;
    this._options.maxResults = maxResults;
    return this;
  }

  /**
   * Set start position
   */
  startAt(startAt: number): this {
    this._options.startAt = startAt;
    return this;
  }

  /**
   * Set maximum results
   */
  maxResults(maxResults: number): this {
    this._options.maxResults = maxResults;
    return this;
  }

  /**
   * Set properties to include
   */
  properties(properties: string[]): this {
    this._options.properties = properties;
    return this;
  }

  /**
   * Set query validation
   */
  validateQuery(validate: boolean): this {
    this._options.validateQuery = validate;
    return this;
  }

  /**
   * Build the options object
   */
  build(): JiraSearchOptions {
    return { ...this._options };
  }

  /**
   * Clear all options
   */
  clear(): this {
    this._options = {};
    return this;
  }

  /**
   * Static method to create a new options builder
   */
  static create(): SearchOptionsBuilder {
    return new SearchOptionsBuilder();
  }
}

/**
 * Type definitions for search-related operations
 */
export interface SearchContext {
  jql?: string;
  options?: JiraSearchOptions;
  fields?: string[];
  expand?: string[];
  pagination?: PaginationOptions;
}

export interface SearchSummary {
  total: number;
  returned: number;
  startAt: number;
  maxResults: number;
  hasMore: boolean;
  executionTime?: number;
  query?: string;
}