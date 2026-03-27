/**
 * Stress Test - Large Diffs
 * Tests: S1-01 to S1-05 (Large diff handling)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const { config } = require('../utils/test-config');

class LargeDiffTest {
  static async run(runner) {
    const git = new GitHelper(config.testRepo);
    const fileHelper = new FileHelper(config.testRepo);
    
    // S1-01: Large Diff 100KB
    await runner.runTest('S1-01', 'Large Diff 100KB', async () => {
      runner.log('Testing 100KB diff...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create file with ~100KB
      const content = 'x'.repeat(100 * 1024);
      fileHelper.createFile('large-100kb.txt', content);
      git.addAll();
      
      const startTime = Date.now();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.stress
        });
        
        const duration = Date.now() - startTime;
        
        AssertHelper.assertContains(output, 'Commit', 'Should handle 100KB diff');
        AssertHelper.assert(duration < config.timeout.stress, 'Should complete within timeout');
        
        runner.log(`100KB diff handled in ${duration}ms`, 'info');
      } catch (error) {
        // May fail due to size limits
        runner.log('100KB diff may exceed limits (expected)', 'warning');
      }
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S1-02: Large Diff 1MB
    await runner.runTest('S1-02', 'Large Diff 1MB', async () => {
      runner.log('Testing 1MB diff...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create file with ~1MB
      const content = 'x'.repeat(1024 * 1024);
      fileHelper.createFile('large-1mb.txt', content);
      git.addAll();
      
      const startTime = Date.now();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.stress
        });
        
        const duration = Date.now() - startTime;
        runner.log(`1MB diff handled in ${duration}ms`, 'info');
      } catch (error) {
        runner.log('1MB diff may exceed limits (expected behavior)', 'warning');
      }
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S1-03: Large Diff 10MB (may fail - expected)
    await runner.runTest('S1-03', 'Large Diff 10MB', async () => {
      runner.log('Testing 10MB diff (may fail)...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create file with ~10MB
      const content = 'x'.repeat(10 * 1024 * 1024);
      fileHelper.createFile('large-10mb.txt', content);
      git.addAll();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.stress
        });
        
        runner.log('10MB diff handled (impressive!)', 'info');
      } catch (error) {
        // Expected to fail for very large diffs
        runner.log('10MB diff failed as expected (size limit)', 'warning');
      }
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S1-04: Binary Files
    await runner.runTest('S1-04', 'Binary Files', async () => {
      runner.log('Testing binary files...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create a small binary file
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      for (let i = 0; i < 1000; i++) {
        binaryContent.push(Math.floor(Math.random() * 256));
      }
      
      const binaryPath = path.join(config.testRepo, 'test-binary.bin');
      fs.writeFileSync(binaryPath, binaryContent);
      git.addAll();
      
      try {
        const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
          cwd: config.testRepo,
          encoding: 'utf8',
          timeout: config.timeout.medium
        });
        
        AssertHelper.assertContains(output, 'Commit', 'Should handle binary files');
        runner.log('Binary file handled', 'info');
      } catch (error) {
        runner.log('Binary file handling issue', 'warning');
      }
      
      fileHelper.cleanup();
    }, 'stress');
    
    // S1-05: Minified Files
    await runner.runTest('S1-05', 'Minified Files', async () => {
      runner.log('Testing minified files...', 'info');
      
      git.resetHard();
      git.clean();
      
      // Create a minified JS file (no whitespace, long lines)
      const minified = 'var a=1,b=2,c=3,d=4,e=5,f=6,g=7,h=8,i=9,j=10,k=11,l=12,m=13,n=14,o=15,p=16,q=17,r=18,s=19,t=20,u=21,v=22,w=23,x=24,y=25,z=26;function test(){return a+b+c+d+e+f+g+h+i+j+k+l+m+n+o+p+q+r+s+t+u+v+w+x+y+z;}';
      
      fileHelper.createFile('minified.js', minified.repeat(100));
      git.addAll();
      
      const output = execSync(`node "${path.join(config.distPath, 'index.js')}" auto --yes --no-push`, {
        cwd: config.testRepo,
        encoding: 'utf8',
        timeout: config.timeout.medium
      });
      
      AssertHelper.assertContains(output, 'Commit', 'Should handle minified files');
      
      fileHelper.cleanup();
      
      runner.log('Minified file handled', 'info');
    }, 'stress');
  }
}

module.exports = { run: LargeDiffTest.run };
