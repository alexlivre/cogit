/**
 * Stealth Mode - Temporary hiding of private files during Git operations
 * Reads patterns from .gitpy-private and moves matching files to .gitpy-temp/
 */

import * as fs from 'fs';
import * as path from 'path';
import { execGit } from '../../utils/executor';

const PRIVATE_CONFIG_FILE = '.gitpy-private';
const TEMP_DIR = '.gitpy-temp';

export interface StealthResult {
  hiddenFiles: string[];
  tempPath: string;
  success: boolean;
  error?: string;
}

export interface StealthRestoreResult {
  restoredFiles: string[];
  conflicts: string[];
  success: boolean;
  error?: string;
}

/**
 * Read patterns from .gitpy-private file
 */
function readPrivatePatterns(repoPath: string): string[] {
  const configPath = path.join(repoPath, PRIVATE_CONFIG_FILE);
  
  if (!fs.existsSync(configPath)) {
    return [];
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  const lines = content.split('\n');
  
  return lines
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

/**
 * Get all files matching the patterns
 */
async function getMatchingFiles(repoPath: string, patterns: string[]): Promise<string[]> {
  const matchingFiles: string[] = [];
  
  for (const pattern of patterns) {
    try {
      // Use git ls-files to find matching files
      const { stdout } = await execGit(
        `ls-files --others --exclude-standard "${pattern}" && git ls-files "${pattern}"`,
        { cwd: repoPath }
      );
      
      const files = stdout.trim().split('\n').filter(Boolean);
      matchingFiles.push(...files);
    } catch {
      // Pattern might not match anything, continue
    }
  }
  
  // Remove duplicates
  return [...new Set(matchingFiles)];
}

/**
 * Ensure .gitpy-temp is in .gitignore
 */
async function ensureGitignoreEntry(repoPath: string): Promise<void> {
  const gitignorePath = path.join(repoPath, '.gitignore');
  const tempEntry = `${TEMP_DIR}/`;
  
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `# Cogit temporary directory\n${tempEntry}\n`);
    return;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  
  if (!content.includes(tempEntry) && !content.includes(TEMP_DIR)) {
    fs.appendFileSync(gitignorePath, `\n# Cogit temporary directory\n${tempEntry}\n`);
  }
}

/**
 * Hide private files by moving them to .gitpy-temp/
 */
export async function stealthStash(repoPath: string): Promise<StealthResult> {
  const patterns = readPrivatePatterns(repoPath);
  
  if (patterns.length === 0) {
    return {
      hiddenFiles: [],
      tempPath: '',
      success: true,
    };
  }
  
  const matchingFiles = await getMatchingFiles(repoPath, patterns);
  
  if (matchingFiles.length === 0) {
    return {
      hiddenFiles: [],
      tempPath: '',
      success: true,
    };
  }
  
  const tempPath = path.join(repoPath, TEMP_DIR);
  
  try {
    // Ensure .gitignore has the temp directory
    await ensureGitignoreEntry(repoPath);
    
    // Create temp directory
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    
    // Move files to temp directory
    for (const file of matchingFiles) {
      const sourcePath = path.join(repoPath, file);
      const destPath = path.join(tempPath, file);
      
      if (fs.existsSync(sourcePath)) {
        // Create directory structure in temp
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Move file
        fs.renameSync(sourcePath, destPath);
      }
    }
    
    return {
      hiddenFiles: matchingFiles,
      tempPath,
      success: true,
    };
  } catch (error) {
    return {
      hiddenFiles: [],
      tempPath,
      success: false,
      error: `Failed to hide files: ${error}`,
    };
  }
}

/**
 * Restore hidden files from .gitpy-temp/
 */
export async function stealthRestore(repoPath: string): Promise<StealthRestoreResult> {
  const tempPath = path.join(repoPath, TEMP_DIR);
  
  if (!fs.existsSync(tempPath)) {
    return {
      restoredFiles: [],
      conflicts: [],
      success: true,
    };
  }
  
  const restoredFiles: string[] = [];
  const conflicts: string[] = [];
  
  try {
    // Recursively restore all files
    const restoreDir = (dir: string, relativePath: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          restoreDir(fullPath, relPath);
        } else {
          const destPath = path.join(repoPath, relPath);
          
          // Check for conflicts
          if (fs.existsSync(destPath)) {
            // Rename conflict file
            const conflictPath = `${destPath}.restored`;
            fs.renameSync(fullPath, conflictPath);
            conflicts.push(relPath);
          } else {
            // Ensure parent directory exists
            const parentDir = path.dirname(destPath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }
            
            // Move file back
            fs.renameSync(fullPath, destPath);
            restoredFiles.push(relPath);
          }
        }
      }
    };
    
    restoreDir(tempPath);
    
    // Remove temp directory if empty
    const remainingEntries = fs.readdirSync(tempPath);
    if (remainingEntries.length === 0) {
      fs.rmdirSync(tempPath);
    }
    
    return {
      restoredFiles,
      conflicts,
      success: true,
    };
  } catch (error) {
    return {
      restoredFiles,
      conflicts,
      success: false,
      error: `Failed to restore files: ${error}`,
    };
  }
}

/**
 * Create .gitpy-private configuration file
 */
export function createPrivateConfig(repoPath: string, patterns: string[]): void {
  const configPath = path.join(repoPath, PRIVATE_CONFIG_FILE);
  
  const content = `# Cogit Private Files
# Files matching these patterns will be hidden during git operations

${patterns.join('\n')}
`;
  
  fs.writeFileSync(configPath, content);
}

/**
 * Check if .gitpy-private exists
 */
export function hasPrivateConfig(repoPath: string): boolean {
  const configPath = path.join(repoPath, PRIVATE_CONFIG_FILE);
  return fs.existsSync(configPath);
}
