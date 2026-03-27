/**
 * FASE 1 - AI Provider Test
 * Tests: F1-07 (OpenRouter Provider)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class ProviderTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F1-07: OpenRouter Provider
    await runner.runTest('F1-07', 'OpenRouter Provider', async () => {
      runner.log('Testing OpenRouter provider connectivity...', 'info');
      
      // Check if API key is set
      if (!config.ai.apiKey) {
        throw new Error('OPENROUTER_API_KEY not set. Cannot test provider.');
      }
      
      git.resetHard();
      git.clean();
      
      fileHelper.createFile('test-provider.txt', 'Testing OpenRouter provider');
      git.addAll();
      
      const startTime = Date.now();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const duration = Date.now() - startTime;
      
      // Should show AI generation
      AssertHelper.assertContains(output.toLowerCase(), 'generating', 'Should show AI generation');
      
      // Should complete within timeout
      AssertHelper.assert(duration < config.timeout.medium, `Should complete within ${config.timeout.medium}ms`);
      
      // Verify commit was created
      const lastCommit = git.getLastCommit();
      AssertHelper.assert(lastCommit !== null, 'Commit should be created with AI');
      
      runner.log(`OpenRouter provider working (${duration}ms)`, 'info');
      
      fileHelper.cleanup();
    }, 'fase1');
  }
}

module.exports = { run: ProviderTest.run };
