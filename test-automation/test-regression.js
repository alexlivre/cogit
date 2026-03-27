#!/usr/bin/env node

/**
 * Cogit CLI - Regression Test Suite
 * Automated tests for CI/CD pipelines
 * 
 * Usage:
 *   node test-regression.js              # Run full regression
 *   node test-regression.js --smoke      # Run smoke test (5 min)
 *   node test-regression.js --ci         # Run CI test (15 min)
 *   node test-regression.js --report     # Generate JSON report
 */

const fs = require('fs');
const path = require('path');
const { config, validateEnvironment, ensureTestRepo } = require('./utils/test-config');

// Parse arguments
const args = process.argv.slice(2);
const options = {
  smoke: args.includes('--smoke'),
  ci: args.includes('--ci'),
  report: args.includes('--report')
};

// Default to full test if no option specified
if (!options.smoke && !options.ci) {
  options.full = true;
}

class RegressionTestRunner {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      total: 0,
      startTime: new Date().toISOString(),
      duration: 0
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
      'info': 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  async runTest(testId, testName, testFn, phase) {
    const testStart = Date.now();
    
    this.log(`${testId}: ${testName}`, 'info');
    
    try {
      await testFn();
      const duration = Date.now() - testStart;
      this.results.passed.push({ id: testId, name: testName, phase, duration });
      this.results.total++;
      this.log(`${testId}: PASS (${duration}ms)`, 'success');
    } catch (error) {
      const duration = Date.now() - testStart;
      this.results.failed.push({ 
        id: testId, 
        name: testName, 
        phase, 
        duration, 
        error: error.message 
      });
      this.results.total++;
      this.log(`${testId}: FAIL - ${error.message}`, 'error');
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    this.results.duration = totalDuration;
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 REGRESSION TEST RESULTS');
    console.log('='.repeat(70));
    
    console.log('\n📈 Summary:');
    console.log(`  Total:   ${this.results.total}`);
    console.log(`  ✅ Passed: ${this.results.passed.length}`);
    console.log(`  ❌ Failed: ${this.results.failed.length}`);
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
      console.log('✅ ALL REGRESSION TESTS PASSED!');
    } else {
      console.log(`❌ ${this.results.failed.length} TEST(S) FAILED`);
    }
    
    console.log('='.repeat(70));
  }

  saveReport() {
    if (!options.report) return;
    
    const report = {
      suite: options.smoke ? 'smoke' : options.ci ? 'ci' : 'full',
      timestamp: this.results.startTime,
      duration: this.results.duration,
      summary: {
        total: this.results.total,
        passed: this.results.passed.length,
        failed: this.results.failed.length
      },
      tests: {
        passed: this.results.passed,
        failed: this.results.failed
      }
    };
    
    const reportPath = path.join(config.reportsPath, `regression-${Date.now()}.json`);
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
    
    const suiteType = options.smoke ? 'SMOKE' : options.ci ? 'CI' : 'FULL';
    
    console.log('\n' + '='.repeat(70));
    console.log(`🧪 COGIT CLI - ${suiteType} REGRESSION TEST`);
    console.log('='.repeat(70));
    console.log(`Test Repository: ${this.testRepo}`);
    console.log(`Cogit Path: ${this.cogitPath}`);
    console.log('='.repeat(70) + '\n');
    
    // Load appropriate test suite
    if (options.smoke) {
      const SmokeTest = require('./regression/smoke-test');
      await SmokeTest.run(this);
    } else if (options.ci) {
      const CITest = require('./regression/ci-test');
      await CITest.run(this);
    } else {
      const FullTest = require('./regression/full-test');
      await FullTest.run(this);
    }
    
    // Print summary and save report
    this.printSummary();
    this.saveReport();
    
    // Exit with appropriate code
    process.exit(this.results.failed.length > 0 ? 1 : 0);
  }
}

// Run tests
const runner = new RegressionTestRunner();
runner.runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
