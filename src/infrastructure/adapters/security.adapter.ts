/**
 * Security Adapter
 * Implements SecurityPort interface
 * Adapts existing security services to port contract
 */

import { SecurityPort, SanitizerResult } from '../../core/ports/index';
import { sanitizeFiles } from '../../services/security/sanitizer';
import { redactDiff } from '../../services/security/redactor';

export class SecurityAdapter implements SecurityPort {
  sanitize(files: string[]): SanitizerResult {
    return sanitizeFiles(files);
  }

  redact(diff: string): string {
    return redactDiff(diff);
  }
}
