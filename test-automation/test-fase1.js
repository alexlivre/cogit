#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import scenarios
const BasicTest = require('./scenarios/basic-test');
const FlagsTest = require('./scenarios/flags-test');
const SecurityTest = require('./scenarios/security-test');
const I18nTest = require('./scenarios/i18n-test');
const EdgeCasesTest = require('./scenarios/edge-cases-test');
const FormatTest = require('./scenarios/format-test');

class TestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
        this.testRepo = 'C:/code/github/teste';
        this.cogitPath = __dirname;
        this.verbose = process.argv.includes('--verbose');
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async runTest(testName, testFunction) {
        this.log(`Running test: ${testName}`);
        this.results.total++;
        
        try {
            const startTime = Date.now();
            await testFunction();
            const duration = Date.now() - startTime;
            
            try {
                const output = execSync('node ../dist/index.js auto --yes', {
                    cwd: this.testRepo,
                    encoding: 'utf8',
                    timeout: 30000
                });
                
                this.results.passed++;
                this.results.tests.push({
                    name: testName,
                    status: 'passed',
                    duration,
                    error: null
                });
                
                this.log(`${testName} - PASSED (${duration}ms)`, 'success');
            } catch (error) {
                this.results.failed++;
                this.results.tests.push({
                    name: testName,
                    status: 'failed',
                    duration: 0,
                    error: error.message
                });
                
                this.log(`${testName} - FAILED: ${error.message}`, 'error');
                if (this.verbose) {
                    console.error(error.stack);
                }
            }
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({
                name: testName,
                status: 'failed',
                duration: 0,
                error: error.message
            });
            
            this.log(`${testName} - FAILED: ${error.message}`, 'error');
            if (this.verbose) {
                console.error(error.stack);
            }
        }
    }

    async setupTestEnvironment() {
        this.log('Setting up test environment...');
        
        // Clean test repository
        try {
            execSync('git reset --hard HEAD', { cwd: this.testRepo, stdio: 'pipe' });
            execSync('git clean -fd', { cwd: this.testRepo, stdio: 'pipe' });
            execSync('git checkout main', { cwd: this.testRepo, stdio: 'pipe' });
        } catch (error) {
            this.log('Warning: Could not reset repository, continuing...', 'error');
        }
        
        // Ensure we're on a clean state
        try {
            const status = execSync('git status --porcelain', { cwd: this.testRepo, encoding: 'utf8' });
            if (status.trim()) {
                execSync('git add -A', { cwd: this.testRepo });
                execSync('git commit -m "test cleanup"', { cwd: this.testRepo });
            }
        } catch (error) {
            // Ignore if nothing to commit
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: ((this.results.passed / this.results.total) * 100).toFixed(2) + '%'
            },
            tests: this.results.tests
        };

        // Save JSON report
        const reportPath = path.join(__dirname, 'reports', 'test-results.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('TEST EXECUTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${report.summary.total}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.log('='.repeat(60));

        if (this.results.failed > 0) {
            console.log('\nFAILED TESTS:');
            this.results.tests
                .filter(t => t.status === 'failed')
                .forEach(t => console.log(`  ❌ ${t.name}: ${t.error}`));
        }

        return report;
    }

    async runAllTests() {
        this.log('Starting FASE 1 automated tests...');
        
        await this.setupTestEnvironment();
        
        // Run all test scenarios
        await this.runTest('Basic Functionality', () => BasicTest.run(this));
        await this.runTest('Flags and Options', () => FlagsTest.run(this));
        await this.runTest('Security Blocklist', () => SecurityTest.run(this));
        await this.runTest('Internationalization', () => I18nTest.run(this));
        await this.runTest('Edge Cases', () => EdgeCasesTest.run(this));
        await this.runTest('Format Validation', () => FormatTest.run(this));
        
        return this.generateReport();
    }
}

// Main execution
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests()
        .then(report => {
            process.exit(report.summary.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = TestRunner;
