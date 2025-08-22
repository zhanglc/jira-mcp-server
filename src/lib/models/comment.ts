/**
 * Comment Data Model
 *
 * Provides a clean abstraction layer over the raw Jira Comment API types.
 * Handles comment information, visibility, and properties.
 */

import type { JiraComment, JiraUser } from '@/types/jira-api';
import type { IsoDateString } from '@/types/common';

/**
 * Comment Model Class
 * Wraps JiraComment with additional helper methods and processing
 */
export class CommentModel {
  private readonly _data: JiraComment;

  constructor(data: JiraComment) {
    this._data = data;
  }

  /**
   * Get the raw Jira comment data
   */
  get raw(): JiraComment {
    return this._data;
  }

  /**
   * Get basic comment identification
   */
  get id(): string {
    return this._data.id;
  }

  get self(): string {
    return this._data.self;
  }

  /**
   * Get comment content
   */
  get body(): string {
    return this._data.body;
  }

  /**
   * Get comment author information
   */
  get author(): JiraUser {
    return this._data.author;
  }

  get updateAuthor(): JiraUser | undefined {
    return this._data.updateAuthor;
  }

  /**
   * Get comment timestamps
   */
  get created(): IsoDateString {
    return this._data.created;
  }

  get updated(): IsoDateString {
    return this._data.updated;
  }

  /**
   * Check if comment was edited
   */
  get isEdited(): boolean {
    return this.created !== this.updated;
  }

  /**
   * Get time since creation
   */
  getTimeSinceCreated(): number {
    return Date.now() - new Date(this.created).getTime();
  }

  /**
   * Get time since last update
   */
  getTimeSinceUpdated(): number {
    return Date.now() - new Date(this.updated).getTime();
  }

  /**
   * Get comment visibility
   */
  get visibility(): JiraComment['visibility'] | undefined {
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

  /**
   * Get comment properties
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
   * Get comment summary for display
   */
  getSummary(): {
    id: string;
    author: string;
    authorDisplayName: string;
    body: string;
    bodyPreview: string;
    created: IsoDateString;
    updated: IsoDateString;
    isEdited: boolean;
    isPublic: boolean;
    visibility?: string;
  } {
    return {
      id: this.id,
      author: this.author.key,
      authorDisplayName: this.author.displayName,
      body: this.body,
      bodyPreview: this.getBodyPreview(),
      created: this.created,
      updated: this.updated,
      isEdited: this.isEdited,
      isPublic: this.isPublic,
      ...(this.visibility && { visibility: `${this.visibilityType}:${this.visibilityValue}` }),
    };
  }

  /**
   * Get preview of comment body (truncated)
   */
  getBodyPreview(maxLength = 100): string {
    if (this.body.length <= maxLength) {
      return this.body;
    }
    return this.body.substring(0, maxLength).trim() + '...';
  }

  /**
   * Get word count of comment body
   */
  getWordCount(): number {
    return this.body.trim().split(/\s+/).length;
  }

  /**
   * Get character count of comment body
   */
  getCharacterCount(): number {
    return this.body.length;
  }

  /**
   * Check if comment mentions a user
   */
  mentionsUser(username: string): boolean {
    // Simple check for @username pattern
    const mentionPattern = new RegExp(`@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return mentionPattern.test(this.body);
  }

  /**
   * Check if comment was created by a specific user
   */
  isAuthoredBy(userKey: string): boolean {
    return this.author.key === userKey;
  }

  /**
   * Check if comment was last updated by a specific user
   */
  isLastUpdatedBy(userKey: string): boolean {
    return this.updateAuthor?.key === userKey;
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      body: this.body,
      author: this.author,
      updateAuthor: this.updateAuthor,
      created: this.created,
      updated: this.updated,
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
   * Static method to create CommentModel from raw data
   */
  static from(data: JiraComment): CommentModel {
    return new CommentModel(data);
  }

  /**
   * Static method to create multiple CommentModels from array
   */
  static fromArray(data: JiraComment[]): CommentModel[] {
    return data.map(comment => new CommentModel(comment));
  }
}

/**
 * Comment Collection Model
 * Provides utilities for working with collections of comments
 */
export class CommentCollectionModel {
  private readonly _comments: CommentModel[];

  constructor(comments: CommentModel[]) {
    this._comments = comments;
  }

  /**
   * Get all comments
   */
  get comments(): CommentModel[] {
    return this._comments;
  }

  /**
   * Get count of comments
   */
  get count(): number {
    return this._comments.length;
  }

  /**
   * Get total word count across all comments
   */
  get totalWordCount(): number {
    return this._comments.reduce((total, comment) => total + comment.getWordCount(), 0);
  }

  /**
   * Get total character count across all comments
   */
  get totalCharacterCount(): number {
    return this._comments.reduce((total, comment) => total + comment.getCharacterCount(), 0);
  }

  /**
   * Find comment by ID
   */
  findById(id: string): CommentModel | undefined {
    return this._comments.find(comment => comment.id === id);
  }

  /**
   * Filter comments by author
   */
  filterByAuthor(userKey: string): CommentCollectionModel {
    const authorComments = this._comments.filter(comment => 
      comment.isAuthoredBy(userKey)
    );
    return new CommentCollectionModel(authorComments);
  }

  /**
   * Filter public comments
   */
  filterPublic(): CommentCollectionModel {
    const publicComments = this._comments.filter(comment => comment.isPublic);
    return new CommentCollectionModel(publicComments);
  }

  /**
   * Filter restricted comments
   */
  filterRestricted(): CommentCollectionModel {
    const restrictedComments = this._comments.filter(comment => comment.isRestricted);
    return new CommentCollectionModel(restrictedComments);
  }

  /**
   * Filter comments by visibility type
   */
  filterByVisibilityType(type: 'group' | 'role'): CommentCollectionModel {
    const visibilityComments = this._comments.filter(comment => 
      comment.visibilityType === type
    );
    return new CommentCollectionModel(visibilityComments);
  }

  /**
   * Filter comments created after a specific date
   */
  filterCreatedAfter(date: Date | string): CommentCollectionModel {
    const filterDate = typeof date === 'string' ? new Date(date) : date;
    const filteredComments = this._comments.filter(comment => 
      new Date(comment.created) > filterDate
    );
    return new CommentCollectionModel(filteredComments);
  }

  /**
   * Filter comments updated after a specific date
   */
  filterUpdatedAfter(date: Date | string): CommentCollectionModel {
    const filterDate = typeof date === 'string' ? new Date(date) : date;
    const filteredComments = this._comments.filter(comment => 
      new Date(comment.updated) > filterDate
    );
    return new CommentCollectionModel(filteredComments);
  }

  /**
   * Filter edited comments
   */
  filterEdited(): CommentCollectionModel {
    const editedComments = this._comments.filter(comment => comment.isEdited);
    return new CommentCollectionModel(editedComments);
  }

  /**
   * Search comments by text content
   */
  searchByText(searchTerm: string, caseSensitive = false): CommentCollectionModel {
    const searchText = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const matchingComments = this._comments.filter(comment => {
      const commentText = caseSensitive ? comment.body : comment.body.toLowerCase();
      return commentText.includes(searchText);
    });
    return new CommentCollectionModel(matchingComments);
  }

  /**
   * Find comments that mention a specific user
   */
  findMentionsOfUser(username: string): CommentCollectionModel {
    const mentionComments = this._comments.filter(comment => 
      comment.mentionsUser(username)
    );
    return new CommentCollectionModel(mentionComments);
  }

  /**
   * Group comments by author
   */
  groupByAuthor(): Map<string, CommentModel[]> {
    const groups = new Map<string, CommentModel[]>();
    
    this._comments.forEach(comment => {
      const authorKey = comment.author.key;
      if (!groups.has(authorKey)) {
        groups.set(authorKey, []);
      }
      groups.get(authorKey)!.push(comment);
    });
    
    return groups;
  }

  /**
   * Group comments by visibility type
   */
  groupByVisibility(): Map<string, CommentModel[]> {
    const groups = new Map<string, CommentModel[]>();
    
    this._comments.forEach(comment => {
      const visibilityKey = comment.isPublic ? 'public' : 
        `${comment.visibilityType}:${comment.visibilityValue}`;
      if (!groups.has(visibilityKey)) {
        groups.set(visibilityKey, []);
      }
      groups.get(visibilityKey)!.push(comment);
    });
    
    return groups;
  }

  /**
   * Sort comments by creation date
   */
  sortByCreated(ascending = true): CommentCollectionModel {
    const sorted = [...this._comments].sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new CommentCollectionModel(sorted);
  }

  /**
   * Sort comments by update date
   */
  sortByUpdated(ascending = true): CommentCollectionModel {
    const sorted = [...this._comments].sort((a, b) => {
      const dateA = new Date(a.updated).getTime();
      const dateB = new Date(b.updated).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new CommentCollectionModel(sorted);
  }

  /**
   * Sort comments by author name
   */
  sortByAuthor(ascending = true): CommentCollectionModel {
    const sorted = [...this._comments].sort((a, b) => {
      const nameA = a.author.displayName.toLowerCase();
      const nameB = b.author.displayName.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new CommentCollectionModel(sorted);
  }

  /**
   * Get comments with pagination
   */
  paginate(startAt = 0, maxResults = 20): {
    comments: CommentModel[];
    startAt: number;
    maxResults: number;
    total: number;
    hasMore: boolean;
  } {
    const comments = this._comments.slice(startAt, startAt + maxResults);
    return {
      comments,
      startAt,
      maxResults,
      total: this.count,
      hasMore: startAt + maxResults < this.count,
    };
  }

  /**
   * Get comment summaries for display
   */
  getSummaries(): Array<ReturnType<CommentModel['getSummary']>> {
    return this._comments.map(comment => comment.getSummary());
  }

  /**
   * Convert to array of plain objects
   */
  toArray(): Record<string, any>[] {
    return this._comments.map(comment => comment.toObject());
  }

  /**
   * Static method to create from JiraComment array
   */
  static from(comments: JiraComment[]): CommentCollectionModel {
    const models = CommentModel.fromArray(comments);
    return new CommentCollectionModel(models);
  }
}

/**
 * Type definitions for comment-related operations
 */
export interface CommentCreatePayload {
  body: string;
  visibility?: {
    type: 'group' | 'role';
    value: string;
  };
  properties?: Array<{
    key: string;
    value: any;
  }>;
}

export interface CommentUpdatePayload {
  body?: string;
  visibility?: {
    type: 'group' | 'role';
    value: string;
  } | null; // null to make public
  properties?: Array<{
    key: string;
    value: any;
  }>;
}

export interface CommentSearchOptions {
  expand?: string[];
  orderBy?: 'created' | '-created' | 'updated' | '-updated';
  startAt?: number;
  maxResults?: number;
}