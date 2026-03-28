import chalk from 'chalk';

export function renderHeader(title: string): void {
  const line = '═'.repeat(50);
  console.log(chalk.cyan(`\n${line}`));
  console.log(chalk.bold.white(`  ${title}`));
  console.log(chalk.cyan(`${line}\n`));
}

export function renderCommitMessage(message: string): void {
  const lines = message.split('\n');
  const title = lines[0];
  const body = lines.slice(1).join('\n');
  
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.bold.white('Generated Commit Message:'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.yellow.bold(title));
  
  if (body) {
    console.log(chalk.gray(body));
  }
  
  console.log(chalk.cyan('═'.repeat(50)));
}

export function renderSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

export function renderError(message: string): void {
  console.log(chalk.red(`✗ ${message}`));
}

export function renderWarning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

export function renderInfo(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}

export function renderFileList(files: string[], title: string): void {
  console.log(chalk.cyan(`\n${title}:`));
  files.forEach(file => {
    console.log(chalk.gray(`  • ${file}`));
  });
}

export function renderDiffPreview(diff: string, maxLines: number = 20): void {
  const lines = diff.split('\n').slice(0, maxLines);
  
  console.log(chalk.cyan('\n📝 Diff Preview:'));
  console.log(chalk.gray('─'.repeat(40)));
  
  lines.forEach(line => {
    if (line.startsWith('+')) {
      console.log(chalk.green(line));
    } else if (line.startsWith('-')) {
      console.log(chalk.red(line));
    } else if (line.startsWith('@@')) {
      console.log(chalk.cyan(line));
    } else {
      console.log(chalk.gray(line));
    }
  });
  
  if (diff.split('\n').length > maxLines) {
    console.log(chalk.gray(`... (${diff.split('\n').length - maxLines} more lines)`));
  }
}

export function renderDryRun(commands: string[]): void {
  console.log(chalk.cyan('\n🔍 DRY RUN MODE - No changes will be made'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.yellow('Would execute:'));
  commands.forEach(cmd => {
    console.log(chalk.gray(`  ${cmd}`));
  });
}

export function renderHealerAttempt(attempt: number, commands: string[], success: boolean, error?: string): void {
  if (success) {
    console.log(chalk.green(`  Attempt ${attempt}: ${commands.join(', ')} - Success`));
  } else {
    console.log(chalk.red(`  Attempt ${attempt}: ${commands.join(', ')} - Failed`));
    if (error) {
      console.log(chalk.gray(`    Error: ${error}`));
    }
  }
}

export function renderThinking(thinking: string): void {
  console.log(chalk.dim('═'.repeat(50)));
  console.log(chalk.dim.bold('💭 Thinking:'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log(chalk.dim.gray(thinking));
  console.log(chalk.dim('═'.repeat(50)));
  console.log();
}
