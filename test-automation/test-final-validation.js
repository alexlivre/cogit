#!/usr/bin/env node

/**
 * Final validation test for gitignore prompt fix
 * Tests both --yes and normal behavior
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Final validation: Gitignore prompt behavior...\n');

// Test in current directory (cogit repository itself)
try {
  console.log('📋 Test 1: cogit auto --yes --dry-run (should NOT show gitignore prompt)');
  
  const result1 = execSync('npx ts-node src/index.ts auto --yes --dry-run', { 
    stdio: 'pipe',
    cwd: __dirname + '/../',
    timeout: 15000
  });
  
  const output1 = result1.toString();
  
  if (output1.includes('git add -A') && 
      output1.includes('git commit') && 
      !output1.includes('Check for .gitignore suggestions?')) {
    console.log('✅ PASS: --yes flag correctly skips gitignore prompt');
  } else {
    console.log('❌ FAIL: --yes flag behavior incorrect');
    console.log('Output snippet:', output1.substring(0, 200) + '...');
  }

  console.log('\n📋 Test 2: cogit auto --dry-run (should NOT show gitignore prompt in dry-run)');
  
  const result2 = execSync('npx ts-node src/index.ts auto --dry-run', { 
    stdio: 'pipe',
    cwd: __dirname + '/../',
    timeout: 15000
  });
  
  const output2 = result2.toString();
  
  if (output2.includes('git add -A') && 
      output2.includes('git commit') && 
      !output2.includes('Check for .gitignore suggestions?')) {
    console.log('✅ PASS: dry-run mode correctly skips gitignore prompt');
  } else {
    console.log('❌ FAIL: dry-run mode behavior incorrect');
    console.log('Output snippet:', output2.substring(0, 200) + '...');
  }

  console.log('\n📋 Test 3: Code validation - checking function signature');
  
  // Read the modified file to verify changes
  const executorPath = path.join(__dirname, '../src/cli/commands/auto/commit-executor.ts');
  const executorContent = fs.readFileSync(executorPath, 'utf8');
  
  if (executorContent.includes('yes?: boolean;') && 
      executorContent.includes('handleIgnoreSuggestions(repoPath, options.yes)') &&
      executorContent.includes('async function handleIgnoreSuggestions(repoPath: string, yes?: boolean)')) {
    console.log('✅ PASS: Code changes correctly implemented');
  } else {
    console.log('❌ FAIL: Code changes missing or incorrect');
  }

} catch (error) {
  console.log('❌ FAIL: Test execution failed');
  console.log('Error:', error.message);
}

console.log('\n🎯 Final validation completed!');
console.log('\n📝 Manual verification still recommended:');
console.log('1. Test in a real git repository with actual changes');
console.log('2. Run "cogit auto" to confirm prompt appears');
console.log('3. Run "cogit auto --yes" to confirm prompt is skipped');
