import { AIProvider, AIProviderConfig, ChatMessage } from './base';
import { OpenRouterProvider } from './openrouter';
import { GroqProvider } from './groq';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import inquirer from 'inquirer';
import { presentAIFallbackOptions } from '../../../core/error-handler';
import { t } from '../../../config/i18n';

export const PROVIDER_PRIORITY = [
  'openrouter',
  'groq',
  'openai',
  'gemini',
  'ollama',
] as const;

export type ProviderName = typeof PROVIDER_PRIORITY[number];

/**
 * Fallback options when all AI providers fail
 */
export type FallbackChoice = 'custom' | 'generic' | 'abort';

export interface FallbackResult {
  choice: FallbackChoice;
  message?: string;
}

/**
 * Generate a generic commit message based on diff analysis
 */
function generateGenericMessage(diff: string): string {
  const lines = diff.split('\n');
  const addedFiles = new Set<string>();
  const modifiedFiles = new Set<string>();
  const deletedFiles = new Set<string>();

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      if (match) {
        const [, oldFile, newFile] = match;
        if (oldFile === newFile) {
          modifiedFiles.add(oldFile);
        } else if (oldFile === '/dev/null') {
          addedFiles.add(newFile);
        } else if (newFile === '/dev/null') {
          deletedFiles.add(oldFile);
        }
      }
    }
  }

  const parts: string[] = [];
  
  if (addedFiles.size > 0) {
    parts.push(`add ${addedFiles.size} new file${addedFiles.size > 1 ? 's' : ''}`);
  }
  if (modifiedFiles.size > 0) {
    parts.push(`update ${modifiedFiles.size} file${modifiedFiles.size > 1 ? 's' : ''}`);
  }
  if (deletedFiles.size > 0) {
    parts.push(`remove ${deletedFiles.size} file${deletedFiles.size > 1 ? 's' : ''}`);
  }

  const description = parts.length > 0 ? parts.join(', ') : 'general changes';
  
  return `chore: ${description}

- changes applied to repository`;
}

/**
 * Prompt user for custom commit message
 */
async function promptCustomMessage(): Promise<string> {
  const { message } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'message',
      message: t('error.fallback.custom_prompt'),
      default: 'feat: describe your changes\n\n- add details here',
    },
  ]);
  
  return message.trim();
}

/**
 * Handle fallback when all AI providers fail
 */
export async function handleAIFallback(diff: string): Promise<FallbackResult> {
  presentAIFallbackOptions();

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: t('error.fallback.prompt'),
      choices: [
        { name: `📝 ${t('error.fallback.custom')}`, value: 'custom' },
        { name: `📋 ${t('error.fallback.generic')}`, value: 'generic' },
        { name: `❌ ${t('error.fallback.abort')}`, value: 'abort' },
      ],
    },
  ]);

  switch (choice) {
    case 'custom':
      return { choice: 'custom', message: await promptCustomMessage() };
    case 'generic':
      return { choice: 'generic', message: generateGenericMessage(diff) };
    case 'abort':
      return { choice: 'abort' };
    default:
      return { choice: 'abort' };
  }
}

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
      model: process.env.OLLAMA_MODEL || 'qwen3.5:4b',
      baseURL: process.env.OLLAMA_URL || 'http://localhost:11434',
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
