/**
 * Custom error types for Cogit CLI
 * Provides structured error handling with exit codes
 */

export type ErrorCode = 
  | 'CONFIG_INVALID'
  | 'GIT_NOT_REPO'
  | 'GIT_NO_CHANGES'
  | 'GIT_BRANCH_FAILED'
  | 'GIT_PUSH_FAILED'
  | 'GIT_COMMIT_FAILED'
  | 'AI_GENERATION_FAILED'
  | 'SECURITY_BLOCKED'
  | 'STEALTH_FAILED'
  | 'INTERNAL_ERROR';

export class CogitError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly exitCode: number = 1,
    public readonly details?: string[]
  ) {
    super(message);
    this.name = 'CogitError';
  }

  static isCogitError(error: unknown): error is CogitError {
    return error instanceof CogitError;
  }
}

export class ConfigError extends CogitError {
  constructor(message: string, details?: string[]) {
    super(message, 'CONFIG_INVALID', 1, details);
    this.name = 'ConfigError';
  }
}

export class GitError extends CogitError {
  constructor(
    message: string,
    code: ErrorCode,
    details?: string[]
  ) {
    super(message, code, 1, details);
    this.name = 'GitError';
  }

  static notRepo(): GitError {
    return new GitError('Not a git repository', 'GIT_NOT_REPO');
  }

  static noChanges(): GitError {
    return new GitError('No changes to commit', 'GIT_NO_CHANGES', []);
  }

  static branchFailed(operation: string, branchName?: string, error?: string): GitError {
    return new GitError(
      `Branch operation failed: ${operation}${branchName ? ` (${branchName})` : ''}`,
      'GIT_BRANCH_FAILED',
      error ? [error] : undefined
    );
  }

  static pushFailed(error?: string): GitError {
    return new GitError(
      'Push operation failed',
      'GIT_PUSH_FAILED',
      error ? [error] : undefined
    );
  }

  static commitFailed(error?: string): GitError {
    return new GitError(
      'Commit operation failed',
      'GIT_COMMIT_FAILED',
      error ? [error] : undefined
    );
  }
}

export class AIError extends CogitError {
  constructor(message: string, details?: string[]) {
    super(message, 'AI_GENERATION_FAILED', 1, details);
    this.name = 'AIError';
  }
}

export class SecurityError extends CogitError {
  constructor(blockedFiles: string[]) {
    super(
      `Security alert: Blocked files detected`,
      'SECURITY_BLOCKED',
      1,
      blockedFiles
    );
    this.name = 'SecurityError';
  }
}

export class StealthError extends CogitError {
  constructor(message: string, details?: string[]) {
    super(message, 'STEALTH_FAILED', 1, details);
    this.name = 'StealthError';
  }
}

/**
 * Format error for display
 */
export function formatError(error: CogitError): string {
  let output = `Error: ${error.message}`;
  
  if (error.details && error.details.length > 0) {
    output += '\n' + error.details.map(d => `  - ${d}`).join('\n');
  }
  
  return output;
}

/**
 * Handle error and exit process
 * Should be called from entry point only
 */
export function handleFatalError(error: unknown): never {
  if (CogitError.isCogitError(error)) {
    console.error(formatError(error));
    process.exit(error.exitCode);
  }
  
  // Unknown error
  console.error('Fatal error:', error);
  process.exit(1);
}
