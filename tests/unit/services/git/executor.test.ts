import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitCommit } from '../../../../src/services/git/executor';
import * as execUtil from '../../../../src/utils/executor';

vi.mock('../../../../src/utils/executor');

describe('gitCommit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes commit message via stdin to avoid shell injection', async () => {
    vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });

    const malicious = 'feat: $(whoami) `id` "rm -rf"';
    await gitCommit('/tmp/repo', malicious);

    expect(execUtil.safeExecGit).toHaveBeenCalledWith(
      ['commit', '-F', '-'],
      expect.objectContaining({
        cwd: '/tmp/repo',
        input: malicious,
      })
    );
  });

  it('returns success when git commit succeeds', async () => {
    vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: 'committed', stderr: '' });
    const result = await gitCommit('/tmp/repo', 'fix: bug');
    expect(result.success).toBe(true);
    expect(result.output).toBe('committed');
  });

  it('returns failure with error message when git fails', async () => {
    vi.mocked(execUtil.safeExecGit).mockRejectedValue(new Error('nothing to commit'));
    const result = await gitCommit('/tmp/repo', 'fix: bug');
    expect(result.success).toBe(false);
    expect(result.error).toContain('nothing to commit');
  });
});
