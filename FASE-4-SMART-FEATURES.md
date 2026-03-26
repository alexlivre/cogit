# FASE 4: Smart Features

> **Objetivo:** Features avançadas de gerenciamento de arquivos e diffs grandes.
> 
> **Pré-requisito:** FASES 1, 2 e 3 devem estar completas e funcionais.

---

## 1. Novos Arquivos

```
src/
├── core/
│   └── vault.ts                    # NOVO (VibeVault)
├── services/
│   └── tools/
│       ├── stealth.ts              # NOVO
│       └── ignore.ts               # NOVO
├── config/
│   └── common_trash.json           # NOVO
└── types/
    └── git.ts                      # NOVO
```

---

## 2. Especificações por Arquivo

### 2.1 src/core/vault.ts

**Propósito:** Gerenciamento de diffs > 100KB (VibeVault).

```typescript
import { randomUUID } from 'crypto';

const SIZE_THRESHOLD_KB = 100;
const SIZE_THRESHOLD_BYTES = SIZE_THRESHOLD_KB * 1024;

export interface DiffData {
  mode: 'direct' | 'ref';
  payload?: string;
  dataRef?: string;
  preview?: string;
  originalSize: number;
}

class VibeVault {
  private static storage: Map<string, string> = new Map();
  private static metadata: Map<string, { size: number; timestamp: Date }> = new Map();

  static store(data: string): string {
    const refId = `ref-${randomUUID().split('-')[0]}`;
    this.storage.set(refId, data);
    this.metadata.set(refId, {
      size: Buffer.byteLength(data, 'utf-8'),
      timestamp: new Date(),
    });
    return refId;
  }

  static retrieve(refId: string): string | undefined {
    return this.storage.get(refId);
  }

  static cleanup(refId: string): void {
    this.storage.delete(refId);
    this.metadata.delete(refId);
  }

  static getMetadata(refId: string): { size: number; timestamp: Date } | undefined {
    return this.metadata.get(refId);
  }

  static getStats(): { count: number; totalSize: number } {
    let totalSize = 0;
    this.metadata.forEach(meta => {
      totalSize += meta.size;
    });
    return {
      count: this.storage.size,
      totalSize,
    };
  }

  static clear(): void {
    this.storage.clear();
    this.metadata.clear();
  }

  static async withAutoCleanup<T>(refId: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } finally {
      this.cleanup(refId);
    }
  }
}

export function smartPack(data: string): DiffData {
  const sizeInBytes = Buffer.byteLength(data, 'utf-8');
  
  if (sizeInBytes <= SIZE_THRESHOLD_BYTES) {
    return {
      mode: 'direct',
      payload: data,
      originalSize: sizeInBytes,
    };
  }
  
  // Store in vault and return reference
  const refId = VibeVault.store(data);
  const preview = data.slice(0, 2000);
  
  return {
    mode: 'ref',
    dataRef: refId,
    preview,
    originalSize: sizeInBytes,
  };
}

export function smartUnpack(data: DiffData): string {
  if (data.mode === 'direct') {
    return data.payload || '';
  }
  
  if (data.dataRef) {
    const retrieved = VibeVault.retrieve(data.dataRef);
    if (!retrieved) {
      throw new Error(`Data reference not found: ${data.dataRef}`);
    }
    return retrieved;
  }
  
  return '';
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export { VibeVault };
```

---

### 2.2 src/services/tools/stealth.ts

**Propósito:** Ocultar arquivos privados durante operações Git (Stealth Mode).

```typescript
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const PRIVATE_CONFIG_FILE = '.gitpy-private';
const TEMP_DIR = '.gitpy-temp';

export interface StealthResult {
  hiddenFiles: string[];
  tempPath: string;
  success: boolean;
  error?: string;
}

export interface StealthRestoreResult {
  restoredFiles: string[];
  conflicts: string[];
  success: boolean;
}

function readPrivatePatterns(repoPath: string): string[] {
  const configPath = path.join(repoPath, PRIVATE_CONFIG_FILE);
  
  if (!fs.existsSync(configPath)) {
    return [];
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function matchPattern(filename: string, pattern: string): boolean {
  // Simple glob matching
  const normalizedPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
  const regex = new RegExp(`^${normalizedPattern}$`);
  return regex.test(filename) || filename.includes(pattern.replace(/\*/g, '').replace(/\?/g, ''));
}

function findMatchingFiles(repoPath: string, patterns: string[]): string[] {
  const matchingFiles: string[] = [];
  
  function scanDir(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativeFilePath = path.join(relativePath, entry.name);
      
      // Skip .git and .gitpy-temp
      if (entry.name === '.git' || entry.name === TEMP_DIR) {
        continue;
      }
      
      // Check if matches any pattern
      for (const pattern of patterns) {
        if (matchPattern(relativeFilePath, pattern) || matchPattern(entry.name, pattern)) {
          matchingFiles.push(relativeFilePath);
          break;
        }
      }
      
      // Recurse into directories
      if (entry.isDirectory()) {
        scanDir(fullPath, relativeFilePath);
      }
    }
  }
  
  scanDir(repoPath);
  return matchingFiles;
}

export async function stealthStash(repoPath: string): Promise<StealthResult> {
  const patterns = readPrivatePatterns(repoPath);
  
  if (patterns.length === 0) {
    return {
      hiddenFiles: [],
      tempPath: '',
      success: true,
    };
  }
  
  const tempPath = path.join(repoPath, TEMP_DIR);
  const matchingFiles = findMatchingFiles(repoPath, patterns);
  
  if (matchingFiles.length === 0) {
    return {
      hiddenFiles: [],
      tempPath: '',
      success: true,
    };
  }
  
  // Create temp directory
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
  
  // Ensure .gitpy-temp is in .gitignore
  const gitignorePath = path.join(repoPath, '.gitignore');
  let gitignoreContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  }
  
  if (!gitignoreContent.includes(TEMP_DIR)) {
    fs.appendFileSync(gitignorePath, `\n# Cogit temporary files\n${TEMP_DIR}/\n`);
  }
  
  // Move files to temp
  for (const file of matchingFiles) {
    const sourcePath = path.join(repoPath, file);
    const destPath = path.join(tempPath, file);
    
    if (fs.existsSync(sourcePath)) {
      // Create directory structure in temp
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Move file
      fs.renameSync(sourcePath, destPath);
    }
  }
  
  console.log(chalk.gray(`Stealth: Hidden ${matchingFiles.length} private files`));
  
  return {
    hiddenFiles: matchingFiles,
    tempPath,
    success: true,
  };
}

export async function stealthRestore(repoPath: string): Promise<StealthRestoreResult> {
  const tempPath = path.join(repoPath, TEMP_DIR);
  
  if (!fs.existsSync(tempPath)) {
    return {
      restoredFiles: [],
      conflicts: [],
      success: true,
    };
  }
  
  const restoredFiles: string[] = [];
  const conflicts: string[] = [];
  
  function restoreDir(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(dir, entry.name);
      const relativeFilePath = path.join(relativePath, entry.name);
      const destPath = path.join(repoPath, relativeFilePath);
      
      if (entry.isDirectory()) {
        restoreDir(sourcePath, relativeFilePath);
      } else {
        // Check for conflicts
        if (fs.existsSync(destPath)) {
          // Rename conflicting file
          const conflictPath = `${destPath}.restored`;
          fs.renameSync(sourcePath, conflictPath);
          conflicts.push(relativeFilePath);
        } else {
          // Ensure directory exists
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          // Move file back
          fs.renameSync(sourcePath, destPath);
          restoredFiles.push(relativeFilePath);
        }
      }
    }
  }
  
  restoreDir(tempPath);
  
  // Clean up temp directory
  fs.rmSync(tempPath, { recursive: true, force: true });
  
  if (restoredFiles.length > 0) {
    console.log(chalk.gray(`Stealth: Restored ${restoredFiles.length} private files`));
  }
  
  if (conflicts.length > 0) {
    console.log(chalk.yellow(`Stealth: ${conflicts.length} conflicts renamed to .restored`));
  }
  
  return {
    restoredFiles,
    conflicts,
    success: true,
  };
}

export function createPrivateConfig(repoPath: string, patterns: string[]): void {
  const configPath = path.join(repoPath, PRIVATE_CONFIG_FILE);
  
  const content = `# Cogit Private Files
# Files matching these patterns will be hidden during git operations

${patterns.join('\n')}
`;
  
  fs.writeFileSync(configPath, content);
  console.log(chalk.green(`Created ${PRIVATE_CONFIG_FILE}`));
}
```

---

### 2.3 src/services/tools/ignore.ts

**Propósito:** Smart Ignore - Sugestões proativas de .gitignore.

```typescript
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import commonTrash from '../../config/common_trash.json';

export interface IgnoreSuggestion {
  pattern: string;
  reason: string;
  files: string[];
}

export interface WhitelistEntry {
  pattern: string;
  comment: string;
}

const WHITELIST_MARKER = '# cogit:allow';
const GITIGNORE_PATH = '.gitignore';

function scanForTrash(repoPath: string): IgnoreSuggestion[] {
  const suggestions: IgnoreSuggestion[] = [];
  
  function scanDir(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativeFilePath = path.join(relativePath, entry.name);
      
      // Skip .git
      if (entry.name === '.git') continue;
      
      // Check against common trash patterns
      for (const [pattern, info] of Object.entries(commonTrash)) {
        const trashInfo = info as { reason: string; category: string };
        
        if (matchPattern(entry.name, pattern) || matchPattern(relativeFilePath, pattern)) {
          const existing = suggestions.find(s => s.pattern === pattern);
          
          if (existing) {
            existing.files.push(relativeFilePath);
          } else {
            suggestions.push({
              pattern,
              reason: trashInfo.reason,
              files: [relativeFilePath],
            });
          }
          break;
        }
      }
      
      // Recurse into directories
      if (entry.isDirectory() && !commonTrash[entry.name]) {
        scanDir(fullPath, relativeFilePath);
      }
    }
  }
  
  scanDir(repoPath);
  return suggestions;
}

function matchPattern(filename: string, pattern: string): boolean {
  const normalizedPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
  const regex = new RegExp(`^${normalizedPattern}$`, 'i');
  return regex.test(filename);
}

function readGitignore(repoPath: string): string[] {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function readWhitelist(repoPath: string): WhitelistEntry[] {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const lines = content.split('\n');
  const whitelist: WhitelistEntry[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith(WHITELIST_MARKER)) {
      // Next line is the pattern
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && !nextLine.startsWith('#')) {
        whitelist.push({
          pattern: nextLine,
          comment: line.replace(WHITELIST_MARKER, '').trim(),
        });
      }
    }
  }
  
  return whitelist;
}

export async function suggestIgnore(repoPath: string): Promise<void> {
  const suggestions = scanForTrash(repoPath);
  const existingPatterns = readGitignore(repoPath);
  const whitelist = readWhitelist(repoPath);
  
  // Filter out already ignored patterns
  const newSuggestions = suggestions.filter(s => 
    !existingPatterns.includes(s.pattern) &&
    !whitelist.some(w => w.pattern === s.pattern)
  );
  
  if (newSuggestions.length === 0) {
    console.log(chalk.green('✓ No new .gitignore suggestions'));
    return;
  }
  
  console.log(chalk.cyan.bold('\n🗑️  Smart Ignore Suggestions'));
  console.log(chalk.gray('─'.repeat(40)));
  
  for (const suggestion of newSuggestions) {
    console.log(chalk.yellow(`\n${suggestion.pattern}`));
    console.log(chalk.gray(`  Reason: ${suggestion.reason}`));
    console.log(chalk.gray(`  Files: ${suggestion.files.slice(0, 3).join(', ')}${suggestion.files.length > 3 ? ` (+${suggestion.files.length - 3} more)` : ''}`));
  }
  
  const { addToGitignore } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addToGitignore',
      message: 'Add these patterns to .gitignore?',
      default: true,
    },
  ]);
  
  if (addToGitignore) {
    addToGitignoreFile(repoPath, newSuggestions.map(s => s.pattern));
    console.log(chalk.green(`✓ Added ${newSuggestions.length} patterns to .gitignore`));
  }
}

function addToGitignoreFile(repoPath: string, patterns: string[]): void {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  let content = '';
  
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  
  const newContent = `${content}
# Auto-suggested by Cogit
${patterns.join('\n')}
`;
  
  fs.writeFileSync(gitignorePath, newContent);
}

export function addWhitelistEntry(repoPath: string, pattern: string, comment: string): void {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  let content = '';
  
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  
  // Remove pattern if it exists
  const lines = content.split('\n').filter(line => line.trim() !== pattern);
  
  // Add whitelist entry
  lines.push(`${WHITELIST_MARKER} ${comment}`);
  lines.push(pattern);
  
  fs.writeFileSync(gitignorePath, lines.join('\n'));
  console.log(chalk.green(`✓ Added whitelist entry: ${pattern}`));
}

export function removeWhitelistEntry(repoPath: string, pattern: string): void {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  if (!fs.existsSync(gitignorePath)) return;
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const lines = content.split('\n');
  const newLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith(WHITELIST_MARKER)) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine === pattern) {
        i++; // Skip the pattern line too
        continue;
      }
    }
    
    if (line !== pattern) {
      newLines.push(lines[i]);
    }
  }
  
  fs.writeFileSync(gitignorePath, newLines.join('\n'));
  console.log(chalk.green(`✓ Removed whitelist entry: ${pattern}`));
}
```

---

### 2.4 src/config/common_trash.json

**Propósito:** Padrões editáveis de arquivos a ignorar.

```json
{
  "node_modules": {
    "reason": "Node.js dependencies",
    "category": "dependencies"
  },
  "*.log": {
    "reason": "Log files",
    "category": "logs"
  },
  "*.tmp": {
    "reason": "Temporary files",
    "category": "temp"
  },
  "*.swp": {
    "reason": "Vim swap files",
    "category": "editor"
  },
  "*.swo": {
    "reason": "Vim swap files",
    "category": "editor"
  },
  ".DS_Store": {
    "reason": "macOS system file",
    "category": "system"
  },
  "Thumbs.db": {
    "reason": "Windows system file",
    "category": "system"
  },
  "*.pyc": {
    "reason": "Python bytecode",
    "category": "build"
  },
  "__pycache__": {
    "reason": "Python cache directory",
    "category": "build"
  },
  ".pytest_cache": {
    "reason": "Pytest cache",
    "category": "build"
  },
  ".coverage": {
    "reason": "Coverage report",
    "category": "build"
  },
  "htmlcov": {
    "reason": "Coverage HTML report",
    "category": "build"
  },
  "*.egg-info": {
    "reason": "Python package metadata",
    "category": "build"
  },
  "dist": {
    "reason": "Build output",
    "category": "build"
  },
  "build": {
    "reason": "Build output",
    "category": "build"
  },
  "*.o": {
    "reason": "Object files",
    "category": "build"
  },
  "*.class": {
    "reason": "Java class files",
    "category": "build"
  },
  ".gradle": {
    "reason": "Gradle cache",
    "category": "build"
  },
  "target": {
    "reason": "Maven/Gradle output",
    "category": "build"
  },
  "*.bak": {
    "reason": "Backup files",
    "category": "backup"
  },
  "*.backup": {
    "reason": "Backup files",
    "category": "backup"
  },
  "*~": {
    "reason": "Backup files",
    "category": "backup"
  },
  ".idea": {
    "reason": "JetBrains IDE config",
    "category": "ide"
  },
  ".vscode": {
    "reason": "VS Code config",
    "category": "ide"
  },
  "*.iml": {
    "reason": "IntelliJ module file",
    "category": "ide"
  },
  ".env.local": {
    "reason": "Local environment variables",
    "category": "secrets"
  },
  "*.pem": {
    "reason": "Certificate/Key file",
    "category": "secrets"
  },
  "*.key": {
    "reason": "Private key file",
    "category": "secrets"
  }
}
```

---

### 2.5 src/types/git.ts

**Propósito:** Tipos TypeScript para Git.

```typescript
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicts: string[];
}

export interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface RemoteInfo {
  name: string;
  url: string;
  fetchUrl?: string;
  pushUrl?: string;
}

export interface RepositoryInfo {
  path: string;
  isGitRepo: boolean;
  currentBranch: string;
  remotes: RemoteInfo[];
  hasUncommittedChanges: boolean;
  lastCommit?: CommitInfo;
}

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface FileDiff {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  insertions: number;
  deletions: number;
  diff: string;
}
```

---

## 3. Modificações em Arquivos Existentes

### 3.1 src/services/git/scanner.ts (Atualizado)

```typescript
// Adicionar import
import { smartPack, DiffData } from '../../core/vault';

// Modificar interface ScanResult
export interface ScanResult {
  isRepo: boolean;
  hasChanges: boolean;
  stagedFiles: string[];
  unstagedFiles: string[];
  diff: string;
  diffData: DiffData;  // NOVO
}

// Modificar função scanRepository
export async function scanRepository(repoPath: string): Promise<ScanResult> {
  // ... código existente ...
  
  // Get full diff
  const { stdout: diffOutput } = await execAsync('git diff HEAD', { cwd: repoPath });
  
  // Use smartPack for large diffs
  const diffData = smartPack(diffOutput);
  
  return {
    isRepo: true,
    hasChanges,
    stagedFiles,
    unstagedFiles,
    diff: diffOutput,
    diffData,  // NOVO
  };
}
```

### 3.2 src/services/ai/brain/index.ts (Atualizado)

```typescript
// Adicionar import
import { smartUnpack, formatSize, DiffData } from '../../../core/vault';

// Modificar interface BrainInput
export interface BrainInput {
  diff: string;
  diffData?: DiffData;  // NOVO
  hint?: string;
  language: string;
}

// Modificar função generateCommitMessage
export async function generateCommitMessage(input: BrainInput): Promise<BrainOutput> {
  const { diff, diffData, hint, language } = input;
  
  // Use diffData if available (for large diffs)
  let actualDiff = diff;
  if (diffData) {
    actualDiff = smartUnpack(diffData);
  }
  
  if (!actualDiff && !hint) {
    return {
      success: false,
      error: language === 'pt' ? 'Sem diff ou dica para trabalhar.' : 'No diff or hint to work with.',
    };
  }
  
  // Check if diff was truncated
  const originalSize = diffData?.originalSize || Buffer.byteLength(actualDiff, 'utf-8');
  if (originalSize > 100 * 1024) {
    console.log(chalk.yellow(`Note: Processing large diff (${formatSize(originalSize)})`));
  }
  
  // ... resto do código ...
}
```

### 3.3 src/cli/commands/auto.ts (Atualizado)

```typescript
// Adicionar imports
import { stealthStash, stealthRestore } from '../../services/tools/stealth';
import { suggestIgnore } from '../../services/tools/ignore';

// Modificar função autoCommand
export async function autoCommand(options: AutoOptions): Promise<void> {
  // ... validação existente ...
  
  // Stealth stash before operations
  const stealthResult = await stealthStash(repoPath);
  
  try {
    // ... scanner, sanitizer, AI, executor ...
    
    // All operations complete
  } finally {
    // Always restore stealth files
    if (stealthResult.hiddenFiles.length > 0) {
      await stealthRestore(repoPath);
    }
  }
  
  // After successful commit, suggest ignore
  if (result.success) {
    const { suggest } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'suggest',
        message: 'Check for .gitignore suggestions?',
        default: false,
      },
    ]);
    
    if (suggest) {
      await suggestIgnore(repoPath);
    }
  }
}
```

### 3.4 src/cli/commands/menu.ts (Atualizado)

```typescript
// Adicionar opções ao menu
choices: [
  { name: '🚀 Quick Commit (auto)', value: 'auto' },
  { name: '📝 Commit with options', value: 'commit-options' },
  { name: '🌿 Branch Center', value: 'branch' },
  { name: '🏷️  Tag Operations', value: 'tag' },
  { name: '🔍 View Repository Status', value: 'status' },
  { name: '🗑️  Smart Ignore', value: 'smart-ignore' },  // NOVO
  { name: '🔒 Stealth Mode Config', value: 'stealth' },  // NOVO
  { name: '🤖 Check AI Providers', value: 'check-ai' },
  { name: '⚙️  Settings', value: 'settings' },
  { name: '❌ Exit', value: 'exit' },
],

// Adicionar cases
case 'smart-ignore':
  const { suggestIgnore } = require('../../services/tools/ignore');
  await suggestIgnore(process.cwd());
  break;

case 'stealth':
  const { createPrivateConfig } = require('../../services/tools/stealth');
  const { patterns } = await inquirer.prompt([
    {
      type: 'input',
      name: 'patterns',
      message: 'Enter patterns (comma-separated):',
    },
  ]);
  createPrivateConfig(process.cwd(), patterns.split(',').map((p: string) => p.trim()));
  break;
```

---

## 4. Arquivo de Configuração .gitpy-private

**Exemplo:**

```text
# Cogit Private Files
# Files matching these patterns will be hidden during git operations

.my_secret_folder/
local_logs.txt
agent_configs_x/*.json
**/private/**
*.local.env
secrets.json
```

---

## 5. Fluxo de Execução

### Stealth Mode

```
1. Antes das operações Git
2. Lê padrões de .gitpy-private
3. Move arquivos matching para .gitpy-temp/
4. Garante .gitpy-temp/ no .gitignore
5. Git "enxerga" apenas arquivos públicos
6. Após operações, restaura arquivos
7. Trata conflitos (renomeia para .restored)
```

### VibeVault (Diffs > 100KB)

```
1. Scanner detecta diff grande
2. smartPack() armazena em memória
3. Retorna referência + preview
4. AI Brain usa smartUnpack() para recuperar
5. Processa diff completo
6. Limpa referência após uso
```

### Smart Ignore

```
1. Escaneia repositório
2. Compara com common_trash.json
3. Sugere padrões não ignorados
4. Usuário confirma adição
5. Adiciona ao .gitignore
```

---

## 6. Critérios de Aceitação

- [ ] VibeVault gerencia diffs > 100KB
- [ ] Preview de diffs grandes funciona
- [ ] Stealth Mode oculta arquivos privados
- [ ] Stealth Mode restaura arquivos após operações
- [ ] Conflitos de restauração são renomeados
- [ ] Smart Ignore sugere padrões
- [ ] Smart Whitelist permite exceções
- [ ] common_trash.json é editável
- [ ] Menu inclui opções de Smart Ignore e Stealth

---

## 7. Comandos de Teste

```bash
# Criar arquivo .gitpy-private
echo "secrets.txt" > .gitpy-private

# Testar stealth mode
cogit auto --yes
# → Arquivo secrets.txt deve ser movido temporariamente

# Testar smart ignore
cogit menu
# → Selecionar "Smart Ignore"

# Testar diff grande (criar arquivo grande)
dd if=/dev/zero of=largefile.bin bs=1024 count=200
git add largefile.bin
cogit auto --dry-run
# → Deve mostrar "Processing large diff"
```
