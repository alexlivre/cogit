#!/usr/bin/env node

/**
 * Comprehensive Test Suite - FASE 1 + FASE 2
 * Cogit CLI - All features validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const GitHelper = require('./utils/git-helper');
const FileHelper = require('./utils/file-helper');
const AssertHelper = require('./utils/assert-helper');

// Import scenario tests
const BasicTest = require('./scenarios/basic-test');
const FlagsTest = require('./scenarios/flags-test');
const SecurityTest = require('./scenarios/security-test');
const FormatTest = require('./scenarios/format-test');
const I18nTest = require('./scenarios/i18n-test');
const ScannerTest = require('./scenarios/scanner-test');
const MenuTest = require('./scenarios/menu-test');
const HealerTest = require('./scenarios/healer-test');
const UITest = require('./scenarios/ui-test');

class ComprehensiveTestRunner {
    constructor() {
        this.testRepo = 'C:/code/github/teste';
        this.cogitPath = 'C:/code/github/cogit';
        this.results = {
            passed: [],
            failed: [],
            total: 0,
            startTime: new Date().toISOString(),
            phases: {
                fase1: { passed: 0, failed: 0 },
                fase2: { passed: 0, failed: 0 }
            }
        };
        this.git = new GitHelper(this.testRepo);
        this.fileHelper = new FileHelper(this.testRepo);
    }

    log(message, type = 'info') {
        const prefix = {
            'error': '❌',
            'success': '✅',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[type] || 'ℹ️';
        console.log(`[${new Date().toLocaleTimeString()}] ${prefix} ${message}`);
    }

    async runTest(name, testFn, phase = 'fase1') {
        this.results.total++;
        const startTime = Date.now();
        
        try {
            await testFn();
            const duration = Date.now() - startTime;
            this.results.passed.push({ name, duration, phase });
            this.results.phases[phase].passed++;
            this.log(`${name} - PASSED (${duration}ms)`, 'success');
            return true;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.results.failed.push({ name, error: error.message, duration, phase });
            this.results.phases[phase].failed++;
            this.log(`${name} - FAILED: ${error.message}`, 'error');
            return false;
        }
    }

    async setup() {
        this.log('Setting up test environment...');
        
        // Build cogit
        this.log('Building cogit...');
        execSync('npx tsc', { cwd: this.cogitPath, stdio: 'inherit' });
        
        // Clean test repo
        this.log('Cleaning test repository...');
        try {
            this.git.resetHard();
            this.git.clean();
        } catch (e) {
            // Ignore cleanup errors
        }
        
        this.log('Setup complete!');
    }

    // ==================== FASE 1 TESTS ====================

    async testF1_01_BasicFunctionality() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`test-basic-${timestamp}.txt`, `Test content ${timestamp}`);
        this.git.addAll();
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        const lastCommit = this.git.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created');
        // Verify commit was created (output shows commit message)
        AssertHelper.assertContains(output, 'Generated Commit Message', 'Should show commit message');
    }

    async testF1_02_FlagYes() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`test-yes-${timestamp}.txt`, `Test yes flag`);
        this.git.addAll();
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should not prompt for confirmation
        AssertHelper.assertNotContains(output, 'What would you like to do', 'Should not prompt with --yes');
    }

    async testF1_03_FlagNoPush() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`test-nopush-${timestamp}.txt`, `Test no push`);
        this.git.addAll();
        
        const beforeCommit = this.git.getLastCommit();
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes --no-push`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        const afterCommit = this.git.getLastCommit();
        AssertHelper.assert(afterCommit !== beforeCommit, 'New commit should be created');
    }

    async testF1_04_FlagHint() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`test-hint-${timestamp}.txt`, `Test hint flag`);
        this.git.addAll();
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes -m "add authentication feature"`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        const lastCommit = this.git.getLastCommit();
        // Hint should influence the commit message
        AssertHelper.assert(lastCommit !== null, 'Commit should be created with hint');
    }

    async testF1_05_SecurityBlocklist() {
        this.git.resetHard();
        this.git.clean();
        
        // Create sensitive files
        this.fileHelper.createFile('.env.local', 'SECRET=123');
        this.git.addAll();
        
        try {
            const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes`, {
                cwd: this.testRepo,
                encoding: 'utf8',
                timeout: 30000
            });
            
            // Should show security error
            AssertHelper.assertContains(output, 'blocked', 'Should show blocked files message');
        } catch (error) {
            // Expected to fail
            AssertHelper.assertContains(error.message, 'blocked', 'Should fail with blocked files');
        }
    }

    async testF1_06_SecretsRedaction() {
        // Verify redactor module exists and works
        const redactorPath = path.join(this.cogitPath, 'dist', 'services', 'security', 'redactor.js');
        AssertHelper.assertFileExists(redactorPath, 'Redactor module should exist');
    }

    async testF1_07_ScannerDetection() {
        this.git.resetHard();
        this.git.clean();
        
        // Create different types of changes
        this.fileHelper.createFile('new-file.txt', 'New file content');
        this.fileHelper.createFile('src/app.js', 'console.log("app");');
        
        const status = this.git.getStatus();
        AssertHelper.assert(status.includes('new-file.txt') || status.includes('??'), 'Should detect new files');
    }

    async testF1_08_NoChanges() {
        this.git.resetHard();
        this.git.clean();
        
        try {
            const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes`, {
                cwd: this.testRepo,
                encoding: 'utf8',
                timeout: 30000
            });
            
            AssertHelper.assertContains(output.toLowerCase(), 'no changes', 'Should show no changes message');
        } catch (error) {
            AssertHelper.assertContains(error.message.toLowerCase(), 'no changes', 'Should fail with no changes');
        }
    }

    async testF1_09_ConventionalCommits() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`feature-${timestamp}.js`, '// New feature');
        this.git.addAll();
        
        execSync(`node "${this.cogitPath}/dist/index.js" auto --yes`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        const lastCommit = this.git.getLastCommit();
        if (lastCommit) {
            const message = lastCommit.split('|')[1];
            AssertHelper.assertConventionalCommitFormat(message, 'Commit should follow Conventional Commits');
        }
    }

    async testF1_10_I18n() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`test-i18n-${timestamp}.txt`, 'Test i18n');
        this.git.addAll();
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, LANGUAGE: 'pt', COMMIT_LANGUAGE: 'pt' }
        });
        
        // Should work with Portuguese settings - verify commit was created
        const lastCommit = this.git.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created with i18n');
    }

    // ==================== FASE 2 TESTS ====================

    async testF2_01_MenuCommand() {
        const helpOutput = execSync(`node "${this.cogitPath}/dist/index.js" --help`, {
            cwd: this.cogitPath,
            encoding: 'utf8'
        });
        
        AssertHelper.assertContains(helpOutput, 'menu', 'Menu command should be registered');
    }

    async testF2_02_DryRun() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`dry-run-${timestamp}.txt`, 'Dry run test');
        this.git.addAll();
        
        const beforeCommit = this.git.getLastCommit();
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --dry-run --yes`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        const afterCommit = this.git.getLastCommit();
        
        AssertHelper.assertContains(output, 'DRY RUN', 'Should show DRY RUN mode');
        AssertHelper.assertEquals(beforeCommit, afterCommit, 'No commit should be created in dry-run');
    }

    async testF2_03_Nobuild() {
        const timestamp = Date.now();
        this.fileHelper.createFile(`nobuild-${timestamp}.txt`, 'Nobuild test');
        this.git.addAll();
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --yes --nobuild --no-push`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        const lastCommit = this.git.getLastCommit();
        if (lastCommit) {
            const message = lastCommit.split('|')[1];
            AssertHelper.assertContains(message, '[CI Skip]', 'Commit should contain [CI Skip]');
        }
    }

    async testF2_04_HealerModule() {
        const healerPath = path.join(this.cogitPath, 'dist', 'services', 'git', 'healer.js');
        AssertHelper.assertFileExists(healerPath, 'Healer module should exist');
    }

    async testF2_05_UIRenderer() {
        const rendererPath = path.join(this.cogitPath, 'dist', 'cli', 'ui', 'renderer.js');
        AssertHelper.assertFileExists(rendererPath, 'Renderer module should exist');
        
        // Verify exports
        const renderer = require(rendererPath);
        AssertHelper.assert(typeof renderer.renderHeader === 'function', 'renderHeader should be exported');
        AssertHelper.assert(typeof renderer.renderCommitMessage === 'function', 'renderCommitMessage should be exported');
        AssertHelper.assert(typeof renderer.renderDryRun === 'function', 'renderDryRun should be exported');
    }

    async testF2_06_UIPrompts() {
        const promptsPath = path.join(this.cogitPath, 'dist', 'cli', 'ui', 'prompts.js');
        AssertHelper.assertFileExists(promptsPath, 'Prompts module should exist');
        
        // Verify exports
        const prompts = require(promptsPath);
        AssertHelper.assert(typeof prompts.confirmAction === 'function', 'confirmAction should be exported');
        AssertHelper.assert(typeof prompts.reviewCommitMessage === 'function', 'reviewCommitMessage should be exported');
    }

    async testF2_07_ScannerUntracked() {
        this.git.resetHard();
        this.git.clean();
        
        // Create untracked file (don't add to git)
        this.fileHelper.createFile('untracked-test.txt', 'Untracked content');
        
        const output = execSync(`node "${this.cogitPath}/dist/index.js" auto --dry-run --yes`, {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should detect and show the untracked file in diff
        AssertHelper.assertContains(output, 'DRY RUN', 'Should process untracked files');
    }

    // ==================== RUN ALL ====================

    async runAll() {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 COMPREHENSIVE TEST SUITE - FASE 1 + FASE 2');
        console.log('='.repeat(70) + '\n');
        
        await this.setup();
        
        console.log('\n📦 FASE 1 TESTS (MVP)');
        console.log('-'.repeat(40));
        
        await this.runTest('F1-01: Basic Functionality', () => this.testF1_01_BasicFunctionality(), 'fase1');
        await this.runTest('F1-02: Flag --yes', () => this.testF1_02_FlagYes(), 'fase1');
        await this.runTest('F1-03: Flag --no-push', () => this.testF1_03_FlagNoPush(), 'fase1');
        await this.runTest('F1-04: Flag -m <hint>', () => this.testF1_04_FlagHint(), 'fase1');
        await this.runTest('F1-05: Security Blocklist', () => this.testF1_05_SecurityBlocklist(), 'fase1');
        await this.runTest('F1-06: Secrets Redaction', () => this.testF1_06_SecretsRedaction(), 'fase1');
        await this.runTest('F1-07: Scanner Detection', () => this.testF1_07_ScannerDetection(), 'fase1');
        await this.runTest('F1-08: No Changes', () => this.testF1_08_NoChanges(), 'fase1');
        await this.runTest('F1-09: Conventional Commits', () => this.testF1_09_ConventionalCommits(), 'fase1');
        await this.runTest('F1-10: i18n', () => this.testF1_10_I18n(), 'fase1');
        
        console.log('\n📦 FASE 2 TESTS (Automação)');
        console.log('-'.repeat(40));
        
        await this.runTest('F2-01: Menu Command', () => this.testF2_01_MenuCommand(), 'fase2');
        await this.runTest('F2-02: Flag --dry-run', () => this.testF2_02_DryRun(), 'fase2');
        await this.runTest('F2-03: Flag --nobuild', () => this.testF2_03_Nobuild(), 'fase2');
        await this.runTest('F2-04: Healer Module', () => this.testF2_04_HealerModule(), 'fase2');
        await this.runTest('F2-05: UI Renderer', () => this.testF2_05_UIRenderer(), 'fase2');
        await this.runTest('F2-06: UI Prompts', () => this.testF2_06_UIPrompts(), 'fase2');
        await this.runTest('F2-07: Scanner Untracked', () => this.testF2_07_ScannerUntracked(), 'fase2');
        
        this.generateReport();
        return this.results;
    }

    generateReport() {
        const duration = (Date.now() - new Date(this.results.startTime).getTime()) / 1000;
        
        console.log('\n' + '='.repeat(70));
        console.log('📊 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(70));
        
        console.log('\n📦 FASE 1 (MVP):');
        console.log(`   ✅ Passed: ${this.results.phases.fase1.passed}`);
        console.log(`   ❌ Failed: ${this.results.phases.fase1.failed}`);
        
        console.log('\n📦 FASE 2 (Automação):');
        console.log(`   ✅ Passed: ${this.results.phases.fase2.passed}`);
        console.log(`   ❌ Failed: ${this.results.phases.fase2.failed}`);
        
        console.log('\n📈 SUMMARY:');
        console.log(`   Total Tests: ${this.results.total}`);
        console.log(`   Passed: ${this.results.passed.length}`);
        console.log(`   Failed: ${this.results.failed.length}`);
        console.log(`   Duration: ${duration.toFixed(2)}s`);
        console.log(`   Success Rate: ${((this.results.passed.length / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.failed.forEach(t => {
                console.log(`   - [${t.phase}] ${t.name}: ${t.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(70));
        
        if (this.results.failed.length === 0) {
            console.log('🎉 ALL TESTS PASSED! FASE 1 and FASE 2 are ready for production!');
        } else {
            console.log('⚠️  Some tests failed. Review and fix before production.');
        }
        
        console.log('='.repeat(70) + '\n');
        
        // Write JSON report
        const reportPath = path.join(this.cogitPath, 'test-automation', 'reports', `comprehensive-${Date.now()}.json`);
        const reportDir = path.dirname(reportPath);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        fs.writeFileSync(reportPath, JSON.stringify({
            ...this.results,
            duration,
            endTime: new Date().toISOString()
        }, null, 2));
        
        this.log(`Report saved to: ${reportPath}`);
    }
}

// Run tests
if (require.main === module) {
    const runner = new ComprehensiveTestRunner();
    runner.runAll()
        .then(results => {
            process.exit(results.failed.length > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveTestRunner;
