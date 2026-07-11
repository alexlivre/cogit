import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { separatorLine } from '../../cli/ui/separator';

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

const MAX_DEPTH = 20;
const MAX_ENTRIES = 50_000;

export function scanResources(repoPath: string): ResourceReport {
  const resources: ResourceInfo[] = [];
  const byExtension: Record<string, { count: number; size: number }> = {};
  const seenRealPaths = new Set<string>();
  let truncated = false;

  function scan(dir: string, relative: string, depth: number): void {
    if (depth > MAX_DEPTH) {
      truncated = true;
      return;
    }
    if (resources.length >= MAX_ENTRIES) {
      truncated = true;
      return;
    }

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      // Permission denied or symlink loop; skip silently for diagnostic command.
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(relative, entry.name);

      if (entry.name === '.git' || entry.name === 'node_modules') continue;

      try {
        const realPath = fs.realpathSync(fullPath);
        if (seenRealPaths.has(realPath)) {
          // Symlink loop or dup dir; skip
          continue;
        }
        seenRealPaths.add(realPath);
      } catch {
        // realpath can fail on broken symlinks; treat as real (record once)
      }

      if (entry.isDirectory()) {
        resources.push({ type: 'directory', path: relativePath });
        scan(fullPath, relativePath, depth + 1);
      } else if (entry.isFile()) {
        let stats: fs.Stats;
        try {
          stats = fs.statSync(fullPath);
        } catch {
          continue;  // broken file / race
        }
        const ext = path.extname(entry.name).toLowerCase();

        const resource: ResourceInfo = {
          type: 'file',
          path: relativePath,
          size: stats.size,
          extension: ext || undefined,
          lastModified: stats.mtime,
        };

        resources.push(resource);

        if (ext) {
          if (!byExtension[ext]) byExtension[ext] = { count: 0, size: 0 };
          byExtension[ext].count++;
          byExtension[ext].size += stats.size;
        }
      } else if (entry.isSymbolicLink()) {
        // Ignore symlinks — they could be loops or point outside the repo
      }
    }
  }

  scan(repoPath, '', 0);

  const files = resources.filter(r => r.type === 'file');
  const dirs = resources.filter(r => r.type === 'directory');
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

  const largestFiles = [...files]
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 10);

  if (truncated) {
    // Annotate that some entries may have been skipped
    resources.push({
      type: 'directory',
      path: `…truncated (depth>${MAX_DEPTH} or entries>${MAX_ENTRIES})`,
    });
  }

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
  console.log(chalk.gray(separatorLine(50)));

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
  console.log(chalk.gray('\n' + separatorLine(50)));
  console.log(`Total: ${report.totalDirs} dirs, ${report.totalFiles} files, ${formatSize(report.totalSize)}`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
