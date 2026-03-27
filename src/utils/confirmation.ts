import inquirer from 'inquirer';
import chalk from 'chalk';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sem I, O (confusão)
const NUMBERS = '23456789'; // Sem 0, 1 (confusão)

/**
 * Generates a 4-character confirmation code
 * Pattern: Letter-Number-Letter-Letter (e.g., B2CR)
 */
export function generateConfirmationCode(): string {
  const pattern = [
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
    NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
  ];
  
  return pattern.join('');
}

/**
 * Validates the confirmation code input
 * Case-insensitive comparison
 */
export function validateConfirmationCode(input: string, expected: string): boolean {
  return input.toUpperCase().trim() === expected.toUpperCase();
}

/**
 * Prompts user for confirmation of destructive operations
 * Displays a 4-character code that must be typed to proceed
 */
export async function confirmDestructiveOperation(operation: string): Promise<boolean> {
  const code = generateConfirmationCode();
  
  console.log(chalk.red.bold('\n⚠️  DESTRUCTIVE OPERATION'));
  console.log(chalk.yellow(`Operation: ${operation}`));
  console.log(chalk.cyan(`Confirmation code: ${chalk.bold.white(code)}`));
  console.log(chalk.gray('Type this code to confirm.\n'));
  
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message: 'Confirmation code:',
      validate: (value: string) => {
        if (validateConfirmationCode(value, code)) {
          return true;
        }
        return 'Invalid confirmation code. Operation cancelled.';
      },
    },
  ]);
  
  return validateConfirmationCode(input, code);
}

/**
 * List of operations that require confirmation
 */
export const PROTECTED_OPERATIONS = [
  'delete_tag_local',
  'delete_tag_remote',
  'reset_to_tag',
  'delete_branch',
  'force_push',
];
