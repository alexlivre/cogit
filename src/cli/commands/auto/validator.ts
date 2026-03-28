/**
 * Validator - Configuration and input validation
 * Single Responsibility: Validate configuration and inputs
 */

import { validateConfig, CONFIG } from '../../../config/env';
import { ConfigError } from '../../../core/errors';

export interface ValidationResult {
  valid: boolean;
  language: string;
  commitLanguage: string;
}

/**
 * Validate configuration and return settings
 * @throws ConfigError if configuration is invalid
 */
export function validateConfiguration(): ValidationResult {
  const config = validateConfig();

  if (!config.valid) {
    throw new ConfigError(
      'Configuration errors detected',
      config.errors
    );
  }

  return {
    valid: true,
    language: CONFIG.LANGUAGE,
    commitLanguage: CONFIG.COMMIT_LANGUAGE,
  };
}
