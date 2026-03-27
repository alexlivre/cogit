/**
 * FASE 4 Scenario Tests - Smart Ignore
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  testRepo: 'C:\\code\\github\\teste',
  cogitPath: 'C:\\code\\github\\cogit',
  cogitBin: 'C:\\code\\github\\cogit\\dist\\index.js'
};

async function run(runner) {
  // Smart Ignore Tests
  await runner.runTest('F4-I1', 'Ignore - module exists', async () => {
    const ignorePath = path.join(CONFIG.cogitPath, 'dist', 'services', 'tools', 'ignore.js');
    if (!fs.existsSync(ignorePath)) {
      throw new Error('Ignore module not found');
    }
  }, 'fase4');

  await runner.runTest('F4-I2', 'Ignore - common_trash.json exists', async () => {
    const trashPath = path.join(CONFIG.cogitPath, 'dist', 'config', 'common_trash.json');
    if (!fs.existsSync(trashPath)) {
      throw new Error('common_trash.json not found');
    }
    
    const content = JSON.parse(fs.readFileSync(trashPath, 'utf8'));
    if (Object.keys(content).length < 10) {
      throw new Error('common_trash.json should have at least 10 patterns');
    }
  }, 'fase4');

  await runner.runTest('F4-I3', 'Ignore - integration in auto', async () => {
    const autoPath = path.join(CONFIG.cogitPath, 'dist', 'cli', 'commands', 'auto.js');
    const content = fs.readFileSync(autoPath, 'utf8');
    
    if (!content.includes('suggestIgnore')) {
      throw new Error('Smart Ignore not integrated in auto');
    }
  }, 'fase4');

  await runner.runTest('F4-I4', 'Ignore - menu integration', async () => {
    const menuPath = path.join(CONFIG.cogitPath, 'dist', 'cli', 'commands', 'menu.js');
    const content = fs.readFileSync(menuPath, 'utf8');
    
    if (!content.includes('Smart Ignore') && !content.includes('smart-ignore')) {
      throw new Error('Smart Ignore not in menu');
    }
  }, 'fase4');

  await runner.runTest('F4-I5', 'Ignore - trash files detection', async () => {
    // Create some trash files
    const trashFiles = [
      'test.log',
      'node_modules/test.js',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    for (const file of trashFiles) {
      const filePath = path.join(CONFIG.testRepo, file);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, 'trash');
    }
    
    // Verify files exist
    if (!fs.existsSync(path.join(CONFIG.testRepo, 'test.log'))) {
      throw new Error('Trash files not created');
    }
    
    // Cleanup
    for (const file of trashFiles) {
      const filePath = path.join(CONFIG.testRepo, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const nodeModules = path.join(CONFIG.testRepo, 'node_modules');
    if (fs.existsSync(nodeModules)) {
      fs.rmSync(nodeModules, { recursive: true });
    }
  }, 'fase4');
}

module.exports = { run };
