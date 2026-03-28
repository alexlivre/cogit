/**
 * Plugin Registry
 * Manages plugin registration and execution
 * Implements Open/Closed Principle
 */

import { CommandPlugin, CommandContext, PluginResult, PluginHook, HookedPlugin } from './types';

/**
 * Plugin Registry
 * Central manager for all plugins
 */
export class PluginRegistry {
  private plugins: Map<string, CommandPlugin> = new Map();
  private hookedPlugins: Map<PluginHook, HookedPlugin[]> = new Map();
  private initialized: boolean = false;

  /**
   * Register a plugin
   * @param plugin Plugin to register
   */
  register(plugin: CommandPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" already registered. Skipping.`);
      return;
    }

    this.plugins.set(plugin.name, plugin);

    // Register hooked plugins
    if (this.isHookedPlugin(plugin)) {
      const hook = plugin.hook;
      if (!this.hookedPlugins.has(hook)) {
        this.hookedPlugins.set(hook, []);
      }
      this.hookedPlugins.get(hook)!.push(plugin);
    }
  }

  /**
   * Unregister a plugin
   * @param name Plugin name to unregister
   */
  unregister(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    this.plugins.delete(name);

    // Remove from hooked plugins
    if (this.isHookedPlugin(plugin)) {
      const hook = plugin.hook;
      const hooked = this.hookedPlugins.get(hook);
      if (hooked) {
        const index = hooked.indexOf(plugin);
        if (index > -1) {
          hooked.splice(index, 1);
        }
      }
    }

    return true;
  }

  /**
   * Get plugin by name
   * @param name Plugin name
   */
  get(name: string): CommandPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAll(): CommandPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins for specific hook
   * @param hook Plugin hook
   */
  getByHook(hook: PluginHook): HookedPlugin[] {
    return this.hookedPlugins.get(hook) || [];
  }

  /**
   * Initialize all plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.init) {
        await plugin.init();
      }
    }

    this.initialized = true;
  }

  /**
   * Cleanup all plugins
   */
  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
    }

    this.initialized = false;
  }

  /**
   * Execute all enabled plugins in priority order
   * @param context Command context
   * @returns Whether all plugins succeeded
   */
  async executeAll(context: CommandContext): Promise<boolean> {
    const sorted = this.getSortedPlugins();

    for (const plugin of sorted) {
      if (!plugin.enabled) continue;

      try {
        const result = await plugin.execute(context);

        // Update context if modified
        if (result.modifiedContext) {
          Object.assign(context, result.modifiedContext);
        }

        // Stop if plugin indicates to not continue
        if (!result.shouldContinue) {
          return result.success;
        }
      } catch (error) {
        console.error(`Plugin "${plugin.name}" failed:`, error);
        return false;
      }
    }

    return true;
  }

  /**
   * Execute plugins for specific hook
   * @param hook Plugin hook
   * @param context Command context
   */
  async executeHook(hook: PluginHook, context: CommandContext): Promise<boolean> {
    const plugins = this.getByHook(hook);

    for (const plugin of plugins) {
      if (!plugin.enabled) continue;

      try {
        const result = await plugin.execute(context);

        if (result.modifiedContext) {
          Object.assign(context, result.modifiedContext);
        }

        if (!result.shouldContinue) {
          return result.success;
        }
      } catch (error) {
        console.error(`Hooked plugin "${plugin.name}" failed at hook "${hook}":`, error);
        return false;
      }
    }

    return true;
  }

  /**
   * Enable a plugin
   * @param name Plugin name
   */
  enable(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Disable a plugin
   * @param name Plugin name
   */
  disable(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Check if plugin is registered
   * @param name Plugin name
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get count of registered plugins
   */
  get count(): number {
    return this.plugins.size;
  }

  // Private methods

  private getSortedPlugins(): CommandPlugin[] {
    return Array.from(this.plugins.values())
      .sort((a, b) => a.priority - b.priority);
  }

  private isHookedPlugin(plugin: CommandPlugin): plugin is HookedPlugin {
    return 'hook' in plugin;
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
