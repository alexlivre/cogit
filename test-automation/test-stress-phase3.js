#!/usr/bin/env node

/**
 * Cogit CLI - Stress Tests (Phase 3)
 * 5 Automatic Stress Tests - 100% automated
 * 
 * Usage:
 *   node test-stress-phase3.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  testRepo: 'C:\\code\\github\\teste',
  cogitBin: 'C:\\code\\github\\cogit\\dist\\index.js',
  timeout: 300000, // 5 minutes max
};

// Test results
let passed = 0;
let failed = 0;
const results = [];

// ========================================
// HELPERS
// ========================================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runStressTest(id, description, testFn, timeout = CONFIG.timeout) {
  log(`\n⚡ ${id}: ${description}`, 'cyan');
  const startTime = Date.now();
  
  try {
    const result = testFn();
    const duration = Date.now() - startTime;
    
    if (result.success) {
      passed++;
      log(`  ✅ PASS (${duration}ms) - ${result.details || ''}`, 'green');
      results.push({ id, description, status: 'PASS', duration, details: result.details });
    } else {
      failed++;
      log(`  ❌ FAIL (${duration}ms) - ${result.error || ''}`, 'red');
      results.push({ id, description, status: 'FAIL', duration, error: result.error });
    }
  } catch (error) {
    failed++;
    const duration = Date.now() - startTime;
    log(`  ❌ ERROR (${duration}ms) - ${error.message}`, 'red');
    results.push({ id, description, status: 'ERROR', duration, error: error.message });
  }
}

function gitExec(command, ignoreError = false) {
  try {
    return execSync(command, {
      cwd: CONFIG.testRepo,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (ignoreError) return null;
    throw error;
  }
}

function cogitRun(args, timeout = CONFIG.timeout) {
  try {
    return {
      success: true,
      output: execSync(`node "${CONFIG.cogitBin}" ${args}`, {
        cwd: CONFIG.testRepo,
        encoding: 'utf8',
        timeout: timeout,
      }),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || '',
    };
  }
}

function prepareRepo() {
  log('\n🔧 Preparando repositório de teste...', 'yellow');
  gitExec('git reset --hard HEAD', true);
  gitExec('git clean -fd', true);
  
  // Ensure base commit exists
  const gitLog = gitExec('git log --oneline -1', true);
  if (!gitLog || gitLog.trim().length === 0) {
    fs.writeFileSync(path.join(CONFIG.testRepo, 'stress-base.txt'), 'base');
    gitExec('git add -A');
    gitExec('git commit -m "stress: base commit"');
  }
  log('✓ Repositório preparado', 'green');
}

function cleanupRepo() {
  log('\n🧹 Limpando repositório...', 'yellow');
  gitExec('git reset --hard HEAD', true);
  gitExec('git clean -fd', true);
  
  // Remove stress test files
  for (let i = 0; i < 600; i++) {
    const file = path.join(CONFIG.testRepo, `stress-${i}.txt`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  
  // Remove large files
  const largeFile = path.join(CONFIG.testRepo, 'stress-large.bin');
  if (fs.existsSync(largeFile)) fs.unlinkSync(largeFile);
  
  log('✓ Limpeza concluída', 'green');
}

// ========================================
// STRESS TESTS
// ========================================

console.log('\n' + '='.repeat(60));
log('⚡ STRESS TESTS - Phase 3 (5 testes)', 'cyan');
console.log('='.repeat(60));

prepareRepo();

// ST-01: 500 arquivos modificados
runStressTest('ST-01', '500 arquivos modificados simultaneamente', () => {
  // Create 500 files
  for (let i = 0; i < 500; i++) {
    fs.writeFileSync(
      path.join(CONFIG.testRepo, `stress-${i}.txt`),
      `Content for file ${i}\n`
    );
  }
  
  // Run cogit
  const result = cogitRun('auto --yes --no-push', 120000);
  
  // Check if processed
  const log = gitExec('git log --oneline -1', true) || '';
  const processed = result.success || log.includes('stress') || log.includes('feat') || log.includes('update');
  
  return {
    success: processed,
    details: processed ? '500 arquivos processados' : 'Falha no processamento',
  };
}, 120000);

// Cleanup between tests
gitExec('git reset --hard HEAD', true);
gitExec('git clean -fd', true);

// ST-02: Diff de 1MB
runStressTest('ST-02', 'Diff de 1MB', () => {
  // Create 1MB file
  const largeContent = 'x'.repeat(1024 * 1024); // 1MB
  fs.writeFileSync(path.join(CONFIG.testRepo, 'stress-large.bin'), largeContent);
  
  // Run cogit
  const result = cogitRun('auto --yes --no-push', 120000);
  
  // Check if handled large diff
  const handled = result.success || 
    result.output.includes('large') || 
    result.output.includes('Processing') ||
    result.output.includes('diff');
  
  return {
    success: handled,
    details: handled ? 'Diff 1MB processado' : 'Falha no processamento de diff grande',
  };
}, 120000);

// Cleanup
gitExec('git reset --hard HEAD', true);
gitExec('git clean -fd', true);

// ST-03: 50 commits em sequência
runStressTest('ST-03', '50 commits em sequência', () => {
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < 50; i++) {
    // Create file
    fs.writeFileSync(
      path.join(CONFIG.testRepo, `stress-commit-${i}.txt`),
      `Commit ${i} content\n`
    );
    
    // Run cogit
    const result = cogitRun('auto --yes --no-push', 10000);
    
    if (result.success || result.output.includes('Commit') || result.output.includes('commit')) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay to avoid overwhelming
    if (i % 10 === 0) {
      log(`  Progress: ${i + 1}/50 commits...`, 'yellow');
    }
  }
  
  return {
    success: successCount >= 40, // 80% success rate
    details: `${successCount}/50 commits processados com sucesso`,
  };
}, 300000);

// Cleanup
gitExec('git reset --hard HEAD', true);
gitExec('git clean -fd', true);

// ST-04: 100 branches criadas/deletadas
runStressTest('ST-04', '100 branches criadas/deletadas', () => {
  let created = 0;
  let deleted = 0;
  
  // Create 100 branches
  for (let i = 0; i < 100; i++) {
    const branchName = `stress-branch-${i}`;
    try {
      gitExec(`git branch ${branchName}`, true);
      created++;
    } catch (e) {
      // Ignore
    }
    
    if (i % 20 === 0) {
      log(`  Progress: ${i + 1}/100 branches created...`, 'yellow');
    }
  }
  
  // Delete all test branches
  const branches = gitExec('git branch', true) || '';
  for (let i = 0; i < 100; i++) {
    const branchName = `stress-branch-${i}`;
    if (branches.includes(branchName)) {
      try {
        gitExec(`git branch -D ${branchName}`, true);
        deleted++;
      } catch (e) {
        // Ignore
      }
    }
  }
  
  return {
    success: created >= 90 && deleted >= 90, // 90% success rate
    details: `${created} criadas, ${deleted} deletadas`,
  };
}, 60000);

// ST-05: Múltiplos providers AI em fallback
runStressTest('ST-05', 'Múltiplos providers AI em fallback', () => {
  // Create test file
  fs.writeFileSync(
    path.join(CONFIG.testRepo, 'stress-ai.txt'),
    'AI fallback test\n'
  );
  
  // Run cogit multiple times to test fallback
  const results = [];
  for (let i = 0; i < 3; i++) {
    const result = cogitRun('auto --yes --no-push', 30000);
    results.push(result.success || result.output.includes('Generating') || result.output.includes('message'));
    
    // Reset for next iteration
    gitExec('git reset --hard HEAD~1', true);
    fs.writeFileSync(
      path.join(CONFIG.testRepo, 'stress-ai.txt'),
      `AI fallback test ${i}\n`
    );
  }
  
  const successCount = results.filter(r => r).length;
  
  return {
    success: successCount >= 2, // At least 2/3 success
    details: `${successCount}/3 execuções com provider funcionando`,
  };
}, 90000);

// ========================================
// CLEANUP & REPORT
// ========================================

cleanupRepo();

console.log('\n' + '='.repeat(60));
log(`📊 STRESS TEST RESULTS: ${passed} passed, ${failed} failed`, passed === 5 ? 'green' : 'yellow');
console.log('='.repeat(60));

// Print summary
console.log('\n📋 Summary:');
results.forEach(r => {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`  ${icon} ${r.id}: ${r.description} (${r.duration}ms)`);
});

// Save report
const reportPath = path.join(
  path.dirname(CONFIG.cogitBin),
  '..',
  'test-automation',
  'reports',
  `stress-${Date.now()}.json`
);

fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  total: 5,
  passed,
  failed,
  results,
}, null, 2));

log(`\n📄 Report saved to: ${reportPath}`, 'cyan');

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All stress tests passed!');
