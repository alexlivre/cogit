const { execSync } = require('child_process');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');
const fs = require('fs');
const path = require('path');

class EdgeCasesTest {
    static async run(runner) {
        const git = new GitHelper(runner.testRepo);
        const fileHelper = new FileHelper(runner.testRepo);
        
        runner.log('Testing edge cases...');
        
        // Test 1: Not a git repository
        await this.testNotGitRepository(runner);
        
        // Test 2: No changes to commit
        await this.testNoChanges(runner, git, fileHelper);
        
        // Test 3: Empty repository
        await this.testEmptyRepository(runner, git, fileHelper);
        
        // Test 4: Large diff
        await this.testLargeDiff(runner, git, fileHelper);
        
        // Test 5: Special characters in files
        await this.testSpecialCharacters(runner, git, fileHelper);
        
        // Test 6: Invalid API key
        await this.testInvalidApiKey(runner, git, fileHelper);
        
        runner.log('✓ All edge cases tests completed successfully');
    }
    
    static async testNotGitRepository(runner) {
        runner.log('Testing outside git repository...');
        
        // Create temporary directory outside git
        const tempDir = path.join(path.dirname(runner.testRepo), 'temp-no-git');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create test file
        const tempFileHelper = new FileHelper(tempDir);
        tempFileHelper.createFile('test.txt', 'Testing outside git');
        
        // Run cogit - should fail
        try {
            const output = execSync(`node ../dist/index.js auto --yes -p "${tempDir}"`, {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            // If it doesn't throw, check error message
            AssertHelper.assertContains(output, 'not a git repository', 'Should show not a git repository error');
            
        } catch (error) {
            // Should fail with repository error
            AssertHelper.assertContains(error.message.toLowerCase(), 'git', 'Should mention git in error');
            AssertHelper.assertContains(error.message.toLowerCase(), 'repository', 'Should mention repository in error');
        }
        
        // Cleanup
        tempFileHelper.cleanup();
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        runner.log('✓ Not a git repository test passed');
    }
    
    static async testNoChanges(runner, git, fileHelper) {
        runner.log('Testing with no changes...');
        
        // Setup - clean repository
        git.resetHard();
        git.clean();
        
        // Ensure repository is clean
        if (git.hasChanges()) {
            git.addAll();
            git.commit('Cleanup commit');
        }
        
        // Verify no changes
        AssertHelper.assert(!git.hasChanges(), 'Repository should be clean');
        
        // Run cogit - should show no changes message
        try {
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            // Should show no changes message
            AssertHelper.assertContains(output.toLowerCase(), 'no changes', 'Should show no changes message');
            AssertHelper.assertContains(output.toLowerCase(), 'detected', 'Should mention detected');
            
        } catch (error) {
            // Should exit gracefully with no changes message
            AssertHelper.assertContains(error.message.toLowerCase(), 'changes', 'Should mention changes in error');
        }
        
        runner.log('✓ No changes test passed');
    }
    
    static async testEmptyRepository(runner, git, fileHelper) {
        runner.log('Testing empty repository...');
        
        // Setup - reset to initial state
        git.resetHard();
        git.clean();
        
        // Get current commit count
        const initialHistory = git.getCommitHistory(10);
        
        // Create first file
        fileHelper.createFile('README.md', '# Test Project\n\nThis is a test project.');
        git.addAll();
        
        // Run cogit for first commit
        const output = execSync('node ../dist/index.js auto --yes', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should succeed
        AssertHelper.assertContains(output, 'Commit created', 'Should create first commit');
        
        // Verify commit was created
        const newHistory = git.getCommitHistory(10);
        AssertHelper.assert(newHistory.length > initialHistory.length, 'Should have more commits after first commit');
        
        runner.log('✓ Empty repository test passed');
    }
    
    static async testLargeDiff(runner, git, fileHelper) {
        runner.log('Testing large diff...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create large file
        const largeContent = this.generateLargeContent(10000); // 10KB
        fileHelper.createFile('large-file.js', largeContent);
        git.addAll();
        
        // Run cogit with large diff
        const startTime = Date.now();
        const output = execSync('node ../dist/index.js auto --yes', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 60000 // Increased timeout for large files
        });
        const duration = Date.now() - startTime;
        
        // Should handle large diff
        AssertHelper.assertContains(output, 'Commit created', 'Should handle large diff');
        
        // Performance check for large files
        AssertHelper.assertPerformance(duration, 45000, 'cogit auto with large diff', 'Large diff performance check failed');
        
        // Verify commit
        const lastCommit = git.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created for large file');
        
        runner.log(`✓ Large diff test passed (${duration}ms)`);
    }
    
    static async testSpecialCharacters(runner, git, fileHelper) {
        runner.log('Testing special characters...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create files with special characters
        const specialFiles = [
            { name: 'file with spaces.txt', content: 'Content with spaces' },
            { name: 'file-with-ümlaut.txt', content: 'Content with ümlaut' },
            { name: '文件中文.txt', content: 'Content with Chinese characters' },
            { name: 'файл-русский.txt', content: 'Content with Russian characters' },
            { name: 'file\'with\'quotes.txt', content: 'Content with quotes' },
            { name: 'file-with-emoji😀.txt', content: 'Content with emoji 😀' }
        ];
        
        specialFiles.forEach(file => {
            fileHelper.createFile(file.name, file.content);
        });
        
        git.addAll();
        
        // Run cogit
        const output = execSync('node ../dist/index.js auto --yes', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should handle special characters
        AssertHelper.assertContains(output, 'Commit created', 'Should handle special characters');
        
        // Verify commit
        const lastCommit = git.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created for files with special characters');
        
        runner.log('✓ Special characters test passed');
    }
    
    static async testInvalidApiKey(runner, git, fileHelper) {
        runner.log('Testing invalid API key...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Save original environment
        const originalKey = process.env.OPENROUTER_API_KEY;
        
        try {
            // Set invalid API key
            process.env.OPENROUTER_API_KEY = 'invalid-key-123';
            
            // Create test file
            fileHelper.createFile('test-invalid-key.txt', 'Testing invalid API key');
            git.addAll();
            
            // Run cogit - should fail gracefully
            try {
                const output = execSync('node ../dist/index.js auto --yes', {
                    cwd: runner.cogitPath,
                    encoding: 'utf8',
                    timeout: 30000,
                    env: { ...process.env, OPENROUTER_API_KEY: 'invalid-key-123' }
                });
                
                // If it doesn't throw, it should show error message
                AssertHelper.assertContains(output.toLowerCase(), 'error', 'Should show error message');
                AssertHelper.assertContains(output.toLowerCase(), 'api', 'Should mention API in error');
                
            } catch (error) {
                // Should fail with API error
                AssertHelper.assertContains(error.message.toLowerCase(), 'api', 'Should mention API in error');
                AssertHelper.assertContains(error.message.toLowerCase(), 'key', 'Should mention key in error');
            }
            
        } finally {
            // Restore original API key
            if (originalKey) {
                process.env.OPENROUTER_API_KEY = originalKey;
            } else {
                delete process.env.OPENROUTER_API_KEY;
            }
        }
        
        runner.log('✓ Invalid API key test passed');
    }
    
    static async testNetworkTimeout(runner, git, fileHelper) {
        runner.log('Testing network timeout simulation...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create test file
        fileHelper.createFile('test-timeout.txt', 'Testing network timeout');
        git.addAll();
        
        // Run with very short timeout to simulate network issues
        try {
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 1000 // Very short timeout
            });
            
            // If it succeeds, that's fine
            AssertHelper.assertContains(output, 'Commit created', 'Should handle timeout gracefully');
            
        } catch (error) {
            // Should timeout gracefully
            AssertHelper.assertContains(error.message.toLowerCase(), 'timeout', 'Should mention timeout');
        }
        
        runner.log('✓ Network timeout test passed');
    }
    
    static generateLargeContent(size) {
        const content = [];
        const baseContent = `// Large JavaScript file for testing
function generateData() {
    const data = [];
    for (let i = 0; i < 1000; i++) {
        data.push({
            id: i,
            name: 'Item ' + i,
            description: 'This is a detailed description for item ' + i + '. It contains various information about the item including its properties, status, and other relevant details.',
            metadata: {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                version: '1.0.0',
                tags: ['test', 'data', 'item-' + i],
                properties: {
                    color: ['red', 'blue', 'green'][i % 3],
                    size: (i % 10) + 1,
                    weight: (i * 0.5) + 1,
                    active: i % 2 === 0
                }
            }
        });
    }
    return data;
}

module.exports = { generateData };
`;
        
        // Repeat content to reach desired size
        while (content.join('\n').length < size) {
            content.push(baseContent);
        }
        
        return content.join('\n').substring(0, size);
    }
}

module.exports = EdgeCasesTest;
