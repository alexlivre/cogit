/**
 * Shared types for Git operations across branch and tag services.
 */

import type { AutoPushResult } from '../services/network/auto-push';

export interface GitOperationResult {
  success: boolean;
  error?: string;
  autoPushResult?: AutoPushResult;
}
