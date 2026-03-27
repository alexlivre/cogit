import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { confirmDestructiveOperation } from '../../utils/confirmation';

const execAsync = promisify(exec);

export interface TagInfo {
  name: string;
  commit: string;
  message?: string;
  date?: string;
}

/**
 * Validates tag name according to Git rules
 */
function isValidTagName(name: string): boolean {
  // Git tag name rules
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
  return pattern.test(name);
}

/**
 * Lists all tags with commit, message and date info
 */
export async function listTags(repoPath: string): Promise<TagInfo[]> {
  try {
    // Get local tags
    const { stdout: localTags } = await execAsync('git tag -l', { cwd: repoPath });
    const tagNames = localTags.trim().split('\n').filter(Boolean);
    
    const tags: TagInfo[] = [];
    
    for (const name of tagNames) {
      try {
        const { stdout: commit } = await execAsync(`git rev-list -n 1 ${name}`, { cwd: repoPath });
        const { stdout: message } = await execAsync(`git tag -l -n1 ${name}`, { cwd: repoPath });
        const { stdout: date } = await execAsync(`git log -1 --format=%ci ${name}`, { cwd: repoPath });
        
        tags.push({
          name,
          commit: commit.trim().slice(0, 7),
          message: message.replace(name, '').trim(),
          date: date.trim(),
        });
      } catch {
        tags.push({ name, commit: 'unknown' });
      }
    }
    
    return tags.sort((a, b) => (a.date && b.date ? b.date.localeCompare(a.date) : 0));
  } catch {
    return [];
  }
}

/**
 * Creates a new tag (annotated or lightweight)
 */
export async function createTag(
  repoPath: string, 
  tagName: string, 
  message?: string,
  annotated: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidTagName(tagName)) {
      return { success: false, error: `Invalid tag name: ${tagName}` };
    }
    
    if (annotated && message) {
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`git tag -a ${tagName} -m "${escapedMessage}"`, { cwd: repoPath });
    } else {
      await execAsync(`git tag ${tagName}`, { cwd: repoPath });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Deletes a tag (requires confirmation for destructive operation)
 */
export async function deleteTag(
  repoPath: string, 
  tagName: string, 
  remote: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const confirmed = await confirmDestructiveOperation(
    remote ? `Delete remote tag: ${tagName}` : `Delete local tag: ${tagName}`
  );
  
  if (!confirmed) {
    return { success: false, error: 'Operation cancelled' };
  }
  
  try {
    if (remote) {
      await execAsync(`git push origin --delete ${tagName}`, { cwd: repoPath });
    } else {
      await execAsync(`git tag -d ${tagName}`, { cwd: repoPath });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Resets the repository to a specific tag (requires confirmation)
 */
export async function resetToTag(repoPath: string, tagName: string, hard: boolean = true): Promise<{ success: boolean; error?: string }> {
  const confirmed = await confirmDestructiveOperation(`Reset to tag: ${tagName} (${hard ? 'hard' : 'soft'})`);
  
  if (!confirmed) {
    return { success: false, error: 'Operation cancelled' };
  }
  
  try {
    const mode = hard ? '--hard' : '--soft';
    await execAsync(`git reset ${mode} ${tagName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Pushes tag(s) to remote
 */
export async function pushTag(repoPath: string, tagName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tagRef = tagName ? tagName : '--tags';
    await execAsync(`git push origin ${tagRef}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Interactive Tag Center menu
 */
export async function tagCenter(repoPath: string): Promise<void> {
  const tags = await listTags(repoPath);
  
  console.log(chalk.cyan.bold('\n🏷️  TAG CENTER'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.green(`Total tags: ${tags.length}\n`));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Tag operations:',
      choices: [
        { name: '📋 List all tags', value: 'list' },
        { name: '➕ Create new tag', value: 'create' },
        { name: '⬆️  Push tag to remote', value: 'push' },
        { name: '🗑️  Delete tag', value: 'delete' },
        { name: '⏪ Reset to tag', value: 'reset' },
        { name: '↩️  Back to menu', value: 'back' },
      ],
    },
  ]);
  
  switch (action) {
    case 'list':
      if (tags.length === 0) {
        console.log(chalk.yellow('No tags found'));
      } else {
        console.log(chalk.cyan('\nTags:'));
        tags.forEach(t => {
          console.log(`  ${chalk.green(t.name)} ${chalk.gray(`(${t.commit})`)} ${t.message ? chalk.gray(`- ${t.message}`) : ''}`);
        });
      }
      break;
    
    case 'create': {
      const { newTagName, newTagAnnotated, newTagMessage } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newTagName',
          message: 'Tag name (e.g., v1.0.0):',
          validate: (name: string) => isValidTagName(name) || 'Invalid tag name',
        },
        {
          type: 'confirm',
          name: 'newTagAnnotated',
          message: 'Create annotated tag?',
          default: true,
        },
        {
          type: 'input',
          name: 'newTagMessage',
          message: 'Tag message:',
          when: (answers: any) => answers.newTagAnnotated,
        },
      ]);
      const createResult = await createTag(repoPath, newTagName, newTagMessage, newTagAnnotated);
      if (createResult.success) {
        console.log(chalk.green(`✓ Tag '${newTagName}' created`));
      } else {
        console.log(chalk.red(`✗ ${createResult.error}`));
      }
      break;
    }
    
    case 'push': {
      const { pushAllTags, pushTagName } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'pushAllTags',
          message: 'Push all tags?',
          default: true,
        },
        {
          type: 'list',
          name: 'pushTagName',
          message: 'Select tag to push:',
          choices: tags.map(t => t.name),
          when: (answers: any) => !answers.pushAllTags && tags.length > 0,
        },
      ]);
      const pushResult = await pushTag(repoPath, pushAllTags ? undefined : pushTagName);
      if (pushResult.success) {
        console.log(chalk.green('✓ Tags pushed to remote'));
      } else {
        console.log(chalk.red(`✗ ${pushResult.error}`));
      }
      break;
    }
    
    case 'delete': {
      if (tags.length === 0) {
        console.log(chalk.yellow('No tags to delete'));
        break;
      }
      const { deleteTagName, deleteRemote } = await inquirer.prompt([
        {
          type: 'list',
          name: 'deleteTagName',
          message: 'Select tag to delete:',
          choices: tags.map(t => t.name),
        },
        {
          type: 'confirm',
          name: 'deleteRemote',
          message: 'Delete from remote as well?',
          default: false,
        },
      ]);
      const deleteResult = await deleteTag(repoPath, deleteTagName, false);
      if (deleteResult.success && deleteRemote) {
        await deleteTag(repoPath, deleteTagName, true);
      }
      break;
    }
    
    case 'reset': {
      if (tags.length === 0) {
        console.log(chalk.yellow('No tags to reset to'));
        break;
      }
      const { resetTagName, resetHard } = await inquirer.prompt([
        {
          type: 'list',
          name: 'resetTagName',
          message: 'Reset to tag:',
          choices: tags.map(t => t.name),
        },
        {
          type: 'confirm',
          name: 'resetHard',
          message: 'Hard reset? (discards local changes)',
          default: false,
        },
      ]);
      await resetToTag(repoPath, resetTagName, resetHard);
      break;
    }
    
    case 'back':
      return;
  }
}
