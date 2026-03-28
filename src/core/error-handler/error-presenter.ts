/**
 * Error Presenter - Formats and displays errors to the user
 * Single Responsibility: Present errors in a clear, actionable format
 */

import chalk from 'chalk';
import { ClassifiedError, ErrorCategory } from './error-classifier';
import { getSolution, formatSolution, ErrorSolution } from './error-solutions';
import { t } from '../../config/i18n';

const BOX_WIDTH = 60;

/**
 * Draw a horizontal line
 */
function drawLine(char: string = '═'): string {
  return char.repeat(BOX_WIDTH);
}

/**
 * Wrap text to fit in box width
 */
function wrapText(text: string, indent: number = 2): string[] {
  const maxWidth = BOX_WIDTH - (indent * 2) - 2;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Format a line with padding
 */
function formatLine(text: string, indent: number = 2): string {
  const padding = ' '.repeat(indent);
  const rightPadding = ' '.repeat(BOX_WIDTH - text.length - (indent * 2) - 2);
  return `║${padding}${text}${rightPadding}║`;
}

/**
 * Get category emoji
 */
function getCategoryEmoji(category: ErrorCategory): string {
  switch (category) {
    case 'GIT':
      return '🔧';
    case 'AI':
      return '🤖';
    case 'NETWORK':
      return '🌐';
    case 'CONFIG':
      return '⚙️';
    default:
      return '❌';
  }
}

/**
 * Get category color
 */
function getCategoryColor(category: ErrorCategory): typeof chalk {
  switch (category) {
    case 'GIT':
      return chalk.yellow;
    case 'AI':
      return chalk.magenta;
    case 'NETWORK':
      return chalk.blue;
    case 'CONFIG':
      return chalk.cyan;
    default:
      return chalk.red;
  }
}

/**
 * Present error in detailed format
 */
export function presentError(classified: ClassifiedError): void {
  const solution = formatSolution(getSolution(classified.category, classified.subtype), classified.context);
  const emoji = getCategoryEmoji(classified.category);
  const color = getCategoryColor(classified.category);

  // Header
  console.log();
  console.log(chalk.red(`╔${drawLine()}╗`));
  console.log(formatLine(chalk.red.bold(`  ${emoji} ERRO: ${solution.title}`)));
  console.log(chalk.red(`╠${drawLine()}╣`));

  // Cause section
  console.log(formatLine(chalk.white.bold('  Causa:')));
  const causeLines = wrapText(solution.cause, 2);
  causeLines.forEach(line => {
    console.log(formatLine(chalk.gray(`  ${line}`)));
  });
  console.log(formatLine(''));

  // Explanation section
  console.log(formatLine(chalk.white.bold('  Por que acontece:')));
  const explanationLines = wrapText(solution.explanation, 2);
  explanationLines.forEach(line => {
    console.log(formatLine(chalk.gray(`  ${line}`)));
  });
  console.log(formatLine(''));

  // Solutions section
  console.log(formatLine(chalk.green.bold('  Soluções:')));
  solution.solutions.forEach((s, index) => {
    console.log(formatLine(chalk.white(`  ${index + 1}. ${s.description}`)));
    if (s.command) {
      console.log(formatLine(chalk.cyan(`     $ ${s.command}`)));
    }
  });

  // Documentation link if available
  if (solution.docs) {
    console.log(formatLine(''));
    console.log(formatLine(chalk.blue(`  📚 Docs: ${solution.docs}`)));
  }

  // Footer
  console.log(chalk.red(`╚${drawLine()}╝`));
  console.log();
}

/**
 * Present error in compact format (for non-critical errors)
 */
export function presentErrorCompact(classified: ClassifiedError): void {
  const solution = formatSolution(getSolution(classified.category, classified.subtype), classified.context);
  const emoji = getCategoryEmoji(classified.category);

  console.log();
  console.log(chalk.yellow(`${emoji} ${solution.title}`));
  console.log(chalk.gray(`  ${solution.cause}`));

  if (solution.solutions.length > 0) {
    const firstSolution = solution.solutions[0];
    console.log(chalk.cyan(`  → ${firstSolution.description}`));
    if (firstSolution.command) {
      console.log(chalk.cyan(`    $ ${firstSolution.command}`));
    }
  }
  console.log();
}

/**
 * Present AI fallback options when all providers fail
 */
export function presentAIFallbackOptions(): void {
  console.log();
  console.log(chalk.magenta(`╔${drawLine()}╗`));
  console.log(formatLine(chalk.magenta.bold('  🤖 Todas as IAs falharam')));
  console.log(chalk.magenta(`╠${drawLine()}╣`));
  console.log(formatLine(chalk.white('  Não foi possível gerar mensagem automaticamente.')));
  console.log(formatLine(''));
  console.log(formatLine(chalk.white.bold('  O que deseja fazer?')));
  console.log(formatLine(''));
  console.log(formatLine(chalk.cyan('  1. 📝 Digitar minha própria mensagem')));
  console.log(formatLine(chalk.cyan('  2. 📋 Usar mensagem genérica automática')));
  console.log(formatLine(chalk.cyan('  3. ❌ Abortar operação')));
  console.log(chalk.magenta(`╚${drawLine()}╝`));
  console.log();
}

/**
 * Present network error with connectivity status
 */
export function presentNetworkError(
  classified: ClassifiedError,
  connectivity?: { hasInternet: boolean; hasGitHubConnection: boolean }
): void {
  const solution = formatSolution(getSolution(classified.category, classified.subtype), classified.context);

  console.log();
  console.log(chalk.blue(`╔${drawLine()}╗`));
  console.log(formatLine(chalk.blue.bold('  🌐 Erro de Conectividade')));
  console.log(chalk.blue(`╠${drawLine()}╣`));

  if (connectivity) {
    const internetStatus = connectivity.hasInternet
      ? chalk.green('✓ Conectado')
      : chalk.red('✗ Sem conexão');
    const githubStatus = connectivity.hasGitHubConnection
      ? chalk.green('✓ Acessível')
      : chalk.red('✗ Inacessível');

    console.log(formatLine(`  Internet: ${internetStatus}`));
    console.log(formatLine(`  GitHub:   ${githubStatus}`));
    console.log(formatLine(''));
  }

  console.log(formatLine(chalk.white.bold('  Causa:')));
  const causeLines = wrapText(solution.cause, 2);
  causeLines.forEach(line => {
    console.log(formatLine(chalk.gray(`  ${line}`)));
  });

  console.log(formatLine(''));
  console.log(formatLine(chalk.green.bold('  Soluções:')));
  solution.solutions.slice(0, 3).forEach((s, index) => {
    console.log(formatLine(chalk.white(`  ${index + 1}. ${s.description}`)));
    if (s.command) {
      console.log(formatLine(chalk.cyan(`     $ ${s.command}`)));
    }
  });

  console.log(chalk.blue(`╚${drawLine()}╝`));
  console.log();
}

/**
 * Present success message after error recovery
 */
export function presentRecoverySuccess(message: string): void {
  console.log();
  console.log(chalk.green(`╔${drawLine()}╗`));
  console.log(formatLine(chalk.green.bold('  ✓ Recuperação bem-sucedida')));
  console.log(chalk.green(`╠${drawLine()}╣`));
  console.log(formatLine(chalk.white(`  ${message}`)));
  console.log(chalk.green(`╚${drawLine()}╝`));
  console.log();
}

/**
 * Present error summary for multiple errors
 */
export function presentErrorSummary(errors: ClassifiedError[]): void {
  console.log();
  console.log(chalk.red.bold('  ❌ Resumo de Erros:'));
  console.log(chalk.gray('  ' + '─'.repeat(40)));

  const grouped = new Map<ErrorCategory, ClassifiedError[]>();
  errors.forEach(e => {
    const list = grouped.get(e.category) || [];
    list.push(e);
    grouped.set(e.category, list);
  });

  grouped.forEach((list, category) => {
    const emoji = getCategoryEmoji(category);
    console.log(chalk.white(`  ${emoji} ${category}: ${list.length} erro(s)`));
    list.forEach(e => {
      console.log(chalk.gray(`     - ${e.subtype}`));
    });
  });

  console.log();
}
