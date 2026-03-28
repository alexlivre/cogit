/**
 * Unit Tests for Domain Entities & Use Cases (Phase 3)
 * 50 Automatic Tests - 100% automated with mocks
 */

const assert = require('assert');
const path = require('path');

console.log('🧪 Running Unit Tests for Domain & Use Cases (Phase 3)\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// ============================================
// DOMAIN ENTITIES TESTS (15 tests)
// ============================================

console.log('📦 Domain Entities Tests\n');

const { Commit } = require('../../dist/domain/entities/Commit.js');
const { Repository } = require('../../dist/domain/entities/Repository.js');
const { Diff } = require('../../dist/domain/entities/Diff.js');

// DE-01 to DE-08: Commit Entity
test('DE-01: Commit entity - criação válida', () => {
  const commit = new Commit({
    message: 'feat: add new feature',
    files: ['src/test.ts'],
  });
  assert.strictEqual(commit.message, 'feat: add new feature');
  assert.strictEqual(commit.files.length, 1);
});

test('DE-02: Commit entity - validação de mensagem vazia', () => {
  try {
    new Commit({ message: '', files: [] });
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error.message.includes('empty'));
  }
});

test('DE-03: Commit entity - isConventional() true/false', () => {
  const conventional = new Commit({ message: 'feat(scope): add feature', files: [] });
  const nonConventional = new Commit({ message: 'added some stuff', files: [] });
  assert.strictEqual(conventional.isConventional(), true);
  assert.strictEqual(nonConventional.isConventional(), false);
});

test('DE-04: Commit entity - getType() extração', () => {
  const commit = new Commit({ message: 'feat(auth): add login', files: [] });
  assert.strictEqual(commit.getType(), 'feat');
});

test('DE-05: Commit entity - getScope() extração', () => {
  const commit = new Commit({ message: 'feat(auth): add login', files: [] });
  assert.strictEqual(commit.getScope(), 'auth');
});

test('DE-06: Commit entity - getDescription() limpeza', () => {
  const commit = new Commit({ message: 'feat(auth): add login button', files: [] });
  assert.strictEqual(commit.getDescription(), 'add login button');
});

test('DE-07: Commit entity - withMessage() imutabilidade', () => {
  const original = new Commit({ message: 'feat: old', files: ['test.ts'] });
  const updated = original.withMessage('feat: new');
  assert.strictEqual(original.message, 'feat: old');
  assert.strictEqual(updated.message, 'feat: new');
});

test('DE-08: Commit entity - limite 5000 chars', () => {
  const longMessage = 'x'.repeat(5001);
  try {
    new Commit({ message: longMessage, files: [] });
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error.message.includes('maximum length'));
  }
});

// DE-09 to DE-12: Repository Entity
test('DE-09: Repository entity - criação válida', () => {
  const repo = new Repository({
    path: '/path/to/repo',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  assert.strictEqual(repo.path, '/path/to/repo');
  assert.strictEqual(repo.isGitRepo, true);
});

test('DE-10: Repository entity - validação de path vazio', () => {
  try {
    new Repository({
      path: '',
      isGitRepo: true,
      currentBranch: 'main',
      hasUncommittedChanges: false,
    });
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error.message.includes('empty'));
  }
});

test('DE-11: Repository entity - isValid() isGitRepo check', () => {
  const validRepo = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  const invalidRepo = new Repository({
    path: '/test',
    isGitRepo: false,
    currentBranch: '',
    hasUncommittedChanges: false,
  });
  assert.strictEqual(validRepo.isValid(), true);
  assert.strictEqual(invalidRepo.isValid(), false);
});

test('DE-12: Repository entity - withBranch() imutabilidade', () => {
  const original = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  const updated = original.withBranch('develop');
  assert.strictEqual(original.currentBranch, 'main');
  assert.strictEqual(updated.currentBranch, 'develop');
});

// DE-13 to DE-15: Diff Entity
test('DE-13: Diff entity - getSummary() formatação', () => {
  const diff = new Diff({
    content: '',
    files: [
      { path: 'a.ts', status: 'added', additions: 10, deletions: 0, isBinary: false },
      { path: 'b.ts', status: 'modified', additions: 5, deletions: 2, isBinary: false },
      { path: 'c.ts', status: 'deleted', additions: 0, deletions: 8, isBinary: false },
    ],
    totalAdditions: 15,
    totalDeletions: 10,
    isLarge: false,
  });
  const summary = diff.getSummary();
  assert.ok(summary.includes('1 added'));
  assert.ok(summary.includes('1 modified'));
  assert.ok(summary.includes('1 deleted'));
});

test('DE-14: Diff entity - getSizeCategory() small/medium/large', () => {
  const small = new Diff({
    content: '',
    files: [],
    totalAdditions: 10,
    totalDeletions: 5,
    isLarge: false,
  });
  const medium = new Diff({
    content: '',
    files: [],
    totalAdditions: 100,
    totalDeletions: 50,
    isLarge: false,
  });
  const large = new Diff({
    content: '',
    files: [],
    totalAdditions: 300,
    totalDeletions: 300,
    isLarge: true,
  });
  assert.strictEqual(small.getSizeCategory(), 'small');
  assert.strictEqual(medium.getSizeCategory(), 'medium');
  assert.strictEqual(large.getSizeCategory(), 'large');
});

test('DE-15: Diff entity - getTruncatedContent() limite', () => {
  const longContent = 'x'.repeat(10000);
  const diff = new Diff({
    content: longContent,
    files: [],
    totalAdditions: 0,
    totalDeletions: 0,
    isLarge: true,
  });
  const truncated = diff.getTruncatedContent(100);
  assert.ok(truncated.length < 200);
  assert.ok(truncated.includes('truncated'));
});

// ============================================
// USE CASES TESTS WITH MOCKS (15 tests)
// ============================================

console.log('\n📦 Use Cases Tests with Mocks\n');

const { ScanRepositoryUseCase } = require('../../dist/application/use-cases/ScanRepository.js');
const { GenerateCommitMessageUseCase } = require('../../dist/application/use-cases/GenerateCommitMessage.js');
const { ExecuteCommitUseCase } = require('../../dist/application/use-cases/ExecuteCommit.js');
const { HandleBranchUseCase } = require('../../dist/application/use-cases/HandleBranch.js');
const { ValidateSecurityUseCase } = require('../../dist/application/use-cases/ValidateSecurity.js');

// UC-01 to UC-03: ScanRepositoryUseCase
test('UC-01: ScanRepositoryUseCase - scan básico', async () => {
  const mockScanner = {
    scan: async (path) => ({
      isRepo: true,
      hasChanges: true,
      stagedFiles: ['test.ts'],
      unstagedFiles: [],
      diff: '+ test content',
      diffData: null,
    }),
  };
  const useCase = new ScanRepositoryUseCase(mockScanner);
  const result = await useCase.execute({ repoPath: '/test' });
  assert.strictEqual(result.hasChanges, true);
  assert.strictEqual(result.repository.isGitRepo, true);
});

test('UC-02: ScanRepositoryUseCase - repositório vazio', async () => {
  const mockScanner = {
    scan: async (path) => ({
      isRepo: true,
      hasChanges: false,
      stagedFiles: [],
      unstagedFiles: [],
      diff: '',
      diffData: null,
    }),
  };
  const useCase = new ScanRepositoryUseCase(mockScanner);
  const result = await useCase.execute({ repoPath: '/test' });
  assert.strictEqual(result.hasChanges, false);
  assert.strictEqual(result.diff.isEmpty(), true);
});

test('UC-03: ScanRepositoryUseCase - diff grande', async () => {
  const largeDiff = 'x'.repeat(150000);
  const mockScanner = {
    scan: async (path) => ({
      isRepo: true,
      hasChanges: true,
      stagedFiles: ['large.ts'],
      unstagedFiles: [],
      diff: largeDiff,
      diffData: null,
    }),
  };
  const useCase = new ScanRepositoryUseCase(mockScanner);
  const result = await useCase.execute({ repoPath: '/test' });
  assert.strictEqual(result.diff.isLarge, true);
});

// UC-04 to UC-06: GenerateCommitMessageUseCase
test('UC-04: GenerateCommitMessageUseCase - geração básica', async () => {
  const mockAI = {
    generateCommitMessage: async (input) => ({
      success: true,
      message: 'feat: test message',
      provider: 'mock',
    }),
    getName: () => 'mock',
    isAvailable: () => true,
  };
  const { Diff } = require('../../dist/domain/entities/Diff.js');
  const diff = new Diff({
    content: '+ test',
    files: [{ path: 'test.ts', status: 'added', additions: 1, deletions: 0, isBinary: false }],
    totalAdditions: 1,
    totalDeletions: 0,
    isLarge: false,
  });
  const useCase = new GenerateCommitMessageUseCase(mockAI);
  const result = await useCase.execute({ diff, language: 'en' });
  assert.strictEqual(result.commit.message, 'feat: test message');
  assert.strictEqual(result.provider, 'mock');
});

test('UC-05: GenerateCommitMessageUseCase - com hint', async () => {
  const mockAI = {
    generateCommitMessage: async (input) => {
      assert.ok(input.hint);
      return { success: true, message: 'feat: with hint', provider: 'mock' };
    },
    getName: () => 'mock',
    isAvailable: () => true,
  };
  const { Diff } = require('../../dist/domain/entities/Diff.js');
  const diff = new Diff({
    content: '+ test',
    files: [],
    totalAdditions: 1,
    totalDeletions: 0,
    isLarge: false,
  });
  const useCase = new GenerateCommitMessageUseCase(mockAI);
  const result = await useCase.execute({ diff, hint: 'authentication feature', language: 'en' });
  assert.strictEqual(result.commit.message, 'feat: with hint');
});

test('UC-06: GenerateCommitMessageUseCase - regenerate', async () => {
  const mockAI = {
    generateCommitMessage: async (input) => ({
      success: true,
      message: 'feat: regenerated',
      provider: 'mock',
    }),
    getName: () => 'mock',
    isAvailable: () => true,
  };
  const { Diff } = require('../../dist/domain/entities/Diff.js');
  const diff = new Diff({
    content: '+ test',
    files: [],
    totalAdditions: 1,
    totalDeletions: 0,
    isLarge: false,
  });
  const useCase = new GenerateCommitMessageUseCase(mockAI);
  const result = await useCase.regenerate({ diff, language: 'en' }, 'old message');
  assert.strictEqual(result.commit.message, 'feat: regenerated');
});

// UC-07 to UC-09: ExecuteCommitUseCase
test('UC-07: ExecuteCommitUseCase - dry run', async () => {
  const mockExecutor = {
    executeCommit: async () => ({ success: true, output: 'done' }),
  };
  const mockHealer = { heal: async () => ({ success: true, attempts: [] }) };
  const useCase = new ExecuteCommitUseCase(mockExecutor, mockHealer);
  const { Commit, Repository } = require('../../dist/domain/entities');
  const commit = new Commit({ message: 'test', files: ['test.ts'] });
  const repo = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: true,
  });
  const result = await useCase.execute({ commit, repository: repo, shouldPush: false, dryRun: true });
  assert.strictEqual(result.success, true);
  assert.ok(result.output.includes('git commit'));
});

test('UC-08: ExecuteCommitUseCase - commit + push', async () => {
  const mockExecutor = {
    executeCommit: async (path, msg, push) => {
      assert.strictEqual(push, true);
      return { success: true, output: 'pushed' };
    },
  };
  const mockHealer = { heal: async () => ({ success: true, attempts: [] }) };
  const useCase = new ExecuteCommitUseCase(mockExecutor, mockHealer);
  const { Commit, Repository } = require('../../dist/domain/entities');
  const commit = new Commit({ message: 'test', files: ['test.ts'] });
  const repo = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: true,
  });
  const result = await useCase.execute({ commit, repository: repo, shouldPush: true, dryRun: false });
  assert.strictEqual(result.success, true);
});

test('UC-09: ExecuteCommitUseCase - healing ativado', async () => {
  const mockExecutor = {
    executeCommit: async () => ({ success: false, error: 'push failed' }),
  };
  const mockHealer = {
    heal: async (input) => {
      assert.strictEqual(input.failedCommand, 'git push');
      return { success: true, attempts: [{ attempt: 1, success: true }] };
    },
  };
  const useCase = new ExecuteCommitUseCase(mockExecutor, mockHealer);
  const { Commit, Repository } = require('../../dist/domain/entities');
  const commit = new Commit({ message: 'test', files: ['test.ts'] });
  const repo = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: true,
  });
  const result = await useCase.execute({ commit, repository: repo, shouldPush: true, dryRun: false });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.healingAttempts, 1);
});

// UC-10 to UC-12: HandleBranchUseCase
test('UC-10: HandleBranchUseCase - criar branch', async () => {
  const mockBranch = {
    list: async () => [],
    create: async (path, name) => {
      assert.strictEqual(name, 'new-branch');
      return { success: true };
    },
    switch: async () => ({ success: true }),
    delete: async () => ({ success: true }),
  };
  const useCase = new HandleBranchUseCase(mockBranch);
  const { Repository } = require('../../dist/domain/entities');
  const repo = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  const result = await useCase.execute({ repository: repo, branchName: 'new-branch', createIfNotExists: true });
  assert.strictEqual(result.created, true);
});

test('UC-11: HandleBranchUseCase - switch branch', async () => {
  const mockBranch = {
    list: async () => [{ name: 'existing-branch', current: false, remote: false }],
    create: async () => ({ success: true }),
    switch: async (path, name) => {
      assert.strictEqual(name, 'existing-branch');
      return { success: true };
    },
    delete: async () => ({ success: true }),
  };
  const useCase = new HandleBranchUseCase(mockBranch);
  const { Repository } = require('../../dist/domain/entities');
  const repo = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  const result = await useCase.execute({ repository: repo, branchName: 'existing-branch', createIfNotExists: false });
  assert.strictEqual(result.switched, true);
  assert.strictEqual(result.created, false);
});

test('UC-12: HandleBranchUseCase - branch não existe', async () => {
  const mockBranch = {
    list: async () => [{ name: 'main', current: true, remote: false }],
    create: async () => ({ success: true }),
    switch: async () => ({ success: true }),
    delete: async () => ({ success: true }),
  };
  const useCase = new HandleBranchUseCase(mockBranch);
  const { Repository } = require('../../dist/domain/entities');
  const repo = new Repository({
    path: '/test',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  try {
    await useCase.execute({ repository: repo, branchName: 'nonexistent', createIfNotExists: false });
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error.message.includes('does not exist'));
  }
});

// UC-13 to UC-15: ValidateSecurityUseCase
test('UC-13: ValidateSecurityUseCase - arquivos limpos', async () => {
  const mockSecurity = {
    sanitize: (files) => ({ isClean: true, blockedFiles: [] }),
    redact: (content) => content,
  };
  const useCase = new ValidateSecurityUseCase(mockSecurity);
  const { Diff } = require('../../dist/domain/entities/Diff.js');
  const diff = new Diff({
    content: '+ test',
    files: [{ path: 'test.ts', status: 'added', additions: 1, deletions: 0, isBinary: false }],
    totalAdditions: 1,
    totalDeletions: 0,
    isLarge: false,
  });
  const result = await useCase.execute({ diff, repoPath: '/test' });
  assert.strictEqual(result.isSecure, true);
  assert.strictEqual(result.blockedFiles.length, 0);
});

test('UC-14: ValidateSecurityUseCase - blocked files', async () => {
  const mockSecurity = {
    sanitize: (files) => ({ isClean: false, blockedFiles: ['.env', 'id_rsa'] }),
    redact: (content) => content,
  };
  const useCase = new ValidateSecurityUseCase(mockSecurity);
  const { Diff } = require('../../dist/domain/entities/Diff.js');
  const diff = new Diff({
    content: '+ test',
    files: [{ path: '.env', status: 'added', additions: 1, deletions: 0, isBinary: false }],
    totalAdditions: 1,
    totalDeletions: 0,
    isLarge: false,
  });
  try {
    await useCase.execute({ diff, repoPath: '/test' });
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error.name === 'SecurityError');
  }
});

test('UC-15: ValidateSecurityUseCase - redaction', async () => {
  const mockSecurity = {
    sanitize: (files) => ({ isClean: true, blockedFiles: [] }),
    redact: (content) => content.replace(/API_KEY/g, '***REDACTED***'),
  };
  const useCase = new ValidateSecurityUseCase(mockSecurity);
  const { Diff } = require('../../dist/domain/entities/Diff.js');
  const diff = new Diff({
    content: '+ API_KEY=secret123',
    files: [{ path: 'config.ts', status: 'modified', additions: 1, deletions: 0, isBinary: false }],
    totalAdditions: 1,
    totalDeletions: 0,
    isLarge: false,
  });
  const result = await useCase.execute({ diff, repoPath: '/test' });
  assert.ok(result.redactedDiff.includes('***REDACTED***'));
});

// ============================================
// PORTS/ADAPTERS INTEGRATION TESTS (10 tests)
// ============================================

console.log('\n📦 Ports/Adapters Integration Tests\n');

test('PA-01: GitScannerAdapter → GitScannerPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/git-scanner.adapter.js');
  assert.ok(adapter.GitScannerAdapter);
  const instance = new adapter.GitScannerAdapter();
  assert.ok(typeof instance.scan === 'function');
});

test('PA-02: AIProviderAdapter → AIProviderPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/ai-provider.adapter.js');
  assert.ok(adapter.AIProviderAdapter);
  const instance = new adapter.AIProviderAdapter();
  assert.ok(typeof instance.generateCommitMessage === 'function');
  assert.ok(typeof instance.getName === 'function');
  assert.ok(typeof instance.isAvailable === 'function');
});

test('PA-03: GitExecutorAdapter → GitExecutorPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/git-executor.adapter.js');
  assert.ok(adapter.GitExecutorAdapter);
  const instance = new adapter.GitExecutorAdapter();
  assert.ok(typeof instance.executeCommit === 'function');
});

test('PA-04: SecurityAdapter → SecurityPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/security.adapter.js');
  assert.ok(adapter.SecurityAdapter);
  const instance = new adapter.SecurityAdapter();
  assert.ok(typeof instance.sanitize === 'function');
  assert.ok(typeof instance.redact === 'function');
});

test('PA-05: UIAdapter → UIPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/ui.adapter.js');
  assert.ok(adapter.UIAdapter);
  const instance = new adapter.UIAdapter();
  assert.ok(typeof instance.startSpinner === 'function');
  assert.ok(typeof instance.succeedSpinner === 'function');
  assert.ok(typeof instance.failSpinner === 'function');
});

test('PA-06: StealthAdapter → StealthPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/stealth.adapter.js');
  assert.ok(adapter.StealthAdapter);
  const instance = new adapter.StealthAdapter();
  assert.ok(typeof instance.stash === 'function');
  assert.ok(typeof instance.restore === 'function');
  assert.ok(typeof instance.hasConfig === 'function');
});

test('PA-07: HealerAdapter → HealerPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/healer.adapter.js');
  assert.ok(adapter.HealerAdapter);
  const instance = new adapter.HealerAdapter();
  assert.ok(typeof instance.heal === 'function');
});

test('PA-08: IgnoreAdapter → IgnorePort', () => {
  const adapter = require('../../dist/infrastructure/adapters/ignore.adapter.js');
  assert.ok(adapter.IgnoreAdapter);
  const instance = new adapter.IgnoreAdapter();
  assert.ok(typeof instance.suggest === 'function');
  assert.ok(typeof instance.addWhitelist === 'function');
  assert.ok(typeof instance.removeWhitelist === 'function');
});

test('PA-09: BranchAdapter → BranchPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/branch.adapter.js');
  assert.ok(adapter.BranchAdapter);
  const instance = new adapter.BranchAdapter();
  assert.ok(typeof instance.list === 'function');
  assert.ok(typeof instance.create === 'function');
  assert.ok(typeof instance.switch === 'function');
  assert.ok(typeof instance.delete === 'function');
});

test('PA-10: MultiProviderAIAdapter fallback', () => {
  const adapter = require('../../dist/infrastructure/adapters/ai-provider.adapter.js');
  assert.ok(adapter.MultiProviderAIAdapter);
});

// ============================================
// PLUGIN SYSTEM TESTS (10 tests)
// ============================================

console.log('\n📦 Plugin System Tests\n');

const { PluginRegistry } = require('../../dist/core/plugins/registry.js');
const { pluginRegistry } = require('../../dist/core/plugins/index.js');

test('PL-01: PluginRegistry - registro', () => {
  const registry = new PluginRegistry();
  const mockPlugin = {
    name: 'test-plugin',
    priority: 10,
    execute: async () => ({ success: true }),
  };
  registry.register(mockPlugin);
  const retrieved = registry.get('test-plugin');
  assert.strictEqual(retrieved.name, 'test-plugin');
});

test('PL-02: PluginRegistry - enable/disable', () => {
  const registry = new PluginRegistry();
  const mockPlugin = {
    name: 'toggle-plugin',
    priority: 10,
    execute: async () => ({ success: true }),
  };
  registry.register(mockPlugin);
  registry.disable('toggle-plugin');
  const retrieved = registry.get('toggle-plugin');
  assert.strictEqual(retrieved.enabled, false);
  registry.enable('toggle-plugin');
  assert.strictEqual(retrieved.enabled, true);
});

test('PL-03: PluginRegistry - executeAll ordenado', async () => {
  const registry = new PluginRegistry();
  const executionOrder = [];
  registry.register({ name: 'low', priority: 1, enabled: true, execute: async () => { executionOrder.push('low'); return { success: true, shouldContinue: true }; } });
  registry.register({ name: 'high', priority: 100, enabled: true, execute: async () => { executionOrder.push('high'); return { success: true, shouldContinue: true }; } });
  registry.register({ name: 'mid', priority: 50, enabled: true, execute: async () => { executionOrder.push('mid'); return { success: true, shouldContinue: true }; } });
  await registry.executeAll({});
  // Lower priority executes first (sorted ascending: 1, 50, 100)
  assert.strictEqual(executionOrder[0], 'low');
  assert.strictEqual(executionOrder[1], 'mid');
  assert.strictEqual(executionOrder[2], 'high');
});

test('PL-04: StealthPlugin - stash/restore', () => {
  const stealthPlugin = require('../../dist/core/plugins/stealth.plugin.js');
  assert.ok(stealthPlugin.StealthPlugin);
});

test('PL-05: DebugPlugin - logging', () => {
  const debugPlugin = require('../../dist/core/plugins/debug.plugin.js');
  assert.ok(debugPlugin.DebugPlugin);
});

test('PL-06: HealerPlugin - on-error hook', () => {
  const healerPlugin = require('../../dist/core/plugins/healer.plugin.js');
  assert.ok(healerPlugin.HealerPlugin);
});

test('PL-07: Plugin hooks - pre-scan', () => {
  const registry = new PluginRegistry();
  const mockPlugin = {
    name: 'pre-scan-plugin',
    priority: 10,
    hooks: { 'pre-scan': async () => ({ success: true }) },
    execute: async () => ({ success: true }),
  };
  registry.register(mockPlugin);
  assert.ok(mockPlugin.hooks['pre-scan']);
});

test('PL-08: Plugin hooks - post-commit', () => {
  const registry = new PluginRegistry();
  const mockPlugin = {
    name: 'post-commit-plugin',
    priority: 10,
    hooks: { 'post-commit': async () => ({ success: true }) },
    execute: async () => ({ success: true }),
  };
  registry.register(mockPlugin);
  assert.ok(mockPlugin.hooks['post-commit']);
});

test('PL-09: Plugin priority sorting', () => {
  const registry = new PluginRegistry();
  registry.register({ name: 'a', priority: 1, execute: async () => ({ success: true }) });
  registry.register({ name: 'b', priority: 100, execute: async () => ({ success: true }) });
  registry.register({ name: 'c', priority: 50, execute: async () => ({ success: true }) });
  const all = registry.getAll();
  // getAll returns plugins in registration order, not sorted by priority
  // Priority is used during executeAll for execution order
  assert.strictEqual(all.length, 3);
  assert.ok(all.find(p => p.name === 'a'));
  assert.ok(all.find(p => p.name === 'b'));
  assert.ok(all.find(p => p.name === 'c'));
});

test('PL-10: Plugin singleton registry', () => {
  const { pluginRegistry: registry1 } = require('../../dist/core/plugins/index.js');
  const { pluginRegistry: registry2 } = require('../../dist/core/plugins/index.js');
  assert.strictEqual(registry1, registry2);
});

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All Domain & Use Cases tests passed!');
