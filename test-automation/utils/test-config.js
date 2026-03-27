/**
 * Test Configuration for Cogit CLI
 * Centralized configuration for all test suites
 */

const path = require('path');

const config = {
  // Paths
  testRepo: 'C:/code/github/teste',
  cogitPath: 'C:/code/github/cogit',
  distPath: path.join('C:/code/github/cogit', 'dist'),
  reportsPath: path.join('C:/code/github/cogit', 'test-automation', 'reports'),
  
  // Timeouts (in milliseconds)
  timeout: {
    short: 5000,      // Quick operations
    medium: 30000,    // Normal operations (AI calls)
    long: 60000,      // Long operations (push, healer)
    stress: 120000    // Stress tests
  },
  
  // AI Configuration
  ai: {
    provider: 'openrouter',
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
    apiKey: process.env.OPENROUTER_API_KEY
  },
  
  // Languages to test
  languages: ['en', 'pt'],
  
  // Test execution options
  execution: {
    parallel: false,        // Run tests sequentially
    stopOnFailure: false,   // Continue even if tests fail
    verbose: true,          // Detailed output
    cleanup: true           // Clean up after tests
  },
  
  // Stress test parameters
  stress: {
    largeDiff: {
      sizes: [100 * 1024, 1024 * 1024, 10 * 1024 * 1024], // 100KB, 1MB, 10MB
      descriptions: ['100KB', '1MB', '10MB']
    },
    manyFiles: {
      counts: [10, 50, 100, 500],
      descriptions: ['10 files', '50 files', '100 files', '500 files']
    }
  },
  
  // Security test patterns
  security: {
    blockedFiles: [
      '.env',
      '.env.local',
      '.env.production',
      'id_rsa',
      'id_rsa.pub',
      '.aws/credentials',
      '.bash_history',
      '.zsh_history',
      'secrets.yaml',
      'secrets.json',
      '*.pem',
      '*.key',
      '*.keystore'
    ],
    secretPatterns: [
      { name: 'API Key', pattern: /sk-[a-zA-Z0-9]{20,}/g },
      { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g },
      { name: 'AWS Access Key', pattern: /AKIA[A-Z0-9]{16}/g },
      { name: 'Password', pattern: /password\s*[:=]\s*['"]([^'"]+)['"]/gi },
      { name: 'Generic Secret', pattern: /secret\s*[:=]\s*['"]([^'"]+)['"]/gi }
    ]
  },
  
  // Conventional commit types
  commitTypes: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'],
  
  // Branch names for testing
  testBranches: {
    feature: 'test-feature-branch',
    bugfix: 'test-bugfix-branch',
    release: 'test-release-branch',
    hotfix: 'test-hotfix-branch'
  },
  
  // Tag names for testing
  testTags: {
    annotated: 'v-test-1.0.0',
    lightweight: 'test-lightweight-tag',
    semantic: ['v-test-1.0.0', 'v-test-1.1.0', 'v-test-2.0.0']
  },
  
  // Confirmation code settings
  confirmation: {
    length: 4,
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  },
  
  // Git Healer settings
  healer: {
    maxAttempts: 3,
    blockedCommands: [
      '--force',
      'reset --hard',
      'clean -fd',
      'push --force'
    ]
  },
  
  // Report settings
  report: {
    format: 'json',
    includeOutput: false,     // Include command output in report
    includeStackTraces: true, // Include error stack traces
    compareWithPrevious: true // Compare with previous test run
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-separated path (e.g., 'timeout.medium')
 * @returns {*} Configuration value
 */
function getConfig(path) {
  const parts = path.split('.');
  let value = config;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Validate test environment
 * @returns {Object} Validation result
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  
  // Check if cogit is built
  const fs = require('fs');
  const distPath = config.distPath;
  
  if (!fs.existsSync(distPath)) {
    errors.push('Cogit dist/ directory not found. Run "npm run build" first.');
  }
  
  // Check if test repo exists
  if (!fs.existsSync(config.testRepo)) {
    warnings.push(`Test repository not found at ${config.testRepo}. It will be created during tests.`);
  }
  
  // Check API key
  if (!config.ai.apiKey) {
    warnings.push('OPENROUTER_API_KEY not set. AI-dependent tests may fail.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create test repository if it doesn't exist
 * @returns {boolean} True if created or already exists
 */
function ensureTestRepo() {
  const fs = require('fs');
  const { execSync } = require('child_process');
  
  if (!fs.existsSync(config.testRepo)) {
    fs.mkdirSync(config.testRepo, { recursive: true });
    
    try {
      execSync('git init', { cwd: config.testRepo, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: config.testRepo, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: config.testRepo, stdio: 'pipe' });
      
      // Create initial commit
      const readmePath = path.join(config.testRepo, 'README.md');
      fs.writeFileSync(readmePath, '# Test Repository\n\nThis is a test repository for Cogit CLI.\n');
      execSync('git add README.md', { cwd: config.testRepo, stdio: 'pipe' });
      execSync('git commit -m "Initial commit"', { cwd: config.testRepo, stdio: 'pipe' });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize test repository:', error.message);
      return false;
    }
  }
  
  return true;
}

module.exports = {
  config,
  getConfig,
  validateEnvironment,
  ensureTestRepo
};
