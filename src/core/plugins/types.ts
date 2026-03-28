/**
 * Plugin System Types
 * Defines interfaces for the plugin architecture
 * Implements Open/Closed Principle - extend without modifying
 */

import { AutoOptions } from '../../cli/commands/auto/types';

/**
 * Context passed to plugins during execution
 */
export interface CommandContext {
  repoPath: string;
  options: AutoOptions;
  language: string;
  commitLanguage: string;
  diff?: string;
  message?: string;
}

/**
 * Result returned by plugins
 */
export interface PluginResult {
  success: boolean;
  shouldContinue: boolean;  // Whether to continue to next plugin
  modifiedContext?: Partial<CommandContext>;
  error?: string;
}

/**
 * Plugin interface
 * All plugins must implement this interface
 */
export interface CommandPlugin {
  /**
   * Plugin name for identification
   */
  readonly name: string;

  /**
   * Execution priority (lower = earlier)
   */
  readonly priority: number;

  /**
   * Whether plugin is enabled
   */
  enabled: boolean;

  /**
   * Execute plugin logic
   * @param context Command context
   * @returns Plugin result
   */
  execute(context: CommandContext): Promise<PluginResult>;

  /**
   * Optional initialization
   */
  init?(): Promise<void>;

  /**
   * Optional cleanup
   */
  cleanup?(): Promise<void>;
}

/**
 * Plugin lifecycle hooks
 */
export type PluginHook = 'pre-scan' | 'post-scan' | 'pre-commit' | 'post-commit' | 'pre-push' | 'post-push' | 'on-error';

/**
 * Plugin with hook support
 */
export interface HookedPlugin extends CommandPlugin {
  /**
   * Hook this plugin responds to
   */
  readonly hook: PluginHook;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  enabled: boolean;
  priority: number;
  options?: Record<string, unknown>;
}
