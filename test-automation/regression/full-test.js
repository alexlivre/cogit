/**
 * Full Regression Test Suite - Complete validation (30 minutes)
 * All tests for release validation
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const { config } = require('../utils/test-config');

class FullTest {
  static async run(runner) {
    console.log('\n📋 FULL REGRESSION TEST SUITE (30 minutes)');
    console.log('Complete validation for releases\n');
    
    // Import all test modules
    const BasicCommitTest = require('../scenarios/fase1/basic-commit-test');
    const SecurityTest = require('../scenarios/fase1/security-test');
    const I18nTest = require('../scenarios/fase1/i18n-test');
    const ProviderTest = require('../scenarios/fase1/provider-test');
    const CommitFormatTest = require('../scenarios/fase1/commit-format-test');
    
    const MenuTest = require('../scenarios/fase2/menu-test');
    const FlagsTest = require('../scenarios/fase2/flags-test');
    const HealerTest = require('../scenarios/fase2/healer-test');
    const UIComponentsTest = require('../scenarios/fase2/ui-components-test');
    
    const BranchTest = require('../scenarios/fase3/branch-test');
    const TagTest = require('../scenarios/fase3/tag-test');
    const ConfirmationTest = require('../scenarios/fase3/confirmation-test');
    const CheckAITest = require('../scenarios/fase3/check-ai-test');
    
    // Run FASE 1 tests
    console.log('\n📦 FASE 1 Tests...');
    await BasicCommitTest.run(runner);
    await SecurityTest.run(runner);
    await I18nTest.run(runner);
    await ProviderTest.run(runner);
    await CommitFormatTest.run(runner);
    
    // Run FASE 2 tests
    console.log('\n📦 FASE 2 Tests...');
    await MenuTest.run(runner);
    await FlagsTest.run(runner);
    await HealerTest.run(runner);
    await UIComponentsTest.run(runner);
    
    // Run FASE 3 tests
    console.log('\n📦 FASE 3 Tests...');
    await BranchTest.run(runner);
    await TagTest.run(runner);
    await ConfirmationTest.run(runner);
    await CheckAITest.run(runner);
    
    console.log('\n✅ Full regression test completed');
  }
}

module.exports = { run: FullTest.run };
