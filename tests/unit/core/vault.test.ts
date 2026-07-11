import { describe, it, expect, vi, beforeEach } from 'vitest';
import { smartPack, smartUnpack, VibeVault } from '../../../src/core/vault';

describe('VibeVault TTL', () => {
  beforeEach(() => {
    VibeVault.clear();
    vi.useRealTimers();
  });

  it('store accepts custom TTL', () => {
    const refId = VibeVault.store('data', 1000);
    const meta = VibeVault.getMetadata(refId);
    expect(meta).toBeDefined();
    expect(meta!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('retrieve returns data while not expired', () => {
    const refId = VibeVault.store('payload', 60_000);
    expect(VibeVault.retrieve(refId)).toBe('payload');
  });

  it('retrieve returns undefined after TTL expires', () => {
    vi.useFakeTimers();
    const refId = VibeVault.store('payload', 1000);
    vi.advanceTimersByTime(1500);
    expect(VibeVault.retrieve(refId)).toBeUndefined();
    VibeVault.clear();
  });

  it('cleanup also removes metadata', () => {
    const refId = VibeVault.store('payload', 60_000);
    expect(VibeVault.getMetadata(refId)).toBeDefined();
    VibeVault.cleanup(refId);
    expect(VibeVault.retrieve(refId)).toBeUndefined();
    expect(VibeVault.getMetadata(refId)).toBeUndefined();
  });

  it('withAutoCleanup cleans up after fn resolves', async () => {
    const refId = VibeVault.store('payload', 60_000);
    const result = await VibeVault.withAutoCleanup(refId, async () => 'ok');
    expect(result).toBe('ok');
    expect(VibeVault.retrieve(refId)).toBeUndefined();
  });

  it('withAutoCleanup cleans up after fn throws', async () => {
    const refId = VibeVault.store('payload', 60_000);
    await expect(
      VibeVault.withAutoCleanup(refId, async () => { throw new Error('boom'); })
    ).rejects.toThrow('boom');
    expect(VibeVault.retrieve(refId)).toBeUndefined();
  });
});

describe('smartPack / smartUnpack', () => {
  beforeEach(() => VibeVault.clear());

  it('packs small data as direct mode', () => {
    const data = 'tiny diff';
    const packed = smartPack(data);
    expect(packed.mode).toBe('direct');
    expect(packed.payload).toBe(data);
  });

  it('packs large data as ref mode', () => {
    const data = 'x'.repeat(150 * 1024);
    const packed = smartPack(data);
    expect(packed.mode).toBe('ref');
    expect(packed.dataRef).toBeDefined();
    expect(packed.preview).toBeDefined();
    expect(packed.originalSize).toBe(150 * 1024);
  });

  it('unpacks ref data via vault', () => {
    const data = 'y'.repeat(150 * 1024);
    const packed = smartPack(data);
    const unpacked = smartUnpack(packed);
    expect(unpacked).toBe(data);
    VibeVault.cleanup(packed.dataRef!);
  });
});
