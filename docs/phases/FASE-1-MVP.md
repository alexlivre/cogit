# FASE 1: MVP (Mínimo Produto Viável)

> **Objetivo:** Fluxo básico de commit com IA via OpenRouter, segurança Lead Wall e i18n.
> 
> **Contexto:** Este documento contém todas as especificações técnicas para implementar a primeira fase do Cogit CLI.

---

## 1. Estrutura de Arquivos

```
cogit-cli/
├── src/
│   ├── index.ts                    # Entry point
│   ├── cli/
│   │   └── index.ts                # CLI definition (Commander.js)
│   ├── core/
│   │   └── container.ts            # Service container
│   ├── services/
│   │   ├── ai/
│   │   │   ├── brain/
│   │   │   │   ├── index.ts        # Main logic
│   │   │   │   └── normalizer.ts   # Message normalization
│   │   │   └── providers/
│   │   │       ├── base.ts         # Interface base
│   │   │       └── openrouter.ts   # Provider OpenRouter
│   │   ├── git/
│   │   │   ├── scanner.ts          # Detecta mudanças
│   │   │   └── executor.ts         # git add/commit/push
│   │   └── security/
│   │       ├── sanitizer.ts        # Blocklist checker
│   │       └── redactor.ts         # Data masking
│   ├── config/
│   │   ├── env.ts                  # Environment config
│   │   └── i18n.ts                 # Internationalization
│   └── locales/
│       ├── en.json
│       └── pt.json
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 2. Dependências

### package.json

```json
{
  "name": "cogit-cli",
  "version": "1.0.0",
  "description": "Git automation CLI with AI-powered commit messages",
  "main": "dist/index.js",
  "bin": {
    "cogit": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "ts-node src/index.ts",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "inquirer": "^9.2.0",
    "dotenv": "^16.4.0",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/inquirer": "^9.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 3. Configuração de Ambiente

### .env.example

```env
# === AI PROVIDER ===
AI_PROVIDER=openrouter

# === LANGUAGE SETTINGS ===
LANGUAGE=en
COMMIT_LANGUAGE=en

# === API KEYS ===
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=meta-llama/llama-4-scout
```

---

## 4. Especificações por Arquivo

### 4.1 src/index.ts

```typescript
#!/usr/bin/env node
import { config } from 'dotenv';
config();

import { program } from 'commander';
import { autoCommand } from './cli/index';

program
  .name('cogit')
  .description('Git automation CLI with AI-powered commit messages')
  .version('1.0.0');

program
  .command('auto')
  .description('Generate commit message with AI and execute git operations')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-push', 'Commit without pushing to remote')
  .option('-m, --message <hint>', 'Context hint for AI')
  .option('-p, --path <dir>', 'Target directory', process.cwd())
  .action(autoCommand);

program.parse();
```

---

### 4.2 src/core/container.ts

**Propósito:** Container de serviços com logging e cache.

```typescript
import { randomUUID } from 'crypto';

export interface ServicePayload {
  cid?: string;
  [key: string]: unknown;
}

export interface ServiceResult {
  status: 'success' | 'error';
  code?: string;
  message?: string;
  cid: string;
  [key: string]: unknown;
}

export type ServiceHandler = (payload: ServicePayload) => Promise<ServiceResult>;

export class ServiceContainer {
  private cache: Map<string, ServiceHandler> = new Map();
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  async run(servicePath: string, payload: ServicePayload): Promise<ServiceResult> {
    const cid = this.generateCid();
    payload.cid = cid;

    try {
      const handler = await this.loadService(servicePath);
      this.log(servicePath, cid, 'Starting execution...');
      
      const result = await handler(payload);
      result.cid = cid;
      return result;
    } catch (error) {
      return {
        status: 'error',
        code: 'INTERNAL_FAILURE',
        message: String(error),
        cid,
      };
    }
  }

  private async loadService(servicePath: string): Promise<ServiceHandler> {
    if (this.cache.has(servicePath)) {
      return this.cache.get(servicePath)!;
    }
    
    // Dynamic import of service module
    const module = await import(servicePath);
    const handler = module.default || module.handler;
    this.cache.set(servicePath, handler);
    return handler;
  }

  private generateCid(): string {
    return `cogit-${randomUUID().split('-')[0]}`;
  }

  log(service: string, cid: string, message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO'): void {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}][${level}][${cid}][${service}] ${message}\n`);
  }
}
```

---

### 4.3 src/services/git/scanner.ts

**Propósito:** Detectar mudanças no repositório e gerar diff.

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ScanResult {
  isRepo: boolean;
  hasChanges: boolean;
  stagedFiles: string[];
  unstagedFiles: string[];
  diff: string;
}

export async function scanRepository(repoPath: string): Promise<ScanResult> {
  try {
    // Check if it's a git repository
    await execAsync('git rev-parse --is-inside-work-tree', { cwd: repoPath });
    
    // Get staged files
    const { stdout: stagedOutput } = await execAsync('git diff --name-only --cached', { cwd: repoPath });
    const stagedFiles = stagedOutput.trim().split('\n').filter(Boolean);
    
    // Get unstaged files
    const { stdout: unstagedOutput } = await execAsync('git diff --name-only', { cwd: repoPath });
    const unstagedFiles = unstagedOutput.trim().split('\n').filter(Boolean);
    
    // Get full diff (staged + unstaged)
    const { stdout: diffOutput } = await execAsync('git diff HEAD', { cwd: repoPath });
    
    // Get untracked files
    const { stdout: untrackedOutput } = await execAsync('git ls-files --others --exclude-standard', { cwd: repoPath });
    const untrackedFiles = untrackedOutput.trim().split('\n').filter(Boolean);
    
    const hasChanges = stagedFiles.length > 0 || unstagedFiles.length > 0 || untrackedFiles.length > 0;
    
    return {
      isRepo: true,
      hasChanges,
      stagedFiles,
      unstagedFiles: [...unstagedFiles, ...untrackedFiles],
      diff: diffOutput,
    };
  } catch (error) {
    return {
      isRepo: false,
      hasChanges: false,
      stagedFiles: [],
      unstagedFiles: [],
      diff: '',
    };
  }
}
```

---

### 4.4 src/services/security/sanitizer.ts

**Propósito:** Bloquear arquivos sensíveis via Blocklist Imutável.

```typescript
// Blocklist Imutável - NUNCA pode ser sobrescrita por configuração de usuário
const BLOCKED_PATTERNS: readonly string[] = [
  // Diretórios de Infraestrutura e Credenciais
  '.ssh/', '.aws/', '.azure/', '.kube/', '.gnupg/', '.docker/',
  
  // Arquivos de Chaves Privadas
  'id_rsa', 'id_ed25519', 'id_dsa', 'id_ecdsa',
  '*.pem', '*.key', '*.p12', '*.pfx', '*.keystore', '*.jks',
  
  // Variáveis de Ambiente
  '.env', '.env.local', '.env.development', '.env.production', '.env.test',
  'secrets.yaml', 'secrets.json',
  
  // Históricos de Shell
  '.bash_history', '.zsh_history', '.python_history', '.mysql_history', '.psql_history',
  
  // Padrões Genéricos de Alto Risco
  '**/token.txt', '**/password.txt', '**/credentials.json'
];

export interface SanitizerResult {
  isClean: boolean;
  blockedFiles: string[];
  message?: string;
}

function matchPattern(filename: string, pattern: string): boolean {
  // Simple glob matching (case-insensitive)
  const normalizedPattern = pattern.toLowerCase().replace(/\*/g, '.*');
  const normalizedFilename = filename.toLowerCase();
  
  if (pattern.startsWith('**/')) {
    return normalizedFilename.includes(normalizedPattern.replace('**/', ''));
  }
  
  if (pattern.endsWith('/*')) {
    return normalizedFilename.startsWith(normalizedPattern.replace('/*', '/'));
  }
  
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${normalizedPattern}$`);
    return regex.test(normalizedFilename);
  }
  
  return normalizedFilename === normalizedPattern || normalizedFilename.includes(normalizedPattern);
}

export function sanitizeFiles(files: string[]): SanitizerResult {
  const blockedFiles: string[] = [];
  
  for (const file of files) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (matchPattern(file, pattern)) {
        blockedFiles.push(file);
        break;
      }
    }
  }
  
  return {
    isClean: blockedFiles.length === 0,
    blockedFiles,
    message: blockedFiles.length > 0 
      ? `Security alert: Blocked files detected: ${blockedFiles.join(', ')}`
      : undefined,
  };
}
```

---

### 4.5 src/services/security/redactor.ts

**Propósito:** Mascarar secrets no diff antes de enviar para IA.

```typescript
interface RedactionPattern {
  pattern: RegExp;
  replacement: string;
}

const REDACTION_PATTERNS: RedactionPattern[] = [
  // API Keys
  {
    pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***API_KEY_REDACTED***'
  },
  
  // Tokens
  {
    pattern: /(?:token|auth[_-]?token)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***TOKEN_REDACTED***'
  },
  
  // Passwords
  {
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]?([^'"\s]+)['"]?/gi,
    replacement: '***PASSWORD_REDACTED***'
  },
  
  // AWS Keys
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: '***AWS_KEY_REDACTED***'
  },
  
  // Generic Secrets
  {
    pattern: /(?:secret|private[_-]?key)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***SECRET_REDACTED***'
  },
];

export function redactDiff(diff: string): string {
  let redacted = diff;
  
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  
  return redacted;
}
```

---

### 4.6 src/services/ai/providers/base.ts

**Propósito:** Interface base para provedores de IA.

```typescript
export interface AIProviderConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  generate(messages: ChatMessage[]): Promise<string>;
  getName(): string;
  isAvailable(): boolean;
}
```

---

### 4.7 src/services/ai/providers/openrouter.ts

**Propósito:** Provedor OpenRouter usando SDK OpenAI compatível.

```typescript
import OpenAI from 'openai';
import { AIProvider, AIProviderConfig, ChatMessage } from './base';

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/cogit-cli',
        'X-Title': 'Cogit CLI',
      },
    });
    this.model = config.model;
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    return completion.choices[0]?.message?.content || '';
  }

  getName(): string {
    return 'openrouter';
  }

  isAvailable(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY);
  }
}
```

---

### 4.8 src/services/ai/brain/normalizer.ts

**Propósito:** Normalizar mensagens de commit para formato Conventional Commits.

```typescript
const CATEGORY_MAP: Record<string, string> = {
  'feat': 'x', 'feature': 'x', 'enhancement': 'x', 'improvement': 'x', 'melhoria': 'x',
  'fix': 'b', 'bugfix': 'b', 'bug': 'b', 'hotfix': 'b', 'correcao': 'b', 'correção': 'b',
  'update': 't', 'chore': 't', 'refactor': 't', 'atualizacao': 't', 'atualização': 't',
};

export function normalizeCommitMessage(rawText: string, lang: string = 'en'): string {
  // Remove markdown code blocks
  let clean = rawText.replace(/```/g, '').replace(/commit:/gi, '').trim();
  
  const lines = clean.split('\n').filter(l => l.trim());
  
  if (lines.length === 0) {
    return lang === 'pt' ? 'atualização: mudanças gerais' : 'update: general changes';
  }
  
  // Title: max 50 chars
  let title = lines[0].slice(0, 50).trim();
  
  // Ensure title follows conventional commits format
  if (!/^(feat|fix|update|chore|refactor|docs|style|test|build|ci)/i.test(title)) {
    // Try to detect type from content
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('fix') || lowerTitle.includes('bug') || lowerTitle.includes('correç')) {
      title = `fix: ${title}`;
    } else if (lowerTitle.includes('add') || lowerTitle.includes('new') || lowerTitle.includes('novo')) {
      title = `feat: ${title}`;
    } else {
      title = `update: ${title}`;
    }
  }
  
  // Body: normalize bullets with category markers
  const bodyLines = lines.slice(1).map(line => {
    const trimmed = line.trim();
    const match = trimmed.match(/^(feat|fix|update|chore|refactor|feature|bug|melhoria|correç[aã]o)\s*[:\-]?\s*(.+)$/i);
    
    if (match) {
      const marker = CATEGORY_MAP[match[1].toLowerCase()] || 't';
      return `- ${marker} ${match[2].trim()}`;
    }
    
    // Already a bullet point
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      return `- t ${trimmed.replace(/^[-*•]\s*/, '').trim()}`;
    }
    
    return `- t ${trimmed}`;
  });
  
  if (bodyLines.length > 0) {
    return `${title}\n\n${bodyLines.join('\n')}`;
  }
  
  return title;
}
```

---

### 4.9 src/services/ai/brain/index.ts

**Propósito:** Lógica principal de geração de commit com IA.

```typescript
import { OpenRouterProvider } from '../providers/openrouter';
import { normalizeCommitMessage } from './normalizer';
import { redactDiff } from '../../security/redactor';
import { loadPromptTemplate } from '../../../config/i18n';

export interface BrainInput {
  diff: string;
  hint?: string;
  language: string;
}

export interface BrainOutput {
  success: boolean;
  message?: string;
  error?: string;
}

export async function generateCommitMessage(input: BrainInput): Promise<BrainOutput> {
  const { diff, hint, language } = input;
  
  if (!diff && !hint) {
    return {
      success: false,
      error: language === 'pt' ? 'Sem diff ou dica para trabalhar.' : 'No diff or hint to work with.',
    };
  }
  
  // Redact secrets from diff
  const safeDiff = redactDiff(diff);
  
  // Load prompt template based on language
  const template = loadPromptTemplate(language);
  
  // Build messages
  const messages = [
    { role: 'system' as const, content: template.system_prompt },
    { role: 'user' as const, content: buildUserPrompt(safeDiff, hint, template) },
  ];
  
  try {
    const provider = new OpenRouterProvider({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
    });
    
    const rawResponse = await provider.generate(messages);
    const normalizedMessage = normalizeCommitMessage(rawResponse, language);
    
    return {
      success: true,
      message: normalizedMessage,
    };
  } catch (error) {
    return {
      success: false,
      error: `AI generation failed: ${error}`,
    };
  }
}

function buildUserPrompt(diff: string, hint: string | undefined, template: any): string {
  let prompt = template.user_prompt_template.replace('{diff}', diff.slice(0, 8000)); // Limit diff size
  
  if (hint) {
    prompt += template.hint_template.replace('{hint}', hint);
  }
  
  if (diff.length > 8000) {
    prompt += template.truncated_hint;
  }
  
  return prompt;
}
```

---

### 4.10 src/config/env.ts

**Propósito:** Configuração de ambiente.

```typescript
export const CONFIG = {
  // AI Provider
  AI_PROVIDER: process.env.AI_PROVIDER || 'openrouter',
  
  // Language Settings
  LANGUAGE: process.env.LANGUAGE?.toLowerCase() || 'en',
  COMMIT_LANGUAGE: process.env.COMMIT_LANGUAGE?.toLowerCase() || 'en',
  
  // OpenRouter
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
  
  // Validation
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
```

---

### 4.11 src/config/i18n.ts

**Propósito:** Sistema de internacionalização.

```typescript
import * as fs from 'fs';
import * as path from 'path';

type TranslationKeys = Record<string, string>;
type PromptTemplate = {
  system_prompt: string;
  user_prompt_template: string;
  hint_template: string;
  truncated_hint: string;
  fallback_title: string;
  fallback_detail: string;
};

class I18nManager {
  private translations: Map<string, TranslationKeys> = new Map();
  private prompts: Map<string, PromptTemplate> = new Map();
  private currentLang: string;

  constructor(lang: string = 'en') {
    this.currentLang = lang;
    this.loadTranslations();
    this.loadPrompts();
  }

  private loadTranslations(): void {
    const localesDir = path.join(__dirname, '../locales');
    
    for (const lang of ['en', 'pt']) {
      const filePath = path.join(localesDir, `${lang}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.translations.set(lang, JSON.parse(content));
      }
    }
  }

  private loadPrompts(): void {
    // Inline prompts for MVP
    this.prompts.set('en', {
      system_prompt: `You are a Senior DevOps Assistant. Generate Git commit messages following Conventional Commits format.

Rules:
- Title format: <type>: <description> (max 50 chars)
- Types: feat, fix, update, chore, refactor, docs, style, test, build, ci
- Body: bullet points with markers (n=feature, f=fix, u=update)
- Be concise and descriptive
- No markdown code blocks in response`,
      user_prompt_template: `Generate a commit message for the following changes:

{diff}`,
      hint_template: `\nHint: '{hint}'`,
      truncated_hint: '\nNote: The diff was truncated due to size.',
      fallback_title: 'update: general changes',
      fallback_detail: 'details unavailable',
    });
    
    this.prompts.set('pt', {
      system_prompt: `Você é um Assistente DevOps Sênior. Gere mensagens de commit Git seguindo o formato Conventional Commits.

Regras:
- Formato do título: <tipo>: <descrição> (máx 50 caracteres)
- Tipos: feat, fix, update, chore, refactor, docs, style, test, build, ci
- Corpo: bullet points com marcadores (n=feature, f=fix, u=update)
- Seja conciso e descritivo
- Sem blocos de código markdown na resposta`,
      user_prompt_template: `Gere uma mensagem de commit para as seguintes mudanças:

{diff}`,
      hint_template: `\nDica: '{hint}'`,
      truncated_hint: '\nNota: O diff foi truncado devido ao tamanho.',
      fallback_title: 'atualização: mudanças gerais',
      fallback_detail: 'detalhes indisponíveis',
    });
  }

  t(key: string, vars?: Record<string, string>): string {
    let text = this.translations.get(this.currentLang)?.[key];
    
    // Fallback to English
    if (!text) {
      text = this.translations.get('en')?.[key] || key;
    }
    
    // Variable interpolation
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    
    return text;
  }

  getPromptTemplate(lang?: string): PromptTemplate {
    const targetLang = lang || this.currentLang;
    return this.prompts.get(targetLang) || this.prompts.get('en')!;
  }
}

// Singleton instance
let i18nInstance: I18nManager | null = null;

export function getI18n(lang?: string): I18nManager {
  if (!i18nInstance) {
    i18nInstance = new I18nManager(lang || process.env.LANGUAGE || 'en');
  }
  return i18nInstance;
}

export function loadPromptTemplate(lang: string): PromptTemplate {
  return getI18n(lang).getPromptTemplate(lang);
}

export function t(key: string, vars?: Record<string, string>): string {
  return getI18n().t(key, vars);
}
```

---

### 4.12 src/locales/en.json

```json
{
  "cli.description": "Git automation CLI with AI-powered commit messages",
  "auto.description": "Generate commit message with AI and execute git operations",
  "auto.confirm": "Execute this commit?",
  "auto.regenerate": "Regenerate message",
  "auto.cancel": "Cancel",
  "auto.success": "Commit created and pushed successfully!",
  "auto.no_changes": "No changes detected in repository",
  "auto.processing": "Analyzing changes...",
  "auto.generating": "Generating commit message...",
  "auto.executing": "Executing git operations...",
  "error.not_repo": "Not a git repository",
  "error.no_api_key": "API key not configured. Set OPENROUTER_API_KEY in .env",
  "error.blocked_files": "Security alert: Blocked files detected: {files}",
  "error.push_failed": "Push failed: {error}"
}
```

---

### 4.13 src/locales/pt.json

```json
{
  "cli.description": "CLI de automação Git com mensagens de commit geradas por IA",
  "auto.description": "Gera mensagem de commit com IA e executa operações git",
  "auto.confirm": "Executar este commit?",
  "auto.regenerate": "Regenerar mensagem",
  "auto.cancel": "Cancelar",
  "auto.success": "Commit criado e enviado com sucesso!",
  "auto.no_changes": "Nenhuma mudança detectada no repositório",
  "auto.processing": "Analisando mudanças...",
  "auto.generating": "Gerando mensagem de commit...",
  "auto.executing": "Executando operações git...",
  "error.not_repo": "Não é um repositório git",
  "error.no_api_key": "Chave API não configurada. Defina OPENROUTER_API_KEY no .env",
  "error.blocked_files": "Alerta de segurança: Arquivos bloqueados detectados: {files}",
  "error.push_failed": "Push falhou: {error}"
}
```

---

### 4.14 src/services/git/executor.ts

**Propósito:** Executar operações Git (add, commit, push).

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExecutorResult {
  success: boolean;
  output?: string;
  error?: string;
}

export async function gitAdd(repoPath: string): Promise<ExecutorResult> {
  try {
    const { stdout } = await execAsync('git add -A', { cwd: repoPath });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function gitCommit(repoPath: string, message: string): Promise<ExecutorResult> {
  try {
    const escapedMessage = message.replace(/"/g, '\\"');
    const { stdout } = await execAsync(`git commit -m "${escapedMessage}"`, { cwd: repoPath });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function gitPush(repoPath: string): Promise<ExecutorResult> {
  try {
    const { stdout } = await execAsync('git push', { cwd: repoPath });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function executeCommit(repoPath: string, message: string, shouldPush: boolean = true): Promise<ExecutorResult> {
  // Stage all changes
  const addResult = await gitAdd(repoPath);
  if (!addResult.success) {
    return addResult;
  }
  
  // Create commit
  const commitResult = await gitCommit(repoPath, message);
  if (!commitResult.success) {
    return commitResult;
  }
  
  // Push if requested
  if (shouldPush) {
    const pushResult = await gitPush(repoPath);
    if (!pushResult.success) {
      return pushResult;
    }
  }
  
  return { success: true, output: commitResult.output };
}
```

---

### 4.15 src/cli/index.ts

**Propósito:** Comando `auto` com fluxo completo.

```typescript
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { scanRepository } from '../services/git/scanner';
import { sanitizeFiles } from '../services/security/sanitizer';
import { generateCommitMessage } from '../services/ai/brain';
import { executeCommit } from '../services/git/executor';
import { validateConfig, CONFIG } from '../config/env';
import { t } from '../config/i18n';

interface AutoOptions {
  yes?: boolean;
  noPush?: boolean;
  message?: string;
  path?: string;
}

export async function autoCommand(options: AutoOptions): Promise<void> {
  const repoPath = options.path || process.cwd();
  
  // Validate configuration
  const config = validateConfig();
  if (!config.valid) {
    console.error(chalk.red('Configuration errors:'));
    config.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
    process.exit(1);
  }
  
  // Initialize i18n
  const lang = CONFIG.LANGUAGE;
  const commitLang = CONFIG.COMMIT_LANGUAGE;
  
  // Scan repository
  const scanSpinner = ora(t('auto.processing')).start();
  const scanResult = await scanRepository(repoPath);
  
  if (!scanResult.isRepo) {
    scanSpinner.fail(t('error.not_repo'));
    process.exit(1);
  }
  
  if (!scanResult.hasChanges) {
    scanSpinner.fail(t('auto.no_changes'));
    process.exit(0);
  }
  
  scanSpinner.succeed(t('auto.processing'));
  
  // Security check
  const allFiles = [...scanResult.stagedFiles, ...scanResult.unstagedFiles];
  const sanitizerResult = sanitizeFiles(allFiles);
  
  if (!sanitizerResult.isClean) {
    console.error(chalk.red(t('error.blocked_files', { files: sanitizerResult.blockedFiles.join(', ') })));
    process.exit(1);
  }
  
  // Generate commit message
  const aiSpinner = ora(t('auto.generating')).start();
  const brainResult = await generateCommitMessage({
    diff: scanResult.diff,
    hint: options.message,
    language: commitLang,
  });
  
  if (!brainResult.success) {
    aiSpinner.fail(brainResult.error || 'AI generation failed');
    process.exit(1);
  }
  
  aiSpinner.succeed(t('auto.generating'));
  
  // Display message
  console.log('\n' + chalk.cyan('═'.repeat(50)));
  console.log(chalk.bold.white('Generated Commit Message:'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.yellow(brainResult.message));
  console.log(chalk.cyan('═'.repeat(50)) + '\n');
  
  // Confirm or regenerate
  let finalMessage = brainResult.message;
  
  if (!options.yes) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: t('auto.confirm'),
        choices: [
          { name: '✓ Execute', value: 'execute' },
          { name: '🔄 Regenerate', value: 'regenerate' },
          { name: '✗ Cancel', value: 'cancel' },
        ],
      },
    ]);
    
    if (answer.action === 'cancel') {
      console.log(chalk.yellow(t('auto.cancel')));
      process.exit(0);
    }
    
    if (answer.action === 'regenerate') {
      const regenerateSpinner = ora(t('auto.generating')).start();
      const regenerateResult = await generateCommitMessage({
        diff: scanResult.diff,
        hint: options.message,
        language: commitLang,
      });
      regenerateSpinner.succeed();
      
      if (regenerateResult.success) {
        finalMessage = regenerateResult.message!;
        console.log('\n' + chalk.cyan('═'.repeat(50)));
        console.log(chalk.yellow(finalMessage));
        console.log(chalk.cyan('═'.repeat(50)) + '\n');
      }
    }
  }
  
  // Execute git operations
  const execSpinner = ora(t('auto.executing')).start();
  const result = await executeCommit(repoPath, finalMessage, !options.noPush);
  
  if (result.success) {
    execSpinner.succeed(t('auto.success'));
  } else {
    execSpinner.fail(t('error.push_failed', { error: result.error }));
    process.exit(1);
  }
}
```

---

## 5. Fluxo de Execução

```
1. Usuário executa: cogit auto --yes
2. Scanner detecta mudanças no repositório
3. Sanitizer valida arquivos contra blocklist
4. Redactor mascara secrets no diff
5. AI Brain gera mensagem via OpenRouter
6. Normalizer formata para Conventional Commits
7. Executor realiza git add/commit/push
8. Mensagem de sucesso exibida
```

---

## 6. Critérios de Aceitação

- [ ] Comando `cogit auto` funciona e gera commit
- [ ] Flag `--yes` pula confirmações
- [ ] Flag `--no-push` commita sem push
- [ ] Flag `-m "hint"` passa contexto para IA
- [ ] Blocklist bloqueia arquivos sensíveis
- [ ] Secrets são mascarados antes de enviar para IA
- [ ] Interface em pt/en funciona
- [ ] Commits podem ser em pt ou en
- [ ] Mensagens seguem Conventional Commits

---

## 7. Comandos de Teste

```bash
# Build
npm run build

# Teste básico
cogit auto

# Teste com confirmação automática
cogit auto --yes

# Teste sem push
cogit auto --yes --no-push

# Teste com hint
cogit auto --yes -m "fix authentication bug"

# Teste com path diferente
cogit auto --path /path/to/repo --yes
```
