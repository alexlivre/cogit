import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ScanResult {
  isRepo: boolean;
  hasChanges: boolean;
  stagedFiles: string[];
  unstagedFiles: string[];
  diff: string;
}

export async function scanRepository(repoPath: string): Promise<ScanResult> {
  try {
    await execAsync('git rev-parse --is-inside-work-tree', { cwd: repoPath });
    
    const { stdout: stagedOutput } = await execAsync('git diff --name-only --cached', { cwd: repoPath });
    const stagedFiles = stagedOutput.trim().split('\n').filter(Boolean);
    
    const { stdout: unstagedOutput } = await execAsync('git diff --name-only', { cwd: repoPath });
    const unstagedFiles = unstagedOutput.trim().split('\n').filter(Boolean);
    
    const { stdout: diffOutput } = await execAsync('git diff HEAD', { cwd: repoPath });
    
    const { stdout: untrackedOutput } = await execAsync('git ls-files --others --exclude-standard', { cwd: repoPath });
    const untrackedFiles = untrackedOutput.trim().split('\n').filter(Boolean);
    
    const hasChanges = stagedFiles.length > 0 || unstagedFiles.length > 0 || untrackedFiles.length > 0;
    
    return {
      isRepo: true,
      hasChanges,
      stagedFiles,
      unstagedFiles: [...unstagedFiles, ...untrackedFiles],
      diff: diffOutput,
    };
  } catch {
    return {
      isRepo: false,
      hasChanges: false,
      stagedFiles: [],
      unstagedFiles: [],
      diff: '',
    };
  }
}
