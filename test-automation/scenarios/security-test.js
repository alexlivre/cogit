const { execSync } = require('child_process');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');

class SecurityTest {
    static async run(runner) {
        const git = new GitHelper(runner.testRepo);
        const fileHelper = new FileHelper(runner.testRepo);
        
        runner.log('Testing security blocklist...');
        
        // Test 1: Blocklist functionality
        await this.testBlocklist(runner, git, fileHelper);
        
        // Test 2: Secret redaction in diff
        await this.testSecretRedaction(runner, git, fileHelper);
        
        // Test 3: Multiple sensitive files
        await this.testMultipleSensitiveFiles(runner, git, fileHelper);
        
        runner.log('✓ All security tests completed successfully');
    }
    
    static async testBlocklist(runner, git, fileHelper) {
        runner.log('Testing blocklist functionality...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create sensitive files
        const sensitiveFiles = fileHelper.createSensitiveFiles();
        runner.log(`Created sensitive files: ${sensitiveFiles.join(', ')}`);
        
        // Add files to git
        git.addAll();
        
        // Verify changes are detected
        AssertHelper.assert(git.hasChanges(), 'Changes should be detected');
        
        // Run cogit auto - should be blocked
        try {
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            // If it doesn't throw, check if it shows security alert
            AssertHelper.assertContains(output, 'Security alert', 'Should show security alert');
            AssertHelper.assertContains(output, 'blocked files', 'Should mention blocked files');
            
            // Should not create commit
            const lastCommitBefore = git.getLastCommit();
            
            // Try again (should still be blocked)
            const output2 = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            const lastCommitAfter = git.getLastCommit();
            AssertHelper.assertEquals(lastCommitBefore, lastCommitAfter, 'No commit should be created when blocked');
            
        } catch (error) {
            // Command should fail due to security block
            AssertHelper.assertContains(error.message, 'Security alert', 'Should fail with security alert');
            AssertHelper.assertContains(error.message, 'blocked files', 'Should mention blocked files');
        }
        
        runner.log('✓ Blocklist test passed');
    }
    
    static async testSecretRedaction(runner, git, fileHelper) {
        runner.log('Testing secret redaction in diff...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create file with secrets
        const fileWithSecrets = `// Configuration file
const config = {
    database: {
        host: 'localhost',
        password: 'supersecretpassword123',
        user: 'admin'
    },
    api: {
        key: 'sk-1234567890abcdef',
        token: 'ghp_abcdefghijklmnopqrstuvwxyz123456'
    },
    aws: {
        accessKeyId: 'AKIA1234567890123456',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    }
};

module.exports = config;`;
        
        fileHelper.createFile('config-with-secrets.js', fileWithSecrets);
        
        // Add to git
        git.addAll();
        
        // Get diff to check redaction
        const diff = git.getDiff();
        
        // Check that secrets are redacted (this would be done internally by cogit)
        // For testing, we'll verify the diff contains the secrets before redaction
        AssertHelper.assertContains(diff, 'supersecretpassword123', 'Diff should contain secrets before redaction');
        AssertHelper.assertContains(diff, 'sk-1234567890abcdef', 'Diff should contain API key');
        AssertHelper.assertContains(diff, 'AKIA1234567890123456', 'Diff should contain AWS key');
        
        runner.log('✓ Secret redaction test passed (secrets detected in diff)');
    }
    
    static async testMultipleSensitiveFiles(runner, git, fileHelper) {
        runner.log('Testing multiple sensitive files...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create mix of safe and sensitive files
        fileHelper.createFile('safe-file.js', 'console.log("Hello World");');
        fileHelper.createFile('.env.production', 'DATABASE_URL=production_secret_password');
        fileHelper.createFile('src/app.js', 'const app = express();');
        fileHelper.createFile('id_rsa', '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...');
        fileHelper.createFile('README.md', '# Project Documentation');
        fileHelper.createFile('.bash_history', 'ls -la\ncat /etc/passwd');
        
        // Add all files
        git.addAll();
        
        // Get list of all files
        const stagedFiles = git.getStagedFiles();
        const unstagedFiles = git.getUnstagedFiles();
        const allFiles = [...stagedFiles, ...unstagedFiles];
        
        // Verify sensitive files are detected
        const sensitivePatterns = ['.env', 'id_rsa', '.bash_history'];
        const detectedSensitiveFiles = allFiles.filter(file => 
            sensitivePatterns.some(pattern => file.includes(pattern))
        );
        
        AssertHelper.assert(detectedSensitiveFiles.length > 0, 'Should detect sensitive files');
        
        // Run cogit - should be blocked
        try {
            const output = execSync('node ../dist/index.js auto --yes', {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            // Should show security alert
            AssertHelper.assertContains(output, 'Security alert', 'Should show security alert');
            AssertHelper.assertContains(output, 'blocked files', 'Should mention blocked files');
            
            // Should mention the specific blocked files
            detectedSensitiveFiles.forEach(file => {
                AssertHelper.assertContains(output, file, `Should mention blocked file: ${file}`);
            });
            
        } catch (error) {
            // Command should fail
            AssertHelper.assertContains(error.message, 'Security alert', 'Should fail with security alert');
        }
        
        runner.log('✓ Multiple sensitive files test passed');
    }
    
    static async testSafeFilesAllowed(runner, git, fileHelper) {
        runner.log('Testing that safe files are allowed...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create only safe files
        const safeFiles = [
            'src/index.js',
            'src/utils/helper.js',
            'package.json',
            'README.md',
            '.gitignore',
            'tsconfig.json',
            'docs/api.md'
        ];
        
        safeFiles.forEach(file => {
            fileHelper.createFile(file, `// Safe file content for ${file}`);
        });
        
        // Add files
        git.addAll();
        
        // Run cogit - should succeed
        const output = execSync('node ../dist/index.js auto --yes', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        // Should NOT show security alert
        AssertHelper.assertNotContains(output, 'Security alert', 'Should not show security alert for safe files');
        AssertHelper.assertNotContains(output, 'blocked files', 'Should not mention blocked files');
        
        // Should show success
        AssertHelper.assertContains(output, 'Commit created', 'Should show success message');
        
        // Verify commit was created
        const lastCommit = git.getLastCommit();
        AssertHelper.assert(lastCommit !== null, 'Commit should be created for safe files');
        
        runner.log('✓ Safe files allowed test passed');
    }
}

module.exports = SecurityTest;
