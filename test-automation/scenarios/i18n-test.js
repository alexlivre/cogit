const { execSync } = require('child_process');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');

class I18nTest {
    static async run(runner) {
        const git = new GitHelper(runner.testRepo);
        const fileHelper = new FileHelper(runner.testRepo);
        
        runner.log('Testing internationalization...');
        
        // Test 1: Portuguese language
        await this.testPortuguese(runner, git, fileHelper);
        
        // Test 2: English language (default)
        await this.testEnglish(runner, git, fileHelper);
        
        // Test 3: Mixed language settings
        await this.testMixedLanguage(runner, git, fileHelper);
        
        runner.log('✓ All i18n tests completed successfully');
    }
    
    static async testPortuguese(runner, git, fileHelper) {
        runner.log('Testing Portuguese language...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Set environment to Portuguese
        const oldEnv = { ...process.env };
        process.env.LANGUAGE = 'pt';
        process.env.COMMIT_LANGUAGE = 'pt';
        
        try {
            // Create test file
            fileHelper.createFile('test-pt.txt', 'Testando em português');
            git.addAll();
            
            // Run cogit
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000,
                env: { ...process.env, LANGUAGE: 'pt', COMMIT_LANGUAGE: 'pt' }
            });
            
            // Should show Portuguese messages
            AssertHelper.assertContains(output.toLowerCase(), 'gerando', 'Should show "gerando" in Portuguese');
            AssertHelper.assertContains(output.toLowerCase(), 'processando', 'Should show "processando" in Portuguese');
            
            // Verify commit message is in Portuguese
            const lastCommit = git.getLastCommit();
            const commitMessage = lastCommit.split('|')[1];
            
            // Should contain Portuguese words or be properly formatted
            AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit format check failed: ');
            
            runner.log(`✓ Portuguese test passed - commit: "${commitMessage}"`);
            
        } finally {
            // Restore environment
            process.env = oldEnv;
        }
    }
    
    static async testEnglish(runner, git, fileHelper) {
        runner.log('Testing English language...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Set environment to English
        const oldEnv = { ...process.env };
        process.env.LANGUAGE = 'en';
        process.env.COMMIT_LANGUAGE = 'en';
        
        try {
            // Create test file
            fileHelper.createFile('test-en.txt', 'Testing in English');
            git.addAll();
            
            // Run cogit
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000,
                env: { ...process.env, LANGUAGE: 'en', COMMIT_LANGUAGE: 'en' }
            });
            
            // Should show English messages
            AssertHelper.assertContains(output.toLowerCase(), 'generating', 'Should show "generating" in English');
            AssertHelper.assertContains(output.toLowerCase(), 'processing', 'Should show "processing" in English');
            
            // Verify commit message is in English
            const lastCommit = git.getLastCommit();
            const commitMessage = lastCommit.split('|')[1];
            
            AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit format check failed: ');
            
            runner.log(`✓ English test passed - commit: "${commitMessage}"`);
            
        } finally {
            // Restore environment
            process.env = oldEnv;
        }
    }
    
    static async testMixedLanguage(runner, git, fileHelper) {
        runner.log('Testing mixed language settings...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Test: UI in English, commit in Portuguese
        const oldEnv = { ...process.env };
        process.env.LANGUAGE = 'en';
        process.env.COMMIT_LANGUAGE = 'pt';
        
        try {
            // Create test file
            fileHelper.createFile('test-mixed.txt', 'Testing mixed languages');
            git.addAll();
            
            // Run cogit
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000,
                env: { ...process.env, LANGUAGE: 'en', COMMIT_LANGUAGE: 'pt' }
            });
            
            // Should show English UI messages
            AssertHelper.assertContains(output.toLowerCase(), 'generating', 'Should show "generating" in English UI');
            AssertHelper.assertContains(output.toLowerCase(), 'processing', 'Should show "processing" in English UI');
            
            // Verify commit message format (could be in Portuguese or English depending on AI)
            const lastCommit = git.getLastCommit();
            const commitMessage = lastCommit.split('|')[1];
            
            AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit format check failed: ');
            
            runner.log(`✓ Mixed language test passed - commit: "${commitMessage}"`);
            
        } finally {
            // Restore environment
            process.env = oldEnv;
        }
    }
    
    static async testInvalidLanguage(runner, git, fileHelper) {
        runner.log('Testing invalid language handling...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Set invalid language
        const oldEnv = { ...process.env };
        process.env.LANGUAGE = 'invalid';
        process.env.COMMIT_LANGUAGE = 'invalid';
        
        try {
            // Create test file
            fileHelper.createFile('test-invalid.txt', 'Testing invalid language');
            git.addAll();
            
            // Run cogit - should fallback to English
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000,
                env: { ...process.env, LANGUAGE: 'invalid', COMMIT_LANGUAGE: 'invalid' }
            });
            
            // Should fallback to English
            AssertHelper.assertContains(output.toLowerCase(), 'generating', 'Should fallback to "generating"');
            AssertHelper.assertContains(output.toLowerCase(), 'processing', 'Should fallback to "processing"');
            
            // Should still create commit
            const lastCommit = git.getLastCommit();
            AssertHelper.assert(lastCommit !== null, 'Commit should be created even with invalid language');
            
            runner.log('✓ Invalid language test passed (fallback works)');
            
        } finally {
            // Restore environment
            process.env = oldEnv;
        }
    }
    
    static async testLanguageSwitching(runner, git, fileHelper) {
        runner.log('Testing language switching between commits...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        const oldEnv = { ...process.env };
        
        try {
            // First commit in Portuguese
            fileHelper.createFile('test-switch-1.txt', 'Primeiro commit em português');
            git.addAll();
            
            const output1 = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000,
                env: { ...process.env, LANGUAGE: 'pt', COMMIT_LANGUAGE: 'pt' }
            });
            
            AssertHelper.assertContains(output1.toLowerCase(), 'gerando', 'First commit should be in Portuguese');
            
            // Second commit in English
            fileHelper.createFile('test-switch-2.txt', 'Second commit in English');
            git.addAll();
            
            const output2 = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000,
                env: { ...process.env, LANGUAGE: 'en', COMMIT_LANGUAGE: 'en' }
            });
            
            AssertHelper.assertContains(output2.toLowerCase(), 'generating', 'Second commit should be in English');
            
            // Verify both commits exist
            const history = git.getCommitHistory(3);
            AssertHelper.assert(history.length >= 2, 'Should have at least 2 commits');
            
            runner.log('✓ Language switching test passed');
            
        } finally {
            // Restore environment
            process.env = oldEnv;
        }
    }
}

module.exports = I18nTest;
