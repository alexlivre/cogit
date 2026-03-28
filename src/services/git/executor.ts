import { execGit } from '../../utils/executor';

export interface ExecutorResult {
  success: boolean;
  output?: string;
  error?: string;
}

export async function gitAdd(repoPath: string): Promise<ExecutorResult> {
  try {
    const { stdout } = await execGit('add -A', { cwd: repoPath });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function gitCommit(repoPath: string, message: string): Promise<ExecutorResult> {
  try {
    const escapedMessage = message.replace(/"/g, '\\"');
    const { stdout } = await execGit(`commit -m "${escapedMessage}"`, { cwd: repoPath });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function gitPush(repoPath: string): Promise<ExecutorResult> {
  try {
    const { stdout } = await execGit('push', { cwd: repoPath });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function executeCommit(repoPath: string, message: string, shouldPush: boolean = true): Promise<ExecutorResult> {
  const addResult = await gitAdd(repoPath);
  if (!addResult.success) {
    return addResult;
  }
  
  const commitResult = await gitCommit(repoPath, message);
  if (!commitResult.success) {
    return commitResult;
  }
  
  if (shouldPush) {
    const pushResult = await gitPush(repoPath);
    if (!pushResult.success) {
      return pushResult;
    }
  }
  
  return { success: true, output: commitResult.output };
}
