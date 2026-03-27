/**
 * FASE 3 - Confirmation Test
 * Tests: F3-15 (Confirmation Code System)
 */

const path = require('path');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class ConfirmationTest {
  static async run(runner) {
    // F3-15: Confirmation Code
    await runner.runTest('F3-15', 'Confirmation Code System', async () => {
      runner.log('Testing confirmation code system...', 'info');
      
      const confirmationPath = path.join(config.distPath, 'utils', 'confirmation.js');
      AssertHelper.assertFileExists(confirmationPath, 'Confirmation module should be compiled');
      
      const confirmation = require(confirmationPath);
      
      // Verify exports
      AssertHelper.assert(typeof confirmation.generateConfirmationCode === 'function', 
        'generateConfirmationCode should be exported');
      AssertHelper.assert(typeof confirmation.validateConfirmationCode === 'function', 
        'validateConfirmationCode should be exported');
      
      // Test code generation
      const code = confirmation.generateConfirmationCode();
      AssertHelper.assert(typeof code === 'string', 'Code should be a string');
      AssertHelper.assert(code.length === config.confirmation.length, 
        `Code should be ${config.confirmation.length} characters`);
      
      // Test code validation
      AssertHelper.assert(confirmation.validateConfirmationCode(code, code), 
        'Validation should pass with correct code');
      AssertHelper.assert(!confirmation.validateConfirmationCode(code, 'WRONG'), 
        'Validation should fail with wrong code');
      
      runner.log(`Confirmation system verified (code: ${code})`, 'info');
    }, 'fase3');
  }
}

module.exports = { run: ConfirmationTest.run };
