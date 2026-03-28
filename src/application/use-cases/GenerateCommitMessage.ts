/**
 * Generate Commit Message Use Case
 * Application layer use case for generating commit messages
 * Uses AI provider via port
 */

import { Commit, Diff } from '../../domain/entities';
import { AIProviderPort, BrainInput } from '../../core/ports';

export interface GenerateCommitMessageInput {
  diff: Diff;
  hint?: string;
  language: string;
  debug?: boolean;
}

export interface GenerateCommitMessageOutput {
  commit: Commit;
  provider: string;
}

/**
 * Generate Commit Message Use Case
 * Single responsibility: Generate commit message using AI
 */
export class GenerateCommitMessageUseCase {
  constructor(
    private readonly aiProvider: AIProviderPort
  ) {}

  async execute(input: GenerateCommitMessageInput): Promise<GenerateCommitMessageOutput> {
    // Prepare input for AI provider
    const brainInput: BrainInput = {
      diff: input.diff.content,
      diffData: input.diff.isLarge ? undefined : undefined, // Handle large diffs
      hint: input.hint,
      language: input.language,
      debug: input.debug,
    };

    // Generate message via AI provider
    const result = await this.aiProvider.generateCommitMessage(brainInput);

    if (!result.success || !result.message) {
      throw new Error(result.error || 'Failed to generate commit message');
    }

    // Create commit entity
    const commit = new Commit({
      message: result.message,
      files: input.diff.files.map(f => f.path),
    });

    return {
      commit,
      provider: result.provider || this.aiProvider.getName(),
    };
  }

  /**
   * Regenerate commit message with different hint
   */
  async regenerate(
    input: GenerateCommitMessageInput,
    previousMessage: string
  ): Promise<GenerateCommitMessageOutput> {
    const hint = input.hint 
      ? `${input.hint} (Previous attempt: ${previousMessage})`
      : `Different from: ${previousMessage}`;

    return this.execute({ ...input, hint });
  }
}
