const path = require('path');
const AssertHelper = require('../utils/assert-helper');

class UITest {
    static async run(runner) {
        runner.log('Testing UI components...');
        
        // Test 1: Renderer module
        await this.testRendererModule(runner);
        
        // Test 2: Prompts module
        await this.testPromptsModule(runner);
        
        // Test 3: Renderer functions
        await this.testRendererFunctions(runner);
        
        // Test 4: Prompts functions
        await this.testPromptsFunctions(runner);
        
        runner.log('✓ All UI tests completed successfully');
    }
    
    static async testRendererModule(runner) {
        runner.log('Testing renderer module...');
        
        const rendererPath = path.join(runner.cogitPath, 'dist', 'cli', 'ui', 'renderer.js');
        AssertHelper.assertFileExists(rendererPath, 'Renderer module should be compiled');
        
        runner.log('✓ Renderer module exists');
    }
    
    static async testPromptsModule(runner) {
        runner.log('Testing prompts module...');
        
        const promptsPath = path.join(runner.cogitPath, 'dist', 'cli', 'ui', 'prompts.js');
        AssertHelper.assertFileExists(promptsPath, 'Prompts module should be compiled');
        
        runner.log('✓ Prompts module exists');
    }
    
    static async testRendererFunctions(runner) {
        runner.log('Testing renderer functions...');
        
        const rendererPath = path.join(runner.cogitPath, 'dist', 'cli', 'ui', 'renderer.js');
        const renderer = require(rendererPath);
        
        // Verify all expected functions exist
        const expectedFunctions = [
            'renderHeader',
            'renderCommitMessage',
            'renderSuccess',
            'renderError',
            'renderWarning',
            'renderInfo',
            'renderFileList',
            'renderDiffPreview',
            'renderDryRun',
            'renderHealerAttempt'
        ];
        
        expectedFunctions.forEach(fn => {
            AssertHelper.assert(typeof renderer[fn] === 'function', `${fn} should be a function`);
        });
        
        runner.log('✓ Renderer functions verified');
    }
    
    static async testPromptsFunctions(runner) {
        runner.log('Testing prompts functions...');
        
        const promptsPath = path.join(runner.cogitPath, 'dist', 'cli', 'ui', 'prompts.js');
        const prompts = require(promptsPath);
        
        // Verify all expected functions exist
        const expectedFunctions = [
            'confirmAction',
            'selectOption',
            'inputText',
            'selectMultiple',
            'reviewCommitMessage',
            'editCommitMessage',
            'showMenu',
            'confirmPush',
            'confirmSkipCI',
            'confirmDryRun',
            'inputHint'
        ];
        
        expectedFunctions.forEach(fn => {
            AssertHelper.assert(typeof prompts[fn] === 'function', `${fn} should be a function`);
        });
        
        // Verify MenuChoice interface export
        AssertHelper.assert(prompts.MenuChoice !== undefined, 'MenuChoice should be exported');
        
        runner.log('✓ Prompts functions verified');
    }
    
    static async testUIIntegration(runner) {
        runner.log('Testing UI integration with commands...');
        
        const autoPath = path.join(runner.cogitPath, 'dist', 'cli', 'commands', 'auto.js');
        const autoContent = require('fs').readFileSync(autoPath, 'utf8');
        
        // Verify auto command uses UI modules
        AssertHelper.assertContains(autoContent, 'renderer', 'Auto should import renderer');
        AssertHelper.assertContains(autoContent, 'prompts', 'Auto should import prompts');
        AssertHelper.assertContains(autoContent, 'renderCommitMessage', 'Auto should use renderCommitMessage');
        
        runner.log('✓ UI integration verified');
    }
}

module.exports = UITest;
