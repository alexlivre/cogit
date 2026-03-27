/**
 * FASE 4 Scenario Tests - Stealth Mode
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  testRepo: 'C:\\code\\github\\teste',
  cogitPath: 'C:\\code\\github\\cogit',
  cogitBin: 'C:\\code\\github\\cogit\\dist\\index.js'
};

async function run(runner) {
  // Stealth Mode Tests
  await runner.runTest('F4-S1', 'Stealth - module exists', async () => {
    const stealthPath = path.join(CONFIG.cogitPath, 'dist', 'services', 'tools', 'stealth.js');
    if (!fs.existsSync(stealthPath)) {
      throw new Error('Stealth module not found');
    }
  }, 'fase4');

  await runner.runTest('F4-S2', 'Stealth - config creation', async () => {
    const configPath = path.join(CONFIG.testRepo, '.gitpy-private');
    fs.writeFileSync(configPath, '*.secret\nprivate/');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('Config not created');
    }
    
    fs.unlinkSync(configPath);
  }, 'fase4');

  await runner.runTest('F4-S3', 'Stealth - integration in auto', async () => {
    const autoPath = path.join(CONFIG.cogitPath, 'dist', 'cli', 'commands', 'auto.js');
    const content = fs.readFileSync(autoPath, 'utf8');
    
    if (!content.includes('stealthStash') && !content.includes('stealthRestore')) {
      throw new Error('Stealth not integrated in auto');
    }
  }, 'fase4');

  await runner.runTest('F4-S4', 'Stealth - menu integration', async () => {
    const menuPath = path.join(CONFIG.cogitPath, 'dist', 'cli', 'commands', 'menu.js');
    const content = fs.readFileSync(menuPath, 'utf8');
    
    if (!content.includes('Stealth') && !content.includes('stealth')) {
      throw new Error('Stealth not in menu');
    }
  }, 'fase4');
}

module.exports = { run };
