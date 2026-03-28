import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { scanRepository } from '../../services/git/scanner';
import { sanitizeFiles } from '../../services/security/sanitizer';
import { generateCommitMessage } from '../../services/ai/brain';
import { executeCommit } from '../../services/git/executor';
import { healGitError } from '../../services/git/healer';
import { validateConfig, CONFIG } from '../../config/env';
import { t } from '../../config/i18n';
import { renderCommitMessage, renderDryRun, renderWarning, renderSuccess, renderError, renderHealerAttempt } from '../ui/renderer';
import { reviewCommitMessage, editCommitMessage } from '../ui/prompts';
import { stealthStash, stealthRestore, hasPrivateConfig } from '../../services/tools/stealth';
import { suggestIgnore } from '../../services/tools/ignore';
import { debugLogger } from '../ui/debug-logger';

export interface AutoOptions {
  yes?: boolean;
  noPush?: boolean;
  nobuild?: boolean;
  message?: string;
  path?: string;
  dryRun?: boolean;
  branch?: string;
  debug?: boolean;
}

export async function autoCommand(options: AutoOptions): Promise<void> {
  const repoPath = options.path || process.cwd();
  
  // Debug Mode: Enable logging
  if (options.debug) {
    debugLogger.enable();
    console.log(chalk.yellow('🔍 Debug mode enabled. Logging to .vibe-debug.log'));
  }
  
  // Stealth Mode: Hide private files if configured
  let stealthResult: { hiddenFiles: string[]; tempPath: string; success: boolean; error?: string } = { hiddenFiles: [], tempPath: '', success: true };
  if (hasPrivateConfig(repoPath)) {
    console.log(chalk.cyan('🔒 Stealth Mode: Hiding private files...'));
    stealthResult = await stealthStash(repoPath);
    if (!stealthResult.success) {
      console.error(chalk.red(`Stealth Mode error: ${stealthResult.error}`));
    } else if (stealthResult.hiddenFiles.length > 0) {
      console.log(chalk.green(`✓ Hidden ${stealthResult.hiddenFiles.length} private files`));
    }
  }
  
  try {
    // Handle branch option before starting commit flow
    if (options.branch) {
    const { listBranches, createBranch, switchBranch } = await import('../../services/git/branch');
    
    const branches = await listBranches(repoPath);
    const existingBranch = branches.find(b => b.name === options.branch && !b.remote);
    
    if (existingBranch) {
      console.log(chalk.cyan(`Switching to existing branch: ${options.branch}`));
      const switchResult = await switchBranch(repoPath, options.branch);
      if (!switchResult.success) {
        console.error(chalk.red(`Failed to switch branch: ${switchResult.error}`));
        process.exit(1);
      }
    } else {
      console.log(chalk.cyan(`Creating new branch: ${options.branch}`));
      const createResult = await createBranch(repoPath, options.branch);
      if (!createResult.success) {
        console.error(chalk.red(`Failed to create branch: ${createResult.error}`));
        process.exit(1);
      }
    }
  }
  
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
  
  const startTime = Date.now();
  const brainResult = await generateCommitMessage({
    diff: scanResult.diff,
    hint: options.message,
    language: commitLang,
    debug: options.debug,
  });
  
  if (options.debug) {
    debugLogger.logResponse('brain', brainResult.message || '', Date.now() - startTime);
  }
  
  if (!brainResult.success) {
    aiSpinner.fail(brainResult.error || 'AI generation failed');
    process.exit(1);
  }
  
  aiSpinner.succeed(t('auto.generating'));
  
  let finalMessage = brainResult.message;
  
  // Add [CI Skip] prefix if nobuild option
  if (options.nobuild && finalMessage) {
    finalMessage = `[CI Skip] ${finalMessage}`;
  }
  
  renderCommitMessage(finalMessage || '');
  
  // Review loop
  if (!options.yes) {
    let reviewing = true;
    
    while (reviewing) {
      const action = await reviewCommitMessage(finalMessage || '');
      
      switch (action) {
        case 'execute':
          reviewing = false;
          break;
          
        case 'regenerate':
          const regenerateSpinner = ora(t('auto.generating')).start();
          const regenerateResult = await generateCommitMessage({
            diff: scanResult.diff,
            hint: options.message,
            language: commitLang,
          });
          regenerateSpinner.succeed();
          
          if (regenerateResult.success) {
            finalMessage = regenerateResult.message!;
            if (options.nobuild) {
              finalMessage = `[CI Skip] ${finalMessage}`;
            }
            renderCommitMessage(finalMessage);
          }
          break;
          
        case 'edit':
          finalMessage = await editCommitMessage(finalMessage || '');
          renderCommitMessage(finalMessage);
          break;
          
        case 'cancel':
          console.log(chalk.yellow(t('auto.cancel')));
          process.exit(0);
      }
    }
  }
  
  // Dry run mode - don't execute anything
  if (options.dryRun) {
    const commands = [
      'git add -A',
      `git commit -m "${finalMessage}"`,
    ];
    if (!options.noPush) {
      commands.push('git push');
    }
    renderDryRun(commands);
    return;
  }
  
  const execSpinner = ora(t('auto.executing')).start();
  const result = await executeCommit(repoPath, finalMessage || '', !options.noPush);
  
  if (result.success) {
    execSpinner.succeed(t('auto.success'));
    
    // Smart Ignore: Suggest .gitignore patterns after successful commit
    const { suggest } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'suggest',
        message: 'Check for .gitignore suggestions?',
        default: false,
      },
    ]);
    
    if (suggest) {
      await suggestIgnore(repoPath);
    }
  } else {
    execSpinner.fail(t('error.push_failed', { error: result.error || 'Unknown error' }));
    
    // Try to heal push errors
    if (!options.noPush && result.error?.includes('push')) {
      renderWarning('Push failed. Attempting to heal...');
      
      const healerResult = await healGitError({
        repoPath,
        failedCommand: 'git push',
        errorOutput: result.error || '',
        maxRetries: 3,
      });
      
      if (healerResult.success) {
        renderSuccess('Healed successfully!');
      } else {
        renderError('Healing failed. Manual intervention required.');
        healerResult.attempts.forEach(a => {
          renderHealerAttempt(a.attempt, a.commands, a.success, a.error);
        });
      }
    }
    
    process.exit(1);
  }
  } finally {
    // Stealth Mode: Restore hidden files
    if (stealthResult.hiddenFiles.length > 0) {
      console.log(chalk.cyan('🔒 Stealth Mode: Restoring private files...'));
      const restoreResult = await stealthRestore(repoPath);
      if (!restoreResult.success) {
        console.error(chalk.red(`Stealth restore error: ${restoreResult.error}`));
      } else {
        if (restoreResult.restoredFiles.length > 0) {
          console.log(chalk.green(`✓ Restored ${restoreResult.restoredFiles.length} private files`));
        }
        if (restoreResult.conflicts.length > 0) {
          console.log(chalk.yellow(`⚠ ${restoreResult.conflicts.length} conflicts renamed to .restored`));
        }
      }
    }
  }
}
