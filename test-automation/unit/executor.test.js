/**
 * Unit Tests for Executor Module (Task F0.1)
 * Tests safeExec (no-shell spawn) and stdin input support.
 *
 * Convention: Node + assert, imports from dist/ (compiled module).
 * Run with: npm run build && node test-automation/unit/executor.test.js
 */

const assert = require('assert');
const path = require('path');

const { safeExec, execCommand, execCommandTrimmed, safeExecGit } = require('../../dist/utils/executor.js');
const { platform } = require('../../dist/utils/platform.js');

console.log('🧪 Running Unit Tests for Executor (F0.1)\n');

let passed = 0;
let failed = 0;
const queue = [];

function test(name, fn) {
  queue.push(
    (async () => {
      try {
        await fn();
        console.log(`✅ ${name}`);
        passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        if (error.stack) console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        failed++;
      }
    })()
  );
}

// ============================================
// safeExec — spawn-based, shell: false
// ============================================

console.log('📦 safeExec (no-shell spawn)\n');

test('E1: safeExec runs command and returns stdout', async () => {
  const result = await safeExec('node', ['-e', `process.stdout.write('hello-from-safeexec')`]);
  assert.strictEqual(result.stdout, 'hello-from-safeexec');
  assert.strictEqual(result.stderr, '');
});

test('E2: safeExec with input writes data to stdin (no shell)', async () => {
  // Script reads stdin and echoes uppercase. With shell: false, args are passed as-is.
  const script = `let d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{process.stdout.write(Buffer.concat(d).toString().toUpperCase())});`;
  const result = await safeExec('node', ['-e', script], { input: 'stdin-payload' });
  assert.strictEqual(result.stdout, 'STDIN-PAYLOAD');
});

test('E3: safeExec preserves args with spaces and $ literally (shell:false proof)', async () => {
  // If shell were true:
  //   - 'arg with space' would be split into multiple argv entries
  //   - 'another $literal' would undergo variable expansion (becomes empty on most shells)
  // With shell:false, each arg survives as one argv element, untouched.
  // Note: with `node -e SCRIPT`, the SCRIPT is consumed by -e and is NOT in process.argv;
  // additional args start at process.argv[1].
  const result = await safeExec('node', [
    '-e',
    'process.stdout.write(JSON.stringify(process.argv.slice(1)))',
    'arg with space',
    'another $literal',
  ]);
  const parsed = JSON.parse(result.stdout);
  const argSet = new Set(parsed);
  assert.ok(argSet.has('arg with space'),
    `space-containing arg was split by shell: ${JSON.stringify(parsed)}`);
  assert.ok(argSet.has('another $literal'),
    `$ literal was expanded or stripped: ${JSON.stringify(parsed)}`);
});

test('E4: safeExec returns stderr as a string even on success', async () => {
  const result = await safeExec('node', ['-e', `process.stdout.write('out');process.stderr.write('noise')`]);
  assert.strictEqual(result.stdout, 'out');
  assert.strictEqual(result.stderr, 'noise');
});

test('E5: safeExec rejects on non-zero exit code', async () => {
  let threw = false;
  try {
    await safeExec('node', ['-e', `process.exit(7)`]);
  } catch (e) {
    threw = true;
    assert.ok(e instanceof Error, 'should throw Error');
    assert.ok(/exit code/i.test(e.message) || /Command failed/.test(e.message),
      `error message should mention failure, got: ${e.message}`);
  }
  assert.ok(threw, 'safeExec must throw on non-zero exit');
});

test('E6: safeExec empty args array still works for commands that take none', async () => {
  const result = await safeExec('node', ['--version']);
  assert.ok(/^v\d+\./.test(result.stdout.trim()), `expected version like vX.Y.Z, got: ${result.stdout}`);
});

test('E7: safeExec honors cwd option', async () => {
  const result = await safeExec('node', ['-e', `process.stdout.write(process.cwd())`], {
    cwd: __dirname,
  });
  // On Windows the path is normalized but should still equal the dir we passed.
  assert.strictEqual(path.normalize(result.stdout), path.normalize(__dirname));
});

// ============================================
// execCommand — backward compat + input routing
// ============================================

console.log('\n📦 execCommand (backward compat + input routing)\n');

test('E8: execCommand without input keeps current shell-based behavior', async () => {
  // Backward compat: shell-based exec still works for simple commands.
  // Use node -e which both shell-based exec and spawn-based safeExec can run.
  const result = await execCommand(`node -e "process.stdout.write('compat')"`);
  assert.strictEqual(result.stdout, 'compat');
});

test('E9: execCommand with input routes through safeExec (stdin pipe)', async () => {
  // When input is provided, execCommand must parse + route to safeExec which pipes stdin.
  // Using a single-statement script avoids whitespace-split problems in the parser.
  const result = await execCommand('node -e process.stdin.pipe(process.stdout)', { input: 'routed-via-stdin' });
  assert.strictEqual(result.stdout, 'routed-via-stdin');
});

test('E10: input with shell metacharacters is never interpreted as a command', async () => {
  // SECURITY: payload that would be catastrophic if interpreted by a shell
  // must reach the child as a literal string via stdin only.
  const payload = '; rm -rf /tmp/nope ; calc.exe & echo PWNED';
  const result = await execCommand('node -e process.stdin.pipe(process.stdout)', { input: payload });
  assert.strictEqual(result.stdout, payload, 'payload must be echoed literally, not executed');
  assert.ok(!result.stdout.includes('PWNED') || result.stdout === payload,
    'no part of the payload should be interpreted as a separate command');
});

test('E10b: safeExec preserves cwd across the spawn boundary', async () => {
  // cwd must be honored even when input is provided (spawn uses { cwd } option).
  const result = await execCommand(
    'node -e process.stdout.write(process.cwd())',
    { input: '', cwd: __dirname },
  );
  assert.strictEqual(path.normalize(result.stdout), path.normalize(__dirname));
});

test('E11: execCommand rejects on non-zero exit and includes stderr in message', async () => {
  let threw = false;
  try {
    await execCommand(`node -e "process.stderr.write('boom');process.exit(3)"`);
  } catch (e) {
    threw = true;
    assert.ok(e instanceof Error);
    assert.ok(e.message.includes('boom'), `error should contain stderr 'boom', got: ${e.message}`);
  }
  assert.ok(threw, 'execCommand must throw on non-zero exit');
});

test('E12: execCommand rejects on timeout', async () => {
  let threw = false;
  try {
    // Script sleeps 2s; we give it 200ms.
    await execCommand(`node -e "setTimeout(()=>{},2000)"`, { timeout: 200 });
  } catch (e) {
    threw = true;
    assert.ok(e instanceof Error);
    assert.ok(/timeout|timed out|killed/i.test(e.message),
      `error should mention timeout, got: ${e.message}`);
  }
  assert.ok(threw, 'execCommand must throw on timeout');
});

test('E13: execCommandTrimmed returns trimmed stdout', async () => {
  const out = await execCommandTrimmed(`node -e "process.stdout.write('  padded  ')"`);
  assert.strictEqual(out, 'padded');
});

// ============================================
// safeExec — maxBuffer + safeExecGit (carryover from F0.1 review)
// ============================================

console.log('\n📦 safeExec maxBuffer + safeExecGit\n');

test('E15: safeExec rejects with overflow error when stdout exceeds maxBuffer', async () => {
  // Spawn a child that emits > maxBuffer bytes. The Promise must reject and
  // the underlying child must be killed so it cannot keep producing output.
  const chunk = 'x'.repeat(1024);
  const totalChunks = 200; // 200 KiB total
  const script = `for(let i=0;i<${totalChunks};i++){process.stdout.write('${chunk}')}`;
  let threw = false;
  try {
    await safeExec('node', ['-e', script], { maxBuffer: 4 * 1024 });
  } catch (e) {
    threw = true;
    assert.ok(e instanceof Error, 'should throw Error');
    assert.ok(/maxBuffer/i.test(e.message),
      `error should mention maxBuffer, got: ${e.message}`);
  }
  assert.ok(threw, 'safeExec must throw when output exceeds maxBuffer');
});

test('E16: safeExecGit delegates to safeExec with platform.getGitCommand()', async () => {
  // Use a stable git invocation. --version exits 0 and produces predictable stdout.
  const result = await safeExecGit(['--version']);
  assert.ok(/^git version /m.test(result.stdout),
    `expected git version output, got: ${JSON.stringify(result.stdout)}`);
  // Verify the helper would call the platform's git command name.
  // We can't introspect safeExec directly, but we can run the same args through
  // safeExec with the same command and assert identical behavior shape.
  const direct = await safeExec(platform.getGitCommand(), ['--version']);
  assert.strictEqual(result.stdout, direct.stdout,
    'safeExecGit stdout should match safeExec(platform.getGitCommand(), ...)');
});

test('E17: safeExec passes normally when output is below maxBuffer', async () => {
  // Default behavior should be unchanged for normal-sized output.
  const result = await safeExec('node', ['-e', `process.stdout.write('within-budget')`], {
    maxBuffer: 1024 * 1024,
  });
  assert.strictEqual(result.stdout, 'within-budget');
  assert.strictEqual(result.stderr, '');
});

// ============================================
// SUMMARY
// ============================================

(async () => {
  await Promise.all(queue);
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n✅ All executor tests passed!');
})();
