/**
 * Commit Review Handler - Manages commit message review loop
 * Single Responsibility: Handle user interaction for commit message review
 */

import chalk from 'chalk';
import ora from 'ora';
import { reviewCommitMessage, editCommitMessage } from '../../ui/prompts';
import { generateCommitMessage } from '../../../services/ai/brain';
import { AIError } from '../../../core/errors';
import { t } from '../../../config/i18n';

export interface ReviewOptions {
  skipReview: boolean;
  hint?: string;
  language: string;
  diff: string;
  nobuild?: boolean;
}

export interface ReviewResult {
  message: string;
  cancelled: boolean;
}

/**
 * Handle commit message review loop
 * @param initialMessage Initial AI-generated message
 * @param options Review options
 * @returns Final commit message or cancellation
 */
export async function handleCommitReview(
  initialMessage: string,
  options: ReviewOptions
): Promise<ReviewResult> {
  let finalMessage = initialMessage;

  // Add [CI Skip] prefix if nobuild option
  if (options.nobuild) {
    finalMessage = `[CI Skip] ${finalMessage}`;
  }

  // Skip review if --yes flag
  if (options.skipReview) {
    return { message: finalMessage, cancelled: false };
  }

  let reviewing = true;

  while (reviewing) {
    const action = await reviewCommitMessage(finalMessage);

    switch (action) {
      case 'execute':
        reviewing = false;
        break;

      case 'regenerate':
        const regenerateSpinner = ora(t('auto.generating')).start();
        const regenerateResult = await generateCommitMessage({
          diff: options.diff,
          hint: options.hint,
          language: options.language,
        });
        regenerateSpinner.succeed();

        if (!regenerateResult.success) {
          throw new AIError(
            regenerateResult.error || 'AI regeneration failed'
          );
        }

        finalMessage = regenerateResult.message!;
        if (options.nobuild) {
          finalMessage = `[CI Skip] ${finalMessage}`;
        }
        break;

      case 'edit':
        finalMessage = await editCommitMessage(finalMessage);
        break;

      case 'cancel':
        console.log(chalk.yellow(t('auto.cancel')));
        return { message: '', cancelled: true };
    }
  }

  return { message: finalMessage, cancelled: false };
}
