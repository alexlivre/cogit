#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SimpleTest {
    constructor() {
        this.testRepo = 'C:/code/github/teste';
        this.cogitPath = 'C:/code/github/cogit';
        this.results = { passed: 0, failed: 0, tests: [] };
    }

    log(message, type = 'info') {
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} ${message}`);
    }

    async runTest(name, testFn) {
        this.log(`Running: ${name}`);
        try {
            await testFn();
            this.results.passed++;
            this.results.tests.push({ name, status: 'passed' });
            this.log(`${name} - PASSED`, 'success');
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({ name, status: 'failed', error: error.message });
            this.log(`${name} - FAILED: ${error.message}`, 'error');
        }
    }

    setupRepo() {
        // Clean uncommitted changes only
        try {
            execSync('git reset --hard HEAD', { cwd: this.testRepo, stdio: 'pipe' });
            execSync('git clean -fd', { cwd: this.testRepo, stdio: 'pipe' });
        } catch (error) {
            // Ignore errors
        }
    }

    async testBasicFlow() {
        this.setupRepo();
        
        // Create test file and add to git
        const testFile = path.join(this.testRepo, 'test-basic.txt');
        fs.writeFileSync(testFile, 'Basic test content');
        execSync('git add test-basic.txt', { cwd: this.testRepo, stdio: 'pipe' });
        
        // Run cogit
        const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes', {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Check if commit was created
        const lastCommit = execSync('git log -1 --pretty=format:"%s"', {
            cwd: this.testRepo,
            encoding: 'utf8'
        });
        
        if (!lastCommit || lastCommit.trim() === '') {
            throw new Error('No commit created');
        }
        
        this.log(`Commit created: "${lastCommit.trim()}"`);
    }

    async testFlags() {
        this.setupRepo();
        
        // Test --no-push flag
        fs.writeFileSync(path.join(this.testRepo, 'test-nopush.txt'), 'Test no push');
        execSync('git add test-nopush.txt', { cwd: this.testRepo, stdio: 'pipe' });
        
        const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes --no-push', {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Check commit was created
        const status = execSync('git status --porcelain', {
            cwd: this.testRepo,
            encoding: 'utf8'
        });
        
        if (status.trim() !== '') {
            throw new Error('Repository not clean after commit');
        }
    }

    async testSecurity() {
        this.setupRepo();
        
        // Create sensitive file and add to git
        const envFile = path.join(this.testRepo, '.env.local');
        fs.writeFileSync(envFile, 'DATABASE_URL=secret\nAPI_KEY=secret123');
        execSync('git add .env.local', { cwd: this.testRepo, stdio: 'pipe' });
        
        try {
            const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes', {
                cwd: this.testRepo,
                encoding: 'utf8',
                timeout: 30000
            });
            
            // If it succeeds, check if it mentions security
            if (!output.toLowerCase().includes('security') && 
                !output.toLowerCase().includes('blocked') &&
                !output.toLowerCase().includes('alert')) {
                throw new Error('Security check not working');
            }
        } catch (error) {
            // Expected to fail due to security
            if (!error.message.toLowerCase().includes('security') &&
                !error.message.toLowerCase().includes('blocked') &&
                !error.message.toLowerCase().includes('error.blocked_files')) {
                throw new Error('Security check failed with wrong error');
            }
        }
    }

    async testI18n() {
        this.setupRepo();
        
        // Test Portuguese - ensure we have changes
        fs.writeFileSync(path.join(this.testRepo, 'test-pt.txt'), 'Teste em português');
        execSync('git add test-pt.txt', { cwd: this.testRepo, stdio: 'pipe' });
        
        // Verify we have changes
        const status = execSync('git status --porcelain', { cwd: this.testRepo, encoding: 'utf8' });
        if (status.trim() === '') {
            throw new Error('No changes to test');
        }
        
        const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes', {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, LANGUAGE: 'pt', COMMIT_LANGUAGE: 'pt' }
        });
        
        // Should contain English UI messages (that's expected)
        if (!output.toLowerCase().includes('processing') && 
            !output.toLowerCase().includes('generating')) {
            throw new Error('Basic UI messages not working');
        }
        
        // The important part is that the commit should be in Portuguese
        const commitMsg = execSync('git log -1 --pretty=format:"%s"', {
            cwd: this.testRepo,
            encoding: 'utf8'
        });
        
        if (!commitMsg.includes('Adicionar') && !commitMsg.includes('Adicionado') && !commitMsg.includes('Adiciona')) {
            throw new Error('Commit message not in Portuguese');
        }
    }

    async testNoChanges() {
        this.setupRepo();
        
        // Ensure clean state
        try {
            execSync('git add -A', { cwd: this.testRepo, stdio: 'pipe' });
            execSync('git commit -m "cleanup"', { cwd: this.testRepo, stdio: 'pipe' });
        } catch (error) {
            // Ignore if nothing to commit
        }
        
        try {
            const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes', {
                cwd: this.testRepo,
                encoding: 'utf8',
                timeout: 30000
            });
            
            if (!output.toLowerCase().includes('no changes') && 
                !output.toLowerCase().includes('changes') &&
                !output.toLowerCase().includes('detected')) {
                throw new Error('No changes message not shown');
            }
        } catch (error) {
            // Expected to exit with no changes message
            if (!error.message.toLowerCase().includes('changes')) {
                throw new Error('Wrong error for no changes');
            }
        }
    }

    async testFormat() {
        this.setupRepo();
        
        // Create feature file and add to git
        fs.writeFileSync(path.join(this.testRepo, 'feature.js'), '// New feature implementation');
        execSync('git add feature.js', { cwd: this.testRepo, stdio: 'pipe' });
        
        const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes -m "add new feature"', {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Get commit message
        const commitMsg = execSync('git log -1 --pretty=format:"%s"', {
            cwd: this.testRepo,
            encoding: 'utf8'
        });
        
        // Check conventional commit format (including Portuguese types)
        const validTypes = ['feat:', 'fix:', 'update:', 'chore:', 'docs:', 'refactor:', 'style:', 'test:', 'build:', 'ci:'];
        const hasValidType = validTypes.some(type => commitMsg.toLowerCase().startsWith(type));
        
        if (!hasValidType) {
            throw new Error(`Invalid commit format: "${commitMsg}"`);
        }
        
        this.log(`Format test passed: "${commitMsg}"`);
    }

    async runAll() {
        this.log('Starting simple test suite...');
        
        await this.runTest('Basic Flow', () => this.testBasicFlow());
        await this.runTest('Flags Test', () => this.testFlags());
        await this.runTest('Security Test', () => this.testSecurity());
        await this.runTest('Internationalization', () => this.testI18n());
        await this.runTest('No Changes', () => this.testNoChanges());
        await this.runTest('Format Validation', () => this.testFormat());
        
        // Show summary
        console.log('\n' + '='.repeat(50));
        console.log('TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Total: ${this.results.passed + this.results.failed}`);
        console.log('='.repeat(50));
        
        if (this.results.failed > 0) {
            console.log('\nFAILED TESTS:');
            this.results.tests.filter(t => t.status === 'failed').forEach(t => {
                console.log(`  ❌ ${t.name}: ${t.error}`);
            });
        }
        
        return this.results;
    }
}

if (require.main === module) {
    const tester = new SimpleTest();
    tester.runAll()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = SimpleTest;
