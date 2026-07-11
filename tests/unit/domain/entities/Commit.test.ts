import { describe, it, expect } from 'vitest';
import { Commit } from '../../../../src/domain/entities/Commit';

describe('Commit entity', () => {
  it('DE-01: creates with valid message', () => {
    const c = new Commit({ message: 'feat: add new feature', files: ['src/test.ts'] });
    expect(c.message).toBe('feat: add new feature');
    expect(c.files).toEqual(['src/test.ts']);
  });

  it('DE-02: throws on empty message', () => {
    expect(() => new Commit({ message: '', files: [] })).toThrow();
  });

  it('DE-03: throws on whitespace-only message', () => {
    expect(() => new Commit({ message: '   ', files: [] })).toThrow();
  });

  it('DE-04: throws on message over 5000 chars', () => {
    expect(() => new Commit({ message: 'a'.repeat(5001), files: [] })).toThrow();
  });

  it('DE-05: defaults timestamp to now', () => {
    const before = Date.now();
    const c = new Commit({ message: 'feat: x', files: [] });
    const after = Date.now();
    expect(c.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(c.timestamp.getTime()).toBeLessThanOrEqual(after);
  });

  it('DE-06: returns defensive copy of files', () => {
    const c = new Commit({ message: 'feat: x', files: ['a.ts'] });
    const files = c.files;
    files.push('b.ts');
    expect(c.files).toEqual(['a.ts']);
  });

  it('DE-07: detects conventional commit format', () => {
    expect(new Commit({ message: 'feat: x', files: [] }).isConventional()).toBe(true);
    expect(new Commit({ message: 'feat(auth): x', files: [] }).isConventional()).toBe(true);
    expect(new Commit({ message: 'foo: bar', files: [] }).isConventional()).toBe(false);
    expect(new Commit({ message: 'feat', files: [] }).isConventional()).toBe(false);
  });

  it('DE-08: extracts type/scope/description', () => {
    const c = new Commit({ message: 'feat(api): add login endpoint', files: [] });
    expect(c.getType()).toBe('feat');
    expect(c.getScope()).toBe('api');
    expect(c.getDescription()).toBe('add login endpoint');
  });

  it('DE-09: withMessage returns new instance', () => {
    const c = new Commit({ message: 'feat: a', files: ['x.ts'] });
    const c2 = c.withMessage('fix: b');
    expect(c.message).toBe('feat: a');
    expect(c2.message).toBe('fix: b');
    expect(c2.files).toEqual(['x.ts']);
  });

  it('DE-10: toJSON returns plain object', () => {
    const c = new Commit({ message: 'feat: x', files: ['y.ts'] });
    const json = c.toJSON();
    expect(json.message).toBe('feat: x');
    expect(json.files).toEqual(['y.ts']);
  });

  it('DE-11: invalid type returns null from getType', () => {
    expect(new Commit({ message: 'random text', files: [] }).getType()).toBeNull();
  });
});
