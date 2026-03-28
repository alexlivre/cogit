/**
 * Error Classifier - Classifies errors by category and subtype
 * Single Responsibility: Identify error type from original message
 */

export type ErrorCategory = 'GIT' | 'AI' | 'NETWORK' | 'CONFIG';

export type GitErrorSubtype =
  | 'SUBMODULE_EMPTY'
  | 'NOT_REPO'
  | 'NO_CHANGES'
  | 'PUSH_REJECTED'
  | 'CONFLICT'
  | 'MERGE_CONFLICT'
  | 'UNTRACKED_FILES'
  | 'PERMISSION_DENIED'
  | 'HOOK_FAILED'
  | 'LFS_ERROR'
  | 'UNKNOWN';

export type AIErrorSubtype =
  | 'NO_PROVIDER'
  | 'CONNECTION_FAILED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMIT'
  | 'AUTH_INVALID'
  | 'TIMEOUT'
  | 'RESPONSE_INVALID'
  | 'ALL_FAILED'
  | 'UNKNOWN';

export type NetworkErrorSubtype =
  | 'NO_INTERNET'
  | 'GITHUB_UNREACHABLE'
  | 'TIMEOUT'
  | 'DNS_FAILED'
  | 'PROXY_ERROR'
  | 'SSL_ERROR'
  | 'UNKNOWN';

export type ConfigErrorSubtype =
  | 'NO_API_KEY'
  | 'INVALID_CONFIG'
  | 'FILE_NOT_FOUND'
  | 'PERMISSION_ERROR'
  | 'UNKNOWN';

export type ErrorSubtype =
  | GitErrorSubtype
  | AIErrorSubtype
  | NetworkErrorSubtype
  | ConfigErrorSubtype;

export interface ClassifiedError {
  category: ErrorCategory;
  subtype: ErrorSubtype;
  originalError: string;
  recoverable: boolean;
  requiresUserAction: boolean;
  context?: Record<string, string>;
}

/**
 * Git error patterns for classification
 */
const GIT_PATTERNS: Array<{
  pattern: RegExp;
  subtype: GitErrorSubtype;
  recoverable: boolean;
  contextExtractor?: (match: RegExpMatchArray) => Record<string, string>;
}> = [
  {
    pattern: /does not have a commit checked out|unable to index file.*does not have a commit/i,
    subtype: 'SUBMODULE_EMPTY',
    recoverable: true,
    contextExtractor: (match) => {
      const dirMatch = match.input?.match(/'([^']+)\/'/);
      return { directory: dirMatch?.[1] || 'unknown' };
    },
  },
  {
    pattern: /not a git repository/i,
    subtype: 'NOT_REPO',
    recoverable: false,
  },
  {
    pattern: /nothing to commit|no changes added/i,
    subtype: 'NO_CHANGES',
    recoverable: true,
  },
  {
    pattern: /non-fast-forward|rejected.*would be overwritten/i,
    subtype: 'PUSH_REJECTED',
    recoverable: true,
  },
  {
    pattern: /merge conflict|conflict.*in/i,
    subtype: 'CONFLICT',
    recoverable: true,
    contextExtractor: (match) => {
      const fileMatch = match.input?.match(/conflict.*in\s+(\S+)/i);
      return { file: fileMatch?.[1] || 'unknown' };
    },
  },
  {
    pattern: /permission denied|access denied/i,
    subtype: 'PERMISSION_DENIED',
    recoverable: false,
  },
  {
    pattern: /hook.*failed|pre-commit.*failed/i,
    subtype: 'HOOK_FAILED',
    recoverable: true,
  },
];

/**
 * AI error patterns for classification
 */
const AI_PATTERNS: Array<{
  pattern: RegExp;
  subtype: AIErrorSubtype;
  recoverable: boolean;
  contextExtractor?: (match: RegExpMatchArray) => Record<string, string>;
}> = [
  {
    pattern: /ECONNREFUSED|connection refused|fetch failed.*localhost/i,
    subtype: 'CONNECTION_FAILED',
    recoverable: true,
    contextExtractor: (match) => {
      const urlMatch = match.input?.match(/(https?:\/\/[^\s]+)/i);
      return { url: urlMatch?.[1] || 'localhost' };
    },
  },
  {
    pattern: /model.*not found|model.*not installed/i,
    subtype: 'MODEL_NOT_FOUND',
    recoverable: true,
    contextExtractor: (match) => {
      const modelMatch = match.input?.match(/model\s+['"]?([^'"\s]+)['"]?/i);
      return { model: modelMatch?.[1] || 'unknown' };
    },
  },
  {
    pattern: /rate limit|too many requests|429/i,
    subtype: 'RATE_LIMIT',
    recoverable: true,
  },
  {
    pattern: /invalid.*api.*key|unauthorized|401|authentication failed/i,
    subtype: 'AUTH_INVALID',
    recoverable: false,
  },
  {
    pattern: /timeout|timed out|ETIMEDOUT/i,
    subtype: 'TIMEOUT',
    recoverable: true,
  },
  {
    pattern: /no ai providers available|all providers failed|all.*failed/i,
    subtype: 'ALL_FAILED',
    recoverable: true,
  },
  {
    pattern: /Ollama not running|Ollama not responding|not running.*start.*ollama serve/i,
    subtype: 'CONNECTION_FAILED',
    recoverable: true,
    contextExtractor: () => ({ provider: 'Ollama' }),
  },
];

/**
 * Network error patterns for classification
 */
const NETWORK_PATTERNS: Array<{
  pattern: RegExp;
  subtype: NetworkErrorSubtype;
  recoverable: boolean;
}> = [
  {
    pattern: /ENOTFOUND|getaddrinfo.*failed|dns.*error/i,
    subtype: 'DNS_FAILED',
    recoverable: true,
  },
  {
    pattern: /no internet|network unreachable|offline/i,
    subtype: 'NO_INTERNET',
    recoverable: true,
  },
  {
    pattern: /github.*unreachable|cannot connect to github/i,
    subtype: 'GITHUB_UNREACHABLE',
    recoverable: true,
  },
  {
    pattern: /SSL.*error|certificate.*invalid|CERT/i,
    subtype: 'SSL_ERROR',
    recoverable: false,
  },
];

/**
 * Config error patterns for classification
 */
const CONFIG_PATTERNS: Array<{
  pattern: RegExp;
  subtype: ConfigErrorSubtype;
  recoverable: boolean;
}> = [
  {
    pattern: /api key not configured|no api key|API_KEY.*undefined/i,
    subtype: 'NO_API_KEY',
    recoverable: false,
  },
  {
    pattern: /invalid config|config.*error|parse.*failed/i,
    subtype: 'INVALID_CONFIG',
    recoverable: false,
  },
  {
    pattern: /file not found|cannot find|ENOENT/i,
    subtype: 'FILE_NOT_FOUND',
    recoverable: false,
  },
];

/**
 * Classify an error message into category and subtype
 */
export function classifyError(error: Error | string): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : error;
  const lowerMessage = errorMessage.toLowerCase();

  // Try Git patterns
  for (const { pattern, subtype, recoverable, contextExtractor } of GIT_PATTERNS) {
    const match = errorMessage.match(pattern);
    if (match) {
      return {
        category: 'GIT',
        subtype,
        originalError: errorMessage,
        recoverable,
        requiresUserAction: !recoverable,
        context: contextExtractor?.(match),
      };
    }
  }

  // Try AI patterns
  for (const { pattern, subtype, recoverable, contextExtractor } of AI_PATTERNS) {
    const match = errorMessage.match(pattern);
    if (match) {
      return {
        category: 'AI',
        subtype,
        originalError: errorMessage,
        recoverable,
        requiresUserAction: subtype === 'AUTH_INVALID' || subtype === 'NO_PROVIDER',
        context: contextExtractor?.(match),
      };
    }
  }

  // Try Network patterns
  for (const { pattern, subtype, recoverable } of NETWORK_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return {
        category: 'NETWORK',
        subtype,
        originalError: errorMessage,
        recoverable,
        requiresUserAction: false,
      };
    }
  }

  // Try Config patterns
  for (const { pattern, subtype, recoverable } of CONFIG_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return {
        category: 'CONFIG',
        subtype,
        originalError: errorMessage,
        recoverable,
        requiresUserAction: true,
      };
    }
  }

  // Default to UNKNOWN in appropriate category based on keywords
  if (lowerMessage.includes('git') || lowerMessage.includes('commit') || lowerMessage.includes('push')) {
    return {
      category: 'GIT',
      subtype: 'UNKNOWN',
      originalError: errorMessage,
      recoverable: false,
      requiresUserAction: true,
    };
  }

  if (lowerMessage.includes('ai') || lowerMessage.includes('provider') || lowerMessage.includes('model')) {
    return {
      category: 'AI',
      subtype: 'UNKNOWN',
      originalError: errorMessage,
      recoverable: false,
      requiresUserAction: true,
    };
  }

  // Fallback to generic error
  return {
    category: 'CONFIG',
    subtype: 'UNKNOWN',
    originalError: errorMessage,
    recoverable: false,
    requiresUserAction: true,
  };
}

/**
 * Check if error is recoverable automatically
 */
export function isRecoverable(error: ClassifiedError): boolean {
  return error.recoverable;
}

/**
 * Check if error requires user intervention
 */
export function requiresUserAction(error: ClassifiedError): boolean {
  return error.requiresUserAction;
}
