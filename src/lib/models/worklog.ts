/**
 * Worklog Data Model
 *
 * Provides a clean abstraction layer over the raw Jira Worklog API types.
 * Handles time tracking, visibility, and worklog properties.
 */

import type { JiraWorklog, JiraUser } from '@/types/jira-api';
import type { IsoDateString } from '@/types/common';

/**
 * Worklog Model Class
 * Wraps JiraWorklog with additional helper methods and time calculations
 */
export class WorklogModel {
  private readonly _data: JiraWorklog;

  constructor(data: JiraWorklog) {
    this._data = data;
  }

  /**
   * Get the raw Jira worklog data
   */
  get raw(): JiraWorklog {
    return this._data;
  }

  /**
   * Get basic worklog identification
   */
  get id(): string {
    return this._data.id;
  }

  get self(): string {
    return this._data.self;
  }

  /**
   * Get author information
   */
  get author(): JiraUser {
    return this._data.author;
  }

  get updateAuthor(): JiraUser | undefined {
    return this._data.updateAuthor;
  }

  /**
   * Get worklog content
   */
  get comment(): string | undefined {
    return this._data.comment;
  }

  get hasComment(): boolean {
    return this.comment !== undefined && this.comment.trim().length > 0;
  }

  /**
   * Get timestamps
   */
  get created(): IsoDateString {
    return this._data.created;
  }

  get updated(): IsoDateString {
    return this._data.updated;
  }

  get started(): IsoDateString {
    return this._data.started;
  }

  /**
   * Check if worklog was edited
   */
  get isEdited(): boolean {
    return this.created !== this.updated;
  }

  /**
   * Get time information
   */
  get timeSpent(): string {
    return this._data.timeSpent;
  }

  get timeSpentSeconds(): number {
    return this._data.timeSpentSeconds;
  }

  /**
   * Get time in different formats
   */
  get timeSpentMinutes(): number {
    return this.timeSpentSeconds / 60;
  }

  get timeSpentHours(): number {
    return this.timeSpentSeconds / 3600;
  }

  get timeSpentDays(): number {
    return this.timeSpentSeconds / (3600 * 8); // Assuming 8-hour work day
  }

  /**
   * Get human-readable time duration
   */
  get humanReadableTimeSpent(): string {
    const seconds = this.timeSpentSeconds;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Parse time spent string to seconds
   */
  static parseTimeSpent(timeString: string): number {
    // Parse Jira time format like "1d 2h 30m", "2h 30m", "30m", etc.
    const timePattern = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/;
    const match = timeString.match(timePattern);
    
    if (!match) {
      return 0;
    }

    const days = parseInt(match[1] || '0', 10);
    const hours = parseInt(match[2] || '0', 10);
    const minutes = parseInt(match[3] || '0', 10);
    const seconds = parseInt(match[4] || '0', 10);

    return (days * 8 * 3600) + (hours * 3600) + (minutes * 60) + seconds;
  }

  /**
   * Format seconds to Jira time format
   */
  static formatTimeSpent(seconds: number): string {
    const days = Math.floor(seconds / (8 * 3600));
    const hours = Math.floor((seconds % (8 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ') || '0s';
  }

  /**
   * Get work date information
   */
  get workDate(): Date {
    return new Date(this.started);
  }

  get workDateString(): string {
    return this.workDate.toISOString().split('T')[0]!; // YYYY-MM-DD
  }

  /**
   * Check if work was done on a specific date
   */
  isWorkedOnDate(date: Date | string): boolean {
    const checkDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return this.workDateString === checkDate;
  }

  /**
   * Get issue ID if available
   */
  get issueId(): string | undefined {
    return this._data.issueId;
  }

  /**
   * Get visibility information
   */
  get visibility(): JiraWorklog['visibility'] | undefined {
    return this._data.visibility;
  }

  get isPublic(): boolean {
    return this.visibility === undefined;
  }

  get isRestricted(): boolean {
    return this.visibility !== undefined;
  }

  get visibilityType(): 'group' | 'role' | 'public' {
    if (!this.visibility) {
      return 'public';
    }
    return this.visibility.type;
  }

  get visibilityValue(): string | undefined {
    return this.visibility?.value;
  }

  get visibilityIdentifier(): string | undefined {
    return this.visibility?.identifier;
  }

  /**
   * Get worklog properties
   */
  get properties(): Array<{ key: string; value: any }> | undefined {
    return this._data.properties;
  }

  /**
   * Get property by key
   */
  getProperty(key: string): any {
    return this.properties?.find(prop => prop.key === key)?.value;
  }

  /**
   * Check if property exists
   */
  hasProperty(key: string): boolean {
    return this.properties?.some(prop => prop.key === key) ?? false;
  }

  /**
   * Get all property keys
   */
  getPropertyKeys(): string[] {
    return this.properties?.map(prop => prop.key) ?? [];
  }

  /**
   * Time calculations
   */
  getTimeSinceCreated(): number {
    return Date.now() - new Date(this.created).getTime();
  }

  getTimeSinceUpdated(): number {
    return Date.now() - new Date(this.updated).getTime();
  }

  getTimeSinceStarted(): number {
    return Date.now() - new Date(this.started).getTime();
  }

  /**
   * Check if worklog was logged by a specific user
   */
  isLoggedBy(userKey: string): boolean {
    return this.author.key === userKey;
  }

  /**
   * Check if worklog was last updated by a specific user
   */
  isLastUpdatedBy(userKey: string): boolean {
    return this.updateAuthor?.key === userKey;
  }

  /**
   * Get worklog summary for display
   */
  getSummary(): {
    id: string;
    author: string;
    authorDisplayName: string;
    timeSpent: string;
    timeSpentSeconds: number;
    humanReadableTime: string;
    started: IsoDateString;
    workDate: string;
    created: IsoDateString;
    updated: IsoDateString;
    isEdited: boolean;
    hasComment: boolean;
    isPublic: boolean;
    visibility?: string;
  } {
    return {
      id: this.id,
      author: this.author.key,
      authorDisplayName: this.author.displayName,
      timeSpent: this.timeSpent,
      timeSpentSeconds: this.timeSpentSeconds,
      humanReadableTime: this.humanReadableTimeSpent,
      started: this.started,
      workDate: this.workDateString,
      created: this.created,
      updated: this.updated,
      isEdited: this.isEdited,
      hasComment: this.hasComment,
      isPublic: this.isPublic,
      ...(this.visibility && { visibility: `${this.visibilityType}:${this.visibilityValue}` }),
    };
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      author: this.author,
      updateAuthor: this.updateAuthor,
      comment: this.comment,
      created: this.created,
      updated: this.updated,
      started: this.started,
      timeSpent: this.timeSpent,
      timeSpentSeconds: this.timeSpentSeconds,
      issueId: this.issueId,
      visibility: this.visibility,
      properties: this.properties,
      self: this.self,
    };
  }

  /**
   * Convert to JSON string
   */
  toJSON(): string {
    return JSON.stringify(this._data);
  }

  /**
   * Static method to create WorklogModel from raw data
   */
  static from(data: JiraWorklog): WorklogModel {
    return new WorklogModel(data);
  }

  /**
   * Static method to create multiple WorklogModels from array
   */
  static fromArray(data: JiraWorklog[]): WorklogModel[] {
    return data.map(worklog => new WorklogModel(worklog));
  }
}

/**
 * Worklog Collection Model
 * Provides utilities for working with collections of worklogs
 */
export class WorklogCollectionModel {
  private readonly _worklogs: WorklogModel[];

  constructor(worklogs: WorklogModel[]) {
    this._worklogs = worklogs;
  }

  /**
   * Get all worklogs
   */
  get worklogs(): WorklogModel[] {
    return this._worklogs;
  }

  /**
   * Get count of worklogs
   */
  get count(): number {
    return this._worklogs.length;
  }

  /**
   * Get total time spent across all worklogs
   */
  get totalTimeSpentSeconds(): number {
    return this._worklogs.reduce((total, worklog) => total + worklog.timeSpentSeconds, 0);
  }

  get totalTimeSpentHours(): number {
    return this.totalTimeSpentSeconds / 3600;
  }

  get totalTimeSpentDays(): number {
    return this.totalTimeSpentSeconds / (3600 * 8);
  }

  get totalTimeSpentFormatted(): string {
    return WorklogModel.formatTimeSpent(this.totalTimeSpentSeconds);
  }

  /**
   * Get average time spent per worklog
   */
  get averageTimeSpentSeconds(): number {
    return this.count > 0 ? this.totalTimeSpentSeconds / this.count : 0;
  }

  get averageTimeSpentFormatted(): string {
    return WorklogModel.formatTimeSpent(this.averageTimeSpentSeconds);
  }

  /**
   * Find worklog by ID
   */
  findById(id: string): WorklogModel | undefined {
    return this._worklogs.find(worklog => worklog.id === id);
  }

  /**
   * Filter worklogs by author
   */
  filterByAuthor(userKey: string): WorklogCollectionModel {
    const authorWorklogs = this._worklogs.filter(worklog => 
      worklog.isLoggedBy(userKey)
    );
    return new WorklogCollectionModel(authorWorklogs);
  }

  /**
   * Filter public worklogs
   */
  filterPublic(): WorklogCollectionModel {
    const publicWorklogs = this._worklogs.filter(worklog => worklog.isPublic);
    return new WorklogCollectionModel(publicWorklogs);
  }

  /**
   * Filter restricted worklogs
   */
  filterRestricted(): WorklogCollectionModel {
    const restrictedWorklogs = this._worklogs.filter(worklog => worklog.isRestricted);
    return new WorklogCollectionModel(restrictedWorklogs);
  }

  /**
   * Filter worklogs by visibility type
   */
  filterByVisibilityType(type: 'group' | 'role'): WorklogCollectionModel {
    const visibilityWorklogs = this._worklogs.filter(worklog => 
      worklog.visibilityType === type
    );
    return new WorklogCollectionModel(visibilityWorklogs);
  }

  /**
   * Filter worklogs with comments
   */
  filterWithComments(): WorklogCollectionModel {
    const commentWorklogs = this._worklogs.filter(worklog => worklog.hasComment);
    return new WorklogCollectionModel(commentWorklogs);
  }

  /**
   * Filter worklogs by date range
   */
  filterByDateRange(startDate: Date | string, endDate: Date | string): WorklogCollectionModel {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const filteredWorklogs = this._worklogs.filter(worklog => {
      const workDate = worklog.workDate;
      return workDate >= start && workDate <= end;
    });
    
    return new WorklogCollectionModel(filteredWorklogs);
  }

  /**
   * Filter worklogs by specific date
   */
  filterByDate(date: Date | string): WorklogCollectionModel {
    const filteredWorklogs = this._worklogs.filter(worklog => 
      worklog.isWorkedOnDate(date)
    );
    return new WorklogCollectionModel(filteredWorklogs);
  }

  /**
   * Filter worklogs by time spent range
   */
  filterByTimeSpent(minSeconds?: number, maxSeconds?: number): WorklogCollectionModel {
    const filteredWorklogs = this._worklogs.filter(worklog => {
      if (minSeconds !== undefined && worklog.timeSpentSeconds < minSeconds) {
        return false;
      }
      if (maxSeconds !== undefined && worklog.timeSpentSeconds > maxSeconds) {
        return false;
      }
      return true;
    });
    return new WorklogCollectionModel(filteredWorklogs);
  }

  /**
   * Search worklogs by comment text
   */
  searchByComment(searchTerm: string, caseSensitive = false): WorklogCollectionModel {
    const searchText = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const matchingWorklogs = this._worklogs.filter(worklog => {
      if (!worklog.hasComment) return false;
      const commentText = caseSensitive ? worklog.comment! : worklog.comment!.toLowerCase();
      return commentText.includes(searchText);
    });
    return new WorklogCollectionModel(matchingWorklogs);
  }

  /**
   * Group worklogs by author
   */
  groupByAuthor(): Map<string, WorklogModel[]> {
    const groups = new Map<string, WorklogModel[]>();
    
    this._worklogs.forEach(worklog => {
      const authorKey = worklog.author.key;
      if (!groups.has(authorKey)) {
        groups.set(authorKey, []);
      }
      groups.get(authorKey)!.push(worklog);
    });
    
    return groups;
  }

  /**
   * Group worklogs by date
   */
  groupByDate(): Map<string, WorklogModel[]> {
    const groups = new Map<string, WorklogModel[]>();
    
    this._worklogs.forEach(worklog => {
      const dateKey = worklog.workDateString;
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(worklog);
    });
    
    return groups;
  }

  /**
   * Group worklogs by week
   */
  groupByWeek(): Map<string, WorklogModel[]> {
    const groups = new Map<string, WorklogModel[]>();
    
    this._worklogs.forEach(worklog => {
      const date = worklog.workDate;
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1); // Get Monday of the week
      const weekKey = monday.toISOString().split('T')[0]!;
      
      if (!groups.has(weekKey)) {
        groups.set(weekKey, []);
      }
      const group = groups.get(weekKey);
      if (group) {
        group.push(worklog);
      }
    });
    
    return groups;
  }

  /**
   * Group worklogs by month
   */
  groupByMonth(): Map<string, WorklogModel[]> {
    const groups = new Map<string, WorklogModel[]>();
    
    this._worklogs.forEach(worklog => {
      const date = worklog.workDate;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(worklog);
    });
    
    return groups;
  }

  /**
   * Sort worklogs by start date
   */
  sortByStarted(ascending = true): WorklogCollectionModel {
    const sorted = [...this._worklogs].sort((a, b) => {
      const dateA = new Date(a.started).getTime();
      const dateB = new Date(b.started).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new WorklogCollectionModel(sorted);
  }

  /**
   * Sort worklogs by creation date
   */
  sortByCreated(ascending = true): WorklogCollectionModel {
    const sorted = [...this._worklogs].sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new WorklogCollectionModel(sorted);
  }

  /**
   * Sort worklogs by time spent
   */
  sortByTimeSpent(ascending = true): WorklogCollectionModel {
    const sorted = [...this._worklogs].sort((a, b) => {
      return ascending ? 
        a.timeSpentSeconds - b.timeSpentSeconds : 
        b.timeSpentSeconds - a.timeSpentSeconds;
    });
    return new WorklogCollectionModel(sorted);
  }

  /**
   * Sort worklogs by author
   */
  sortByAuthor(ascending = true): WorklogCollectionModel {
    const sorted = [...this._worklogs].sort((a, b) => {
      const nameA = a.author.displayName.toLowerCase();
      const nameB = b.author.displayName.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new WorklogCollectionModel(sorted);
  }

  /**
   * Get time spent summary by author
   */
  getTimeSpentByAuthor(): Map<string, {
    author: WorklogModel['author'];
    totalSeconds: number;
    totalFormatted: string;
    worklogCount: number;
    averageSeconds: number;
    averageFormatted: string;
  }> {
    const authorGroups = this.groupByAuthor();
    const summary = new Map();
    
    authorGroups.forEach((worklogs, authorKey) => {
      const totalSeconds = worklogs.reduce((sum, wl) => sum + wl.timeSpentSeconds, 0);
      const worklogCount = worklogs.length;
      const averageSeconds = totalSeconds / worklogCount;
      
      const firstWorklog = worklogs[0];
      if (firstWorklog) {
        summary.set(authorKey, {
          author: firstWorklog.author,
        totalSeconds,
        totalFormatted: WorklogModel.formatTimeSpent(totalSeconds),
        worklogCount,
        averageSeconds,
        averageFormatted: WorklogModel.formatTimeSpent(averageSeconds),
        });
      }
    });
    
    return summary;
  }

  /**
   * Get time spent summary by date
   */
  getTimeSpentByDate(): Map<string, {
    date: string;
    totalSeconds: number;
    totalFormatted: string;
    worklogCount: number;
    authors: Set<string>;
  }> {
    const dateGroups = this.groupByDate();
    const summary = new Map();
    
    dateGroups.forEach((worklogs, dateKey) => {
      const totalSeconds = worklogs.reduce((sum, wl) => sum + wl.timeSpentSeconds, 0);
      const worklogCount = worklogs.length;
      const authors = new Set(worklogs.map(wl => wl.author.key));
      
      summary.set(dateKey, {
        date: dateKey,
        totalSeconds,
        totalFormatted: WorklogModel.formatTimeSpent(totalSeconds),
        worklogCount,
        authors,
      });
    });
    
    return summary;
  }

  /**
   * Get worklogs with pagination
   */
  paginate(startAt = 0, maxResults = 20): {
    worklogs: WorklogModel[];
    startAt: number;
    maxResults: number;
    total: number;
    hasMore: boolean;
  } {
    const worklogs = this._worklogs.slice(startAt, startAt + maxResults);
    return {
      worklogs,
      startAt,
      maxResults,
      total: this.count,
      hasMore: startAt + maxResults < this.count,
    };
  }

  /**
   * Get worklog summaries for display
   */
  getSummaries(): Array<ReturnType<WorklogModel['getSummary']>> {
    return this._worklogs.map(worklog => worklog.getSummary());
  }

  /**
   * Convert to array of plain objects
   */
  toArray(): Record<string, any>[] {
    return this._worklogs.map(worklog => worklog.toObject());
  }

  /**
   * Static method to create from JiraWorklog array
   */
  static from(worklogs: JiraWorklog[]): WorklogCollectionModel {
    const models = WorklogModel.fromArray(worklogs);
    return new WorklogCollectionModel(models);
  }
}

/**
 * Type definitions for worklog-related operations
 */
export interface WorklogCreatePayload {
  comment?: string;
  started: IsoDateString;
  timeSpent: string;
  visibility?: {
    type: 'group' | 'role';
    value: string;
    identifier?: string;
  };
  properties?: Array<{
    key: string;
    value: any;
  }>;
}

export interface WorklogUpdatePayload {
  comment?: string;
  started?: IsoDateString;
  timeSpent?: string;
  visibility?: {
    type: 'group' | 'role';
    value: string;
    identifier?: string;
  } | null; // null to make public
  properties?: Array<{
    key: string;
    value: any;
  }>;
}

export interface WorklogSearchOptions {
  expand?: string[];
  startedAfter?: number; // Unix timestamp
  startedBefore?: number; // Unix timestamp
  maxResults?: number;
  startAt?: number;
}