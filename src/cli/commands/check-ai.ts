import chalk from 'chalk';
import ora from 'ora';
import { OpenRouterProvider } from '../../services/ai/providers/openrouter';
import { CONFIG } from '../../config/env';

interface ProviderStatus {
  name: string;
  available: boolean;
  responseTime?: number;
  error?: string;
}

/**
 * Tests AI provider connectivity
 */
export async function checkAICommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔍 AI HEALTH CHECK'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const providers: ProviderStatus[] = [];
  
  // Check OpenRouter
  const openRouterSpinner = ora('Testing OpenRouter...').start();
  const startTime = Date.now();
  
  try {
    const provider = new OpenRouterProvider({
      apiKey: CONFIG.OPENROUTER_API_KEY || '',
      model: CONFIG.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
    });
    
    if (!provider.isAvailable()) {
      openRouterSpinner.warn('OpenRouter: No API key configured');
      providers.push({ name: 'OpenRouter', available: false, error: 'No API key' });
    } else {
      await provider.generate([
        { role: 'user', content: 'Say "OK" if you can hear me.' },
      ]);
      
      const responseTime = Date.now() - startTime;
      openRouterSpinner.succeed(`OpenRouter: Connected (${responseTime}ms)`);
      providers.push({ name: 'OpenRouter', available: true, responseTime });
    }
  } catch (error) {
    openRouterSpinner.fail(`OpenRouter: ${error}`);
    providers.push({ name: 'OpenRouter', available: false, error: String(error) });
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
