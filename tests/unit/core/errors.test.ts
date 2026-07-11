import { describe, it, expect } from 'vitest';
import { CogitError, ConfigError, GitError, AIError, SecurityError, StealthError } from '../../../src/core/errors';

describe('CogitError', () => {
  it('ER-01: stores code, exitCode, and details', () => {
    const e = new CogitError('boom', 'CONFIG_INVALID', 2, ['line 1']);
    expect(e.message).toBe('boom');
    expect(e.code).toBe('CONFIG_INVALID');
    expect(e.exitCode).toBe(2);
    expect(e.details).toEqual(['line 1']);
    expect(e.name).toBe('CogitError');
  });

  it('ER-02: isCogitError discriminates', () => {
    expect(CogitError.isCogitError(new CogitError('x', 'INTERNAL_ERROR'))).toBe(true);
    expect(CogitError.isCogitError(new Error('x'))).toBe(false);
    expect(CogitError.isCogitError('string')).toBe(false);
    expect(CogitError.isCogitError(null)).toBe(false);
  });
});

describe('ConfigError', () => {
  it('CE-01: uses CONFIG_INVALID with exitCode 1', () => {
    const e = new ConfigError('missing key', ['LINE1', 'LINE2']);
    expect(e.code).toBe('CONFIG_INVALID');
    expect(e.exitCode).toBe(1);
    expect(e.details).toEqual(['LINE1', 'LINE2']);
    expect(e.name).toBe('ConfigError');
  });
});

describe('GitError', () => {
  it('GE-01: notRepo factory', () => {
    const e = GitError.notRepo();
    expect(e.code).toBe('GIT_NOT_REPO');
    expect(e.message).toBe('Not a git repository');
  });

  it('GE-02: noChanges factory', () => {
    const e = GitError.noChanges();
    expect(e.code).toBe('GIT_NO_CHANGES');
  });

  it('GE-03: pushFailed factory', () => {
    const e = GitError.pushFailed('connection refused');
    expect(e.code).toBe('GIT_PUSH_FAILED');
    expect(e.message).toBe('Push operation failed');
    expect(e.details).toEqual(['connection refused']);
  });

  it('GE-04: commitFailed factory', () => {
    const e = GitError.commitFailed('nothing to commit');
    expect(e.code).toBe('GIT_COMMIT_FAILED');
    expect(e.details).toEqual(['nothing to commit']);
  });
});

describe('AIError', () => {
  it('AE-01: custom message and code', () => {
    const e = new AIError('timeout while generating', 'AI_GENERATION_FAILED', ['openrouter']);
    expect(e.code).toBe('AI_GENERATION_FAILED');
    expect(e.exitCode).toBe(1);
    expect(e.details).toEqual(['openrouter']);
  });

  it('AE-02: connectionFailed factory', () => {
    const e = AIError.connectionFailed('groq');
    expect(e.code).toBe('AI_CONNECTION_FAILED');
    expect(e.message).toContain('groq');
  });

  it('AE-03: noProvider factory', () => {
    const e = AIError.noProvider();
    expect(e.code).toBe('AI_NO_PROVIDER');
  });
});

describe('SecurityError', () => {
  it('SE-01: blocked files in details', () => {
    const e = new SecurityError(['.env', 'id_rsa']);
    expect(e.code).toBe('SECURITY_BLOCKED');
    expect(e.details).toEqual(['.env', 'id_rsa']);
    expect(e.name).toBe('SecurityError');
    expect(e.exitCode).toBe(1);
  });
});

describe('StealthError', () => {
  it('ST-01: direct constructor with details', () => {
    const e = new StealthError('permission denied', ['/tmp/file']);
    expect(e.code).toBe('STEALTH_FAILED');
    expect(e.message).toBe('permission denied');
    expect(e.details).toEqual(['/tmp/file']);
  });
});
