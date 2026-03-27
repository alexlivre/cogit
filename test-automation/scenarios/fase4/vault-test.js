/**
 * FASE 4 Scenario Tests - VibeVault
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  testRepo: 'C:\\code\\github\\teste',
  cogitPath: 'C:\\code\\github\\cogit',
  cogitBin: 'C:\\code\\github\\cogit\\dist\\index.js'
};

async function run(runner) {
  // VibeVault Tests
  await runner.runTest('F4-V1', 'VibeVault - small diff', async () => {
    const filePath = path.join(CONFIG.testRepo, 'small.txt');
    fs.writeFileSync(filePath, 'Small content');
    
    const { execSync } = require('child_process');
    execSync('git add -A', { cwd: CONFIG.testRepo });
    
    const output = execSync(`node "${CONFIG.cogitBin}" auto --yes --no-push`, {
      cwd: CONFIG.testRepo,
      encoding: 'utf8'
    });
    
    fs.unlinkSync(filePath);
  }, 'fase4');

  await runner.runTest('F4-V2', 'VibeVault - large diff (>100KB)', async () => {
    const filePath = path.join(CONFIG.testRepo, 'large.txt');
    const largeContent = 'x'.repeat(150 * 1024); // 150KB
    fs.writeFileSync(filePath, largeContent);
    
    const { execSync } = require('child_process');
    execSync('git add -A', { cwd: CONFIG.testRepo });
    
    const output = execSync(`node "${CONFIG.cogitBin}" auto --yes --no-push`, {
      cwd: CONFIG.testRepo,
      encoding: 'utf8',
      timeout: 60000
    });
    
    fs.unlinkSync(filePath);
  }, 'fase4');

  await runner.runTest('F4-V3', 'VibeVault - module exists', async () => {
    const vaultPath = path.join(CONFIG.cogitPath, 'dist', 'core', 'vault.js');
    if (!fs.existsSync(vaultPath)) {
      throw new Error('Vault module not found');
    }
  }, 'fase4');
}

module.exports = { run };
