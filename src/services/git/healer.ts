import { safeExecGit } from '../../utils/executor';
import { OpenRouterProvider } from '../ai/providers/openrouter';
import { CONFIG } from '../../config/env';
import { isValidGitCommand } from './git-command-validator';

export interface HealerInput {
  repoPath: string;
  failedCommand: string;
  errorOutput: string;
  maxRetries: number;
}

export interface HealerAttempt {
  attempt: number;
  commands: string[];
  success: boolean;
  error?: string;
}

const HEALER_SYSTEM_PROMPT = `You are a Git Error Resolution Specialist.

Analyze the error and provide ONLY the commands to fix it, one per line.
No explanations, no code blocks, no markdown.

Rules:
- For 'non-fast-forward' errors: suggest 'git pull --rebase'
- For conflicts: suggest only 'git add .' and 'git rebase --continue'
- Do NOT suggest 'git rebase --abort' unless giving up
- Do NOT suggest destructive commands like 'git push --force'
- If a command fails, execution stops and I'll return with the error
- Keep commands simple and safe`;

function tokenize(line: string): string[] {
  return line.trim().split(/\s+/).filter((t) => t.length > 0);
}

export async function healGitError(input: HealerInput): Promise<{ success: boolean; attempts: HealerAttempt[] }> {
  const attempts: HealerAttempt[] = [];
  const provider = new OpenRouterProvider({
    apiKey: CONFIG.OPENROUTER_API_KEY || '',
    model: CONFIG.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
  });

  let currentError = input.errorOutput;

  for (let attempt = 1; attempt <= input.maxRetries; attempt++) {
    const historyContext = attempts.map(a =>
      `Attempt ${a.attempt}: Commands: ${a.commands.join(', ')} - Result: ${a.success ? 'Success' : a.error}`
    ).join('\n');

    const userPrompt = `Failed command: ${input.failedCommand}
Error output:
${currentError}

Previous attempts:
${historyContext || 'None'}

Provide commands to fix this error:`;

    const response = await provider.generate([
      { role: 'system', content: HEALER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    const rawLines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('```') && !line.startsWith('#'));

    const safeCommands: string[] = [];
    const rejectedReasons: string[] = [];

    for (const line of rawLines) {
      const argv = tokenize(line);
      const validation = isValidGitCommand(argv);
      if (!validation.safe) {
        rejectedReasons.push(`${line} -> ${validation.reason}`);
        continue;
      }
      safeCommands.push(line);
    }

    if (safeCommands.length === 0) {
      attempts.push({
        attempt,
        commands: rejectedReasons.length > 0
          ? [`Rejected: ${rejectedReasons.join('; ')}`]
          : ['No commands suggested'],
        success: false,
        error: 'AI suggested no safe commands',
      });
      continue;
    }

    let allSuccess = true;
    let lastError = '';

    for (const line of safeCommands) {
      const argv = tokenize(line);
      const gitArgs = argv.slice(1);
      try {
        await safeExecGit(gitArgs, { cwd: input.repoPath });
      } catch (error) {
        allSuccess = false;
        lastError = error instanceof Error ? error.message : String(error);
        break;
      }
    }

    attempts.push({
      attempt,
      commands: safeCommands,
      success: allSuccess,
      error: allSuccess ? undefined : lastError,
    });

    if (allSuccess) {
      try {
        await safeExecGit(['push'], { cwd: input.repoPath });
        return { success: true, attempts };
      } catch (error) {
        currentError = error instanceof Error ? error.message : String(error);
      }
    } else {
      currentError = lastError;
    }
  }

  return { success: false, attempts };
}
