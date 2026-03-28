/**
 * Validate Security Use Case
 * Application layer use case for security validation
 */

import { Diff } from '../../domain/entities';
import { SecurityPort, SanitizerResult } from '../../core/ports';
import { SecurityError } from '../../core/errors';

export interface ValidateSecurityInput {
  diff: Diff;
  repoPath: string;
}

export interface ValidateSecurityOutput {
  isSecure: boolean;
  blockedFiles: string[];
  redactedDiff: string;
}

/**
 * Validate Security Use Case
 * Single responsibility: Validate files against security rules
 */
export class ValidateSecurityUseCase {
  constructor(
    private readonly securityService: SecurityPort
  ) {}

  async execute(input: ValidateSecurityInput): Promise<ValidateSecurityOutput> {
    // Get file paths from diff
    const filePaths = input.diff.files.map(f => f.path);

    // Sanitize files
    const sanitizeResult = this.securityService.sanitize(filePaths);

    if (!sanitizeResult.isClean) {
      throw new SecurityError(sanitizeResult.blockedFiles);
    }

    // Redact sensitive content from diff
    const redactedDiff = this.securityService.redact(input.diff.content);

    return {
      isSecure: true,
      blockedFiles: [],
      redactedDiff,
    };
  }

  /**
   * Check if files are safe without throwing
   */
  checkFiles(files: string[]): SanitizerResult {
    return this.securityService.sanitize(files);
  }

  /**
   * Redact diff content
   */
  redactContent(content: string): string {
    return this.securityService.redact(content);
  }
}
