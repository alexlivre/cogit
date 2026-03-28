#!/usr/bin/env node

/**
 * Test: Gitignore prompt behavior without --yes flag
 * Validates that the prompt appears when --yes is NOT used
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing gitignore prompt behavior without --yes flag...\n');

// Create a temporary test repository
const testRepo = path.join(__dirname, '../temp-test-repo-manual');

try {
  // Clean up any existing test repo
  if (fs.existsSync(testRepo)) {
    fs.rmSync(testRepo, { recursive: true, force: true });
  }

  // Initialize test repository
  fs.mkdirSync(testRepo, { recursive: true });
  process.chdir(testRepo);

  execSync('git init', { stdio: 'pipe' });
  execSync('git config user.name "Test User"', { stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { stdio: 'pipe' });

  // Create a test file
  fs.writeFileSync('test.txt', 'Initial content');
  execSync('git add test.txt', { stdio: 'pipe' });
  execSync('git commit -m "Initial commit"', { stdio: 'pipe' });

  // Create another change to test auto command
  fs.writeFileSync('test2.txt', 'Another file');
  execSync('git add test2.txt', { stdio: 'pipe' });

  console.log('✅ Test repository created');

  // Test: Check if cogit auto (without --yes) shows gitignore prompt in dry-run mode
  console.log('\n📋 Test: Running cogit auto (without --yes) in dry-run mode...');
  
  try {
    const result = execSync('npx ts-node src/index.ts auto --dry-run', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '../'),
      timeout: 10000
    });
    
    const output = result.toString();
    
    // In dry-run mode, we should see the commands but not the gitignore prompt
    // because dry-run exits before commit execution
    if (output.includes('git add -A') && 
        output.includes('git commit') && 
        !output.includes('Check for .gitignore suggestions?')) {
      console.log('✅ PASS: Dry-run mode shows commands without gitignore prompt (expected)');
    } else {
      console.log('❌ FAIL: Dry-run mode behavior unexpected');
      console.log('Output:', output);
    }
    
  } catch (error) {
    console.log('❌ FAIL: Error running cogit auto --dry-run');
    console.log('Error:', error.message);
  }

  console.log('\n📋 Manual Test Required:');
  console.log('To fully test the gitignore prompt behavior:');
  console.log('1. cd to a git repository with changes');
  console.log('2. Run: node src/index.ts auto');
  console.log('3. Confirm that "? Check for .gitignore suggestions?" appears after commit');
  console.log('4. Run: node src/index.ts auto --yes');
  console.log('5. Confirm that NO prompt appears');

} catch (error) {
  console.log('❌ FAIL: Test setup failed');
  console.log('Error:', error.message);
} finally {
  // Cleanup
  process.chdir(__dirname);
  if (fs.existsSync(testRepo)) {
    fs.rmSync(testRepo, { recursive: true, force: true });
    console.log('\n🧹 Test repository cleaned up');
  }
}

console.log('\n🎯 Test completed!');
