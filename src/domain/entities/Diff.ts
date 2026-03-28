/**
 * Diff Entity
 * Core domain entity representing git diff
 */

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
  additions: number;
  deletions: number;
  isBinary: boolean;
}

export interface DiffProps {
  content: string;
  files: FileChange[];
  totalAdditions: number;
  totalDeletions: number;
  isLarge: boolean;
}

/**
 * Diff Entity
 * Represents git diff in the domain layer
 */
export class Diff {
  private readonly props: DiffProps;

  constructor(props: DiffProps) {
    this.props = props;
  }

  get content(): string {
    return this.props.content;
  }

  get files(): FileChange[] {
    return [...this.props.files];
  }

  get totalAdditions(): number {
    return this.props.totalAdditions;
  }

  get totalDeletions(): number {
    return this.props.totalDeletions;
  }

  get isLarge(): boolean {
    return this.props.isLarge;
  }

  /**
   * Get total number of changed files
   */
  getFilesCount(): number {
    return this.props.files.length;
  }

  /**
   * Check if diff is empty
   */
  isEmpty(): boolean {
    return this.props.content.trim().length === 0 && this.props.files.length === 0;
  }

  /**
   * Check if diff has binary files
   */
  hasBinaryFiles(): boolean {
    return this.props.files.some(f => f.isBinary);
  }

  /**
   * Get files by status
   */
  getFilesByStatus(status: FileChange['status']): FileChange[] {
    return this.props.files.filter(f => f.status === status);
  }

  /**
   * Get summary of changes
   */
  getSummary(): string {
    const added = this.getFilesByStatus('added').length;
    const modified = this.getFilesByStatus('modified').length;
    const deleted = this.getFilesByStatus('deleted').length;
    const untracked = this.getFilesByStatus('untracked').length;

    const parts: string[] = [];
    if (added > 0) parts.push(`${added} added`);
    if (modified > 0) parts.push(`${modified} modified`);
    if (deleted > 0) parts.push(`${deleted} deleted`);
    if (untracked > 0) parts.push(`${untracked} untracked`);

    return parts.join(', ') || 'no changes';
  }

  /**
   * Get truncated content for display
   */
  getTruncatedContent(maxLength: number = 8000): string {
    if (this.props.content.length <= maxLength) {
      return this.props.content;
    }
    return this.props.content.slice(0, maxLength) + '\n... (truncated)';
  }

  /**
   * Calculate diff size category
   */
  getSizeCategory(): 'small' | 'medium' | 'large' {
    const totalChanges = this.props.totalAdditions + this.props.totalDeletions;
    
    if (totalChanges < 50) return 'small';
    if (totalChanges < 500) return 'medium';
    return 'large';
  }

  /**
   * Convert to plain object
   */
  toJSON(): DiffProps {
    return {
      content: this.props.content,
      files: [...this.props.files],
      totalAdditions: this.props.totalAdditions,
      totalDeletions: this.props.totalDeletions,
      isLarge: this.props.isLarge,
    };
  }
}
