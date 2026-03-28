/**
 * Auto Push Service
 * Integrates connectivity checking and retry logic for automatic push operations
 */

import chalk from 'chalk';
import ora from 'ora';
import { checkConnectivity, shouldAttemptAutoPush, getConnectivityMessage } from './connectivity';
import { executeGitWithRetry, getRetrySummary } from './retry-handler';
import { CONFIG } from '../../config/env';
import { execGit } from '../../utils/executor';
import { t } from '../../config/i18n';

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

/**
 * Auto push for branches
 */
export async function autoPushBranch(
  branchName: string,
  options: AutoPushOptions
): Promise<AutoPushResult> {
  const { repoPath, silent = false, forceCheck = false, customDelay } = options;
  
  // Check if auto push is enabled for branches
  if (!CONFIG.AUTO_PUSH_ENABLED || !CONFIG.AUTO_PUSH_BRANCHES) {
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: 'Auto push is disabled for branches'
    };
  }

  // Check connectivity
  const connectivity = await checkConnectivity(repoPath, { forceCheck });
  
  const autoPushConfig = {
    enabled: true,
    requireInternet: CONFIG.AUTO_PUSH_INTERNET_CHECK,
    githubOnly: CONFIG.AUTO_PUSH_GITHUB_ONLY
  };

  if (!shouldAttemptAutoPush(connectivity, autoPushConfig)) {
    const message = getConnectivityMessage(connectivity);
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: `Connectivity check failed: ${message}`
    };
  }

  // Wait for configured delay
  const delay = customDelay || CONFIG.AUTO_PUSH_DELAY;
  if (delay > 0 && !silent) {
    const spinner = ora(`Auto pushing branch in ${delay / 1000} seconds...`).start();
    await new Promise(resolve => setTimeout(resolve, delay));
    spinner.stop();
  }

  // Execute auto push with retry
  if (!silent) {
    console.log(chalk.blue(`🌐 Auto pushing branch: ${branchName}`));
  }

  const pushResult = await executeGitWithRetry(
    async () => {
      const { stdout } = await execGit(`push -u origin ${branchName}`, { cwd: repoPath });
      return stdout;
    },
    {
      maxRetries: CONFIG.AUTO_PUSH_RETRY_COUNT,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    }
  );

  if (pushResult.success) {
    if (!silent && !CONFIG.AUTO_PUSH_SILENT) {
      console.log(chalk.green(`✅ Branch '${branchName}' auto pushed successfully`));
      if (pushResult.attempts > 1) {
        console.log(chalk.gray(`   ${getRetrySummary(pushResult.attempts as any)}`));
      }
    }
    return {
      success: true,
      attempted: true,
      skipped: false,
      attempts: pushResult.attempts,
      duration: pushResult.totalDuration
    };
  } else {
    if (!silent) {
      console.log(chalk.red(`❌ Auto push failed for branch '${branchName}'`));
      console.log(chalk.gray(`   Error: ${pushResult.error}`));
      if (pushResult.attempts > 1) {
        console.log(chalk.gray(`   ${getRetrySummary(pushResult.attempts as any)}`));
      }
    }
    return {
      success: false,
      attempted: true,
      skipped: false,
      error: pushResult.error,
      attempts: pushResult.attempts,
      duration: pushResult.totalDuration
    };
  }
}

/**
 * Auto push for tags
 */
export async function autoPushTag(
  tagName: string,
  options: AutoPushOptions
): Promise<AutoPushResult> {
  const { repoPath, silent = false, forceCheck = false, customDelay } = options;
  
  // Check if auto push is enabled for tags
  if (!CONFIG.AUTO_PUSH_ENABLED || !CONFIG.AUTO_PUSH_TAGS) {
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: 'Auto push is disabled for tags'
    };
  }

  // Check connectivity
  const connectivity = await checkConnectivity(repoPath, { forceCheck });
  
  const autoPushConfig = {
    enabled: true,
    requireInternet: CONFIG.AUTO_PUSH_INTERNET_CHECK,
    githubOnly: CONFIG.AUTO_PUSH_GITHUB_ONLY
  };

  if (!shouldAttemptAutoPush(connectivity, autoPushConfig)) {
    const message = getConnectivityMessage(connectivity);
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: `Connectivity check failed: ${message}`
    };
  }

  // Wait for configured delay
  const delay = customDelay || CONFIG.AUTO_PUSH_DELAY;
  if (delay > 0 && !silent) {
    const spinner = ora(`Auto pushing tag in ${delay / 1000} seconds...`).start();
    await new Promise(resolve => setTimeout(resolve, delay));
    spinner.stop();
  }

  // Execute auto push with retry
  if (!silent) {
    console.log(chalk.blue(`🏷️  Auto pushing tag: ${tagName}`));
  }

  const pushResult = await executeGitWithRetry(
    async () => {
      const { stdout } = await execGit(`push origin ${tagName}`, { cwd: repoPath });
      return stdout;
    },
    {
      maxRetries: CONFIG.AUTO_PUSH_RETRY_COUNT,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    }
  );

  if (pushResult.success) {
    if (!silent && !CONFIG.AUTO_PUSH_SILENT) {
      console.log(chalk.green(`✅ Tag '${tagName}' auto pushed successfully`));
      if (pushResult.attempts > 1) {
        console.log(chalk.gray(`   ${getRetrySummary(pushResult.attempts as any)}`));
      }
    }
    return {
      success: true,
      attempted: true,
      skipped: false,
      attempts: pushResult.attempts,
      duration: pushResult.totalDuration
    };
  } else {
    if (!silent) {
      console.log(chalk.red(`❌ Auto push failed for tag '${tagName}'`));
      console.log(chalk.gray(`   Error: ${pushResult.error}`));
      if (pushResult.attempts > 1) {
        console.log(chalk.gray(`   ${getRetrySummary(pushResult.attempts as any)}`));
      }
    }
    return {
      success: false,
      attempted: true,
      skipped: false,
      error: pushResult.error,
      attempts: pushResult.attempts,
      duration: pushResult.totalDuration
    };
  }
}

/**
 * Auto push all tags
 */
export async function autoPushAllTags(options: AutoPushOptions): Promise<AutoPushResult> {
  const { repoPath, silent = false, forceCheck = false } = options;
  
  // Check if auto push is enabled for tags
  if (!CONFIG.AUTO_PUSH_ENABLED || !CONFIG.AUTO_PUSH_TAGS) {
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: 'Auto push is disabled for tags'
    };
  }

  // Check connectivity
  const connectivity = await checkConnectivity(repoPath, { forceCheck });
  
  const autoPushConfig = {
    enabled: true,
    requireInternet: CONFIG.AUTO_PUSH_INTERNET_CHECK,
    githubOnly: CONFIG.AUTO_PUSH_GITHUB_ONLY
  };

  if (!shouldAttemptAutoPush(connectivity, autoPushConfig)) {
    const message = getConnectivityMessage(connectivity);
    return {
      success: false,
      attempted: false,
      skipped: true,
      reason: `Connectivity check failed: ${message}`
    };
  }

  // Execute auto push with retry
  if (!silent) {
    console.log(chalk.blue(`🏷️  Auto pushing all tags...`));
  }

  const pushResult = await executeGitWithRetry(
    async () => {
      const { stdout } = await execGit('push origin --tags', { cwd: repoPath });
      return stdout;
    },
    {
      maxRetries: CONFIG.AUTO_PUSH_RETRY_COUNT,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    }
  );

  if (pushResult.success) {
    if (!silent && !CONFIG.AUTO_PUSH_SILENT) {
      console.log(chalk.green(`✅ All tags auto pushed successfully`));
      if (pushResult.attempts > 1) {
        console.log(chalk.gray(`   ${getRetrySummary(pushResult.attempts as any)}`));
      }
    }
    return {
      success: true,
      attempted: true,
      skipped: false,
      attempts: pushResult.attempts,
      duration: pushResult.totalDuration
    };
  } else {
    if (!silent) {
      console.log(chalk.red(`❌ Auto push failed for tags`));
      console.log(chalk.gray(`   Error: ${pushResult.error}`));
      if (pushResult.attempts > 1) {
        console.log(chalk.gray(`   ${getRetrySummary(pushResult.attempts as any)}`));
      }
    }
    return {
      success: false,
      attempted: true,
      skipped: false,
      error: pushResult.error,
      attempts: pushResult.attempts,
      duration: pushResult.totalDuration
    };
  }
}

/**
 * Get auto push status summary
 */
export function getAutoPushStatus(): string {
  const parts = [];
  
  if (!CONFIG.AUTO_PUSH_ENABLED) {
    return '🔴 Auto push: DISABLED';
  }
  
  parts.push('🟢 Auto push: ENABLED');
  
  if (CONFIG.AUTO_PUSH_BRANCHES) {
    parts.push('🌿 Branches');
  }
  
  if (CONFIG.AUTO_PUSH_TAGS) {
    parts.push('🏷️  Tags');
  }
  
  if (CONFIG.AUTO_PUSH_INTERNET_CHECK) {
    parts.push('🌐 Internet Check');
  }
  
  if (CONFIG.AUTO_PUSH_GITHUB_ONLY) {
    parts.push('🐙 GitHub Only');
  }
  
  parts.push(`⏱️  ${CONFIG.AUTO_PUSH_DELAY / 1000}s delay`);
  parts.push(`🔄 ${CONFIG.AUTO_PUSH_RETRY_COUNT} retries`);
  
  return parts.join(' | ');
}
