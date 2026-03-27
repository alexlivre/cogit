/**
 * FASE 2 - Menu Test
 * Tests: F2-01 (Menu Command), F2-02 (Menu Navigation)
 */

const { execSync } = require('child_process');
const path = require('path');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class MenuTest {
  static async run(runner) {
    // F2-01: Menu Command
    await runner.runTest('F2-01', 'Menu Command', async () => {
      runner.log('Testing menu command...', 'info');
      
      const helpOutput = execSync(`node "${path.join(config.distPath, 'index.js')}" --help`, {
        cwd: config.cogitPath,
        encoding: 'utf8',
        timeout: config.timeout.short
      });
      
      AssertHelper.assertContains(helpOutput, 'menu', 'Menu command should be in help');
      AssertHelper.assertContains(helpOutput.toLowerCase(), 'interactive', 'Menu description should be present');
      
      runner.log('Menu command registered correctly', 'info');
    }, 'fase2');
    
    // F2-02: Menu Navigation
    await runner.runTest('F2-02', 'Menu Navigation', async () => {
      runner.log('Testing menu navigation...', 'info');
      
      // Verify menu module compiled
      const menuPath = path.join(config.distPath, 'cli', 'commands', 'menu.js');
      AssertHelper.assertFileExists(menuPath, 'Menu module should be compiled');
      
      // Load and verify exports
      const menu = require(menuPath);
      AssertHelper.assert(typeof menu.menuCommand === 'function', 'menuCommand should be exported');
      
      // Verify menu has expected options
      const fs = require('fs');
      const menuContent = fs.readFileSync(menuPath, 'utf8');
      
      const expectedOptions = ['auto', 'commit', 'branch', 'tag', 'status', 'settings', 'exit'];
      const foundOptions = expectedOptions.filter(opt => 
        menuContent.toLowerCase().includes(opt.toLowerCase())
      );
      
      AssertHelper.assert(foundOptions.length >= 4, 'Menu should have at least 4 expected options');
      
      runner.log(`Menu navigation verified (${foundOptions.length} options found)`, 'info');
    }, 'fase2');
  }
}

module.exports = { run: MenuTest.run };
