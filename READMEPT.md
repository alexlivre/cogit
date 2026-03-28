# Cogit CLI

![Status](https://img.shields.io/badge/Status-FASE_7_Complete-brightgreen) ![Version](https://img.shields.io/badge/Version-1.4.0-blue) ![Node](https://img.shields.io/badge/Node-18%2B-green) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue) ![Tests](https://img.shields.io/badge/Tests-95.4%25_Passing-success)

> **CLI de automação Git com mensagens de commit geradas por IA**

Uma ferramenta de linha de comando que transforma o workflow Git através de automação inteligente. Atua como um "DevOps Co-Pilot", analisando mudanças, gerando mensagens de commit semânticas e executando operações Git.

---

## Instalação Rápida

```bash
git clone https://github.com/alexlivre/cogit.git
cd cogit
npm install
npm run build
npm link
```

---

## Configuração

### Variáveis de Ambiente

```bash
cp .env.example .env
```

```env
# === AI PROVIDER ===
AI_PROVIDER=auto  # auto = fallback automático

# === LANGUAGE SETTINGS ===
LANGUAGE=pt           # Idioma da interface (en, pt)
COMMIT_LANGUAGE=en    # Idioma das mensagens de commit (en, pt)

# === API KEYS ===
OPENROUTER_API_KEY=sua_chave_aqui
GROQ_API_KEY=sua_chave_aqui
OPENAI_API_KEY=sua_chave_aqui
GEMINI_API_KEY=sua_chave_aqui
# OLLAMA não precisa de chave (local)

# === MODELS (opcional) ===
OPENROUTER_MODEL=meta-llama/llama-4-scout
GROQ_MODEL=llama-4-scout-17b-16e-instruct
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-pro
OLLAMA_MODEL=llama3
```

### Providers de IA Suportados

| Provider | Tipo | API Key Necessária |
|----------|------|-------------------|
| OpenRouter | Cloud | Sim |
| Groq | Cloud | Sim |
| OpenAI | Cloud | Sim |
| Gemini | Cloud | Sim |
| Ollama | Local | Não |

Obtenha sua API key gratuita em [OpenRouter](https://openrouter.ai/).

---

## Uso

### Comando Principal: `auto`

Gera mensagem de commit com IA e executa operações Git:

```bash
cogit auto                    # Modo interativo
cogit auto --yes              # Modo autônomo
cogit auto --yes --no-push    # Commit local apenas
cogit auto -m "fix: auth"     # Com contexto para IA
cogit auto --path ./repo      # Diretório específico
```

### Menu Interativo

```bash
cogit              # Abre menu interativo (padrão)
cogit menu         # Equivalente
```

**Opções disponíveis:**
- 🚀 Quick Commit (auto)
- 📝 Commit with options
- 🌿 Branch Center
- 🏷️ Tag Operations
- 🗑️ Smart Ignore
- 🔒 Stealth Mode Config
- 🔍 View Repository Status
- ⚙️ Settings

### Comandos de Diagnóstico

```bash
cogit check-ai           # Testa conectividade AI
cogit health             # Health check completo
cogit resources          # Mapa de recursos do projeto
cogit check-connectivity # Verifica rede e GitHub
```

### Flags Disponíveis

| Flag | Shortcut | Descrição |
|------|----------|-----------|
| `--yes` | `-y` | Pula confirmações interativas |
| `--no-push` | - | Commita sem enviar para remote |
| `--dry-run` | - | Simula operações sem executar |
| `--nobuild` | - | Adiciona `[CI Skip]` ao commit |
| `--message <hint>` | `-m` | Dica de contexto para IA |
| `--path <dir>` | `-p` | Diretório alvo |
| `--branch <name>` | `-b` | Cria ou usa branch específica |
| `--auto-push` | - | Força auto push nesta operação |
| `--no-auto-push` | - | Desabilita auto push nesta operação |
| `--think` | - | Habilita modo pensamento (Ollama) |
| `--no-think` | - | Desabilita modo pensamento |
| `--debug` | - | Habilita Deep Trace Mode |

---

## Features

### Auto Push (FASE 6)

Envio automático de branches e tags para GitHub quando conectado à internet.

**Configuração:**
```env
AUTO_PUSH_ENABLED=true
AUTO_PUSH_BRANCHES=true
AUTO_PUSH_TAGS=true
AUTO_PUSH_INTERNET_CHECK=true
AUTO_PUSH_GITHUB_ONLY=true
AUTO_PUSH_RETRY_COUNT=3
```

**Funcionalidades:**
- Detecção inteligente de conectividade
- Sistema de retry com backoff exponencial
- Proteções automáticas (nunca usa force push)

**Override por operação:**
```bash
cogit auto --auto-push      # Força auto push
cogit auto --no-auto-push   # Desabilita auto push
```

---

### Segurança (Lead Wall)

Sistema de segurança em camadas que protege credenciais e secrets.

**Layer 1: Sanitizer (Blocklist)**
- Bloqueia: `.ssh/`, `.aws/`, `.env`, `*.pem`, `id_rsa`, `secrets.yaml`

**Layer 2: Redactor**
- Mascara: API Keys, Tokens, Passwords, AWS Keys

**Exemplo:**
```
API_KEY=abc123 → API_KEY=***API_KEY_REDACTED***
```

---

### Smart Features (FASE 4)

#### VibeVault
Gerencia diffs grandes (>100KB) de forma eficiente com compactação automática.

#### Stealth Mode
Oculta arquivos privados durante operações Git.
```bash
# .gitpy-private
*.secret
private/
credentials/
```

#### Smart Ignore
Sugere padrões para `.gitignore` baseado em arquivos "lixo".
- 30+ padrões comuns: `*.log`, `node_modules/`, `.DS_Store`, `dist/`

---

### Git Healer

Auto-correção de erros de push com IA:
1. Analisa erro
2. Sugere comandos de correção
3. Bloqueia comandos perigosos (`--force`, `reset --hard`)
4. Executa até 3 tentativas automáticas

---

### Ollama Thinking Mode

Visualize o raciocínio do modelo antes da resposta final.

```bash
cogit auto --think           # Ativa thinking
cogit auto --no-think        # Desativa thinking
```

**Requisitos:**
- Provider Ollama configurado
- Modelo que suporta thinking (ex: `qwen3.5:4b`)

---

## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SCANNER                                                  │
│    • Detecta mudanças • Gera diff • VibeVault (FASE 4)     │
├─────────────────────────────────────────────────────────────┤
│ 2. STEALTH MODE (FASE 4)                                    │
│    • Move arquivos privados para .gitpy-temp/              │
├─────────────────────────────────────────────────────────────┤
│ 3. SANITIZER (Lead Wall - Layer 1)                          │
│    • Valida contra Blocklist Imutável                       │
├─────────────────────────────────────────────────────────────┤
│ 4. REDACTOR (Lead Wall - Layer 2)                           │
│    • Mascara secrets no diff                                │
├─────────────────────────────────────────────────────────────┤
│ 5. AI BRAIN                                                 │
│    • Gera mensagem Conventional Commits                     │
├─────────────────────────────────────────────────────────────┤
│ 6. REVIEW                                                   │
│    • Execute / Regenerate / Cancel                          │
├─────────────────────────────────────────────────────────────┤
│ 7. EXECUTOR                                                 │
│    • git add -A • git commit • git push                     │
├─────────────────────────────────────────────────────────────┤
│ 8. SMART IGNORE (FASE 4)                                    │
│    • Sugere padrões para .gitignore                         │
├─────────────────────────────────────────────────────────────┤
│ 9. STEALTH RESTORE (FASE 4)                                 │
│    • Restaura arquivos privados                             │
├─────────────────────────────────────────────────────────────┤
│ 10. GIT HEALER (se push falhar)                             │
│     • Analisa erro • Sugere correção • Retry (3x)           │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitetura

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 18+ |
| Linguagem | TypeScript 5.x |
| CLI Framework | Commander.js |
| UI/Output | Chalk + Ora + Inquirer.js |
| HTTP Client | OpenAI SDK |
| Plataforma | Windows, macOS, Linux |

### Estrutura do Projeto

```
src/
├── index.ts                  # Entry point
├── cli/
│   ├── commands/             # Comandos CLI
│   └── ui/                   # Componentes de interface
├── core/
│   ├── container.ts          # Dependency injection
│   ├── vault.ts              # VibeVault
│   └── errors.ts             # Sistema de erros
├── services/
│   ├── ai/                   # Providers + Brain
│   ├── git/                  # Scanner, Executor, Healer
│   ├── security/             # Sanitizer, Redactor
│   └── diagnostics/          # Health, Resources
├── domain/                   # Entities (Clean Architecture)
├── application/              # Use Cases (Clean Architecture)
├── infrastructure/           # Adapters
├── config/                   # Configuração + i18n
└── locales/                  # Traduções (en, pt)
```

### Clean Architecture

- **Domain Layer**: Commit, Repository, Diff entities
- **Application Layer**: 5 use cases (Scan, Generate, Execute, Branch, Security)
- **Dependency Rule**: Dependências apontam para dentro
- **95.4% validado** - 305 testes passando

---

## Testes

```bash
# Suite completa
node test-automation/test-all-fases.js

# Com relatório JSON
node test-automation/test-all-fases.js --report

# Fase específica
node test-automation/test-all-fases.js --fase=1

# Stress tests
node test-automation/test-full-exhaustive.js --stress --report
```

### Cobertura

| Fase | Testes | Status |
|------|--------|--------|
| FASE 1 (MVP) | 10 | ✅ 100% |
| FASE 2 (Automação) | 8 | ✅ 100% |
| FASE 3 (Branch/Tags) | 12 | ✅ 100% |
| FASE 4 (Smart Features) | 10 | ✅ 100% |
| FASE 5 (Diagnostics) | 18 | ✅ 100% |
| Edge Cases | 8 | ✅ 100% |
| **TOTAL** | **66** | **✅ 100%** |

---

## Roadmap

### Fases Concluídas ✅

| Fase | Descrição |
|------|-----------|
| FASE 1 | MVP - Commit com IA, Lead Wall, i18n |
| FASE 2 | Automação - Menu, Dry Run, Git Healer |
| FASE 3 | Branch & Tags - Gerenciamento completo |
| FASE 4 | Smart Features - VibeVault, Stealth, Ignore |
| FASE 5 | Diagnostics - Health Check, Debug Mode |
| FASE 6 | Auto Push - Sistema de conectividade |
| FASE 7 | Error Handling - Classificação e soluções |

### Refatorações ✅

| Fase | Descrição |
|------|-----------|
| Clean Code Phase 1 | Sistema de erros, handlers extraídos, SRP |
| Clean Architecture Phase 3 | Domain/Application layers, 50 testes |

---

## Desenvolvimento

```bash
npm install        # Instalar dependências
npm run build      # Build do projeto
npm run dev        # Modo desenvolvimento
node dist/index.js # Executar
```

---

## Contribuição

Contribuições são bem-vindas! Abra uma issue ou pull request.

---

## Licença

MIT

---

**Feito com ❤️ para automatizar workflows Git**
