#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';

// Load .env from CLI installation directory
config({ path: path.join(__dirname, '..', '.env') });

import { program } from 'commander';
import { autoCommand } from './cli/commands/auto/index';
import { menuCommand } from './cli/commands/menu';
import { handleFatalError } from './core/errors';

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
  .option('-b, --branch <name>', 'Create or switch to branch')
  .option('--debug', 'Enable deep trace mode')
  .action(async (options) => {
    try {
      await autoCommand(options);
    } catch (error) {
      handleFatalError(error);
    }
  });

program
  .command('menu')
  .description('Interactive menu with guided options')
  .action(menuCommand);

program
  .command('check-ai')
  .description('Test AI provider connectivity')
  .action(async () => {
    const { checkAICommand } = await import('./cli/commands/check-ai');
    await checkAICommand();
  });

program
  .command('health')
  .description('Full health check of all AI providers')
  .action(async () => {
    const { fullHealthCheck, displayHealthReport } = await import('./services/diagnostics/health');
    const results = await fullHealthCheck();
    displayHealthReport(results);
  });

program
  .command('resources')
  .description('Scan and display project resources')
  .action(async () => {
    const { scanResources, displayResourceMap } = await import('./services/diagnostics/resources');
    const report = scanResources(process.cwd());
    displayResourceMap(report);
  });

program.parse();
