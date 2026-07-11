/**
 * Auto Push Service
 * Integrates connectivity checking and retry logic for automatic push operations
 */

import chalk from 'chalk';
import ora from 'ora';
import { checkConnectivity, shouldAttemptAutoPush, getConnectivityMessage } from './connectivity';
import { executeGitWithRetry, getRetrySummary } from './retry-handler';
import { CONFIG } from '../../config/env';
import { safeExecGit } from '../../utils/executor';

export interface AutoPushOptions {
  repoPath: string;
  silent?: boolean;
  forceCheck?: boolean;
  customDelay?: number;
}

export interface AutoPushResult {
  success: boolean;
  attempted: boolean;
  skipped: boolean;
  reason?: string;
  error?: string;
  attempts?: number;
  duration?: number;
}

type ResourceKind = 'branch' | 'tag';

interface ExecuteAutoPushParams {
  kind: ResourceKind;
  name: string;
  enabledFlag: boolean;       // CONFIG.AUTO_PUSH_BRANCHES or CONFIG.AUTO_PUSH_TAGS
  disabledReason: string;
  messagePreDelay: string;    // "Auto pushing branch in N seconds..."
  messageExecuting: string;   // "🌐 Auto pushing branch: foo"
  gitCommand: string[];       // argv for safeExecGit
  summarySuccess: string;     // "✅ Branch 'foo' auto pushed successfully"
  summaryFail: string;        // "❌ Auto push failed for branch 'foo'"
  showDelaySpinner: boolean;
}

async function executeAutoPush(
  params: ExecuteAutoPushParams,
  options: AutoPushOptions
): Promise<AutoPushResult> {
  const { repoPath, silent = false, forceCheck = false, customDelay } = options;

  if (!CONFIG.AUTO_PUSH_ENABLED || !params.enabledFlag) {
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: params.disabledReason,
    };
  }

  const connectivity = await checkConnectivity(repoPath, { forceCheck });

  const autoPushConfig = {
    enabled: true,
    requireInternet: CONFIG.AUTO_PUSH_INTERNET_CHECK,
    githubOnly: CONFIG.AUTO_PUSH_GITHUB_ONLY,
  };

  if (!shouldAttemptAutoPush(connectivity, autoPushConfig)) {
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: `Connectivity check failed: ${getConnectivityMessage(connectivity)}`,
    };
  }

  if (params.showDelaySpinner) {
    const delay = customDelay || CONFIG.AUTO_PUSH_DELAY;
    if (delay > 0 && !silent) {
      const spinner = ora(params.messagePreDelay).start();
      await new Promise(resolve => setTimeout(resolve, delay));
      spinner.stop();
    }
  }

  if (!silent) {
    console.log(chalk.blue(params.messageExecuting));
  }

  const pushResult = await executeGitWithRetry(
    async () => {
      const { stdout } = await safeExecGit(params.gitCommand, { cwd: repoPath });
      return stdout;
    },
    {
      maxRetries: CONFIG.AUTO_PUSH_RETRY_COUNT,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    }
  );

  if (pushResult.success) {
    if (!silent && !CONFIG.AUTO_PUSH_SILENT) {
      console.log(chalk.green(params.summarySuccess));
      if (pushResult.attempts > 1) {
        console.log(chalk.gray(`   ${getRetrySummaryFromAttempts(pushResult.attempts)}`));
      }
    }
    return {
      success: true,
      attempted: true,
      skipped: false,
      attempts: pushResult.attempts,
      duration: pushResult.totalDuration,
    };
  }

  if (!silent) {
    console.log(chalk.red(params.summaryFail));
    console.log(chalk.gray(`   Error: ${pushResult.error}`));
    if (pushResult.attempts > 1) {
      console.log(chalk.gray(`   ${getRetrySummaryFromAttempts(pushResult.attempts)}`));
    }
  }

  return {
    success: false,
    attempted: true,
    skipped: false,
    error: pushResult.error,
    attempts: pushResult.attempts,
    duration: pushResult.totalDuration,
  };
}

/** executeGitWithRetry returns RetryResult with `attempts: number` (not the array). */
function getRetrySummaryFromAttempts(count: number): string {
  if (count <= 1) return '✅ Success on first attempt';
  return `✅ Success after ${count} attempts (${count - 1} retries)`;
}

/**
 * Auto push for branches
 */
export function autoPushBranch(
  branchName: string,
  options: AutoPushOptions
): Promise<AutoPushResult> {
  return executeAutoPush(
    {
      kind: 'branch',
      name: branchName,
      enabledFlag: CONFIG.AUTO_PUSH_BRANCHES,
      disabledReason: 'Auto push is disabled for branches',
      messagePreDelay: `Auto pushing branch in ${(options.customDelay || CONFIG.AUTO_PUSH_DELAY) / 1000} seconds...`,
      messageExecuting: `🌐 Auto pushing branch: ${branchName}`,
      gitCommand: ['push', '-u', 'origin', branchName],
      summarySuccess: `✅ Branch '${branchName}' auto pushed successfully`,
      summaryFail: `❌ Auto push failed for branch '${branchName}'`,
      showDelaySpinner: true,
    },
    options
  );
}

/**
 * Auto push for tags
 */
export function autoPushTag(
  tagName: string,
  options: AutoPushOptions
): Promise<AutoPushResult> {
  return executeAutoPush(
    {
      kind: 'tag',
      name: tagName,
      enabledFlag: CONFIG.AUTO_PUSH_TAGS,
      disabledReason: 'Auto push is disabled for tags',
      messagePreDelay: `Auto pushing tag in ${(options.customDelay || CONFIG.AUTO_PUSH_DELAY) / 1000} seconds...`,
      messageExecuting: `🏷️  Auto pushing tag: ${tagName}`,
      gitCommand: ['push', 'origin', tagName],
      summarySuccess: `✅ Tag '${tagName}' auto pushed successfully`,
      summaryFail: `❌ Auto push failed for tag '${tagName}'`,
      showDelaySpinner: true,
    },
    options
  );
}

/**
 * Auto push all tags at once
 */
export function autoPushAllTags(options: AutoPushOptions): Promise<AutoPushResult> {
  return executeAutoPush(
    {
      kind: 'tag',
      name: '--all-tags--',
      enabledFlag: CONFIG.AUTO_PUSH_TAGS,
      disabledReason: 'Auto push is disabled for tags',
      messagePreDelay: '',
      messageExecuting: '🏷️  Auto pushing all tags...',
      gitCommand: ['push', 'origin', '--tags'],
      summarySuccess: '✅ All tags auto pushed successfully',
      summaryFail: '❌ Auto push failed for tags',
      showDelaySpinner: false,
    },
    options
  );
}

export function getAutoPushStatus(): string {
  const parts: string[] = [];
  if (!CONFIG.AUTO_PUSH_ENABLED) return '🔴 Auto push: DISABLED';
  parts.push('🟢 Auto push: ENABLED');
  if (CONFIG.AUTO_PUSH_BRANCHES) parts.push('🌿 Branches');
  if (CONFIG.AUTO_PUSH_TAGS) parts.push('🏷️  Tags');
  if (CONFIG.AUTO_PUSH_INTERNET_CHECK) parts.push('🌐 Internet Check');
  if (CONFIG.AUTO_PUSH_GITHUB_ONLY) parts.push('🐙 GitHub Only');
  parts.push(`⏱️  ${CONFIG.AUTO_PUSH_DELAY / 1000}s delay`);
  parts.push(`🔄 ${CONFIG.AUTO_PUSH_RETRY_COUNT} retries`);
  return parts.join(' | ');
}
