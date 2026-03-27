/**
 * FASE 3 - Check AI Test
 * Tests: Check AI command functionality
 */

const { execSync } = require('child_process');
const path = require('path');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class CheckAITest {
  static async run(runner) {
    // Check AI Command
    await runner.runTest('F3-16', 'Check AI Command', async () => {
      runner.log('Testing check-ai command...', 'info');
      
      const checkAIPath = path.join(config.distPath, 'cli', 'commands', 'check-ai.js');
      AssertHelper.assertFileExists(checkAIPath, 'check-ai module should be compiled');
      
      const checkAI = require(checkAIPath);
      AssertHelper.assert(typeof checkAI.checkAICommand === 'function', 
        'checkAICommand should be exported');
      
      runner.log('Check AI command verified', 'info');
    }, 'fase3');
    
    // Check AI Command Registration
    await runner.runTest('F3-17', 'Check AI Command Registration', async () => {
      runner.log('Testing check-ai command registration...', 'info');
      
      const helpOutput = execSync(`node "${path.join(config.distPath, 'index.js')}" --help`, {
        cwd: config.cogitPath,
        encoding: 'utf8',
        timeout: config.timeout.short
      });
      
      AssertHelper.assertContains(helpOutput.toLowerCase(), 'check', 'check-ai should be in help');
      
      runner.log('Check AI command registered', 'info');
    }, 'fase3');
  }
}

module.exports = { run: CheckAITest.run };
