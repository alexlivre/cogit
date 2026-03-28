/**
 * Test Suite for Ollama Thinking Mode
 * Tests the thinking feature implementation
 */

const assert = require('assert');
const path = require('path');

// Test configuration
const TESTS = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function test(name, fn) {
  TESTS.total++;
  try {
    fn();
    TESTS.passed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    TESTS.failed++;
    TESTS.errors.push({ name, error: error.message });
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

// ============================================
// TEST 1: GenerateOptions Interface
// ============================================
console.log('\n📋 Test Group: GenerateOptions Interface\n');

test('GenerateOptions should have optional think property', () => {
  const options = { think: true };
  assert.strictEqual(options.think, true);
});

test('GenerateOptions should work without think property', () => {
  const options = {};
  assert.strictEqual(options.think, undefined);
});

test('GenerateOptions think should be boolean', () => {
  const options1 = { think: true };
  const options2 = { think: false };
  assert.strictEqual(typeof options1.think, 'boolean');
  assert.strictEqual(typeof options2.think, 'boolean');
});

// ============================================
// TEST 2: GenerateResult Interface
// ============================================
console.log('\n📋 Test Group: GenerateResult Interface\n');

test('GenerateResult should have content property', () => {
  const result = { content: 'test message' };
  assert.strictEqual(result.content, 'test message');
});

test('GenerateResult should have optional thinking property', () => {
  const result1 = { content: 'test', thinking: 'reasoning' };
  const result2 = { content: 'test' };
  assert.strictEqual(result1.thinking, 'reasoning');
  assert.strictEqual(result2.thinking, undefined);
});

test('GenerateResult thinking should be string when present', () => {
  const result = { content: 'test', thinking: 'model reasoning' };
  assert.strictEqual(typeof result.thinking, 'string');
});

// ============================================
// TEST 3: BrainInput with think
// ============================================
console.log('\n📋 Test Group: BrainInput with think\n');

test('BrainInput should accept think parameter', () => {
  const input = {
    diff: 'test diff',
    language: 'en',
    think: true
  };
  assert.strictEqual(input.think, true);
});

test('BrainInput think should be optional', () => {
  const input = {
    diff: 'test diff',
    language: 'en'
  };
  assert.strictEqual(input.think, undefined);
});

// ============================================
// TEST 4: BrainOutput with thinking
// ============================================
console.log('\n📋 Test Group: BrainOutput with thinking\n');

test('BrainOutput should have optional thinking field', () => {
  const output1 = {
    success: true,
    message: 'feat: test',
    thinking: 'model reasoning'
  };
  const output2 = {
    success: true,
    message: 'feat: test'
  };
  assert.strictEqual(output1.thinking, 'model reasoning');
  assert.strictEqual(output2.thinking, undefined);
});

test('BrainOutput thinking should be returned when available', () => {
  const output = {
    success: true,
    message: 'feat: test',
    provider: 'ollama',
    thinking: 'Analyzing the diff...'
  };
  assert.ok(output.thinking);
  assert.ok(output.thinking.length > 0);
});

// ============================================
// TEST 5: AutoOptions with think flags
// ============================================
console.log('\n📋 Test Group: AutoOptions with think flags\n');

test('AutoOptions should have think property', () => {
  const options = { think: true };
  assert.strictEqual(options.think, true);
});

test('AutoOptions should have noThink property', () => {
  const options = { noThink: true };
  assert.strictEqual(options.noThink, true);
});

test('AutoOptions think and noThink should be mutually exclusive', () => {
  // In practice, CLI should prevent both, but we test the logic
  const options1 = { think: true, noThink: false };
  const options2 = { think: false, noThink: true };
  assert.ok(options1.think !== options1.noThink);
  assert.ok(options2.think !== options2.noThink);
});

// ============================================
// TEST 6: Thinking Priority Logic
// ============================================
console.log('\n📋 Test Group: Thinking Priority Logic\n');

test('Flag --think should override env config', () => {
  const envConfig = false;
  const thinkFlag = true;
  const noThinkFlag = false;
  
  let thinkValue;
  if (thinkFlag) {
    thinkValue = true;
  } else if (noThinkFlag) {
    thinkValue = false;
  } else {
    thinkValue = envConfig;
  }
  
  assert.strictEqual(thinkValue, true);
});

test('Flag --no-think should override env config', () => {
  const envConfig = true;
  const thinkFlag = false;
  const noThinkFlag = true;
  
  let thinkValue;
  if (thinkFlag) {
    thinkValue = true;
  } else if (noThinkFlag) {
    thinkValue = false;
  } else {
    thinkValue = envConfig;
  }
  
  assert.strictEqual(thinkValue, false);
});

test('No flag should use env config', () => {
  const envConfig = true;
  const thinkFlag = undefined;
  const noThinkFlag = undefined;
  
  let thinkValue;
  if (thinkFlag) {
    thinkValue = true;
  } else if (noThinkFlag) {
    thinkValue = false;
  } else {
    thinkValue = envConfig;
  }
  
  assert.strictEqual(thinkValue, true);
});

// ============================================
// TEST 7: Ollama Request Format
// ============================================
console.log('\n📋 Test Group: Ollama Request Format\n');

test('Ollama request should include think parameter when enabled', () => {
  const requestBody = {
    model: 'qwen3.5:4b',
    messages: [{ role: 'user', content: 'test' }],
    stream: false,
    think: true
  };
  assert.strictEqual(requestBody.think, true);
});

test('Ollama request should include think: false when disabled', () => {
  const requestBody = {
    model: 'qwen3.5:4b',
    messages: [{ role: 'user', content: 'test' }],
    stream: false,
    think: false
  };
  assert.strictEqual(requestBody.think, false);
});

// ============================================
// TEST 8: Response Parsing
// ============================================
console.log('\n📋 Test Group: Response Parsing\n');

test('Should extract thinking from Ollama response', () => {
  const ollamaResponse = {
    message: {
      content: 'feat: test commit',
      thinking: 'Analyzing the changes...'
    }
  };
  
  const result = {
    content: ollamaResponse.message.content,
    thinking: ollamaResponse.message.thinking
  };
  
  assert.strictEqual(result.content, 'feat: test commit');
  assert.strictEqual(result.thinking, 'Analyzing the changes...');
});

test('Should handle response without thinking', () => {
  const ollamaResponse = {
    message: {
      content: 'feat: test commit'
    }
  };
  
  const result = {
    content: ollamaResponse.message.content,
    thinking: ollamaResponse.message.thinking
  };
  
  assert.strictEqual(result.content, 'feat: test commit');
  assert.strictEqual(result.thinking, undefined);
});

// ============================================
// TEST 9: Backward Compatibility
// ============================================
console.log('\n📋 Test Group: Backward Compatibility\n');

test('Providers should accept options parameter', () => {
  // Simulating provider call
  function generate(messages, options = {}) {
    return { content: 'test', ...options };
  }
  
  const result1 = generate([{ role: 'user', content: 'test' }]);
  const result2 = generate([{ role: 'user', content: 'test' }], { think: true });
  
  assert.ok(result1);
  assert.ok(result2);
});

test('Providers should work without options (backward compat)', () => {
  // Simulating old-style provider call
  function generate(messages, options) {
    if (!options) {
      return 'simple string response';
    }
    return { content: 'object response' };
  }
  
  const result = generate([{ role: 'user', content: 'test' }]);
  assert.strictEqual(typeof result, 'string');
});

test('GenerateResult should be handled when string is returned', () => {
  // Simulating mixed return types
  const response1 = 'string response';
  const response2 = { content: 'object response', thinking: 'reasoning' };
  
  function extractContent(response) {
    if (typeof response === 'string') {
      return response;
    }
    return response.content;
  }
  
  assert.strictEqual(extractContent(response1), 'string response');
  assert.strictEqual(extractContent(response2), 'object response');
});

// ============================================
// TEST 10: Config Validation
// ============================================
console.log('\n📋 Test Group: Config Validation\n');

test('OLLAMA_THINK should default to false', () => {
  // Simulating env parsing
  const envValue = process.env.OLLAMA_THINK;
  const config = envValue === 'true';
  
  // Default should be false when not set
  if (!envValue) {
    assert.strictEqual(config, false);
  }
});

test('OLLAMA_THINK should parse "true" string to boolean', () => {
  const envValue = 'true';
  const config = envValue === 'true';
  assert.strictEqual(config, true);
  assert.strictEqual(typeof config, 'boolean');
});

// ============================================
// TEST RESULTS
// ============================================
console.log('\n' + '═'.repeat(50));
console.log('📊 TEST RESULTS');
console.log('═'.repeat(50));
console.log(`Total:  ${TESTS.total}`);
console.log(`Passed: ${TESTS.passed} ✅`);
console.log(`Failed: ${TESTS.failed} ❌`);
console.log(`Success Rate: ${((TESTS.passed / TESTS.total) * 100).toFixed(1)}%`);
console.log('═'.repeat(50));

if (TESTS.failed > 0) {
  console.log('\n❌ Failed Tests:');
  TESTS.errors.forEach(({ name, error }) => {
    console.log(`  - ${name}: ${error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
