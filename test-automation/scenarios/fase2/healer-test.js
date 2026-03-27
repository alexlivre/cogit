/**
 * FASE 2 - Git Healer Test
 * Tests: F2-09 (Healer), F2-10 (Healer Retry)
 */

const path = require('path');
const fs = require('fs');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class HealerTest {
  static async run(runner) {
    // F2-09: Git Healer
    await runner.runTest('F2-09', 'Git Healer', async () => {
      runner.log('Testing healer functionality...', 'info');
      
      const healerPath = path.join(config.distPath, 'services', 'git', 'healer.js');
      AssertHelper.assertFileExists(healerPath, 'Healer module should be compiled');
      
      const healer = require(healerPath);
      AssertHelper.assert(typeof healer.healGitError === 'function', 'healGitError should be exported');
      
      runner.log('Healer module verified', 'info');
    }, 'fase2');
    
    // F2-10: Healer Retry
    await runner.runTest('F2-10', 'Healer Retry & Safety', async () => {
      runner.log('Testing healer retry and safety...', 'info');
      
      const healerPath = path.join(config.distPath, 'services', 'git', 'healer.js');
      const healerContent = fs.readFileSync(healerPath, 'utf8');
      
      // Verify healer blocks dangerous commands
      AssertHelper.assertContains(healerContent, '--force', 'Healer should check for --force');
      AssertHelper.assertContains(healerContent, 'reset', 'Healer should check for reset');
      
      // Verify healer has retry logic
      AssertHelper.assertContains(healerContent.toLowerCase(), 'retry', 'Healer should have retry logic');
      
      // Verify healer is integrated in auto command
      const autoPath = path.join(config.distPath, 'cli', 'commands', 'auto.js');
      const autoContent = fs.readFileSync(autoPath, 'utf8');
      AssertHelper.assertContains(autoContent, 'healGitError', 'Auto command should import healer');
      
      runner.log('Healer retry and safety verified', 'info');
    }, 'fase2');
  }
}

module.exports = { run: HealerTest.run };
