/**
 * Execute Commit Use Case
 * Application layer use case for executing git commits
 */

import { Commit, Repository } from '../../domain/entities';
import { GitExecutorPort, HealerPort, ExecutorResult } from '../../core/ports';

export interface ExecuteCommitInput {
  commit: Commit;
  repository: Repository;
  shouldPush: boolean;
  dryRun: boolean;
}

export interface ExecuteCommitOutput {
  success: boolean;
  output?: string;
  error?: string;
  healingAttempts?: number;
}

/**
 * Execute Commit Use Case
 * Single responsibility: Execute git commit operations
 */
export class ExecuteCommitUseCase {
  constructor(
    private readonly gitExecutor: GitExecutorPort,
    private readonly healer: HealerPort
  ) {}

  async execute(input: ExecuteCommitInput): Promise<ExecuteCommitOutput> {
    // Dry run mode
    if (input.dryRun) {
      return {
        success: true,
        output: this.buildDryRunOutput(input),
      };
    }

    // Execute commit
    const result = await this.gitExecutor.executeCommit(
      input.repository.path,
      input.commit.message,
      input.shouldPush
    );

    if (result.success) {
      return { success: true, output: result.output };
    }

    // Attempt healing on push failure
    if (input.shouldPush && result.error?.includes('push')) {
      return this.handlePushFailure(input, result.error);
    }

    return { success: false, error: result.error };
  }

  private async handlePushFailure(
    input: ExecuteCommitInput,
    error: string
  ): Promise<ExecuteCommitOutput> {
    const healResult = await this.healer.heal({
      repoPath: input.repository.path,
      failedCommand: 'git push',
      errorOutput: error,
      maxRetries: 3,
    });

    if (healResult.success) {
      return {
        success: true,
        healingAttempts: healResult.attempts.length,
      };
    }

    return {
      success: false,
      error: 'Push failed after healing attempts',
      healingAttempts: healResult.attempts.length,
    };
  }

  private buildDryRunOutput(input: ExecuteCommitInput): string {
    const commands = [
      'git add -A',
      `git commit -m "${input.commit.message}"`,
    ];

    if (input.shouldPush) {
      commands.push('git push');
    }

    return commands.join('\n');
  }
}
