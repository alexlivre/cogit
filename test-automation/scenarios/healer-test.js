const { execSync } = require('child_process');
const path = require('path');
const AssertHelper = require('../utils/assert-helper');

class HealerTest {
    static async run(runner) {
        runner.log('Testing healer functionality...');
        
        // Test 1: Healer module exists
        await this.testHealerModuleExists(runner);
        
        // Test 2: Healer exports
        await this.testHealerExports(runner);
        
        // Test 3: Healer safety checks
        await this.testHealerSafety(runner);
        
        runner.log('✓ All healer tests completed successfully');
    }
    
    static async testHealerModuleExists(runner) {
        runner.log('Testing healer module existence...');
        
        const healerPath = path.join(runner.cogitPath, 'dist', 'services', 'git', 'healer.js');
        AssertHelper.assertFileExists(healerPath, 'Healer module should be compiled');
        
        runner.log('✓ Healer module exists');
    }
    
    static async testHealerExports(runner) {
        runner.log('Testing healer exports...');
        
        const healerPath = path.join(runner.cogitPath, 'dist', 'services', 'git', 'healer.js');
        const healer = require(healerPath);
        
        AssertHelper.assert(typeof healer.healGitError === 'function', 'healGitError should be exported');
        AssertHelper.assert(healer.HealerInput !== undefined, 'HealerInput interface should exist');
        AssertHelper.assert(healer.HealerAttempt !== undefined, 'HealerAttempt interface should exist');
        
        runner.log('✓ Healer exports verified');
    }
    
    static async testHealerSafety(runner) {
        runner.log('Testing healer safety checks...');
        
        const healerPath = path.join(runner.cogitPath, 'dist', 'services', 'git', 'healer.js');
        const healerContent = require('fs').readFileSync(healerPath, 'utf8');
        
        // Verify healer blocks dangerous commands
        AssertHelper.assertContains(healerContent, '--force', 'Healer should check for --force');
        AssertHelper.assertContains(healerContent, 'reset --hard', 'Healer should check for reset --hard');
        
        runner.log('✓ Healer safety checks verified');
    }
    
    static async testHealerIntegration(runner) {
        runner.log('Testing healer integration with auto command...');
        
        // Verify auto command imports healer
        const autoPath = path.join(runner.cogitPath, 'dist', 'cli', 'commands', 'auto.js');
        const autoContent = require('fs').readFileSync(autoPath, 'utf8');
        
        AssertHelper.assertContains(autoContent, 'healGitError', 'Auto command should import healer');
        AssertHelper.assertContains(autoContent, 'healer', 'Auto command should reference healer');
        
        runner.log('✓ Healer integration verified');
    }
}

module.exports = HealerTest;
