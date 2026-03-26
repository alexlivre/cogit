# FASE 2: Automação e Menu Interativo

> **Objetivo:** Modo autônomo completo, interface guiada e auto-correção de erros.
> 
> **Pré-requisito:** FASE 1 (MVP) deve estar completa e funcional.

---

## 1. Novos Arquivos

```
src/
├── cli/
│   ├── commands/
│   │   ├── auto.ts                 # Refatorado
│   │   └── menu.ts                 # NOVO
│   └── ui/
│       ├── renderer.ts             # NOVO
│       └── prompts.ts              # NOVO
└── services/
    └── git/
        └── healer.ts               # NOVO
```

---

## 2. Especificações por Arquivo

### 2.1 src/cli/commands/menu.ts

**Propósito:** Interface interativa guiada com múltiplas opções.

```typescript
import inquirer from 'inquirer';
import chalk from 'chalk';
import { autoCommand } from './auto';
import { t } from '../../config/i18n';

export async function menuCommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         COGIT CLI - MENU             ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════╝\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🚀 Quick Commit (auto)', value: 'auto' },
        { name: '📝 Commit with options', value: 'commit-options' },
        { name: '🌿 Branch Center', value: 'branch' },
        { name: '🏷️  Tag Operations', value: 'tag' },
        { name: '🔍 View Repository Status', value: 'status' },
        { name: '⚙️  Settings', value: 'settings' },
        { name: '❌ Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'auto':
      await autoCommand({ yes: false });
      break;
    
    case 'commit-options':
      await commitWithOptions();
      break;
    
    case 'branch':
      console.log(chalk.yellow('Branch Center - Coming in Phase 3'));
      break;
    
    case 'tag':
      console.log(chalk.yellow('Tag Operations - Coming in Phase 3'));
      break;
    
    case 'status':
      await showStatus();
      break;
    
    case 'settings':
      await showSettings();
      break;
    
    case 'exit':
      console.log(chalk.green('Goodbye! 👋'));
      process.exit(0);
  }
}

async function commitWithOptions(): Promise<void> {
  const options = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'push',
      message: 'Push after commit?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'nobuild',
      message: 'Skip CI/CD? (adds [CI Skip])',
      default: false,
    },
    {
      type: 'input',
      name: 'hint',
      message: 'Context hint for AI (optional):',
    },
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Dry run (simulation)?',
      default: false,
    },
  ]);

  await autoCommand({
    yes: false,
    noPush: !options.push,
    nobuild: options.nobuild,
    message: options.hint || undefined,
    dryRun: options.dryRun,
  });
}

async function showStatus(): Promise<void> {
  const { scanRepository } = require('../../services/git/scanner');
  const scan = await scanRepository(process.cwd());
  
  console.log(chalk.cyan('\n📊 Repository Status:'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`Staged files: ${chalk.green(scan.stagedFiles.length)}`);
  console.log(`Unstaged files: ${chalk.yellow(scan.unstagedFiles.length)}`);
  
  if (scan.stagedFiles.length > 0) {
    console.log(chalk.green('\n✓ Staged:'));
    scan.stagedFiles.forEach((f: string) => console.log(`  ${f}`));
  }
  
  if (scan.unstagedFiles.length > 0) {
    console.log(chalk.yellow('\n⚠ Unstaged:'));
    scan.unstagedFiles.forEach((f: string) => console.log(`  ${f}`));
  }
}

async function showSettings(): Promise<void> {
  const { CONFIG } = require('../../config/env');
  
  console.log(chalk.cyan('\n⚙️  Current Settings:'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`Language: ${CONFIG.LANGUAGE}`);
  console.log(`Commit Language: ${CONFIG.COMMIT_LANGUAGE}`);
  console.log(`AI Provider: ${CONFIG.AI_PROVIDER}`);
  console.log(`Model: ${CONFIG.OPENROUTER_MODEL}`);
}
```

---

### 2.2 src/cli/ui/renderer.ts

**Propósito:** Formatação de output com cores e estilos.

```typescript
import chalk from 'chalk';

export function renderHeader(title: string): void {
  const line = '═'.repeat(50);
  console.log(chalk.cyan(`\n${line}`));
  console.log(chalk.bold.white(`  ${title}`));
  console.log(chalk.cyan(`${line}\n`));
}

export function renderCommitMessage(message: string): void {
  const lines = message.split('\n');
  const title = lines[0];
  const body = lines.slice(1).join('\n');
  
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.bold.white('Generated Commit Message:'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.yellow.bold(title));
  
  if (body) {
    console.log(chalk.gray(body));
  }
  
  console.log(chalk.cyan('═'.repeat(50)));
}

export function renderSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

export function renderError(message: string): void {
  console.log(chalk.red(`✗ ${message}`));
}

export function renderWarning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

export function renderInfo(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}

export function renderFileList(files: string[], title: string): void {
  console.log(chalk.cyan(`\n${title}:`));
  files.forEach(file => {
    console.log(chalk.gray(`  • ${file}`));
  });
}

export function renderDiffPreview(diff: string, maxLines: number = 20): void {
  const lines = diff.split('\n').slice(0, maxLines);
  
  console.log(chalk.cyan('\n📝 Diff Preview:'));
  console.log(chalk.gray('─'.repeat(40)));
  
  lines.forEach(line => {
    if (line.startsWith('+')) {
      console.log(chalk.green(line));
    } else if (line.startsWith('-')) {
      console.log(chalk.red(line));
    } else if (line.startsWith('@@')) {
      console.log(chalk.cyan(line));
    } else {
      console.log(chalk.gray(line));
    }
  });
  
  if (diff.split('\n').length > maxLines) {
    console.log(chalk.gray(`... (${diff.split('\n').length - maxLines} more lines)`));
  }
}
```

---

### 2.3 src/cli/ui/prompts.ts

**Propósito:** Prompts reutilizáveis para interação.

```typescript
import inquirer from 'inquirer';

export async function confirmAction(message: string, default_value: boolean = false): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: default_value,
    },
  ]);
  return confirmed;
}

export async function selectOption(message: string, choices: string[]): Promise<string> {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message,
      choices,
    },
  ]);
  return selected;
}

export async function inputText(message: string, default_value?: string): Promise<string> {
  const { text } = await inquirer.prompt([
    {
      type: 'input',
      name: 'text',
      message,
      default: default_value,
    },
  ]);
  return text;
}

export async function selectMultiple(message: string, choices: string[]): Promise<string[]> {
  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message,
      choices,
    },
  ]);
  return selected;
}

export async function reviewCommitMessage(message: string): Promise<'execute' | 'regenerate' | 'edit' | 'cancel'> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do with this message?',
      choices: [
        { name: '✓ Execute commit', value: 'execute' },
        { name: '🔄 Regenerate message', value: 'regenerate' },
        { name: '✏️  Edit message', value: 'edit' },
        { name: '✗ Cancel', value: 'cancel' },
      ],
    },
  ]);
  return action;
}

export async function editCommitMessage(currentMessage: string): Promise<string> {
  const { message } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'message',
      message: 'Edit commit message:',
      default: currentMessage,
    },
  ]);
  return message;
}
```

---

### 2.4 src/services/git/healer.ts

**Propósito:** Auto-correção de erros de push usando IA.

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { OpenRouterProvider } from '../ai/providers/openrouter';

const execAsync = promisify(exec);

export interface HealerInput {
  repoPath: string;
  failedCommand: string;
  errorOutput: string;
  maxRetries: number;
}

export interface HealerAttempt {
  attempt: number;
  commands: string[];
  success: boolean;
  error?: string;
}

const HEALER_SYSTEM_PROMPT = `You are a Git Error Resolution Specialist.

Analyze the error and provide ONLY the commands to fix it, one per line.
No explanations, no code blocks, no markdown.

Rules:
- For 'non-fast-forward' errors: suggest 'git pull --rebase'
- For conflicts: suggest only 'git add .' and 'git rebase --continue'
- Do NOT suggest 'git rebase --abort' unless giving up
- If a command fails, execution stops and I'll return with the error`;

export async function healGitError(input: HealerInput): Promise<{ success: boolean; attempts: HealerAttempt[] }> {
  const attempts: HealerAttempt[] = [];
  const provider = new OpenRouterProvider({
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
  });
  
  let currentError = input.errorOutput;
  
  for (let attempt = 1; attempt <= input.maxRetries; attempt++) {
    // Build context with history
    const historyContext = attempts.map(a => 
      `Attempt ${a.attempt}: Commands: ${a.commands.join(', ')} - Result: ${a.success ? 'Success' : a.error}`
    ).join('\n');
    
    const userPrompt = `Failed command: ${input.failedCommand}
Error output:
${currentError}

Previous attempts:
${historyContext || 'None'}

Provide commands to fix this error:`;

    // Get commands from AI
    const response = await provider.generate([
      { role: 'system', content: HEALER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);
    
    // Parse commands
    const commands = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('```') && !line.startsWith('#'));
    
    // Execute commands
    let allSuccess = true;
    let lastError = '';
    
    for (const cmd of commands) {
      try {
        await execAsync(cmd, { cwd: input.repoPath });
      } catch (error) {
        allSuccess = false;
        lastError = String(error);
        break;
      }
    }
    
    attempts.push({
      attempt,
      commands,
      success: allSuccess,
      error: allSuccess ? undefined : lastError,
    });
    
    if (allSuccess) {
      // Try original push again
      try {
        await execAsync('git push', { cwd: input.repoPath });
        return { success: true, attempts };
      } catch (error) {
        currentError = String(error);
      }
    } else {
      currentError = lastError;
    }
  }
  
  return { success: false, attempts };
}
```

---

## 3. Modificações em Arquivos Existentes

### 3.1 src/cli/commands/auto.ts (Atualizado)

Adicionar suporte a `--dry-run`, `--nobuild` e integração com Healer.

```typescript
// Adicionar às opções
interface AutoOptions {
  yes?: boolean;
  noPush?: boolean;
  nobuild?: boolean;
  message?: string;
  path?: string;
  dryRun?: boolean;  // NOVO
}

// Na função executeCommit, adicionar lógica de dry-run:
if (options.dryRun) {
  console.log(chalk.cyan('\n🔍 DRY RUN MODE - No changes will be made'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.yellow('Would execute:'));
  console.log('  git add -A');
  console.log(`  git commit -m "${finalMessage}"`);
  if (!options.noPush) {
    console.log('  git push');
  }
  return;
}

// Adicionar [CI Skip] se nobuild:
if (options.nobuild) {
  finalMessage = `[CI Skip] ${finalMessage}`;
}

// Integrar Healer no caso de falha de push:
if (!result.success && !options.noPush) {
  console.log(chalk.yellow('\n⚠ Push failed. Attempting to heal...'));
  
  const healerResult = await healGitError({
    repoPath,
    failedCommand: 'git push',
    errorOutput: result.error || '',
    maxRetries: 3,
  });
  
  if (healerResult.success) {
    console.log(chalk.green('✓ Healed successfully!'));
  } else {
    console.log(chalk.red('✗ Healing failed. Manual intervention required.'));
    healerResult.attempts.forEach(a => {
      console.log(chalk.gray(`  Attempt ${a.attempt}: ${a.commands.join(', ')}`));
    });
  }
}
```

---

## 4. Fluxo de Execução

### Menu Interativo

```
1. Usuário executa: cogit menu
2. Menu exibe opções disponíveis
3. Usuário seleciona ação
4. Ação correspondente é executada
5. Retorna ao menu ou encerra
```

### Dry Run

```
1. Usuário executa: cogit auto --dry-run
2. Scanner detecta mudanças
3. AI gera mensagem
4. Exibe mensagem E comandos que seriam executados
5. NÃO executa nenhum comando git
6. Encerra sem fazer alterações
```

### Git Healer

```
1. Push falha
2. Healer captura erro
3. Consulta IA para comandos de correção
4. Executa comandos sugeridos
5. Tenta push novamente
6. Repete até sucesso ou max_retries
```

---

## 5. Flags Adicionadas

| Flag | Descrição | Exemplo |
|------|-----------|---------|
| `--dry-run` | Simulação sem executar | `cogit auto --dry-run` |
| `--nobuild` | Adiciona `[CI Skip]` ao commit | `cogit auto --yes --nobuild` |

---

## 6. Critérios de Aceitação

- [ ] Comando `cogit menu` exibe interface interativa
- [ ] Menu permite commit com opções customizadas
- [ ] Flag `--dry-run` simula sem executar
- [ ] Flag `--nobuild` adiciona `[CI Skip]`
- [ ] Git Healer corrige erros de push automaticamente
- [ ] Review loop permite regenerar mensagens múltiplas vezes
- [ ] Edição manual de mensagem funciona

---

## 7. Comandos de Teste

```bash
# Menu interativo
cogit menu

# Dry run
cogit auto --dry-run

# Com CI Skip
cogit auto --yes --nobuild

# Testar healer (criar conflito intencional)
# 1. Fazer mudanças locais
# 2. Fazer push de outro lugar
# 3. Tentar push local
cogit auto --yes
```
