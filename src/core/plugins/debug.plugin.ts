/**
 * Debug Plugin
 * Handles deep trace logging
 * Implements Open/Closed Principle
 */

import { CommandPlugin, CommandContext, PluginResult } from './types';
import { debugLogger } from '../../cli/ui/debug-logger';

export class DebugPlugin implements CommandPlugin {
  readonly name = 'debug';
  readonly priority = 5; // Run early
  enabled = false;

  private logFile: string = '.vibe-debug.log';

  constructor() {
    // Check if debug mode is enabled via environment
    if (process.env.COGIT_DEBUG === 'true') {
      this.enabled = true;
    }
  }

  async execute(context: CommandContext): Promise<PluginResult> {
    // Enable debug mode if flag is set
    if (context.options.debug) {
      this.enabled = true;
      debugLogger.enable();
      
      console.log('🔍 Debug mode enabled. Logging to', this.logFile);
      
      debugLogger.logInfo('Command started', {
        repoPath: context.repoPath,
        options: context.options,
        language: context.language,
      });
    }

    return { success: true, shouldContinue: true };
  }

  async cleanup(): Promise<void> {
    if (this.enabled) {
      debugLogger.logInfo('Command completed', { timestamp: new Date().toISOString() });
    }
  }

  /**
   * Log AI request
   */
  logAIRequest(provider: string, messages: unknown[]): void {
    if (this.enabled) {
      debugLogger.logRequest(provider, messages);
    }
  }

  /**
   * Log AI response
   */
  logAIResponse(provider: string, response: string, duration: number): void {
    if (this.enabled) {
      debugLogger.logResponse(provider, response, duration);
    }
  }

  /**
   * Log git command
   */
  logGitCommand(command: string, result: unknown): void {
    if (this.enabled) {
      debugLogger.logInfo('Git command', { command, result });
    }
  }
}
