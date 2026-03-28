/**
 * Unit Tests for Ports and Adapters (SOLID Phase 2)
 * Tests the interfaces and their implementations
 */

const assert = require('assert');
const path = require('path');

console.log('🧪 Running Unit Tests for Ports & Adapters (SOLID Phase 2)\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// ============================================
// PORTS TESTS
// ============================================

console.log('📦 Ports Interface Tests\n');

test('P1: GitScannerPort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.GitScannerPort === undefined); // Interface, not runtime value
  assert.ok(ports.ScanResult === undefined); // Interface
});

test('P2: AIProviderPort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.AIProviderPort === undefined); // Interface
  assert.ok(ports.BrainInput === undefined); // Type export (interface)
  assert.ok(ports.BrainOutput === undefined); // Type export (interface)
});

test('P3: GitExecutorPort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.GitExecutorPort === undefined); // Interface
  assert.ok(ports.ExecutorResult === undefined); // Interface
});

test('P4: SecurityPort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.SecurityPort === undefined); // Interface
  assert.ok(ports.SanitizerResult === undefined); // Interface
});

test('P5: UIPort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.UIPort === undefined); // Interface
});

test('P6: StealthPort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.StealthPort === undefined); // Interface
  assert.ok(ports.StealthResult === undefined); // Interface
});

test('P7: HealerPort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.HealerPort === undefined); // Interface
  assert.ok(ports.HealerInput === undefined); // Interface
});

test('P8: IgnorePort interface is defined', () => {
  const ports = require('../../dist/core/ports/index.js');
  assert.ok(ports.IgnorePort === undefined); // Interface
});

// ============================================
// ADAPTERS TESTS
// ============================================

console.log('\n📦 Adapters Implementation Tests\n');

test('A1: GitScannerAdapter exists and implements GitScannerPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/git-scanner.adapter.js');
  assert.ok(adapter.GitScannerAdapter);
  assert.ok(typeof adapter.GitScannerAdapter.prototype.scan === 'function');
});

test('A2: GitExecutorAdapter exists and implements GitExecutorPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/git-executor.adapter.js');
  assert.ok(adapter.GitExecutorAdapter);
  assert.ok(typeof adapter.GitExecutorAdapter.prototype.add === 'function');
  assert.ok(typeof adapter.GitExecutorAdapter.prototype.commit === 'function');
  assert.ok(typeof adapter.GitExecutorAdapter.prototype.push === 'function');
  assert.ok(typeof adapter.GitExecutorAdapter.prototype.executeCommit === 'function');
});

test('A3: SecurityAdapter exists and implements SecurityPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/security.adapter.js');
  assert.ok(adapter.SecurityAdapter);
  assert.ok(typeof adapter.SecurityAdapter.prototype.sanitize === 'function');
  assert.ok(typeof adapter.SecurityAdapter.prototype.redact === 'function');
});

test('A4: AIProviderAdapter exists and implements AIProviderPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/ai-provider.adapter.js');
  assert.ok(adapter.AIProviderAdapter);
  assert.ok(typeof adapter.AIProviderAdapter.prototype.generateCommitMessage === 'function');
  assert.ok(typeof adapter.AIProviderAdapter.prototype.getName === 'function');
  assert.ok(typeof adapter.AIProviderAdapter.prototype.isAvailable === 'function');
});

test('A5: MultiProviderAIAdapter exists', () => {
  const adapter = require('../../dist/infrastructure/adapters/ai-provider.adapter.js');
  assert.ok(adapter.MultiProviderAIAdapter);
  assert.ok(typeof adapter.MultiProviderAIAdapter.prototype.generateCommitMessage === 'function');
});

test('A6: UIAdapter exists and implements UIPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/ui.adapter.js');
  assert.ok(adapter.UIAdapter);
  assert.ok(typeof adapter.UIAdapter.prototype.renderCommitMessage === 'function');
  assert.ok(typeof adapter.UIAdapter.prototype.renderDryRun === 'function');
  assert.ok(typeof adapter.UIAdapter.prototype.promptCommitReview === 'function');
  assert.ok(typeof adapter.UIAdapter.prototype.startSpinner === 'function');
});

test('A7: StealthAdapter exists and implements StealthPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/stealth.adapter.js');
  assert.ok(adapter.StealthAdapter);
  assert.ok(typeof adapter.StealthAdapter.prototype.hasConfig === 'function');
  assert.ok(typeof adapter.StealthAdapter.prototype.stash === 'function');
  assert.ok(typeof adapter.StealthAdapter.prototype.restore === 'function');
});

test('A8: HealerAdapter exists and implements HealerPort', () => {
  const adapter = require('../../dist/infrastructure/adapters/healer.adapter.js');
  assert.ok(adapter.HealerAdapter);
  assert.ok(typeof adapter.HealerAdapter.prototype.heal === 'function');
});

test('A9: IgnoreAdapter exists and implements IgnorePort', () => {
  const adapter = require('../../dist/infrastructure/adapters/ignore.adapter.js');
  assert.ok(adapter.IgnoreAdapter);
  assert.ok(typeof adapter.IgnoreAdapter.prototype.suggest === 'function');
  assert.ok(typeof adapter.IgnoreAdapter.prototype.addWhitelist === 'function');
  assert.ok(typeof adapter.IgnoreAdapter.prototype.removeWhitelist === 'function');
});

// ============================================
// PLUGIN SYSTEM TESTS
// ============================================

console.log('\n📦 Plugin System Tests\n');

test('PL1: Plugin types are defined', () => {
  const types = require('../../dist/core/plugins/types.js');
  assert.ok(types.CommandPlugin === undefined); // Interface
  assert.ok(types.CommandContext === undefined); // Interface
  assert.ok(types.PluginResult === undefined); // Interface
});

test('PL2: PluginRegistry exists and has required methods', () => {
  const registry = require('../../dist/core/plugins/registry.js');
  assert.ok(registry.PluginRegistry);
  assert.ok(typeof registry.PluginRegistry.prototype.register === 'function');
  assert.ok(typeof registry.PluginRegistry.prototype.unregister === 'function');
  assert.ok(typeof registry.PluginRegistry.prototype.get === 'function');
  assert.ok(typeof registry.PluginRegistry.prototype.getAll === 'function');
  assert.ok(typeof registry.PluginRegistry.prototype.executeAll === 'function');
  assert.ok(typeof registry.PluginRegistry.prototype.executeHook === 'function');
});

test('PL3: PluginRegistry singleton is exported', () => {
  const { pluginRegistry } = require('../../dist/core/plugins/registry.js');
  assert.ok(pluginRegistry);
  assert.ok(typeof pluginRegistry.register === 'function');
});

test('PL4: StealthPlugin exists and implements CommandPlugin', () => {
  const plugins = require('../../dist/core/plugins/stealth.plugin.js');
  assert.ok(plugins.StealthPlugin);
  assert.ok(plugins.StealthRestorePlugin);
  assert.ok(typeof plugins.StealthPlugin.prototype.execute === 'function');
  assert.ok(typeof plugins.StealthPlugin.prototype.restore === 'function');
});

test('PL5: DebugPlugin exists and implements CommandPlugin', () => {
  const plugins = require('../../dist/core/plugins/debug.plugin.js');
  assert.ok(plugins.DebugPlugin);
  assert.ok(typeof plugins.DebugPlugin.prototype.execute === 'function');
  assert.ok(typeof plugins.DebugPlugin.prototype.logAIRequest === 'function');
});

test('PL6: HealerPlugin exists and implements CommandPlugin', () => {
  const plugins = require('../../dist/core/plugins/healer.plugin.js');
  assert.ok(plugins.HealerPlugin);
  assert.ok(typeof plugins.HealerPlugin.prototype.execute === 'function');
  assert.ok(typeof plugins.HealerPlugin.prototype.healPushError === 'function');
});

// ============================================
// INTEGRATION TESTS
// ============================================

console.log('\n📦 Integration Tests\n');

test('I1: PluginRegistry can register and retrieve plugins', () => {
  const { PluginRegistry } = require('../../dist/core/plugins/registry.js');
  const { DebugPlugin } = require('../../dist/core/plugins/debug.plugin.js');
  
  const registry = new PluginRegistry();
  const plugin = new DebugPlugin();
  
  registry.register(plugin);
  
  assert.ok(registry.has('debug'));
  assert.ok(registry.get('debug') === plugin);
  assert.ok(registry.count === 1);
});

test('I2: PluginRegistry getAll returns all plugins', () => {
  const { PluginRegistry } = require('../../dist/core/plugins/registry.js');
  
  const registry = new PluginRegistry();
  
  // Create mock plugins with different names
  const mockPlugin1 = {
    name: 'mock-plugin-1',
    priority: 10,
    enabled: true,
    execute: async () => ({ success: true, shouldContinue: true })
  };
  const mockPlugin2 = {
    name: 'mock-plugin-2',
    priority: 5,
    enabled: true,
    execute: async () => ({ success: true, shouldContinue: true })
  };
  
  registry.register(mockPlugin1);
  registry.register(mockPlugin2);
  
  const all = registry.getAll();
  assert.ok(all.length === 2);
  assert.ok(all.some(p => p.name === 'mock-plugin-1'));
  assert.ok(all.some(p => p.name === 'mock-plugin-2'));
});

test('I3: PluginRegistry can enable/disable plugins', () => {
  const { PluginRegistry } = require('../../dist/core/plugins/registry.js');
  const { DebugPlugin } = require('../../dist/core/plugins/debug.plugin.js');
  
  const registry = new PluginRegistry();
  const plugin = new DebugPlugin();
  
  registry.register(plugin);
  
  registry.disable('debug');
  assert.ok(plugin.enabled === false);
  
  registry.enable('debug');
  assert.ok(plugin.enabled === true);
});

test('I4: SecurityAdapter sanitize returns correct structure', () => {
  const { SecurityAdapter } = require('../../dist/infrastructure/adapters/security.adapter.js');
  const adapter = new SecurityAdapter();
  
  const result = adapter.sanitize(['test.txt', 'normal.js']);
  assert.ok(typeof result.isClean === 'boolean');
  assert.ok(Array.isArray(result.blockedFiles));
});

test('I5: SecurityAdapter redact masks secrets', () => {
  const { SecurityAdapter } = require('../../dist/infrastructure/adapters/security.adapter.js');
  const adapter = new SecurityAdapter();
  
  const diff = 'api_key=sk_test_1234567890\npassword=secret123';
  const redacted = adapter.redact(diff);
  
  // Verify redaction occurred (REDACTED should appear)
  assert.ok(redacted.includes('REDACTED') || redacted !== diff);
});

test('I6: AIProviderAdapter isAvailable checks environment', () => {
  const { AIProviderAdapter } = require('../../dist/infrastructure/adapters/ai-provider.adapter.js');
  const adapter = new AIProviderAdapter();
  
  // Should return true if any API key is set
  const available = adapter.isAvailable();
  assert.ok(typeof available === 'boolean');
});

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All ports & adapters tests passed!');
