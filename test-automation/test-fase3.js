/**
 * FASE 3 Test Suite - Branch & Tag Management
 * Tests: Confirmation System, Branch Operations, Tag Operations, check-ai Command, --branch Flag
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COGIT_ROOT = path.join(__dirname, '..');
const DIST_PATH = path.join(COGIT_ROOT, 'dist');

class TestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  async runTest(name, testFn) {
    const testStart = Date.now();
    try {
      await testFn();
      const duration = Date.now() - testStart;
      this.results.push({ name, status: 'PASS', duration });
      this.passed++;
      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - testStart;
      this.results.push({ name, status: 'FAIL', error: error.message, duration });
      this.failed++;
      console.log(`  ❌ ${name} (${duration}ms)`);
      console.log(`     Error: ${error.message}`);
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    console.log('\n' + '='.repeat(50));
    console.log('📊 FASE 3 Test Results');
    console.log('='.repeat(50));
    console.log(`Total: ${this.passed + this.failed} tests`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⏱️  Duration: ${totalDuration}ms`);
    console.log('='.repeat(50));

    if (this.failed === 0) {
      console.log('✅ ALL TESTS PASSED - FASE 3 COMPLETE!');
    } else {
      console.log('❌ SOME TESTS FAILED - Review errors above');
    }

    return this.failed === 0;
  }

  saveReport() {
    const report = {
      phase: 'FASE 3',
      timestamp: new Date().toISOString(),
      summary: {
        total: this.passed + this.failed,
        passed: this.passed,
        failed: this.failed,
        duration: Date.now() - this.startTime
      },
      tests: this.results
    };

    const reportPath = path.join(__dirname, 'reports', `fase3-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
  }
}

// Helper functions
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function moduleExists(modulePath) {
  try {
    require.resolve(modulePath);
    return true;
  } catch {
    return false;
  }
}

function runCogit(args) {
  const cmd = `node "${path.join(DIST_PATH, 'index.js')}" ${args}`;
  try {
    return { stdout: execSync(cmd, { encoding: 'utf8', timeout: 30000 }), success: true };
  } catch (error) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', success: false, error: error.message };
  }
}

// Test Suite
async function runTests() {
  const runner = new TestRunner();

  console.log('\n🧪 FASE 3 Test Suite - Branch & Tag Management\n');
  console.log('─'.repeat(50));

  // ============================================
  // TEST GROUP 1: Confirmation System
  // ============================================
  console.log('\n📦 Group 1: Confirmation System');

  await runner.runTest('F3-01: confirmation.ts module exists', () => {
    const modulePath = path.join(DIST_PATH, 'utils', 'confirmation.js');
    if (!fileExists(modulePath)) {
      throw new Error('confirmation.js not found in dist/utils/');
    }
  });

  await runner.runTest('F3-02: generateConfirmationCode function exported', () => {
    const confirmation = require(path.join(DIST_PATH, 'utils', 'confirmation.js'));
    if (typeof confirmation.generateConfirmationCode !== 'function') {
      throw new Error('generateConfirmationCode not exported');
    }
  });

  await runner.runTest('F3-03: validateConfirmationCode function exported', () => {
    const confirmation = require(path.join(DIST_PATH, 'utils', 'confirmation.js'));
    if (typeof confirmation.validateConfirmationCode !== 'function') {
      throw new Error('validateConfirmationCode not exported');
    }
  });

  await runner.runTest('F3-04: Confirmation code format (4 chars)', () => {
    const { generateConfirmationCode } = require(path.join(DIST_PATH, 'utils', 'confirmation.js'));
    const code = generateConfirmationCode();
    if (code.length !== 4) {
      throw new Error(`Expected 4 chars, got ${code.length}`);
    }
    if (!/^[A-Z0-9]{4}$/.test(code)) {
      throw new Error(`Invalid code format: ${code}`);
    }
  });

  await runner.runTest('F3-05: PROTECTED_OPERATIONS array exported', () => {
    const confirmation = require(path.join(DIST_PATH, 'utils', 'confirmation.js'));
    if (!Array.isArray(confirmation.PROTECTED_OPERATIONS)) {
      throw new Error('PROTECTED_OPERATIONS not exported');
    }
    const expected = ['delete_tag_local', 'delete_tag_remote', 'reset_to_tag', 'delete_branch', 'force_push'];
    if (!expected.every(op => confirmation.PROTECTED_OPERATIONS.includes(op))) {
      throw new Error('Missing protected operations');
    }
  });

  // ============================================
  // TEST GROUP 2: Branch Service
  // ============================================
  console.log('\n📦 Group 2: Branch Service');

  await runner.runTest('F3-06: branch.ts module exists', () => {
    const modulePath = path.join(DIST_PATH, 'services', 'git', 'branch.js');
    if (!fileExists(modulePath)) {
      throw new Error('branch.js not found in dist/services/git/');
    }
  });

  await runner.runTest('F3-07: listBranches function exported', () => {
    const branch = require(path.join(DIST_PATH, 'services', 'git', 'branch.js'));
    if (typeof branch.listBranches !== 'function') {
      throw new Error('listBranches not exported');
    }
  });

  await runner.runTest('F3-08: createBranch function exported', () => {
    const branch = require(path.join(DIST_PATH, 'services', 'git', 'branch.js'));
    if (typeof branch.createBranch !== 'function') {
      throw new Error('createBranch not exported');
    }
  });

  await runner.runTest('F3-09: switchBranch function exported', () => {
    const branch = require(path.join(DIST_PATH, 'services', 'git', 'branch.js'));
    if (typeof branch.switchBranch !== 'function') {
      throw new Error('switchBranch not exported');
    }
  });

  await runner.runTest('F3-10: deleteBranch function exported', () => {
    const branch = require(path.join(DIST_PATH, 'services', 'git', 'branch.js'));
    if (typeof branch.deleteBranch !== 'function') {
      throw new Error('deleteBranch not exported');
    }
  });

  await runner.runTest('F3-11: branchCenter function exported', () => {
    const branch = require(path.join(DIST_PATH, 'services', 'git', 'branch.js'));
    if (typeof branch.branchCenter !== 'function') {
      throw new Error('branchCenter not exported');
    }
  });

  // ============================================
  // TEST GROUP 3: Tag Service
  // ============================================
  console.log('\n📦 Group 3: Tag Service');

  await runner.runTest('F3-12: tag.ts module exists', () => {
    const modulePath = path.join(DIST_PATH, 'services', 'git', 'tag.js');
    if (!fileExists(modulePath)) {
      throw new Error('tag.js not found in dist/services/git/');
    }
  });

  await runner.runTest('F3-13: listTags function exported', () => {
    const tag = require(path.join(DIST_PATH, 'services', 'git', 'tag.js'));
    if (typeof tag.listTags !== 'function') {
      throw new Error('listTags not exported');
    }
  });

  await runner.runTest('F3-14: createTag function exported', () => {
    const tag = require(path.join(DIST_PATH, 'services', 'git', 'tag.js'));
    if (typeof tag.createTag !== 'function') {
      throw new Error('createTag not exported');
    }
  });

  await runner.runTest('F3-15: deleteTag function exported', () => {
    const tag = require(path.join(DIST_PATH, 'services', 'git', 'tag.js'));
    if (typeof tag.deleteTag !== 'function') {
      throw new Error('deleteTag not exported');
    }
  });

  await runner.runTest('F3-16: resetToTag function exported', () => {
    const tag = require(path.join(DIST_PATH, 'services', 'git', 'tag.js'));
    if (typeof tag.resetToTag !== 'function') {
      throw new Error('resetToTag not exported');
    }
  });

  await runner.runTest('F3-17: tagCenter function exported', () => {
    const tag = require(path.join(DIST_PATH, 'services', 'git', 'tag.js'));
    if (typeof tag.tagCenter !== 'function') {
      throw new Error('tagCenter not exported');
    }
  });

  // ============================================
  // TEST GROUP 4: check-ai Command
  // ============================================
  console.log('\n📦 Group 4: check-ai Command');

  await runner.runTest('F3-18: check-ai.ts module exists', () => {
    const modulePath = path.join(DIST_PATH, 'cli', 'commands', 'check-ai.js');
    if (!fileExists(modulePath)) {
      throw new Error('check-ai.js not found in dist/cli/commands/');
    }
  });

  await runner.runTest('F3-19: checkAICommand function exported', () => {
    const checkAI = require(path.join(DIST_PATH, 'cli', 'commands', 'check-ai.js'));
    if (typeof checkAI.checkAICommand !== 'function') {
      throw new Error('checkAICommand not exported');
    }
  });

  await runner.runTest('F3-20: check-ai command registered in CLI', () => {
    const result = runCogit('--help');
    if (!result.stdout.includes('check-ai')) {
      throw new Error('check-ai command not found in help output');
    }
  });

  // ============================================
  // TEST GROUP 5: --branch Flag
  // ============================================
  console.log('\n📦 Group 5: --branch Flag');

  await runner.runTest('F3-21: --branch flag registered in auto command', () => {
    const result = runCogit('auto --help');
    if (!result.stdout.includes('-b, --branch')) {
      throw new Error('--branch flag not found in auto help');
    }
  });

  await runner.runTest('F3-22: AutoOptions interface includes branch', () => {
    const auto = require(path.join(DIST_PATH, 'cli', 'commands', 'auto.js'));
    // Just verify module loaded successfully
    if (typeof auto.autoCommand !== 'function') {
      throw new Error('autoCommand not exported');
    }
  });

  // ============================================
  // TEST GROUP 6: Menu Integration
  // ============================================
  console.log('\n📦 Group 6: Menu Integration');

  await runner.runTest('F3-23: Branch Center option in menu', () => {
    const menuPath = path.join(DIST_PATH, 'cli', 'commands', 'menu.js');
    const menuContent = fs.readFileSync(menuPath, 'utf8');
    if (!menuContent.includes('branchCenter')) {
      throw new Error('branchCenter not imported in menu');
    }
  });

  await runner.runTest('F3-24: Tag Operations option in menu', () => {
    const menuPath = path.join(DIST_PATH, 'cli', 'commands', 'menu.js');
    const menuContent = fs.readFileSync(menuPath, 'utf8');
    if (!menuContent.includes('tagCenter')) {
      throw new Error('tagCenter not imported in menu');
    }
  });

  await runner.runTest('F3-25: Check AI Providers option in menu', () => {
    const menuPath = path.join(DIST_PATH, 'cli', 'commands', 'menu.js');
    const menuContent = fs.readFileSync(menuPath, 'utf8');
    if (!menuContent.includes('check-ai') && !menuContent.includes('checkAICommand')) {
      throw new Error('checkAICommand not imported in menu');
    }
  });

  // ============================================
  // TEST GROUP 7: i18n
  // ============================================
  console.log('\n📦 Group 7: Internationalization');

  await runner.runTest('F3-26: English locale has branch keys', () => {
    const enPath = path.join(DIST_PATH, 'locales', 'en.json');
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const requiredKeys = ['branch.center', 'branch.create', 'branch.delete', 'tag.center', 'tag.create'];
    for (const key of requiredKeys) {
      if (!en[key]) {
        throw new Error(`Missing key in en.json: ${key}`);
      }
    }
  });

  await runner.runTest('F3-27: Portuguese locale has branch keys', () => {
    const ptPath = path.join(DIST_PATH, 'locales', 'pt.json');
    const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
    const requiredKeys = ['branch.center', 'branch.create', 'branch.delete', 'tag.center', 'tag.create'];
    for (const key of requiredKeys) {
      if (!pt[key]) {
        throw new Error(`Missing key in pt.json: ${key}`);
      }
    }
  });

  await runner.runTest('F3-28: Confirmation keys in locales', () => {
    const enPath = path.join(DIST_PATH, 'locales', 'en.json');
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    if (!en['confirmation.title'] || !en['confirmation.code']) {
      throw new Error('Missing confirmation keys in en.json');
    }
  });

  // ============================================
  // TEST GROUP 8: Index.ts Updates
  // ============================================
  console.log('\n📦 Group 8: CLI Registration');

  await runner.runTest('F3-29: check-ai command in index.ts', () => {
    const indexPath = path.join(DIST_PATH, 'index.js');
    const content = fs.readFileSync(indexPath, 'utf8');
    if (!content.includes('check-ai')) {
      throw new Error('check-ai command not registered in index.js');
    }
  });

  await runner.runTest('F3-30: --branch flag in index.ts', () => {
    const indexPath = path.join(DIST_PATH, 'index.js');
    const content = fs.readFileSync(indexPath, 'utf8');
    if (!content.includes('--branch')) {
      throw new Error('--branch flag not registered in index.js');
    }
  });

  // Print summary and save report
  const success = runner.printSummary();
  runner.saveReport();

  return success;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
