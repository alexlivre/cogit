# Cogit CLI

![Status](https://img.shields.io/badge/Status-FASE_7_Complete-brightgreen) ![Version](https://img.shields.io/badge/Version-1.4.0-blue) ![Node](https://img.shields.io/badge/Node-18%2B-green) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue) ![Tests](https://img.shields.io/badge/Tests-95.4%25_Passing-success)

> **Git automation CLI with AI-powered commit messages**

A command-line tool that transforms your Git workflow through intelligent automation. Acts as a "DevOps Co-Pilot", analyzing changes, generating semantic commit messages, and executing Git operations.

---

## Quick Installation

```bash
git clone https://github.com/alexlivre/cogit.git
cd cogit
npm install
npm run build
npm link
```

---

## Configuration

### Environment Variables

```bash
cp .env.example .env
```

```env
# === AI PROVIDER ===
AI_PROVIDER=auto  # auto = automatic fallback

# === LANGUAGE SETTINGS ===
LANGUAGE=en           # Interface language (en, pt)
COMMIT_LANGUAGE=en    # Commit messages language (en, pt)

# === API KEYS ===
OPENROUTER_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
# OLLAMA doesn't need a key (local)

# === MODELS (optional) ===
OPENROUTER_MODEL=meta-llama/llama-4-scout
GROQ_MODEL=llama-4-scout-17b-16e-instruct
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-pro
OLLAMA_MODEL=llama3
```

### Supported AI Providers

| Provider | Type | API Key Required |
|----------|------|------------------|
| OpenRouter | Cloud | Yes |
| Groq | Cloud | Yes |
| OpenAI | Cloud | Yes |
| Gemini | Cloud | Yes |
| Ollama | Local | No |

Get your free API key at [OpenRouter](https://openrouter.ai/).

---

## Usage

### Main Command: `auto`

Generates AI-powered commit message and executes Git operations:

```bash
cogit auto                    # Interactive mode
cogit auto --yes              # Autonomous mode
cogit auto --yes --no-push    # Local commit only
cogit auto -m "fix: auth"     # With context hint for AI
cogit auto --path ./repo      # Specific directory
```

### Interactive Menu

```bash
cogit              # Opens interactive menu (default)
cogit menu         # Equivalent
```

**Available options:**
- 🚀 Quick Commit (auto)
- 📝 Commit with options
- 🌿 Branch Center
- 🏷️ Tag Operations
- 🗑️ Smart Ignore
- 🔒 Stealth Mode Config
- 🔍 View Repository Status
- ⚙️ Settings

### Diagnostic Commands

```bash
cogit check-ai           # Test AI connectivity
cogit health             # Full health check
cogit resources          # Project resource map
cogit check-connectivity # Check network and GitHub
```

### Available Flags

| Flag | Shortcut | Description |
|------|----------|-------------|
| `--yes` | `-y` | Skip interactive confirmations |
| `--no-push` | - | Commit without pushing to remote |
| `--dry-run` | - | Simulate operations without executing |
| `--nobuild` | - | Add `[CI Skip]` to commit |
| `--message <hint>` | `-m` | Context hint for AI |
| `--path <dir>` | `-p` | Target directory |
| `--branch <name>` | `-b` | Create or use specific branch |
| `--auto-push` | - | Force enable auto push for this operation |
| `--no-auto-push` | - | Disable auto push for this operation |
| `--think` | - | Enable thinking mode (Ollama) |
| `--no-think` | - | Disable thinking mode |
| `--debug` | - | Enable Deep Trace Mode |

---

## Features

### Auto Push (PHASE 6)

Automatic push of branches and tags to GitHub when connected to the internet.

**Configuration:**
```env
AUTO_PUSH_ENABLED=true
AUTO_PUSH_BRANCHES=true
AUTO_PUSH_TAGS=true
AUTO_PUSH_INTERNET_CHECK=true
AUTO_PUSH_GITHUB_ONLY=true
AUTO_PUSH_RETRY_COUNT=3
```

**Features:**
- Intelligent connectivity detection
- Retry system with exponential backoff
- Automatic protections (never uses force push)

**Per-operation override:**
```bash
cogit auto --auto-push      # Force auto push
cogit auto --no-auto-push   # Disable auto push
```

---

### Security (Lead Wall)

Layered security system that protects credentials and secrets.

**Layer 1: Sanitizer (Blocklist)**
- Blocks: `.ssh/`, `.aws/`, `.env`, `*.pem`, `id_rsa`, `secrets.yaml`

**Layer 2: Redactor**
- Masks: API Keys, Tokens, Passwords, AWS Keys

**Example:**
```
API_KEY=abc123 → API_KEY=***API_KEY_REDACTED***
```

---

### Smart Features (PHASE 4)

#### VibeVault
Efficiently manages large diffs (>100KB) with automatic compression.

#### Stealth Mode
Hides private files during Git operations.
```bash
# .gitpy-private
*.secret
private/
credentials/
```

#### Smart Ignore
Suggests patterns for `.gitignore` based on "trash" files.
- 30+ common patterns: `*.log`, `node_modules/`, `.DS_Store`, `dist/`

---

### Git Healer

AI-powered auto-correction for push failures:
1. Analyzes error
2. Suggests correction commands
3. Blocks dangerous commands (`--force`, `reset --hard`)
4. Executes up to 3 automatic retries

---

### Ollama Thinking Mode

Visualize the model's reasoning before the final response.

```bash
cogit auto --think           # Enable thinking
cogit auto --no-think        # Disable thinking
```

**Requirements:**
- Ollama provider configured
- Model that supports thinking (e.g., `qwen3.5:4b`)

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SCANNER                                                  │
│    • Detects changes • Generates diff • VibeVault (PHASE 4)│
├─────────────────────────────────────────────────────────────┤
│ 2. STEALTH MODE (PHASE 4)                                   │
│    • Moves private files to .gitpy-temp/                   │
├─────────────────────────────────────────────────────────────┤
│ 3. SANITIZER (Lead Wall - Layer 1)                          │
│    • Validates against Immutable Blocklist                  │
├─────────────────────────────────────────────────────────────┤
│ 4. REDACTOR (Lead Wall - Layer 2)                           │
│    • Masks secrets in diff                                  │
├─────────────────────────────────────────────────────────────┤
│ 5. AI BRAIN                                                 │
│    • Generates Conventional Commits message                 │
├─────────────────────────────────────────────────────────────┤
│ 6. REVIEW                                                   │
│    • Execute / Regenerate / Cancel                          │
├─────────────────────────────────────────────────────────────┤
│ 7. EXECUTOR                                                 │
│    • git add -A • git commit • git push                     │
├─────────────────────────────────────────────────────────────┤
│ 8. SMART IGNORE (PHASE 4)                                   │
│    • Suggests patterns for .gitignore                       │
├─────────────────────────────────────────────────────────────┤
│ 9. STEALTH RESTORE (PHASE 4)                                │
│    • Restores private files                                 │
├─────────────────────────────────────────────────────────────┤
│ 10. GIT HEALER (if push fails)                              │
│     • Analyzes error • Suggests fix • Retry (3x)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.x |
| CLI Framework | Commander.js |
| UI/Output | Chalk + Ora + Inquirer.js |
| HTTP Client | OpenAI SDK |
| Platform | Windows, macOS, Linux |

### Project Structure

```
src/
├── index.ts                  # Entry point
├── cli/
│   ├── commands/             # CLI commands
│   └── ui/                   # Interface components
├── core/
│   ├── container.ts          # Dependency injection
│   ├── vault.ts              # VibeVault
│   └── errors.ts             # Error system
├── services/
│   ├── ai/                   # Providers + Brain
│   ├── git/                  # Scanner, Executor, Healer
│   ├── security/             # Sanitizer, Redactor
│   └── diagnostics/          # Health, Resources
├── domain/                   # Entities (Clean Architecture)
├── application/              # Use Cases (Clean Architecture)
├── infrastructure/           # Adapters
├── config/                   # Configuration + i18n
└── locales/                  # Translations (en, pt)
```

### Clean Architecture

- **Domain Layer**: Commit, Repository, Diff entities
- **Application Layer**: 5 use cases (Scan, Generate, Execute, Branch, Security)
- **Dependency Rule**: Dependencies point inward
- **95.4% validated** - 305 tests passing

---

## Testing

```bash
# Full suite
node test-automation/test-all-fases.js

# With JSON report
node test-automation/test-all-fases.js --report

# Specific phase
node test-automation/test-all-fases.js --fase=1

# Stress tests
node test-automation/test-full-exhaustive.js --stress --report
```

### Coverage

| Phase | Tests | Status |
|-------|-------|--------|
| PHASE 1 (MVP) | 10 | ✅ 100% |
| PHASE 2 (Automation) | 8 | ✅ 100% |
| PHASE 3 (Branch/Tags) | 12 | ✅ 100% |
| PHASE 4 (Smart Features) | 10 | ✅ 100% |
| PHASE 5 (Diagnostics) | 18 | ✅ 100% |
| Edge Cases | 8 | ✅ 100% |
| **TOTAL** | **66** | **✅ 100%** |

---

## Roadmap

### Completed Phases ✅

| Phase | Description |
|-------|-------------|
| PHASE 1 | MVP - AI Commit, Lead Wall, i18n |
| PHASE 2 | Automation - Menu, Dry Run, Git Healer |
| PHASE 3 | Branch & Tags - Full management |
| PHASE 4 | Smart Features - VibeVault, Stealth, Ignore |
| PHASE 5 | Diagnostics - Health Check, Debug Mode |
| PHASE 6 | Auto Push - Connectivity system |
| PHASE 7 | Error Handling - Classification and solutions |

### Refactoring ✅

| Phase | Description |
|-------|-------------|
| Clean Code Phase 1 | Error system, extracted handlers, SRP |
| Clean Architecture Phase 3 | Domain/Application layers, 50 tests |

---

## Development

```bash
npm install        # Install dependencies
npm run build      # Build project
npm run dev        # Development mode
node dist/index.js # Run
```

---

## Contributing

Contributions are welcome! Please open an issue or pull request.

---

## License

MIT

---

**Made with ❤️ to automate Git workflows**
