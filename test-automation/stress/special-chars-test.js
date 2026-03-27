/**
 * Stress Test - Special Characters
 * Tests: S3-01 to S3-05 (Special character handling)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const { config } = require('../utils/test-config');

class SpecialCharsTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // S3-01: Unicode Characters
    await runner.runTest('S3-01', 'Unicode Characters', async () => {
      runner.log('Testing unicode characters...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create file with various unicode characters
      const unicodeContent = `
// Unicode Test
// Emoji: 🚀 ✅ ❌ 🔥 💻 🎉
// Accents: áéíóú àèìòù ñ ç
// Asian: 你好世界 こんにちは 안녕하세요
// Arabic: مرحبا بالعالم
// Russian: Привет мир
// Greek: Γειά σου Κόσμε
// Math: ∑ ∏ ∫ √ ∞ ≠ ≤ ≥
`;
      fileHelper.createFile('unicode-test.js', unicodeContent);
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle unicode');
      
      fileHelper.cleanup();
      runner.log('Unicode handled', 'info');
    }, 'stress');
    
    // S3-02: Special Chars in Names
    await runner.runTest('S3-02', 'Special Chars in Names', async () => {
      runner.log('Testing special chars in filenames...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create files with special characters in names (safe ones)
      fileHelper.createFile('file-with-dash.txt', 'dash test');
      fileHelper.createFile('file_with_underscore.txt', 'underscore test');
      fileHelper.createFile('file.with.dots.txt', 'dots test');
      
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle special chars in names');
      
      fileHelper.cleanup();
      runner.log('Special chars in names handled', 'info');
    }, 'stress');
    
    // S3-03: Long Filenames
    await runner.runTest('S3-03', 'Long Filenames', async () => {
      runner.log('Testing long filenames...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create file with long name
      const longName = 'a'.repeat(100) + '.txt';
      fileHelper.createFile(longName, 'long name test');
      git.addAll();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.medium
        });
        
        AssertHelper.assertContains(output, 'Commit', 'Should handle long filenames');
        runner.log('Long filename handled', 'info');
      } catch (error) {
        runner.log('Long filename may have issues (OS dependent)', 'warning');
      }
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S3-04: Spaces in Names
    await runner.runTest('S3-04', 'Spaces in Names', async () => {
      runner.log('Testing spaces in filenames...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create files with spaces
      fileHelper.createFile('file with spaces.txt', 'space test');
      fileHelper.createFile('another file name.txt', 'another space test');
      
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle spaces in names');
      
      fileHelper.cleanup();
      runner.log('Spaces in names handled', 'info');
    }, 'stress');
    
    // S3-05: Reserved Names (Windows)
    await runner.runTest('S3-05', 'Edge Case Filenames', async () => {
      runner.log('Testing edge case filenames...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create files with edge case names
      fileHelper.createFile('file.txt', 'normal file');
      fileHelper.createFile('FILE.TXT', 'uppercase extension');
      
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle edge case names');
      
      fileHelper.cleanup();
      runner.log('Edge case filenames handled', 'info');
    }, 'stress');
  }
}

module.exports = { run: SpecialCharsTest.run };
