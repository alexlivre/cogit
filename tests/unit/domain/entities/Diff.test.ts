import { describe, it, expect } from 'vitest';
import { Diff, FileChange } from '../../../../src/domain/entities/Diff';

const sampleFiles: FileChange[] = [
  { path: 'a.ts', status: 'modified', additions: 5, deletions: 3, isBinary: false },
  { path: 'b.ts', status: 'added', additions: 10, deletions: 0, isBinary: false },
  { path: 'c.png', status: 'added', additions: 0, deletions: 0, isBinary: true },
];

describe('Diff entity', () => {
  it('DF-01: exposes props via getters', () => {
    const d = new Diff({
      content: 'x',
      files: sampleFiles,
      totalAdditions: 15,
      totalDeletions: 3,
      isLarge: false,
    });
    expect(d.getFilesCount()).toBe(3);
    expect(d.totalAdditions).toBe(15);
    expect(d.isLarge).toBe(false);
  });

  it('DF-02: returns defensive copy of files', () => {
    const d = new Diff({ content: '', files: sampleFiles, totalAdditions: 0, totalDeletions: 0, isLarge: false });
    const files = d.files;
    files.pop();
    expect(d.files).toHaveLength(3);
  });

  it('DF-03: isEmpty when no content and no files', () => {
    expect(new Diff({ content: '', files: [], totalAdditions: 0, totalDeletions: 0, isLarge: false }).isEmpty()).toBe(true);
    expect(new Diff({ content: 'x', files: [], totalAdditions: 0, totalDeletions: 0, isLarge: false }).isEmpty()).toBe(false);
    expect(new Diff({ content: '', files: sampleFiles, totalAdditions: 0, totalDeletions: 0, isLarge: false }).isEmpty()).toBe(false);
  });

  it('DF-04: hasBinaryFiles detects binary files', () => {
    const withBinary = new Diff({ content: '', files: sampleFiles, totalAdditions: 0, totalDeletions: 0, isLarge: false });
    const withoutBinary = new Diff({ content: '', files: [sampleFiles[0], sampleFiles[1]], totalAdditions: 0, totalDeletions: 0, isLarge: false });
    expect(withBinary.hasBinaryFiles()).toBe(true);
    expect(withoutBinary.hasBinaryFiles()).toBe(false);
  });

  it('DF-05: getFilesByStatus filters correctly', () => {
    const d = new Diff({ content: '', files: sampleFiles, totalAdditions: 0, totalDeletions: 0, isLarge: false });
    expect(d.getFilesByStatus('modified')).toHaveLength(1);
    expect(d.getFilesByStatus('added')).toHaveLength(2);
  });

  it('DF-06: getSummary builds count breakdown', () => {
    const d = new Diff({ content: '', files: sampleFiles, totalAdditions: 0, totalDeletions: 0, isLarge: false });
    expect(d.getSummary()).toContain('1 modified');
    expect(d.getSummary()).toContain('2 added');
  });

  it('DF-07: getTruncatedContent slices large content', () => {
    const big = 'x'.repeat(20000);
    const d = new Diff({ content: big, files: [], totalAdditions: 0, totalDeletions: 0, isLarge: true });
    const truncated = d.getTruncatedContent(100);
    expect(truncated.length).toBeLessThan(200);
    expect(truncated).toContain('truncated');
  });

  it('DF-08: getSizeCategory buckets correctly', () => {
    const small = new Diff({ content: '', files: [], totalAdditions: 10, totalDeletions: 10, isLarge: false });
    expect(small.getSizeCategory()).toBe('small');
    const medium = new Diff({ content: '', files: [], totalAdditions: 100, totalDeletions: 100, isLarge: false });
    expect(medium.getSizeCategory()).toBe('medium');
    const large = new Diff({ content: '', files: [], totalAdditions: 1000, totalDeletions: 1000, isLarge: true });
    expect(large.getSizeCategory()).toBe('large');
  });

  it('DF-09: toJSON returns plain object', () => {
    const json = new Diff({ content: 'x', files: sampleFiles, totalAdditions: 15, totalDeletions: 3, isLarge: false }).toJSON();
    expect(json.content).toBe('x');
    expect(json.files).toHaveLength(3);
    expect(json.isLarge).toBe(false);
  });
});
