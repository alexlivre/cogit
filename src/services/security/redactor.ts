interface RedactionPattern {
  pattern: RegExp;
  replacement: string;
}

const REDACTION_PATTERNS: RedactionPattern[] = [
  {
    pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***API_KEY_REDACTED***'
  },
  {
    pattern: /(?:token|auth[_-]?token)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***TOKEN_REDACTED***'
  },
  {
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]?([^'"\s]+)['"]?/gi,
    replacement: '***PASSWORD_REDACTED***'
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: '***AWS_KEY_REDACTED***'
  },
  {
    pattern: /(?:secret|private[_-]?key)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***SECRET_REDACTED***'
  },
];

export function redactDiff(diff: string): string {
  let redacted = diff;
  
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  
  return redacted;
}
