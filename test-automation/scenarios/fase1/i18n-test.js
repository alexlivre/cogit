/**
 * FASE 1 - Internationalization Test
 * Tests: F1-04 (English), F1-05 (Portuguese), F1-06 (Mixed)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class I18nTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F1-04: English Language
    await runner.runTest('F1-04', 'i18n English', async () => {
      runner.log('Testing English language...', 'info');
      
      git.resetHard();
      git.clean();
      
      fileHelper.createFile('test-en.txt', 'Testing in English');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium,
        env: { ...process.env, LANGUAGE: 'en', COMMIT_LANGUAGE: 'en' }
      });
      
      AssertHelper.assertContains(output.toLowerCase(), 'generating', 'Should show "generating" in English');
      AssertHelper.assertContains(output.toLowerCase(), 'commit', 'Should show commit message');
      
      const lastCommit = git.getLastCommit();
      AssertHelper.assert(lastCommit !== null, 'Commit should be created');
      
      fileHelper.cleanup();
    }, 'fase1');
    
    // F1-05: Portuguese Language
    await runner.runTest('F1-05', 'i18n Portuguese', async () => {
      runner.log('Testing Portuguese language...', 'info');
      
      git.resetHard();
      git.clean();
      
      fileHelper.createFile('test-pt.txt', 'Testando em português');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium,
        env: { ...process.env, LANGUAGE: 'pt', COMMIT_LANGUAGE: 'pt' }
      });
      
      AssertHelper.assertContains(output.toLowerCase(), 'gerando', 'Should show "gerando" in Portuguese');
      
      const lastCommit = git.getLastCommit();
      AssertHelper.assert(lastCommit !== null, 'Commit should be created');
      
      fileHelper.cleanup();
    }, 'fase1');
    
    // F1-06: Mixed Language
    await runner.runTest('F1-06', 'i18n Mixed (PT interface, EN commits)', async () => {
      runner.log('Testing mixed language settings...', 'info');
      
      git.resetHard();
      git.clean();
      
      fileHelper.createFile('test-mixed.txt', 'Testing mixed language');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium,
        env: { ...process.env, LANGUAGE: 'pt', COMMIT_LANGUAGE: 'en' }
      });
      
      // Interface should be in Portuguese
      AssertHelper.assertContains(output.toLowerCase(), 'gerando', 'Interface should be in Portuguese');
      
      // Commit message should follow Conventional Commits (English)
      const lastCommit = git.getLastCommit();
      const commitMessage = lastCommit.split('|')[1];
      AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit should follow Conventional Commits');
      
      fileHelper.cleanup();
    }, 'fase1');
  }
}

module.exports = { run: I18nTest.run };
