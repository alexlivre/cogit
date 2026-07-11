/**
 * Cross-platform Command Executor
 * Provides unified command execution for Windows, macOS, and Linux.
 *
 * Two execution modes:
 * - safeExec(command, args[], options?) — spawn-based, shell: false. Use for any
 *   user-influenced input (commit messages, branch names, tag names). Optional
 *   `options.input` is written to the child's stdin and never enters argv.
 * - execCommand(command, options?) — shell-based exec for backward compatibility.
 *   When `options.input` is provided, this transparently routes to safeExec with
 *   a simple whitespace split, so callers can pass strings like "commit -F -".
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { platform, escapePathForShell } from './platform';

const execAsync = promisify(exec);

/**
 * Options for command execution.
 * `input` — when set, the executor writes this string to the child's stdin
 *           (via spawn) and never to argv. This is the safe path for any
 *           user-controlled text (commit messages, etc.).
 * `maxBuffer` — maximum bytes allowed across stdout+stderr combined. When the
 *           accumulated output exceeds this limit, the child is killed and the
 *           Promise rejects. Defaults to 10 MiB, matching the legacy
 *           `execCommand` budget. Set explicitly to disable the cap.
 */
export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  shell?: boolean | string;
  input?: string;
  maxBuffer?: number;
}

/**
 * Result of command execution
 */
export interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Execute a child process with explicit argv, shell disabled.
 *
 * SECURITY: `command` and each `args[i]` are passed directly to the OS as a
 * separate argv element. They are NEVER parsed by a shell, so user-controlled
 * content cannot inject commands. Pass any such content via `options.input`,
 * which is piped through stdin.
 *
 * @param command  Executable name or path (e.g. 'git', 'node', 'C:/bin/tool.exe')
 * @param args     Argument vector. Each element is one argv entry.
 * @param options  cwd, env, timeout, input
 */
export async function safeExec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const { cwd, env, timeout = 30000, input, maxBuffer = 10 * 1024 * 1024 } = options;
  const displayCmd = `${command}${args.length ? ' ' + args.join(' ') : ''}`;

  return new Promise((resolve, reject) => {
    let settled = false;
    let stdout = '';
    let stderr = '';

    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const overflow = (): boolean =>
      stdout.length + stderr.length > maxBuffer;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(
        new Error(`Command timed out after ${timeout}ms: ${displayCmd}`)
      );
    }, timeout);

    if (input !== undefined) {
      child.stdin.on('error', () => {
        // EPIPE if child exited before we finished writing; ignore.
      });
      child.stdin.end(input);
    } else {
      child.stdin.end();
    }

    const onOverflow = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      reject(
        new Error(
          `maxBuffer exceeded (${maxBuffer} bytes) for: ${displayCmd}`
        )
      );
    };

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      if (overflow()) onOverflow();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      if (overflow()) onOverflow();
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        new Error(
          `Command failed: ${displayCmd}\n` +
            `Error: ${err.message}\n` +
            `Stderr: ${stderr}\n` +
            `Stdout: ${stdout}`
        )
      );
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `Command failed (exit ${code}${
            signal ? ', signal ' + signal : ''
          }): ${displayCmd}\n` +
            `Stderr: ${stderr}\n` +
            `Stdout: ${stdout}`
        )
      );
    });
  });
}

/**
 * Execute a Git command using the platform-appropriate executable and argv-only
 * execution. Thin wrapper around `safeExec` that fills in the command name so
 * callers in F1.3/F1.4/F1.5 do not have to repeat the lookup.
 *
 * SECURITY: Same guarantees as `safeExec` — `shell: false`, no argv parsing,
 * `options.input` (when provided) flows through stdin only.
 */
export async function safeExecGit(
  args: string[],
  options?: ExecOptions
): Promise<ExecResult> {
  return safeExec(platform.getGitCommand(), args, options);
}

/**
 * Execute a command string. Two modes:
 *
 * 1. With `options.input` — routes to safeExec (spawn, shell: false). The
 *    command string is split on whitespace; the first token becomes the
 *    executable, the rest become argv. Caller-supplied text goes through
 *    stdin only, so it cannot inject commands.
 *
 * 2. Without `input` — shell-based exec (legacy path, preserved for backward
 *    compatibility). The full string is passed to the platform shell.
 */
export async function execCommand(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  if (options.input !== undefined) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    return safeExec(cmd, args, options);
  }

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
