/**
 * Auto Command - Refactored entry point
 * Orchestrates commit workflow using extracted handlers
 */

import chalk from 'chalk';
import ora from 'ora';
import { scanRepository } from '../../../services/git/scanner';
import { sanitizeFiles } from '../../../services/security/sanitizer';
import { generateCommitMessage } from '../../../services/ai/brain';
import { debugLogger } from '../../ui/debug-logger';
import { renderCommitMessage } from '../../ui/renderer';
import { t } from '../../../config/i18n';
import { GitError, SecurityError, AIError } from '../../../core/errors';

import { AutoOptions, CommandContext } from './types';
import { validateConfiguration } from './validator';
import { handleBranchSwitch } from './branch-handler';
import { handleStealthMode, handleStealthRestore } from './stealth-handler';
import { handleCommitReview } from './commit-review';
import { handleCommitExecution } from './commit-executor';

export { AutoOptions } from './types';

/**
 * Main auto command handler
 * @param options Command options
 */
export async function autoCommand(options: AutoOptions): Promise<void> {
  const repoPath = options.path || process.cwd();

  // Setup debug mode
  if (options.debug) {
    debugLogger.enable();
    console.log(chalk.yellow('🔍 Debug mode enabled. Logging to .vibe-debug.log'));
  }

  // Validate configuration
  const config = validateConfiguration();
  const context: CommandContext = {
    repoPath,
    options,
    language: config.language,
    commitLanguage: config.commitLanguage,
  };

  // Handle stealth mode
  const stealthResult = await handleStealthMode(repoPath);

  try {
    // Handle branch switching if specified
    if (options.branch) {
      await handleBranchSwitch(repoPath, options.branch);
    }

    // Scan repository
    const scanResult = await scanRepositoryWithErrorHandling(repoPath);

    // Security check
    validateFiles(scanResult.stagedFiles, scanResult.unstagedFiles);

    // Generate commit message with AI
    const commitMessage = await generateCommitMessageWithAI(context, scanResult.diff);

    // Review loop
    const reviewResult = await handleCommitReview(commitMessage, {
      skipReview: options.yes || false,
      hint: options.message,
      language: context.commitLanguage,
      diff: scanResult.diff,
      nobuild: options.nobuild,
    });

    if (reviewResult.cancelled) {
      return;
    }

    // Execute commit
    await handleCommitExecution({
      repoPath,
      message: reviewResult.message,
      shouldPush: !options.noPush,
      dryRun: options.dryRun || false,
    });

  } finally {
    // Always restore stealth files
    await handleStealthRestore(repoPath, stealthResult.hiddenFiles);
  }
}

/**
 * Scan repository with error handling
 */
async function scanRepositoryWithErrorHandling(repoPath: string) {
  const scanSpinner = ora(t('auto.processing')).start();
  const scanResult = await scanRepository(repoPath);

  if (!scanResult.isRepo) {
    scanSpinner.fail(t('error.not_repo'));
    throw GitError.notRepo();
  }

  if (!scanResult.hasChanges) {
    scanSpinner.fail(t('auto.no_changes'));
    throw GitError.noChanges();
  }

  scanSpinner.succeed(t('auto.processing'));
  return scanResult;
}

/**
 * Validate files for security issues
 */
function validateFiles(stagedFiles: string[], unstagedFiles: string[]): void {
  const allFiles = [...stagedFiles, ...unstagedFiles];
  const sanitizerResult = sanitizeFiles(allFiles);

  if (!sanitizerResult.isClean) {
    throw new SecurityError(sanitizerResult.blockedFiles);
  }
}

/**
 * Generate commit message with AI
 */
async function generateCommitMessageWithAI(
  context: CommandContext,
  diff: string
): Promise<string> {
  const aiSpinner = ora(t('auto.generating')).start();
  const startTime = Date.now();

  const brainResult = await generateCommitMessage({
    diff,
    hint: context.options.message,
    language: context.commitLanguage,
    debug: context.options.debug,
  });

  if (context.options.debug) {
    debugLogger.logResponse('brain', brainResult.message || '', Date.now() - startTime);
  }

  if (!brainResult.success) {
    aiSpinner.fail(brainResult.error || 'AI generation failed');
    throw new AIError(
      brainResult.error || 'AI generation failed',
      [brainResult.error || 'Unknown error']
    );
  }

  aiSpinner.succeed(t('auto.generating'));
  renderCommitMessage(brainResult.message || '');

  return brainResult.message || '';
}
