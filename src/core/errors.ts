/**
 * Custom error types for Cogit CLI
 * Provides structured error handling with exit codes
 */

export type ErrorCode = 
  | 'CONFIG_INVALID'
  | 'CONFIG_NO_API_KEY'
  | 'GIT_NOT_REPO'
  | 'GIT_NO_CHANGES'
  | 'GIT_BRANCH_FAILED'
  | 'GIT_PUSH_FAILED'
  | 'GIT_COMMIT_FAILED'
  | 'GIT_SUBMODULE_EMPTY'
  | 'GIT_CONFLICT'
  | 'AI_GENERATION_FAILED'
  | 'AI_NO_PROVIDER'
  | 'AI_CONNECTION_FAILED'
  | 'AI_ALL_FAILED'
  | 'NETWORK_OFFLINE'
  | 'NETWORK_GITHUB_UNREACHABLE'
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

  static submoduleEmpty(directory?: string): GitError {
    return new GitError(
      `Submodule or nested repository without commits`,
      'GIT_SUBMODULE_EMPTY',
      directory ? [directory] : undefined
    );
  }

  static conflict(file?: string): GitError {
    return new GitError(
      'Merge conflict detected',
      'GIT_CONFLICT',
      file ? [file] : undefined
    );
  }
}

export class AIError extends CogitError {
  constructor(message: string, code: ErrorCode = 'AI_GENERATION_FAILED', details?: string[]) {
    super(message, code, 1, details);
    this.name = 'AIError';
  }

  static noProvider(): AIError {
    return new AIError(
      'No AI providers available',
      'AI_NO_PROVIDER',
      ['Check your API keys in .env']
    );
  }

  static connectionFailed(provider?: string): AIError {
    return new AIError(
      `Failed to connect to AI provider${provider ? ` (${provider})` : ''}`,
      'AI_CONNECTION_FAILED',
      provider ? [provider] : undefined
    );
  }

  static allFailed(): AIError {
    return new AIError(
      'All AI providers failed',
      'AI_ALL_FAILED',
      ['Check your internet connection and API keys']
    );
  }
}

export class NetworkError extends CogitError {
  constructor(message: string, code: ErrorCode, details?: string[]) {
    super(message, code, 1, details);
    this.name = 'NetworkError';
  }

  static offline(): NetworkError {
    return new NetworkError(
      'No internet connection',
      'NETWORK_OFFLINE'
    );
  }

  static githubUnreachable(): NetworkError {
    return new NetworkError(
      'GitHub is unreachable',
      'NETWORK_GITHUB_UNREACHABLE'
    );
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
  // Import dynamically to avoid circular dependency
  const { classifyError, presentError } = require('./error-handler');
  
  if (CogitError.isCogitError(error)) {
    // Use new error presenter for CogitErrors
    const classified = classifyError(error.message);
    presentError(classified);
    process.exit(error.exitCode);
  }
  
  if (error instanceof Error) {
    // Use new error presenter for standard errors
    const classified = classifyError(error);
    presentError(classified);
    process.exit(1);
  }
  
  // Unknown error type
  console.error('Fatal error:', error);
  process.exit(1);
}
