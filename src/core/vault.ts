/**
 * VibeVault - Intelligent Large Diff Management
 * Handles diffs larger than 100KB by storing in memory with references
 */

import { randomUUID } from 'crypto';

const SIZE_THRESHOLD_KB = 100;
const SIZE_THRESHOLD_BYTES = SIZE_THRESHOLD_KB * 1024;

export interface DiffData {
  mode: 'direct' | 'ref';
  payload?: string;
  dataRef?: string;
  preview?: string;
  originalSize: number;
}

interface VaultMetadata {
  size: number;
  timestamp: Date;
}

class VibeVault {
  private static storage: Map<string, string> = new Map();
  private static metadata: Map<string, VaultMetadata> = new Map();

  static store(data: string): string {
    const refId = `ref-${randomUUID().split('-')[0]}`;
    this.storage.set(refId, data);
    this.metadata.set(refId, {
      size: Buffer.byteLength(data, 'utf-8'),
      timestamp: new Date(),
    });
    return refId;
  }

  static retrieve(refId: string): string | undefined {
    return this.storage.get(refId);
  }

  static cleanup(refId: string): void {
    this.storage.delete(refId);
    this.metadata.delete(refId);
  }

  static getMetadata(refId: string): VaultMetadata | undefined {
    return this.metadata.get(refId);
  }

  static getStats(): { count: number; totalSize: number } {
    let totalSize = 0;
    this.metadata.forEach(meta => {
      totalSize += meta.size;
    });
    return {
      count: this.storage.size,
      totalSize,
    };
  }

  static clear(): void {
    this.storage.clear();
    this.metadata.clear();
  }

  static async withAutoCleanup<T>(refId: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } finally {
      this.cleanup(refId);
    }
  }
}

export function smartPack(data: string): DiffData {
  const sizeInBytes = Buffer.byteLength(data, 'utf-8');
  
  if (sizeInBytes <= SIZE_THRESHOLD_BYTES) {
    return {
      mode: 'direct',
      payload: data,
      originalSize: sizeInBytes,
    };
  }
  
  // Store in vault and return reference
  const refId = VibeVault.store(data);
  const preview = data.slice(0, 2000);
  
  return {
    mode: 'ref',
    dataRef: refId,
    preview,
    originalSize: sizeInBytes,
  };
}

export function smartUnpack(data: DiffData): string {
  if (data.mode === 'direct') {
    return data.payload || '';
  }
  
  if (data.dataRef) {
    const retrieved = VibeVault.retrieve(data.dataRef);
    if (!retrieved) {
      throw new Error(`Data reference not found: ${data.dataRef}`);
    }
    return retrieved;
  }
  
  return '';
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export { VibeVault };
