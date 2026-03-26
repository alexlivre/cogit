#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';

// Load .env from CLI installation directory
config({ path: path.join(__dirname, '..', '.env') });

import { program } from 'commander';
import { autoCommand } from './cli/index';

program
  .name('cogit')
  .description('Git automation CLI with AI-powered commit messages')
  .version('1.0.0');

program
  .command('auto')
  .description('Generate commit message with AI and execute git operations')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-push', 'Commit without pushing to remote')
  .option('-m, --message <hint>', 'Context hint for AI')
  .option('-p, --path <dir>', 'Target directory', process.cwd())
  .action(autoCommand);

program.parse();
