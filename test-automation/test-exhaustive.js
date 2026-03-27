#!/usr/bin/env node

/**
 * Cogit CLI - Exhaustive Test Suite
 * Tests all features from FASE 1, 2, and 3
 * 
 * Usage:
 *   node test-exhaustive.js                    # Run all tests
 *   node test-exhaustive.js --fase=1           # Run FASE 1 tests only
 *   node test-exhaustive.js --test=F1-01       # Run specific test
 *   node test-exhaustive.js --stress           # Include stress tests
 *   node test-exhaustive.js --report           # Generate JSON report
 *   node test-exhaustive.js --verbose          # Detailed output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { config, validateEnvironment, ensureTestRepo } = require('./utils/test-config');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fase: null,
  test: null,
  stress: false,
  report: false,
  verbose: false,
  noCleanup: false,
  smoke: false,
  ci: false
};

args.forEach(arg => {
  if (arg.startsWith('--fase=')) {
    options.fase = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--test=')) {
    options.test = arg.split('=')[1];
  } else if (arg === '--stress') {
    options.stress = true;
  } else if (arg === '--report') {
    options.report = true;
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--no-cleanup') {
    options.noCleanup = true;
  } else if (arg === '--smoke') {
    options.smoke = true;
  } else if (arg === '--ci') {
    options.ci = true;
  }
});

class ExhaustiveTestRunner {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      total: 0,
      startTime: new Date().toISOString(),
      duration: 0,
      phases: {
        fase1: { passed: 0, failed: 0, skipped: 0 },
        fase2: { passed: 0, failed: 0, skipped: 0 },
        fase3: { passed: 0, failed: 0, skipped: 0 },
        stress: { passed: 0, failed: 0, skipped: 0 }
      }
    };
    
    this.testRepo = config.testRepo;
    this.cogitPath = config.cogitPath;
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const prefix = {
      'error': '❌',
      'success': '✅',
      'warning': '⚠️',
      'info': 'ℹ️',
      'phase': '📦',
      'test': '🧪'
    }[type] || 'ℹ️';
    
    if (options.verbose || type === 'error' || type === 'phase') {
      console.log(`${prefix} ${message}`);
    }
  }

  async runTest(testId, testName, testFn, phase) {
    const testStart = Date.now();
    
    // Skip if specific test requested and this isn't it
    if (options.test && options.test !== testId) {
      this.results.skipped.push({ id: testId, name: testName, phase });
      this.results.phases[phase].skipped++;
      return;
    }
    
    // Skip if specific fase requested and this isn't it
    if (options.fase && !testId.startsWith(`F${options.fase}`) && !testId.startsWith(`S${options.fase}`)) {
      this.results.skipped.push({ id: testId, name: testName, phase });
      this.results.phases[phase].skipped++;
      return;
    }
    
    this.log(`${testId}: ${testName}`, 'test');
    
    try {
      await testFn();
      const duration = Date.now() - testStart;
      this.results.passed.push({ id: testId, name: testName, phase, duration });
      this.results.phases[phase].passed++;
      this.results.total++;
      this.log(`${testId}: PASS (${duration}ms)`, 'success');
    } catch (error) {
      const duration = Date.now() - testStart;
      this.results.failed.push({ 
        id: testId, 
        name: testName, 
        phase, 
        duration, 
        error: error.message,
        stack: error.stack
      });
      this.results.phases[phase].failed++;
      this.results.total++;
      this.log(`${testId}: FAIL - ${error.message}`, 'error');
      
      if (options.verbose) {
        console.log('   Stack:', error.stack);
      }
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    this.results.duration = totalDuration;
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 EXHAUSTIVE TEST RESULTS');
    console.log('='.repeat(70));
    
    console.log('\n📦 By Phase:');
    console.log(`  FASE 1 (MVP):         ${this.results.phases.fase1.passed}/${this.results.phases.fase1.passed + this.results.phases.fase1.failed} passed`);
    console.log(`  FASE 2 (Automação):   ${this.results.phases.fase2.passed}/${this.results.phases.fase2.passed + this.results.phases.fase2.failed} passed`);
    console.log(`  FASE 3 (Branch/Tags): ${this.results.phases.fase3.passed}/${this.results.phases.fase3.passed + this.results.phases.fase3.failed} passed`);
    
    if (options.stress) {
      console.log(`  Stress Tests:         ${this.results.phases.stress.passed}/${this.results.phases.stress.passed + this.results.phases.stress.failed} passed`);
    }
    
    console.log('\n📈 Summary:');
    console.log(`  Total:   ${this.results.total}`);
    console.log(`  ✅ Passed: ${this.results.passed.length}`);
    console.log(`  ❌ Failed: ${this.results.failed.length}`);
    console.log(`  ⏭️  Skipped: ${this.results.skipped.length}`);
    console.log(`  ⏱️  Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.failed.forEach(test => {
        console.log(`  - ${test.id}: ${test.name}`);
        console.log(`    Error: ${test.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (this.results.failed.length === 0) {
      console.log('✅ ALL TESTS PASSED!');
    } else {
      console.log(`❌ ${this.results.failed.length} TEST(S) FAILED`);
    }
    
    console.log('='.repeat(70));
  }

  saveReport() {
    if (!options.report) return;
    
    const report = {
      suite: 'exhaustive',
      timestamp: this.results.startTime,
      duration: this.results.duration,
      summary: {
        total: this.results.total,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        skipped: this.results.skipped.length
      },
      phases: this.results.phases,
      tests: {
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped
      }
    };
    
    const reportPath = path.join(config.reportsPath, `exhaustive-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
  }

  async runAllTests() {
    // Validate environment
    const validation = validateEnvironment();
    
    if (validation.errors.length > 0) {
      console.log('❌ Environment validation failed:');
      validation.errors.forEach(err => console.log(`  - ${err}`));
      process.exit(1);
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warn => console.log(`  - ${warn}`));
    }
    
    // Ensure test repository exists
    ensureTestRepo();
    
    console.log('\n' + '='.repeat(70));
    console.log('🧪 COGIT CLI - EXHAUSTIVE TEST SUITE');
    console.log('='.repeat(70));
    console.log(`Test Repository: ${this.testRepo}`);
    console.log(`Cogit Path: ${this.cogitPath}`);
    console.log(`Options: fase=${options.fase || 'all'}, stress=${options.stress}, report=${options.report}`);
    console.log('='.repeat(70) + '\n');
    
    // Load and run FASE 1 tests
    this.log('Running FASE 1 (MVP) tests...', 'phase');
    await this.runFase1Tests();
    
    // Load and run FASE 2 tests
    this.log('Running FASE 2 (Automação) tests...', 'phase');
    await this.runFase2Tests();
    
    // Load and run FASE 3 tests
    this.log('Running FASE 3 (Branch & Tags) tests...', 'phase');
    await this.runFase3Tests();
    
    // Load and run stress tests if requested
    if (options.stress) {
      this.log('Running Stress tests...', 'phase');
      await this.runStressTests();
    }
    
    // Print summary and save report
    this.printSummary();
    this.saveReport();
    
    // Cleanup if needed
    if (!options.noCleanup) {
      this.cleanup();
    }
    
    // Exit with appropriate code
    process.exit(this.results.failed.length > 0 ? 1 : 0);
  }

  async runFase1Tests() {
    const testsPath = path.join(__dirname, 'scenarios', 'fase1');
    
    if (!fs.existsSync(testsPath)) {
      this.log('FASE 1 tests not found. Skipping...', 'warning');
      return;
    }
    
    const testFiles = fs.readdirSync(testsPath).filter(f => f.endsWith('.js'));
    
    for (const file of testFiles) {
      const testModule = require(path.join(testsPath, file));
      if (testModule.run) {
        await testModule.run(this);
      }
    }
  }

  async runFase2Tests() {
    const testsPath = path.join(__dirname, 'scenarios', 'fase2');
    
    if (!fs.existsSync(testsPath)) {
      this.log('FASE 2 tests not found. Skipping...', 'warning');
      return;
    }
    
    const testFiles = fs.readdirSync(testsPath).filter(f => f.endsWith('.js'));
    
    for (const file of testFiles) {
      const testModule = require(path.join(testsPath, file));
      if (testModule.run) {
        await testModule.run(this);
      }
    }
  }

  async runFase3Tests() {
    const testsPath = path.join(__dirname, 'scenarios', 'fase3');
    
    if (!fs.existsSync(testsPath)) {
      this.log('FASE 3 tests not found. Skipping...', 'warning');
      return;
    }
    
    const testFiles = fs.readdirSync(testsPath).filter(f => f.endsWith('.js'));
    
    for (const file of testFiles) {
      const testModule = require(path.join(testsPath, file));
      if (testModule.run) {
        await testModule.run(this);
      }
    }
  }

  async runStressTests() {
    const testsPath = path.join(__dirname, 'stress');
    
    if (!fs.existsSync(testsPath)) {
      this.log('Stress tests not found. Skipping...', 'warning');
      return;
    }
    
    const testFiles = fs.readdirSync(testsPath).filter(f => f.endsWith('.js'));
    
    for (const file of testFiles) {
      const testModule = require(path.join(testsPath, file));
      if (testModule.run) {
        await testModule.run(this);
      }
    }
  }

  cleanup() {
    // Reset test repository
    try {
      execSync('git reset --hard HEAD', { cwd: this.testRepo, stdio: 'pipe' });
      execSync('git clean -fd', { cwd: this.testRepo, stdio: 'pipe' });
      execSync('git checkout main 2>/dev/null || git checkout master 2>/dev/null || true', { cwd: this.testRepo, stdio: 'pipe' });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run tests
const runner = new ExhaustiveTestRunner();
runner.runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
