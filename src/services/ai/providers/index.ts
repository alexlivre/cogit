import { AIProvider, AIProviderConfig, ChatMessage } from './base';
import { OpenRouterProvider } from './openrouter';
import { GroqProvider } from './groq';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';

export const PROVIDER_PRIORITY = [
  'openrouter',
  'groq',
  'openai',
  'gemini',
  'ollama',
] as const;

export type ProviderName = typeof PROVIDER_PRIORITY[number];

/**
 * Get the first available provider based on priority
 */
export async function getAvailableProvider(): Promise<AIProvider> {
  for (const name of PROVIDER_PRIORITY) {
    const provider = await getProvider(name);
    if (provider && provider.isAvailable()) {
      return provider;
    }
  }
  throw new Error('No AI providers available. Check your API keys in .env');
}

/**
 * Get a specific provider by name
 */
export async function getProvider(name: ProviderName): Promise<AIProvider | null> {
  const config = getProviderConfig(name);
  
  switch (name) {
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'groq':
      return new GroqProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default:
      return null;
  }
}

/**
 * Get provider configuration
 */
function getProviderConfig(name: ProviderName): AIProviderConfig {
  const configs: Record<ProviderName, AIProviderConfig> = {
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
      baseURL: 'https://openrouter.ai/api/v1',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.GROQ_MODEL || 'llama-4-scout-17b-16e-instruct',
      baseURL: 'https://api.groq.com/openai/v1',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      baseURL: 'https://api.openai.com/v1',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-pro',
    },
    ollama: {
      apiKey: '', // Not needed for local
      model: process.env.OLLAMA_MODEL || 'llama3',
      baseURL: 'http://localhost:11434',
    },
  };
  
  return configs[name];
}

/**
 * List all available providers
 */
export function listProviders(): string[] {
  return [...PROVIDER_PRIORITY];
}

/**
 * Try operation with automatic fallback
 */
export async function tryWithFallback<T>(
  fn: (provider: AIProvider) => Promise<T>,
  maxAttempts: number = PROVIDER_PRIORITY.length
): Promise<{ result: T; provider: string }> {
  const errors: Array<{ provider: string; error: Error }> = [];
  
  for (const name of PROVIDER_PRIORITY.slice(0, maxAttempts)) {
    const provider = await getProvider(name);
    
    if (!provider || !provider.isAvailable()) {
      continue;
    }
    
    try {
      const result = await fn(provider);
      return { result, provider: name };
    } catch (error) {
      errors.push({ provider: name, error: error as Error });
      console.log(`Provider ${name} failed, trying next...`);
    }
  }
  
  // All providers failed
  const errorMessages = errors.map(e => `${e.provider}: ${e.error.message}`).join('\n');
  throw new Error(`All providers failed:\n${errorMessages}`);
}
