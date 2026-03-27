/**
 * FASE 2 Test Suite - Cogit CLI
 * Tests: Menu, Dry-Run, CI Skip, Git Healer
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_REPO = 'C:\\code\\github\\teste';
const COGIT_DIR = 'C:\\code\\github\\cogit';

class Fase2TestRunner {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            total: 0,
            startTime: new Date().toISOString()
        };
    }

    log(message) {
        console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
    }

    async runTest(name, testFn) {
        this.results.total++;
        try {
            await testFn();
            this.results.passed.push(name);
            this.log(`✅ PASS: ${name}`);
            return true;
        } catch (error) {
            this.results.failed.push({ name, error: error.message });
            this.log(`❌ FAIL: ${name} - ${error.message}`);
            return false;
        }
    }

    async setup() {
        this.log('Setting up test environment...');
        
        // Build cogit
        execSync('npx tsc', { cwd: COGIT_DIR, stdio: 'inherit' });
        
        // Clean test repo
        try {
            execSync('git checkout .', { cwd: TEST_REPO, stdio: 'pipe' });
            execSync('git clean -fd', { cwd: TEST_REPO, stdio: 'pipe' });
        } catch (e) {
            // Ignore cleanup errors
        }
    }

    async testDryRun() {
        // Create test file
        const testFile = path.join(TEST_REPO, `dry-run-test-${Date.now()}.txt`);
        fs.writeFileSync(testFile, 'dry run test content');
        
        // Run dry-run
        const output = execSync(`node "${COGIT_DIR}\\dist\\index.js" auto --dry-run --yes`, {
            cwd: TEST_REPO,
            encoding: 'utf8'
        });
        
        // Verify it shows simulation
        if (!output.includes('DRY RUN') && !output.includes('Would execute')) {
            throw new Error('Dry run should show simulation message');
        }
        
        // Verify file is NOT committed (still exists as unstaged)
        const status = execSync('git status --porcelain', {
            cwd: TEST_REPO,
            encoding: 'utf8'
        });
        
        if (!status.includes('dry-run-test')) {
            throw new Error('File should not be committed in dry-run mode');
        }
        
        // Cleanup
        fs.unlinkSync(testFile);
    }

    async testNobuild() {
        // Create test file
        const testFile = path.join(TEST_REPO, `nobuild-test-${Date.now()}.txt`);
        fs.writeFileSync(testFile, 'nobuild test content');
        
        // Run with nobuild
        const output = execSync(`node "${COGIT_DIR}\\dist\\index.js" auto --yes --nobuild --no-push`, {
            cwd: TEST_REPO,
            encoding: 'utf8'
        });
        
        // Verify [CI Skip] in message
        if (!output.includes('[CI Skip]')) {
            throw new Error('Commit message should contain [CI Skip]');
        }
        
        // Verify commit was created with [CI Skip]
        const log = execSync('git log -1 --pretty=%B', {
            cwd: TEST_REPO,
            encoding: 'utf8'
        });
        
        if (!log.includes('[CI Skip]')) {
            throw new Error('Git commit should contain [CI Skip]');
        }
    }

    async testMenuCommand() {
        // Test that menu command exists
        const helpOutput = execSync(`node "${COGIT_DIR}\\dist\\index.js" --help`, {
            cwd: COGIT_DIR,
            encoding: 'utf8'
        });
        
        if (!helpOutput.includes('menu')) {
            throw new Error('Menu command should be registered');
        }
    }

    async testAutoWithNewFlags() {
        // Test help shows new flags
        const helpOutput = execSync(`node "${COGIT_DIR}\\dist\\index.js" auto --help`, {
            cwd: COGIT_DIR,
            encoding: 'utf8'
        });
        
        if (!helpOutput.includes('--dry-run')) {
            throw new Error('--dry-run flag should be available');
        }
        
        if (!helpOutput.includes('--nobuild')) {
            throw new Error('--nobuild flag should be available');
        }
    }

    async testRendererModule() {
        // Verify renderer module exists
        const rendererPath = path.join(COGIT_DIR, 'dist', 'cli', 'ui', 'renderer.js');
        if (!fs.existsSync(rendererPath)) {
            throw new Error('Renderer module should be compiled');
        }
    }

    async testPromptsModule() {
        // Verify prompts module exists
        const promptsPath = path.join(COGIT_DIR, 'dist', 'cli', 'ui', 'prompts.js');
        if (!fs.existsSync(promptsPath)) {
            throw new Error('Prompts module should be compiled');
        }
    }

    async testHealerModule() {
        // Verify healer module exists
        const healerPath = path.join(COGIT_DIR, 'dist', 'services', 'git', 'healer.js');
        if (!fs.existsSync(healerPath)) {
            throw new Error('Healer module should be compiled');
        }
    }

    async testMenuModule() {
        // Verify menu module exists
        const menuPath = path.join(COGIT_DIR, 'dist', 'cli', 'commands', 'menu.js');
        if (!fs.existsSync(menuPath)) {
            throw new Error('Menu module should be compiled');
        }
    }

    generateReport() {
        const duration = (Date.now() - new Date(this.results.startTime).getTime()) / 1000;
        
        console.log('\n' + '='.repeat(50));
        console.log('FASE 2 TEST REPORT');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed.length}`);
        console.log(`Failed: ${this.results.failed.length}`);
        console.log(`Duration: ${duration.toFixed(2)}s`);
        console.log(`Status: ${this.results.failed.length === 0 ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
        
        if (this.results.failed.length > 0) {
            console.log('\nFailed Tests:');
            this.results.failed.forEach(f => {
                console.log(`  - ${f.name}: ${f.error}`);
            });
        }
        
        console.log('='.repeat(50));
        
        // Write JSON report
        const reportPath = path.join(COGIT_DIR, 'test-automation', 'reports', `fase2-report-${Date.now()}.json`);
        const reportDir = path.dirname(reportPath);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        fs.writeFileSync(reportPath, JSON.stringify({
            ...this.results,
            duration,
            endTime: new Date().toISOString()
        }, null, 2));
        
        return this.results.failed.length === 0;
    }

    async run() {
        console.log('🚀 Starting FASE 2 Tests...\n');
        
        await this.setup();
        
        // Module existence tests
        await this.runTest('Renderer Module', () => this.testRendererModule());
        await this.runTest('Prompts Module', () => this.testPromptsModule());
        await this.runTest('Healer Module', () => this.testHealerModule());
        await this.runTest('Menu Module', () => this.testMenuModule());
        
        // Command tests
        await this.runTest('Menu Command Registered', () => this.testMenuCommand());
        await this.runTest('Auto New Flags', () => this.testAutoWithNewFlags());
        
        // Functional tests
        await this.runTest('Dry Run Mode', () => this.testDryRun());
        await this.runTest('CI Skip Flag', () => this.testNobuild());
        
        return this.generateReport();
    }
}

// Run tests
const runner = new Fase2TestRunner();
runner.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
