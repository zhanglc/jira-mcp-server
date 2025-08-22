/**
 * Agile Data Models
 *
 * Provides clean abstraction layers over Jira Agile/Software API types.
 * Handles boards, sprints, and agile-specific functionality.
 */

import type {
  JiraBoard,
  JiraSprint,
  JiraBoardConfiguration,
  SprintState,
  BoardFilters,
  BoardIssueOptions,
} from '@/types/jira-api';
import type { IsoDateString } from '@/types/common';
import { IssueModel, IssueCollectionModel } from './issue';

/**
 * Board Model Class
 * Wraps JiraBoard with additional helper methods and processing
 */
export class BoardModel {
  private readonly _data: JiraBoard;

  constructor(data: JiraBoard) {
    this._data = data;
  }

  /**
   * Get the raw Jira board data
   */
  get raw(): JiraBoard {
    return this._data;
  }

  /**
   * Get basic board identification
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

  /**
   * Get board type
   */
  get type(): 'scrum' | 'kanban' | 'simple' {
    return this._data.type;
  }

  get isScrum(): boolean {
    return this.type === 'scrum';
  }

  get isKanban(): boolean {
    return this.type === 'kanban';
  }

  get isSimple(): boolean {
    return this.type === 'simple';
  }

  /**
   * Get board location information
   */
  get location(): JiraBoard['location'] {
    return this._data.location;
  }

  get locationType(): 'project' | 'user' {
    return this.location.type;
  }

  get isProjectBoard(): boolean {
    return this.locationType === 'project';
  }

  get isUserBoard(): boolean {
    return this.locationType === 'user';
  }

  get projectId(): number | undefined {
    return this.location.projectId;
  }

  get projectName(): string | undefined {
    return this.location.projectName;
  }

  get projectKey(): string | undefined {
    return this.location.projectKey;
  }

  get projectTypeKey(): string | undefined {
    return this.location.projectTypeKey;
  }

  get userId(): number | undefined {
    return this.location.userId;
  }

  get userAccountId(): string | undefined {
    return this.location.userAccountId;
  }

  get displayName(): string | undefined {
    return this.location.displayName;
  }

  get avatarURI(): string | undefined {
    return this.location.avatarURI;
  }

  /**
   * Get board permissions and state
   */
  get canEdit(): boolean {
    return this._data.canEdit ?? false;
  }

  get isPrivate(): boolean {
    return this._data.isPrivate ?? false;
  }

  get isPublic(): boolean {
    return !this.isPrivate;
  }

  get isFavourite(): boolean {
    return this._data.favourite ?? false;
  }

  /**
   * Get board summary for display
   */
  getSummary(): {
    id: string;
    name: string;
    type: string;
    locationType: string;
    projectKey?: string;
    projectName?: string;
    canEdit: boolean;
    isPrivate: boolean;
    isFavourite: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      locationType: this.locationType,
      ...(this.projectKey && { projectKey: this.projectKey }),
      ...(this.projectName && { projectName: this.projectName }),
      canEdit: this.canEdit,
      isPrivate: this.isPrivate,
      isFavourite: this.isFavourite,
    };
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      location: this.location,
      canEdit: this.canEdit,
      isPrivate: this.isPrivate,
      favourite: this.isFavourite,
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
   * Static method to create BoardModel from raw data
   */
  static from(data: JiraBoard): BoardModel {
    return new BoardModel(data);
  }

  /**
   * Static method to create multiple BoardModels from array
   */
  static fromArray(data: JiraBoard[]): BoardModel[] {
    return data.map(board => new BoardModel(board));
  }
}

/**
 * Board Collection Model
 * Provides utilities for working with collections of boards
 */
export class BoardCollectionModel {
  private readonly _boards: BoardModel[];

  constructor(boards: BoardModel[]) {
    this._boards = boards;
  }

  /**
   * Get all boards
   */
  get boards(): BoardModel[] {
    return this._boards;
  }

  /**
   * Get count of boards
   */
  get count(): number {
    return this._boards.length;
  }

  /**
   * Find board by ID
   */
  findById(id: string): BoardModel | undefined {
    return this._boards.find(board => board.id === id);
  }

  /**
   * Find board by name
   */
  findByName(name: string): BoardModel | undefined {
    return this._boards.find(board => 
      board.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Search boards by name (partial match)
   */
  searchByName(searchTerm: string): BoardModel[] {
    const term = searchTerm.toLowerCase();
    return this._boards.filter(board => 
      board.name.toLowerCase().includes(term)
    );
  }

  /**
   * Filter boards by type
   */
  filterByType(type: 'scrum' | 'kanban' | 'simple'): BoardCollectionModel {
    const filteredBoards = this._boards.filter(board => board.type === type);
    return new BoardCollectionModel(filteredBoards);
  }

  /**
   * Filter scrum boards
   */
  filterScrum(): BoardCollectionModel {
    return this.filterByType('scrum');
  }

  /**
   * Filter kanban boards
   */
  filterKanban(): BoardCollectionModel {
    return this.filterByType('kanban');
  }

  /**
   * Filter project boards
   */
  filterProjectBoards(): BoardCollectionModel {
    const projectBoards = this._boards.filter(board => board.isProjectBoard);
    return new BoardCollectionModel(projectBoards);
  }

  /**
   * Filter user boards
   */
  filterUserBoards(): BoardCollectionModel {
    const userBoards = this._boards.filter(board => board.isUserBoard);
    return new BoardCollectionModel(userBoards);
  }

  /**
   * Filter private boards
   */
  filterPrivate(): BoardCollectionModel {
    const privateBoards = this._boards.filter(board => board.isPrivate);
    return new BoardCollectionModel(privateBoards);
  }

  /**
   * Filter public boards
   */
  filterPublic(): BoardCollectionModel {
    const publicBoards = this._boards.filter(board => board.isPublic);
    return new BoardCollectionModel(publicBoards);
  }

  /**
   * Filter favourite boards
   */
  filterFavourites(): BoardCollectionModel {
    const favouriteBoards = this._boards.filter(board => board.isFavourite);
    return new BoardCollectionModel(favouriteBoards);
  }

  /**
   * Filter editable boards
   */
  filterEditable(): BoardCollectionModel {
    const editableBoards = this._boards.filter(board => board.canEdit);
    return new BoardCollectionModel(editableBoards);
  }

  /**
   * Filter boards by project
   */
  filterByProject(projectKey: string): BoardCollectionModel {
    const projectBoards = this._boards.filter(board => 
      board.projectKey?.toLowerCase() === projectKey.toLowerCase()
    );
    return new BoardCollectionModel(projectBoards);
  }

  /**
   * Group boards by type
   */
  groupByType(): Map<string, BoardModel[]> {
    const groups = new Map<string, BoardModel[]>();
    
    this._boards.forEach(board => {
      const type = board.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(board);
    });
    
    return groups;
  }

  /**
   * Group boards by project
   */
  groupByProject(): Map<string, BoardModel[]> {
    const groups = new Map<string, BoardModel[]>();
    
    this._boards.forEach(board => {
      const projectKey = board.projectKey ?? 'No Project';
      if (!groups.has(projectKey)) {
        groups.set(projectKey, []);
      }
      groups.get(projectKey)!.push(board);
    });
    
    return groups;
  }

  /**
   * Sort boards alphabetically by name
   */
  sortByName(ascending = true): BoardCollectionModel {
    const sorted = [...this._boards].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new BoardCollectionModel(sorted);
  }

  /**
   * Sort boards by type
   */
  sortByType(ascending = true): BoardCollectionModel {
    const sorted = [...this._boards].sort((a, b) => {
      const typeA = a.type;
      const typeB = b.type;
      return ascending ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
    });
    return new BoardCollectionModel(sorted);
  }

  /**
   * Get board summaries for display
   */
  getSummaries(): Array<ReturnType<BoardModel['getSummary']>> {
    return this._boards.map(board => board.getSummary());
  }

  /**
   * Convert to array of plain objects
   */
  toArray(): Record<string, any>[] {
    return this._boards.map(board => board.toObject());
  }

  /**
   * Static method to create from JiraBoard array
   */
  static from(boards: JiraBoard[]): BoardCollectionModel {
    const models = BoardModel.fromArray(boards);
    return new BoardCollectionModel(models);
  }
}

/**
 * Sprint Model Class
 * Wraps JiraSprint with additional helper methods and date calculations
 */
export class SprintModel {
  private readonly _data: JiraSprint;

  constructor(data: JiraSprint) {
    this._data = data;
  }

  /**
   * Get the raw Jira sprint data
   */
  get raw(): JiraSprint {
    return this._data;
  }

  /**
   * Get basic sprint identification
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

  /**
   * Get sprint state
   */
  get state(): SprintState {
    return this._data.state;
  }

  get isClosed(): boolean {
    return this.state === 'closed';
  }

  get isActive(): boolean {
    return this.state === 'active';
  }

  get isFuture(): boolean {
    return this.state === 'future';
  }

  /**
   * Get sprint dates
   */
  get startDate(): IsoDateString | undefined {
    return this._data.startDate;
  }

  get endDate(): IsoDateString | undefined {
    return this._data.endDate;
  }

  get completeDate(): IsoDateString | undefined {
    return this._data.completeDate;
  }

  /**
   * Get date objects
   */
  get startDateObject(): Date | undefined {
    return this.startDate ? new Date(this.startDate) : undefined;
  }

  get endDateObject(): Date | undefined {
    return this.endDate ? new Date(this.endDate) : undefined;
  }

  get completeDateObject(): Date | undefined {
    return this.completeDate ? new Date(this.completeDate) : undefined;
  }

  /**
   * Get sprint duration and time calculations
   */
  get plannedDurationDays(): number | undefined {
    if (!this.startDateObject || !this.endDateObject) {
      return undefined;
    }
    const diffTime = this.endDateObject.getTime() - this.startDateObject.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get actualDurationDays(): number | undefined {
    if (!this.startDateObject || !this.completeDateObject) {
      return undefined;
    }
    const diffTime = this.completeDateObject.getTime() - this.startDateObject.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysRemaining(): number | undefined {
    if (!this.isActive || !this.endDateObject) {
      return undefined;
    }
    const now = new Date();
    const diffTime = this.endDateObject.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysElapsed(): number | undefined {
    if (!this.isActive || !this.startDateObject) {
      return undefined;
    }
    const now = new Date();
    const diffTime = now.getTime() - this.startDateObject.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  get progressPercentage(): number | undefined {
    if (!this.isActive || !this.plannedDurationDays || !this.daysElapsed) {
      return undefined;
    }
    return Math.min(100, (this.daysElapsed / this.plannedDurationDays) * 100);
  }

  /**
   * Check sprint timing status
   */
  get hasStarted(): boolean {
    if (!this.startDateObject) return false;
    return new Date() >= this.startDateObject;
  }

  get hasEnded(): boolean {
    if (!this.endDateObject) return false;
    return new Date() >= this.endDateObject;
  }

  get isOverdue(): boolean {
    return this.isActive && this.hasEnded;
  }

  get isCompleted(): boolean {
    return this.isClosed && this.completeDate !== undefined;
  }

  /**
   * Get sprint metadata
   */
  get originBoardId(): number | undefined {
    return this._data.originBoardId;
  }

  get goal(): string | undefined {
    return this._data.goal;
  }

  get hasGoal(): boolean {
    return this.goal !== undefined && this.goal.trim().length > 0;
  }

  /**
   * Get sprint summary for display
   */
  getSummary(): {
    id: string;
    name: string;
    state: SprintState;
    startDate?: IsoDateString;
    endDate?: IsoDateString;
    completeDate?: IsoDateString;
    plannedDurationDays?: number;
    actualDurationDays?: number;
    daysRemaining?: number;
    daysElapsed?: number;
    progressPercentage?: number;
    hasGoal: boolean;
    goal?: string;
    originBoardId?: number;
  } {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      ...(this.startDate && { startDate: this.startDate }),
      ...(this.endDate && { endDate: this.endDate }),
      ...(this.completeDate && { completeDate: this.completeDate }),
      ...(this.plannedDurationDays !== undefined && { plannedDurationDays: this.plannedDurationDays }),
      ...(this.actualDurationDays !== undefined && { actualDurationDays: this.actualDurationDays }),
      ...(this.daysRemaining !== undefined && { daysRemaining: this.daysRemaining }),
      ...(this.daysElapsed !== undefined && { daysElapsed: this.daysElapsed }),
      ...(this.progressPercentage !== undefined && { progressPercentage: this.progressPercentage }),
      hasGoal: this.hasGoal,
      ...(this.goal && { goal: this.goal }),
      ...(this.originBoardId !== undefined && { originBoardId: this.originBoardId }),
    };
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      startDate: this.startDate,
      endDate: this.endDate,
      completeDate: this.completeDate,
      originBoardId: this.originBoardId,
      goal: this.goal,
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
   * Static method to create SprintModel from raw data
   */
  static from(data: JiraSprint): SprintModel {
    return new SprintModel(data);
  }

  /**
   * Static method to create multiple SprintModels from array
   */
  static fromArray(data: JiraSprint[]): SprintModel[] {
    return data.map(sprint => new SprintModel(sprint));
  }
}

/**
 * Sprint Collection Model
 * Provides utilities for working with collections of sprints
 */
export class SprintCollectionModel {
  private readonly _sprints: SprintModel[];

  constructor(sprints: SprintModel[]) {
    this._sprints = sprints;
  }

  /**
   * Get all sprints
   */
  get sprints(): SprintModel[] {
    return this._sprints;
  }

  /**
   * Get count of sprints
   */
  get count(): number {
    return this._sprints.length;
  }

  /**
   * Find sprint by ID
   */
  findById(id: string): SprintModel | undefined {
    return this._sprints.find(sprint => sprint.id === id);
  }

  /**
   * Find sprint by name
   */
  findByName(name: string): SprintModel | undefined {
    return this._sprints.find(sprint => 
      sprint.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Search sprints by name (partial match)
   */
  searchByName(searchTerm: string): SprintModel[] {
    const term = searchTerm.toLowerCase();
    return this._sprints.filter(sprint => 
      sprint.name.toLowerCase().includes(term)
    );
  }

  /**
   * Filter sprints by state
   */
  filterByState(state: SprintState): SprintCollectionModel {
    const filteredSprints = this._sprints.filter(sprint => sprint.state === state);
    return new SprintCollectionModel(filteredSprints);
  }

  /**
   * Filter active sprints
   */
  filterActive(): SprintCollectionModel {
    return this.filterByState('active');
  }

  /**
   * Filter closed sprints
   */
  filterClosed(): SprintCollectionModel {
    return this.filterByState('closed');
  }

  /**
   * Filter future sprints
   */
  filterFuture(): SprintCollectionModel {
    return this.filterByState('future');
  }

  /**
   * Filter sprints with goals
   */
  filterWithGoals(): SprintCollectionModel {
    const sprintsWithGoals = this._sprints.filter(sprint => sprint.hasGoal);
    return new SprintCollectionModel(sprintsWithGoals);
  }

  /**
   * Filter overdue sprints
   */
  filterOverdue(): SprintCollectionModel {
    const overdueSprints = this._sprints.filter(sprint => sprint.isOverdue);
    return new SprintCollectionModel(overdueSprints);
  }

  /**
   * Filter sprints by board
   */
  filterByBoard(boardId: number): SprintCollectionModel {
    const boardSprints = this._sprints.filter(sprint => 
      sprint.originBoardId === boardId
    );
    return new SprintCollectionModel(boardSprints);
  }

  /**
   * Filter sprints by date range
   */
  filterByDateRange(startDate: Date | string, endDate: Date | string): SprintCollectionModel {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const filteredSprints = this._sprints.filter(sprint => {
      if (!sprint.startDateObject || !sprint.endDateObject) {
        return false;
      }
      return sprint.startDateObject >= start && sprint.endDateObject <= end;
    });
    
    return new SprintCollectionModel(filteredSprints);
  }

  /**
   * Get current active sprint
   */
  getCurrentSprint(): SprintModel | undefined {
    return this._sprints.find(sprint => sprint.isActive);
  }

  /**
   * Get next upcoming sprint
   */
  getNextSprint(): SprintModel | undefined {
    const futureSprints = this.filterFuture().sortByStartDate();
    return futureSprints.sprints[0];
  }

  /**
   * Get last completed sprint
   */
  getLastCompletedSprint(): SprintModel | undefined {
    const closedSprints = this.filterClosed().sortByCompleteDate(false);
    return closedSprints.sprints[0];
  }

  /**
   * Group sprints by state
   */
  groupByState(): Map<SprintState, SprintModel[]> {
    const groups = new Map<SprintState, SprintModel[]>();
    
    this._sprints.forEach(sprint => {
      const state = sprint.state;
      if (!groups.has(state)) {
        groups.set(state, []);
      }
      groups.get(state)!.push(sprint);
    });
    
    return groups;
  }

  /**
   * Group sprints by board
   */
  groupByBoard(): Map<number, SprintModel[]> {
    const groups = new Map<number, SprintModel[]>();
    
    this._sprints.forEach(sprint => {
      const boardId = sprint.originBoardId ?? -1;
      if (!groups.has(boardId)) {
        groups.set(boardId, []);
      }
      groups.get(boardId)!.push(sprint);
    });
    
    return groups;
  }

  /**
   * Sort sprints by start date
   */
  sortByStartDate(ascending = true): SprintCollectionModel {
    const sorted = [...this._sprints].sort((a, b) => {
      if (!a.startDateObject && !b.startDateObject) return 0;
      if (!a.startDateObject) return ascending ? 1 : -1;
      if (!b.startDateObject) return ascending ? -1 : 1;
      
      const dateA = a.startDateObject.getTime();
      const dateB = b.startDateObject.getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new SprintCollectionModel(sorted);
  }

  /**
   * Sort sprints by end date
   */
  sortByEndDate(ascending = true): SprintCollectionModel {
    const sorted = [...this._sprints].sort((a, b) => {
      if (!a.endDateObject && !b.endDateObject) return 0;
      if (!a.endDateObject) return ascending ? 1 : -1;
      if (!b.endDateObject) return ascending ? -1 : 1;
      
      const dateA = a.endDateObject.getTime();
      const dateB = b.endDateObject.getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new SprintCollectionModel(sorted);
  }

  /**
   * Sort sprints by complete date
   */
  sortByCompleteDate(ascending = true): SprintCollectionModel {
    const sorted = [...this._sprints].sort((a, b) => {
      if (!a.completeDateObject && !b.completeDateObject) return 0;
      if (!a.completeDateObject) return ascending ? 1 : -1;
      if (!b.completeDateObject) return ascending ? -1 : 1;
      
      const dateA = a.completeDateObject.getTime();
      const dateB = b.completeDateObject.getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new SprintCollectionModel(sorted);
  }

  /**
   * Sort sprints by name
   */
  sortByName(ascending = true): SprintCollectionModel {
    const sorted = [...this._sprints].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new SprintCollectionModel(sorted);
  }

  /**
   * Get sprint summaries for display
   */
  getSummaries(): Array<ReturnType<SprintModel['getSummary']>> {
    return this._sprints.map(sprint => sprint.getSummary());
  }

  /**
   * Convert to array of plain objects
   */
  toArray(): Record<string, any>[] {
    return this._sprints.map(sprint => sprint.toObject());
  }

  /**
   * Static method to create from JiraSprint array
   */
  static from(sprints: JiraSprint[]): SprintCollectionModel {
    const models = SprintModel.fromArray(sprints);
    return new SprintCollectionModel(models);
  }
}

/**
 * Board Configuration Model Class
 * Wraps JiraBoardConfiguration with helper methods
 */
export class BoardConfigurationModel {
  private readonly _data: JiraBoardConfiguration;

  constructor(data: JiraBoardConfiguration) {
    this._data = data;
  }

  get raw(): JiraBoardConfiguration {
    return this._data;
  }

  get id(): number {
    return this._data.id;
  }

  get name(): string {
    return this._data.name;
  }

  get type(): string {
    return this._data.type;
  }

  get self(): string {
    return this._data.self;
  }

  get location(): JiraBoardConfiguration['location'] {
    return this._data.location;
  }

  get filter(): JiraBoardConfiguration['filter'] {
    return this._data.filter;
  }

  get subQuery(): JiraBoardConfiguration['subQuery'] | undefined {
    return this._data.subQuery;
  }

  get columnConfig(): JiraBoardConfiguration['columnConfig'] {
    return this._data.columnConfig;
  }

  get estimation(): JiraBoardConfiguration['estimation'] | undefined {
    return this._data.estimation;
  }

  get ranking(): JiraBoardConfiguration['ranking'] | undefined {
    return this._data.ranking;
  }

  get columns(): JiraBoardConfiguration['columnConfig']['columns'] {
    return this.columnConfig.columns;
  }

  get columnCount(): number {
    return this.columns.length;
  }

  getColumnByName(name: string): JiraBoardConfiguration['columnConfig']['columns'][0] | undefined {
    return this.columns.find(col => col.name.toLowerCase() === name.toLowerCase());
  }

  toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      location: this.location,
      filter: this.filter,
      subQuery: this.subQuery,
      columnConfig: this.columnConfig,
      estimation: this.estimation,
      ranking: this.ranking,
      self: this.self,
    };
  }

  static from(data: JiraBoardConfiguration): BoardConfigurationModel {
    return new BoardConfigurationModel(data);
  }
}

/**
 * Type definitions for agile-related operations
 */
export interface SprintCreatePayload {
  name: string;
  startDate?: IsoDateString;
  endDate?: IsoDateString;
  goal?: string;
  originBoardId: number;
}

export interface SprintUpdatePayload {
  name?: string;
  startDate?: IsoDateString;
  endDate?: IsoDateString;
  goal?: string;
  state?: SprintState;
}