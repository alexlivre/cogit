/**
 * FASE 3 - Branch Test
 * Tests: F3-01 to F3-06 (Branch operations)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class BranchTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F3-01: List Branches
    await runner.runTest('F3-01', 'List Branches', async () => {
      runner.log('Testing list branches...', 'info');
      
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      AssertHelper.assertFileExists(branchPath, 'Branch module should be compiled');
      
      const branch = require(branchPath);
      AssertHelper.assert(typeof branch.listBranches === 'function', 'listBranches should be exported');
      
      // Get current branches
      const branches = await branch.listBranches(config.testRepo);
      AssertHelper.assert(Array.isArray(branches), 'Should return array of branches');
      AssertHelper.assert(branches.length > 0, 'Should have at least one branch');
      
      runner.log(`Found ${branches.length} branches`, 'info');
    }, 'fase3');
    
    // F3-02: Create Branch
    await runner.runTest('F3-02', 'Create Branch', async () => {
      runner.log('Testing create branch...', 'info');
      
      git.resetHard();
      git.clean();
      
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      const branch = require(branchPath);
      
      const testBranchName = `test-branch-${Date.now()}`;
      
      await branch.createBranch(config.testRepo, testBranchName);
      
      // Verify branch was created
      const branches = await branch.listBranches(config.testRepo);
      const created = branches.find(b => b.includes(testBranchName));
      AssertHelper.assert(created, `Branch ${testBranchName} should be created`);
      
      // Cleanup - delete test branch
      try {
        execSync(`git branch -D ${testBranchName}`, { cwd: config.testRepo, stdio: 'pipe' });
      } catch (e) {}
      
      runner.log(`Branch ${testBranchName} created successfully`, 'info');
    }, 'fase3');
    
    // F3-03: Switch Branch
    await runner.runTest('F3-03', 'Switch Branch', async () => {
      runner.log('Testing switch branch...', 'info');
      
      git.resetHard();
      git.clean();
      
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      const branch = require(branchPath);
      
      const testBranchName = `test-switch-${Date.now()}`;
      
      // Create and switch to branch
      await branch.createBranch(config.testRepo, testBranchName);
      await branch.switchBranch(config.testRepo, testBranchName);
      
      // Verify current branch
      const currentBranch = git.getCurrentBranch();
      AssertHelper.assert(currentBranch.includes(testBranchName), `Should be on ${testBranchName}`);
      
      // Switch back to main/master
      try {
        await branch.switchBranch(config.testRepo, 'main');
      } catch (e) {
        try {
          await branch.switchBranch(config.testRepo, 'master');
        } catch (e2) {}
      }
      
      // Cleanup
      try {
        execSync(`git branch -D ${testBranchName}`, { cwd: config.testRepo, stdio: 'pipe' });
      } catch (e) {}
      
      runner.log('Branch switch successful', 'info');
    }, 'fase3');
    
    // F3-04: Delete Branch
    await runner.runTest('F3-04', 'Delete Branch', async () => {
      runner.log('Testing delete branch...', 'info');
      
      git.resetHard();
      git.clean();
      
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      const branch = require(branchPath);
      
      const testBranchName = `test-delete-${Date.now()}`;
      
      // Create branch
      await branch.createBranch(config.testRepo, testBranchName);
      
      // Verify created
      let branches = await branch.listBranches(config.testRepo);
      AssertHelper.assert(branches.some(b => b.includes(testBranchName)), 'Branch should exist');
      
      // Delete branch
      await branch.deleteBranch(config.testRepo, testBranchName);
      
      // Verify deleted
      branches = await branch.listBranches(config.testRepo);
      AssertHelper.assert(!branches.some(b => b.includes(testBranchName)), 'Branch should be deleted');
      
      runner.log('Branch delete successful', 'info');
    }, 'fase3');
    
    // F3-05: Push Branch
    await runner.runTest('F3-05', 'Push Branch', async () => {
      runner.log('Testing push branch...', 'info');
      
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      const branch = require(branchPath);
      
      AssertHelper.assert(typeof branch.pushBranch === 'function', 'pushBranch should be exported');
      
      runner.log('Push branch function verified', 'info');
    }, 'fase3');
    
    // F3-06: Branch Center
    await runner.runTest('F3-06', 'Branch Center', async () => {
      runner.log('Testing branch center...', 'info');
      
      const branchPath = path.join(config.distPath, 'services', 'git', 'branch.js');
      const branch = require(branchPath);
      
      AssertHelper.assert(typeof branch.branchCenter === 'function', 'branchCenter should be exported');
      
      runner.log('Branch center verified', 'info');
    }, 'fase3');
    
    // F3-07: --branch Flag
    await runner.runTest('F3-07', '--branch Flag', async () => {
      runner.log('Testing --branch flag...', 'info');
      
      git.resetHard();
      git.clean();
      
      const testBranchName = `test-flag-${Date.now()}`;
      
      fileHelper.createFile('test-branch-flag.txt', 'Testing --branch flag');
      
      // Run cogit with --branch flag
      const output = execSync(
        `node "${path.join(config.distPath, 'index.js')}" auto --yes --branch ${testBranchName} --no-push`,
        { cwd: config.testRepo, encoding: 'utf8', timeout: config.timeout.medium }
      );
      
      AssertHelper.assertContains(output, 'Commit', 'Should show commit message');
      
      // Verify branch was created
      const currentBranch = git.getCurrentBranch();
      AssertHelper.assert(currentBranch.includes(testBranchName), `Should be on ${testBranchName}`);
      
      // Switch back and cleanup
      try {
        execSync('git checkout main 2>/dev/null || git checkout master 2>/dev/null', 
          { cwd: config.testRepo, stdio: 'pipe' });
        execSync(`git branch -D ${testBranchName}`, { cwd: config.testRepo, stdio: 'pipe' });
      } catch (e) {}
      
      fileHelper.cleanup();
      
      runner.log('--branch flag verified', 'info');
    }, 'fase3');
  }
}

module.exports = { run: BranchTest.run };
