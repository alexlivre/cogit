/**
 * Platform Detection and Compatibility Utilities
 * Provides cross-platform support for Windows, macOS, and Linux
 */

import { platform as osPlatform, homedir } from 'os';
import { delimiter, sep } from 'path';

/**
 * Platform information and utilities
 */
export const platform = {
  /**
   * Check if running on Windows
   */
  isWindows: osPlatform() === 'win32',

  /**
   * Check if running on macOS
   */
  isMacOS: osPlatform() === 'darwin',

  /**
   * Check if running on Linux
   */
  isLinux: osPlatform() === 'linux',

  /**
   * Get the current platform name
   */
  getName(): 'windows' | 'macos' | 'linux' | 'unknown' {
    if (this.isWindows) return 'windows';
    if (this.isMacOS) return 'macos';
    if (this.isLinux) return 'linux';
    return 'unknown';
  },

  /**
   * Get the appropriate shell for the current platform
   * Windows: cmd.exe or powershell.exe
   * Unix: /bin/bash or /bin/sh
   */
  getShell(): string {
    if (this.isWindows) {
      // Prefer PowerShell on Windows if available
      return process.env.COMSPEC || 'cmd.exe';
    }
    // Unix-like systems
    return process.env.SHELL || '/bin/bash';
  },

  /**
   * Get the Git command for the current platform
   * Windows: git.exe
   * Unix: git
   */
  getGitCommand(): string {
    return this.isWindows ? 'git.exe' : 'git';
  },

  /**
   * Get the home directory path
   */
  getHomeDir(): string {
    return process.env.HOME || 
           process.env.USERPROFILE || 
           process.env.HOMEPATH || 
           homedir();
  },

  /**
   * Get the path separator for the current platform
   */
  getPathSeparator(): string {
    return sep;
  },

  /**
   * Get the path delimiter for PATH environment variable
   * Windows: ;
   * Unix: :
   */
  getPathDelimiter(): string {
    return delimiter;
  },

  /**
   * Check if a path contains spaces or special characters
   */
  hasSpecialChars(path: string): boolean {
    return /[&()[]{}^=;!'+,`~\s]/.test(path);
  },

  /**
   * Check if running in a CI environment
   */
  isCI(): boolean {
    return !!(process.env.CI || process.env.CONTINUOUS_INTEGRATION);
  },
};

/**
 * Normalize a path for the current platform
 * Converts forward slashes to backslashes on Windows and vice versa on Unix
 */
export function normalizePathForOS(path: string): string {
  if (!path) return path;
  
  // Replace all separators with the correct one for the current platform
  const normalized = path.replace(/[\\/]/g, platform.getPathSeparator());
  
  return normalized;
}

/**
 * Escape a path for shell execution
 * Adds quotes if necessary for paths with spaces or special characters
 */
export function escapePathForShell(path: string): string {
  if (!path) return path;
  
  // Normalize the path first
  const normalized = normalizePathForOS(path);
  
  // Check if quotes are needed (spaces or special chars)
  const needsQuotes = /\s/.test(normalized) || platform.hasSpecialChars(normalized);
  
  if (needsQuotes) {
    // Use double quotes (works on both Windows and Unix)
    return `"${normalized}"`;
  }
  
  return normalized;
}

/**
 * Resolve a path that may contain home directory reference
 * Supports both ~ (Unix) and %USERPROFILE% (Windows)
 */
export function resolveHome(path: string): string {
  if (!path) return path;
  
  const home = platform.getHomeDir();
  
  // Unix-style home reference
  if (path.startsWith('~/') || path === '~') {
    return path.replace('~', home);
  }
  
  // Windows-style home reference
  if (path.startsWith('%USERPROFILE%')) {
    return path.replace('%USERPROFILE%', home);
  }
  
  return path;
}

/**
 * Get environment variable in a cross-platform way
 * Checks both uppercase and lowercase variants
 */
export function getEnvVar(name: string): string | undefined {
  // Try exact match first
  if (process.env[name]) {
    return process.env[name];
  }
  
  // Try uppercase on Windows (case-insensitive)
  if (platform.isWindows) {
    const upper = name.toUpperCase();
    if (process.env[upper]) {
      return process.env[upper];
    }
  }
  
  return undefined;
}
