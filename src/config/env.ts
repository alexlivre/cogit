export const CONFIG = {
  AI_PROVIDER: process.env.AI_PROVIDER || 'openrouter',
  LANGUAGE: process.env.LANGUAGE?.toLowerCase() || 'en',
  COMMIT_LANGUAGE: process.env.COMMIT_LANGUAGE?.toLowerCase() || 'en',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
  VALID_LANGUAGES: ['en', 'pt'],
};

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!CONFIG.OPENROUTER_API_KEY) {
    errors.push('OPENROUTER_API_KEY is required');
  }
  
  if (!CONFIG.VALID_LANGUAGES.includes(CONFIG.LANGUAGE)) {
    errors.push(`Invalid LANGUAGE: ${CONFIG.LANGUAGE}. Valid options: ${CONFIG.VALID_LANGUAGES.join(', ')}`);
  }
  
  if (!CONFIG.VALID_LANGUAGES.includes(CONFIG.COMMIT_LANGUAGE)) {
    errors.push(`Invalid COMMIT_LANGUAGE: ${CONFIG.COMMIT_LANGUAGE}. Valid options: ${CONFIG.VALID_LANGUAGES.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
