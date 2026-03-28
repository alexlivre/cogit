/**
 * Handle Branch Use Case
 * Application layer use case for branch operations
 */

import { Repository } from '../../domain/entities';
import { BranchPort, BranchInfo, ExecutorResult } from '../../core/ports';

export interface HandleBranchInput {
  repository: Repository;
  branchName: string;
  createIfNotExists: boolean;
}

export interface HandleBranchOutput {
  repository: Repository;
  branchName: string;
  created: boolean;
  switched: boolean;
}

/**
 * Handle Branch Use Case
 * Single responsibility: Manage branch operations
 */
export class HandleBranchUseCase {
  constructor(
    private readonly branchService: BranchPort
  ) {}

  async execute(input: HandleBranchInput): Promise<HandleBranchOutput> {
    // List existing branches
    const branches = await this.branchService.list(input.repository.path);
    const existingBranch = branches.find(b => b.name === input.branchName);

    if (existingBranch) {
      // Switch to existing branch
      const result = await this.branchService.switch(
        input.repository.path,
        input.branchName
      );

      if (!result.success) {
        throw new Error(`Failed to switch to branch: ${result.error}`);
      }

      return {
        repository: input.repository.withBranch(input.branchName),
        branchName: input.branchName,
        created: false,
        switched: true,
      };
    }

    // Create new branch if requested
    if (input.createIfNotExists) {
      const result = await this.branchService.create(
        input.repository.path,
        input.branchName
      );

      if (!result.success) {
        throw new Error(`Failed to create branch: ${result.error}`);
      }

      return {
        repository: input.repository.withBranch(input.branchName),
        branchName: input.branchName,
        created: true,
        switched: true,
      };
    }

    throw new Error(`Branch "${input.branchName}" does not exist and createIfNotExists is false`);
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(repoPath: string): Promise<string> {
    const branches = await this.branchService.list(repoPath);
    const current = branches.find(b => b.current);
    return current?.name || 'unknown';
  }

  /**
   * List all branches
   */
  async listBranches(repoPath: string): Promise<BranchInfo[]> {
    return this.branchService.list(repoPath);
  }
}
