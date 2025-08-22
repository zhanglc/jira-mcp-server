/**
 * Project Data Model
 *
 * Provides a clean abstraction layer over the raw Jira Project API types.
 * Handles project information, components, versions, and metadata.
 */

import type {
  JiraProject,
  JiraComponent,
  JiraVersion,
  JiraIssueType,
  JiraUser,
} from '@/types/jira-api';
import type { IsoDateString } from '@/types/common';

/**
 * Project Model Class
 * Wraps JiraProject with additional helper methods and processing
 */
export class ProjectModel {
  private readonly _data: JiraProject;

  constructor(data: JiraProject) {
    this._data = data;
  }

  /**
   * Get the raw Jira project data
   */
  get raw(): JiraProject {
    return this._data;
  }

  /**
   * Get basic project identification
   */
  get id(): string {
    return this._data.id;
  }

  get key(): string {
    return this._data.key;
  }

  get name(): string {
    return this._data.name;
  }

  get self(): string {
    return this._data.self;
  }

  /**
   * Get project metadata
   */
  get description(): string | undefined {
    return this._data.description;
  }

  get url(): string | undefined {
    return this._data.url;
  }

  get email(): string | undefined {
    return this._data.email;
  }

  get assigneeType(): string | undefined {
    return this._data.assigneeType;
  }

  get projectTypeKey(): string | undefined {
    return this._data.projectTypeKey;
  }

  get isArchived(): boolean {
    return this._data.archived ?? false;
  }

  /**
   * Get project lead
   */
  get lead(): JiraUser | undefined {
    return this._data.lead;
  }

  /**
   * Get project avatar URLs
   */
  get avatarUrls(): JiraProject['avatarUrls'] {
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
   * Get project category
   */
  get category(): JiraProject['projectCategory'] | undefined {
    return this._data.projectCategory;
  }

  get categoryName(): string | undefined {
    return this.category?.name;
  }

  /**
   * Get project roles
   */
  get roles(): Record<string, string> {
    return this._data.roles;
  }

  get roleNames(): string[] {
    return Object.keys(this.roles);
  }

  /**
   * Get role URL by name
   */
  getRoleUrl(roleName: string): string | undefined {
    return this.roles[roleName];
  }

  /**
   * Check if role exists
   */
  hasRole(roleName: string): boolean {
    return roleName in this.roles;
  }

  /**
   * Get components
   */
  get components(): JiraComponent[] {
    return this._data.components;
  }

  get componentCount(): number {
    return this.components.length;
  }

  /**
   * Find component by name
   */
  findComponentByName(name: string): JiraComponent | undefined {
    return this.components.find(component => 
      component.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Find component by ID
   */
  findComponentById(id: string): JiraComponent | undefined {
    return this.components.find(component => component.id === id);
  }

  /**
   * Get component names
   */
  getComponentNames(): string[] {
    return this.components.map(component => component.name);
  }

  /**
   * Check if component exists
   */
  hasComponent(name: string): boolean {
    return this.findComponentByName(name) !== undefined;
  }

  /**
   * Get versions
   */
  get versions(): JiraVersion[] {
    return this._data.versions;
  }

  get versionCount(): number {
    return this.versions.length;
  }

  /**
   * Get released versions
   */
  get releasedVersions(): JiraVersion[] {
    return this.versions.filter(version => version.released);
  }

  /**
   * Get unreleased versions
   */
  get unreleasedVersions(): JiraVersion[] {
    return this.versions.filter(version => !version.released);
  }

  /**
   * Get archived versions
   */
  get archivedVersions(): JiraVersion[] {
    return this.versions.filter(version => version.archived);
  }

  /**
   * Get active (non-archived) versions
   */
  get activeVersions(): JiraVersion[] {
    return this.versions.filter(version => !version.archived);
  }

  /**
   * Find version by name
   */
  findVersionByName(name: string): JiraVersion | undefined {
    return this.versions.find(version => 
      version.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Find version by ID
   */
  findVersionById(id: string): JiraVersion | undefined {
    return this.versions.find(version => version.id === id);
  }

  /**
   * Get version names
   */
  getVersionNames(): string[] {
    return this.versions.map(version => version.name);
  }

  /**
   * Check if version exists
   */
  hasVersion(name: string): boolean {
    return this.findVersionByName(name) !== undefined;
  }

  /**
   * Get issue types
   */
  get issueTypes(): JiraIssueType[] {
    return this._data.issueTypes;
  }

  get issueTypeCount(): number {
    return this.issueTypes.length;
  }

  /**
   * Get subtask issue types
   */
  get subtaskTypes(): JiraIssueType[] {
    return this.issueTypes.filter(type => type.subtask);
  }

  /**
   * Get regular (non-subtask) issue types
   */
  get regularIssueTypes(): JiraIssueType[] {
    return this.issueTypes.filter(type => !type.subtask);
  }

  /**
   * Find issue type by name
   */
  findIssueTypeByName(name: string): JiraIssueType | undefined {
    return this.issueTypes.find(type => 
      type.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Find issue type by ID
   */
  findIssueTypeById(id: string): JiraIssueType | undefined {
    return this.issueTypes.find(type => type.id === id);
  }

  /**
   * Get issue type names
   */
  getIssueTypeNames(): string[] {
    return this.issueTypes.map(type => type.name);
  }

  /**
   * Check if issue type exists
   */
  hasIssueType(name: string): boolean {
    return this.findIssueTypeByName(name) !== undefined;
  }

  /**
   * Get project properties
   */
  get properties(): Record<string, any> | undefined {
    return this._data.properties;
  }

  /**
   * Get project property by key
   */
  getProperty(key: string): any {
    return this.properties?.[key];
  }

  /**
   * Check if property exists
   */
  hasProperty(key: string): boolean {
    return this.properties !== undefined && key in this.properties;
  }

  /**
   * Get project insight information
   */
  get insight(): JiraProject['insight'] | undefined {
    return this._data.insight;
  }

  get totalIssueCount(): number | undefined {
    return this.insight?.totalIssueCount;
  }

  get lastIssueUpdateTime(): IsoDateString | undefined {
    return this.insight?.lastIssueUpdateTime;
  }

  /**
   * Get project summary for display
   */
  getSummary(): {
    key: string;
    name: string;
    description?: string;
    lead?: string;
    avatar: string;
    componentCount: number;
    versionCount: number;
    issueTypeCount: number;
    isArchived: boolean;
    category?: string;
  } {
    return {
      key: this.key,
      name: this.name,
      ...(this.description && { description: this.description }),
      ...(this.lead?.displayName && { lead: this.lead.displayName }),
      avatar: this.mediumAvatar,
      componentCount: this.componentCount,
      versionCount: this.versionCount,
      issueTypeCount: this.issueTypeCount,
      isArchived: this.isArchived,
      ...(this.categoryName && { category: this.categoryName }),
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
      description: this.description,
      lead: this.lead,
      components: this.components,
      versions: this.versions,
      issueTypes: this.issueTypes,
      url: this.url,
      email: this.email,
      assigneeType: this.assigneeType,
      roles: this.roles,
      avatarUrls: this.avatarUrls,
      projectCategory: this.category,
      projectTypeKey: this.projectTypeKey,
      archived: this.isArchived,
      properties: this.properties,
      insight: this.insight,
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
   * Static method to create ProjectModel from raw data
   */
  static from(data: JiraProject): ProjectModel {
    return new ProjectModel(data);
  }

  /**
   * Static method to create multiple ProjectModels from array
   */
  static fromArray(data: JiraProject[]): ProjectModel[] {
    return data.map(project => new ProjectModel(project));
  }
}

/**
 * Project Collection Model
 * Provides utilities for working with collections of projects
 */
export class ProjectCollectionModel {
  private readonly _projects: ProjectModel[];

  constructor(projects: ProjectModel[]) {
    this._projects = projects;
  }

  /**
   * Get all projects
   */
  get projects(): ProjectModel[] {
    return this._projects;
  }

  /**
   * Get count of projects
   */
  get count(): number {
    return this._projects.length;
  }

  /**
   * Find project by key
   */
  findByKey(key: string): ProjectModel | undefined {
    return this._projects.find(project => 
      project.key.toLowerCase() === key.toLowerCase()
    );
  }

  /**
   * Find project by name
   */
  findByName(name: string): ProjectModel | undefined {
    return this._projects.find(project => 
      project.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Find projects by name (partial match)
   */
  searchByName(searchTerm: string): ProjectModel[] {
    const term = searchTerm.toLowerCase();
    return this._projects.filter(project => 
      project.name.toLowerCase().includes(term)
    );
  }

  /**
   * Filter active (non-archived) projects
   */
  filterActive(): ProjectCollectionModel {
    const activeProjects = this._projects.filter(project => !project.isArchived);
    return new ProjectCollectionModel(activeProjects);
  }

  /**
   * Filter archived projects
   */
  filterArchived(): ProjectCollectionModel {
    const archivedProjects = this._projects.filter(project => project.isArchived);
    return new ProjectCollectionModel(archivedProjects);
  }

  /**
   * Filter projects by category
   */
  filterByCategory(categoryName: string): ProjectCollectionModel {
    const categoryProjects = this._projects.filter(project => 
      project.categoryName?.toLowerCase() === categoryName.toLowerCase()
    );
    return new ProjectCollectionModel(categoryProjects);
  }

  /**
   * Filter projects by lead
   */
  filterByLead(leadKey: string): ProjectCollectionModel {
    const leadProjects = this._projects.filter(project => 
      project.lead?.key === leadKey
    );
    return new ProjectCollectionModel(leadProjects);
  }

  /**
   * Filter projects by project type
   */
  filterByType(projectTypeKey: string): ProjectCollectionModel {
    const typeProjects = this._projects.filter(project => 
      project.projectTypeKey === projectTypeKey
    );
    return new ProjectCollectionModel(typeProjects);
  }

  /**
   * Get all unique categories
   */
  getAllCategories(): string[] {
    const categories = new Set<string>();
    this._projects.forEach(project => {
      if (project.categoryName) {
        categories.add(project.categoryName);
      }
    });
    return Array.from(categories).sort();
  }

  /**
   * Get all unique project types
   */
  getAllProjectTypes(): string[] {
    const types = new Set<string>();
    this._projects.forEach(project => {
      if (project.projectTypeKey) {
        types.add(project.projectTypeKey);
      }
    });
    return Array.from(types).sort();
  }

  /**
   * Group projects by category
   */
  groupByCategory(): Map<string, ProjectModel[]> {
    const groups = new Map<string, ProjectModel[]>();
    
    this._projects.forEach(project => {
      const categoryName = project.categoryName ?? 'No Category';
      if (!groups.has(categoryName)) {
        groups.set(categoryName, []);
      }
      groups.get(categoryName)!.push(project);
    });
    
    return groups;
  }

  /**
   * Group projects by lead
   */
  groupByLead(): Map<string, ProjectModel[]> {
    const groups = new Map<string, ProjectModel[]>();
    
    this._projects.forEach(project => {
      const leadKey = project.lead?.key ?? 'No Lead';
      if (!groups.has(leadKey)) {
        groups.set(leadKey, []);
      }
      groups.get(leadKey)!.push(project);
    });
    
    return groups;
  }

  /**
   * Sort projects alphabetically by name
   */
  sortByName(ascending = true): ProjectCollectionModel {
    const sorted = [...this._projects].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new ProjectCollectionModel(sorted);
  }

  /**
   * Sort projects by key
   */
  sortByKey(ascending = true): ProjectCollectionModel {
    const sorted = [...this._projects].sort((a, b) => {
      const keyA = a.key.toLowerCase();
      const keyB = b.key.toLowerCase();
      return ascending ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
    });
    return new ProjectCollectionModel(sorted);
  }

  /**
   * Sort projects by issue count (if insight is available)
   */
  sortByIssueCount(ascending = true): ProjectCollectionModel {
    const sorted = [...this._projects].sort((a, b) => {
      const countA = a.totalIssueCount ?? 0;
      const countB = b.totalIssueCount ?? 0;
      return ascending ? countA - countB : countB - countA;
    });
    return new ProjectCollectionModel(sorted);
  }

  /**
   * Get project summaries for display
   */
  getSummaries(): Array<ReturnType<ProjectModel['getSummary']>> {
    return this._projects.map(project => project.getSummary());
  }

  /**
   * Convert to array of plain objects
   */
  toArray(): Record<string, any>[] {
    return this._projects.map(project => project.toObject());
  }

  /**
   * Static method to create from JiraProject array
   */
  static from(projects: JiraProject[]): ProjectCollectionModel {
    const models = ProjectModel.fromArray(projects);
    return new ProjectCollectionModel(models);
  }
}

/**
 * Component Model Class
 * Wraps JiraComponent with additional helper methods
 */
export class ComponentModel {
  private readonly _data: JiraComponent;

  constructor(data: JiraComponent) {
    this._data = data;
  }

  get raw(): JiraComponent {
    return this._data;
  }

  get id(): string {
    return this._data.id;
  }

  get name(): string {
    return this._data.name;
  }

  get description(): string | undefined {
    return this._data.description;
  }

  get lead(): JiraUser | undefined {
    return this._data.lead;
  }

  get assignee(): JiraUser | undefined {
    return this._data.assignee;
  }

  get realAssignee(): JiraUser | undefined {
    return this._data.realAssignee;
  }

  get project(): string | undefined {
    return this._data.project;
  }

  get projectId(): number | undefined {
    return this._data.projectId;
  }

  toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      lead: this.lead,
      assignee: this.assignee,
      project: this.project,
      projectId: this.projectId,
      self: this._data.self,
    };
  }

  static from(data: JiraComponent): ComponentModel {
    return new ComponentModel(data);
  }
}

/**
 * Version Model Class
 * Wraps JiraVersion with additional helper methods
 */
export class VersionModel {
  private readonly _data: JiraVersion;

  constructor(data: JiraVersion) {
    this._data = data;
  }

  get raw(): JiraVersion {
    return this._data;
  }

  get id(): string {
    return this._data.id;
  }

  get name(): string {
    return this._data.name;
  }

  get description(): string | undefined {
    return this._data.description;
  }

  get isArchived(): boolean {
    return this._data.archived;
  }

  get isReleased(): boolean {
    return this._data.released;
  }

  get startDate(): IsoDateString | undefined {
    return this._data.startDate;
  }

  get releaseDate(): IsoDateString | undefined {
    return this._data.releaseDate;
  }

  get isOverdue(): boolean {
    return this._data.overdue ?? false;
  }

  get project(): string | undefined {
    return this._data.project;
  }

  get projectId(): number | undefined {
    return this._data.projectId;
  }

  get isActive(): boolean {
    return !this.isArchived;
  }

  toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      archived: this.isArchived,
      released: this.isReleased,
      startDate: this.startDate,
      releaseDate: this.releaseDate,
      overdue: this.isOverdue,
      project: this.project,
      projectId: this.projectId,
      self: this._data.self,
    };
  }

  static from(data: JiraVersion): VersionModel {
    return new VersionModel(data);
  }
}

/**
 * Type definitions for project-related operations
 */
export interface ProjectSearchOptions {
  expand?: string[];
  includeArchived?: boolean;
  categoryId?: string;
  projectTypeKey?: string;
}

export interface ProjectCreatePayload {
  key: string;
  name: string;
  description?: string;
  leadAccountId?: string;
  projectTypeKey?: string;
  projectTemplateKey?: string;
  assigneeType?: string;
  avatarId?: number;
  issueSecurityScheme?: number;
  permissionScheme?: number;
  notificationScheme?: number;
  categoryId?: number;
}