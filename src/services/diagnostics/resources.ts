import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface ResourceInfo {
  type: 'file' | 'directory';
  path: string;
  size?: number;
  extension?: string;
  lastModified?: Date;
}

export interface ResourceReport {
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
  byExtension: Record<string, { count: number; size: number }>;
  largestFiles: ResourceInfo[];
  resources: ResourceInfo[];
}

export function scanResources(repoPath: string): ResourceReport {
  const resources: ResourceInfo[] = [];
  const byExtension: Record<string, { count: number; size: number }> = {};

  function scan(dir: string, relative: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(relative, entry.name);

      // Skip .git and node_modules
      if (entry.name === '.git' || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        resources.push({ 
          type: 'directory', 
          path: relativePath,
        });
        scan(fullPath, relativePath);
      } else {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        
        const resource: ResourceInfo = {
          type: 'file',
          path: relativePath,
          size: stats.size,
          extension: ext || undefined,
          lastModified: stats.mtime,
        };
        
        resources.push(resource);
        
        // Track by extension
        if (ext) {
          if (!byExtension[ext]) {
            byExtension[ext] = { count: 0, size: 0 };
          }
          byExtension[ext].count++;
          byExtension[ext].size += stats.size;
        }
      }
    }
  }

  scan(repoPath);
  
  const files = resources.filter(r => r.type === 'file');
  const dirs = resources.filter(r => r.type === 'directory');
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  
  // Get top 10 largest files
  const largestFiles = [...files]
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 10);

  return {
    totalFiles: files.length,
    totalDirs: dirs.length,
    totalSize,
    byExtension,
    largestFiles,
    resources,
  };
}

export function displayResourceMap(report: ResourceReport): void {
  console.log(chalk.cyan.bold('\n🗺️  RESOURCE MAP'));
  console.log(chalk.gray('─'.repeat(50)));

  const dirs = report.resources.filter(r => r.type === 'directory');
  const files = report.resources.filter(r => r.type === 'file');

  // Directories
  console.log(chalk.yellow(`\nDirectories (${dirs.length}):`));
  dirs.slice(0, 20).forEach(r => console.log(`  📁 ${r.path}`));
  if (dirs.length > 20) {
    console.log(chalk.gray(`  ... +${dirs.length - 20} more`));
  }

  // Files
  console.log(chalk.yellow(`\nFiles (${files.length}):`));
  files.slice(0, 20).forEach(r => {
    const size = r.size ? formatSize(r.size) : '';
    console.log(`  📄 ${r.path} ${chalk.gray(size)}`);
  });
  if (files.length > 20) {
    console.log(chalk.gray(`  ... +${files.length - 20} more`));
  }

  // By Extension
  const extensions = Object.entries(report.byExtension)
    .sort((a, b) => b[1].count - a[1].count);
  
  if (extensions.length > 0) {
    console.log(chalk.yellow('\nBy Extension:'));
    extensions.slice(0, 10).forEach(([ext, data]) => {
      console.log(`  ${ext}: ${data.count} files (${formatSize(data.size)})`);
    });
    if (extensions.length > 10) {
      console.log(chalk.gray(`  ... +${extensions.length - 10} more extensions`));
    }
  }

  // Largest Files
  if (report.largestFiles.length > 0) {
    console.log(chalk.yellow('\nLargest Files:'));
    report.largestFiles.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.path} ${chalk.gray(formatSize(r.size || 0))}`);
    });
  }

  // Total
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(`Total: ${report.totalDirs} dirs, ${report.totalFiles} files, ${formatSize(report.totalSize)}`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
