/**
 * Git Scanner Adapter
 * Implements GitScannerPort interface
 * Adapts existing scanner service to port contract
 */

import { GitScannerPort, ScanResult } from '../../core/ports/index';
import { scanRepository } from '../../services/git/scanner';

export class GitScannerAdapter implements GitScannerPort {
  async scan(repoPath: string): Promise<ScanResult> {
    return await scanRepository(repoPath);
  }
}
