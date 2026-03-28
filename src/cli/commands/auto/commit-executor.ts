/**
 * Commit Executor Handler - Manages commit execution and error healing
 * Single Responsibility: Execute git commit operations with error recovery
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { executeCommit } from '../../../services/git/executor';
import { healGitError } from '../../../services/git/healer';
import { suggestIgnore } from '../../../services/tools/ignore';
import { GitError } from '../../../core/errors';
import { t } from '../../../config/i18n';
import { 
  renderWarning, 
  renderSuccess, 
  renderError, 
  renderHealerAttempt,
  renderDryRun 
} from '../../ui/renderer';

export interface ExecutorOptions {
  repoPath: string;
  message: string;
  shouldPush: boolean;
  dryRun: boolean;
}

export interface ExecutorResult {
  success: boolean;
  error?: string;
}

/**
 * Handle commit execution with optional dry-run
 * @param options Execution options
 * @returns Execution result
 */
export async function handleCommitExecution(
  options: ExecutorOptions
): Promise<ExecutorResult> {
  // Dry run mode - don't execute anything
  if (options.dryRun) {
    const commands = [
      'git add -A',
      `git commit -m "${options.message}"`,
    ];
    
    if (options.shouldPush) {
      commands.push('git push');
    }
    
    renderDryRun(commands);
    return { success: true };
  }

  const execSpinner = ora(t('auto.executing')).start();
  const result = await executeCommit(
    options.repoPath,
    options.message,
    options.shouldPush
  );

  if (result.success) {
    execSpinner.succeed(t('auto.success'));
    await handleIgnoreSuggestions(options.repoPath);
    return { success: true };
  }

  execSpinner.fail(t('error.push_failed', { error: result.error || 'Unknown error' }));

  // Try to heal push errors
  if (options.shouldPush && result.error?.includes('push')) {
    return await handlePushHealing(options.repoPath, result.error);
  }

  throw GitError.commitFailed(result.error);
}

/**
 * Handle ignore suggestions after successful commit
 */
async function handleIgnoreSuggestions(repoPath: string): Promise<void> {
  const { suggest } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'suggest',
      message: 'Check for .gitignore suggestions?',
      default: false,
    },
  ]);

  if (suggest) {
    await suggestIgnore(repoPath);
  }
}

/**
 * Handle push error healing attempts
 */
async function handlePushHealing(
  repoPath: string,
  errorOutput: string
): Promise<ExecutorResult> {
  renderWarning('Push failed. Attempting to heal...');

  const healerResult = await healGitError({
    repoPath,
    failedCommand: 'git push',
    errorOutput,
    maxRetries: 3,
  });

  if (healerResult.success) {
    renderSuccess('Healed successfully!');
    return { success: true };
  }

  renderError('Healing failed. Manual intervention required.');
  healerResult.attempts.forEach(a => {
    renderHealerAttempt(a.attempt, a.commands, a.success, a.error);
  });

  throw GitError.pushFailed('Healing attempts failed');
}
