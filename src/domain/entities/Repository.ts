/**
 * Repository Entity
 * Core domain entity representing a git repository
 */

export interface RepositoryProps {
  path: string;
  isGitRepo: boolean;
  currentBranch: string;
  remoteUrl?: string;
  hasUncommittedChanges: boolean;
}

/**
 * Repository Entity
 * Represents a git repository in the domain layer
 */
export class Repository {
  private readonly props: RepositoryProps;

  constructor(props: RepositoryProps) {
    this.validatePath(props.path);
    this.props = props;
  }

  get path(): string {
    return this.props.path;
  }

  get isGitRepo(): boolean {
    return this.props.isGitRepo;
  }

  get currentBranch(): string {
    return this.props.currentBranch;
  }

  get remoteUrl(): string | undefined {
    return this.props.remoteUrl;
  }

  get hasUncommittedChanges(): boolean {
    return this.props.hasUncommittedChanges;
  }

  /**
   * Check if repository is valid for operations
   */
  isValid(): boolean {
    return this.props.isGitRepo;
  }

  /**
   * Check if repository has remote configured
   */
  hasRemote(): boolean {
    return !!this.props.remoteUrl;
  }

  /**
   * Get repository name from path
   */
  getName(): string {
    const parts = this.props.path.split(/[/\\]/);
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Validate repository path
   */
  private validatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('Repository path cannot be empty');
    }
  }

  /**
   * Create repository with updated branch
   */
  withBranch(branch: string): Repository {
    return new Repository({
      ...this.props,
      currentBranch: branch,
    });
  }

  /**
   * Create repository with updated changes status
   */
  withChangesStatus(hasChanges: boolean): Repository {
    return new Repository({
      ...this.props,
      hasUncommittedChanges: hasChanges,
    });
  }

  /**
   * Convert to plain object
   */
  toJSON(): RepositoryProps {
    return { ...this.props };
  }
}
