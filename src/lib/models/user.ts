/**
 * User Data Model
 *
 * Provides a clean abstraction layer over the raw Jira User API types.
 * Handles user information, groups, and avatar management.
 */

import type { JiraUser, JiraGroup } from '@/types/jira-api';

/**
 * User Model Class
 * Wraps JiraUser with additional helper methods and processing
 */
export class UserModel {
  private readonly _data: JiraUser;

  constructor(data: JiraUser) {
    this._data = data;
  }

  /**
   * Get the raw Jira user data
   */
  get raw(): JiraUser {
    return this._data;
  }

  /**
   * Get basic user identification
   */
  get id(): string {
    return this._data.id;
  }

  get name(): string {
    return this._data.name;
  }

  get key(): string {
    return this._data.key;
  }

  get self(): string {
    return this._data.self;
  }

  /**
   * Get display information
   */
  get displayName(): string {
    return this._data.displayName;
  }

  get emailAddress(): string | undefined {
    return this._data.emailAddress;
  }

  /**
   * Get user status
   */
  get isActive(): boolean {
    return this._data.active;
  }

  /**
   * Get user locale and timezone
   */
  get timeZone(): string | undefined {
    return this._data.timeZone;
  }

  get locale(): string | undefined {
    return this._data.locale;
  }

  /**
   * Get avatar URLs
   */
  get avatarUrls(): JiraUser['avatarUrls'] {
    return this._data.avatarUrls;
  }

  get smallAvatar(): string {
    return this._data.avatarUrls['16x16'];
  }

  get mediumAvatar(): string {
    return this._data.avatarUrls['24x24'];
  }

  get largeAvatar(): string {
    return this._data.avatarUrls['48x48'];
  }

  /**
   * Get best available avatar for a given size preference
   */
  getBestAvatar(preferredSize: 'small' | 'medium' | 'large' = 'medium'): string {
    switch (preferredSize) {
      case 'small':
        return this.smallAvatar;
      case 'large':
        return this.largeAvatar;
      case 'medium':
      default:
        return this.mediumAvatar;
    }
  }

  /**
   * Get group information
   */
  get groups(): JiraGroup[] {
    return this._data.groups?.items ?? [];
  }

  get groupCount(): number {
    return this._data.groups?.size ?? 0;
  }

  /**
   * Check if user belongs to a specific group
   */
  belongsToGroup(groupName: string): boolean {
    return this.groups.some(group => 
      group.name.toLowerCase() === groupName.toLowerCase()
    );
  }

  /**
   * Get all group names
   */
  getGroupNames(): string[] {
    return this.groups.map(group => group.name);
  }

  /**
   * Check if user has any groups
   */
  get hasGroups(): boolean {
    return this.groupCount > 0;
  }

  /**
   * Get user's initials for display
   */
  get initials(): string {
    const names = this.displayName.split(' ');
    if (names.length === 1) {
      return names[0]!.substring(0, 2).toUpperCase();
    }
    return names.map(name => name.charAt(0).toUpperCase()).join('').substring(0, 2);
  }

  /**
   * Get a short display name (first name or username)
   */
  get shortName(): string {
    const names = this.displayName.split(' ');
    return names[0] ?? this.name;
  }

  /**
   * Get user summary for display
   */
  getSummary(): {
    key: string;
    name: string;
    displayName: string;
    email?: string;
    isActive: boolean;
    avatar: string;
    initials: string;
  } {
    return {
      key: this.key,
      name: this.name,
      displayName: this.displayName,
      ...(this.emailAddress && { email: this.emailAddress }),
      isActive: this.isActive,
      avatar: this.mediumAvatar,
      initials: this.initials,
    };
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      key: this.key,
      name: this.name,
      displayName: this.displayName,
      emailAddress: this.emailAddress,
      active: this.isActive,
      timeZone: this.timeZone,
      locale: this.locale,
      avatarUrls: this.avatarUrls,
      groups: this.groups,
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
   * Check if this user equals another user
   */
  equals(other: UserModel | JiraUser): boolean {
    const otherKey = other instanceof UserModel ? other.key : other.key;
    return this.key === otherKey;
  }

  /**
   * Static method to create UserModel from raw data
   */
  static from(data: JiraUser): UserModel {
    return new UserModel(data);
  }

  /**
   * Static method to create multiple UserModels from array
   */
  static fromArray(data: JiraUser[]): UserModel[] {
    return data.map(user => new UserModel(user));
  }
}

/**
 * User Collection Model
 * Provides utilities for working with collections of users
 */
export class UserCollectionModel {
  private readonly _users: UserModel[];

  constructor(users: UserModel[]) {
    this._users = users;
  }

  /**
   * Get all users
   */
  get users(): UserModel[] {
    return this._users;
  }

  /**
   * Get count of users
   */
  get count(): number {
    return this._users.length;
  }

  /**
   * Find user by key
   */
  findByKey(key: string): UserModel | undefined {
    return this._users.find(user => user.key === key);
  }

  /**
   * Find user by name
   */
  findByName(name: string): UserModel | undefined {
    return this._users.find(user => 
      user.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Find users by display name (partial match)
   */
  findByDisplayName(displayName: string): UserModel[] {
    const searchTerm = displayName.toLowerCase();
    return this._users.filter(user => 
      user.displayName.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Find users by email
   */
  findByEmail(email: string): UserModel | undefined {
    return this._users.find(user => 
      user.emailAddress?.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Filter active users
   */
  filterActive(): UserCollectionModel {
    const activeUsers = this._users.filter(user => user.isActive);
    return new UserCollectionModel(activeUsers);
  }

  /**
   * Filter inactive users
   */
  filterInactive(): UserCollectionModel {
    const inactiveUsers = this._users.filter(user => !user.isActive);
    return new UserCollectionModel(inactiveUsers);
  }

  /**
   * Filter users by group membership
   */
  filterByGroup(groupName: string): UserCollectionModel {
    const groupUsers = this._users.filter(user => 
      user.belongsToGroup(groupName)
    );
    return new UserCollectionModel(groupUsers);
  }

  /**
   * Get all unique groups from all users
   */
  getAllGroups(): string[] {
    const allGroups = new Set<string>();
    this._users.forEach(user => {
      user.getGroupNames().forEach(groupName => {
        allGroups.add(groupName);
      });
    });
    return Array.from(allGroups).sort();
  }

  /**
   * Group users by their groups
   */
  groupByGroups(): Map<string, UserModel[]> {
    const groups = new Map<string, UserModel[]>();
    
    this._users.forEach(user => {
      if (user.hasGroups) {
        user.getGroupNames().forEach(groupName => {
          if (!groups.has(groupName)) {
            groups.set(groupName, []);
          }
          groups.get(groupName)!.push(user);
        });
      } else {
        // Users without groups
        if (!groups.has('No Groups')) {
          groups.set('No Groups', []);
        }
        groups.get('No Groups')!.push(user);
      }
    });
    
    return groups;
  }

  /**
   * Sort users alphabetically by display name
   */
  sortByDisplayName(ascending = true): UserCollectionModel {
    const sorted = [...this._users].sort((a, b) => {
      const nameA = a.displayName.toLowerCase();
      const nameB = b.displayName.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new UserCollectionModel(sorted);
  }

  /**
   * Sort users by username
   */
  sortByName(ascending = true): UserCollectionModel {
    const sorted = [...this._users].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new UserCollectionModel(sorted);
  }

  /**
   * Get user summaries for display
   */
  getSummaries(): Array<ReturnType<UserModel['getSummary']>> {
    return this._users.map(user => user.getSummary());
  }

  /**
   * Convert to array of plain objects
   */
  toArray(): Record<string, any>[] {
    return this._users.map(user => user.toObject());
  }

  /**
   * Static method to create from JiraUser array
   */
  static from(users: JiraUser[]): UserCollectionModel {
    const models = UserModel.fromArray(users);
    return new UserCollectionModel(models);
  }
}

/**
 * Group Model Class
 * Wraps JiraGroup with additional helper methods
 */
export class GroupModel {
  private readonly _data: JiraGroup;

  constructor(data: JiraGroup) {
    this._data = data;
  }

  /**
   * Get the raw Jira group data
   */
  get raw(): JiraGroup {
    return this._data;
  }

  /**
   * Get basic group identification
   */
  get id(): string {
    return this._data.id;
  }

  get name(): string {
    return this._data.name;
  }

  get self(): string {
    return this._data.self;
  }

  get groupId(): string | undefined {
    return this._data.groupId;
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      groupId: this.groupId,
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
   * Static method to create GroupModel from raw data
   */
  static from(data: JiraGroup): GroupModel {
    return new GroupModel(data);
  }

  /**
   * Static method to create multiple GroupModels from array
   */
  static fromArray(data: JiraGroup[]): GroupModel[] {
    return data.map(group => new GroupModel(group));
  }
}

/**
 * Type definitions for user-related operations
 */
export interface UserSearchOptions {
  username?: string;
  displayName?: string;
  emailAddress?: string;
  includeInactive?: boolean;
  maxResults?: number;
  startAt?: number;
}

export interface UserProfileOptions {
  expand?: string[];
}