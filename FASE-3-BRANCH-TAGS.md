# FASE 3: Branch e Tag Management

> **Objetivo:** Gerenciamento completo de branches e tags com confirmação de segurança.
> 
> **Pré-requisito:** FASES 1 e 2 devem estar completas e funcionais.

---

## 1. Novos Arquivos

```
src/
├── cli/
│   └── commands/
│       └── check-ai.ts             # NOVO
├── services/
│   └── git/
│       ├── branch.ts               # NOVO
│       └── tag.ts                  # NOVO
└── utils/
    └── confirmation.ts             # NOVO (código 4 chars)
```

---

## 2. Especificações por Arquivo

### 2.1 src/utils/confirmation.ts

**Propósito:** Sistema de confirmação com código de 4 caracteres para operações destrutivas.

```typescript
import inquirer from 'inquirer';
import chalk from 'chalk';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sem I, O (confusão)
const NUMBERS = '23456789'; // Sem 0, 1 (confusão)

export function generateConfirmationCode(): string {
  const pattern = [
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
    NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
  ];
  
  return pattern.join(''); // Ex: B2CR
}

export function validateConfirmationCode(input: string, expected: string): boolean {
  return input.toUpperCase().trim() === expected.toUpperCase();
}

export async function confirmDestructiveOperation(operation: string): Promise<boolean> {
  const code = generateConfirmationCode();
  
  console.log(chalk.red.bold('\n⚠️  DESTRUCTIVE OPERATION'));
  console.log(chalk.yellow(`Operation: ${operation}`));
  console.log(chalk.cyan(`Confirmation code: ${chalk.bold.white(code)}`));
  console.log(chalk.gray('Type this code to confirm.\n'));
  
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message: 'Confirmation code:',
      validate: (value: string) => {
        if (validateConfirmationCode(value, code)) {
          return true;
        }
        return 'Invalid confirmation code. Operation cancelled.';
      },
    },
  ]);
  
  return validateConfirmationCode(input, code);
}

export const PROTECTED_OPERATIONS = [
  'delete_tag_local',
  'delete_tag_remote',
  'reset_to_tag',
  'delete_branch',
  'force_push',
];
```

---

### 2.2 src/services/git/branch.ts

**Propósito:** Gerenciamento de branches.

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface BranchInfo {
  name: string;
  current: boolean;
  remote?: string;
  lastCommit?: string;
}

export async function listBranches(repoPath: string): Promise<BranchInfo[]> {
  try {
    const { stdout } = await execAsync('git branch -a', { cwd: repoPath });
    
    const lines = stdout.trim().split('\n');
    
    return lines.map(line => {
      const isCurrent = line.startsWith('*');
      const name = line.replace('*', '').trim().replace('remotes/origin/', '');
      const isRemote = line.includes('remotes/origin/');
      
      return {
        name,
        current: isCurrent,
        remote: isRemote ? 'origin' : undefined,
      };
    });
  } catch (error) {
    return [];
  }
}

export async function getCurrentBranch(repoPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
    return stdout.trim();
  } catch {
    return '';
  }
}

export async function createBranch(repoPath: string, branchName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate branch name
    if (!isValidBranchName(branchName)) {
      return { success: false, error: `Invalid branch name: ${branchName}` };
    }
    
    await execAsync(`git checkout -b ${branchName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function switchBranch(repoPath: string, branchName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execAsync(`git checkout ${branchName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteBranch(repoPath: string, branchName: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
  const { confirmDestructiveOperation } = require('../../utils/confirmation');
  
  const confirmed = await confirmDestructiveOperation(`Delete branch: ${branchName}`);
  if (!confirmed) {
    return { success: false, error: 'Operation cancelled' };
  }
  
  try {
    const flag = force ? '-D' : '-d';
    await execAsync(`git branch ${flag} ${branchName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function pushBranch(repoPath: string, branchName: string, setUpstream: boolean = true): Promise<{ success: boolean; error?: string }> {
  try {
    const upstreamFlag = setUpstream ? '-u origin ' : '';
    await execAsync(`git push ${upstreamFlag}${branchName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function isValidBranchName(name: string): boolean {
  // Git branch name rules
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;
  const reserved = ['HEAD', 'head', 'master', 'main'];
  
  return pattern.test(name) && !reserved.includes(name.toLowerCase());
}

export async function branchCenter(repoPath: string): Promise<void> {
  const branches = await listBranches(repoPath);
  const currentBranch = await getCurrentBranch(repoPath);
  
  console.log(chalk.cyan.bold('\n🌿 BRANCH CENTER'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.green(`Current: ${currentBranch}\n`));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Branch operations:',
      choices: [
        { name: '📋 List all branches', value: 'list' },
        { name: '➕ Create new branch', value: 'create' },
        { name: '🔄 Switch branch', value: 'switch' },
        { name: '⬆️  Push branch to remote', value: 'push' },
        { name: '🗑️  Delete branch', value: 'delete' },
        { name: '↩️  Back to menu', value: 'back' },
      ],
    },
  ]);
  
  switch (action) {
    case 'list':
      console.log(chalk.cyan('\nAll branches:'));
      branches.forEach(b => {
        const prefix = b.current ? chalk.green('* ') : '  ';
        const suffix = b.remote ? chalk.gray(' (remote)') : '';
        console.log(`${prefix}${b.name}${suffix}`);
      });
      break;
    
    case 'create':
      const { newBranchName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newBranchName',
          message: 'New branch name:',
          validate: (name: string) => isValidBranchName(name) || 'Invalid branch name',
        },
      ]);
      const createResult = await createBranch(repoPath, newBranchName);
      if (createResult.success) {
        console.log(chalk.green(`✓ Branch '${newBranchName}' created and switched`));
      } else {
        console.log(chalk.red(`✗ ${createResult.error}`));
      }
      break;
    
    case 'switch':
      const localBranches = branches.filter(b => !b.remote && !b.current);
      if (localBranches.length === 0) {
        console.log(chalk.yellow('No other local branches to switch to'));
        break;
      }
      const { targetBranch } = await inquirer.prompt([
        {
          type: 'list',
          name: 'targetBranch',
          message: 'Switch to:',
          choices: localBranches.map(b => b.name),
        },
      ]);
      const switchResult = await switchBranch(repoPath, targetBranch);
      if (switchResult.success) {
        console.log(chalk.green(`✓ Switched to '${targetBranch}'`));
      } else {
        console.log(chalk.red(`✗ ${switchResult.error}`));
      }
      break;
    
    case 'push':
      const { pushTarget } = await inquirer.prompt([
        {
          type: 'list',
          name: 'pushTarget',
          message: 'Push branch:',
          choices: [currentBranch, ...branches.filter(b => !b.remote && !b.current).map(b => b.name)],
        },
      ]);
      const pushResult = await pushBranch(repoPath, pushTarget);
      if (pushResult.success) {
        console.log(chalk.green(`✓ Branch '${pushTarget}' pushed to remote`));
      } else {
        console.log(chalk.red(`✗ ${pushResult.error}`));
      }
      break;
    
    case 'delete':
      const deletableBranches = branches.filter(b => !b.remote && !b.current);
      if (deletableBranches.length === 0) {
        console.log(chalk.yellow('No branches available to delete'));
        break;
      }
      const { deleteTarget } = await inquirer.prompt([
        {
          type: 'list',
          name: 'deleteTarget',
          message: 'Delete branch:',
          choices: deletableBranches.map(b => b.name),
        },
      ]);
      const deleteResult = await deleteBranch(repoPath, deleteTarget);
      if (deleteResult.success) {
        console.log(chalk.green(`✓ Branch '${deleteTarget}' deleted`));
      }
      break;
    
    case 'back':
      return;
  }
}
```

---

### 2.3 src/services/git/tag.ts

**Propósito:** Gerenciamento de tags.

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { confirmDestructiveOperation } from '../../utils/confirmation';

const execAsync = promisify(exec);

export interface TagInfo {
  name: string;
  commit: string;
  message?: string;
  date?: string;
}

export async function listTags(repoPath: string, includeRemote: boolean = true): Promise<TagInfo[]> {
  try {
    // Get local tags
    const { stdout: localTags } = await execAsync('git tag -l', { cwd: repoPath });
    const tagNames = localTags.trim().split('\n').filter(Boolean);
    
    const tags: TagInfo[] = [];
    
    for (const name of tagNames) {
      try {
        const { stdout: commit } = await execAsync(`git rev-list -n 1 ${name}`, { cwd: repoPath });
        const { stdout: message } = await execAsync(`git tag -l -n1 ${name}`, { cwd: repoPath });
        const { stdout: date } = await execAsync(`git log -1 --format=%ci ${name}`, { cwd: repoPath });
        
        tags.push({
          name,
          commit: commit.trim().slice(0, 7),
          message: message.replace(name, '').trim(),
          date: date.trim(),
        });
      } catch {
        tags.push({ name, commit: 'unknown' });
      }
    }
    
    return tags.sort((a, b) => (a.date && b.date ? b.date.localeCompare(a.date) : 0));
  } catch (error) {
    return [];
  }
}

export async function createTag(
  repoPath: string, 
  tagName: string, 
  message?: string,
  annotated: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidTagName(tagName)) {
      return { success: false, error: `Invalid tag name: ${tagName}` };
    }
    
    if (annotated && message) {
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`git tag -a ${tagName} -m "${escapedMessage}"`, { cwd: repoPath });
    } else {
      await execAsync(`git tag ${tagName}`, { cwd: repoPath });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteTag(
  repoPath: string, 
  tagName: string, 
  remote: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const confirmed = await confirmDestructiveOperation(
    remote ? `Delete remote tag: ${tagName}` : `Delete local tag: ${tagName}`
  );
  
  if (!confirmed) {
    return { success: false, error: 'Operation cancelled' };
  }
  
  try {
    if (remote) {
      await execAsync(`git push origin --delete ${tagName}`, { cwd: repoPath });
    } else {
      await execAsync(`git tag -d ${tagName}`, { cwd: repoPath });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function resetToTag(repoPath: string, tagName: string, hard: boolean = true): Promise<{ success: boolean; error?: string }> {
  const confirmed = await confirmDestructiveOperation(`Reset to tag: ${tagName} (${hard ? 'hard' : 'soft'})`);
  
  if (!confirmed) {
    return { success: false, error: 'Operation cancelled' };
  }
  
  try {
    const mode = hard ? '--hard' : '--soft';
    await execAsync(`git reset ${mode} ${tagName}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function pushTag(repoPath: string, tagName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tagRef = tagName ? tagName : '--tags';
    await execAsync(`git push origin ${tagRef}`, { cwd: repoPath });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function isValidTagName(name: string): boolean {
  // Git tag name rules
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
  return pattern.test(name);
}

export async function tagCenter(repoPath: string): Promise<void> {
  const tags = await listTags(repoPath);
  
  console.log(chalk.cyan.bold('\n🏷️  TAG CENTER'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.green(`Total tags: ${tags.length}\n`));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Tag operations:',
      choices: [
        { name: '📋 List all tags', value: 'list' },
        { name: '➕ Create new tag', value: 'create' },
        { name: '⬆️  Push tag to remote', value: 'push' },
        { name: '🗑️  Delete tag', value: 'delete' },
        { name: '⏪ Reset to tag', value: 'reset' },
        { name: '↩️  Back to menu', value: 'back' },
      ],
    },
  ]);
  
  switch (action) {
    case 'list':
      if (tags.length === 0) {
        console.log(chalk.yellow('No tags found'));
      } else {
        console.log(chalk.cyan('\nTags:'));
        tags.forEach(t => {
          console.log(`  ${chalk.green(t.name)} ${chalk.gray(`(${t.commit})`)} ${t.message ? chalk.gray(`- ${t.message}`) : ''}`);
        });
      }
      break;
    
    case 'create':
      const { newTagName, newTagMessage, newTagAnnotated } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newTagName',
          message: 'Tag name (e.g., v1.0.0):',
          validate: (name: string) => isValidTagName(name) || 'Invalid tag name',
        },
        {
          type: 'confirm',
          name: 'newTagAnnotated',
          message: 'Create annotated tag?',
          default: true,
        },
        {
          type: 'input',
          name: 'newTagMessage',
          message: 'Tag message:',
          when: (answers: any) => answers.newTagAnnotated,
        },
      ]);
      const createResult = await createTag(repoPath, newTagName, newTagMessage, newTagAnnotated);
      if (createResult.success) {
        console.log(chalk.green(`✓ Tag '${newTagName}' created`));
      } else {
        console.log(chalk.red(`✗ ${createResult.error}`));
      }
      break;
    
    case 'push':
      const { pushAllTags, pushTagName } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'pushAllTags',
          message: 'Push all tags?',
          default: true,
        },
        {
          type: 'list',
          name: 'pushTagName',
          message: 'Select tag to push:',
          choices: tags.map(t => t.name),
          when: (answers: any) => !answers.pushAllTags,
        },
      ]);
      const pushResult = await pushTag(repoPath, pushAllTags ? undefined : pushTagName);
      if (pushResult.success) {
        console.log(chalk.green('✓ Tags pushed to remote'));
      } else {
        console.log(chalk.red(`✗ ${pushResult.error}`));
      }
      break;
    
    case 'delete':
      if (tags.length === 0) {
        console.log(chalk.yellow('No tags to delete'));
        break;
      }
      const { deleteTagName, deleteRemote } = await inquirer.prompt([
        {
          type: 'list',
          name: 'deleteTagName',
          message: 'Select tag to delete:',
          choices: tags.map(t => t.name),
        },
        {
          type: 'confirm',
          name: 'deleteRemote',
          message: 'Delete from remote as well?',
          default: false,
        },
      ]);
      const deleteResult = await deleteTag(repoPath, deleteTagName, false);
      if (deleteResult.success && deleteRemote) {
        await deleteTag(repoPath, deleteTagName, true);
      }
      break;
    
    case 'reset':
      if (tags.length === 0) {
        console.log(chalk.yellow('No tags to reset to'));
        break;
      }
      const { resetTagName, resetHard } = await inquirer.prompt([
        {
          type: 'list',
          name: 'resetTagName',
          message: 'Reset to tag:',
          choices: tags.map(t => t.name),
        },
        {
          type: 'confirm',
          name: 'resetHard',
          message: 'Hard reset? (discards local changes)',
          default: false,
        },
      ]);
      await resetToTag(repoPath, resetTagName, resetHard);
      break;
    
    case 'back':
      return;
  }
}
```

---

### 2.4 src/cli/commands/check-ai.ts

**Propósito:** Testar conectividade com provedores de IA.

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { OpenRouterProvider } from '../../services/ai/providers/openrouter';

interface ProviderStatus {
  name: string;
  available: boolean;
  responseTime?: number;
  error?: string;
}

export async function checkAICommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔍 AI HEALTH CHECK'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const providers: ProviderStatus[] = [];
  
  // Check OpenRouter
  const openRouterSpinner = ora('Testing OpenRouter...').start();
  const startTime = Date.now();
  
  try {
    const provider = new OpenRouterProvider({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
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
```

---

## 3. Modificações em Arquivos Existentes

### 3.1 src/index.ts (Atualizado)

```typescript
// Adicionar novos comandos
program
  .command('menu')
  .description('Interactive menu interface')
  .action(async () => {
    const { menuCommand } = await import('./cli/commands/menu');
    await menuCommand();
  });

program
  .command('check-ai')
  .description('Test AI provider connectivity')
  .action(async () => {
    const { checkAICommand } = await import('./cli/commands/check-ai');
    await checkAICommand();
  });

// Adicionar flag --branch ao comando auto
program
  .command('auto')
  .description('Generate commit message with AI and execute git operations')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-push', 'Commit without pushing to remote')
  .option('-m, --message <hint>', 'Context hint for AI')
  .option('-p, --path <dir>', 'Target directory', process.cwd())
  .option('-b, --branch <name>', 'Create or switch to branch') // NOVO
  .action(autoCommand);
```

### 3.2 src/cli/commands/auto.ts (Atualizado)

```typescript
// Adicionar às opções
interface AutoOptions {
  yes?: boolean;
  noPush?: boolean;
  nobuild?: boolean;
  message?: string;
  path?: string;
  dryRun?: boolean;
  branch?: string;  // NOVO
}

// Na função autoCommand, adicionar lógica de branch:
if (options.branch) {
  const { listBranches, createBranch, switchBranch } = require('../services/git/branch');
  
  const branches = await listBranches(repoPath);
  const existingBranch = branches.find(b => b.name === options.branch);
  
  if (existingBranch) {
    console.log(chalk.cyan(`Switching to existing branch: ${options.branch}`));
    await switchBranch(repoPath, options.branch);
  } else {
    console.log(chalk.cyan(`Creating new branch: ${options.branch}`));
    await createBranch(repoPath, options.branch);
  }
}
```

### 3.3 src/cli/commands/menu.ts (Atualizado)

```typescript
// Atualizar choices do menu
choices: [
  { name: '🚀 Quick Commit (auto)', value: 'auto' },
  { name: '📝 Commit with options', value: 'commit-options' },
  { name: '🌿 Branch Center', value: 'branch' },
  { name: '🏷️  Tag Operations', value: 'tag' },
  { name: '🔍 View Repository Status', value: 'status' },
  { name: '🤖 Check AI Providers', value: 'check-ai' },  // NOVO
  { name: '⚙️  Settings', value: 'settings' },
  { name: '❌ Exit', value: 'exit' },
],

// Adicionar case check-ai
case 'check-ai':
  const { checkAICommand } = require('./check-ai');
  await checkAICommand();
  break;

// Atualizar cases branch e tag
case 'branch':
  const { branchCenter } = require('../../services/git/branch');
  await branchCenter(process.cwd());
  break;

case 'tag':
  const { tagCenter } = require('../../services/git/tag');
  await tagCenter(process.cwd());
  break;
```

---

## 4. Operações Protegidas (Confirmação 4 chars)

| Operação | Requer Código |
|----------|---------------|
| Delete tag (local) | Sim |
| Delete tag (remote) | Sim |
| Reset to tag | Sim |
| Delete branch | Sim |
| Force push | Sim |

---

## 5. Flags Adicionadas

| Flag | Shortcut | Descrição | Exemplo |
|------|----------|-----------|---------|
| `--branch <name>` | `-b` | Cria ou usa branch específica | `cogit auto -b feature-auth` |

---

## 6. Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `cogit auto` | Commit com IA |
| `cogit menu` | Interface interativa |
| `cogit check-ai` | Testa conectividade IA |

---

## 7. Critérios de Aceitação

- [ ] Comando `check-ai` testa conectividade com OpenRouter
- [ ] Flag `--branch` cria ou troca de branch
- [ ] Branch Center funciona via menu
- [ ] Tag Center funciona via menu
- [ ] Operações destrutivas exigem código de 4 caracteres
- [ ] Listagem de branches mostra atual
- [ ] Listagem de tags mostra commits
- [ ] Push de tags funciona

---

## 8. Comandos de Teste

```bash
# Check AI
cogit check-ai

# Auto com branch
cogit auto --yes --branch feature-test

# Menu interativo
cogit menu
# → Selecionar Branch Center
# → Selecionar Tag Operations
```
