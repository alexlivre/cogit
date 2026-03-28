/**
 * Stealth Plugin
 * Handles private file hiding/restoring
 * Implements Open/Closed Principle - extends functionality without modification
 */

import { CommandPlugin, CommandContext, PluginResult, HookedPlugin, PluginHook } from './types';
import { StealthPort } from '../ports/index';
import { StealthAdapter } from '../../infrastructure/adapters/stealth.adapter';

export class StealthPlugin implements HookedPlugin {
  readonly name = 'stealth';
  readonly priority = 10;
  readonly hook: PluginHook = 'pre-scan';
  enabled = true;

  private stealthService: StealthPort;
  private hiddenFiles: string[] = [];

  constructor(stealthService?: StealthPort) {
    this.stealthService = stealthService || new StealthAdapter();
  }

  async execute(context: CommandContext): Promise<PluginResult> {
    // Check if stealth mode is applicable
    if (!this.stealthService.hasConfig(context.repoPath)) {
      return { success: true, shouldContinue: true };
    }

    // Stash private files
    const result = await this.stealthService.stash(context.repoPath);

    if (!result.success) {
      return {
        success: false,
        shouldContinue: false,
        error: result.error || 'Stealth stash failed',
      };
    }

    this.hiddenFiles = result.hiddenFiles;

    return {
      success: true,
      shouldContinue: true,
      modifiedContext: {
        // Context modified to track hidden files
      },
    };
  }

  async cleanup(): Promise<void> {
    // Restore will be handled by post-commit hook
  }

  /**
   * Restore private files (called after commit)
   */
  async restore(repoPath: string): Promise<PluginResult> {
    if (this.hiddenFiles.length === 0) {
      return { success: true, shouldContinue: true };
    }

    const result = await this.stealthService.restore(repoPath);

    if (!result.success) {
      return {
        success: false,
        shouldContinue: true, // Don't block on restore failure
        error: result.error,
      };
    }

    this.hiddenFiles = [];
    return { success: true, shouldContinue: true };
  }

  /**
   * Get hidden files count
   */
  getHiddenFilesCount(): number {
    return this.hiddenFiles.length;
  }
}

/**
 * Stealth Restore Plugin
 * Handles restoration after commit
 */
export class StealthRestorePlugin implements HookedPlugin {
  readonly name = 'stealth-restore';
  readonly priority = 90;
  readonly hook: PluginHook = 'post-commit';
  enabled = true;

  private stealthPlugin: StealthPlugin;

  constructor(stealthPlugin: StealthPlugin) {
    this.stealthPlugin = stealthPlugin;
  }

  async execute(context: CommandContext): Promise<PluginResult> {
    return await this.stealthPlugin.restore(context.repoPath);
  }
}
