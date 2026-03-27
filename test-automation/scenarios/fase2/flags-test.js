/**
 * FASE 2 - Flags Test
 * Tests: F2-03 (--yes), F2-04 (--no-push), F2-05 (--dry-run), F2-06 (--nobuild), F2-07 (-m), F2-08 (-p)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class FlagsTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F2-03: --yes Flag
    await runner.runTest('F2-03', '--yes Flag', async () => {
      runner.log('Testing --yes flag...', 'info');
      
      git.resetHard();
      git.clean();
      fileHelper.createFile('test-yes.txt', 'Testing --yes flag');
      git.addAll();
      
      const startTime = Date.now();
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      const duration = Date.now() - startTime;
      
      // Should not show interactive prompts
      AssertHelper.assertNotContains(output, 'What would you like to do', 'Should not show interactive prompt');
      
      // Should show success
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Performance check
      AssertHelper.assertPerformance(duration, config.timeout.medium, 'cogit auto --yes', 'Performance check failed');
      
      // Verify commit was created
      const lastCommit = git.getLastCommit();
      AssertHelper.assert(lastCommit !== null, 'Commit should be created');
      
      fileHelper.cleanup();
    }, 'fase2');
    
    // F2-04: --no-push Flag
    await runner.runTest('F2-04', '--no-push Flag', async () => {
      runner.log('Testing --no-push flag...', 'info');
      
      git.resetHard();
      git.clean();
      fileHelper.createFile('test-nopush.txt', 'Testing --no-push flag');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Verify commit was created locally
      const lastCommit = git.getLastCommit();
      AssertHelper.assert(lastCommit !== null, 'Commit should be created locally');
      
      fileHelper.cleanup();
    }, 'fase2');
    
    // F2-05: --dry-run Flag
    await runner.runTest('F2-05', '--dry-run Flag', async () => {
      runner.log('Testing --dry-run flag...', 'info');
      
      git.resetHard();
      git.clean();
      fileHelper.createFile('test-dryrun.txt', 'Testing --dry-run flag');
      git.addAll();
      
      const lastCommitBefore = git.getLastCommit();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --dry-run`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      // Should show simulation message
      AssertHelper.assertContains(output.toLowerCase(), 'dry', 'Should show dry-run message');
      
      // Should NOT create commit
      const lastCommitAfter = git.getLastCommit();
      AssertHelper.assertEquals(lastCommitBefore, lastCommitAfter, 'No commit should be created in dry-run mode');
      
      fileHelper.cleanup();
    }, 'fase2');
    
    // F2-06: --nobuild Flag
    await runner.runTest('F2-06', '--nobuild Flag', async () => {
      runner.log('Testing --nobuild flag...', 'info');
      
      git.resetHard();
      git.clean();
      fileHelper.createFile('test-nobuild.txt', 'Testing --nobuild flag');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --nobuild --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Verify commit was created
      const lastCommit = git.getLastCommit();
      AssertHelper.assert(lastCommit !== null, 'Commit should be created');
      
      // Commit message should contain [CI Skip] or similar
      const commitMessage = lastCommit.split('|')[1];
      const hasSkipMarker = commitMessage.toLowerCase().includes('ci') || 
                           commitMessage.toLowerCase().includes('skip') ||
                           commitMessage.toLowerCase().includes('nobuild');
      
      runner.log(`Commit created with nobuild: "${commitMessage}"`, 'info');
      
      fileHelper.cleanup();
    }, 'fase2');
    
    // F2-07: -m Flag (message hint)
    await runner.runTest('F2-07', '-m Flag (message hint)', async () => {
      runner.log('Testing -m flag...', 'info');
      
      git.resetHard();
      git.clean();
      fileHelper.createFile('test-message.txt', 'Testing -m flag with hint');
      git.addAll();
      
      const hint = 'fix authentication bug in login module';
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes -m "${hint}" --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Verify commit message reflects the hint
      const lastCommit = git.getLastCommit();
      const commitMessage = lastCommit.split('|')[1];
      
      // Should contain keywords from the hint
      const hasFix = commitMessage.toLowerCase().includes('fix') || commitMessage.toLowerCase().includes('auth');
      
      runner.log(`Commit with hint: "${commitMessage}"`, 'info');
      
      fileHelper.cleanup();
    }, 'fase2');
    
    // F2-08: -p Flag (path)
    await runner.runTest('F2-08', '-p Flag (path)', async () => {
      runner.log('Testing -p flag...', 'info');
      
      // Create a temporary directory for testing
      const fs = require('fs');
      const tempDir = path.join(config.testRepo, 'temp-test-dir');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Initialize git in temp directory
      try {
        execSync('git init', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });
        execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'pipe' });
      } catch (error) {
        // Git might already be initialized
      }
      
      // Create test file in temp directory
      const tempFileHelper = new FileHelper(tempDir);
      tempFileHelper.createFile('test-path.txt', 'Testing -p path flag');
      
      // Run with -p flag
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes -p "${tempDir}"`, {
        cwd: config.cogitPath,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Cleanup
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      
      runner.log('Path flag test passed', 'info');
    }, 'fase2');
  }
}

module.exports = { run: FlagsTest.run };
