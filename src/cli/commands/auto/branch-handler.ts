/**
 * Branch Handler - Manages branch operations for auto command
 * Single Responsibility: Handle branch creation and switching
 */

import chalk from 'chalk';
import { listBranches, createBranch, switchBranch } from '../../../services/git/branch';
import { GitError } from '../../../core/errors';

export interface BranchHandlerResult {
  success: boolean;
  branchName: string;
  isNew: boolean;
}

/**
 * Handle branch creation or switching
 * @param repoPath Repository path
 * @param branchName Target branch name
 * @throws GitError if operation fails
 */
export async function handleBranchSwitch(
  repoPath: string,
  branchName: string
): Promise<BranchHandlerResult> {
  const branches = await listBranches(repoPath);
  const existingBranch = branches.find(b => b.name === branchName && !b.remote);

  if (existingBranch) {
    console.log(chalk.cyan(`Switching to existing branch: ${branchName}`));
    const switchResult = await switchBranch(repoPath, branchName);
    
    if (!switchResult.success) {
      throw GitError.branchFailed(`switch to ${branchName}`, switchResult.error);
    }
    
    return { success: true, branchName, isNew: false };
  }

  console.log(chalk.cyan(`Creating new branch: ${branchName}`));
  const createResult = await createBranch(repoPath, branchName);
  
  if (!createResult.success) {
    throw GitError.branchFailed(`create ${branchName}`, createResult.error);
  }
  
  return { success: true, branchName, isNew: true };
}
