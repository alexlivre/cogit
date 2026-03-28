/**
 * Healer Adapter
 * Implements HealerPort interface
 * Adapts existing healer service to port contract
 */

import { HealerPort, HealerInput, HealerResult } from '../../core/ports/index';
import { healGitError } from '../../services/git/healer';

export class HealerAdapter implements HealerPort {
  async heal(input: HealerInput): Promise<HealerResult> {
    return await healGitError({
      repoPath: input.repoPath,
      failedCommand: input.failedCommand,
      errorOutput: input.errorOutput,
      maxRetries: input.maxRetries,
    });
  }
}
