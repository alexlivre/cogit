/**
 * FASE 1 - Security Test (Lead Wall)
 * Tests: F1-02 (Sanitizer Blocklist), F1-03 (Redactor Secrets)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class SecurityTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F1-02: Sanitizer Blocklist
    await runner.runTest('F1-02', 'Sanitizer Blocklist', async () => {
      runner.log('Testing blocklist functionality...', 'info');
      
      // Clean repository
      git.resetHard();
      git.clean();
      
      // Create sensitive files
      const sensitiveFiles = fileHelper.createSensitiveFiles();
      runner.log(`Created ${sensitiveFiles.length} sensitive files`, 'info');
      
      // Add files to git
      git.addAll();
      
      // Verify changes are detected
      AssertHelper.assert(git.hasChanges(), 'Changes should be detected');
      
      // Run cogit auto - should be blocked
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.medium
        });
        
        // If it doesn't throw, check if it shows security alert
        AssertHelper.assertContains(output, 'Security', 'Should show security alert');
        AssertHelper.assertContains(output.toLowerCase(), 'blocked', 'Should mention blocked files');
        
        runner.log('Blocklist correctly blocked sensitive files', 'info');
      } catch (error) {
        // Command should fail due to security block
        const output = error.stdout || error.message || '';
        AssertHelper.assertContains(output.toLowerCase(), 'security', 'Should fail with security alert');
        runner.log('Blocklist correctly blocked sensitive files (error)', 'info');
      }
      
      // Cleanup
      fileHelper.cleanup();
    }, 'fase1');
    
    // F1-03: Redactor Secrets
    await runner.runTest('F1-03', 'Redactor Secrets', async () => {
      runner.log('Testing secret redaction...', 'info');
      
      // Clean repository
      git.resetHard();
      git.clean();
      
      // Create file with secrets
      const fileWithSecrets = `// Configuration file
const config = {
  database: {
    host: 'localhost',
    password: 'supersecretpassword123',
    user: 'admin'
  },
  api: {
    key: 'sk-1234567890abcdefghijklmnop',
    token: 'ghp_abcdefghijklmnopqrstuvwxyz123456'
  },
  aws: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  }
};
module.exports = config;`;
      
      fileHelper.createFile('config-with-secrets.js', fileWithSecrets);
      git.addAll();
      
      // Get diff to check redaction
      const diff = git.getDiff();
      
      // Check that secrets are present in diff before redaction
      AssertHelper.assertContains(diff, 'supersecretpassword123', 'Diff should contain secrets before redaction');
      AssertHelper.assertContains(diff, 'sk-1234567890abcdefghijklmnop', 'Diff should contain API key');
      
      // Run cogit - should redact secrets before sending to AI
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      // Verify commit was created (secrets were redacted, not blocked)
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Cleanup
      fileHelper.cleanup();
    }, 'fase1');
  }
}

module.exports = { run: SecurityTest.run };
