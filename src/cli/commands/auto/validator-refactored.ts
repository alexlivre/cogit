/**
 * Validator Handler (Refactored with Dependency Inversion)
 * Uses AIProviderPort interface for validation
 * Single Responsibility: Validate configuration
 */

import { AIProviderPort } from '../../../core/ports/index';
import { ConfigError } from '../../../core/errors';
import { CONFIG } from '../../../config/env';

export interface ValidationResult {
  valid: boolean;
  language: string;
  commitLanguage: string;
  errors: string[];
}

/**
 * Validator Handler with Dependency Injection
 * Follows Dependency Inversion Principle
 */
export class ValidatorHandler {
  constructor(
    private readonly aiProvider: AIProviderPort
  ) {}

  /**
   * Validate configuration
   * @returns Validation result
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validate language settings
    const language = CONFIG.LANGUAGE;
    const commitLanguage = CONFIG.COMMIT_LANGUAGE;

    // Validate AI provider availability
    if (!this.aiProvider.isAvailable()) {
      errors.push('No AI provider API key configured');
      errors.push('Set at least one: OPENROUTER_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY');
    }

    if (errors.length > 0) {
      throw new ConfigError('Configuration validation failed', errors);
    }

    return {
      valid: true,
      language,
      commitLanguage,
      errors: [],
    };
  }
}

// Factory function for default implementation
export function createValidatorHandler(): ValidatorHandler {
  const { AIProviderAdapter } = require('../../../infrastructure/adapters/ai-provider.adapter');
  return new ValidatorHandler(new AIProviderAdapter());
}

// Legacy function for backward compatibility
export function validateConfiguration(): ValidationResult {
  const handler = createValidatorHandler();
  return handler.validate();
}
