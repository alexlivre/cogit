/**
 * Branch Adapter
 * Implements BranchPort interface
 * Adapts existing branch service to port contract
 */

import { BranchPort, BranchInfo, ExecutorResult } from '../../core/ports/index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BranchAdapter implements BranchPort {
  async list(repoPath: string): Promise<BranchInfo[]> {
    try {
      const { stdout } = await execAsync(
        'git branch -a --format="%(refname:short)|%(HEAD)|%(upstream:short)"',
        { cwd: repoPath }
      );

      return stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [name, head, upstream] = line.split('|');
          return {
            name: name.replace('remotes/origin/', '').replace('origin/', ''),
            current: head === '*',
            remote: !!upstream || name.includes('origin/'),
          };
        });
    } catch {
      return [];
    }
  }

  async create(repoPath: string, name: string): Promise<ExecutorResult> {
    try {
      await execAsync(`git checkout -b "${name}"`, { cwd: repoPath });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async switch(repoPath: string, name: string): Promise<ExecutorResult> {
    try {
      await execAsync(`git checkout "${name}"`, { cwd: repoPath });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async delete(repoPath: string, name: string): Promise<ExecutorResult> {
    try {
      await execAsync(`git branch -d "${name}"`, { cwd: repoPath });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
