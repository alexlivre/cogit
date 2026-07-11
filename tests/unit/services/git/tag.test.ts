import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tag from '../../../../src/services/git/tag';
import * as execUtil from '../../../../src/utils/executor';

vi.mock('../../../../src/utils/executor');
vi.mock('../../../../src/services/network/auto-push');
vi.mock('../../../../src/utils/confirmation', () => ({
  confirmDestructiveOperation: vi.fn(async () => true),
}));

describe('tag.ts validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTag', () => {
    it('rejects shell injection', async () => {
      const result = await tag.createTag('/tmp/repo', 'v1;evil', 'msg', true, false);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid tag name/);
      expect(execUtil.safeExecGit).not.toHaveBeenCalled();
    });

    it('rejects tag names with backticks', async () => {
      const result = await tag.createTag('/tmp/repo', 'v1`id`', 'msg', true, false);
      expect(result.success).toBe(false);
    });

    it('accepts valid tag names', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      const result = await tag.createTag('/tmp/repo', 'v1.0.0', 'msg', true, false);
      expect(result.success).toBe(true);
      expect(execUtil.safeExecGit).toHaveBeenCalledWith(
        ['tag', '-a', 'v1.0.0', '-m', 'msg'],
        expect.any(Object)
      );
    });

    it('passes annotated message via argv, no shell interpolation', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      await tag.createTag('/tmp/repo', 'v2.0.0', 'feat: $(whoami)', true, false);
      const call = vi.mocked(execUtil.safeExecGit).mock.calls[0];
      expect(call[0]).toEqual(['tag', '-a', 'v2.0.0', '-m', 'feat: $(whoami)']);
    });
  });

  describe('deleteTag', () => {
    it('rejects --delete', async () => {
      const result = await tag.deleteTag('/tmp/repo', '--delete', false);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid tag name/);
    });

    it('rejects invalid tag names', async () => {
      const result = await tag.deleteTag('/tmp/repo', 'v1@{upstream}', false);
      expect(result.success).toBe(false);
    });

    it('accepts valid names', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      const result = await tag.deleteTag('/tmp/repo', 'v1.0.0', false);
      expect(result.success).toBe(true);
      expect(execUtil.safeExecGit).toHaveBeenCalledWith(
        ['tag', '-d', 'v1.0.0'],
        expect.any(Object)
      );
    });
  });

  describe('resetToTag', () => {
    it('rejects invalid tag names', async () => {
      const result = await tag.resetToTag('/tmp/repo', '..');
      expect(result.success).toBe(false);
    });
  });

  describe('pushTag', () => {
    it('rejects invalid tag name', async () => {
      const result = await tag.pushTag('/tmp/repo', 'v1;evil');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid tag name/);
    });

    it('accepts undefined (push --tags)', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      const result = await tag.pushTag('/tmp/repo');
      expect(result.success).toBe(true);
      expect(execUtil.safeExecGit).toHaveBeenCalledWith(
        ['push', 'origin', '--tags'],
        expect.any(Object)
      );
    });

    it('accepts valid tag name', async () => {
      vi.mocked(execUtil.safeExecGit).mockResolvedValue({ stdout: '', stderr: '' });
      const result = await tag.pushTag('/tmp/repo', 'v1.0.0');
      expect(result.success).toBe(true);
      expect(execUtil.safeExecGit).toHaveBeenCalledWith(
        ['push', 'origin', 'v1.0.0'],
        expect.any(Object)
      );
    });
  });
});
