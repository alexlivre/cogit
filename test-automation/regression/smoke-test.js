/**
 * Smoke Test Suite - Quick validation (5 minutes)
 * Essential tests for basic functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const { config } = require('../utils/test-config');

class SmokeTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    const smokeTests = [
      'F1-01: Basic Commit Flow',
      'F1-02: Sanitizer Blocklist',
      'F2-03: --yes Flag',
      'F3-01: List Branches',
      'F3-08: List Tags'
    ];
    
    console.log('\n🚀 SMOKE TEST SUITE (5 minutes)');
    console.log('Essential functionality validation\n');
    
    // F1-01: Basic Commit Flow
    await runner.runTest('F1-01', 'Basic Commit Flow', async () => {
      // Reset repository
      execSync('git reset --hard HEAD', { cwd: config.testRepo, stdio: 'pipe' });
      execSync('git clean -fd', { cwd: config.testRepo, stdio: 'pipe' });
      
      // Create test file directly
      const testFilePath = path.join(config.testRepo, 'smoke-test-' + Date.now() + '.txt');
      fs.writeFileSync(testFilePath, 'Smoke test file');
      
      // Stage file
      execSync('git add -A', { cwd: config.testRepo, stdio: 'pipe' });
      
      // Verify file is staged
      const status = execSync('git status --porcelain', { cwd: config.testRepo, encoding: 'utf8' });
      AssertHelper.assert(status.trim().length > 0, 'Files should be staged');
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should create commit');
      
      // Cleanup
      try { fs.unlinkSync(testFilePath); } catch (e) {}
    }, 'fase1');
    
    // F1-02: Sanitizer Blocklist
    await runner.runTest('F1-02', 'Sanitizer Blocklist', async () => {
      git.resetHard();
      git.clean();
      
      fileHelper.createFile('.env.local', 'SECRET=123');
      git.addAll();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.medium
        });
        
        AssertHelper.assertContains(output.toLowerCase(), 'security', 'Should block sensitive files');
      } catch (error) {
        // Command fails with exit code 1, but output contains security alert
        const output = (error.stdout || '') + (error.stderr || '') + error.message;
        AssertHelper.assertContains(
          output.toLowerCase(), 
          'security', 
          'Should block sensitive files'
        );
      }
      
      fileHelper.cleanup();
    }, 'fase1');
    
    // F2-03: --yes Flag
    await runner.runTest('F2-03', '--yes Flag', async () => {
      // Reset and create test file
      execSync('git reset --hard HEAD', { cwd: config.testRepo, stdio: 'pipe' });
      execSync('git clean -fd', { cwd: config.testRepo, stdio: 'pipe' });
      
      const testFilePath = path.join(config.testRepo, 'yes-test-' + Date.now() + '.txt');
      fs.writeFileSync(testFilePath, 'Yes flag test');
      execSync('git add -A', { cwd: config.testRepo, stdio: 'pipe' });
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertNotContains(output, 'What would you like to do', 'Should skip prompts');
      AssertHelper.assertContains(output, 'Commit', 'Should create commit');
      
      try { fs.unlinkSync(testFilePath); } catch (e) {}
    }, 'fase2');
    
    // F3-01: List Branches
    await runner.runTest('F3-01', 'List Branches', async () => {
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      AssertHelper.assertFileExists(branchPath, 'Branch module should exist');
      
      const branch = require(branchPath);
      AssertHelper.assert(typeof branch.listBranches === 'function', 'listBranches should exist');
    }, 'fase3');
    
    // F3-08: List Tags
    await runner.runTest('F3-08', 'List Tags', async () => {
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      AssertHelper.assertFileExists(tagPath, 'Tag module should exist');
      
      const tag = require(tagPath);
      AssertHelper.assert(typeof tag.listTags === 'function', 'listTags should exist');
    }, 'fase3');
    
    console.log('\n✅ Smoke test completed');
  }
}

module.exports = { run: SmokeTest.run };
