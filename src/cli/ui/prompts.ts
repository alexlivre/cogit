import inquirer from 'inquirer';

export async function confirmAction(message: string, defaultValue: boolean = false): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue,
    },
  ]);
  return confirmed;
}

export async function selectOption(message: string, choices: string[]): Promise<string> {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message,
      choices,
    },
  ]);
  return selected;
}

export async function inputText(message: string, defaultValue?: string): Promise<string> {
  const { text } = await inquirer.prompt([
    {
      type: 'input',
      name: 'text',
      message,
      default: defaultValue,
    },
  ]);
  return text;
}

export async function selectMultiple(message: string, choices: string[]): Promise<string[]> {
  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message,
      choices,
    },
  ]);
  return selected;
}

export async function reviewCommitMessage(message: string): Promise<'execute' | 'regenerate' | 'edit' | 'cancel'> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do with this message?',
      choices: [
        { name: '✓ Execute commit', value: 'execute' },
        { name: '🔄 Regenerate message', value: 'regenerate' },
        { name: '✏️  Edit message', value: 'edit' },
        { name: '✗ Cancel', value: 'cancel' },
      ],
    },
  ]);
  return action;
}

export async function editCommitMessage(currentMessage: string): Promise<string> {
  const { message } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'message',
      message: 'Edit commit message:',
      default: currentMessage,
    },
  ]);
  return message;
}

export interface MenuChoice {
  name: string;
  value: string;
}

export async function showMenu(title: string, choices: MenuChoice[]): Promise<string> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: title,
      choices,
    },
  ]);
  return action;
}

export async function confirmPush(): Promise<boolean> {
  return confirmAction('Push after commit?', true);
}

export async function confirmSkipCI(): Promise<boolean> {
  return confirmAction('Skip CI/CD? (adds [CI Skip])', false);
}

export async function confirmDryRun(): Promise<boolean> {
  return confirmAction('Dry run (simulation)?', false);
}

export async function inputHint(): Promise<string> {
  return inputText('Context hint for AI (optional):');
}
