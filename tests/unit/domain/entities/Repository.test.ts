import { describe, it, expect } from 'vitest';
import { Repository } from '../../../../src/domain/entities/Repository';

describe('Repository entity', () => {
  const props = {
    path: '/home/user/project',
    isGitRepo: true,
    currentBranch: 'main',
    remoteUrl: 'git@github.com:user/project.git',
    hasUncommittedChanges: false,
  };

  it('RE-01: creates with valid path', () => {
    const r = new Repository(props);
    expect(r.path).toBe(props.path);
    expect(r.currentBranch).toBe('main');
  });

  it('RE-02: throws on empty path', () => {
    expect(() => new Repository({ ...props, path: '' })).toThrow();
  });

  it('RE-03: throws on whitespace path', () => {
    expect(() => new Repository({ ...props, path: '   ' })).toThrow();
  });

  it('RE-04: isValid mirrors isGitRepo', () => {
    expect(new Repository({ ...props, isGitRepo: true }).isValid()).toBe(true);
    expect(new Repository({ ...props, isGitRepo: false }).isValid()).toBe(false);
  });

  it('RE-05: hasRemote mirrors remoteUrl presence', () => {
    expect(new Repository({ ...props, remoteUrl: 'x' }).hasRemote()).toBe(true);
    expect(new Repository({ ...props, remoteUrl: undefined }).hasRemote()).toBe(false);
  });

  it('RE-06: getName extracts basename from path', () => {
    expect(new Repository({ ...props, path: '/a/b/c/project' }).getName()).toBe('project');
    expect(new Repository({ ...props, path: 'project' }).getName()).toBe('project');
  });

  it('RE-07: withBranch returns new instance with updated branch', () => {
    const r = new Repository(props);
    const r2 = r.withBranch('feature/x');
    expect(r.currentBranch).toBe('main');
    expect(r2.currentBranch).toBe('feature/x');
  });

  it('RE-08: withChangesStatus returns new instance', () => {
    const r = new Repository(props);
    const r2 = r.withChangesStatus(true);
    expect(r.hasUncommittedChanges).toBe(false);
    expect(r2.hasUncommittedChanges).toBe(true);
  });

  it('RE-09: toJSON returns plain object', () => {
    const json = new Repository(props).toJSON();
    expect(json.path).toBe(props.path);
    expect(json.remoteUrl).toBe(props.remoteUrl);
  });
});
