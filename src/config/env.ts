export const CONFIG = {
  AI_PROVIDER: process.env.AI_PROVIDER || 'auto',
  LANGUAGE: process.env.LANGUAGE?.toLowerCase() || 'en',
  COMMIT_LANGUAGE: process.env.COMMIT_LANGUAGE?.toLowerCase() || 'en',
  
  // API Keys
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // Models
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-4-scout-17b-16e-instruct',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-pro',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'qwen3.5:4b',
  
  // Ollama Thinking Mode
  OLLAMA_THINK: process.env.OLLAMA_THINK === 'true',
  
  // Auto Push Settings
  AUTO_PUSH_ENABLED: process.env.AUTO_PUSH_ENABLED !== 'false', // default true
  AUTO_PUSH_BRANCHES: process.env.AUTO_PUSH_BRANCHES !== 'false', // default true
  AUTO_PUSH_TAGS: process.env.AUTO_PUSH_TAGS !== 'false', // default true
  AUTO_PUSH_INTERNET_CHECK: process.env.AUTO_PUSH_INTERNET_CHECK !== 'false', // default true
  AUTO_PUSH_GITHUB_ONLY: process.env.AUTO_PUSH_GITHUB_ONLY !== 'false', // default true
  AUTO_PUSH_DELAY: parseInt(process.env.AUTO_PUSH_DELAY || '5', 10) * 1000, // convert to ms
  AUTO_PUSH_RETRY_COUNT: parseInt(process.env.AUTO_PUSH_RETRY_COUNT || '3', 10),
  AUTO_PUSH_SILENT: process.env.AUTO_PUSH_SILENT === 'true',
  
  // Auto Push Fallback Settings
  AUTO_PUSH_FALLBACK_ENABLED: process.env.AUTO_PUSH_FALLBACK_ENABLED !== 'false', // default true
  AUTO_PUSH_STRICT_CHECK: process.env.AUTO_PUSH_STRICT_CHECK === 'true', // default false
  AUTO_PUSH_FALLBACK_TIMEOUT: parseInt(process.env.AUTO_PUSH_FALLBACK_TIMEOUT || '15', 10) * 1000,
  
  VALID_LANGUAGES: ['en', 'pt'],
};

export const API_KEYS: Record<string, string> = {
  openrouter: process.env.OPENROUTER_API_KEY || '',
  groq: process.env.GROQ_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || '',
  ollama: '', // Local, no key needed
};

export const MODELS: Record<string, string> = {
  openrouter: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
  groq: process.env.GROQ_MODEL || 'llama-4-scout-17b-16e-instruct',
  openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  gemini: process.env.GEMINI_MODEL || 'gemini-pro',
  ollama: process.env.OLLAMA_MODEL || 'qwen3.5:4b',
};

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // At least one API key should be present (except ollama which is local)
  const hasAnyKey = Object.entries(API_KEYS).some(([name, key]) => 
    name === 'ollama' || key.length > 0
  );
  
  if (!hasAnyKey) {
    errors.push('At least one AI provider API key is required (OPENROUTER_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY)');
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
