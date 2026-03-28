import { execGit, execCommand } from '../../utils/executor';
import { OpenRouterProvider } from '../ai/providers/openrouter';
import { CONFIG } from '../../config/env';

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

export async function healGitError(input: HealerInput): Promise<{ success: boolean; attempts: HealerAttempt[] }> {
  const attempts: HealerAttempt[] = [];
  const provider = new OpenRouterProvider({
    apiKey: CONFIG.OPENROUTER_API_KEY || '',
    model: CONFIG.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
  });
  
  let currentError = input.errorOutput;
  
  for (let attempt = 1; attempt <= input.maxRetries; attempt++) {
    // Build context with history
    const historyContext = attempts.map(a => 
      `Attempt ${a.attempt}: Commands: ${a.commands.join(', ')} - Result: ${a.success ? 'Success' : a.error}`
    ).join('\n');
    
    const userPrompt = `Failed command: ${input.failedCommand}
Error output:
${currentError}

Previous attempts:
${historyContext || 'None'}

Provide commands to fix this error:`;

    // Get commands from AI
    const response = await provider.generate([
      { role: 'system', content: HEALER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);
    
    // Parse commands
    const commands = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('```') && !line.startsWith('#'));
    
    // Validate commands (safety check)
    const safeCommands = commands.filter(cmd => {
      const lowerCmd = cmd.toLowerCase();
      // Block dangerous commands
      if (lowerCmd.includes('--force') || lowerCmd.includes('-f ')) {
        return false;
      }
      if (lowerCmd.includes('reset --hard')) {
        return false;
      }
      if (lowerCmd.includes('clean -fd')) {
        return false;
      }
      return true;
    });
    
    if (safeCommands.length === 0) {
      attempts.push({
        attempt,
        commands: ['No safe commands suggested'],
        success: false,
        error: 'AI suggested no safe commands',
      });
      continue;
    }
    
    // Execute commands
    let allSuccess = true;
    let lastError = '';
    
    for (const cmd of safeCommands) {
      try {
        await execCommand(cmd, { cwd: input.repoPath });
      } catch (error) {
        allSuccess = false;
        lastError = String(error);
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
      // Try original push again
      try {
        await execGit('push', { cwd: input.repoPath });
        return { success: true, attempts };
      } catch (error) {
        currentError = String(error);
      }
    } else {
      currentError = lastError;
    }
  }
  
  return { success: false, attempts };
}
