/**
 * Commit Executor Handler (Refactored with Dependency Inversion)
 * Uses GitExecutorPort and HealerPort interfaces
 * Single Responsibility: Execute git commit operations with error recovery
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { GitExecutorPort, HealerPort, IgnorePort, UIPort } from '../../../core/ports/index';
import { GitError } from '../../../core/errors';
import { t } from '../../../config/i18n';

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
 * Commit Executor with Dependency Injection
 * Follows Dependency Inversion Principle
 */
export class CommitExecutorHandler {
  constructor(
    private readonly gitExecutor: GitExecutorPort,
    private readonly healer: HealerPort,
    private readonly ignoreService: IgnorePort,
    private readonly ui: UIPort
  ) {}

  /**
   * Handle commit execution with optional dry-run
   * @param options Execution options
   * @returns Execution result
   */
  async execute(options: ExecutorOptions): Promise<ExecutorResult> {
    // Dry run mode - don't execute anything
    if (options.dryRun) {
      const commands = [
        'git add -A',
        `git commit -m "${options.message}"`,
      ];
      
      if (options.shouldPush) {
        commands.push('git push');
      }
      
      this.ui.renderDryRun(commands);
      return { success: true };
    }

    this.ui.startSpinner(t('auto.executing'));
    const result = await this.gitExecutor.executeCommit(
      options.repoPath,
      options.message,
      options.shouldPush
    );

    if (result.success) {
      this.ui.succeedSpinner(t('auto.success'));
      await this.handleIgnoreSuggestions(options.repoPath);
      return { success: true };
    }

    this.ui.failSpinner(t('error.push_failed', { error: result.error || 'Unknown error' }));

    // Try to heal push errors
    if (options.shouldPush && result.error?.includes('push')) {
      return await this.handlePushHealing(options.repoPath, result.error || '');
    }

    throw GitError.commitFailed(result.error);
  }

  /**
   * Handle ignore suggestions after successful commit
   */
  private async handleIgnoreSuggestions(repoPath: string): Promise<void> {
    const { suggest } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'suggest',
        message: 'Check for .gitignore suggestions?',
        default: false,
      },
    ]);

    if (suggest) {
      await this.ignoreService.suggest(repoPath);
    }
  }

  /**
   * Handle push error healing attempts
   */
  private async handlePushHealing(
    repoPath: string,
    errorOutput: string
  ): Promise<ExecutorResult> {
    this.ui.renderWarning('Push failed. Attempting to heal...');

    const healerResult = await this.healer.heal({
      repoPath,
      failedCommand: 'git push',
      errorOutput,
      maxRetries: 3,
    });

    if (healerResult.success) {
      this.ui.renderSuccess('Healed successfully!');
      return { success: true };
    }

    this.ui.renderError('Healing failed. Manual intervention required.');
    
    healerResult.attempts.forEach(a => {
      console.log(chalk.gray(`  Attempt ${a.attempt}: ${a.success ? '✓' : '✗'}`));
      if (a.error) {
        console.log(chalk.red(`    Error: ${a.error}`));
      }
    });

    throw GitError.pushFailed('Healing attempts failed');
  }
}

// Factory function for default implementation
export function createCommitExecutorHandler(): CommitExecutorHandler {
  const { GitExecutorAdapter } = require('../../../infrastructure/adapters/git-executor.adapter');
  const { HealerAdapter } = require('../../../infrastructure/adapters/healer.adapter');
  const { IgnoreAdapter } = require('../../../infrastructure/adapters/ignore.adapter');
  const { UIAdapter } = require('../../../infrastructure/adapters/ui.adapter');

  return new CommitExecutorHandler(
    new GitExecutorAdapter(),
    new HealerAdapter(),
    new IgnoreAdapter(),
    new UIAdapter()
  );
}
