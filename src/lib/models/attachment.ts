/**
 * Attachment Data Model
 *
 * Provides a clean abstraction layer over the raw Jira Attachment API types.
 * Handles attachment information, download URLs, and file management.
 */

import type { JiraAttachment, JiraUser, AttachmentDownloadResult } from '@/types/jira-api';
import type { IsoDateString } from '@/types/common';

/**
 * Attachment Model Class
 * Wraps JiraAttachment with additional helper methods and processing
 */
export class AttachmentModel {
  private readonly _data: JiraAttachment;

  constructor(data: JiraAttachment) {
    this._data = data;
  }

  /**
   * Get the raw Jira attachment data
   */
  get raw(): JiraAttachment {
    return this._data;
  }

  /**
   * Get basic attachment identification
   */
  get id(): string {
    return this._data.id;
  }

  get self(): string {
    return this._data.self;
  }

  /**
   * Get file information
   */
  get filename(): string {
    return this._data.filename;
  }

  get size(): number {
    return this._data.size;
  }

  get mimeType(): string {
    return this._data.mimeType;
  }

  get content(): string {
    return this._data.content;
  }

  get thumbnail(): string | undefined {
    return this._data.thumbnail;
  }

  /**
   * Get file extension
   */
  get extension(): string {
    const lastDotIndex = this.filename.lastIndexOf('.');
    return lastDotIndex > 0 ? this.filename.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  /**
   * Get filename without extension
   */
  get baseFilename(): string {
    const lastDotIndex = this.filename.lastIndexOf('.');
    return lastDotIndex > 0 ? this.filename.substring(0, lastDotIndex) : this.filename;
  }

  /**
   * Get human-readable file size
   */
  get humanReadableSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }

  /**
   * Get file size in different units
   */
  getSizeInKB(): number {
    return this.size / 1024;
  }

  getSizeInMB(): number {
    return this.size / (1024 * 1024);
  }

  getSizeInGB(): number {
    return this.size / (1024 * 1024 * 1024);
  }

  /**
   * Get author information
   */
  get author(): JiraUser {
    return this._data.author;
  }

  /**
   * Get creation timestamp
   */
  get created(): IsoDateString {
    return this._data.created;
  }

  /**
   * Get time since creation
   */
  getTimeSinceCreated(): number {
    return Date.now() - new Date(this.created).getTime();
  }

  /**
   * Get attachment properties
   */
  get properties(): Record<string, any> | undefined {
    return this._data.properties;
  }

  /**
   * Get property by key
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
   * Get all property keys
   */
  getPropertyKeys(): string[] {
    return this.properties ? Object.keys(this.properties) : [];
  }

  /**
   * Check if attachment has thumbnail
   */
  get hasThumbnail(): boolean {
    return this.thumbnail !== undefined;
  }

  /**
   * Get file type category
   */
  get fileTypeCategory(): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code' | 'other' {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'];
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg'];
    const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'];
    const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
    const codeTypes = ['js', 'ts', 'html', 'css', 'java', 'py', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'xml', 'json', 'yaml', 'yml'];

    const ext = this.extension;

    if (imageTypes.includes(ext)) return 'image';
    if (documentTypes.includes(ext)) return 'document';
    if (videoTypes.includes(ext)) return 'video';
    if (audioTypes.includes(ext)) return 'audio';
    if (archiveTypes.includes(ext)) return 'archive';
    if (codeTypes.includes(ext)) return 'code';

    return 'other';
  }

  /**
   * Check file type
   */
  get isImage(): boolean {
    return this.fileTypeCategory === 'image';
  }

  get isDocument(): boolean {
    return this.fileTypeCategory === 'document';
  }

  get isVideo(): boolean {
    return this.fileTypeCategory === 'video';
  }

  get isAudio(): boolean {
    return this.fileTypeCategory === 'audio';
  }

  get isArchive(): boolean {
    return this.fileTypeCategory === 'archive';
  }

  get isCode(): boolean {
    return this.fileTypeCategory === 'code';
  }

  /**
   * Check if file size exceeds threshold
   */
  isLargerThan(sizeInBytes: number): boolean {
    return this.size > sizeInBytes;
  }

  isLargerThanKB(sizeInKB: number): boolean {
    return this.getSizeInKB() > sizeInKB;
  }

  isLargerThanMB(sizeInMB: number): boolean {
    return this.getSizeInMB() > sizeInMB;
  }

  /**
   * Get download URL
   */
  get downloadUrl(): string {
    return this.content;
  }

  /**
   * Get thumbnail URL if available
   */
  get thumbnailUrl(): string | undefined {
    return this.thumbnail;
  }

  /**
   * Check if attachment was uploaded by a specific user
   */
  isUploadedBy(userKey: string): boolean {
    return this.author.key === userKey;
  }

  /**
   * Get attachment summary for display
   */
  getSummary(): {
    id: string;
    filename: string;
    extension: string;
    size: number;
    humanReadableSize: string;
    mimeType: string;
    fileTypeCategory: string;
    author: string;
    authorDisplayName: string;
    created: IsoDateString;
    hasThumbnail: boolean;
    downloadUrl: string;
  } {
    return {
      id: this.id,
      filename: this.filename,
      extension: this.extension,
      size: this.size,
      humanReadableSize: this.humanReadableSize,
      mimeType: this.mimeType,
      fileTypeCategory: this.fileTypeCategory,
      author: this.author.key,
      authorDisplayName: this.author.displayName,
      created: this.created,
      hasThumbnail: this.hasThumbnail,
      downloadUrl: this.downloadUrl,
    };
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      filename: this.filename,
      size: this.size,
      mimeType: this.mimeType,
      content: this.content,
      thumbnail: this.thumbnail,
      author: this.author,
      created: this.created,
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
   * Static method to create AttachmentModel from raw data
   */
  static from(data: JiraAttachment): AttachmentModel {
    return new AttachmentModel(data);
  }

  /**
   * Static method to create multiple AttachmentModels from array
   */
  static fromArray(data: JiraAttachment[]): AttachmentModel[] {
    return data.map(attachment => new AttachmentModel(attachment));
  }
}

/**
 * Attachment Collection Model
 * Provides utilities for working with collections of attachments
 */
export class AttachmentCollectionModel {
  private readonly _attachments: AttachmentModel[];

  constructor(attachments: AttachmentModel[]) {
    this._attachments = attachments;
  }

  /**
   * Get all attachments
   */
  get attachments(): AttachmentModel[] {
    return this._attachments;
  }

  /**
   * Get count of attachments
   */
  get count(): number {
    return this._attachments.length;
  }

  /**
   * Get total size of all attachments
   */
  get totalSize(): number {
    return this._attachments.reduce((total, attachment) => total + attachment.size, 0);
  }

  /**
   * Get total size in human-readable format
   */
  get totalSizeHumanReadable(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.totalSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }

  /**
   * Find attachment by ID
   */
  findById(id: string): AttachmentModel | undefined {
    return this._attachments.find(attachment => attachment.id === id);
  }

  /**
   * Find attachment by filename
   */
  findByFilename(filename: string): AttachmentModel | undefined {
    return this._attachments.find(attachment => 
      attachment.filename.toLowerCase() === filename.toLowerCase()
    );
  }

  /**
   * Search attachments by filename (partial match)
   */
  searchByFilename(searchTerm: string): AttachmentModel[] {
    const term = searchTerm.toLowerCase();
    return this._attachments.filter(attachment => 
      attachment.filename.toLowerCase().includes(term)
    );
  }

  /**
   * Filter attachments by file type category
   */
  filterByType(category: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code' | 'other'): AttachmentCollectionModel {
    const filteredAttachments = this._attachments.filter(attachment => 
      attachment.fileTypeCategory === category
    );
    return new AttachmentCollectionModel(filteredAttachments);
  }

  /**
   * Filter attachments by extension
   */
  filterByExtension(extension: string): AttachmentCollectionModel {
    const filteredAttachments = this._attachments.filter(attachment => 
      attachment.extension.toLowerCase() === extension.toLowerCase()
    );
    return new AttachmentCollectionModel(filteredAttachments);
  }

  /**
   * Filter attachments by mime type
   */
  filterByMimeType(mimeType: string): AttachmentCollectionModel {
    const filteredAttachments = this._attachments.filter(attachment => 
      attachment.mimeType.toLowerCase() === mimeType.toLowerCase()
    );
    return new AttachmentCollectionModel(filteredAttachments);
  }

  /**
   * Filter attachments by author
   */
  filterByAuthor(userKey: string): AttachmentCollectionModel {
    const authorAttachments = this._attachments.filter(attachment => 
      attachment.isUploadedBy(userKey)
    );
    return new AttachmentCollectionModel(authorAttachments);
  }

  /**
   * Filter attachments by size
   */
  filterBySize(minSize?: number, maxSize?: number): AttachmentCollectionModel {
    const filteredAttachments = this._attachments.filter(attachment => {
      if (minSize !== undefined && attachment.size < minSize) {
        return false;
      }
      if (maxSize !== undefined && attachment.size > maxSize) {
        return false;
      }
      return true;
    });
    return new AttachmentCollectionModel(filteredAttachments);
  }

  /**
   * Filter attachments with thumbnails
   */
  filterWithThumbnails(): AttachmentCollectionModel {
    const thumbnailAttachments = this._attachments.filter(attachment => 
      attachment.hasThumbnail
    );
    return new AttachmentCollectionModel(thumbnailAttachments);
  }

  /**
   * Filter attachments created after a specific date
   */
  filterCreatedAfter(date: Date | string): AttachmentCollectionModel {
    const filterDate = typeof date === 'string' ? new Date(date) : date;
    const filteredAttachments = this._attachments.filter(attachment => 
      new Date(attachment.created) > filterDate
    );
    return new AttachmentCollectionModel(filteredAttachments);
  }

  /**
   * Get images only
   */
  getImages(): AttachmentCollectionModel {
    return this.filterByType('image');
  }

  /**
   * Get documents only
   */
  getDocuments(): AttachmentCollectionModel {
    return this.filterByType('document');
  }

  /**
   * Get all file extensions
   */
  getAllExtensions(): string[] {
    const extensions = new Set<string>();
    this._attachments.forEach(attachment => {
      if (attachment.extension) {
        extensions.add(attachment.extension);
      }
    });
    return Array.from(extensions).sort();
  }

  /**
   * Get all mime types
   */
  getAllMimeTypes(): string[] {
    const mimeTypes = new Set<string>();
    this._attachments.forEach(attachment => {
      mimeTypes.add(attachment.mimeType);
    });
    return Array.from(mimeTypes).sort();
  }

  /**
   * Group attachments by file type category
   */
  groupByType(): Map<string, AttachmentModel[]> {
    const groups = new Map<string, AttachmentModel[]>();
    
    this._attachments.forEach(attachment => {
      const category = attachment.fileTypeCategory;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(attachment);
    });
    
    return groups;
  }

  /**
   * Group attachments by author
   */
  groupByAuthor(): Map<string, AttachmentModel[]> {
    const groups = new Map<string, AttachmentModel[]>();
    
    this._attachments.forEach(attachment => {
      const authorKey = attachment.author.key;
      if (!groups.has(authorKey)) {
        groups.set(authorKey, []);
      }
      groups.get(authorKey)!.push(attachment);
    });
    
    return groups;
  }

  /**
   * Sort attachments by creation date
   */
  sortByCreated(ascending = true): AttachmentCollectionModel {
    const sorted = [...this._attachments].sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return new AttachmentCollectionModel(sorted);
  }

  /**
   * Sort attachments by filename
   */
  sortByFilename(ascending = true): AttachmentCollectionModel {
    const sorted = [...this._attachments].sort((a, b) => {
      const nameA = a.filename.toLowerCase();
      const nameB = b.filename.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new AttachmentCollectionModel(sorted);
  }

  /**
   * Sort attachments by size
   */
  sortBySize(ascending = true): AttachmentCollectionModel {
    const sorted = [...this._attachments].sort((a, b) => {
      return ascending ? a.size - b.size : b.size - a.size;
    });
    return new AttachmentCollectionModel(sorted);
  }

  /**
   * Sort attachments by author
   */
  sortByAuthor(ascending = true): AttachmentCollectionModel {
    const sorted = [...this._attachments].sort((a, b) => {
      const nameA = a.author.displayName.toLowerCase();
      const nameB = b.author.displayName.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return new AttachmentCollectionModel(sorted);
  }

  /**
   * Get attachments with pagination
   */
  paginate(startAt = 0, maxResults = 20): {
    attachments: AttachmentModel[];
    startAt: number;
    maxResults: number;
    total: number;
    hasMore: boolean;
  } {
    const attachments = this._attachments.slice(startAt, startAt + maxResults);
    return {
      attachments,
      startAt,
      maxResults,
      total: this.count,
      hasMore: startAt + maxResults < this.count,
    };
  }

  /**
   * Get attachment summaries for display
   */
  getSummaries(): Array<ReturnType<AttachmentModel['getSummary']>> {
    return this._attachments.map(attachment => attachment.getSummary());
  }

  /**
   * Convert to array of plain objects
   */
  toArray(): Record<string, any>[] {
    return this._attachments.map(attachment => attachment.toObject());
  }

  /**
   * Create download result model
   */
  createDownloadResult(issueKey: string, downloadPath: string): AttachmentDownloadResultModel {
    const attachmentResults = this._attachments.map(attachment => ({
      id: attachment.id,
      filename: attachment.filename,
      size: attachment.size,
      downloadPath: `${downloadPath}/${attachment.filename}`,
      success: true,
    }));

    const result: AttachmentDownloadResult = {
      issueKey,
      attachments: attachmentResults,
      totalSize: this.totalSize,
      downloadPath,
      success: true,
    };

    return new AttachmentDownloadResultModel(result);
  }

  /**
   * Static method to create from JiraAttachment array
   */
  static from(attachments: JiraAttachment[]): AttachmentCollectionModel {
    const models = AttachmentModel.fromArray(attachments);
    return new AttachmentCollectionModel(models);
  }
}

/**
 * Attachment Download Result Model
 * Wraps attachment download operation results
 */
export class AttachmentDownloadResultModel {
  private readonly _data: AttachmentDownloadResult;

  constructor(data: AttachmentDownloadResult) {
    this._data = data;
  }

  get raw(): AttachmentDownloadResult {
    return this._data;
  }

  get issueKey(): string {
    return this._data.issueKey;
  }

  get attachments(): AttachmentDownloadResult['attachments'] {
    return this._data.attachments;
  }

  get totalSize(): number {
    return this._data.totalSize;
  }

  get downloadPath(): string {
    return this._data.downloadPath;
  }

  get success(): boolean {
    return this._data.success;
  }

  get errors(): string[] {
    return this._data.errors ?? [];
  }

  get successCount(): number {
    return this.attachments.filter(attachment => attachment.success).length;
  }

  get failureCount(): number {
    return this.attachments.filter(attachment => !attachment.success).length;
  }

  get hasErrors(): boolean {
    return this.errors.length > 0 || this.failureCount > 0;
  }

  get successfulAttachments(): AttachmentDownloadResult['attachments'] {
    return this.attachments.filter(attachment => attachment.success);
  }

  get failedAttachments(): AttachmentDownloadResult['attachments'] {
    return this.attachments.filter(attachment => !attachment.success);
  }

  getSummary(): {
    issueKey: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    totalSize: number;
    downloadPath: string;
    success: boolean;
  } {
    return {
      issueKey: this.issueKey,
      totalCount: this.attachments.length,
      successCount: this.successCount,
      failureCount: this.failureCount,
      totalSize: this.totalSize,
      downloadPath: this.downloadPath,
      success: this.success,
    };
  }

  toObject(): Record<string, any> {
    return {
      issueKey: this.issueKey,
      attachments: this.attachments,
      totalSize: this.totalSize,
      downloadPath: this.downloadPath,
      success: this.success,
      errors: this.errors,
      summary: this.getSummary(),
    };
  }

  static from(data: AttachmentDownloadResult): AttachmentDownloadResultModel {
    return new AttachmentDownloadResultModel(data);
  }
}

/**
 * Type definitions for attachment-related operations
 */
export interface AttachmentUploadOptions {
  filename: string;
  content: Buffer | string;
  mimeType?: string;
}

export interface AttachmentDownloadOptions {
  targetDirectory: string;
  createSubdirectory?: boolean;
  overwriteExisting?: boolean;
  filenameTemplate?: string;
}