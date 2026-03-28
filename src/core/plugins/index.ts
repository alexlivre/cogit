/**
 * Plugin System Index
 * Exports all plugin-related modules
 */

export * from './types';
export * from './registry';
export * from './stealth.plugin';
export * from './debug.plugin';
export * from './healer.plugin';

// Re-export singleton registry
export { pluginRegistry } from './registry';
