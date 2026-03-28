/**
 * Adaptive separator utility for cross-platform terminal compatibility.
 * Uses Unicode box-drawing characters on modern terminals (Windows Terminal, macOS, Linux)
 * and falls back to ASCII on legacy Windows terminals (CMD, PowerShell).
 */

/**
 * Returns the appropriate separator character based on environment.
 * - Windows CMD/PowerShell (legacy): uses '-' (ASCII)
 * - Windows Terminal / macOS / Linux: uses '─' (Unicode U+2500)
 */
export function getSeparator(): string {
  // Windows without WT_SESSION means legacy CMD/PowerShell
  if (process.platform === 'win32' && !process.env.WT_SESSION) {
    return '-';
  }
  return '─';
}

/**
 * Returns a separator line of specified length.
 * @param length - Number of characters (default: 40)
 */
export function separatorLine(length: number = 40): string {
  return getSeparator().repeat(length);
}
