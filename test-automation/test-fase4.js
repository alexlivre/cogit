/**
 * FASE 4 Test Suite - Smart Features
 * Tests for VibeVault, Stealth Mode, and Smart Ignore
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COGIT_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(COGIT_ROOT, 'dist');

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async runTest(name, fn) {
    try {
      await fn();
      this.passed++;
      console.log(`  ✅ ${name}`);
      this.tests.push({ name, status: 'PASS' });
    } catch (error) {
      this.failed++;
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      this.tests.push({ name, status: 'FAIL', error: error.message });
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log(`📊 FASE 4 Test Results`);
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    console.log(`📊 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
    
    return this.failed === 0;
  }
}

// Helper functions
function assertExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message || `File not found: ${filePath}`);
  }
}

function assertContains(content, expected, message) {
  if (!content.includes(expected)) {
    throw new Error(message || `Expected "${expected}" not found in content`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected "${expected}", got "${actual}"`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(message || 'Expected function to throw');
  } catch (e) {
    if (e.message === message || e.message === 'Expected function to throw') {
      throw e;
    }
    // Function threw as expected
  }
}

// Test suites
async function testVibeVault(runner) {
  console.log('\n📦 Testing VibeVault (Large Diff Management)...\n');

  // F4-01: Vault module compiled
  await runner.runTest('F4-01: Vault module compiled', () => {
    const vaultPath = path.join(DIST_DIR, 'core', 'vault.js');
    assertExists(vaultPath, 'Vault module not compiled');
  });

  // F4-02: smartPack function exists
  await runner.runTest('F4-02: smartPack function exported', () => {
    const vaultPath = path.join(DIST_DIR, 'core', 'vault.js');
    const content = fs.readFileSync(vaultPath, 'utf-8');
    assertContains(content, 'smartPack');
  });

  // F4-03: smartUnpack function exists
  await runner.runTest('F4-03: smartUnpack function exported', () => {
    const vaultPath = path.join(DIST_DIR, 'core', 'vault.js');
    const content = fs.readFileSync(vaultPath, 'utf-8');
    assertContains(content, 'smartUnpack');
  });

  // F4-04: formatSize function exists
  await runner.runTest('F4-04: formatSize function exported', () => {
    const vaultPath = path.join(DIST_DIR, 'core', 'vault.js');
    const content = fs.readFileSync(vaultPath, 'utf-8');
    assertContains(content, 'formatSize');
  });

  // F4-05: VibeVault class exists
  await runner.runTest('F4-05: VibeVault class exported', () => {
    const vaultPath = path.join(DIST_DIR, 'core', 'vault.js');
    const content = fs.readFileSync(vaultPath, 'utf-8');
    assertContains(content, 'VibeVault');
    assertContains(content, 'store');
    assertContains(content, 'retrieve');
    assertContains(content, 'cleanup');
  });

  // F4-06: Scanner includes diffData
  await runner.runTest('F4-06: Scanner includes diffData', () => {
    const scannerPath = path.join(DIST_DIR, 'services', 'git', 'scanner.js');
    const content = fs.readFileSync(scannerPath, 'utf-8');
    assertContains(content, 'diffData');
    assertContains(content, 'smartPack');
  });

  // F4-07: Brain supports diffData
  await runner.runTest('F4-07: Brain supports diffData', () => {
    const brainPath = path.join(DIST_DIR, 'services', 'ai', 'brain', 'index.js');
    const content = fs.readFileSync(brainPath, 'utf-8');
    assertContains(content, 'diffData');
    assertContains(content, 'smartUnpack');
  });
}

async function testStealthMode(runner) {
  console.log('\n🔒 Testing Stealth Mode (Private Files)...\n');

  // F4-08: Stealth module compiled
  await runner.runTest('F4-08: Stealth module compiled', () => {
    const stealthPath = path.join(DIST_DIR, 'services', 'tools', 'stealth.js');
    assertExists(stealthPath, 'Stealth module not compiled');
  });

  // F4-09: stealthStash function exists
  await runner.runTest('F4-09: stealthStash function exported', () => {
    const stealthPath = path.join(DIST_DIR, 'services', 'tools', 'stealth.js');
    const content = fs.readFileSync(stealthPath, 'utf-8');
    assertContains(content, 'stealthStash');
  });

  // F4-10: stealthRestore function exists
  await runner.runTest('F4-10: stealthRestore function exported', () => {
    const stealthPath = path.join(DIST_DIR, 'services', 'tools', 'stealth.js');
    const content = fs.readFileSync(stealthPath, 'utf-8');
    assertContains(content, 'stealthRestore');
  });

  // F4-11: createPrivateConfig function exists
  await runner.runTest('F4-11: createPrivateConfig function exported', () => {
    const stealthPath = path.join(DIST_DIR, 'services', 'tools', 'stealth.js');
    const content = fs.readFileSync(stealthPath, 'utf-8');
    assertContains(content, 'createPrivateConfig');
  });

  // F4-12: hasPrivateConfig function exists
  await runner.runTest('F4-12: hasPrivateConfig function exported', () => {
    const stealthPath = path.join(DIST_DIR, 'services', 'tools', 'stealth.js');
    const content = fs.readFileSync(stealthPath, 'utf-8');
    assertContains(content, 'hasPrivateConfig');
  });

  // F4-13: Stealth integrated in auto
  await runner.runTest('F4-13: Stealth integrated in auto.ts', () => {
    const autoPath = path.join(DIST_DIR, 'cli', 'commands', 'auto.js');
    const content = fs.readFileSync(autoPath, 'utf-8');
    assertContains(content, 'stealthStash');
    assertContains(content, 'stealthRestore');
    assertContains(content, 'hasPrivateConfig');
  });
}

async function testSmartIgnore(runner) {
  console.log('\n🗑️  Testing Smart Ignore (.gitignore suggestions)...\n');

  // F4-14: Ignore module compiled
  await runner.runTest('F4-14: Ignore module compiled', () => {
    const ignorePath = path.join(DIST_DIR, 'services', 'tools', 'ignore.js');
    assertExists(ignorePath, 'Ignore module not compiled');
  });

  // F4-15: suggestIgnore function exists
  await runner.runTest('F4-15: suggestIgnore function exported', () => {
    const ignorePath = path.join(DIST_DIR, 'services', 'tools', 'ignore.js');
    const content = fs.readFileSync(ignorePath, 'utf-8');
    assertContains(content, 'suggestIgnore');
  });

  // F4-16: addWhitelistEntry function exists
  await runner.runTest('F4-16: addWhitelistEntry function exported', () => {
    const ignorePath = path.join(DIST_DIR, 'services', 'tools', 'ignore.js');
    const content = fs.readFileSync(ignorePath, 'utf-8');
    assertContains(content, 'addWhitelistEntry');
  });

  // F4-17: common_trash.json exists
  await runner.runTest('F4-17: common_trash.json config exists', () => {
    const trashPath = path.join(DIST_DIR, 'config', 'common_trash.json');
    assertExists(trashPath, 'common_trash.json not found');
    
    const content = JSON.parse(fs.readFileSync(trashPath, 'utf-8'));
    if (Object.keys(content).length < 10) {
      throw new Error('common_trash.json should have at least 10 patterns');
    }
  });

  // F4-18: Ignore integrated in auto
  await runner.runTest('F4-18: Ignore integrated in auto.ts', () => {
    const autoPath = path.join(DIST_DIR, 'cli', 'commands', 'auto.js');
    const content = fs.readFileSync(autoPath, 'utf-8');
    assertContains(content, 'suggestIgnore');
  });

  // F4-19: Ignore integrated in menu
  await runner.runTest('F4-19: Ignore integrated in menu.ts', () => {
    const menuPath = path.join(DIST_DIR, 'cli', 'commands', 'menu.js');
    const content = fs.readFileSync(menuPath, 'utf-8');
    assertContains(content, 'suggestIgnore');
    assertContains(content, 'smart-ignore');
  });
}

async function testTypesAndConfig(runner) {
  console.log('\n📝 Testing Types and Configuration...\n');

  // F4-20: Git types compiled
  await runner.runTest('F4-20: Git types module compiled', () => {
    const typesPath = path.join(DIST_DIR, 'types', 'git.js');
    assertExists(typesPath, 'Git types not compiled');
    
    // TypeScript interfaces are removed during compilation, but file exists
    const content = fs.readFileSync(typesPath, 'utf-8');
    assertContains(content, 'export');
  });

  // F4-21: Locales updated (en)
  await runner.runTest('F4-21: English locales updated', () => {
    const enPath = path.join(DIST_DIR, 'locales', 'en.json');
    const content = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    
    if (!content['vault.large_diff']) throw new Error('Missing vault.large_diff');
    if (!content['stealth.hiding']) throw new Error('Missing stealth.hiding');
    if (!content['ignore.title']) throw new Error('Missing ignore.title');
  });

  // F4-22: Locales updated (pt)
  await runner.runTest('F4-22: Portuguese locales updated', () => {
    const ptPath = path.join(DIST_DIR, 'locales', 'pt.json');
    const content = JSON.parse(fs.readFileSync(ptPath, 'utf-8'));
    
    if (!content['vault.large_diff']) throw new Error('Missing vault.large_diff');
    if (!content['stealth.hiding']) throw new Error('Missing stealth.hiding');
    if (!content['ignore.title']) throw new Error('Missing ignore.title');
  });

  // F4-23: Menu has new options
  await runner.runTest('F4-23: Menu has Smart Ignore option', () => {
    const menuPath = path.join(DIST_DIR, 'cli', 'commands', 'menu.js');
    const content = fs.readFileSync(menuPath, 'utf-8');
    assertContains(content, 'Smart Ignore');
    assertContains(content, 'Stealth Mode Config');
  });

  // F4-24: Menu has Stealth option
  await runner.runTest('F4-24: Menu has Stealth Mode option', () => {
    const menuPath = path.join(DIST_DIR, 'cli', 'commands', 'menu.js');
    const content = fs.readFileSync(menuPath, 'utf-8');
    assertContains(content, 'configureStealth');
  });
}

async function testIntegration(runner) {
  console.log('\n🔗 Testing Integration...\n');

  // F4-25: All modules can be imported
  await runner.runTest('F4-25: All FASE 4 modules can be imported', () => {
    const vault = require(path.join(DIST_DIR, 'core', 'vault.js'));
    const stealth = require(path.join(DIST_DIR, 'services', 'tools', 'stealth.js'));
    const ignore = require(path.join(DIST_DIR, 'services', 'tools', 'ignore.js'));
    
    if (typeof vault.smartPack !== 'function') throw new Error('smartPack not a function');
    if (typeof stealth.stealthStash !== 'function') throw new Error('stealthStash not a function');
    if (typeof ignore.suggestIgnore !== 'function') throw new Error('suggestIgnore not a function');
  });

  // F4-26: CLI help shows menu command
  await runner.runTest('F4-26: CLI help works', () => {
    const help = execSync('node dist/index.js --help', { encoding: 'utf-8', cwd: COGIT_ROOT });
    assertContains(help, 'menu');
    assertContains(help, 'auto');
    assertContains(help, 'check-ai');
  });
}

// Main execution
async function main() {
  console.log('🚀 FASE 4 Test Suite - Smart Features\n');
  console.log('Testing: VibeVault, Stealth Mode, Smart Ignore\n');
  console.log('='.repeat(50));

  const runner = new TestRunner();

  await testVibeVault(runner);
  await testStealthMode(runner);
  await testSmartIgnore(runner);
  await testTypesAndConfig(runner);
  await testIntegration(runner);

  const success = runner.printSummary();

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'FASE 4 - Smart Features',
    total: runner.passed + runner.failed,
    passed: runner.passed,
    failed: runner.failed,
    successRate: ((runner.passed / (runner.passed + runner.failed)) * 100).toFixed(1) + '%',
    tests: runner.tests,
  };

  const reportPath = path.join(COGIT_ROOT, 'test-automation', 'reports', `fase4-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved: ${path.basename(reportPath)}`);

  process.exit(success ? 0 : 1);
}

main().catch(console.error);
