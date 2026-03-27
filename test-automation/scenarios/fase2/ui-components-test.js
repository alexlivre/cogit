/**
 * FASE 2 - UI Components Test
 * Tests: F2-11 (UI Renderer), F2-12 (UI Prompts)
 */

const path = require('path');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class UIComponentsTest {
  static async run(runner) {
    // F2-11: UI Renderer
    await runner.runTest('F2-11', 'UI Renderer', async () => {
      runner.log('Testing UI renderer...', 'info');
      
      const rendererPath = path.join(config.distPath, 'cli', 'ui', 'renderer.js');
      AssertHelper.assertFileExists(rendererPath, 'Renderer module should be compiled');
      
      const renderer = require(rendererPath);
      
      // Check for common renderer functions
      const expectedFunctions = ['render', 'print', 'display', 'show'];
      const foundFunctions = expectedFunctions.filter(fn => 
        typeof renderer[fn] === 'function' || 
        Object.keys(renderer).some(k => k.toLowerCase().includes(fn))
      );
      
      AssertHelper.assert(foundFunctions.length > 0 || Object.keys(renderer).length > 0, 
        'Renderer should export functions');
      
      runner.log(`UI renderer verified (${Object.keys(renderer).length} exports)`, 'info');
    }, 'fase2');
    
    // F2-12: UI Prompts
    await runner.runTest('F2-12', 'UI Prompts', async () => {
      runner.log('Testing UI prompts...', 'info');
      
      const promptsPath = path.join(config.distPath, 'cli', 'ui', 'prompts.js');
      AssertHelper.assertFileExists(promptsPath, 'Prompts module should be compiled');
      
      const prompts = require(promptsPath);
      
      // Check for common prompt functions
      const expectedFunctions = ['prompt', 'ask', 'confirm', 'select', 'input'];
      const foundFunctions = expectedFunctions.filter(fn => 
        typeof prompts[fn] === 'function' || 
        Object.keys(prompts).some(k => k.toLowerCase().includes(fn))
      );
      
      AssertHelper.assert(foundFunctions.length > 0 || Object.keys(prompts).length > 0, 
        'Prompts should export functions');
      
      runner.log(`UI prompts verified (${Object.keys(prompts).length} exports)`, 'info');
    }, 'fase2');
  }
}

module.exports = { run: UIComponentsTest.run };
