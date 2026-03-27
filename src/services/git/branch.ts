import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { confirmDestructiveOperation } from '../../utils/confirmation';

const execAsync = promisify(exec);

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
    const { stdout } = await execAsync('git branch -a', { cwd: repoPath });
    
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
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
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
export async function createBranch(repoPath: string, branchName: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidBranchName(branchName)) {
      return { success: false, error: `Invalid branch name: ${branchName}` };
    }
    
    await execAsync(`git checkout -b ${branchName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Switches to an existing branch
 */
export async function switchBranch(repoPath: string, branchName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execAsync(`git checkout ${branchName}`, { cwd: repoPath });
    return { success: true };
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
    await execAsync(`git branch ${flag} ${branchName}`, { cwd: repoPath });
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
      await execAsync(`git push -u origin ${branchName}`, { cwd: repoPath });
    } else {
      await execAsync(`git push origin ${branchName}`, { cwd: repoPath });
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
  console.log(chalk.gray('─'.repeat(40)));
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
      const createResult = await createBranch(repoPath, newBranchName);
      if (createResult.success) {
        console.log(chalk.green(`✓ Branch '${newBranchName}' created and switched`));
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
      const switchResult = await switchBranch(repoPath, targetBranch);
      if (switchResult.success) {
        console.log(chalk.green(`✓ Switched to '${targetBranch}'`));
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
