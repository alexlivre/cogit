#!/usr/bin/env node

/**
 * Test: Gitignore prompt behavior with --yes flag
 * Validates that the prompt is skipped when --yes is used
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing gitignore prompt behavior with --yes flag...\n');

// Create a temporary test repository
const testRepo = path.join(__dirname, '../temp-test-repo');

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

  // Test 1: Check if cogit auto --yes works without gitignore prompt
  console.log('\n📋 Test 1: Running cogit auto --yes...');
  
  try {
    const result = execSync('npx ts-node src/index.ts auto --yes --dry-run', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '../'),
      timeout: 10000
    });
    
    const output = result.toString();
    
    // Check that dry-run commands are present but no gitignore prompt
    if (output.includes('git add -A') && 
        output.includes('git commit') && 
        !output.includes('Check for .gitignore suggestions?')) {
      console.log('✅ PASS: --yes flag skips gitignore prompt');
    } else {
      console.log('❌ FAIL: --yes flag did not work as expected');
      console.log('Output:', output);
    }
    
  } catch (error) {
    console.log('❌ FAIL: Error running cogit auto --yes');
    console.log('Error:', error.message);
  }

  // Test 2: Check if cogit auto (without --yes) still shows prompt
  console.log('\n📋 Test 2: Running cogit auto (without --yes) to check prompt...');
  console.log('ℹ️  This test expects the prompt to appear but we cannot test it automatically');
  console.log('✅ Manual verification required: Run "cogit auto" without --yes to confirm prompt appears');

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
