/**
 * Smart Ignore - Proactive .gitignore suggestions
 * Scans repository for trash files and suggests patterns
 */

import * as fs from 'fs';
import * as path from 'path';
import { execGit } from '../../utils/executor';
import chalk from 'chalk';

const WHITELIST_MARKER = '# cogit:allow';
const GITIGNORE_PATH = '.gitignore';

export interface IgnoreSuggestion {
  pattern: string;
  reason: string;
  files: string[];
}

export interface WhitelistEntry {
  pattern: string;
  comment: string;
}

/**
 * Load common trash patterns from config
 */
function loadCommonTrash(): Record<string, { reason: string; category: string }> {
  const configPath = path.join(__dirname, '../../config/common_trash.json');
  
  if (!fs.existsSync(configPath)) {
    return {};
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Get all files in repository (including untracked)
 */
async function getAllRepoFiles(repoPath: string): Promise<string[]> {
  try {
    // Get tracked files
    const { stdout: tracked } = await execGit('ls-files', { cwd: repoPath });
    
    // Get untracked files
    const { stdout: untracked } = await execGit(
      'ls-files --others --exclude-standard',
      { cwd: repoPath }
    );
    
    const allFiles = [...tracked.split('\n'), ...untracked.split('\n')]
      .map(f => f.trim())
      .filter(Boolean);
    
    return allFiles;
  } catch {
    return [];
  }
}

/**
 * Check if pattern is already in .gitignore
 */
function isPatternIgnored(repoPath: string, pattern: string): boolean {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  if (!fs.existsSync(gitignorePath)) {
    return false;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Check for exact match or pattern match
  return lines.some(line => {
    if (line === pattern) return true;
    if (line.startsWith('#')) return false;
    
    // Simple pattern matching
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1);
      return line.endsWith(ext);
    }
    
    return false;
  });
}

/**
 * Get whitelist patterns from .gitignore
 */
function getWhitelistPatterns(repoPath: string): Set<string> {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  const whitelist = new Set<string>();
  
  if (!fs.existsSync(gitignorePath)) {
    return whitelist;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === WHITELIST_MARKER && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && !nextLine.startsWith('#')) {
        whitelist.add(nextLine);
      }
    }
  }
  
  return whitelist;
}

/**
 * Match file against pattern
 */
function matchesPattern(file: string, pattern: string): boolean {
  // Exact match
  if (file === pattern) return true;
  
  // Wildcard match
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(1);
    return file.endsWith(ext);
  }
  
  if (pattern.endsWith('/*')) {
    const dir = pattern.slice(0, -2);
    return file.startsWith(dir + '/');
  }
  
  if (pattern.startsWith('*')) {
    const suffix = pattern.slice(1);
    return file.endsWith(suffix);
  }
  
  // Directory match
  if (file.startsWith(pattern + '/')) return true;
  
  return false;
}

/**
 * Scan repository and suggest ignore patterns
 */
export async function suggestIgnore(repoPath: string): Promise<void> {
  const commonTrash = loadCommonTrash();
  const allFiles = await getAllRepoFiles(repoPath);
  const whitelist = getWhitelistPatterns(repoPath);
  
  const suggestions: IgnoreSuggestion[] = [];
  
  for (const [pattern, info] of Object.entries(commonTrash)) {
    // Skip if already ignored
    if (isPatternIgnored(repoPath, pattern)) continue;
    
    // Skip if whitelisted
    if (whitelist.has(pattern)) continue;
    
    // Find matching files
    const matchingFiles = allFiles.filter(f => matchesPattern(f, pattern));
    
    if (matchingFiles.length > 0) {
      suggestions.push({
        pattern,
        reason: info.reason,
        files: matchingFiles.slice(0, 5), // Show max 5 files
      });
    }
  }
  
  if (suggestions.length === 0) {
    console.log(chalk.green('✓ No new .gitignore suggestions'));
    return;
  }
  
  console.log(chalk.bold.cyan('\n🗑️  Smart Ignore Suggestions\n'));
  
  for (const suggestion of suggestions) {
    console.log(chalk.yellow(`  ${suggestion.pattern}`));
    console.log(chalk.gray(`    Reason: ${suggestion.reason}`));
    console.log(chalk.gray(`    Files: ${suggestion.files.join(', ')}`));
    if (suggestion.files.length < suggestion.pattern.length) {
      console.log(chalk.gray(`    ... and more`));
    }
    console.log();
  }
  
  // Prompt user to add patterns
  const inquirer = require('inquirer');
  const { patterns } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'patterns',
      message: 'Select patterns to add to .gitignore:',
      choices: suggestions.map(s => ({
        name: `${s.pattern} (${s.reason})`,
        value: s.pattern,
      })),
    },
  ]);
  
  if (patterns.length > 0) {
    addToGitignore(repoPath, patterns);
    console.log(chalk.green(`\n✓ Added ${patterns.length} patterns to .gitignore\n`));
  }
}

/**
 * Add patterns to .gitignore
 */
function addToGitignore(repoPath: string, patterns: string[]): void {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.endsWith('\n')) {
      content += '\n';
    }
  }
  
  const newContent = content + '\n# Smart Ignore suggestions\n' + patterns.join('\n') + '\n';
  fs.writeFileSync(gitignorePath, newContent);
}

/**
 * Add whitelist entry to .gitignore
 */
export function addWhitelistEntry(repoPath: string, pattern: string, comment: string): void {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.endsWith('\n')) {
      content += '\n';
    }
  }
  
  const entry = `\n${WHITELIST_MARKER}\n# ${comment}\n${pattern}\n`;
  fs.writeFileSync(gitignorePath, content + entry);
  
  console.log(chalk.green(`✓ Added whitelist entry: ${pattern}`));
}

/**
 * Remove whitelist entry from .gitignore
 */
export function removeWhitelistEntry(repoPath: string, pattern: string): void {
  const gitignorePath = path.join(repoPath, GITIGNORE_PATH);
  
  if (!fs.existsSync(gitignorePath)) {
    return;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const lines = content.split('\n');
  const newLines: string[] = [];
  
  let skipNext = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    if (line === WHITELIST_MARKER && i + 2 < lines.length) {
      const nextLine = lines[i + 2].trim();
      if (nextLine === pattern) {
        // Skip marker, comment, and pattern
        i += 2;
        continue;
      }
    }
    
    newLines.push(lines[i]);
  }
  
  fs.writeFileSync(gitignorePath, newLines.join('\n'));
  console.log(chalk.green(`✓ Removed whitelist entry: ${pattern}`));
}
