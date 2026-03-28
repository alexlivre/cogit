/**
 * Stealth Handler - Manages stealth mode operations
 * Single Responsibility: Hide and restore private files
 */

import chalk from 'chalk';
import { stealthStash, stealthRestore, hasPrivateConfig } from '../../../services/tools/stealth';
import { StealthError } from '../../../core/errors';

export interface StealthHandlerResult {
  hiddenFiles: string[];
  tempPath: string;
  success: boolean;
  error?: string;
}

export interface StealthRestoreResult {
  restoredFiles: string[];
  conflicts: string[];
  success: boolean;
  error?: string;
}

/**
 * Handle stealth mode activation
 * @param repoPath Repository path
 * @returns Result with hidden files info
 */
export async function handleStealthMode(repoPath: string): Promise<StealthHandlerResult> {
  if (!hasPrivateConfig(repoPath)) {
    return { hiddenFiles: [], tempPath: '', success: true };
  }

  console.log(chalk.cyan('🔒 Stealth Mode: Hiding private files...'));
  
  const result = await stealthStash(repoPath);
  
  if (!result.success) {
    throw new StealthError(
      `Failed to hide private files: ${result.error}`,
      [result.error || 'Unknown error']
    );
  }

  if (result.hiddenFiles.length > 0) {
    console.log(chalk.green(`✓ Hidden ${result.hiddenFiles.length} private files`));
  }

  return result;
}

/**
 * Handle stealth mode restoration
 * @param repoPath Repository path
 * @param hiddenFiles Files that were hidden
 * @returns Result with restored files info
 */
export async function handleStealthRestore(
  repoPath: string,
  hiddenFiles: string[]
): Promise<StealthRestoreResult> {
  if (hiddenFiles.length === 0) {
    return { restoredFiles: [], conflicts: [], success: true };
  }

  console.log(chalk.cyan('🔒 Stealth Mode: Restoring private files...'));
  
  const result = await stealthRestore(repoPath);
  
  if (!result.success) {
    console.error(chalk.red(`Stealth restore error: ${result.error}`));
    return result;
  }

  if (result.restoredFiles.length > 0) {
    console.log(chalk.green(`✓ Restored ${result.restoredFiles.length} private files`));
  }

  if (result.conflicts.length > 0) {
    console.log(chalk.yellow(`⚠ ${result.conflicts.length} conflicts renamed to .restored`));
  }

  return result;
}
