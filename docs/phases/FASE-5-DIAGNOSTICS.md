# FASE 5: Diagnostics e Debug

> **Objetivo:** Ferramentas de diagnóstico, debug avançado e multi-provider.
> 
> **Pré-requisito:** FASES 1-4 devem estar completas.

---

## 1. Novos Arquivos

```
src/
├── cli/
│   └── ui/
│       └── debug-logger.ts         # NOVO
└── services/
    └── diagnostics/
        ├── health.ts               # NOVO
        └── resources.ts            # NOVO
```

---

## 2. Especificações por Arquivo

### 2.1 src/cli/ui/debug-logger.ts

**Propósito:** Deep Trace Mode com captura de payloads.

```typescript
import * as fs from 'fs';
import * as path from 'path';

const DEBUG_LOG_FILE = '.vibe-debug.log';

class DebugLogger {
  private enabled: boolean = false;
  private logPath: string;

  constructor(repoPath: string) {
    this.logPath = path.join(repoPath, DEBUG_LOG_FILE);
  }

  enable(): void {
    this.enabled = true;
    // Clear previous log
    if (fs.existsSync(this.logPath)) {
      fs.unlinkSync(this.logPath);
    }
  }

  disable(): void {
    this.enabled = false;
  }

  log(type: string, data: any): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}][${type}] ${JSON.stringify(data, null, 2)}\n`;
    
    fs.appendFileSync(this.logPath, entry);
  }

  logRequest(provider: string, messages: any[]): void {
    this.log('REQUEST', { provider, messages, tokenCount: this.estimateTokens(messages) });
  }

  logResponse(provider: string, response: string, latency: number): void {
    this.log('RESPONSE', { provider, response, latency });
  }

  logError(provider: string, error: any): void {
    this.log('ERROR', { provider, error: String(error) });
  }

  logGitCommand(command: string, output: string): void {
    this.log('GIT', { command, output });
  }

  private estimateTokens(messages: any[]): number {
    const text = messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4);
  }

  getLogPath(): string {
    return this.logPath;
  }
}

export const debugLogger = new DebugLogger(process.cwd());
export { DebugLogger };
```

---

### 2.2 src/services/diagnostics/health.ts

**Propósito:** Health Check completo de todos os provedores.

```typescript
import chalk from 'chalk';
import ora from 'ora';

export interface ProviderHealth {
  name: string;
  available: boolean;
  responseTime?: number;
  model?: string;
  error?: string;
}

export async function fullHealthCheck(): Promise<ProviderHealth[]> {
  const results: ProviderHealth[] = [];

  // OpenRouter
  results.push(await checkOpenRouter());
  
  // Future providers (Phase 5+)
  // results.push(await checkGroq());
  // results.push(await checkOpenAI());
  // results.push(await checkGemini());
  // results.push(await checkOllama());

  return results;
}

async function checkOpenRouter(): Promise<ProviderHealth> {
  const spinner = ora('Testing OpenRouter...').start();
  const startTime = Date.now();

  try {
    const { OpenRouterProvider } = await import('../ai/providers/openrouter');
    const provider = new OpenRouterProvider({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
    });

    if (!provider.isAvailable()) {
      spinner.warn('OpenRouter: No API key');
      return { name: 'OpenRouter', available: false, error: 'No API key' };
    }

    await provider.generate([{ role: 'user', content: 'OK' }]);
    
    const responseTime = Date.now() - startTime;
    spinner.succeed(`OpenRouter: OK (${responseTime}ms)`);
    
    return { name: 'OpenRouter', available: true, responseTime, model: process.env.OPENROUTER_MODEL };
  } catch (error) {
    spinner.fail(`OpenRouter: ${error}`);
    return { name: 'OpenRouter', available: false, error: String(error) };
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
```

---

### 2.3 src/services/diagnostics/resources.ts

**Propósito:** Mapa completo de recursos do projeto.

```typescript
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface ResourceInfo {
  type: 'file' | 'directory';
  path: string;
  size?: number;
  description?: string;
}

export function scanResources(repoPath: string): ResourceInfo[] {
  const resources: ResourceInfo[] = [];

  function scan(dir: string, relative: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(relative, entry.name);

      if (entry.name === '.git' || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        resources.push({ type: 'directory', path: relativePath });
        scan(fullPath, relativePath);
      } else {
        const stats = fs.statSync(fullPath);
        resources.push({ type: 'file', path: relativePath, size: stats.size });
      }
    }
  }

  scan(repoPath);
  return resources;
}

export function displayResourceMap(resources: ResourceInfo[]): void {
  console.log(chalk.cyan.bold('\n🗺️  RESOURCE MAP'));
  console.log(chalk.gray('─'.repeat(50)));

  const dirs = resources.filter(r => r.type === 'directory');
  const files = resources.filter(r => r.type === 'file');

  console.log(chalk.yellow(`\nDirectories (${dirs.length}):`));
  dirs.slice(0, 20).forEach(r => console.log(`  📁 ${r.path}`));
  if (dirs.length > 20) console.log(chalk.gray(`  ... +${dirs.length - 20} more`));

  console.log(chalk.yellow(`\nFiles (${files.length}):`));
  files.slice(0, 20).forEach(r => {
    const size = r.size ? formatSize(r.size) : '';
    console.log(`  📄 ${r.path} ${chalk.gray(size)}`);
  });
  if (files.length > 20) console.log(chalk.gray(`  ... +${files.length - 20} more`));

  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(`Total: ${dirs.length} dirs, ${files.length} files, ${formatSize(totalSize)}`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

---

## 3. Modificações em Arquivos Existentes

### 3.1 src/index.ts (Atualizado)

```typescript
// Adicionar flag --debug
program
  .command('auto')
  .option('--debug', 'Enable deep trace mode')  // NOVO
  .action(autoCommand);

// Adicionar comando health
program
  .command('health')
  .description('Full health check of all AI providers')
  .action(async () => {
    const { fullHealthCheck, displayHealthReport } = await import('./services/diagnostics/health');
    const results = await fullHealthCheck();
    displayHealthReport(results);
  });

// Adicionar comando resources
program
  .command('resources')
  .description('Scan and display project resources')
  .action(async () => {
    const { scanResources, displayResourceMap } = await import('./services/diagnostics/resources');
    const resources = scanResources(process.cwd());
    displayResourceMap(resources);
  });
```

### 3.2 src/cli/commands/auto.ts (Atualizado)

```typescript
// Adicionar às opções
interface AutoOptions {
  // ... existentes
  debug?: boolean;  // NOVO
}

// No início da função
if (options.debug) {
  const { debugLogger } = require('../ui/debug-logger');
  debugLogger.enable();
  console.log(chalk.yellow('Debug mode enabled. Logging to .vibe-debug.log'));
}

// Antes de chamar AI
if (options.debug) {
  debugLogger.logRequest('openrouter', messages);
}

// Após resposta AI
if (options.debug) {
  debugLogger.logResponse('openrouter', response, latency);
}
```

---

## 4. Multi-Provider Fallback (Preparação)

### Estrutura Futura

```typescript
// src/services/ai/providers/index.ts
export const PROVIDER_PRIORITY = [
  'openrouter',
  'groq',
  'openai',
  'gemini',
  'ollama',
];

export async function getAvailableProvider(): Promise<AIProvider> {
  for (const name of PROVIDER_PRIORITY) {
    const provider = await loadProvider(name);
    if (provider?.isAvailable()) {
      return provider;
    }
  }
  throw new Error('No AI providers available');
}
```

---

## 5. Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `cogit auto --debug` | Commit com deep trace |
| `cogit health` | Health check completo |
| `cogit resources` | Mapa de recursos |

---

## 6. Flags Adicionadas

| Flag | Descrição |
|------|-----------|
| `--debug` | Deep Trace Mode |

---

## 7. Critérios de Aceitação

- [ ] Flag `--debug` ativa logging detalhado
- [ ] Arquivo `.vibe-debug.log` captura payloads
- [ ] Comando `health` testa provedores
- [ ] Comando `resources` exibe mapa
- [ ] Fallback entre provedores funciona

---

## 8. Comandos de Teste

```bash
# Debug mode
cogit auto --yes --debug
cat .vibe-debug.log

# Health check
cogit health

# Resources
cogit resources
```
