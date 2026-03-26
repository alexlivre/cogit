import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { scanRepository } from '../services/git/scanner';
import { sanitizeFiles } from '../services/security/sanitizer';
import { generateCommitMessage } from '../services/ai/brain';
import { executeCommit } from '../services/git/executor';
import { validateConfig, CONFIG } from '../config/env';
import { t } from '../config/i18n';

interface AutoOptions {
  yes?: boolean;
  noPush?: boolean;
  message?: string;
  path?: string;
}

export async function autoCommand(options: AutoOptions): Promise<void> {
  const repoPath = options.path || process.cwd();
  
  const config = validateConfig();
  if (!config.valid) {
    console.error(chalk.red('Configuration errors:'));
    config.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
    process.exit(1);
  }
  
  const lang = CONFIG.LANGUAGE;
  const commitLang = CONFIG.COMMIT_LANGUAGE;
  
  const scanSpinner = ora(t('auto.processing')).start();
  const scanResult = await scanRepository(repoPath);
  
  if (!scanResult.isRepo) {
    scanSpinner.fail(t('error.not_repo'));
    process.exit(1);
  }
  
  if (!scanResult.hasChanges) {
    scanSpinner.fail(t('auto.no_changes'));
    process.exit(0);
  }
  
  scanSpinner.succeed(t('auto.processing'));
  
  const allFiles = [...scanResult.stagedFiles, ...scanResult.unstagedFiles];
  const sanitizerResult = sanitizeFiles(allFiles);
  
  if (!sanitizerResult.isClean) {
    console.error(chalk.red(t('error.blocked_files', { files: sanitizerResult.blockedFiles.join(', ') })));
    process.exit(1);
  }
  
  const aiSpinner = ora(t('auto.generating')).start();
  const brainResult = await generateCommitMessage({
    diff: scanResult.diff,
    hint: options.message,
    language: commitLang,
  });
  
  if (!brainResult.success) {
    aiSpinner.fail(brainResult.error || 'AI generation failed');
    process.exit(1);
  }
  
  aiSpinner.succeed(t('auto.generating'));
  
  console.log('\n' + chalk.cyan('═'.repeat(50)));
  console.log(chalk.bold.white('Generated Commit Message:'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.yellow(brainResult.message));
  console.log(chalk.cyan('═'.repeat(50)) + '\n');
  
  let finalMessage = brainResult.message;
  
  if (!options.yes) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: t('auto.confirm'),
        choices: [
          { name: '✓ Execute', value: 'execute' },
          { name: '🔄 Regenerate', value: 'regenerate' },
          { name: '✗ Cancel', value: 'cancel' },
        ],
      },
    ]);
    
    if (answer.action === 'cancel') {
      console.log(chalk.yellow(t('auto.cancel')));
      process.exit(0);
    }
    
    if (answer.action === 'regenerate') {
      const regenerateSpinner = ora(t('auto.generating')).start();
      const regenerateResult = await generateCommitMessage({
        diff: scanResult.diff,
        hint: options.message,
        language: commitLang,
      });
      regenerateSpinner.succeed();
      
      if (regenerateResult.success) {
        finalMessage = regenerateResult.message!;
        console.log('\n' + chalk.cyan('═'.repeat(50)));
        console.log(chalk.yellow(finalMessage));
        console.log(chalk.cyan('═'.repeat(50)) + '\n');
      }
    }
  }
  
  const execSpinner = ora(t('auto.executing')).start();
  const result = await executeCommit(repoPath, finalMessage || '', !options.noPush);
  
  if (result.success) {
    execSpinner.succeed(t('auto.success'));
  } else {
    execSpinner.fail(t('error.push_failed', { error: result.error || 'Unknown error' }));
    process.exit(1);
  }
}
