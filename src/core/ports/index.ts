/**
 * Ports - Interfaces for Clean Architecture
 * Defines contracts that infrastructure must implement
 * Dependencies point INWARD (toward domain/application)
 */

// ============================================
// GIT SCANNER PORT
// ============================================

export interface ScanResult {
  isRepo: boolean;
  hasChanges: boolean;
  stagedFiles: string[];
  unstagedFiles: string[];
  diff: string;
  diffData: import('../vault').DiffData;
}

export interface GitScannerPort {
  /**
   * Scan repository for changes
   * @param repoPath Repository path
   * @returns Scan result with files and diff
   */
  scan(repoPath: string): Promise<ScanResult>;
}

// ============================================
// AI PROVIDER PORT
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BrainInput {
  diff: string;
  diffData?: import('../vault').DiffData;
  hint?: string;
  language: string;
  debug?: boolean;
}

export interface BrainOutput {
  success: boolean;
  message?: string;
  error?: string;
  provider?: string;
  thinking?: string;
}

export interface AIProviderPort {
  /**
   * Generate commit message from diff
   * @param input Brain input with diff and options
   * @returns Generated commit message
   */
  generateCommitMessage(input: BrainInput): Promise<BrainOutput>;

  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Check if provider is available
   */
  isAvailable(): boolean;
}

// ============================================
// GIT EXECUTOR PORT
// ============================================

export interface ExecutorResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface GitExecutorPort {
  /**
   * Execute git add
   * @param repoPath Repository path
   */
  add(repoPath: string): Promise<ExecutorResult>;

  /**
   * Execute git commit
   * @param repoPath Repository path
   * @param message Commit message
   */
  commit(repoPath: string, message: string): Promise<ExecutorResult>;

  /**
   * Execute git push
   * @param repoPath Repository path
   */
  push(repoPath: string): Promise<ExecutorResult>;

  /**
   * Execute full commit workflow (add + commit + optional push)
   * @param repoPath Repository path
   * @param message Commit message
   * @param shouldPush Whether to push after commit
   */
  executeCommit(repoPath: string, message: string, shouldPush: boolean): Promise<ExecutorResult>;
}

// ============================================
// SECURITY PORT
// ============================================

export interface SanitizerResult {
  isClean: boolean;
  blockedFiles: string[];
  message?: string;
}

export interface SecurityPort {
  /**
   * Sanitize files against blocklist
   * @param files Files to check
   * @returns Sanitization result
   */
  sanitize(files: string[]): SanitizerResult;

  /**
   * Redact secrets from diff
   * @param diff Diff content
   * @returns Redacted diff
   */
  redact(diff: string): string;
}

// ============================================
// UI PORT
// ============================================

export interface UIPort {
  /**
   * Display commit message
   * @param message Message to display
   */
  renderCommitMessage(message: string): void;

  /**
   * Display dry run commands
   * @param commands Commands that would be executed
   */
  renderDryRun(commands: string[]): void;

  /**
   * Display success message
   * @param message Success message
   */
  renderSuccess(message: string): void;

  /**
   * Display error message
   * @param message Error message
   */
  renderError(message: string): void;

  /**
   * Display warning message
   * @param message Warning message
   */
  renderWarning(message: string): void;

  /**
   * Prompt for commit message review
   * @param message Current message
   * @returns User action
   */
  promptCommitReview(message: string): Promise<'execute' | 'regenerate' | 'edit' | 'cancel'>;

  /**
   * Prompt for commit message edit
   * @param message Current message
   * @returns Edited message
   */
  promptCommitEdit(message: string): Promise<string>;

  /**
   * Start loading spinner
   * @param message Loading message
   */
  startSpinner(message: string): void;

  /**
   * Succeed spinner
   * @param message Success message
   */
  succeedSpinner(message: string): void;

  /**
   * Fail spinner
   * @param message Failure message
   */
  failSpinner(message: string): void;
}

// ============================================
// BRANCH PORT
// ============================================

export interface BranchInfo {
  name: string;
  current: boolean;
  remote: boolean;
}

export interface BranchPort {
  /**
   * List all branches
   * @param repoPath Repository path
   * @returns List of branches
   */
  list(repoPath: string): Promise<BranchInfo[]>;

  /**
   * Create new branch
   * @param repoPath Repository path
   * @param name Branch name
   * @returns Operation result
   */
  create(repoPath: string, name: string): Promise<ExecutorResult>;

  /**
   * Switch to branch
   * @param repoPath Repository path
   * @param name Branch name
   * @returns Operation result
   */
  switch(repoPath: string, name: string): Promise<ExecutorResult>;

  /**
   * Delete branch
   * @param repoPath Repository path
   * @param name Branch name
   * @returns Operation result
   */
  delete(repoPath: string, name: string): Promise<ExecutorResult>;
}

// ============================================
// HEALER PORT
// ============================================

export interface HealerInput {
  repoPath: string;
  failedCommand: string;
  errorOutput: string;
  maxRetries: number;
}

export interface HealerAttempt {
  attempt: number;
  commands: string[];
  success: boolean;
  error?: string;
}

export interface HealerResult {
  success: boolean;
  attempts: HealerAttempt[];
}

export interface HealerPort {
  /**
   * Heal git error
   * @param input Healer input
   * @returns Healing result with attempts
   */
  heal(input: HealerInput): Promise<HealerResult>;
}

// ============================================
// STEALTH PORT
// ============================================

export interface StealthResult {
  hiddenFiles: string[];
  tempPath: string;
  success: boolean;
  error?: string;
}

export interface StealthRestoreResult {
  restoredFiles: string[];
  conflicts: string[];
  success: boolean;
  error?: string;
}

export interface StealthPort {
  /**
   * Check if private config exists
   * @param repoPath Repository path
   */
  hasConfig(repoPath: string): boolean;

  /**
   * Stash private files
   * @param repoPath Repository path
   * @returns Stash result
   */
  stash(repoPath: string): Promise<StealthResult>;

  /**
   * Restore private files
   * @param repoPath Repository path
   * @returns Restore result
   */
  restore(repoPath: string): Promise<StealthRestoreResult>;
}

// ============================================
// IGNORE PORT
// ============================================

export interface IgnorePort {
  /**
   * Suggest .gitignore patterns
   * @param repoPath Repository path
   */
  suggest(repoPath: string): Promise<void>;

  /**
   * Add whitelist entry
   * @param repoPath Repository path
   * @param pattern Pattern to whitelist
   */
  addWhitelist(repoPath: string, pattern: string): void;

  /**
   * Remove whitelist entry
   * @param repoPath Repository path
   * @param pattern Pattern to remove
   */
  removeWhitelist(repoPath: string, pattern: string): void;
}
