import { execGit } from '../../utils/executor';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { separatorLine } from '../../cli/ui/separator';
import { confirmDestructiveOperation } from '../../utils/confirmation';
import { autoPushBranch } from '../network/auto-push';

export interface BranchInfo {
  name: string;
  current: boolean;
  remote?: string;
  lastCommit?: string;
}

/**
 * Lists all branches (local and remote)
 */
export async function listBranches(repoPath: string): Promise<BranchInfo[]> {
  try {
    const { stdout } = await execGit('branch -a', { cwd: repoPath });
    
    const lines = stdout.trim().split('\n').filter(Boolean);
    
    return lines.map(line => {
      const isCurrent = line.startsWith('*');
      const cleanLine = line.replace('*', '').trim();
      const isRemote = cleanLine.startsWith('remotes/origin/');
      const name = isRemote ? cleanLine.replace('remotes/origin/', '') : cleanLine;
      
      return {
        name,
        current: isCurrent,
        remote: isRemote ? 'origin' : undefined,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Gets the current branch name
 */
export async function getCurrentBranch(repoPath: string): Promise<string> {
  try {
    const { stdout } = await execGit('rev-parse --abbrev-ref HEAD', { cwd: repoPath });
    return stdout.trim();
  } catch {
    return '';
  }
}

/**
 * Validates branch name according to Git rules
 */
function isValidBranchName(name: string): boolean {
  // Git branch name rules
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;
  const reserved = ['HEAD', 'head'];
  
  return pattern.test(name) && !reserved.includes(name.toLowerCase());
}

/**
 * Creates a new branch and switches to it
 */
export async function createBranch(repoPath: string, branchName: string, autoPush: boolean = true): Promise<{ success: boolean; error?: string; autoPushResult?: any }> {
  try {
    if (!isValidBranchName(branchName)) {
      return { success: false, error: `Invalid branch name: ${branchName}` };
    }
    
    await execGit(`checkout -b ${branchName}`, { cwd: repoPath });
    
    // Attempt auto push if enabled
    let autoPushResult = undefined;
    if (autoPush) {
      try {
        autoPushResult = await autoPushBranch(branchName, { repoPath, silent: false });
      } catch (error) {
        // Don't fail the branch creation if auto push fails
        console.log(chalk.yellow(`⚠️  Auto push failed: ${error}`));
        autoPushResult = { success: false, error: String(error) };
      }
    }
    
    return { success: true, autoPushResult };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Switches to an existing branch
 */
export async function switchBranch(repoPath: string, branchName: string, autoPush: boolean = true): Promise<{ success: boolean; error?: string; autoPushResult?: any }> {
  try {
    await execGit(`checkout ${branchName}`, { cwd: repoPath });
    
    // Attempt auto push if enabled (for existing branches that might not be on remote)
    let autoPushResult = undefined;
    if (autoPush) {
      try {
        autoPushResult = await autoPushBranch(branchName, { repoPath, silent: false });
      } catch (error) {
        // Don't fail the branch switch if auto push fails
        console.log(chalk.yellow(`⚠️  Auto push failed: ${error}`));
        autoPushResult = { success: false, error: String(error) };
      }
    }
    
    return { success: true, autoPushResult };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Deletes a branch (requires confirmation for destructive operation)
 */
export async function deleteBranch(repoPath: string, branchName: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
  const confirmed = await confirmDestructiveOperation(`Delete branch: ${branchName}`);
  if (!confirmed) {
    return { success: false, error: 'Operation cancelled' };
  }
  
  try {
    const flag = force ? '-D' : '-d';
    await execGit(`branch ${flag} ${branchName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Pushes a branch to remote
 */
export async function pushBranch(repoPath: string, branchName: string, setUpstream: boolean = true): Promise<{ success: boolean; error?: string }> {
  try {
    if (setUpstream) {
      await execGit(`push -u origin ${branchName}`, { cwd: repoPath });
    } else {
      await execGit(`push origin ${branchName}`, { cwd: repoPath });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Interactive Branch Center menu
 */
export async function branchCenter(repoPath: string): Promise<void> {
  const branches = await listBranches(repoPath);
  const currentBranch = await getCurrentBranch(repoPath);
  
  console.log(chalk.cyan.bold('\n🌿 BRANCH CENTER'));
  console.log(chalk.gray(separatorLine(40)));
  console.log(chalk.green(`Current: ${currentBranch}\n`));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Branch operations:',
      choices: [
        { name: '📋 List all branches', value: 'list' },
        { name: '➕ Create new branch', value: 'create' },
        { name: '🔄 Switch branch', value: 'switch' },
        { name: '⬆️  Push branch to remote', value: 'push' },
        { name: '🗑️  Delete branch', value: 'delete' },
        { name: '↩️  Back to menu', value: 'back' },
      ],
    },
  ]);
  
  switch (action) {
    case 'list':
      console.log(chalk.cyan('\nAll branches:'));
      branches.forEach(b => {
        const prefix = b.current ? chalk.green('* ') : '  ';
        const suffix = b.remote ? chalk.gray(' (remote)') : '';
        console.log(`${prefix}${b.name}${suffix}`);
      });
      break;
    
    case 'create': {
      const { newBranchName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newBranchName',
          message: 'New branch name:',
          validate: (name: string) => isValidBranchName(name) || 'Invalid branch name',
        },
      ]);
      const createResult = await createBranch(repoPath, newBranchName, true); // Enable auto push
      if (createResult.success) {
        console.log(chalk.green(`✓ Branch '${newBranchName}' created and switched`));
        
        // Auto push feedback
        if (createResult.autoPushResult) {
          if (createResult.autoPushResult.success) {
            console.log(chalk.green(`✓ Branch automatically pushed to remote`));
          } else if (createResult.autoPushResult.skipped) {
            console.log(chalk.yellow(`⚠️ Auto push skipped: ${createResult.autoPushResult.reason}`));
          } else {
            console.log(chalk.yellow(`⚠️ Auto push failed: ${createResult.autoPushResult.error}`));
          }
        }
      } else {
        console.log(chalk.red(`✗ ${createResult.error}`));
      }
      break;
    }
    
    case 'switch': {
      const localBranches = branches.filter(b => !b.remote && !b.current);
      if (localBranches.length === 0) {
        console.log(chalk.yellow('No other local branches to switch to'));
        break;
      }
      const { targetBranch } = await inquirer.prompt([
        {
          type: 'list',
          name: 'targetBranch',
          message: 'Switch to:',
          choices: localBranches.map(b => b.name),
        },
      ]);
      const switchResult = await switchBranch(repoPath, targetBranch, true); // Enable auto push
      if (switchResult.success) {
        console.log(chalk.green(`✓ Switched to '${targetBranch}'`));
        
        // Auto push feedback
        if (switchResult.autoPushResult) {
          if (switchResult.autoPushResult.success) {
            console.log(chalk.green(`✓ Branch automatically pushed to remote`));
          } else if (switchResult.autoPushResult.skipped) {
            console.log(chalk.yellow(`⚠️ Auto push skipped: ${switchResult.autoPushResult.reason}`));
          } else {
            console.log(chalk.yellow(`⚠️ Auto push failed: ${switchResult.autoPushResult.error}`));
          }
        }
      } else {
        console.log(chalk.red(`✗ ${switchResult.error}`));
      }
      break;
    }
    
    case 'push': {
      const { pushTarget } = await inquirer.prompt([
        {
          type: 'list',
          name: 'pushTarget',
          message: 'Push branch:',
          choices: [currentBranch, ...branches.filter(b => !b.remote && !b.current).map(b => b.name)],
        },
      ]);
      const pushResult = await pushBranch(repoPath, pushTarget);
      if (pushResult.success) {
        console.log(chalk.green(`✓ Branch '${pushTarget}' pushed to remote`));
      } else {
        console.log(chalk.red(`✗ ${pushResult.error}`));
      }
      break;
    }
    
    case 'delete': {
      const deletableBranches = branches.filter(b => !b.remote && !b.current);
      if (deletableBranches.length === 0) {
        console.log(chalk.yellow('No branches available to delete'));
        break;
      }
      const { deleteTarget } = await inquirer.prompt([
        {
          type: 'list',
          name: 'deleteTarget',
          message: 'Delete branch:',
          choices: deletableBranches.map(b => b.name),
        },
      ]);
      const deleteResult = await deleteBranch(repoPath, deleteTarget);
      if (deleteResult.success) {
        console.log(chalk.green(`✓ Branch '${deleteTarget}' deleted`));
      }
      break;
    }
    
    case 'back':
      return;
  }
}
