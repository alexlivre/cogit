/**
 * Stealth Handler (Refactored with Dependency Inversion)
 * Uses StealthPort interface
 * Single Responsibility: Handle stealth mode operations
 */

import chalk from 'chalk';
import { StealthPort, StealthResult, StealthRestoreResult } from '../../../core/ports/index';
import { StealthError } from '../../../core/errors';

export { StealthResult, StealthRestoreResult };

/**
 * Stealth Handler with Dependency Injection
 * Follows Dependency Inversion Principle
 */
export class StealthHandler {
  constructor(
    private readonly stealthService: StealthPort
  ) {}

  /**
   * Check if stealth mode is applicable
   * @param repoPath Repository path
   */
  hasConfig(repoPath: string): boolean {
    return this.stealthService.hasConfig(repoPath);
  }

  /**
   * Handle stealth mode activation
   * @param repoPath Repository path
   * @returns Stealth result with hidden files
   */
  async handleStealthMode(repoPath: string): Promise<StealthResult> {
    if (!this.stealthService.hasConfig(repoPath)) {
      return { hiddenFiles: [], tempPath: '', success: true };
    }

    console.log(chalk.gray('  Stealth mode: Hiding private files...'));
    const result = await this.stealthService.stash(repoPath);

    if (!result.success) {
      throw new StealthError('Stealth operation failed', result.error ? [result.error] : undefined);
    }

    if (result.hiddenFiles.length > 0) {
      console.log(chalk.gray(`  Hidden ${result.hiddenFiles.length} private file(s)`));
    }

    return result;
  }

  /**
   * Handle stealth mode restoration
   * @param repoPath Repository path
   * @returns Restore result
   */
  async handleStealthRestore(repoPath: string): Promise<StealthRestoreResult> {
    const result = await this.stealthService.restore(repoPath);

    if (!result.success) {
      console.log(chalk.yellow(`  Warning: Failed to restore some files: ${result.error}`));
      return result;
    }

    if (result.restoredFiles.length > 0) {
      console.log(chalk.gray(`  Restored ${result.restoredFiles.length} private file(s)`));
    }

    if (result.conflicts.length > 0) {
      console.log(chalk.yellow(`  Conflicts resolved: ${result.conflicts.length} file(s) restored as .restored`));
    }

    return result;
  }
}

// Factory function for default implementation
export function createStealthHandler(): StealthHandler {
  const { StealthAdapter } = require('../../../infrastructure/adapters/stealth.adapter');
  return new StealthHandler(new StealthAdapter());
}
