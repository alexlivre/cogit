const { execSync } = require('child_process');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');

class ScannerTest {
    static async run(runner) {
        const git = new GitHelper(runner.testRepo);
        const fileHelper = new FileHelper(runner.testRepo);
        
        runner.log('Testing scanner functionality...');
        
        // Test 1: Detect staged files
        await this.testStagedFiles(runner, git, fileHelper);
        
        // Test 2: Detect unstaged files
        await this.testUnstagedFiles(runner, git, fileHelper);
        
        // Test 3: Detect untracked files
        await this.testUntrackedFiles(runner, git, fileHelper);
        
        // Test 4: No changes detection
        await this.testNoChanges(runner, git, fileHelper);
        
        // Test 5: Diff generation
        await this.testDiffGeneration(runner, git, fileHelper);
        
        // Test 6: Untracked files in diff (FASE 2)
        await this.testUntrackedInDiff(runner, git, fileHelper);
        
        runner.log('✓ All scanner tests completed successfully');
    }
    
    static async testStagedFiles(runner, git, fileHelper) {
        runner.log('Testing staged files detection...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create and stage file
        fileHelper.createFile('staged-test.txt', 'Staged content');
        git.addAll();
        
        const stagedFiles = git.getStagedFiles();
        AssertHelper.assertArrayContains(stagedFiles, 'staged-test.txt', 'Should detect staged file');
        
        runner.log('✓ Staged files detection passed');
    }
    
    static async testUnstagedFiles(runner, git, fileHelper) {
        runner.log('Testing unstaged files detection...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create file, commit, then modify
        fileHelper.createFile('unstaged-test.txt', 'Original content');
        git.addAll();
        git.commit('test: initial commit');
        
        // Modify without staging
        fileHelper.modifyFile('unstaged-test.txt', 'Modified content');
        
        const unstagedFiles = git.getUnstagedFiles();
        AssertHelper.assertArrayContains(unstagedFiles, 'unstaged-test.txt', 'Should detect unstaged file');
        
        runner.log('✓ Unstaged files detection passed');
    }
    
    static async testUntrackedFiles(runner, git, fileHelper) {
        runner.log('Testing untracked files detection...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create file without staging
        fileHelper.createFile('untracked-test.txt', 'Untracked content');
        
        const status = git.getStatus();
        AssertHelper.assertContains(status, 'untracked-test.txt', 'Should detect untracked file');
        
        runner.log('✓ Untracked files detection passed');
    }
    
    static async testNoChanges(runner, git, fileHelper) {
        runner.log('Testing no changes detection...');
        
        // Setup - clean repo
        git.resetHard();
        git.clean();
        
        const hasChanges = git.hasChanges();
        AssertHelper.assert(!hasChanges, 'Should not detect changes in clean repo');
        
        runner.log('✓ No changes detection passed');
    }
    
    static async testDiffGeneration(runner, git, fileHelper) {
        runner.log('Testing diff generation...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create and stage file
        fileHelper.createFile('diff-test.txt', 'Diff content\nLine 2\nLine 3');
        git.addAll();
        
        const diff = git.getDiff();
        AssertHelper.assertContains(diff, 'diff-test.txt', 'Diff should contain filename');
        AssertHelper.assertContains(diff, '+Diff content', 'Diff should show added lines');
        
        runner.log('✓ Diff generation passed');
    }
    
    static async testUntrackedInDiff(runner, git, fileHelper) {
        runner.log('Testing untracked files in diff (FASE 2 feature)...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create untracked file only
        fileHelper.createFile('untracked-diff-test.txt', 'Untracked file content');
        
        // Run cogit with dry-run to see if it processes untracked
        try {
            const output = execSync(`node "${runner.cogitPath}/dist/index.js" auto --dry-run --yes`, {
                cwd: runner.testRepo,
                encoding: 'utf8',
                timeout: 30000
            });
            
            // Should process the untracked file
            AssertHelper.assertContains(output, 'DRY RUN', 'Should enter dry run mode');
            
            runner.log('✓ Untracked files in diff passed');
        } catch (error) {
            // If it fails due to no diff, the feature might not be working
            if (error.message.includes('No diff')) {
                throw new Error('Untracked files not included in diff');
            }
            throw error;
        }
    }
}

module.exports = ScannerTest;
