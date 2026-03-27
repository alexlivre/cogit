/**
 * FASE 3 - Tag Test
 * Tests: F3-08 to F3-14 (Tag operations)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class TagTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F3-08: List Tags
    await runner.runTest('F3-08', 'List Tags', async () => {
      runner.log('Testing list tags...', 'info');
      
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      AssertHelper.assertFileExists(tagPath, 'Tag module should be compiled');
      
      const tag = require(tagPath);
      AssertHelper.assert(typeof tag.listTags === 'function', 'listTags should be exported');
      
      const tags = await tag.listTags(config.testRepo);
      AssertHelper.assert(Array.isArray(tags), 'Should return array of tags');
      
      runner.log(`Tag module verified`, 'info');
    }, 'fase3');
    
    // F3-09: Create Tag (Annotated)
    await runner.runTest('F3-09', 'Create Tag (Annotated)', async () => {
      runner.log('Testing create annotated tag...', 'info');
      
      git.resetHard();
      git.clean();
      
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      
      const testTagName = `v-test-${Date.now()}`;
      
      await tag.createTag(config.testRepo, testTagName, 'Test tag message');
      
      // Verify tag was created
      const tags = await tag.listTags(config.testRepo);
      AssertHelper.assert(tags.some(t => t.includes(testTagName)), `Tag ${testTagName} should be created`);
      
      // Cleanup
      try {
        execSync(`git tag -d ${testTagName}`, { cwd: config.testRepo, stdio: 'pipe' });
      } catch (e) {}
      
      runner.log(`Annotated tag created successfully`, 'info');
    }, 'fase3');
    
    // F3-10: Create Lightweight Tag
    await runner.runTest('F3-10', 'Create Lightweight Tag', async () => {
      runner.log('Testing create lightweight tag...', 'info');
      
      git.resetHard();
      git.clean();
      
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      
      const testTagName = `lightweight-${Date.now()}`;
      
      // Create lightweight tag (no message)
      await tag.createTag(config.testRepo, testTagName);
      
      // Verify tag was created
      const tags = await tag.listTags(config.testRepo);
      AssertHelper.assert(tags.some(t => t.includes(testTagName)), `Tag ${testTagName} should be created`);
      
      // Cleanup
      try {
        execSync(`git tag -d ${testTagName}`, { cwd: config.testRepo, stdio: 'pipe' });
      } catch (e) {}
      
      runner.log('Lightweight tag created successfully', 'info');
    }, 'fase3');
    
    // F3-11: Delete Tag Local
    await runner.runTest('F3-11', 'Delete Tag Local', async () => {
      runner.log('Testing delete local tag...', 'info');
      
      git.resetHard();
      git.clean();
      
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      
      const testTagName = `delete-test-${Date.now()}`;
      
      // Create tag
      await tag.createTag(config.testRepo, testTagName);
      
      // Verify created
      let tags = await tag.listTags(config.testRepo);
      AssertHelper.assert(tags.some(t => t.includes(testTagName)), 'Tag should exist');
      
      // Delete tag
      await tag.deleteTag(config.testRepo, testTagName);
      
      // Verify deleted
      tags = await tag.listTags(config.testRepo);
      AssertHelper.assert(!tags.some(t => t.includes(testTagName)), 'Tag should be deleted');
      
      runner.log('Local tag deleted successfully', 'info');
    }, 'fase3');
    
    // F3-12: Delete Tag Remote
    await runner.runTest('F3-12', 'Delete Tag Remote', async () => {
      runner.log('Testing delete remote tag...', 'info');
      
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      
      // Verify function exists
      AssertHelper.assert(typeof tag.deleteRemoteTag === 'function', 'deleteRemoteTag should be exported');
      
      runner.log('Delete remote tag function verified', 'info');
    }, 'fase3');
    
    // F3-13: Push Tag
    await runner.runTest('F3-13', 'Push Tag', async () => {
      runner.log('Testing push tag...', 'info');
      
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      
      AssertHelper.assert(typeof tag.pushTag === 'function', 'pushTag should be exported');
      
      runner.log('Push tag function verified', 'info');
    }, 'fase3');
    
    // F3-14: Reset to Tag
    await runner.runTest('F3-14', 'Reset to Tag', async () => {
      runner.log('Testing reset to tag...', 'info');
      
      git.resetHard();
      git.clean();
      
      const tagPath = path.join(config.distPath, 'services', 'git', 'tag.js');
      const tag = require(tagPath);
      
      AssertHelper.assert(typeof tag.resetToTag === 'function', 'resetToTag should be exported');
      
      runner.log('Reset to tag function verified', 'info');
    }, 'fase3');
  }
}

module.exports = { run: TagTest.run };
