/**
 * Cross-platform Command Executor
 * Provides unified command execution for Windows, macOS, and Linux
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { platform, escapePathForShell } from './platform';

const execAsync = promisify(exec);

/**
 * Options for command execution
 */
export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  shell?: boolean | string;
}

/**
 * Result of command execution
 */
export interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Execute a command in a cross-platform way
 * Automatically handles shell selection and path escaping
 */
export async function execCommand(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  const { cwd, env, timeout = 30000, shell: customShell } = options;

  // Determine shell to use
  const shell = customShell !== undefined 
    ? customShell 
    : platform.getShell();

  // Build exec options
  const execOptions = {
    cwd: cwd ? escapePathForShell(cwd) : process.cwd(),
    env: { ...process.env, ...env },
    timeout,
    shell: typeof shell === 'string' ? shell : platform.getShell(),
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
  };

  try {
    const result = await execAsync(command, execOptions);
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
    };
  } catch (error: any) {
    // Include stderr in error for better error messages
    const stderr = error.stderr || '';
    const stdout = error.stdout || '';
    
    throw new Error(
      `Command failed: ${command}\n` +
      `Error: ${error.message}\n` +
      `Stderr: ${stderr}\n` +
      `Stdout: ${stdout}`
    );
  }
}

/**
 * Execute a Git command in a cross-platform way
 * Uses the correct Git executable for the current platform
 */
export async function execGit(
  args: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  const gitCommand = platform.getGitCommand();
  const fullCommand = `${gitCommand} ${args}`;
  
  return execCommand(fullCommand, options);
}

/**
 * Execute a command and return trimmed stdout
 */
export async function execCommandTrimmed(
  command: string,
  options: ExecOptions = {}
): Promise<string> {
  const result = await execCommand(command, options);
  return result.stdout.trim();
}

/**
 * Execute a Git command and return trimmed stdout
 */
export async function execGitTrimmed(
  args: string,
  options: ExecOptions = {}
): Promise<string> {
  const result = await execGit(args, options);
  return result.stdout.trim();
}

/**
 * Check if a command is available on the system
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    if (platform.isWindows) {
      await execCommand(`where ${command}`, { timeout: 5000 });
    } else {
      await execCommand(`which ${command}`, { timeout: 5000 });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Git is available on the system
 */
export async function gitExists(): Promise<boolean> {
  return commandExists(platform.getGitCommand());
}
