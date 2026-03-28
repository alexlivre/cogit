import chalk from 'chalk';
import ora from 'ora';

export interface ProviderHealth {
  name: string;
  available: boolean;
  responseTime?: number;
  model?: string;
  error?: string;
  lastCheck: Date;
}

export async function fullHealthCheck(): Promise<ProviderHealth[]> {
  const results: ProviderHealth[] = [];

  // OpenRouter
  results.push(await checkOpenRouter());
  
  // Groq
  results.push(await checkGroq());
  
  // OpenAI
  results.push(await checkOpenAI());
  
  // Gemini
  results.push(await checkGemini());
  
  // Ollama (local)
  results.push(await checkOllama());

  return results;
}

export async function checkProvider(name: string): Promise<ProviderHealth> {
  switch (name.toLowerCase()) {
    case 'openrouter':
      return checkOpenRouter();
    case 'groq':
      return checkGroq();
    case 'openai':
      return checkOpenAI();
    case 'gemini':
      return checkGemini();
    case 'ollama':
      return checkOllama();
    default:
      return {
        name,
        available: false,
        error: 'Unknown provider',
        lastCheck: new Date(),
      };
  }
}

async function checkOpenRouter(): Promise<ProviderHealth> {
  const spinner = ora('Testing OpenRouter...').start();
  const startTime = Date.now();

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      spinner.warn('OpenRouter: No API key');
      return { 
        name: 'OpenRouter', 
        available: false, 
        error: 'No API key',
        lastCheck: new Date(),
      };
    }

    const { OpenRouterProvider } = await import('../ai/providers/openrouter');
    const provider = new OpenRouterProvider({
      apiKey,
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
    });

    await provider.generate([{ role: 'user', content: 'OK' }]);
    
    const responseTime = Date.now() - startTime;
    spinner.succeed(`OpenRouter: OK (${responseTime}ms)`);
    
    return { 
      name: 'OpenRouter', 
      available: true, 
      responseTime, 
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
      lastCheck: new Date(),
    };
  } catch (error) {
    spinner.fail(`OpenRouter: ${error}`);
    return { 
      name: 'OpenRouter', 
      available: false, 
      error: String(error),
      lastCheck: new Date(),
    };
  }
}

async function checkGroq(): Promise<ProviderHealth> {
  const spinner = ora('Testing Groq...').start();
  const startTime = Date.now();

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      spinner.warn('Groq: No API key');
      return { 
        name: 'Groq', 
        available: false, 
        error: 'No API key',
        lastCheck: new Date(),
      };
    }

    const { GroqProvider } = await import('../ai/providers/groq');
    const provider = new GroqProvider({
      apiKey,
      model: process.env.GROQ_MODEL || 'llama-4-scout-17b-16e-instruct',
    });

    await provider.generate([{ role: 'user', content: 'OK' }]);
    
    const responseTime = Date.now() - startTime;
    spinner.succeed(`Groq: OK (${responseTime}ms)`);
    
    return { 
      name: 'Groq', 
      available: true, 
      responseTime, 
      model: process.env.GROQ_MODEL || 'llama-4-scout-17b-16e-instruct',
      lastCheck: new Date(),
    };
  } catch (error) {
    spinner.fail(`Groq: ${error}`);
    return { 
      name: 'Groq', 
      available: false, 
      error: String(error),
      lastCheck: new Date(),
    };
  }
}

async function checkOpenAI(): Promise<ProviderHealth> {
  const spinner = ora('Testing OpenAI...').start();
  const startTime = Date.now();

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      spinner.warn('OpenAI: No API key');
      return { 
        name: 'OpenAI', 
        available: false, 
        error: 'No API key',
        lastCheck: new Date(),
      };
    }

    const { OpenAIProvider } = await import('../ai/providers/openai');
    const provider = new OpenAIProvider({
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    });

    await provider.generate([{ role: 'user', content: 'OK' }]);
    
    const responseTime = Date.now() - startTime;
    spinner.succeed(`OpenAI: OK (${responseTime}ms)`);
    
    return { 
      name: 'OpenAI', 
      available: true, 
      responseTime, 
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      lastCheck: new Date(),
    };
  } catch (error) {
    spinner.fail(`OpenAI: ${error}`);
    return { 
      name: 'OpenAI', 
      available: false, 
      error: String(error),
      lastCheck: new Date(),
    };
  }
}

async function checkGemini(): Promise<ProviderHealth> {
  const spinner = ora('Testing Gemini...').start();
  const startTime = Date.now();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      spinner.warn('Gemini: No API key');
      return { 
        name: 'Gemini', 
        available: false, 
        error: 'No API key',
        lastCheck: new Date(),
      };
    }

    const { GeminiProvider } = await import('../ai/providers/gemini');
    const provider = new GeminiProvider({
      apiKey,
      model: process.env.GEMINI_MODEL || 'gemini-pro',
    });

    await provider.generate([{ role: 'user', content: 'OK' }]);
    
    const responseTime = Date.now() - startTime;
    spinner.succeed(`Gemini: OK (${responseTime}ms)`);
    
    return { 
      name: 'Gemini', 
      available: true, 
      responseTime, 
      model: process.env.GEMINI_MODEL || 'gemini-pro',
      lastCheck: new Date(),
    };
  } catch (error) {
    spinner.fail(`Gemini: ${error}`);
    return { 
      name: 'Gemini', 
      available: false, 
      error: String(error),
      lastCheck: new Date(),
    };
  }
}

async function checkOllama(): Promise<ProviderHealth> {
  const spinner = ora('Testing Ollama (local)...').start();
  const startTime = Date.now();

  try {
    const { OllamaProvider } = await import('../ai/providers/ollama');
    const provider = new OllamaProvider({
      model: process.env.OLLAMA_MODEL || 'llama3',
    });

    await provider.generate([{ role: 'user', content: 'OK' }]);
    
    const responseTime = Date.now() - startTime;
    spinner.succeed(`Ollama: OK (${responseTime}ms, local)`);
    
    return { 
      name: 'Ollama', 
      available: true, 
      responseTime, 
      model: process.env.OLLAMA_MODEL || 'llama3',
      lastCheck: new Date(),
    };
  } catch (error) {
    spinner.fail(`Ollama: ${error}`);
    return { 
      name: 'Ollama', 
      available: false, 
      error: 'Not running or not installed',
      lastCheck: new Date(),
    };
  }
}

export function displayHealthReport(results: ProviderHealth[]): void {
  console.log(chalk.cyan.bold('\n🏥 HEALTH REPORT'));
  console.log(chalk.gray('─'.repeat(50)));

  results.forEach(r => {
    const status = r.available ? chalk.green('✓') : chalk.red('✗');
    const time = r.responseTime ? chalk.gray(` (${r.responseTime}ms)`) : '';
    const model = r.model ? chalk.gray(` [${r.model}]`) : '';
    const error = r.error ? chalk.red(` - ${r.error}`) : '';

    console.log(`  ${status} ${r.name}${time}${model}${error}`);
  });

  const available = results.filter(r => r.available).length;
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(`Available: ${available}/${results.length}`);
}
