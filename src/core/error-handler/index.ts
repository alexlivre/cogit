/**
 * Error Handler Module
 * Centralized error classification, solutions, and presentation
 */

export {
  // Types
  ErrorCategory,
  ErrorSubtype,
  GitErrorSubtype,
  AIErrorSubtype,
  NetworkErrorSubtype,
  ConfigErrorSubtype,
  ClassifiedError,
  // Functions
  classifyError,
  isRecoverable,
  requiresUserAction,
} from './error-classifier';

export {
  ErrorSolution,
  getSolution,
  formatSolution,
} from './error-solutions';

export {
  presentError,
  presentErrorCompact,
  presentAIFallbackOptions,
  presentNetworkError,
  presentRecoverySuccess,
  presentErrorSummary,
} from './error-presenter';

/**
 * Main error handler function
 * Classifies, formats, and presents an error
 */
export function handleError(error: Error | string, options?: { compact?: boolean }): void {
  const { classifyError, presentError, presentErrorCompact } = require('./error-classifier');
  const classified = classifyError(error);

  if (options?.compact) {
    presentErrorCompact(classified);
  } else {
    presentError(classified);
  }
}
