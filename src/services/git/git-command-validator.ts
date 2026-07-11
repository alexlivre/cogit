/**
 * Whitelist-based validator for Git commands suggested by an LLM in the
 * healer flow. Replaces the old permissive string-matching filter, which
 * only blocked 4 dangerous patterns and let through `rm -rf`, `curl|sh`,
 * `git push --mirror`, `git filter-branch`, etc.
 *
 * Defense layers:
 *   1. argv[0] must be exactly "git".
 *   2. argv[1] must be a subcommand in the whitelist.
 *   3. Each remaining token must be either a flag in that subcommand's
 *      allow-list (with optional "=value" suffix) or a positional whose
 *      value matches that subcommand's positional policy.
 *   4. No token may contain shell metacharacters or control characters.
 *
 * The validator returns { safe, reason } so callers can log or surface the
 * reason when rejecting a command suggested by the AI.
 */

export interface ValidationResult {
  safe: boolean;
  reason?: string;
}

interface SubcommandRule {
  readonly allowedFlags: ReadonlySet<string>;
  readonly allowedPositionals?: ReadonlySet<string>;
}

const FORBIDDEN_TOKEN_CHARS = /[;|&<>`$\x00\n\r\\]/;

const ALLOWED_SUBCOMMANDS = new Set([
  'add',
  'branch',
  'checkout',
  'commit',
  'config',
  'fetch',
  'log',
  'pull',
  'push',
  'rebase',
  'reset',
  'rev-list',
  'show',
  'status',
  'stash',
  'tag',
]);

const RULES: Record<string, SubcommandRule> = {
  add: {
    allowedFlags: new Set([
      '-A',
      '--all',
      '-u',
      '--update',
      '--no-all',
      '--untracked',
      '--no-untracked',
      '--intent-to-add',
      '-N',
      '--modified',
      '--cached',
      '--staged',
      '--no-warn-ignored',
      '-q',
      '--quiet',
      '-v',
      '--verbose',
      '--no-edit',
      '-n',
      '--dry-run',
      '--renames',
      '--no-renames',
    ]),
  },
  branch: {
    allowedFlags: new Set([
      '-a',
      '--all',
      '-r',
      '--remotes',
      '-l',
      '--list',
      '-v',
      '--verbose',
      '-vv',
      '-vvv',
      '--no-color',
      '--no-abbrev',
      '--no-track',
      '-t',
      '--track',
      '--set-upstream-to',
      '--unset-upstream',
      '--show-current',
      '-m',
      '--move',
      '-c',
      '--copy',
      '--format',
      '--sort',
      '-q',
      '--quiet',
    ]),
  },
  checkout: {
    allowedFlags: new Set([
      '-b',
      '-B',
      '-q',
      '--quiet',
      '-t',
      '--track',
      '--no-track',
      '--orphan',
      '--merge',
      '-m',
      '-',
      '--detach',
      '--overwrite-ignore',
      '--no-overwrite-ignore',
    ]),
  },
  commit: {
    allowedFlags: new Set([
      '-a',
      '--all',
      '-m',
      '-F',
      '--file',
      '--amend',
      '--no-edit',
      '--allow-empty',
      '--allow-empty-message',
      '--no-verify',
      '--author',
      '--date',
      '-q',
      '--quiet',
      '-v',
      '--verbose',
      '-S',
      '--gpg-sign',
      '--no-gpg-sign',
      '-s',
      '--signoff',
      '--no-signoff',
      '--reset-author',
      '--patch',
      '-p',
      '--no-patch',
    ]),
  },
  config: {
    allowedFlags: new Set([
      '--get',
      '--get-all',
      '--get-regexp',
      '--get-urlmatch',
      '--list',
      '-l',
      '--local',
      '--global',
      '--system',
      '--worktree',
      '--unset',
      '--unset-all',
      '--add',
      '--replace-all',
      '--type',
      '--bool',
      '--int',
      '--bool-or-int',
      '--path',
      '--expiry-date',
      '--show-scope',
      '-f',
      '--file',
      '-z',
      '--null',
    ]),
  },
  fetch: {
    allowedFlags: new Set([
      '--all',
      '--prune',
      '-p',
      '--prune-tags',
      '-P',
      '--tags',
      '-t',
      '--no-tags',
      '--depth',
      '--unshallow',
      '--deepen',
      '--shallow-since',
      '--shallow-exclude',
      '-q',
      '--quiet',
      '-v',
      '--verbose',
    ]),
  },
  log: {
    allowedFlags: new Set([
      '--oneline',
      '--graph',
      '--all',
      '--branches',
      '--tags',
      '--remotes',
      '--decorate',
      '--no-decorate',
      '-n',
      '--max-count',
      '--skip',
      '--since',
      '--after',
      '--until',
      '--before',
      '--author',
      '--committer',
      '--grep',
      '--grep-reflog',
      '-p',
      '-u',
      '--patch',
      '-s',
      '--no-patch',
      '--stat',
      '--shortstat',
      '--name-only',
      '--name-status',
      '--abbrev-commit',
      '--no-abbrev-commit',
      '--pretty',
      '-q',
      '--quiet',
    ]),
  },
  pull: {
    allowedFlags: new Set([
      '--rebase',
      '--no-rebase',
      '--ff-only',
      '--ff',
      '--no-ff',
      '--commit',
      '--no-commit',
      '--all',
      '--prune',
      '-p',
      '--tags',
      '-t',
      '--no-tags',
      '--depth',
      '--unshallow',
      '--autostash',
      '--no-autostash',
      '-q',
      '--quiet',
      '-v',
      '--verbose',
    ]),
  },
  push: {
    allowedFlags: new Set([
      '--force-with-lease',
      '--force-with-lease=<refspec>',
      '--set-upstream',
      '-u',
      '--tags',
      '-t',
      '--no-tags',
      '--follow-tags',
      '--dry-run',
      '-n',
      '--atomic',
      '--no-atomic',
      '--push-option',
      '-o',
      '-q',
      '--quiet',
      '-v',
      '--verbose',
    ]),
  },
  rebase: {
    allowedFlags: new Set([
      '--continue',
      '--skip',
      '--abort',
      '--quit',
      '--interactive',
      '-i',
      '--onto',
      '--autostash',
      '--no-autostash',
      '--empty',
      '--keep-empty',
      '--no-keep-empty',
      '-q',
      '--quiet',
      '-v',
      '--verbose',
      '--stat',
      '-f',
      '--force-rebase',
    ]),
  },
  reset: {
    allowedFlags: new Set([
      '--soft',
      '--mixed',
      '--keep',
      '-q',
      '--quiet',
    ]),
  },
  'rev-list': {
    allowedFlags: new Set([
      '--count',
      '--max-count',
      '-n',
      '--all',
      '--branches',
      '--tags',
      '--remotes',
      '--since',
      '--after',
      '--until',
      '--before',
      '--author',
      '--grep',
      '--objects',
      '--pretty',
      '--abbrev-commit',
      '--no-abbrev-commit',
      '-q',
      '--quiet',
    ]),
  },
  show: {
    allowedFlags: new Set([
      '--stat',
      '--pretty',
      '--name-only',
      '--name-status',
      '--no-patch',
      '-s',
      '--abbrev-commit',
      '--no-abbrev-commit',
      '-q',
      '--quiet',
    ]),
  },
  status: {
    allowedFlags: new Set([
      '--short',
      '-s',
      '--branch',
      '-b',
      '--porcelain',
      '--porcelain=v2',
      '--untracked-files',
      '-u',
      '--no-renames',
      '--long',
      '-v',
      '--verbose',
    ]),
  },
  stash: {
    allowedFlags: new Set([
      '-u',
      '--include-untracked',
      '--no-include-untracked',
      '-q',
      '--quiet',
      '--keep-index',
      '-m',
      '--message',
      '--all',
    ]),
    allowedPositionals: new Set([
      'save',
      'push',
      'pop',
      'apply',
      'list',
      'show',
      'clear',
      'branch',
      'create',
    ]),
  },
  tag: {
    allowedFlags: new Set([
      '-l',
      '--list',
      '-a',
      '--annotate',
      '-m',
      '-F',
      '--file',
      '--sort',
      '--format',
      '--no-color',
      '--contains',
      '--merged',
      '--no-merged',
      '--points-at',
      '-n',
      '--no-merge',
      '--ignore-case',
      '-i',
    ]),
  },
};

function getFlagBase(flag: string): string {
  const eqIdx = flag.indexOf('=');
  return eqIdx > 0 ? flag.substring(0, eqIdx) : flag;
}

function isFlagAllowed(flag: string, allowed: ReadonlySet<string>): boolean {
  if (allowed.has(flag)) return true;
  const base = getFlagBase(flag);
  if (allowed.has(base)) return true;
  return false;
}

export function isValidGitCommand(argv: readonly string[]): ValidationResult {
  if (!argv || argv.length === 0) {
    return { safe: false, reason: 'empty command' };
  }

  if (argv[0] !== 'git') {
    return { safe: false, reason: `first token must be 'git', got '${argv[0]}'` };
  }

  if (argv.length < 2) {
    return { safe: false, reason: "missing git subcommand after 'git'" };
  }

  const subcommand = argv[1];

  if (!ALLOWED_SUBCOMMANDS.has(subcommand)) {
    return { safe: false, reason: `git subcommand '${subcommand}' is not allowed` };
  }

  const rule = RULES[subcommand];

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];

    if (token.length === 0) continue;

    if (FORBIDDEN_TOKEN_CHARS.test(token)) {
      return {
        safe: false,
        reason: `token at position ${i} contains forbidden shell/control characters: ${JSON.stringify(token)}`,
      };
    }

    if (token.startsWith('-')) {
      if (!isFlagAllowed(token, rule.allowedFlags)) {
        return {
          safe: false,
          reason: `flag '${token}' is not allowed for git ${subcommand}`,
        };
      }
      continue;
    }

    if (rule.allowedPositionals) {
      if (!rule.allowedPositionals.has(token)) {
        return {
          safe: false,
          reason: `positional '${token}' is not allowed for git ${subcommand}`,
        };
      }
    }
  }

  return { safe: true };
}