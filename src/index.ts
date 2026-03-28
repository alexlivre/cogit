#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';

// Load .env from CLI installation directory
config({ path: path.join(__dirname, '..', '.env') });

import { program } from 'commander';
import chalk from 'chalk';
import { autoCommand } from './cli/commands/auto/index';
import { menuCommand } from './cli/commands/menu';
import { handleFatalError } from './core/errors';

const showCustomHelp = () => {
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║') + chalk.white.bold('         COGIT - AI-Powered Git CLI                       ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('║') + chalk.gray('         Version 1.0.0 | github.com/alexlivre/cogit       ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow.bold('USAGE:'));
  console.log('  $ cogit              ' + chalk.gray('→ Open interactive menu'));
  console.log('  $ cogit [command]    ' + chalk.gray('→ Run specific command'));
  console.log('  $ cogit --help       ' + chalk.gray('→ Show this help\n'));

  console.log(chalk.yellow.bold('CORE COMMANDS:'));
  console.log('  auto           ' + chalk.gray('Generate AI commit and execute git operations'));
  console.log('  menu           ' + chalk.gray('Interactive menu with guided options (default)\n'));

  console.log(chalk.yellow.bold('DIAGNOSTICS:'));
  console.log('  check-ai       ' + chalk.gray('Test AI provider connectivity'));
  console.log('  health         ' + chalk.gray('Full health check of all AI providers'));
  console.log('  resources      ' + chalk.gray('Scan and display project resources'));
  console.log('  check-connectivity ' + chalk.gray('Check network and GitHub access\n'));

  console.log(chalk.yellow.bold('OPTIONS:'));
  console.log('  -y, --yes            ' + chalk.gray('Skip confirmation prompts'));
  console.log('  --no-push            ' + chalk.gray('Commit without pushing to remote'));
  console.log('  --dry-run            ' + chalk.gray('Simulate without executing git commands'));
  console.log('  --nobuild            ' + chalk.gray('Add [CI Skip] to commit message'));
  console.log('  -m, --message <hint> ' + chalk.gray('Context hint for AI'));
  console.log('  -p, --path <dir>     ' + chalk.gray('Target directory'));
  console.log('  -b, --branch <name>  ' + chalk.gray('Create or switch to branch'));
  console.log('  --auto-push          ' + chalk.gray('Force enable auto push for this operation'));
  console.log('  --no-auto-push       ' + chalk.gray('Force disable auto push for this operation'));
  console.log('  --think              ' + chalk.gray('Enable thinking mode (Ollama only)'));
  console.log('  --no-think           ' + chalk.gray('Disable thinking mode'));
  console.log('  --debug              ' + chalk.gray('Enable deep trace mode'));
  console.log('  -h, --help           ' + chalk.gray('Show help'));
  console.log('  -V, --version        ' + chalk.gray('Show version\n'));

  console.log(chalk.yellow.bold('EXAMPLES:'));
  console.log(chalk.gray('  $ cogit                           # Open interactive menu'));
  console.log(chalk.gray('  $ cogit auto                      # Quick AI commit'));
  console.log(chalk.gray('  $ cogit auto -y --no-push         # Auto commit, no push'));
  console.log(chalk.gray('  $ cogit auto -m "fix bug"         # Commit with context hint'));
  console.log(chalk.gray('  $ cogit health                    # Check all AI providers\n'));
};

program
  .name('cogit')
  .description('Git automation CLI with AI-powered commit messages')
  .version('1.0.0')
  .helpOption(false);

// Custom help handlers
program.on('--help', () => {
  showCustomHelp();
  process.exit(0);
});

program.on('-h', () => {
  showCustomHelp();
  process.exit(0);
});

// Handle help flags before parse
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showCustomHelp();
  process.exit(0);
}

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
  .option('--auto-push', 'Force enable auto push for this operation')
  .option('--no-auto-push', 'Force disable auto push for this operation')
  .option('--think', 'Enable thinking mode (Ollama only)')
  .option('--no-think', 'Disable thinking mode')
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

program
  .command('check-connectivity')
  .description('Check network connectivity and GitHub access')
  .option('-f, --force', 'Force fresh connectivity check (ignore cache)')
  .option('-r, --repo <path>', 'Repository path (default: current directory)')
  .action(async (options) => {
    const { checkConnectivityCommand } = await import('./cli/commands/check-connectivity');
    await checkConnectivityCommand.action(options);
  });

// Default behavior: open menu when no command provided
program.action(async () => {
  await menuCommand();
});

program.parse();
