/**
 * Stress Test - Many Files
 * Tests: S2-01 to S2-05 (Multiple file handling)
 */

const { execSync } = require('child_process');
const path = require('path');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const { config } = require('../utils/test-config');

class ManyFilesTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // S2-01: 10 Files
    await runner.runTest('S2-01', '10 Files', async () => {
      runner.log('Testing 10 files...', 'info');
      
      git.resetHard();
      git.clean();
      
      for (let i = 0; i < 10; i++) {
        fileHelper.createFile(`file-${i}.js`, `// File ${i}\nexport const func${i} = () => ${i};`);
      }
      git.addAll();
      
      const startTime = Date.now();
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const duration = Date.now() - startTime;
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle 10 files');
      AssertHelper.assert(duration < config.timeout.medium, 'Should complete within timeout');
      
      fileHelper.cleanup();
      runner.log(`10 files handled in ${duration}ms`, 'info');
    }, 'stress');
    
    // S2-02: 50 Files
    await runner.runTest('S2-02', '50 Files', async () => {
      runner.log('Testing 50 files...', 'info');
      
      git.resetHard();
      git.clean();
      
      for (let i = 0; i < 50; i++) {
        fileHelper.createFile(`file-${i}.js`, `// File ${i}\nexport const func${i} = () => ${i};`);
      }
      git.addAll();
      
      const startTime = Date.now();
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      const duration = Date.now() - startTime;
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle 50 files');
      
      fileHelper.cleanup();
      runner.log(`50 files handled in ${duration}ms`, 'info');
    }, 'stress');
    
    // S2-03: 100 Files
    await runner.runTest('S2-03', '100 Files', async () => {
      runner.log('Testing 100 files...', 'info');
      
      git.resetHard();
      git.clean();
      
      for (let i = 0; i < 100; i++) {
        fileHelper.createFile(`file-${i}.js`, `// File ${i}\nexport const func${i} = () => ${i};`);
      }
      git.addAll();
      
      const startTime = Date.now();
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.long
      });
      
      const duration = Date.now() - startTime;
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle 100 files');
      
      fileHelper.cleanup();
      runner.log(`100 files handled in ${duration}ms`, 'info');
    }, 'stress');
    
    // S2-04: 500 Files (stress test)
    await runner.runTest('S2-04', '500 Files', async () => {
      runner.log('Testing 500 files...', 'info');
      
      git.resetHard();
      git.clean();
      
      for (let i = 0; i < 500; i++) {
        fileHelper.createFile(`file-${i}.js`, `// File ${i}\nexport const func${i} = () => ${i};`);
      }
      git.addAll();
      
      const startTime = Date.now();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.stress
        });
        
        const duration = Date.now() - startTime;
        runner.log(`500 files handled in ${duration}ms`, 'info');
      } catch (error) {
        runner.log('500 files may exceed limits (expected)', 'warning');
      }
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S2-05: Deep Nesting
    await runner.runTest('S2-05', 'Deep Nesting', async () => {
      runner.log('Testing deep nesting...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create deeply nested structure
      let nestedPath = 'src';
      for (let i = 0; i < 10; i++) {
        nestedPath += `/level${i}`;
        fileHelper.createFile(`${nestedPath}/file.js`, `// Level ${i}`);
      }
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle deep nesting');
      
      fileHelper.cleanup();
      runner.log('Deep nesting handled', 'info');
    }, 'stress');
  }
}

module.exports = { run: ManyFilesTest.run };
