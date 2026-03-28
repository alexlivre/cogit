/**
 * Branch Handler (Refactored with Dependency Inversion)
 * Uses GitExecutorPort interface
 * Single Responsibility: Handle branch operations
 */

import chalk from 'chalk';
import { GitExecutorPort, BranchPort, BranchInfo } from '../../../core/ports/index';
import { GitError } from '../../../core/errors';

export interface BranchHandlerResult {
  switched: boolean;
  created: boolean;
  branchName: string;
}

/**
 * Branch Handler with Dependency Injection
 * Follows Dependency Inversion Principle
 */
export class BranchHandler {
  constructor(
    private readonly gitExecutor: GitExecutorPort,
    private readonly branchService: BranchPort
  ) {}

  /**
   * Handle branch switching/creation
   * @param repoPath Repository path
   * @param branchName Target branch name
   * @returns Branch handler result
   */
  async handleBranchSwitch(
    repoPath: string,
    branchName: string
  ): Promise<BranchHandlerResult> {
    const branches = await this.branchService.list(repoPath);
    const existingBranch = branches.find(b => b.name === branchName);

    if (existingBranch) {
      // Switch to existing branch
      const result = await this.branchService.switch(repoPath, branchName);
      
      if (!result.success) {
        throw GitError.branchFailed('switch', branchName, result.error);
      }

      console.log(chalk.green(`✓ Switched to branch: ${branchName}`));
      return { switched: true, created: false, branchName };
    }

    // Create new branch
    const result = await this.branchService.create(repoPath, branchName);
    
    if (!result.success) {
      throw GitError.branchFailed('create', branchName, result.error);
    }

    console.log(chalk.green(`✓ Created and switched to branch: ${branchName}`));
    return { switched: true, created: true, branchName };
  }
}

// Factory function for default implementation
export function createBranchHandler(): BranchHandler {
  const { GitExecutorAdapter } = require('../../../infrastructure/adapters/git-executor.adapter');
  const { BranchAdapter } = require('../../../infrastructure/adapters/branch.adapter');
  
  return new BranchHandler(
    new GitExecutorAdapter(),
    new BranchAdapter()
  );
}
