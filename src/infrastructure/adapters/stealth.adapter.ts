/**
 * Stealth Adapter
 * Implements StealthPort interface
 * Adapts existing stealth service to port contract
 */

import { StealthPort, StealthResult, StealthRestoreResult } from '../../core/ports/index';
import { 
  stealthStash, 
  stealthRestore, 
  hasPrivateConfig 
} from '../../services/tools/stealth';

export class StealthAdapter implements StealthPort {
  hasConfig(repoPath: string): boolean {
    return hasPrivateConfig(repoPath);
  }

  async stash(repoPath: string): Promise<StealthResult> {
    return await stealthStash(repoPath);
  }

  async restore(repoPath: string): Promise<StealthRestoreResult> {
    return await stealthRestore(repoPath);
  }
}
