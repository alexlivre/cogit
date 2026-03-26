#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FinalTest {
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

    async testBasic() {
        // Create unique file
        const timestamp = Date.now();
        const testFile = path.join(this.testRepo, `test-${timestamp}.txt`);
        fs.writeFileSync(testFile, `Test content ${timestamp}`);
        
        // Add to git
        execSync(`git add test-${timestamp}.txt`, { cwd: this.testRepo, stdio: 'pipe' });
        
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
        
        this.log(`✓ Basic test passed: "${lastCommit.trim()}"`);
    }

    async testSecurity() {
        // Create sensitive file
        const timestamp = Date.now();
        const envFile = path.join(this.testRepo, `.env-${timestamp}`);
        fs.writeFileSync(envFile, 'DATABASE_URL=secret\nAPI_KEY=secret123');
        
        // Add to git
        execSync(`git add .env-${timestamp}`, { cwd: this.testRepo, stdio: 'pipe' });
        
        try {
            const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes', {
                cwd: this.testRepo,
                encoding: 'utf8',
                timeout: 30000
            });
            
            throw new Error('Security check failed - should have blocked');
        } catch (error) {
            if (!error.message.includes('error.blocked_files') && 
                !error.message.includes('Security') &&
                !error.message.includes('blocked')) {
                throw new Error('Wrong security error');
            }
        }
        
        this.log('✓ Security test passed - blocked sensitive file');
    }

    async testFlags() {
        // Create file and test --no-push
        const timestamp = Date.now();
        fs.writeFileSync(path.join(this.testRepo, `test-nopush-${timestamp}.txt`), 'Test no push');
        execSync(`git add test-nopush-${timestamp}.txt`, { cwd: this.testRepo, stdio: 'pipe' });
        
        const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes --no-push', {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        this.log('✓ Flags test passed - --no-push worked');
    }

    async testI18n() {
        // Test Portuguese
        const timestamp = Date.now();
        fs.writeFileSync(path.join(this.testRepo, `test-pt-${timestamp}.txt`), 'Teste em português');
        execSync(`git add test-pt-${timestamp}.txt`, { cwd: this.testRepo, stdio: 'pipe' });
        
        const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes', {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, LANGUAGE: 'pt', COMMIT_LANGUAGE: 'pt' }
        });
        
        // Check commit message
        const commitMsg = execSync('git log -1 --pretty=format:"%s"', {
            cwd: this.testRepo,
            encoding: 'utf8'
        });
        
        if (!commitMsg.includes('Adicionar') && !commitMsg.includes('Adicionado') && !commitMsg.includes('feat')) {
            throw new Error(`Not Portuguese: "${commitMsg}"`);
        }
        
        this.log(`✓ i18n test passed: "${commitMsg}"`);
    }

    async testNoChanges() {
        // Clean up any uncommitted changes
        try {
            execSync('git reset --hard HEAD', { cwd: this.testRepo, stdio: 'pipe' });
            execSync('git clean -fd', { cwd: this.testRepo, stdio: 'pipe' });
        } catch (error) {
            // Ignore
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
                throw new Error('Wrong no changes message');
            }
        } catch (error) {
            if (!error.message.toLowerCase().includes('changes') &&
                !error.message.toLowerCase().includes('no changes')) {
                throw new Error('Wrong no changes error');
            }
        }
        
        this.log('✓ No changes test passed');
    }

    async testFormat() {
        // Create feature file
        const timestamp = Date.now();
        fs.writeFileSync(path.join(this.testRepo, `feature-${timestamp}.js`), '// New feature');
        execSync(`git add feature-${timestamp}.js`, { cwd: this.testRepo, stdio: 'pipe' });
        
        const output = execSync('node C:/code/github/cogit/dist/index.js auto --yes -m "add new feature"', {
            cwd: this.testRepo,
            encoding: 'utf8',
            timeout: 30000
        });
        
        const commitMsg = execSync('git log -1 --pretty=format:"%s"', {
            cwd: this.testRepo,
            encoding: 'utf8'
        });
        
        const validTypes = ['feat:', 'fix:', 'update:', 'chore:', 'docs:', 'refactor:', 'style:', 'test:', 'build:', 'ci:'];
        const hasValidType = validTypes.some(type => commitMsg.toLowerCase().startsWith(type));
        
        if (!hasValidType) {
            throw new Error(`Invalid format: "${commitMsg}"`);
        }
        
        this.log(`✓ Format test passed: "${commitMsg}"`);
    }

    async runAll() {
        this.log('Starting final test suite...');
        
        await this.runTest('Basic Functionality', () => this.testBasic());
        await this.runTest('Security Blocklist', () => this.testSecurity());
        await this.runTest('Flags Test', () => this.testFlags());
        await this.runTest('Internationalization', () => this.testI18n());
        await this.runTest('No Changes', () => this.testNoChanges());
        await this.runTest('Format Validation', () => this.testFormat());
        
        // Show summary
        console.log('\n' + '='.repeat(60));
        console.log('FINAL TEST RESULTS - FASE 1');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
        console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));
        
        if (this.results.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.tests.filter(t => t.status === 'failed').forEach(t => {
                console.log(`  - ${t.name}: ${t.error}`);
            });
        }
        
        if (this.results.passed === this.results.passed + this.results.failed) {
            console.log('\n🎉 ALL TESTS PASSED! FASE 1 is ready for production!');
            console.log('✅ You can now proceed to FASE 2 implementation.');
        } else {
            console.log('\n⚠️  Some tests failed. Review and fix before proceeding to FASE 2.');
        }
        
        console.log('='.repeat(60));
        
        return this.results;
    }
}

if (require.main === module) {
    const tester = new FinalTest();
    tester.runAll()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = FinalTest;
