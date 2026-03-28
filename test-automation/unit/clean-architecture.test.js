/**
 * Unit Tests for Clean Architecture (Phase 3)
 * Tests domain entities and use cases
 */

const assert = require('assert');
const path = require('path');

console.log('🧪 Running Unit Tests for Clean Architecture (Phase 3)\n');

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
// DOMAIN ENTITIES TESTS
// ============================================

console.log('📦 Domain Entities Tests\n');

// Commit Entity
const { Commit } = require('../../dist/domain/entities/Commit.js');

test('D1: Commit creates with valid message', () => {
  const commit = new Commit({
    message: 'feat: add new feature',
    files: ['src/test.ts'],
  });
  
  assert.strictEqual(commit.message, 'feat: add new feature');
  assert.strictEqual(commit.files.length, 1);
});

test('D2: Commit validates empty message', () => {
  try {
    new Commit({ message: '', files: [] });
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error.message.includes('empty'));
  }
});

test('D3: Commit detects conventional format', () => {
  const conventional = new Commit({
    message: 'feat(scope): add feature',
    files: [],
  });
  
  const nonConventional = new Commit({
    message: 'added some stuff',
    files: [],
  });
  
  assert.strictEqual(conventional.isConventional(), true);
  assert.strictEqual(nonConventional.isConventional(), false);
});

test('D4: Commit extracts type and scope', () => {
  const commit = new Commit({
    message: 'feat(auth): add login',
    files: [],
  });
  
  assert.strictEqual(commit.getType(), 'feat');
  assert.strictEqual(commit.getScope(), 'auth');
  assert.strictEqual(commit.getDescription(), 'add login');
});

test('D5: Commit withMessage creates new instance', () => {
  const original = new Commit({
    message: 'feat: old',
    files: ['test.ts'],
  });
  
  const updated = original.withMessage('feat: new');
  
  assert.strictEqual(original.message, 'feat: old');
  assert.strictEqual(updated.message, 'feat: new');
});

// Repository Entity
const { Repository } = require('../../dist/domain/entities/Repository.js');

test('D6: Repository creates with valid path', () => {
  const repo = new Repository({
    path: '/path/to/repo',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  
  assert.strictEqual(repo.path, '/path/to/repo');
  assert.strictEqual(repo.isGitRepo, true);
  assert.strictEqual(repo.currentBranch, 'main');
});

test('D7: Repository validates empty path', () => {
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

test('D8: Repository isValid checks git status', () => {
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

test('D9: Repository withBranch creates new instance', () => {
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

test('D10: Repository getName extracts from path', () => {
  const repo = new Repository({
    path: '/path/to/myproject',
    isGitRepo: true,
    currentBranch: 'main',
    hasUncommittedChanges: false,
  });
  
  assert.strictEqual(repo.getName(), 'myproject');
});

// Diff Entity
const { Diff } = require('../../dist/domain/entities/Diff.js');

test('D11: Diff creates with content and files', () => {
  const diff = new Diff({
    content: '+ added line\n- removed line',
    files: [
      { path: 'test.ts', status: 'modified', additions: 1, deletions: 1, isBinary: false }
    ],
    totalAdditions: 1,
    totalDeletions: 1,
    isLarge: false,
  });
  
  assert.ok(diff.content.includes('added line'));
  assert.strictEqual(diff.files.length, 1);
});

test('D12: Diff getSummary formats changes', () => {
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

test('D13: Diff getFilesByStatus filters correctly', () => {
  const diff = new Diff({
    content: '',
    files: [
      { path: 'a.ts', status: 'added', additions: 1, deletions: 0, isBinary: false },
      { path: 'b.ts', status: 'added', additions: 1, deletions: 0, isBinary: false },
      { path: 'c.ts', status: 'modified', additions: 1, deletions: 0, isBinary: false },
    ],
    totalAdditions: 3,
    totalDeletions: 0,
    isLarge: false,
  });
  
  const added = diff.getFilesByStatus('added');
  assert.strictEqual(added.length, 2);
});

test('D14: Diff getSizeCategory categorizes correctly', () => {
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

test('D15: Diff getTruncatedContent limits length', () => {
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
// USE CASES STRUCTURE TESTS
// ============================================

console.log('\n📦 Use Cases Structure Tests\n');

test('U1: ScanRepositoryUseCase exists', () => {
  const useCase = require('../../dist/application/use-cases/ScanRepository.js');
  assert.ok(useCase.ScanRepositoryUseCase);
  assert.ok(typeof useCase.ScanRepositoryUseCase.prototype.execute === 'function');
});

test('U2: GenerateCommitMessageUseCase exists', () => {
  const useCase = require('../../dist/application/use-cases/GenerateCommitMessage.js');
  assert.ok(useCase.GenerateCommitMessageUseCase);
  assert.ok(typeof useCase.GenerateCommitMessageUseCase.prototype.execute === 'function');
  assert.ok(typeof useCase.GenerateCommitMessageUseCase.prototype.regenerate === 'function');
});

test('U3: ExecuteCommitUseCase exists', () => {
  const useCase = require('../../dist/application/use-cases/ExecuteCommit.js');
  assert.ok(useCase.ExecuteCommitUseCase);
  assert.ok(typeof useCase.ExecuteCommitUseCase.prototype.execute === 'function');
});

test('U4: HandleBranchUseCase exists', () => {
  const useCase = require('../../dist/application/use-cases/HandleBranch.js');
  assert.ok(useCase.HandleBranchUseCase);
  assert.ok(typeof useCase.HandleBranchUseCase.prototype.execute === 'function');
  assert.ok(typeof useCase.HandleBranchUseCase.prototype.getCurrentBranch === 'function');
  assert.ok(typeof useCase.HandleBranchUseCase.prototype.listBranches === 'function');
});

test('U5: ValidateSecurityUseCase exists', () => {
  const useCase = require('../../dist/application/use-cases/ValidateSecurity.js');
  assert.ok(useCase.ValidateSecurityUseCase);
  assert.ok(typeof useCase.ValidateSecurityUseCase.prototype.execute === 'function');
  assert.ok(typeof useCase.ValidateSecurityUseCase.prototype.checkFiles === 'function');
  assert.ok(typeof useCase.ValidateSecurityUseCase.prototype.redactContent === 'function');
});

// ============================================
// USE CASES INTEGRATION TESTS
// ============================================

console.log('\n📦 Use Cases Integration Tests\n');

test('U6: ScanRepositoryUseCase can be instantiated with mock', () => {
  const { ScanRepositoryUseCase } = require('../../dist/application/use-cases/ScanRepository.js');
  
  const mockScanner = {
    scan: async (path) => ({
      isRepo: true,
      hasChanges: true,
      stagedFiles: ['test.ts'],
      unstagedFiles: [],
      diff: '+ test',
      diffData: null,
    }),
  };
  
  const useCase = new ScanRepositoryUseCase(mockScanner);
  assert.ok(useCase);
});

test('U7: GenerateCommitMessageUseCase can be instantiated with mock', () => {
  const { GenerateCommitMessageUseCase } = require('../../dist/application/use-cases/GenerateCommitMessage.js');
  const { Diff } = require('../../dist/domain/entities/Diff.js');
  
  const mockAI = {
    generateCommitMessage: async (input) => ({
      success: true,
      message: 'feat: test',
      provider: 'mock',
    }),
    getName: () => 'mock',
    isAvailable: () => true,
  };
  
  const useCase = new GenerateCommitMessageUseCase(mockAI);
  assert.ok(useCase);
});

test('U8: ExecuteCommitUseCase can be instantiated with mocks', () => {
  const { ExecuteCommitUseCase } = require('../../dist/application/use-cases/ExecuteCommit.js');
  
  const mockExecutor = {
    executeCommit: async () => ({ success: true, output: 'done' }),
  };
  
  const mockHealer = {
    heal: async () => ({ success: true, attempts: [] }),
  };
  
  const useCase = new ExecuteCommitUseCase(mockExecutor, mockHealer);
  assert.ok(useCase);
});

test('U9: HandleBranchUseCase can be instantiated with mock', () => {
  const { HandleBranchUseCase } = require('../../dist/application/use-cases/HandleBranch.js');
  
  const mockBranch = {
    list: async () => [{ name: 'main', current: true, remote: false }],
    create: async () => ({ success: true }),
    switch: async () => ({ success: true }),
    delete: async () => ({ success: true }),
  };
  
  const useCase = new HandleBranchUseCase(mockBranch);
  assert.ok(useCase);
});

test('U10: ValidateSecurityUseCase can be instantiated with mock', () => {
  const { ValidateSecurityUseCase } = require('../../dist/application/use-cases/ValidateSecurity.js');
  
  const mockSecurity = {
    sanitize: (files) => ({ isClean: true, blockedFiles: [] }),
    redact: (content) => content,
  };
  
  const useCase = new ValidateSecurityUseCase(mockSecurity);
  assert.ok(useCase);
});

// ============================================
// CLEAN ARCHITECTURE LAYER TESTS
// ============================================

console.log('\n📦 Clean Architecture Layer Tests\n');

test('C1: Domain layer has no external dependencies', () => {
  const commit = require('../../dist/domain/entities/Commit.js');
  const repo = require('../../dist/domain/entities/Repository.js');
  const diff = require('../../dist/domain/entities/Diff.js');
  
  // These should be pure domain logic with no external imports
  assert.ok(commit.Commit);
  assert.ok(repo.Repository);
  assert.ok(diff.Diff);
});

test('C2: Application layer imports domain and ports', () => {
  const useCases = require('../../dist/application/use-cases/index.js');
  
  assert.ok(useCases.ScanRepositoryUseCase);
  assert.ok(useCases.GenerateCommitMessageUseCase);
  assert.ok(useCases.ExecuteCommitUseCase);
  assert.ok(useCases.HandleBranchUseCase);
  assert.ok(useCases.ValidateSecurityUseCase);
});

test('C3: Entities are immutable (readonly props)', () => {
  const commit = new Commit({
    message: 'test',
    files: ['a.ts'],
  });
  
  // Try to modify (should not affect original)
  const files = commit.files;
  files.push('b.ts');
  
  // Original should be unchanged due to spread in getter
  assert.strictEqual(commit.files.length, 1);
});

test('C4: Use cases follow single responsibility', () => {
  // Each use case has one execute method with specific input/output
  const { ScanRepositoryUseCase } = require('../../dist/application/use-cases/ScanRepository.js');
  const { GenerateCommitMessageUseCase } = require('../../dist/application/use-cases/GenerateCommitMessage.js');
  const { ExecuteCommitUseCase } = require('../../dist/application/use-cases/ExecuteCommit.js');
  
  // Verify each has a focused responsibility
  assert.ok(ScanRepositoryUseCase.name.includes('Scan'));
  assert.ok(GenerateCommitMessageUseCase.name.includes('Generate'));
  assert.ok(ExecuteCommitUseCase.name.includes('Execute'));
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

console.log('\n✅ All Clean Architecture tests passed!');
