import inquirer from 'inquirer';
import chalk from 'chalk';
import { autoCommand } from './auto';
import { scanRepository } from '../../services/git/scanner';
import { CONFIG } from '../../config/env';
import { t } from '../../config/i18n';
import { showMenu, confirmPush, confirmSkipCI, confirmDryRun, inputHint } from '../ui/prompts';

export async function menuCommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         COGIT CLI - MENU             ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════╝\n'));

  const action = await showMenu('What would you like to do?', [
    { name: '🚀 Quick Commit (auto)', value: 'auto' },
    { name: '📝 Commit with options', value: 'commit-options' },
    { name: '🌿 Branch Center', value: 'branch' },
    { name: '🏷️  Tag Operations', value: 'tag' },
    { name: '🔍 View Repository Status', value: 'status' },
    { name: '⚙️  Settings', value: 'settings' },
    { name: '❌ Exit', value: 'exit' },
  ]);

  switch (action) {
    case 'auto':
      await autoCommand({ yes: false });
      break;
    
    case 'commit-options':
      await commitWithOptions();
      break;
    
    case 'branch':
      console.log(chalk.yellow('Branch Center - Coming in Phase 3'));
      await returnToMenu();
      break;
    
    case 'tag':
      console.log(chalk.yellow('Tag Operations - Coming in Phase 3'));
      await returnToMenu();
      break;
    
    case 'status':
      await showStatus();
      await returnToMenu();
      break;
    
    case 'settings':
      await showSettings();
      await returnToMenu();
      break;
    
    case 'exit':
      console.log(chalk.green('Goodbye! 👋'));
      process.exit(0);
  }
}

async function commitWithOptions(): Promise<void> {
  const push = await confirmPush();
  const nobuild = await confirmSkipCI();
  const hint = await inputHint();
  const dryRun = await confirmDryRun();

  await autoCommand({
    yes: false,
    noPush: !push,
    nobuild: nobuild,
    message: hint || undefined,
    dryRun: dryRun,
  });
}

async function showStatus(): Promise<void> {
  const scan = await scanRepository(process.cwd());
  
  console.log(chalk.cyan('\n📊 Repository Status:'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`Staged files: ${chalk.green(scan.stagedFiles.length.toString())}`);
  console.log(`Unstaged files: ${chalk.yellow(scan.unstagedFiles.length.toString())}`);
  
  if (scan.stagedFiles.length > 0) {
    console.log(chalk.green('\n✓ Staged:'));
    scan.stagedFiles.forEach((f: string) => console.log(`  ${f}`));
  }
  
  if (scan.unstagedFiles.length > 0) {
    console.log(chalk.yellow('\n⚠ Unstaged:'));
    scan.unstagedFiles.forEach((f: string) => console.log(`  ${f}`));
  }
}

async function showSettings(): Promise<void> {
  console.log(chalk.cyan('\n⚙️  Current Settings:'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`Language: ${CONFIG.LANGUAGE}`);
  console.log(`Commit Language: ${CONFIG.COMMIT_LANGUAGE}`);
  console.log(`AI Provider: ${CONFIG.AI_PROVIDER}`);
  console.log(`Model: ${CONFIG.OPENROUTER_MODEL}`);
}

async function returnToMenu(): Promise<void> {
  const { returnToMenu } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'returnToMenu',
      message: 'Return to main menu?',
      default: true,
    },
  ]);
  
  if (returnToMenu) {
    await menuCommand();
  } else {
    console.log(chalk.green('Goodbye! 👋'));
    process.exit(0);
  }
}
