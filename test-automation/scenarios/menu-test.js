const { execSync } = require('child_process');
const path = require('path');
const AssertHelper = require('../utils/assert-helper');

class MenuTest {
    static async run(runner) {
        runner.log('Testing menu functionality...');
        
        // Test 1: Menu command exists
        await this.testMenuCommandExists(runner);
        
        // Test 2: Menu shows options
        await this.testMenuOptions(runner);
        
        // Test 3: Menu help
        await this.testMenuHelp(runner);
        
        runner.log('✓ All menu tests completed successfully');
    }
    
    static async testMenuCommandExists(runner) {
        runner.log('Testing menu command registration...');
        
        const helpOutput = execSync(`node "${runner.cogitPath}/dist/index.js" --help`, {
            cwd: runner.cogitPath,
            encoding: 'utf8'
        });
        
        AssertHelper.assertContains(helpOutput, 'menu', 'Menu command should be in help');
        AssertHelper.assertContains(helpOutput, 'Interactive menu', 'Menu description should be present');
        
        runner.log('✓ Menu command exists');
    }
    
    static async testMenuOptions(runner) {
        runner.log('Testing menu options...');
        
        // Verify menu module compiled
        const menuPath = path.join(runner.cogitPath, 'dist', 'cli', 'commands', 'menu.js');
        AssertHelper.assertFileExists(menuPath, 'Menu module should be compiled');
        
        // Load and verify exports
        const menu = require(menuPath);
        AssertHelper.assert(typeof menu.menuCommand === 'function', 'menuCommand should be exported');
        
        runner.log('✓ Menu options verified');
    }
    
    static async testMenuHelp(runner) {
        runner.log('Testing menu help...');
        
        const menuHelp = execSync(`node "${runner.cogitPath}/dist/index.js" menu --help`, {
            cwd: runner.cogitPath,
            encoding: 'utf8'
        });
        
        AssertHelper.assertContains(menuHelp, 'menu', 'Menu help should be shown');
        
        runner.log('✓ Menu help passed');
    }
    
    static async testMenuNavigation(runner) {
        runner.log('Testing menu navigation...');
        
        // This test would require interactive input, which is hard to automate
        // For now, we verify the menu module structure
        
        const menuPath = path.join(runner.cogitPath, 'dist', 'cli', 'commands', 'menu.js');
        const menuContent = require('fs').readFileSync(menuPath, 'utf8');
        
        // Verify menu has expected options
        const expectedOptions = ['auto', 'commit-options', 'status', 'settings', 'exit'];
        expectedOptions.forEach(option => {
            AssertHelper.assertContains(menuContent, option, `Menu should have ${option} option`);
        });
        
        runner.log('✓ Menu navigation structure verified');
    }
}

module.exports = MenuTest;
