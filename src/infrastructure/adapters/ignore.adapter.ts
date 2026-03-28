/**
 * Ignore Adapter
 * Implements IgnorePort interface
 * Adapts existing ignore service to port contract
 */

import { IgnorePort } from '../../core/ports/index';
import { suggestIgnore, addWhitelistEntry, removeWhitelistEntry } from '../../services/tools/ignore';

export class IgnoreAdapter implements IgnorePort {
  async suggest(repoPath: string): Promise<void> {
    return await suggestIgnore(repoPath);
  }

  addWhitelist(repoPath: string, pattern: string): void {
    addWhitelistEntry(repoPath, pattern, 'Added via adapter');
  }

  removeWhitelist(repoPath: string, pattern: string): void {
    removeWhitelistEntry(repoPath, pattern);
  }
}
