/**
 * Scan Repository Use Case
 * Application layer use case for scanning git repository
 * Orchestrates domain entities and infrastructure ports
 */

import { Repository, Diff, FileChange } from '../../domain/entities';
import { GitScannerPort, ScanResult } from '../../core/ports';

export interface ScanRepositoryInput {
  repoPath: string;
}

export interface ScanRepositoryOutput {
  repository: Repository;
  diff: Diff;
  hasChanges: boolean;
}

/**
 * Scan Repository Use Case
 * Single responsibility: Scan repository and return domain entities
 */
export class ScanRepositoryUseCase {
  constructor(
    private readonly gitScanner: GitScannerPort
  ) {}

  async execute(input: ScanRepositoryInput): Promise<ScanRepositoryOutput> {
    // Scan repository via port
    const scanResult = await this.gitScanner.scan(input.repoPath);

    // Create domain entities
    const repository = this.createRepositoryEntity(input.repoPath, scanResult);
    const diff = this.createDiffEntity(scanResult);

    return {
      repository,
      diff,
      hasChanges: scanResult.hasChanges,
    };
  }

  private createRepositoryEntity(path: string, result: ScanResult): Repository {
    return new Repository({
      path,
      isGitRepo: result.isRepo,
      currentBranch: '', // Will be filled by another use case if needed
      hasUncommittedChanges: result.hasChanges,
    });
  }

  private createDiffEntity(result: ScanResult): Diff {
    const files = this.mapFiles(result);
    const { additions, deletions } = this.calculateStats(result.diff);

    return new Diff({
      content: result.diff,
      files,
      totalAdditions: additions,
      totalDeletions: deletions,
      isLarge: result.diff.length > 100000,
    });
  }

  private mapFiles(result: ScanResult): FileChange[] {
    const files: FileChange[] = [];

    // Map staged files
    for (const file of result.stagedFiles) {
      files.push({
        path: file,
        status: 'modified',
        additions: 0,
        deletions: 0,
        isBinary: false,
      });
    }

    // Map unstaged/untracked files
    for (const file of result.unstagedFiles) {
      files.push({
        path: file,
        status: 'untracked',
        additions: 0,
        deletions: 0,
        isBinary: false,
      });
    }

    return files;
  }

  private calculateStats(diff: string): { additions: number; deletions: number } {
    let additions = 0;
    let deletions = 0;

    const lines = diff.split('\n');
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }

    return { additions, deletions };
  }
}
