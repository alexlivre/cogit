/**
 * Central Git ref name validation (Task F0.2).
 *
 * Mirrors `git check-ref-format` rules so that callers can validate branch /
 * tag names BEFORE they reach the git CLI, preventing shell injection and
 * ambiguous-ref exploits (e.g. `--delete`, `--upload-pack`, `..`, `@{`).
 *
 * F1.3, F1.4, F1.5 will apply these validators at every public entry point.
 */

const RESERVED_BRANCHES: ReadonlySet<string> = new Set([
  'HEAD',
  'FETCH_HEAD',
  'ORIG_HEAD',
  'MERGE_HEAD',
]);

const RESERVED_TAGS: ReadonlySet<string> = new Set(['HEAD']);

const FORBIDDEN_CHARS: RegExp = /[\s~^:?*\[\]\x00-\x1f\x7f]/;

const BASE_PATTERN: RegExp = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;

const MAX_REF_LENGTH = 200;

function violatesRule(name: string, predicate: (n: string) => boolean): boolean {
  return predicate(name);
}

function isValidRefName(name: string): boolean {
  if (violatesRule(name, (n) => n.length === 0)) return false;
  if (violatesRule(name, (n) => n.startsWith('/') || n.endsWith('/'))) return false;
  if (violatesRule(name, (n) => n.includes('//'))) return false;
  if (violatesRule(name, (n) => n.startsWith('.') || n.endsWith('.'))) return false;
  if (violatesRule(name, (n) => n.includes('..'))) return false;
  if (violatesRule(name, (n) => n.includes('@{'))) return false;
  if (violatesRule(name, (n) => FORBIDDEN_CHARS.test(n))) return false;
  if (violatesRule(name, (n) => n.startsWith('-'))) return false;
  if (violatesRule(name, (n) => n.endsWith('.lock'))) return false;
  if (violatesRule(name, (n) => !BASE_PATTERN.test(n))) return false;
  return true;
}

export function isValidBranchName(name: string): boolean {
  if (RESERVED_BRANCHES.has(name)) return false;
  return isValidRefName(name);
}

export function isValidTagName(name: string): boolean {
  if (RESERVED_TAGS.has(name)) return false;
  return isValidRefName(name);
}

export function sanitizeGitRefName(name: string): string {
  let cleaned = name.replace(/[^a-zA-Z0-9._/-]/g, '');
  if (cleaned.length > MAX_REF_LENGTH) {
    cleaned = cleaned.slice(0, MAX_REF_LENGTH);
  }
  return cleaned;
}