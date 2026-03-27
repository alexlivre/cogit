/**
 * CI Test Suite - Continuous Integration (15 minutes)
 * Tests for automated CI/CD pipelines
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const { config } = require('../utils/test-config');

class CITest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    console.log('\n🔄 CI TEST SUITE (15 minutes)');
    console.log('Automated validation for CI/CD\n');
    
    // FASE 1 Tests (5 tests)
    await runner.runTest('F1-01', 'Basic Commit Flow', async () => {
      git.resetHard();
      git.clean();
      fileHelper.createCodeFiles();
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should create commit');
      fileHelper.cleanup();
    }, 'fase1');
    
    await runner.runTest('F1-02', 'Sanitizer Blocklist', async () => {
      git.resetHard();
      git.clean();
      fileHelper.createSensitiveFiles();
      git.addAll();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.medium
        });
        AssertHelper.assertContains(output.toLowerCase(), 'security', 'Should block');
      } catch (e) {
        AssertHelper.assertContains((e.stdout || '') + e.message, 'security', 'Should block');
      }
      fileHelper.cleanup();
    }, 'fase1');
    
    await runner.runTest('F1-03', 'Redactor Secrets', async () => {
      git.resetHard();
      git.clean();
      fileHelper.createFile('config.js', 'const API_KEY = "sk-test123";');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle secrets');
      fileHelper.cleanup();
    }, 'fase1');
    
    await runner.runTest('F1-07', 'OpenRouter Provider', async () => {
      if (!config.ai.apiKey) {
        throw new Error('OPENROUTER_API_KEY not set');
      }
      
      git.resetHard();
      git.clean();
      fileHelper.createFile('test.txt', 'provider test');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should work with provider');
      fileHelper.cleanup();
    }, 'fase1');
    
    await runner.runTest('F1-08', 'Conventional Commits', async () => {
      git.resetHard();
      git.clean();
      fileHelper.createFile('feature.js', 'export const x = 1;');
      git.addAll();
      
      execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const lastCommit = git.getLastCommit();
      const message = lastCommit.split('|')[1];
      AssertHelper.assertConventionalCommitFormat(message, 'Should follow Conventional Commits');
      fileHelper.cleanup();
    }, 'fase1');
    
    // FASE 2 Tests (5 tests)
    await runner.runTest('F2-01', 'Menu Command', async () => {
      const help = execSync(`node "${path.join(config.distPath, 'index.js')}" --help`, {
        encoding: 'utf8',
        timeout: config.timeout.short
      });
      AssertHelper.assertContains(help, 'menu', 'Menu should be registered');
    }, 'fase2');
    
    await runner.runTest('F2-03', '--yes Flag', async () => {
      git.resetHard();
      git.clean();
      fileHelper.createFile('test.txt', 'yes flag');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertNotContains(output, 'What would you', 'Should skip prompts');
      fileHelper.cleanup();
    }, 'fase2');
    
    await runner.runTest('F2-05', '--dry-run Flag', async () => {
      git.resetHard();
      git.clean();
      fileHelper.createFile('test.txt', 'dry run');
      git.addAll();
      
      const before = git.getLastCommit();
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --dry-run`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const after = git.getLastCommit();
      AssertHelper.assertEquals(before, after, 'Should not create commit in dry-run');
      fileHelper.cleanup();
    }, 'fase2');
    
    await runner.runTest('F2-09', 'Git Healer', async () => {
      const healerPath = path.join(config.distPath, 'services', 'git', 'healer.js');
      AssertHelper.assertFileExists(healerPath, 'Healer should exist');
      
      const healer = require(healerPath);
      AssertHelper.assert(typeof healer.healGitError === 'function', 'healGitError should exist');
    }, 'fase2');
    
    await runner.runTest('F2-07', '-m Flag', async () => {
      git.resetHard();
      git.clean();
      fileHelper.createFile('test.txt', 'message hint');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes -m "fix bug" --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should create commit with hint');
      fileHelper.cleanup();
    }, 'fase2');
    
    // FASE 3 Tests (5 tests)
    await runner.runTest('F3-01', 'List Branches', async () => {
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      const branch = require(branchPath);
      AssertHelper.assert(typeof branch.listBranches === 'function', 'listBranches should exist');
    }, 'fase3');
    
    await runner.runTest('F3-02', 'Create Branch', async () => {
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      const branch = require(branchPath);
      AssertHelper.assert(typeof branch.createBranch === 'function', 'createBranch should exist');
    }, 'fase3');
    
    await runner.runTest('F3-08', 'List Tags', async () => {
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      AssertHelper.assert(typeof tag.listTags === 'function', 'listTags should exist');
    }, 'fase3');
    
    await runner.runTest('F3-09', 'Create Tag', async () => {
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      AssertHelper.assert(typeof tag.createTag === 'function', 'createTag should exist');
    }, 'fase3');
    
    await runner.runTest('F3-15', 'Confirmation Code', async () => {
      const confPath = path.join(config.distPath, 'utils', 'confirmation.js');
      const conf = require(confPath);
      AssertHelper.assert(typeof conf.generateConfirmationCode === 'function', 'generateConfirmationCode should exist');
      AssertHelper.assert(typeof conf.validateConfirmationCode === 'function', 'validateConfirmationCode should exist');
    }, 'fase3');
    
    console.log('\n✅ CI test completed');
  }
}

module.exports = { run: CITest.run };
