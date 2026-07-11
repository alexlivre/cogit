import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCommitExecution } from '../../../../../src/cli/commands/auto/commit-executor';
import * as renderer from '../../../../../src/cli/ui/renderer';
import * as executor from '../../../../../src/services/git/executor';

vi.mock('../../../../../src/services/git/executor');
vi.mock('../../../../../src/cli/ui/renderer', () => ({
  renderDryRun: vi.fn(),
  renderWarning: vi.fn(),
  renderSuccess: vi.fn(),
  renderError: vi.fn(),
  renderHealerAttempt: vi.fn(),
}));

describe('commit-executor dry-run display safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('escapes shell metacharacters in commit message when displaying', async () => {
    const result = await handleCommitExecution({
      repoPath: '/tmp',
      message: 'evil"; rm -rf /; echo "pwn',
      shouldPush: false,
      dryRun: true,
      yes: true,
    });

    expect(result.success).toBe(true);
    expect(renderer.renderDryRun).toHaveBeenCalled();

    const rendered = vi.mocked(renderer.renderDryRun).mock.calls[0][0] as string[];
    const commitCmd = rendered.find((c) => c.startsWith('git commit'));

    expect(commitCmd).toBeDefined();
    expect(commitCmd).not.toContain('evil";');
    expect(commitCmd).toContain('\\"');
  });

  it('escapes backticks and dollar signs to prevent command substitution', async () => {
    await handleCommitExecution({
      repoPath: '/tmp',
      message: 'feat: $(whoami) `id`',
      shouldPush: false,
      dryRun: true,
      yes: true,
    });

    const rendered = vi.mocked(renderer.renderDryRun).mock.calls[0][0] as string[];
    const commitCmd = rendered.find((c) => c.startsWith('git commit'))!;

    expect(commitCmd).toContain('\\$');
    expect(commitCmd).toContain('\\`');
    expect(commitCmd).not.toMatch(/(?<!\\)\$\(/);
    expect(commitCmd).not.toMatch(/(?<!\\)id`/);
  });

  it('does not call executor when dry-run is enabled', async () => {
    await handleCommitExecution({
      repoPath: '/tmp',
      message: 'safe message',
      shouldPush: true,
      dryRun: true,
      yes: true,
    });

    expect(executor.executeCommit).not.toHaveBeenCalled();
  });
});