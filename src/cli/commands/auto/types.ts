/**
 * Types for auto command
 */

export interface AutoOptions {
  yes?: boolean;
  noPush?: boolean;
  nobuild?: boolean;
  message?: string;
  path?: string;
  dryRun?: boolean;
  branch?: string;
  debug?: boolean;
  think?: boolean;
  noThink?: boolean;
}

export interface CommandContext {
  repoPath: string;
  options: AutoOptions;
  language: string;
  commitLanguage: string;
}
