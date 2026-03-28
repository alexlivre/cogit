/**
 * Git Executor Adapter
 * Implements GitExecutorPort interface
 * Adapts existing executor service to port contract
 */

import { GitExecutorPort, ExecutorResult } from '../../core/ports/index';
import { gitAdd, gitCommit, gitPush, executeCommit } from '../../services/git/executor';

export class GitExecutorAdapter implements GitExecutorPort {
  async add(repoPath: string): Promise<ExecutorResult> {
    return await gitAdd(repoPath);
  }

  async commit(repoPath: string, message: string): Promise<ExecutorResult> {
    return await gitCommit(repoPath, message);
  }

  async push(repoPath: string): Promise<ExecutorResult> {
    return await gitPush(repoPath);
  }

  async executeCommit(repoPath: string, message: string, shouldPush: boolean): Promise<ExecutorResult> {
    return await executeCommit(repoPath, message, shouldPush);
  }
}
