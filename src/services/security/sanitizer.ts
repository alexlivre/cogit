const BLOCKED_PATTERNS: readonly string[] = [
  '.ssh/', '.aws/', '.azure/', '.kube/', '.gnupg/', '.docker/',
  'id_rsa', 'id_ed25519', 'id_dsa', 'id_ecdsa',
  '*.pem', '*.key', '*.p12', '*.pfx', '*.keystore', '*.jks',
  '.env', '.env.local', '.env.development', '.env.production', '.env.test',
  'secrets.yaml', 'secrets.json',
  '.bash_history', '.zsh_history', '.python_history', '.mysql_history', '.psql_history',
  '**/token.txt', '**/password.txt', '**/credentials.json'
];

export interface SanitizerResult {
  isClean: boolean;
  blockedFiles: string[];
  message?: string;
}

function matchPattern(filename: string, pattern: string): boolean {
  const normalizedPattern = pattern.toLowerCase().replace(/\*/g, '.*');
  const normalizedFilename = filename.toLowerCase();
  
  if (pattern.startsWith('**/')) {
    return normalizedFilename.includes(normalizedPattern.replace('**/', ''));
  }
  
  if (pattern.endsWith('/*')) {
    return normalizedFilename.startsWith(normalizedPattern.replace('/*', '/'));
  }
  
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${normalizedPattern}$`);
    return regex.test(normalizedFilename);
  }
  
  return normalizedFilename === normalizedPattern || normalizedFilename.includes(normalizedPattern);
}

export function sanitizeFiles(files: string[]): SanitizerResult {
  const blockedFiles: string[] = [];
  
  for (const file of files) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (matchPattern(file, pattern)) {
        blockedFiles.push(file);
        break;
      }
    }
  }
  
  return {
    isClean: blockedFiles.length === 0,
    blockedFiles,
    message: blockedFiles.length > 0 
      ? `Security alert: Blocked files detected: ${blockedFiles.join(', ')}`
      : undefined,
  };
}
