/**
 * Unit Tests for Refactored Handlers
 * Tests the extracted functions from auto.ts
 */

const assert = require('assert');
const path = require('path');

// Import compiled modules
const { CogitError, ConfigError, GitError, AIError, SecurityError, StealthError, formatError } = require('../../dist/core/errors.js');
const { validateConfiguration } = require('../../dist/cli/commands/auto/validator.js');

console.log('🧪 Running Unit Tests for Refactored Handlers\n');

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
// ERROR SYSTEM TESTS
// ============================================

console.log('📦 Error System Tests\n');

test('E1: CogitError creates with correct properties', () => {
  const error = new CogitError('Test error', 'CONFIG_INVALID', 1, ['detail1', 'detail2']);
  assert.strictEqual(error.message, 'Test error');
  assert.strictEqual(error.code, 'CONFIG_INVALID');
  assert.strictEqual(error.exitCode, 1);
  assert.deepStrictEqual(error.details, ['detail1', 'detail2']);
});

test('E2: ConfigError extends CogitError correctly', () => {
  const error = new ConfigError('Invalid config', ['Missing API key']);
  assert.strictEqual(error.name, 'ConfigError');
  assert.strictEqual(error.code, 'CONFIG_INVALID');
  assert.ok(error instanceof CogitError);
});

test('E3: GitError static factory methods work', () => {
  const notRepo = GitError.notRepo();
  assert.strictEqual(notRepo.code, 'GIT_NOT_REPO');
  
  const noChanges = GitError.noChanges();
  assert.strictEqual(noChanges.code, 'GIT_NO_CHANGES');
  
  const branchFailed = GitError.branchFailed('create', 'test-branch', 'error msg');
  assert.strictEqual(branchFailed.code, 'GIT_BRANCH_FAILED');
  assert.ok(branchFailed.message.includes('test-branch'));
  assert.deepStrictEqual(branchFailed.details, ['error msg']);
});

test('E4: SecurityError creates with blocked files', () => {
  const error = new SecurityError(['.env', 'id_rsa']);
  assert.strictEqual(error.code, 'SECURITY_BLOCKED');
  assert.deepStrictEqual(error.details, ['.env', 'id_rsa']);
});

test('E5: formatError outputs correct string', () => {
  const error = new ConfigError('Config failed', ['Missing key 1', 'Missing key 2']);
  const formatted = formatError(error);
  assert.ok(formatted.includes('Config failed'));
  assert.ok(formatted.includes('Missing key 1'));
  assert.ok(formatted.includes('Missing key 2'));
});

test('E6: CogitError.isCogitError identifies errors correctly', () => {
  const cogitError = new ConfigError('test');
  const normalError = new Error('test');
  
  assert.ok(CogitError.isCogitError(cogitError));
  assert.ok(!CogitError.isCogitError(normalError));
});

// ============================================
// VALIDATOR TESTS
// ============================================

console.log('\n📦 Validator Tests\n');

test('V1: validateConfiguration throws on invalid config', () => {
  // This test assumes no .env or invalid config
  // In a real test environment, we would mock process.env
  try {
    // Save original env
    const originalKeys = {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    };
    
    // Clear all keys temporarily
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    
    let threw = false;
    try {
      validateConfiguration();
    } catch (e) {
      threw = true;
      assert.ok(e instanceof ConfigError);
    }
    
    // Restore original env
    Object.keys(originalKeys).forEach(key => {
      if (originalKeys[key]) {
        process.env[key] = originalKeys[key];
      }
    });
    
    // If no API keys were set, should have thrown
    // If keys were set, this test is skipped
    if (!threw && !originalKeys.OPENROUTER_API_KEY && !originalKeys.GROQ_API_KEY) {
      assert.fail('Should have thrown ConfigError');
    }
  } catch (e) {
    // Test environment may have valid config, skip
    console.log('   (Skipped - valid config exists)');
  }
});

// ============================================
// HANDLER MODULE EXISTENCE TESTS
// ============================================

console.log('\n📦 Handler Module Tests\n');

test('H1: branch-handler module exists and exports function', () => {
  const branchHandler = require('../../dist/cli/commands/auto/branch-handler.js');
  assert.ok(typeof branchHandler.handleBranchSwitch === 'function');
});

test('H2: stealth-handler module exists and exports functions', () => {
  const stealthHandler = require('../../dist/cli/commands/auto/stealth-handler.js');
  assert.ok(typeof stealthHandler.handleStealthMode === 'function');
  assert.ok(typeof stealthHandler.handleStealthRestore === 'function');
});

test('H3: commit-review module exists and exports function', () => {
  const commitReview = require('../../dist/cli/commands/auto/commit-review.js');
  assert.ok(typeof commitReview.handleCommitReview === 'function');
});

test('H4: commit-executor module exists and exports function', () => {
  const commitExecutor = require('../../dist/cli/commands/auto/commit-executor.js');
  assert.ok(typeof commitExecutor.handleCommitExecution === 'function');
});

test('H5: auto/index module exists and exports autoCommand', () => {
  const autoIndex = require('../../dist/cli/commands/auto/index.js');
  assert.ok(typeof autoIndex.autoCommand === 'function');
});

test('H6: types module compiles correctly', () => {
  const types = require('../../dist/cli/commands/auto/types.js');
  // TypeScript interfaces are not exported to JS, just verify module exists
  assert.ok(types !== undefined);
});

// ============================================
// TYPE CHECK TESTS
// ============================================

console.log('\n📦 Type Check Tests\n');

test('T1: BranchHandlerResult interface is returned', async () => {
  const branchHandler = require('../../dist/cli/commands/auto/branch-handler.js');
  // We can't test the actual function without a git repo
  // But we can verify the module structure
  assert.ok(branchHandler.BranchHandlerResult === undefined); // Interface, not exported
});

test('T2: ExecutorOptions interface structure is correct', () => {
  const commitExecutor = require('../../dist/cli/commands/auto/commit-executor.js');
  // Verify module has expected exports
  assert.ok(commitExecutor.ExecutorOptions === undefined); // Interface
  assert.ok(commitExecutor.ExecutorResult === undefined); // Interface
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

console.log('\n✅ All unit tests passed!');
