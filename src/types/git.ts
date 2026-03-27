/**
 * Git Types for Cogit CLI
 * Provides TypeScript interfaces for Git operations
 */

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicts: string[];
}

export interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface RemoteInfo {
  name: string;
  url: string;
  fetchUrl?: string;
  pushUrl?: string;
}

export interface RepositoryInfo {
  path: string;
  isGitRepo: boolean;
  currentBranch: string;
  remotes: RemoteInfo[];
  hasUncommittedChanges: boolean;
  lastCommit?: CommitInfo;
}

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface FileDiff {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  insertions: number;
  deletions: number;
  diff: string;
}
