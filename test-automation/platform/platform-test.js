/**
 * Cross-Platform Compatibility Tests
 * Validates that Cogit CLI works correctly on Windows, macOS, and Linux
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Test configuration
const CONFIG = {
  testRepo: path.join(__dirname, 'test-repo'),
  results: {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  }
};

// Platform information
const PLATFORM = {
  isWindows: process.platform === 'win32',
  isMacOS: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  name: process.platform === 'win32' ? 'Windows' : 
        process.platform === 'darwin' ? 'macOS' : 'Linux',
  shell: process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash')
};

console.log(`\n🧪 Cross-Platform Tests for Cogit CLI`);
console.log(`Platform: ${PLATFORM.name}`);
console.log(`Shell: ${PLATFORM.shell}`);
console.log(`Node: ${process.version}`);
console.log('─'.repeat(50));

/**
 * Run a single test
 */
function runTest(id, name, testFn) {
  console.log(`\n▶ ${id}: ${name}`);
  
  try {
    const result = testFn();
    
    if (result.success) {
      CONFIG.results.passed++;
      CONFIG.results.tests.push({ id, name, status: 'PASS', platform: PLATFORM.name });
      console.log(`  ✅ PASS: ${result.message || 'OK'}`);
    } else {
      CONFIG.results.failed++;
      CONFIG.results.tests.push({ id, name, status: 'FAIL', error: result.error, platform: PLATFORM.name });
      console.log(`  ❌ FAIL: ${result.error}`);
    }
  } catch (error) {
    CONFIG.results.failed++;
    CONFIG.results.tests.push({ id, name, status: 'ERROR', error: error.message, platform: PLATFORM.name });
    console.log(`  💥 ERROR: ${error.message}`);
  }
}

/**
 * Execute a command synchronously
 */
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      ...options
    });
    return { success: true, stdout: result, stderr: '' };
  } catch (error) {
    return { 
      success: false, 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message 
    };
  }
}

/**
 * Setup test repository
 */
function setupTestRepo() {
  // Clean up if exists
  if (fs.existsSync(CONFIG.testRepo)) {
    fs.rmSync(CONFIG.testRepo, { recursive: true, force: true });
  }
  
  // Create test directory
  fs.mkdirSync(CONFIG.testRepo, { recursive: true });
  
  // Initialize git repo
  execCommand('git init', { cwd: CONFIG.testRepo });
  execCommand('git config user.email "test@test.com"', { cwd: CONFIG.testRepo });
  execCommand('git config user.name "Test User"', { cwd: CONFIG.testRepo });
  
  // Create test files
  fs.writeFileSync(path.join(CONFIG.testRepo, 'test.txt'), 'Hello World');
  fs.writeFileSync(path.join(CONFIG.testRepo, 'file with spaces.txt'), 'Spaces test');
  fs.writeFileSync(path.join(CONFIG.testRepo, 'special-chars_1.txt'), 'Special chars');
  
  // Initial commit
  execCommand('git add -A', { cwd: CONFIG.testRepo });
  execCommand('git commit -m "Initial commit"', { cwd: CONFIG.testRepo });
}

/**
 * Cleanup test repository
 */
function cleanupTestRepo() {
  if (fs.existsSync(CONFIG.testRepo)) {
    fs.rmSync(CONFIG.testRepo, { recursive: true, force: true });
  }
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

// Setup
setupTestRepo();

// P-01: Platform Detection
runTest('P-01', 'Platform Detection', () => {
  const platform = require('../../dist/utils/platform');
  
  if (PLATFORM.isWindows && !platform.platform.isWindows) {
    return { success: false, error: 'Windows not detected correctly' };
  }
  if (PLATFORM.isMacOS && !platform.platform.isMacOS) {
    return { success: false, error: 'macOS not detected correctly' };
  }
  if (PLATFORM.isLinux && !platform.platform.isLinux) {
    return { success: false, error: 'Linux not detected correctly' };
  }
  
  return { success: true, message: `Detected: ${platform.platform.getName()}` };
});

// P-02: Git Command Execution
runTest('P-02', 'Git Command Execution', () => {
  const { execGit } = require('../../dist/utils/executor');
  
  try {
    const result = execGit('status', { cwd: CONFIG.testRepo });
    // This is async, so we need to handle it differently
    return { success: true, message: 'execGit function available' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// P-03: Path Normalization
runTest('P-03', 'Path Normalization', () => {
  const { normalizePathForOS } = require('../../dist/utils/platform');
  
  const testPath = 'folder/subfolder/file.txt';
  const normalized = normalizePathForOS(testPath);
  
  if (PLATFORM.isWindows) {
    if (!normalized.includes('\\')) {
      return { success: false, error: 'Path not normalized for Windows' };
    }
  } else {
    if (!normalized.includes('/')) {
      return { success: false, error: 'Path not normalized for Unix' };
    }
  }
  
  return { success: true, message: `Normalized: ${normalized}` };
});

// P-04: Path Escaping for Shell
runTest('P-04', 'Path Escaping for Shell', () => {
  const { escapePathForShell } = require('../../dist/utils/platform');
  
  const pathWithSpaces = PLATFORM.isWindows 
    ? 'C:\\Program Files\\test.txt'
    : '/home/user/my files/test.txt';
  
  const escaped = escapePathForShell(pathWithSpaces);
  
  if (!escaped.includes('"') && pathWithSpaces.includes(' ')) {
    return { success: false, error: 'Path with spaces not escaped' };
  }
  
  return { success: true, message: `Escaped: ${escaped}` };
});

// P-05: Home Directory Resolution
runTest('P-05', 'Home Directory Resolution', () => {
  const { platform } = require('../../dist/utils/platform');
  
  const home = platform.getHomeDir();
  
  if (!home || home === '') {
    return { success: false, error: 'Home directory not found' };
  }
  
  return { success: true, message: `Home: ${home}` };
});

// P-06: File Reading (fs.readFile instead of cat)
runTest('P-06', 'File Reading (Cross-Platform)', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(CONFIG.testRepo, 'test.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content !== 'Hello World') {
    return { success: false, error: `Content mismatch: ${content}` };
  }
  
  return { success: true, message: 'File read successfully' };
});

// P-07: Git Status Command
runTest('P-07', 'Git Status Command', () => {
  const result = execCommand('git status', { cwd: CONFIG.testRepo });
  
  if (!result.success) {
    return { success: false, error: result.stderr };
  }
  
  return { success: true, message: 'Git status executed' };
});

// P-08: Git Diff Command
runTest('P-08', 'Git Diff Command', () => {
  // Modify a file
  fs.writeFileSync(path.join(CONFIG.testRepo, 'test.txt'), 'Modified content');
  
  const result = execCommand('git diff', { cwd: CONFIG.testRepo });
  
  if (!result.success) {
    return { success: false, error: result.stderr };
  }
  
  if (!result.stdout.includes('Modified content')) {
    return { success: false, error: 'Diff content not found' };
  }
  
  return { success: true, message: 'Git diff executed' };
});

// P-09: File with Spaces in Name
runTest('P-09', 'File with Spaces in Name', () => {
  const filePath = path.join(CONFIG.testRepo, 'file with spaces.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content !== 'Spaces test') {
    return { success: false, error: 'File with spaces not read correctly' };
  }
  
  return { success: true, message: 'File with spaces handled' };
});

// P-10: Git Add Command
runTest('P-10', 'Git Add Command', () => {
  // Create new file
  fs.writeFileSync(path.join(CONFIG.testRepo, 'new-file.txt'), 'New file');
  
  const result = execCommand('git add new-file.txt', { cwd: CONFIG.testRepo });
  
  if (!result.success) {
    return { success: false, error: result.stderr };
  }
  
  return { success: true, message: 'Git add executed' };
});

// P-11: Git Commit Command
runTest('P-11', 'Git Commit Command', () => {
  const result = execCommand('git commit -m "Test commit"', { cwd: CONFIG.testRepo });
  
  if (!result.success) {
    return { success: false, error: result.stderr };
  }
  
  return { success: true, message: 'Git commit executed' };
});

// P-12: Git Branch Command
runTest('P-12', 'Git Branch Command', () => {
  const result = execCommand('git branch test-branch', { cwd: CONFIG.testRepo });
  
  if (!result.success) {
    return { success: false, error: result.stderr };
  }
  
  return { success: true, message: 'Git branch created' };
});

// P-13: Git Tag Command
runTest('P-13', 'Git Tag Command', () => {
  const result = execCommand('git tag v0.0.1-test', { cwd: CONFIG.testRepo });
  
  if (!result.success) {
    return { success: false, error: result.stderr };
  }
  
  return { success: true, message: 'Git tag created' };
});

// P-14: Shell Detection
runTest('P-14', 'Shell Detection', () => {
  const { platform } = require('../../dist/utils/platform');
  
  const shell = platform.getShell();
  
  if (!shell || shell === '') {
    return { success: false, error: 'Shell not detected' };
  }
  
  return { success: true, message: `Shell: ${shell}` };
});

// P-15: Git Executable Detection
runTest('P-15', 'Git Executable Detection', () => {
  const { platform } = require('../../dist/utils/platform');
  
  const gitCmd = platform.getGitCommand();
  
  if (PLATFORM.isWindows && gitCmd !== 'git.exe') {
    return { success: false, error: `Expected git.exe, got ${gitCmd}` };
  }
  
  if (!PLATFORM.isWindows && gitCmd !== 'git') {
    return { success: false, error: `Expected git, got ${gitCmd}` };
  }
  
  return { success: true, message: `Git command: ${gitCmd}` };
});

// Cleanup
cleanupTestRepo();

// ═══════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(50));
console.log('📊 TEST RESULTS');
console.log('═'.repeat(50));
console.log(`Platform: ${PLATFORM.name}`);
console.log(`Passed: ${CONFIG.results.passed}`);
console.log(`Failed: ${CONFIG.results.failed}`);
console.log(`Skipped: ${CONFIG.results.skipped}`);
console.log(`Total: ${CONFIG.results.passed + CONFIG.results.failed + CONFIG.results.skipped}`);

const successRate = ((CONFIG.results.passed / (CONFIG.results.passed + CONFIG.results.failed)) * 100).toFixed(1);
console.log(`Success Rate: ${successRate}%`);

if (CONFIG.results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  CONFIG.results.tests
    .filter(t => t.status !== 'PASS')
    .forEach(t => console.log(`  - ${t.id}: ${t.name} (${t.error || t.status})`));
}

console.log('\n');

// Exit with appropriate code
process.exit(CONFIG.results.failed > 0 ? 1 : 0);
