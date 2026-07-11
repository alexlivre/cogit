/**
 * Unit Tests for Central Git Ref Validator (Task F0.2)
 * Tests isValidBranchName, isValidTagName, sanitizeGitRefName.
 *
 * Convention: Node + assert, imports from dist/ (compiled module).
 * Run with: npm run build && node test-automation/unit/git-ref.test.js
 */

const assert = require('assert');

const {
  isValidBranchName,
  isValidTagName,
  sanitizeGitRefName,
} = require('../../dist/utils/git-ref.js');

console.log('🧪 Running Unit Tests for Git Ref Validator (F0.2)\n');

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
    if (error.stack) console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    failed++;
  }
}

// ============================================
// isValidBranchName — accepts
// ============================================

console.log('📦 isValidBranchName — accepts\n');

test('B1: accepts simple "main"', () => {
  assert.strictEqual(isValidBranchName('main'), true);
});

test('B2: accepts nested "feature/auth"', () => {
  assert.strictEqual(isValidBranchName('feature/auth'), true);
});

test('B3: accepts dotted "release-1.0"', () => {
  assert.strictEqual(isValidBranchName('release-1.0'), true);
});

test('B4: accepts semver-like "v1.2.3-rc.1"', () => {
  assert.strictEqual(isValidBranchName('v1.2.3-rc.1'), true);
});

// ============================================
// isValidBranchName — rejects
// ============================================

console.log('\n📦 isValidBranchName — rejects\n');

test('B5: rejects empty string', () => {
  assert.strictEqual(isValidBranchName(''), false);
});

test('B6: rejects ".." (double dot)', () => {
  assert.strictEqual(isValidBranchName('..'), false);
});

test('B7: rejects "main.lock" (reserved suffix)', () => {
  assert.strictEqual(isValidBranchName('main.lock'), false);
});

test('B8: rejects "@{upstream}" (reflog syntax)', () => {
  assert.strictEqual(isValidBranchName('@{upstream}'), false);
});

test('B9: rejects "--foo" (leading dash, looks like flag)', () => {
  assert.strictEqual(isValidBranchName('--foo'), false);
});

test('B10: rejects ".main" (leading dot)', () => {
  assert.strictEqual(isValidBranchName('.main'), false);
});

test('B11: rejects "main." (trailing dot)', () => {
  assert.strictEqual(isValidBranchName('main.'), false);
});

test('B12: rejects "main//foo" (double slash)', () => {
  assert.strictEqual(isValidBranchName('main//foo'), false);
});

test('B13: rejects "/main" (leading slash)', () => {
  assert.strictEqual(isValidBranchName('/main'), false);
});

test('B14: rejects "main/" (trailing slash)', () => {
  assert.strictEqual(isValidBranchName('main/'), false);
});

test('B15: rejects "m ain" (space)', () => {
  assert.strictEqual(isValidBranchName('m ain'), false);
});

test('B16: rejects "main~1" (tilde revision)', () => {
  assert.strictEqual(isValidBranchName('main~1'), false);
});

test('B17: rejects "main^" (caret revision)', () => {
  assert.strictEqual(isValidBranchName('main^'), false);
});

test('B18: rejects "main:foo" (colon)', () => {
  assert.strictEqual(isValidBranchName('main:foo'), false);
});

test('B19: rejects "main?" (question mark)', () => {
  assert.strictEqual(isValidBranchName('main?'), false);
});

test('B20: rejects "main*" (asterisk)', () => {
  assert.strictEqual(isValidBranchName('main*'), false);
});

test('B21: rejects "main[abc]" (square brackets)', () => {
  assert.strictEqual(isValidBranchName('main[abc]'), false);
});

test('B22: rejects reserved "HEAD"', () => {
  assert.strictEqual(isValidBranchName('HEAD'), false);
});

test('B23: rejects reserved "FETCH_HEAD"', () => {
  assert.strictEqual(isValidBranchName('FETCH_HEAD'), false);
});

test('B24: rejects "\\x00main" (NUL control char)', () => {
  assert.strictEqual(isValidBranchName('\x00main'), false);
});

test('B25: rejects "\\nmain" (newline control char)', () => {
  assert.strictEqual(isValidBranchName('\nmain'), false);
});

test('B26: rejects reserved "ORIG_HEAD"', () => {
  assert.strictEqual(isValidBranchName('ORIG_HEAD'), false);
});

test('B27: rejects reserved "MERGE_HEAD"', () => {
  assert.strictEqual(isValidBranchName('MERGE_HEAD'), false);
});

test('B28: rejects DEL (0x7f) control char', () => {
  assert.strictEqual(isValidBranchName('main\x7f'), false);
});

test('B29: rejects SOH (0x01) control char', () => {
  assert.strictEqual(isValidBranchName('main\x01foo'), false);
});

test('B30: rejects ETX (0x03) control char', () => {
  assert.strictEqual(isValidBranchName('main\x03foo'), false);
});

// ============================================
// isValidTagName
// ============================================

console.log('\n📦 isValidTagName\n');

test('T1: accepts "v1.0.0"', () => {
  assert.strictEqual(isValidTagName('v1.0.0'), true);
});

test('T2: accepts semver-like "v1.2.3-rc.1"', () => {
  assert.strictEqual(isValidTagName('v1.2.3-rc.1'), true);
});

test('T3: rejects "v1.0.0..v2.0.0" (double dot)', () => {
  assert.strictEqual(isValidTagName('v1.0.0..v2.0.0'), false);
});

test('T4: rejects "v1@{upstream}" (reflog syntax)', () => {
  assert.strictEqual(isValidTagName('v1@{upstream}'), false);
});

test('T5: rejects "--delete" (leading dash)', () => {
  assert.strictEqual(isValidTagName('--delete'), false);
});

test('T6: rejects reserved "HEAD"', () => {
  assert.strictEqual(isValidTagName('HEAD'), false);
});

// ============================================
// sanitizeGitRefName
// ============================================

console.log('\n📦 sanitizeGitRefName\n');

test('S1: keeps clean ref unchanged', () => {
  assert.strictEqual(sanitizeGitRefName('v1.2.3-rc.1'), 'v1.2.3-rc.1');
});

test('S2: truncates input longer than 200 characters', () => {
  const long = 'a'.repeat(500);
  const result = sanitizeGitRefName(long);
  assert.ok(result.length <= 200, `expected length <= 200, got ${result.length}`);
});

test('S3: removes control characters (NUL)', () => {
  assert.strictEqual(sanitizeGitRefName('main\x00evil'), 'mainevil');
});

test('S4: removes control characters (newline)', () => {
  assert.strictEqual(sanitizeGitRefName('main\nevil'), 'mainevil');
});

test('S5: removes DEL (0x7f)', () => {
  assert.strictEqual(sanitizeGitRefName('main\x7fevil'), 'mainevil');
});

test('S6: strips shell metacharacters but keeps allowed _ . -', () => {
  assert.strictEqual(sanitizeGitRefName('main;rm -rf'), 'mainrm-rf');
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

console.log('\n✅ All git-ref tests passed!');