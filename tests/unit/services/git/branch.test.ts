import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as branch from '../../../../src/services/git/branch';
import * as execUtil from '../../../../src/utils/executor';

vi.mock('../../../../src/utils/executor');
vi.mock('../../../../src/services/network/auto-push');
vi.mock('../../../../src/utils/confirmation', () => ({
  confirmDestructiveOperation: vi.fn(async () => true),
}));

describe('branch.ts validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('switchBranch', () => {
    it('rejects shell injection via branch name', async () => {
      const result = await branch.switchBranch('/tmp/repo', 'evil;rm -rf /', false);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid branch name/);
      expect(execUtil.safeExecGit).not.toHaveBeenCalled();
    });

    it('rejects @{upstream} syntax', async () => {
      const result = await branch.switchBranch('/tmp/repo', '@{upstream}', false);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid branch name/);
    });

    it('rejects --flag-looking names', async () => {
      const result = await branch.switchBranch('/tmp/repo', '--force', false);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid branch name/);
    });

    it('accepts valid names and uses safeExecGit', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      const result = await branch.switchBranch('/tmp/repo', 'feature/auth', false);
      expect(result.success).toBe(true);
      expect(execUtil.safeExecGit).toHaveBeenCalledWith(
        ['checkout', 'feature/auth'],
        expect.objectContaining({ cwd: '/tmp/repo' })
      );
    });
  });

  describe('createBranch', () => {
    it('rejects .evil', async () => {
      const result = await branch.createBranch('/tmp/repo', '.evil', false);
      expect(result.success).toBe(false);
    });

    it('accepts valid names', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      const result = await branch.createBranch('/tmp/repo', 'release-1.0', false);
      expect(result.success).toBe(true);
      expect(execUtil.safeExecGit).toHaveBeenCalledWith(
        ['checkout', '-b', 'release-1.0'],
        expect.any(Object)
      );
    });
  });

  describe('deleteBranch', () => {
    it('rejects --delete', async () => {
      const result = await branch.deleteBranch('/tmp/repo', '--delete', false);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid branch name/);
    });

    it('rejects HEAD', async () => {
      const result = await branch.deleteBranch('/tmp/repo', 'HEAD', false);
      expect(result.success).toBe(false);
    });
  });

  describe('pushBranch', () => {
    it('rejects names starting with -', async () => {
      const result = await branch.pushBranch('/tmp/repo', '-evil', true);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid branch name/);
    });

    it('rejects ..', async () => {
      const result = await branch.pushBranch('/tmp/repo', '..', true);
      expect(result.success).toBe(false);
    });

    it('accepts valid names with safeExecGit argv', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      const result = await branch.pushBranch('/tmp/repo', 'main', true);
      expect(result.success).toBe(true);
      expect(execUtil.safeExecGit).toHaveBeenCalledWith(
        ['push', '-u', 'origin', 'main'],
        expect.any(Object)
      );
    });
  });
});
