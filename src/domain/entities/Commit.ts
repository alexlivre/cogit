/**
 * Commit Entity
 * Core domain entity representing a git commit
 * No dependencies on external frameworks
 */

export interface CommitAuthor {
  name: string;
  email: string;
}

export interface CommitProps {
  message: string;
  author?: CommitAuthor;
  timestamp?: Date;
  files: string[];
}

/**
 * Commit Entity
 * Represents a git commit in the domain layer
 */
export class Commit {
  private readonly props: CommitProps;

  constructor(props: CommitProps) {
    this.validateMessage(props.message);
    this.props = {
      ...props,
      timestamp: props.timestamp || new Date(),
    };
  }

  get message(): string {
    return this.props.message;
  }

  get author(): CommitAuthor | undefined {
    return this.props.author;
  }

  get timestamp(): Date {
    return this.props.timestamp!;
  }

  get files(): string[] {
    return [...this.props.files];
  }

  /**
   * Check if commit has valid conventional commit format
   */
  isConventional(): boolean {
    const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+/;
    return conventionalPattern.test(this.props.message);
  }

  /**
   * Get commit type from message
   */
  getType(): string | null {
    const match = this.props.message.match(/^(\w+)(\(.+\))?:/);
    return match ? match[1] : null;
  }

  /**
   * Get commit scope from message
   */
  getScope(): string | null {
    const match = this.props.message.match(/^\w+\((.+)\):/);
    return match ? match[1] : null;
  }

  /**
   * Get commit description (message without type/scope)
   */
  getDescription(): string {
    const parts = this.props.message.split(': ');
    return parts.length > 1 ? parts.slice(1).join(': ') : this.props.message;
  }

  /**
   * Validate commit message
   */
  private validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error('Commit message cannot be empty');
    }

    if (message.length > 5000) {
      throw new Error('Commit message exceeds maximum length of 5000 characters');
    }
  }

  /**
   * Create a new commit with updated message
   */
  withMessage(newMessage: string): Commit {
    return new Commit({
      ...this.props,
      message: newMessage,
    });
  }

  /**
   * Convert to plain object
   */
  toJSON(): CommitProps {
    return {
      message: this.props.message,
      author: this.props.author,
      timestamp: this.props.timestamp,
      files: this.props.files,
    };
  }
}
