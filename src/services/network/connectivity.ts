/**
 * Network Connectivity Service
 * Provides intelligent connectivity checking for GitHub operations
 */

import { execGit } from '../../utils/executor';
import { CONFIG } from '../../config/env';

export interface ConnectivityStatus {
  hasInternet: boolean;
  hasGitHubConnection: boolean;
  isGitHubRepo: boolean;
  lastChecked: Date;
  source: 'cache' | 'live';
}

export interface ConnectivityOptions {
  forceCheck?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * Connectivity cache with TTL
 */
class ConnectivityCache {
  private status: ConnectivityStatus | null = null;
  private ttl = 60000; // 60 seconds TTL

  get(): ConnectivityStatus | null {
    if (this.status && Date.now() - this.status.lastChecked.getTime() < this.ttl) {
      return { ...this.status, source: 'cache' };
    }
    return null;
  }

  set(status: ConnectivityStatus): void {
    this.status = { ...status, lastChecked: new Date(), source: 'live' };
  }

  invalidate(): void {
    this.status = null;
  }
}

const cache = new ConnectivityCache();

/**
 * Check basic internet connectivity using multiple fallback methods
 */
async function checkBasicInternet(timeout: number = 5000): Promise<boolean> {
  const methods = [
    // Method 1: Simple HTTP request to a reliable endpoint
    async () => {
      try {
        const https = require('https');
        return new Promise((resolve) => {
          const req = https.request('https://httpbin.org/get', { 
            timeout: timeout / 2,
            headers: { 'User-Agent': 'cogit-cli/1.0' }
          }, (res: any) => {
            resolve(res.statusCode === 200);
          });
          
          req.on('error', () => resolve(false));
          req.on('timeout', () => {
            req.destroy();
            resolve(false);
          });
          
          req.end();
        });
      } catch {
        return false;
      }
    },
    
    // Method 2: DNS resolution fallback
    async () => {
      try {
        const dns = require('dns').promises;
        await dns.resolve('8.8.8.8');
        return true;
      } catch {
        return false;
      }
    },
    
    // Method 3: Git remote connectivity check
    async () => {
      try {
        const { execGit } = require('../../utils/executor');
        // Try to connect to GitHub via Git (lightweight check)
        await execGit('ls-remote https://github.com/github/github.git HEAD', { 
          timeout: timeout / 2,
          silent: true 
        });
        return true;
      } catch {
        return false;
      }
    }
  ];

  // Try each method in sequence, return true if any succeeds
  for (const method of methods) {
    try {
      if (await method()) {
        return true;
      }
    } catch {
      // Continue to next method
    }
  }
  
  return false;
}

/**
 * Check GitHub-specific connectivity using multiple methods
 */
async function checkGitHubConnectivity(timeout: number = 10000): Promise<boolean> {
  const methods = [
    // Method 1: GitHub API with proper headers
    async () => {
      try {
        const https = require('https');
        return new Promise((resolve) => {
          const req = https.request('https://api.github.com/rate_limit', { 
            timeout,
            headers: { 
              'User-Agent': 'cogit-cli/1.0',
              'Accept': 'application/vnd.github.v3+json'
            }
          }, (res: any) => {
            resolve(res.statusCode === 200 || res.statusCode === 403); // 403 still means GitHub is reachable
          });
          
          req.on('error', () => resolve(false));
          req.on('timeout', () => {
            req.destroy();
            resolve(false);
          });
          
          req.end();
        });
      } catch {
        return false;
      }
    },
    
    // Method 2: GitHub pages check
    async () => {
      try {
        const https = require('https');
        return new Promise((resolve) => {
          const req = https.request('https://github.com', { 
            timeout,
            headers: { 'User-Agent': 'cogit-cli/1.0' }
          }, (res: any) => {
            resolve(res.statusCode === 200);
          });
          
          req.on('error', () => resolve(false));
          req.on('timeout', () => {
            req.destroy();
            resolve(false);
          });
          
          req.end();
        });
      } catch {
        return false;
      }
    },
    
    // Method 3: Git protocol check
    async () => {
      try {
        const { execGit } = require('../../utils/executor');
        await execGit('ls-remote https://github.com/octocat/Hello-World.git HEAD', { 
          timeout,
          silent: true 
        });
        return true;
      } catch {
        return false;
      }
    }
  ];

  // Try each method in sequence, return true if any succeeds
  for (const method of methods) {
    try {
      if (await method()) {
        return true;
      }
    } catch {
      // Continue to next method
    }
  }
  
  return false;
}

/**
 * Check if current repository is hosted on GitHub
 */
async function isGitHubRepository(repoPath: string): Promise<boolean> {
  try {
    const { stdout } = await execGit('remote get-url origin', { cwd: repoPath });
    const remoteUrl = stdout.trim();
    
    // Check for GitHub URLs
    const githubPatterns = [
      /^https:\/\/github\.com\//,
      /^git@github\.com:/,
      /^ssh:\/\/git@github\.com\//,
    ];
    
    return githubPatterns.some(pattern => pattern.test(remoteUrl));
  } catch {
    return false;
  }
}

/**
 * Main connectivity check function with fallback support
 */
export async function checkConnectivity(
  repoPath: string,
  options: ConnectivityOptions = {}
): Promise<ConnectivityStatus> {
  const { forceCheck = false, timeout = 10000, retries = 2 } = options;

  // Return cached result if available and not forced
  if (!forceCheck) {
    const cached = cache.get();
    if (cached) {
      return cached;
    }
  }

  let hasInternet = false;
  let hasGitHubConnection = false;
  let isGitHubRepo = false;

  // Check internet connectivity with retries
  for (let i = 0; i <= retries; i++) {
    hasInternet = await checkBasicInternet(timeout / 2);
    if (hasInternet) break;
    if (i < retries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Check GitHub connectivity only if we have internet
  if (hasInternet) {
    for (let i = 0; i <= retries; i++) {
      hasGitHubConnection = await checkGitHubConnectivity(timeout);
      if (hasGitHubConnection) break;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Check if current repo is GitHub
  isGitHubRepo = await isGitHubRepository(repoPath);

  // Fallback: if both internet and GitHub checks failed but fallback is enabled
  const { CONFIG } = require('../../config/env');
  if (!hasInternet && !hasGitHubConnection && CONFIG.AUTO_PUSH_FALLBACK_ENABLED) {
    try {
      // Try Git-based connectivity check
      const gitConnectivity = await checkConnectivityViaGit(repoPath, CONFIG.AUTO_PUSH_FALLBACK_TIMEOUT);
      if (gitConnectivity) {
        hasInternet = true;
        hasGitHubConnection = isGitHubRepo; // Assume GitHub if repo is GitHub and Git works
      }
    } catch {
      // Fallback failed, keep original results
    }
  }

  const status: ConnectivityStatus = {
    hasInternet,
    hasGitHubConnection,
    isGitHubRepo,
    lastChecked: new Date(),
    source: 'live'
  };

  cache.set(status);
  return status;
}

/**
 * Quick connectivity check using cache only
 */
export function getCachedConnectivity(): ConnectivityStatus | null {
  return cache.get();
}

/**
 * Invalidate connectivity cache
 */
export function invalidateConnectivityCache(): void {
  cache.invalidate();
}

/**
 * Check if auto push should be attempted based on connectivity and configuration
 */
export function shouldAttemptAutoPush(
  connectivity: ConnectivityStatus,
  autoPushConfig: {
    enabled: boolean;
    requireInternet: boolean;
    githubOnly: boolean;
  }
): boolean {
  if (!autoPushConfig.enabled) {
    return false;
  }

  const { CONFIG } = require('../../config/env');

  // In strict mode, require all checks to pass
  if (CONFIG.AUTO_PUSH_STRICT_CHECK) {
    if (autoPushConfig.requireInternet && !connectivity.hasInternet) {
      return false;
    }

    if (autoPushConfig.githubOnly && !connectivity.isGitHubRepo) {
      return false;
    }

    // If GitHub is specifically required, check GitHub connectivity
    if (connectivity.isGitHubRepo && autoPushConfig.githubOnly && !connectivity.hasGitHubConnection) {
      return false;
    }
  } else {
    // In non-strict mode, be more permissive
    if (autoPushConfig.githubOnly && !connectivity.isGitHubRepo) {
      return false;
    }

    // If we have some connectivity (even if not perfect), allow push
    if (autoPushConfig.requireInternet && !connectivity.hasInternet) {
      return false;
    }
  }

  return true;
}

/**
 * Fallback connectivity check using Git operations
 */
async function checkConnectivityViaGit(repoPath: string, timeout: number = 15000): Promise<boolean> {
  try {
    const { execGit } = require('../../utils/executor');
    
    // Try to fetch basic remote information (lightweight)
    const { stdout } = await execGit('ls-remote origin', { 
      cwd: repoPath,
      timeout,
      silent: true 
    });
    
    // If we get any output, we can reach the remote
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Get human-readable connectivity status message
 */
export function getConnectivityMessage(connectivity: ConnectivityStatus): string {
  const messages: string[] = [];

  if (!connectivity.hasInternet) {
    messages.push('🔴 No internet connection');
  } else {
    messages.push('🟢 Internet connected');
    
    if (connectivity.hasGitHubConnection) {
      messages.push('🟢 GitHub reachable');
    } else {
      messages.push('🟡 GitHub unreachable');
    }
  }

  if (connectivity.isGitHubRepo) {
    messages.push('📁 GitHub repository');
  } else {
    messages.push('📁 Non-GitHub repository');
  }

  return messages.join(' | ');
}
