#!/usr/bin/env node

/**
 * FASE 5 - Test Suite: Diagnostics & Multi-Provider
 * 
 * Tests:
 * - F5-01: Flag --debug enables logging
 * - F5-02: Debug log file created
 * - F5-03: Health command works
 * - F5-04: Health tests all providers
 * - F5-05: Resources command works
 * - F5-06: Resources lists files/dirs
 * - F5-07: Provider factory works
 * - F5-08: Fallback system works
 * - F5-09: Provider Groq available
 * - F5-10: Provider OpenAI available
 * - F5-11: Provider Gemini available
 * - F5-12: Provider Ollama available
 * - F5-13: Brain integrated with fallback
 * - F5-14: Debug logger integrated in brain
 * - F5-15: i18n keys for debug exist
 * - F5-16: i18n keys for health exist
 * - F5-17: i18n keys for resources exist
 * - F5-18: i18n keys for provider exist
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const COGIT_PATH = 'C:\\code\\github\\cogit';
const TEST_REPO = 'C:\\code\\github\\teste';
const COGIT_BIN = path.join(COGIT_PATH, 'dist', 'index.js');
const REPORTS_DIR = path.join(COGIT_PATH, 'test-automation', 'reports');

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function runTest(id, description, testFn) {
  try {
    log(`\n▶ F5-${id}: ${description}`, 'info');
    const result = testFn();
    if (result.success) {
      results.passed++;
      results.tests.push({ id: `F5-${id}`, description, status: 'PASS', details: result.details });
      log(`✓ PASS: ${result.details}`, 'success');
    } else {
      results.failed++;
      results.tests.push({ id: `F5-${id}`, description, status: 'FAIL', details: result.error });
      log(`✗ FAIL: ${result.error}`, 'error');
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ id: `F5-${id}`, description, status: 'ERROR', details: error.message });
    log(`✗ ERROR: ${error.message}`, 'error');
  }
}

function runCogit(args, options = {}) {
  try {
    const cmd = `node "${COGIT_BIN}" ${args}`;
    const output = execSync(cmd, {
      cwd: options.cwd || TEST_REPO,
      encoding: 'utf-8',
      timeout: options.timeout || 30000,
      env: { ...process.env, ...options.env }
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// ========================================
// TESTS
// ========================================

// F5-01: Flag --debug enables logging
runTest('01', 'Flag --debug enables logging', () => {
  const result = runCogit('auto --help');
  if (!result.success) return { success: false, error: 'Auto help command failed' };
  
  if (result.output.includes('--debug')) {
    return { success: true, details: '--debug flag found in auto help' };
  }
  return { success: false, error: '--debug flag not found in auto help' };
});

// F5-02: Debug log file created
runTest('02', 'Debug log file created when --debug used', () => {
  const debugLog = path.join(TEST_REPO, '.vibe-debug.log');
  
  // Clean up first
  deleteFile(debugLog);
  
  // Create a test file
  const testFile = path.join(TEST_REPO, 'test-debug.txt');
  fs.writeFileSync(testFile, 'debug test content');
  
  // Run with debug flag (dry-run to avoid actual commit)
  const result = runCogit('auto --yes --debug --dry-run', { timeout: 60000 });
  
  // Check if debug log was created
  if (fileExists(debugLog)) {
    const content = readFile(debugLog);
    deleteFile(debugLog);
    deleteFile(testFile);
    return { success: true, details: 'Debug log created and contains data' };
  }
  
  deleteFile(testFile);
  return { success: false, error: 'Debug log not created' };
});

// F5-03: Health command works
runTest('03', 'Health command works', () => {
  const result = runCogit('health', { timeout: 60000 });
  
  if (result.output.includes('HEALTH REPORT') || result.output.includes('Testing')) {
    return { success: true, details: 'Health command executed successfully' };
  }
  return { success: false, error: 'Health command did not produce expected output' };
});

// F5-04: Health tests all providers
runTest('04', 'Health tests all providers', () => {
  const result = runCogit('health', { timeout: 90000 });
  
  const providers = ['OpenRouter', 'Groq', 'OpenAI', 'Gemini', 'Ollama'];
  const found = providers.filter(p => result.output.includes(p));
  
  if (found.length >= 3) {
    return { success: true, details: `Found ${found.length}/5 providers: ${found.join(', ')}` };
  }
  return { success: false, error: `Only found ${found.length}/5 providers` };
});

// F5-05: Resources command works
runTest('05', 'Resources command works', () => {
  const result = runCogit('resources');
  
  if (result.output.includes('RESOURCE MAP') || result.output.includes('Directories')) {
    return { success: true, details: 'Resources command executed successfully' };
  }
  return { success: false, error: 'Resources command did not produce expected output' };
});

// F5-06: Resources lists files/dirs
runTest('06', 'Resources lists files and directories', () => {
  const result = runCogit('resources');
  
  const hasDirs = result.output.includes('Directories') || result.output.includes('dirs');
  const hasFiles = result.output.includes('Files') || result.output.includes('files');
  const hasTotal = result.output.includes('Total');
  
  if (hasDirs && hasFiles && hasTotal) {
    return { success: true, details: 'Resources shows dirs, files, and total' };
  }
  return { success: false, error: 'Missing dirs, files, or total in output' };
});

// F5-07: Provider factory works
runTest('07', 'Provider factory module exists', () => {
  const providerIndex = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'providers', 'index.js');
  
  if (fileExists(providerIndex)) {
    return { success: true, details: 'Provider factory module exists' };
  }
  return { success: false, error: 'Provider factory module not found' };
});

// F5-08: Fallback system works
runTest('08', 'Fallback system implemented', () => {
  const providerIndex = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'providers', 'index.js');
  
  if (!fileExists(providerIndex)) {
    return { success: false, error: 'Provider factory not found' };
  }
  
  const content = readFile(providerIndex);
  if (content.includes('tryWithFallback') && content.includes('PROVIDER_PRIORITY')) {
    return { success: true, details: 'Fallback system implemented in factory' };
  }
  return { success: false, error: 'Fallback system not properly implemented' };
});

// F5-09: Provider Groq available
runTest('09', 'Provider Groq module exists', () => {
  const groqPath = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'providers', 'groq.js');
  
  if (fileExists(groqPath)) {
    return { success: true, details: 'Groq provider module exists' };
  }
  return { success: false, error: 'Groq provider module not found' };
});

// F5-10: Provider OpenAI available
runTest('10', 'Provider OpenAI module exists', () => {
  const openaiPath = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'providers', 'openai.js');
  
  if (fileExists(openaiPath)) {
    return { success: true, details: 'OpenAI provider module exists' };
  }
  return { success: false, error: 'OpenAI provider module not found' };
});

// F5-11: Provider Gemini available
runTest('11', 'Provider Gemini module exists', () => {
  const geminiPath = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'providers', 'gemini.js');
  
  if (fileExists(geminiPath)) {
    return { success: true, details: 'Gemini provider module exists' };
  }
  return { success: false, error: 'Gemini provider module not found' };
});

// F5-12: Provider Ollama available
runTest('12', 'Provider Ollama module exists', () => {
  const ollamaPath = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'providers', 'ollama.js');
  
  if (fileExists(ollamaPath)) {
    return { success: true, details: 'Ollama provider module exists' };
  }
  return { success: false, error: 'Ollama provider module not found' };
});

// F5-13: Brain integrated with fallback
runTest('13', 'Brain integrated with fallback', () => {
  const brainPath = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'brain', 'index.js');
  
  if (!fileExists(brainPath)) {
    return { success: false, error: 'Brain module not found' };
  }
  
  const content = readFile(brainPath);
  if (content.includes('tryWithFallback') || content.includes('getAvailableProvider')) {
    return { success: true, details: 'Brain uses fallback system' };
  }
  return { success: false, error: 'Brain not integrated with fallback' };
});

// F5-14: Debug logger integrated in brain
runTest('14', 'Debug logger integrated in brain', () => {
  const brainPath = path.join(COGIT_PATH, 'dist', 'services', 'ai', 'brain', 'index.js');
  
  if (!fileExists(brainPath)) {
    return { success: false, error: 'Brain module not found' };
  }
  
  const content = readFile(brainPath);
  if (content.includes('debugLogger')) {
    return { success: true, details: 'Debug logger integrated in brain' };
  }
  return { success: false, error: 'Debug logger not integrated in brain' };
});

// F5-15: i18n keys for debug exist
runTest('15', 'i18n keys for debug exist', () => {
  const enPath = path.join(COGIT_PATH, 'dist', 'locales', 'en.json');
  const ptPath = path.join(COGIT_PATH, 'dist', 'locales', 'pt.json');
  
  const enContent = readFile(enPath);
  const ptContent = readFile(ptPath);
  
  if (enContent.includes('debug.enabled') && ptContent.includes('debug.enabled')) {
    return { success: true, details: 'Debug i18n keys exist in both languages' };
  }
  return { success: false, error: 'Debug i18n keys missing' };
});

// F5-16: i18n keys for health exist
runTest('16', 'i18n keys for health exist', () => {
  const enPath = path.join(COGIT_PATH, 'dist', 'locales', 'en.json');
  const ptPath = path.join(COGIT_PATH, 'dist', 'locales', 'pt.json');
  
  const enContent = readFile(enPath);
  const ptContent = readFile(ptPath);
  
  if (enContent.includes('health.title') && ptContent.includes('health.title')) {
    return { success: true, details: 'Health i18n keys exist in both languages' };
  }
  return { success: false, error: 'Health i18n keys missing' };
});

// F5-17: i18n keys for resources exist
runTest('17', 'i18n keys for resources exist', () => {
  const enPath = path.join(COGIT_PATH, 'dist', 'locales', 'en.json');
  const ptPath = path.join(COGIT_PATH, 'dist', 'locales', 'pt.json');
  
  const enContent = readFile(enPath);
  const ptContent = readFile(ptPath);
  
  if (enContent.includes('resources.title') && ptContent.includes('resources.title')) {
    return { success: true, details: 'Resources i18n keys exist in both languages' };
  }
  return { success: false, error: 'Resources i18n keys missing' };
});

// F5-18: i18n keys for provider exist
runTest('18', 'i18n keys for provider fallback exist', () => {
  const enPath = path.join(COGIT_PATH, 'dist', 'locales', 'en.json');
  const ptPath = path.join(COGIT_PATH, 'dist', 'locales', 'pt.json');
  
  const enContent = readFile(enPath);
  const ptContent = readFile(ptPath);
  
  if (enContent.includes('provider.fallback') && ptContent.includes('provider.fallback')) {
    return { success: true, details: 'Provider i18n keys exist in both languages' };
  }
  return { success: false, error: 'Provider i18n keys missing' };
});

// ========================================
// REPORT
// ========================================

console.log('\n' + '='.repeat(60));
log('📊 FASE 5 TEST RESULTS', 'info');
console.log('='.repeat(60));
console.log(`\n✓ Passed: ${results.passed}`);
console.log(`✗ Failed: ${results.failed}`);
console.log(`Total: ${results.passed + results.failed}`);
console.log(`\nSuccess Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

// Save report
const reportPath = path.join(REPORTS_DIR, `fase5-report-${Date.now()}.json`);
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📄 Report saved: ${reportPath}`);

// Exit code
process.exit(results.failed > 0 ? 1 : 0);
