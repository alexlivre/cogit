#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';

// Load .env from CLI installation directory
config({ path: path.join(__dirname, '..', '.env') });

import { program } from 'commander';
import { autoCommand } from './cli/commands/auto';
import { menuCommand } from './cli/commands/menu';

program
  .name('cogit')
  .description('Git automation CLI with AI-powered commit messages')
  .version('1.0.0');

program
  .command('auto')
  .description('Generate commit message with AI and execute git operations')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-push', 'Commit without pushing to remote')
  .option('--dry-run', 'Simulate without executing git commands')
  .option('--nobuild', 'Add [CI Skip] to commit message')
  .option('-m, --message <hint>', 'Context hint for AI')
  .option('-p, --path <dir>', 'Target directory', process.cwd())
  .action(autoCommand);

program
  .command('menu')
  .description('Interactive menu with guided options')
  .action(menuCommand);

program.parse();
