/**
 * FASE 1 - Commit Format Test
 * Tests: F1-08 (Conventional Commits), F1-09 (Message Length)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../../utils/git-helper');
const FileHelper = require('../../utils/file-helper');
const AssertHelper = require('../../utils/assert-helper');
const { config } = require('../../utils/test-config');

class CommitFormatTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // F1-08: Conventional Commits Format
    await runner.runTest('F1-08', 'Conventional Commits Format', async () => {
      runner.log('Testing commit message format...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create files that should generate different commit types
      fileHelper.createFile('src/feature.js', 'export const newFeature = () => {};');
      fileHelper.createFile('src/bugfix.js', '// Fixed bug in authentication');
      fileHelper.createFile('docs/README.md', '# Documentation update');
      
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const lastCommit = git.getLastCommit();
      const commitMessage = lastCommit.split('|')[1];
      
      // Verify format: type: description
      AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit should follow Conventional Commits');
      
      // Verify type is one of the allowed types
      const commitType = commitMessage.split(':')[0].trim();
      const validTypes = config.commitTypes;
      AssertHelper.assert(
        validTypes.includes(commitType),
        `Commit type "${commitType}" should be one of: ${validTypes.join(', ')}`
      );
      
      runner.log(`Commit format valid: "${commitMessage}"`, 'info');
      
      fileHelper.cleanup();
    }, 'fase1');
    
    // F1-09: Commit Message Length
    await runner.runTest('F1-09', 'Commit Message Length', async () => {
      runner.log('Testing commit message length...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create file with long description
      fileHelper.createFile('test-length.txt', 'Testing commit message length limit');
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const lastCommit = git.getLastCommit();
      const commitMessage = lastCommit.split('|')[1];
      
      // Title should be <= 50 characters
      const title = commitMessage.split('\n')[0];
      AssertHelper.assertCommitMessageLength(title, 50, 'Commit title should be <= 50 chars');
      
      runner.log(`Commit length valid: "${title}" (${title.length} chars)`, 'info');
      
      fileHelper.cleanup();
    }, 'fase1');
  }
}

module.exports = { run: CommitFormatTest.run };
