import { randomUUID } from 'crypto';

export interface ServicePayload {
  cid?: string;
  [key: string]: unknown;
}

export interface ServiceResult {
  status: 'success' | 'error';
  code?: string;
  message?: string;
  cid: string;
  [key: string]: unknown;
}

export type ServiceHandler = (payload: ServicePayload) => Promise<ServiceResult>;

export class ServiceContainer {
  private cache: Map<string, ServiceHandler> = new Map();
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  async run(servicePath: string, payload: ServicePayload): Promise<ServiceResult> {
    const cid = this.generateCid();
    payload.cid = cid;

    try {
      const handler = await this.loadService(servicePath);
      this.log(servicePath, cid, 'Starting execution...');
      
      const result = await handler(payload);
      result.cid = cid;
      return result;
    } catch (error) {
      return {
        status: 'error',
        code: 'INTERNAL_FAILURE',
        message: String(error),
        cid,
      };
    }
  }

  private async loadService(servicePath: string): Promise<ServiceHandler> {
    if (this.cache.has(servicePath)) {
      return this.cache.get(servicePath)!;
    }
    
    const module = await import(servicePath);
    const handler = module.default || module.handler;
    this.cache.set(servicePath, handler);
    return handler;
  }

  private generateCid(): string {
    return `cogit-${randomUUID().split('-')[0]}`;
  }

  log(service: string, cid: string, message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO'): void {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}][${level}][${cid}][${service}] ${message}\n`);
  }
}
