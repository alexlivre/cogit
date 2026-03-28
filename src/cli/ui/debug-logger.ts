import * as fs from 'fs';
import * as path from 'path';

const DEBUG_LOG_FILE = '.vibe-debug.log';

export interface DebugLogEntry {
  timestamp: string;
  type: 'REQUEST' | 'RESPONSE' | 'ERROR' | 'GIT' | 'INFO';
  data: any;
}

export class DebugLogger {
  private enabled: boolean = false;
  private logPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.logPath = path.join(repoPath, DEBUG_LOG_FILE);
  }

  enable(): void {
    this.enabled = true;
    this.clear();
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  clear(): void {
    if (fs.existsSync(this.logPath)) {
      fs.unlinkSync(this.logPath);
    }
  }

  log(type: string, data: any): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const entry: DebugLogEntry = {
      timestamp,
      type: type as any,
      data,
    };
    
    const logLine = `[${timestamp}][${type}] ${JSON.stringify(data, null, 2)}\n`;
    fs.appendFileSync(this.logPath, logLine);
  }

  logRequest(provider: string, messages: any[]): void {
    this.log('REQUEST', { 
      provider, 
      messages, 
      tokenCount: this.estimateTokens(messages) 
    });
  }

  logResponse(provider: string, response: string, latency: number): void {
    this.log('RESPONSE', { 
      provider, 
      response, 
      latency: `${latency}ms` 
    });
  }

  logError(provider: string, error: any): void {
    this.log('ERROR', { 
      provider, 
      error: String(error),
      stack: error?.stack
    });
  }

  logGitCommand(command: string, output: string, success: boolean = true): void {
    this.log('GIT', { 
      command, 
      output: output.slice(0, 1000),
      success 
    });
  }

  logInfo(message: string, data?: any): void {
    this.log('INFO', { message, ...data });
  }

  private estimateTokens(messages: any[]): number {
    const text = messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4);
  }

  getLogPath(): string {
    return this.logPath;
  }
}

// Singleton instance
export const debugLogger = new DebugLogger(process.cwd());
