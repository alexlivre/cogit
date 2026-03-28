/**
 * Network Retry Handler
 * Provides intelligent retry logic for network operations
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
  totalDuration: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error?: string;
  success: boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'network timeout',
    'connection timeout',
    'unable to access',
    'could not connect',
    'ssl error',
    'certificate',
    'rate limit',
    'too many requests'
  ]
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: string, retryableErrors: string[]): boolean {
  const lowerError = error.toLowerCase();
  return retryableErrors.some(pattern => 
    lowerError.includes(pattern.toLowerCase())
  );
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number
): number {
  const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Execute operation with intelligent retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const attempts: RetryAttempt[] = [];
  const startTime = Date.now();

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      const result = await operation();
      
      attempts.push({
        attempt,
        delay: 0,
        success: true
      });

      return {
        success: true,
        result,
        attempts: attempt,
        totalDuration: Date.now() - startTime
      };
    } catch (error: any) {
      const errorMessage = String(error);
      
      attempts.push({
        attempt,
        delay: 0,
        error: errorMessage,
        success: false
      });

      // Check if we should retry
      const isLastAttempt = attempt > config.maxRetries;
      const isRetryable = isRetryableError(errorMessage, config.retryableErrors || []);

      if (isLastAttempt || !isRetryable) {
        return {
          success: false,
          error: errorMessage,
          attempts: attempt,
          totalDuration: Date.now() - startTime
        };
      }

      // Calculate delay for next attempt
      const delay = calculateBackoff(
        attempt,
        config.baseDelay,
        config.maxDelay,
        config.backoffFactor
      );

      attempts[attempts.length - 1].delay = delay;

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    success: false,
    error: 'Unknown error during retry',
    attempts: config.maxRetries + 1,
    totalDuration: Date.now() - startTime
  };
}

/**
 * Execute Git operation with retry logic optimized for Git errors
 */
export async function executeGitWithRetry<T>(
  gitOperation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const defaultErrors = DEFAULT_RETRY_OPTIONS.retryableErrors || [];
  const optionErrors = options.retryableErrors || [];
  
  const gitRetryOptions: Partial<RetryOptions> = {
    ...options,
    retryableErrors: [
      ...defaultErrors,
      ...optionErrors,
      // Git-specific retryable errors
      'unable to access',
      'could not connect',
      'connection refused',
      'timeout',
      'network is unreachable',
      'ssl protocol error',
      'ssl error',
      'certificate error',
      'authentication failed',
      'permission denied',
      'remote hung up',
      'early EOF',
      'protocol error'
    ]
  };

  return executeWithRetry(gitOperation, gitRetryOptions);
}

/**
 * Get human-readable retry summary
 */
export function getRetrySummary(attempts: RetryAttempt[]): string {
  if (attempts.length === 1 && attempts[0].success) {
    return '✅ Success on first attempt';
  }

  const failedAttempts = attempts.filter(a => !a.success);
  const successfulAttempt = attempts.find(a => a.success);

  if (successfulAttempt) {
    return `✅ Success after ${successfulAttempt.attempt} attempts (${failedAttempts.length} retries)`;
  }

  return `❌ Failed after ${attempts.length} attempts`;
}

/**
 * Format retry attempts for logging
 */
export function formatRetryAttempts(attempts: RetryAttempt[]): string[] {
  return attempts.map((attempt) => {
    const status = attempt.success ? '✅' : '❌';
    const delay = attempt.delay > 0 ? ` (delay: ${attempt.delay}ms)` : '';
    const error = attempt.error ? ` - ${attempt.error.substring(0, 100)}...` : '';
    
    return `Attempt ${attempt.attempt}: ${status}${delay}${error}`;
  });
}
