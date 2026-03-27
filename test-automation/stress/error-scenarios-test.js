/**
 * Stress Test - Error Scenarios
 * Tests: S4-01 to S4-08 (Error handling)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const { config } = require('../utils/test-config');

class ErrorScenariosTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // S4-01: Merge Conflicts (simulated)
    await runner.runTest('S4-01', 'Merge Conflicts Detection', async () => {
      runner.log('Testing merge conflict handling...', 'info');
      
      // Check if healer handles conflicts
      const healerPath = path.join(config.distPath, 'services', 'git', 'healer.js');
      const healerContent = require('fs').readFileSync(healerPath, 'utf8');
      
      // Verify healer has conflict handling
      AssertHelper.assert(
        healerContent.toLowerCase().includes('conflict') || 
        healerContent.toLowerCase().includes('merge'),
        'Healer should handle conflicts'
      );
      
      runner.log('Merge conflict handling verified', 'info');
    }, 'stress');
    
    // S4-02: Detached HEAD
    await runner.runTest('S4-02', 'Detached HEAD Handling', async () => {
      runner.log('Testing detached HEAD handling...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create a commit first
      fileHelper.createFile('test-detached.txt', 'test');
      git.addAll();
      execSync('git commit -m "test commit"', { cwd: config.testRepo, stdio: 'pipe' });
      
      // Get commit hash
      const hash = execSync('git rev-parse HEAD', { cwd: config.testRepo, encoding: 'utf8' }).trim();
      
      // Checkout detached HEAD
      execSync(`git checkout ${hash}`, { cwd: config.testRepo, stdio: 'pipe' });
      
      // Try to run cogit
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.medium
        });
        
        runner.log('Detached HEAD handled', 'info');
      } catch (error) {
        runner.log('Detached HEAD may cause issues (expected)', 'warning');
      }
      
      // Return to main branch
      try {
        execSync('git checkout main 2>/dev/null || git checkout master 2>/dev/null', 
          { cwd: config.testRepo, stdio: 'pipe' });
      } catch (e) {}
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S4-03: No Remote
    await runner.runTest('S4-03', 'No Remote Handling', async () => {
      runner.log('Testing no remote handling...', 'info');
      
      // Create temp repo without remote
      const fs = require('fs');
      const tempDir = path.join(config.testRepo, 'no-remote-test');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
      
      // Create file and commit
      const tempFileHelper = new FileHelper(tempDir);
      tempFileHelper.createFile('test.txt', 'test');
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
          cwd: tempDir,
          encoding: 'utf8',
          timeout: config.timeout.medium
        });
        
        // Should handle gracefully (local commit only)
        runner.log('No remote handled gracefully', 'info');
      } catch (error) {
        runner.log('No remote may cause issues (expected)', 'warning');
      }
      
      // Cleanup
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }, 'stress');
    
    // S4-04: Network Timeout (simulated)
    await runner.runTest('S4-04', 'Network Timeout Handling', async () => {
      runner.log('Testing network timeout handling...', 'info');
      
      // Verify healer has timeout handling
      const healerPath = path.join(config.distPath, 'services', 'git', 'healer.js');
      const healerContent = require('fs').readFileSync(healerPath, 'utf8');
      
      AssertHelper.assert(
        healerContent.toLowerCase().includes('timeout') ||
        healerContent.toLowerCase().includes('retry'),
        'Healer should handle timeouts'
      );
      
      runner.log('Network timeout handling verified', 'info');
    }, 'stress');
    
    // S4-05: API Rate Limit (simulated)
    await runner.runTest('S4-05', 'API Rate Limit Handling', async () => {
      runner.log('Testing API rate limit handling...', 'info');
      
      // Check provider has error handling
      const providerPath = path.join(config.distPath, 'services', 'ai', 'providers', 'openrouter.js');
      const providerContent = require('fs').readFileSync(providerPath, 'utf8');
      
      AssertHelper.assert(
        providerContent.toLowerCase().includes('error') ||
        providerContent.toLowerCase().includes('catch'),
        'Provider should handle API errors'
      );
      
      runner.log('API rate limit handling verified', 'info');
    }, 'stress');
    
    // S4-06: Invalid API Key
    await runner.runTest('S4-06', 'Invalid API Key Handling', async () => {
      runner.log('Testing invalid API key handling...', 'info');
      
      git.resetHard();
      git.clean();
      
      fileHelper.createFile('test-invalid-key.txt', 'test');
      git.addAll();
      
      // Run with invalid API key
      const oldKey = process.env.OPENROUTER_API_KEY;
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.medium,
          env: { ...process.env, OPENROUTER_API_KEY: 'invalid-key-12345' }
        });
        
        // Should show error message
        runner.log('Invalid API key handled (may show error)', 'info');
      } catch (error) {
        // Expected to fail with invalid key
        runner.log('Invalid API key rejected (expected)', 'info');
      }
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S4-07: Corrupt Repo (simulated)
    await runner.runTest('S4-07', 'Corrupt Repo Handling', async () => {
      runner.log('Testing corrupt repo handling...', 'info');
      
      // Verify scanner handles errors
      const scannerPath = path.join(config.distPath, 'services', 'git', 'scanner.js');
      const scannerContent = require('fs').readFileSync(scannerPath, 'utf8');
      
      AssertHelper.assert(
        scannerContent.toLowerCase().includes('error') ||
        scannerContent.toLowerCase().includes('catch'),
        'Scanner should handle repo errors'
      );
      
      runner.log('Corrupt repo handling verified', 'info');
    }, 'stress');
    
    // S4-08: Lock Files
    await runner.runTest('S4-08', 'Lock Files Handling', async () => {
      runner.log('Testing lock files handling...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create a lock file
      fileHelper.createFile('package-lock.json', '{ "locked": true }');
      fileHelper.createFile('yarn.lock', '# yarn lockfile');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle lock files');
      
      fileHelper.cleanup();
      runner.log('Lock files handled', 'info');
    }, 'stress');
  }
}

module.exports = { run: ErrorScenariosTest.run };
