/**
 * Healer Plugin
 * Handles automatic error recovery for git operations
 * Implements Open/Closed Principle
 */

import { CommandPlugin, CommandContext, PluginResult, HookedPlugin, PluginHook } from './types';
import { HealerPort, HealerInput } from '../ports/index';
import { HealerAdapter } from '../../infrastructure/adapters/healer.adapter';
import { GitError } from '../errors';

export class HealerPlugin implements HookedPlugin {
  readonly name = 'healer';
  readonly priority = 80;
  readonly hook: PluginHook = 'on-error';
  enabled = true;

  private healerService: HealerPort;
  private maxRetries: number = 3;

  constructor(healerService?: HealerPort) {
    this.healerService = healerService || new HealerAdapter();
  }

  async execute(context: CommandContext): Promise<PluginResult> {
    // This plugin only activates on errors
    // The actual healing is triggered by handlePushError
    return { success: true, shouldContinue: true };
  }

  /**
   * Attempt to heal a push error
   * @param repoPath Repository path
   * @param errorOutput Error message
   */
  async healPushError(repoPath: string, errorOutput: string): Promise<PluginResult> {
    const input: HealerInput = {
      repoPath,
      failedCommand: 'git push',
      errorOutput,
      maxRetries: this.maxRetries,
    };

    const result = await this.healerService.heal(input);

    if (result.success) {
      return {
        success: true,
        shouldContinue: true,
      };
    }

    // Healing failed
    const attemptDetails = result.attempts
      .map(a => `Attempt ${a.attempt}: ${a.success ? 'OK' : a.error}`)
      .join('\n');

    throw new GitError(
      'Push healing failed',
      'GIT_PUSH_FAILED',
      [attemptDetails]
    );
  }

  /**
   * Set max retries
   */
  setMaxRetries(max: number): void {
    this.maxRetries = max;
  }
}
