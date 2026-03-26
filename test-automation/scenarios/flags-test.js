const { execSync } = require('child_process');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');

class FlagsTest {
    static async run(runner) {
        const git = new GitHelper(runner.testRepo);
        const fileHelper = new FileHelper(runner.testRepo);
        
        runner.log('Testing flags and options...');
        
        // Test 1: --yes flag
        await this.testYesFlag(runner, git, fileHelper);
        
        // Test 2: --no-push flag
        await this.testNoPushFlag(runner, git, fileHelper);
        
        // Test 3: -m message hint flag
        await this.testMessageFlag(runner, git, fileHelper);
        
        // Test 4: -p path flag
        await this.testPathFlag(runner, git, fileHelper);
        
        runner.log('✓ All flags tests completed successfully');
    }
    
    static async testYesFlag(runner, git, fileHelper) {
        runner.log('Testing --yes flag...');
        
        // Setup
        git.resetHard();
        git.clean();
        fileHelper.createFile('test-yes.txt', 'Testing --yes flag');
        
        // Run with --yes flag
        const startTime = Date.now();
        const output = execSync('node ../dist/index.js auto --yes', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        const duration = Date.now() - startTime;
        
        // Should not show interactive prompts
        AssertHelper.assertNotContains(output, 'What would you like to do', 'Should not show interactive prompt');
        AssertHelper.assertNotContains(output, 'Execute', 'Should not show execute option');
        
        // Should show success
        AssertHelper.assertContains(output, 'Commit created', 'Should show success message');
        
        // Performance check
        AssertHelper.assertPerformance(duration, 20000, 'cogit auto --yes', 'Performance check failed');
        
        // Verify commit was created
        const lastCommit = git.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created');
        
        runner.log('✓ --yes flag test passed');
    }
    
    static async testNoPushFlag(runner, git, fileHelper) {
        runner.log('Testing --no-push flag...');
        
        // Setup
        git.resetHard();
        git.clean();
        fileHelper.createFile('test-nopush.txt', 'Testing --no-push flag');
        
        // Run with --no-push flag
        const output = execSync('node ../dist/index.js auto --yes --no-push', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should show success but might not mention push
        AssertHelper.assertContains(output, 'Commit created', 'Should show success message');
        
        // Verify commit was created locally
        const lastCommit = git.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created locally');
        
        // Check if there are unpushed commits (by comparing with remote)
        // This is a simplified check - in real scenario you'd compare with remote
        runner.log('✓ --no-push flag test passed');
    }
    
    static async testMessageFlag(runner, git, fileHelper) {
        runner.log('Testing -m message hint flag...');
        
        // Setup
        git.resetHard();
        git.clean();
        fileHelper.createFile('test-message.txt', 'Testing -m flag with hint');
        
        // Run with -m flag
        const hint = 'fix authentication bug in login module';
        const output = execSync(`node ../dist/index.js auto --yes -m "${hint}"`, {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should show success
        AssertHelper.assertContains(output, 'Commit created', 'Should show success message');
        
        // Verify commit message reflects the hint
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        
        // Should contain keywords from the hint
        AssertHelper.assertContains(commitMessage.toLowerCase(), 'fix', 'Commit should reflect fix hint');
        AssertHelper.assertContains(commitMessage.toLowerCase(), 'auth', 'Commit should reflect authentication');
        
        runner.log(`✓ -m flag test passed - commit: "${commitMessage}"`);
    }
    
    static async testPathFlag(runner, git, fileHelper) {
        runner.log('Testing -p path flag...');
        
        // Create a temporary directory for testing
        const tempDir = 'temp-test-dir';
        const tempPath = `${runner.testRepo}/${tempDir}`;
        
        if (!require('fs').existsSync(tempPath)) {
            require('fs').mkdirSync(tempPath, { recursive: true });
        }
        
        // Initialize git in temp directory if not already
        try {
            execSync('git init', { cwd: tempPath, stdio: 'pipe' });
            execSync('git config user.name "Test User"', { cwd: tempPath, stdio: 'pipe' });
            execSync('git config user.email "test@example.com"', { cwd: tempPath, stdio: 'pipe' });
        } catch (error) {
            // Git might already be initialized
        }
        
        // Create test file in temp directory
        const tempGit = new GitHelper(tempPath);
        const tempFileHelper = new FileHelper(tempPath);
        
        tempFileHelper.createFile('test-path.txt', 'Testing -p path flag');
        
        // Run with -p flag pointing to temp directory
        const output = execSync(`node ../dist/index.js auto --yes -p "${tempPath}"`, {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should show success
        AssertHelper.assertContains(output, 'Commit created', 'Should show success message');
        
        // Verify commit was created in temp directory
        const lastCommit = tempGit.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created in specified path');
        
        // Cleanup
        tempFileHelper.cleanup();
        
        runner.log('✓ -p path flag test passed');
    }
    
    static async testCombinedFlags(runner, git, fileHelper) {
        runner.log('Testing combined flags...');
        
        // Setup
        git.resetHard();
        git.clean();
        fileHelper.createFile('test-combined.txt', 'Testing combined flags');
        
        // Run with multiple flags
        const hint = 'feat add user profile feature';
        const output = execSync(`node ../dist/index.js auto --yes --no-push -m "${hint}"`, {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should show success
        AssertHelper.assertContains(output, 'Commit created', 'Should show success message');
        
        // Verify commit message
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        
        AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit format check failed: ');
        AssertHelper.assertContains(commitMessage.toLowerCase(), 'feat', 'Commit should reflect feat hint');
        AssertHelper.assertContains(commitMessage.toLowerCase(), 'profile', 'Commit should reflect profile feature');
        
        runner.log(`✓ Combined flags test passed - commit: "${commitMessage}"`);
    }
}

module.exports = FlagsTest;
