interface RedactionPattern {
  pattern: RegExp;
  replacement: string;
}

const REDACTION_PATTERNS: RedactionPattern[] = [
  // Generic key=value pairs (existing)
  {
    pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***API_KEY_REDACTED***',
  },
  {
    pattern: /(?:token|auth[_-]?token)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***TOKEN_REDACTED***',
  },
  {
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]?([^'"\s]+)['"]?/gi,
    replacement: '***PASSWORD_REDACTED***',
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: '***AWS_ACCESS_KEY_ID_REDACTED***',
  },
  {
    pattern: /(?:secret|private[_-]?key)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    replacement: '***SECRET_REDACTED***',
  },

  // AWS Secret Access Key — 40-char base64-ish string
  {
    pattern: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/g,
    replacement: '***AWS_SECRET_REDACTED***',
  },

  // JWTs — header.payload.signature
  {
    pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/g,
    replacement: '***JWT_REDACTED***',
  },

  // URLs with embedded credentials
  {
    pattern: /([a-zA-Z][a-zA-Z0-9+.\-]*):\/\/[^:\s]+:[^@\s]+@/g,
    replacement: '$1://***:***@',
  },

  // PEM private keys
  {
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    replacement: '***PRIVATE_KEY_REDACTED***',
  },

  // GitHub tokens (ghp_, gho_, ghu_, ghs_, ghr_)
  {
    pattern: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/g,
    replacement: '***GITHUB_TOKEN_REDACTED***',
  },

  // Slack tokens (xoxb-, xoxp-, xoxa-, xoxr-, xoxs-)
  {
    pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
    replacement: '***SLACK_TOKEN_REDACTED***',
  },

  // Stripe keys (sk_live_, sk_test_, rk_live_, rk_test_, pk_live_, pk_test_)
  {
    pattern: /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{24,}\b/g,
    replacement: '***STRIPE_KEY_REDACTED***',
  },

  // Connection strings (mongodb, postgres, mysql, redis) with credentials
  {
    pattern: /(mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^:@\s]+:[^@]+@[^\s"']+/gi,
    replacement: '$1://***:***@***',
  },
];

export function redactDiff(diff: string): string {
  let redacted = diff;

  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }

  return redacted;
}
