/**
 * FASE 1 - Basic Commit Flow Test
 * Tests: F1-01 - Complete commit flow with AI
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class BasicCommitTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F1-01: Basic Commit Flow
    await runner.runTest('F1-01', 'Basic Commit Flow', async () => {
      runner.log('Setting up test files...', 'info');
      
      // Clean repository
      git.resetHard();
      git.clean();
      
      // Create test files
      const testFiles = fileHelper.createCodeFiles();
      runner.log(`Created ${testFiles.length} test files`, 'info');
      
      // Verify changes are detected
      AssertHelper.assert(git.hasChanges(), 'Changes should be detected');
      runner.log('Changes detected successfully', 'info');
      
      // Run cogit auto command
      runner.log('Executing: cogit auto --yes', 'info');
      const startTime = Date.now();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const duration = Date.now() - startTime;
      runner.log(`Command completed in ${duration}ms`, 'info');
      
      // Verify output contains expected messages
      AssertHelper.assertContains(output, 'Generating', 'Should show generation message');
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Performance check
      AssertHelper.assertPerformance(duration, config.timeout.medium, 'cogit auto', 'Performance check failed');
      
      // Verify commit was created
      const lastCommit = git.getLastCommit();
      AssertHelper.assert(lastCommit !== null, 'Commit should be created');
      runner.log(`Commit created: ${lastCommit}`, 'info');
      
      // Verify commit message format (Conventional Commits)
      const commitMessage = lastCommit.split('|')[1];
      AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit format check failed');
      runner.log(`Commit message format valid: "${commitMessage}"`, 'info');
      
      // Verify commit message length
      AssertHelper.assertCommitMessageLength(commitMessage, 50, 'Commit length check failed');
      
      // Verify repository is clean after commit
      AssertHelper.assert(!git.hasChanges(), 'Repository should be clean after commit');
      
      // Cleanup
      fileHelper.cleanup();
    }, 'fase1');
    
    // F1-10: Empty Repository
    await runner.runTest('F1-10', 'Empty Repository', async () => {
      runner.log('Testing empty repository behavior...', 'info');
      
      // Clean repository completely
      git.resetHard();
      git.clean();
      
      // Try to run cogit with no changes
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.short
        });
        
        // Should show "no changes" message
        AssertHelper.assertContains(output.toLowerCase(), 'no changes', 'Should show no changes message');
        runner.log('Empty repository handled correctly', 'info');
      } catch (error) {
        // Command might fail, which is acceptable
        AssertHelper.assertContains(
          error.message.toLowerCase() + (error.stdout || '').toLowerCase(), 
          'no changes', 
          'Should show no changes message'
        );
        runner.log('Empty repository handled correctly (error)', 'info');
      }
    }, 'fase1');
  }
}

module.exports = { run: BasicCommitTest.run };
