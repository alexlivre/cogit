import inquirer from 'inquirer';
import chalk from 'chalk';
import { separatorLine } from '../ui/separator';
import { autoCommand } from './auto/index';
import { scanRepository } from '../../services/git/scanner';
import { CONFIG } from '../../config/env';
import { t } from '../../config/i18n';
import { showMenu, confirmPush, confirmSkipCI, confirmDryRun, inputHint } from '../ui/prompts';
import { suggestIgnore, addWhitelistEntry } from '../../services/tools/ignore';
import { createPrivateConfig, hasPrivateConfig } from '../../services/tools/stealth';

export async function menuCommand(): Promise<void> {
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║') + chalk.white.bold('              Open Source Project                         ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('║') + '                                                          ' + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('║') + chalk.white.bold('     COGIT - Your AI-Powered Git Automation CLI           ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('║') + '                                                          ' + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('║') + chalk.gray('     by Alex Santos (alexlivre)                           ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('║') + chalk.gray('     github.com/alexlivre/cogit                          ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝\n'));

  const action = await showMenu('What would you like to do?', [
    { name: '🚀 Quick Commit (auto)', value: 'auto' },
    { name: '📝 Commit with options', value: 'commit-options' },
    { name: '🌿 Branch Center', value: 'branch' },
    { name: '🏷️  Tag Operations', value: 'tag' },
    { name: '�️  Smart Ignore', value: 'smart-ignore' },
    { name: '🔒 Stealth Mode Config', value: 'stealth' },
    { name: '� View Repository Status', value: 'status' },
    { name: '🤖 Check AI Providers', value: 'check-ai' },
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
      const { branchCenter } = await import('../../services/git/branch');
      await branchCenter(process.cwd());
      await returnToMenu();
      break;
    
    case 'tag':
      const { tagCenter } = await import('../../services/git/tag');
      await tagCenter(process.cwd());
      await returnToMenu();
      break;
    
    case 'smart-ignore':
      await suggestIgnore(process.cwd());
      await returnToMenu();
      break;
    
    case 'stealth':
      await configureStealth();
      await returnToMenu();
      break;
    
    case 'status':
      await showStatus();
      await returnToMenu();
      break;
    
    case 'check-ai':
      const { checkAICommand } = await import('./check-ai');
      await checkAICommand();
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
  console.log(chalk.gray(separatorLine(40)));
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
  console.log(chalk.gray(separatorLine(40)));
  console.log(`Language: ${CONFIG.LANGUAGE}`);
  console.log(`Commit Language: ${CONFIG.COMMIT_LANGUAGE}`);
  console.log(`AI Provider: ${CONFIG.AI_PROVIDER}`);
  console.log(`Model: ${CONFIG.OPENROUTER_MODEL}`);
}

async function configureStealth(): Promise<void> {
  console.log(chalk.cyan('\n🔒 Stealth Mode Configuration:'));
  console.log(chalk.gray(separatorLine(40)));
  
  if (hasPrivateConfig(process.cwd())) {
    console.log(chalk.green('✓ .gitpy-private file exists'));
    const { edit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'edit',
        message: 'Edit existing configuration?',
        default: false,
      },
    ]);
    
    if (!edit) {
      return;
    }
  }
  
  const { patterns } = await inquirer.prompt([
    {
      type: 'input',
      name: 'patterns',
      message: 'Enter patterns to hide (comma-separated):',
      default: '*.local, *.secret, private/',
    },
  ]);
  
  const patternList = patterns.split(',').map((p: string) => p.trim()).filter(Boolean);
  
  if (patternList.length > 0) {
    createPrivateConfig(process.cwd(), patternList);
    console.log(chalk.green(`\n✓ Created .gitpy-private with ${patternList.length} patterns`));
    console.log(chalk.gray('Patterns:'));
    patternList.forEach((p: string) => console.log(chalk.gray(`  - ${p}`)));
  }
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
