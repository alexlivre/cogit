import chalk from 'chalk';
import ora from 'ora';
import { OpenRouterProvider } from '../../services/ai/providers/openrouter';
import { GroqProvider } from '../../services/ai/providers/groq';
import { OpenAIProvider } from '../../services/ai/providers/openai';
import { GeminiProvider } from '../../services/ai/providers/gemini';
import { AIProvider } from '../../services/ai/providers/base';
import { CONFIG } from '../../config/env';

interface ProviderStatus {
  name: string;
  available: boolean;
  responseTime?: number;
  error?: string;
}

interface ProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  create: (apiKey: string, model: string) => AIProvider;
}

/**
 * Tests AI provider connectivity
 */
export async function checkAICommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔍 AI HEALTH CHECK'));
  console.log(chalk.gray('─'.repeat(40)));

  const providers: ProviderStatus[] = [];

  // Provider configurations
  const providerConfigs: ProviderConfig[] = [
    {
      name: 'Groq',
      apiKey: CONFIG.GROQ_API_KEY,
      model: CONFIG.GROQ_MODEL,
      create: (apiKey, model) => new GroqProvider({ apiKey, model }),
    },
    {
      name: 'OpenRouter',
      apiKey: CONFIG.OPENROUTER_API_KEY,
      model: CONFIG.OPENROUTER_MODEL,
      create: (apiKey, model) => new OpenRouterProvider({ apiKey, model }),
    },
    {
      name: 'OpenAI',
      apiKey: CONFIG.OPENAI_API_KEY,
      model: CONFIG.OPENAI_MODEL,
      create: (apiKey, model) => new OpenAIProvider({ apiKey, model }),
    },
    {
      name: 'Gemini',
      apiKey: CONFIG.GEMINI_API_KEY,
      model: CONFIG.GEMINI_MODEL,
      create: (apiKey, model) => new GeminiProvider({ apiKey, model }),
    },
  ];

  // Test each provider
  for (const config of providerConfigs) {
    const spinner = ora(`Testing ${config.name}...`).start();
    const startTime = Date.now();

    try {
      const provider = config.create(config.apiKey, config.model);

      if (!provider.isAvailable()) {
        spinner.warn(`${config.name}: No API key configured`);
        providers.push({ name: config.name, available: false, error: 'No API key' });
      } else {
        await provider.generate([
          { role: 'user', content: 'Say "OK" if you can hear me.' },
        ]);

        const responseTime = Date.now() - startTime;
        spinner.succeed(`${config.name}: Connected (${responseTime}ms)`);
        providers.push({ name: config.name, available: true, responseTime });
      }
    } catch (error) {
      spinner.fail(`${config.name}: ${error}`);
      providers.push({ name: config.name, available: false, error: String(error) });
    }
  }

  // Summary
  console.log(chalk.cyan('\n📊 Summary:'));
  console.log(chalk.gray('─'.repeat(40)));

  providers.forEach(p => {
    const status = p.available
      ? chalk.green('✓ Available')
      : chalk.red('✗ Unavailable');
    const time = p.responseTime ? chalk.gray(` (${p.responseTime}ms)`) : '';
    const error = p.error ? chalk.red(` - ${p.error}`) : '';

    console.log(`  ${p.name}: ${status}${time}${error}`);
  });

  const availableCount = providers.filter(p => p.available).length;
  console.log(chalk.gray('\n─'.repeat(40)));
  console.log(`Total: ${availableCount}/${providers.length} providers available`);

  if (availableCount === 0) {
    console.log(chalk.red('\n⚠️  No AI providers available. Check your API keys in .env'));
    process.exit(1);
  }
}
