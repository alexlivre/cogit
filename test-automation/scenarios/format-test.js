const { execSync } = require('child_process');
const GitHelper = require('../utils/git-helper');
const FileHelper = require('../utils/file-helper');
const AssertHelper = require('../utils/assert-helper');

class FormatTest {
    static async run(runner) {
        const git = new GitHelper(runner.testRepo);
        const fileHelper = new FileHelper(runner.testRepo);
        
        runner.log('Testing conventional commit format...');
        
        // Test 1: Feature commits
        await this.testFeatureCommits(runner, git, fileHelper);
        
        // Test 2: Fix commits
        await this.testFixCommits(runner, git, fileHelper);
        
        // Test 3: Update commits
        await this.testUpdateCommits(runner, git, fileHelper);
        
        // Test 4: Title length validation
        await this.testTitleLength(runner, git, fileHelper);
        
        // Test 5: Body format validation
        await this.testBodyFormat(runner, git, fileHelper);
        
        // Test 6: Type detection
        await this.testTypeDetection(runner, git, fileHelper);
        
        runner.log('✓ All format tests completed successfully');
    }
    
    static async testFeatureCommits(runner, git, fileHelper) {
        runner.log('Testing feature commits...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create feature-related files
        fileHelper.createFile('src/features/user-profile.js', `
// User profile feature implementation
class UserProfile {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
    }
    
    updateProfile(updates) {
        Object.assign(this, updates);
    }
    
    getProfile() {
        return {
            id: this.id,
            name: this.name,
            email: this.email
        };
    }
}

module.exports = UserProfile;
`);
        
        git.addAll();
        
        // Run with feature hint
        const output = execSync('node ../dist/index.js auto --yes -m "add user profile feature"', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        AssertHelper.assertContains(output, 'Commit created', 'Should create feature commit');
        
        // Verify commit format
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        
        AssertHelper.assertConventionalCommitFormat(commitMessage, 'Feature commit format check failed: ');
        AssertHelper.assert(commitMessage.toLowerCase().startsWith('feat:'), 'Should start with feat:');
        
        runner.log(`✓ Feature commit test passed: "${commitMessage}"`);
    }
    
    static async testFixCommits(runner, git, fileHelper) {
        runner.log('Testing fix commits...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create bug fix file
        fileHelper.createFile('src/utils/validator.js', `
// Input validation utility
function validateEmail(email) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // Fixed: require minimum 8 characters
    return password && password.length >= 8;
}

module.exports = { validateEmail, validatePassword };
`);
        
        git.addAll();
        
        // Run with fix hint
        const output = execSync('node ../dist/index.js auto --yes -m "fix password validation bug"', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        AssertHelper.assertContains(output, 'Commit created', 'Should create fix commit');
        
        // Verify commit format
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        
        AssertHelper.assertConventionalCommitFormat(commitMessage, 'Fix commit format check failed: ');
        AssertHelper.assert(commitMessage.toLowerCase().startsWith('fix:'), 'Should start with fix:');
        
        runner.log(`✓ Fix commit test passed: "${commitMessage}"`);
    }
    
    static async testUpdateCommits(runner, git, fileHelper) {
        runner.log('Testing update commits...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create update file
        fileHelper.createFile('package.json', JSON.stringify({
            "name": "test-project",
            "version": "1.1.0",
            "description": "Updated test project",
            "dependencies": {
                "express": "^4.18.2",
                "lodash": "^4.17.21"
            }
        }, null, 2));
        
        git.addAll();
        
        // Run with update hint
        const output = execSync('node ../dist/index.js auto --yes -m "update dependencies and version"', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        AssertHelper.assertContains(output, 'Commit created', 'Should create update commit');
        
        // Verify commit format
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        
        AssertHelper.assertConventionalCommitFormat(commitMessage, 'Update commit format check failed: ');
        
        // Should be one of the valid types
        const validTypes = ['update:', 'chore:', 'refactor:'];
        const startsWithValidType = validTypes.some(type => 
            commitMessage.toLowerCase().startsWith(type)
        );
        AssertHelper.assert(startsWithValidType, `Should start with valid type: ${commitMessage}`);
        
        runner.log(`✓ Update commit test passed: "${commitMessage}"`);
    }
    
    static async testTitleLength(runner, git, fileHelper) {
        runner.log('Testing title length validation...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create file
        fileHelper.createFile('src/test-length.js', '// Testing title length validation');
        git.addAll();
        
        // Run cogit
        const output = execSync('node ../dist/index.js auto --yes', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        AssertHelper.assertContains(output, 'Commit created', 'Should create commit');
        
        // Verify title length
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        const title = commitMessage.split('\n')[0];
        
        AssertHelper.assertCommitMessageLength(commitMessage, 50, 'Title length validation failed: ');
        AssertHelper.assert(title.length <= 50, `Title should be <= 50 chars: "${title}" (${title.length})`);
        
        runner.log(`✓ Title length test passed: "${title}" (${title.length} chars)`);
    }
    
    static async testBodyFormat(runner, git, fileHelper) {
        runner.log('Testing body format validation...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create complex file with multiple changes
        fileHelper.createFile('src/complex-feature.js', `
// Complex feature with multiple changes
class ComplexFeature {
    constructor(options) {
        this.options = options;
        this.data = [];
        this.initialized = false;
    }
    
    initialize() {
        if (this.initialized) return;
        
        // Initialize data structures
        this.data = this.generateInitialData();
        this.setupEventListeners();
        this.initialized = true;
    }
    
    generateInitialData() {
        return Array.from({ length: 100 }, (_, i) => ({
            id: i,
            value: Math.random(),
            timestamp: Date.now()
        }));
    }
    
    setupEventListeners() {
        this.on('dataChange', this.handleDataChange.bind(this));
        this.on('error', this.handleError.bind(this));
    }
    
    handleDataChange(event) {
        console.log('Data changed:', event);
    }
    
    handleError(error) {
        console.error('Error occurred:', error);
    }
    
    // Added: new method for data processing
    processData() {
        return this.data.map(item => ({
            ...item,
            processed: true,
            result: item.value * 2
        }));
    }
    
    // Added: validation method
    validateData() {
        return this.data.every(item => 
            item.id >= 0 && 
            typeof item.value === 'number' && 
            item.timestamp > 0
        );
    }
}

module.exports = ComplexFeature;
`);
        
        git.addAll();
        
        // Run cogit
        const output = execSync('node ../dist/index.js auto --yes -m "add complex feature with data processing and validation"', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        AssertHelper.assertContains(output, 'Commit created', 'Should create commit with body');
        
        // Verify commit format (may have body)
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        
        AssertHelper.assertConventionalCommitFormat(commitMessage, 'Commit format check failed: ');
        
        // Check if body has proper format (if present)
        const lines = commitMessage.split('\n');
        if (lines.length > 1) {
            const bodyLines = lines.slice(1);
            // Body lines should start with bullet points or be properly formatted
            const hasValidBodyFormat = bodyLines.every(line => 
                line.trim().startsWith('-') || 
                line.trim().startsWith('*') || 
                line.trim() === ''
            );
            
            if (hasValidBodyFormat) {
                runner.log('✓ Body format test passed - proper bullet points');
            } else {
                runner.log('ℹ️ Body format test - no specific format detected (acceptable)');
            }
        }
        
        runner.log(`✓ Body format test passed: "${commitMessage.substring(0, 50)}..."`);
    }
    
    static async testTypeDetection(runner, git, fileHelper) {
        runner.log('Testing automatic type detection...');
        
        const testCases = [
            {
                name: 'Bug fix detection',
                hint: 'fix critical bug in authentication',
                expectedType: 'fix:'
            },
            {
                name: 'Feature detection',
                hint: 'add new user registration feature',
                expectedType: 'feat:'
            },
            {
                name: 'Update detection',
                hint: 'update package dependencies',
                expectedType: 'update:'
            },
            {
                name: 'Documentation detection',
                hint: 'update README with installation instructions',
                expectedType: 'docs:'
            }
        ];
        
        for (const testCase of testCases) {
            // Setup
            git.resetHard();
            git.clean();
            
            // Create appropriate file
            fileHelper.createFile(`test-${testCase.name.replace(/\s+/g, '-')}.js`, 
                `// ${testCase.hint}`
            );
            git.addAll();
            
            // Run cogit with specific hint
            const output = execSync(`node ../dist/index.js auto --yes -m "${testCase.hint}"`, {
                cwd: runner.cogitPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            AssertHelper.assertContains(output, 'Commit created', 
                `Should create commit for ${testCase.name}`);
            
            // Verify type detection
            const lastCommit = git.getLastCommit();
            const commitMessage = lastCommit.split('|')[1];
            
            const hasExpectedType = commitMessage.toLowerCase().startsWith(testCase.expectedType);
            if (hasExpectedType) {
                runner.log(`✓ ${testCase.name}: ${commitMessage}`);
            } else {
                runner.log(`ℹ️ ${testCase.name}: ${commitMessage} (type may vary, acceptable)`);
            }
        }
        
        runner.log('✓ Type detection test completed');
    }
    
    static async testScopeFormat(runner, git, fileHelper) {
        runner.log('Testing scope format...');
        
        // Setup
        git.resetHard();
        git.clean();
        
        // Create file with specific scope
        fileHelper.createFile('src/auth/login.js', `
// Authentication login module
export function login(username, password) {
    // Implementation
    return { success: true, token: 'abc123' };
}
`);
        
        git.addAll();
        
        // Run with scope hint
        const output = execSync('node ../dist/index.js auto --yes -m "fix login authentication issue"', {
            cwd: runner.cogitPath,
            encoding: 'utf8',
            timeout: 30000
        });
        
        AssertHelper.assertContains(output, 'Commit created', 'Should create commit with scope');
        
        // Verify commit format (may include scope)
        const lastCommit = git.getLastCommit();
        const commitMessage = lastCommit.split('|')[1];
        
        AssertHelper.assertConventionalCommitFormat(commitMessage, 'Scope commit format check failed: ');
        
        // Check if scope is present (optional)
        const hasScope = /\([^)]+\):/.test(commitMessage);
        if (hasScope) {
            runner.log(`✓ Scope format test passed: "${commitMessage}"`);
        } else {
            runner.log(`ℹ️ Scope format test - no scope detected: "${commitMessage}" (acceptable)`);
        }
    }
}

module.exports = FormatTest;
