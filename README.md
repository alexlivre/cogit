# Cogit CLI

![Status](https://img.shields.io/badge/Status-FASE_6_Complete-brightgreen) ![Version](https://img.shields.io/badge/Version-1.3.0-blue) ![Node](https://img.shields.io/badge/Node-18%2B-green) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue) ![Tests](https://img.shields.io/badge/Tests-97%25_Passing-success) ![Refactoring](https://img.shields.io/badge/Refactoring-Clean_Architecture_Phase_3_Validated-brightgreen)

> **Git automation CLI with AI-powered commit messages**

Uma ferramenta de linha de comando que transforma o workflow Git através de automação inteligente. Atua como um "DevOps Co-Pilot", analisando mudanças, gerando mensagens de commit semânticas e executando operações Git.

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/cogit.git
cd cogit

# Instale as dependências
npm install

# Build do projeto
npm run build

# Link global (opcional)
npm link
```

---

## Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# === AI PROVIDER ===
AI_PROVIDER=auto  # auto = fallback automático

# === LANGUAGE SETTINGS ===
LANGUAGE=en           # Idioma da interface (en, pt)
COMMIT_LANGUAGE=en    # Idioma das mensagens de commit (en, pt)

# === API KEYS ===
# Pelo menos uma chave é necessária (exceto Ollama que é local)
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

### 2. Obter API Key

Acesse [OpenRouter](https://openrouter.ai/) para obter sua API key gratuita.

---

## Uso

### Comando Padrão (Menu Interativo)

Execute `cogit` sem argumentos para abrir o menu interativo automaticamente:

```bash
# Abre menu interativo (comportamento padrão)
cogit

# Equivalente a:
cogit menu
```

### Help Completo

Visualize o help organizado com todas as opções:

```bash
# Help completo e organizado
cogit --help

# Ou atalho
cogit -h
```

**Output:**
```
╔══════════════════════════════════════════════════════════╗
║         COGIT - AI-Powered Git CLI                       ║
║         Version 1.0.0 | github.com/alexlivre/cogit     ║
╚══════════════════════════════════════════════════════════╝

USAGE:
  $ cogit              → Open interactive menu
  $ cogit [command]    → Run specific command
  $ cogit --help       → Show this help

CORE COMMANDS:
  auto           Generate AI commit and execute git operations
  menu           Interactive menu with guided options (default)

DIAGNOSTICS:
  check-ai       Test AI provider connectivity
  health         Full health check of all AI providers
  resources      Scan and display project resources
  check-connectivity Check network and GitHub access

OPTIONS:
  -y, --yes            Skip confirmation prompts
  --no-push            Commit without pushing to remote
  --dry-run            Simulate without executing git commands
  ...
```

### Comando Principal: `auto`

Gera mensagem de commit com IA e executa operações Git:

```bash
# Modo interativo
cogit auto

# Modo autônomo (sem confirmações)
cogit auto --yes

# Commit local apenas (sem push)
cogit auto --yes --no-push

# Com contexto adicional para IA
cogit auto -m "fix: corrige autenticação"

# Em diretório específico
cogit auto --path /caminho/do/repositorio
```

### Comando Menu Interativo

Interface guiada com múltiplas opções:

```bash
# Menu interativo
cogit menu
```

### Comando Check AI

Testa conectividade com provedores de IA:

```bash
# Verificar status dos providers
cogit check-ai
```

### Comando Health (FASE 5)

Verificação completa de saúde de todos os providers IA:

```bash
# Health check completo
cogit health

# Output:
# 🏥 HEALTH REPORT
# ✓ OpenRouter (245ms) [meta-llama/llama-4-scout]
# ✓ Groq (182ms) [llama-4-scout-17b]
# ✗ OpenAI - No API key
# ✗ Gemini - Connection timeout
# ✓ Ollama (local, 89ms) [llama3]
```

### Comando Resources (FASE 5)

Mapa completo de recursos do projeto:

```bash
# Scan de recursos
cogit resources

# Output:
# 🗺️  RESOURCE MAP
# Directories (15): ...
# Files (42): ...
# By Extension: .ts: 28 files (45.2 KB)
# Total: 15 dirs, 42 files, 95.7 KB
```

### Comando Check Connectivity

Verificação completa de conectividade de rede e acesso ao GitHub:

```bash
# Verificar conectividade
cogit check-connectivity

# Forçar verificação (ignorar cache)
cogit check-connectivity --force

# Verificar em repositório específico
cogit check-connectivity --repo /caminho/do/repositorio
```

### Branch e Tag Operations

Gerenciamento completo via menu interativo:

```bash
# Branch Center
cogit menu → 🌿 Branch Center

# Tag Operations
cogit menu → 🏷️ Tag Operations
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
| `--auto-push` | - | Forçar habilitar auto push nesta operação |
| `--no-auto-push` | - | Forçar desabilitar auto push nesta operação |
| `--think` | - | Habilita modo pensamento (Ollama only) |
| `--no-think` | - | Desabilita modo pensamento |
| `--debug` | - | Habilita Deep Trace Mode (FASE 5) |

---

## Auto Push (FASE 6)

Sistema inteligente de envio automático de branches e tags para o GitHub quando conectado à internet.

### Configuração

Copie o arquivo de exemplo e configure as variáveis de auto push:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# ───────────────────────────────────────────────────────────
# AUTO PUSH SETTINGS
# ───────────────────────────────────────────────────────────

AUTO_PUSH_ENABLED=true                  # Enable/disable auto push (true por padrão)
AUTO_PUSH_BRANCHES=true                 # Auto push para branches quando criados
AUTO_PUSH_TAGS=true                     # Auto push para tags quando criadas
AUTO_PUSH_INTERNET_CHECK=true           # Verificar conexão antes do push
AUTO_PUSH_GITHUB_ONLY=true              # Apenas para repositórios GitHub
AUTO_PUSH_DELAY=5                       # Delay (segundos) após criação antes do push
AUTO_PUSH_RETRY_COUNT=3                 # Tentativas em caso de falha
AUTO_PUSH_SILENT=false                  # Suprimir mensagens de auto push
```

### Funcionalidades

#### **Detecção Inteligente de Conectividade**
- Verificação de conexão com internet
- Verificação específica de conectividade com GitHub
- Cache inteligente para evitar verificações excessivas
- Suporte a diferentes métodos de verificação

#### **Sistema de Retry Automático**
- Retry exponencial para falhas de rede
- Detecção automática de erros recuperáveis
- Backoff inteligente baseado no tipo de erro
- Limite configurável de tentativas

#### **Integração com Operações Git**
- Auto push automático após criação de branches
- Auto push automático após criação de tags
- Respeito às configurações de segurança
- Não interfere em operações existentes

### Verificação de Conectividade

```bash
# Verificar status completo
cogit check-connectivity

# Forçar verificação fresca
cogit check-connectivity --force

# Verificar repositório específico
cogit check-connectivity --repo /caminho/do/repo
```

**Output:**
```
🌐 CONNECTIVITY CHECK
──────────────────────────────────────────────────

📡 Connectivity Status:
   🟢 Internet connected | 🟢 GitHub reachable | 📁 GitHub repository

🔧 Auto Push Configuration:
   🟢 Auto push: ENABLED | 🌿 Branches | 🏷️ Tags | 🌐 Internet Check | 🐙 GitHub Only

📊 Detailed Status:
   Internet: 🟢
   GitHub: 🟢
   GitHub Repo: 🟢
   Last Checked: 28/03/2026, 06:30:00
   Source: 🔴 Live

💡 Recommendations:
   • All systems ready! Auto push is enabled and configured
```

### Flags de Override

Você pode sobrescrever as configurações por operação:

```bash
# Forçar auto push mesmo se desabilitado globalmente
cogit auto --auto-push

# Desabilitar auto push para esta operação específica
cogit auto --no-auto-push
```

### Segurança

#### **Proteções Automáticas**
- **Nunca usa force push** - Operações de auto push nunca usam `--force`
- **Verificação de credenciais** - Valida acesso antes de tentar push
- **Rate limiting** - Respeita limites do GitHub automaticamente
- **Privacidade** - Funciona com repositórios privados

#### **Configurações Padrão**
- `AUTO_PUSH_ENABLED=true` (habilitado por padrão)
- `AUTO_PUSH_GITHUB_ONLY=true` (apenas GitHub por padrão)
- `AUTO_PUSH_INTERNET_CHECK=true` (verificação obrigatória)
- `AUTO_PUSH_RETRY_COUNT=3` (limite de tentativas)

---

## Multiplataforma (Cross-Platform)

O Cogit CLI é **100% compatível** com Windows, macOS e Linux.

### Implementação

A compatibilidade multiplataforma foi alcançada através de:

1. **Camada de Abstração** (`src/utils/platform.ts`)
   - Detecção automática de sistema operacional
   - Normalização de paths para cada plataforma
   - Escape de paths com espaços/caracteres especiais

2. **Wrapper de Execução** (`src/utils/executor.ts`)
   - Execução de comandos Git de forma cross-platform
   - Shell correto por plataforma (cmd.exe, bash, zsh)
   - Tratamento de erros unificado

3. **Substituição de Comandos Unix**
   - `cat` → `fs.readFile()` (Node.js API)
   - Paths normalizados automaticamente

### Testes Multi-OS

Testes automatizados executam em:
- ✅ Windows (Windows Latest)
- ✅ macOS (macOS Latest)
- ✅ Linux (Ubuntu Latest)

CI/CD configurado via GitHub Actions (`.github/workflows/test-multi-os.yml`).

---

## Smart Features (FASE 4)

### VibeVault (Large Diff Management)

Gerencia diffs grandes (>100KB) de forma eficiente:

- **smartPack**: Compacta diffs grandes em memória
- **smartUnpack**: Restaura diffs para processamento
- **Preview truncado**: Mostra apenas início do diff

#### Como funciona:
1. Scanner detecta diff > 100KB
2. Diff é compactado e armazenado em memória
3. AI Brain recebe referência, não conteúdo completo
4. Mensagem gerada normalmente

#### Configuração:
Automático - nenhum config necessário.

---

### Stealth Mode (Private Files)

Oculta temporariamente arquivos privados durante operações Git.

#### Configuração:
Crie `.gitpy-private` na raiz do repositório:

```bash
# .gitpy-private
*.secret
private/
credentials/
.env.local
```

#### Como funciona:
1. **Antes do commit**: Arquivos são movidos para `.gitpy-temp/`
2. **Durante o commit**: Arquivos privados não aparecem no diff
3. **Após o commit**: Arquivos são restaurados automaticamente

#### Menu:
```bash
cogit menu → 🔒 Stealth Mode Config
```

#### Conflitos:
Se arquivo novo foi criado durante operação, arquivo privado é restaurado como `.restored`.

---

### Smart Ignore (.gitignore Suggestions)

Sugere padrões para `.gitignore` baseado em arquivos "lixo".

#### Base de Dados:
30+ padrões comuns em `common_trash.json`:
- **Logs**: `*.log`, `logs/`
- **Dependencies**: `node_modules/`, `venv/`
- **IDE**: `.vscode/`, `.idea/`
- **OS**: `.DS_Store`, `Thumbs.db`
- **Build**: `dist/`, `build/`, `*.min.js`

#### Como usar:
1. Após commit bem-sucedido, prompt aparece
2. Selecione padrões sugeridos
3. Confirma adição ao `.gitignore`

#### Menu:
```bash
cogit menu → 🗑️ Smart Ignore
```

#### Whitelist:
Para permitir arquivo específico:

```bash
# .gitignore
*.log
important.log  # cogit:allow
```

---

## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SCANNER                                                  │
│    • Detecta mudanças no repositório                        │
│    • Gera diff completo                                      │
│    • VibeVault: gerencia diffs > 100KB         (FASE 4)    │
├─────────────────────────────────────────────────────────────┤
│ 2. STEALTH MODE                                 (FASE 4)    │
│    • Lê padrões de .gitpy-private                           │
│    • Move arquivos privados para .gitpy-temp/               │
├─────────────────────────────────────────────────────────────┤
│ 3. SANITIZER (Lead Wall - Layer 1)                          │
│    • Valida arquivos contra Blocklist Imutável              │
│    • Bloqueia: .env, .ssh/, *.pem, secrets, etc.            │
├─────────────────────────────────────────────────────────────┤
│ 4. REDACTOR (Lead Wall - Layer 2)                           │
│    • Mascara secrets no diff                                │
│    • Padrões: API keys, tokens, passwords                   │
├─────────────────────────────────────────────────────────────┤
│ 5. AI BRAIN                                                 │
│    • Envia diff seguro para OpenRouter                      │
│    • Gera mensagem no formato Conventional Commits          │
├─────────────────────────────────────────────────────────────┤
│ 6. REVIEW                                                   │
│    • Exibe mensagem gerada                                  │
│    • Opções: Execute / Regenerate / Cancel                  │
├─────────────────────────────────────────────────────────────┤
│ 7. EXECUTOR                                                 │
│    • git add -A                                             │
│    • git commit -m "<mensagem>"                             │
│    • git push (se não --no-push)                            │
├─────────────────────────────────────────────────────────────┤
│ 8. SMART IGNORE                                 (FASE 4)    │
│    • Escaneia arquivos "lixo"                               │
│    • Sugere padrões para .gitignore                         │
├─────────────────────────────────────────────────────────────┤
│ 9. STEALTH RESTORE                              (FASE 4)    │
│    • Restaura arquivos privados                             │
│    • Resolve conflitos de nome                              │
├─────────────────────────────────────────────────────────────┤
│ 10. GIT HEALER (se push falhar)                             │
│     • Analisa erro com IA                                   │
│     • Sugere comandos de correção                           │
│     • Até 3 tentativas automáticas                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Segurança (Lead Wall)

O Cogit CLI implementa um sistema de segurança em camadas:

### Layer 1: Sanitizer (Blocklist)

Arquivos bloqueados automaticamente:

- **Credenciais**: `.ssh/`, `.aws/`, `.azure/`, `.kube/`
- **Chaves**: `id_rsa`, `*.pem`, `*.key`, `*.keystore`
- **Secrets**: `.env`, `.env.local`, `secrets.yaml`
- **Históricos**: `.bash_history`, `.zsh_history`

### Layer 2: Redactor

Padrões mascarados no diff antes de enviar para IA:

- API Keys → `***API_KEY_REDACTED***`
- Tokens → `***TOKEN_REDACTED***`
- Passwords → `***PASSWORD_REDACTED***`
- AWS Keys → `***AWS_KEY_REDACTED***`

---

## Git Healer (Auto-correção)

O Git Healer é acionado automaticamente quando o push falha:

1. **Análise**: O erro é enviado para IA analisar
2. **Sugestão**: IA sugere comandos de correção
3. **Validação**: Comandos perigosos são bloqueados
4. **Execução**: Comando seguro é executado
5. **Retry**: Até 3 tentativas automáticas

### Comandos Bloqueados

- `--force` em qualquer operação
- `reset --hard`
- `clean -fd` não interativo
- `push --force`

### Exemplo

```bash
# Push falha com conflito
# Healer sugere: git pull --rebase
# Executa automaticamente e tenta push novamente
```

---

## Modo Dry Run

Simula todas as operações sem executar:

```bash
cogit auto --dry-run --yes
```

### O que é simulado:
- ✅ Scanner de mudanças
- ✅ Geração de commit message
- ✅ Exibição do comando que seria executado
- ❌ Nenhum commit criado
- ❌ Nenhum push realizado

### Casos de uso:
- Verificar qual mensagem será gerada
- Validar mudanças antes de commitar
- Testar configurações

---

## Menu Interativo

O comando `cogit menu` oferece uma interface guiada:

```
╔══════════════════════════════════════════════════════════╗
║              Open Source Project                         ║
║                                                          ║
║     COGIT - Your AI-Powered Git Automation CLI           ║
║                                                          ║
║     by Alex Santos (alexlivre)                           ║
║     github.com/alexlivre/cogit                          ║
╚══════════════════════════════════════════════════════════╝

1. 🚀 Quick Commit (auto)
2. 📝 Commit with options
3. 🌿 Branch Center
4. 🏷️  Tag Operations
5. 🗑️  Smart Ignore          (FASE 4)
6. 🔒 Stealth Mode Config   (FASE 4)
7. 🔍 View Repository Status
8. ⚙️  Settings
9. ❌ Exit
```

---

## Internacionalização (i18n)

### Idiomas Suportados

| Código | Idioma |
|--------|--------|
| `en` | English |
| `pt` | Português |

### Configuração Independente

- `LANGUAGE`: Idioma da interface (menus, mensagens)
- `COMMIT_LANGUAGE`: Idioma das mensagens de commit

Exemplo:
```env
LANGUAGE=pt           # Interface em português
COMMIT_LANGUAGE=en    # Commits em inglês
```

---

## Formato de Commits

O Cogit gera mensagens no formato **Conventional Commits**:

```
<type>: <description>

- <marker> <detail>
- <marker> <detail>
```

### Marcadores

| Marcador | Tipo |
|----------|------|
| `n` | Feature/Enhancement |
| `f` | Bugfix/Hotfix |
| `u` | Update/Chore/Refactor |

### Exemplo

```
feat: adiciona sistema de autenticação

- n implementa JWT tokens
- n adiciona middleware de validação
- u refatora estrutura de pastas
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 18+ |
| Linguagem | TypeScript 5.x |
| CLI Framework | Commander.js |
| UI/Output | Chalk + Ora + Inquirer.js |
| HTTP Client | OpenAI SDK |
| AI Provider | OpenRouter |
| **Plataforma** | **Windows, macOS, Linux** |

---

## Estrutura do Projeto

```
src/
├── index.ts                      # Entry point + error handler centralizado
├── cli/
│   ├── commands/
│   │   ├── auto/                 # REFACTORED (Clean Code Phase 1)
│   │   │   ├── index.ts          # Entry point refatorado (~120 linhas)
│   │   │   ├── branch-handler.ts # Handler: branch operations
│   │   │   ├── stealth-handler.ts# Handler: stealth mode
│   │   │   ├── commit-review.ts  # Handler: review loop
│   │   │   ├── commit-executor.ts# Handler: execution + healing
│   │   │   ├── validator.ts      # Handler: config validation
│   │   │   └── types.ts          # TypeScript interfaces
│   │   ├── menu.ts               # Menu interativo (9 opções)
│   │   └── check-ai.ts           # AI connectivity check
│   └── ui/
│       ├── renderer.ts           # Output formatting
│       ├── prompts.ts            # User prompts
│       └── debug-logger.ts       # Deep trace logging
├── core/
│   ├── container.ts              # Dependency injection
│   ├── vault.ts                  # VibeVault (large diffs)
│   └── errors.ts                 # REFACTORED: Custom error system
├── services/
│   ├── ai/
│   │   ├── brain/
│   │   │   ├── index.ts          # Geração de commit
│   │   │   └── normalizer.ts     # Conventional Commits
│   │   └── providers/
│   │       ├── base.ts           # AIProvider interface
│   │       ├── index.ts          # Factory + fallback
│   │       ├── openrouter.ts     # OpenRouter provider
│   │       ├── groq.ts           # Groq provider
│   │       ├── openai.ts         # OpenAI provider
│   │       ├── gemini.ts         # Gemini provider
│   │       └── ollama.ts         # Ollama provider (local)
│   ├── git/
│   │   ├── scanner.ts            # Scanner + diffData
│   │   ├── executor.ts           # git add/commit/push
│   │   ├── healer.ts             # Auto-correção
│   │   ├── branch.ts             # Branch management
│   │   └── tag.ts                # Tag management
│   ├── security/
│   │   ├── sanitizer.ts          # Blocklist
│   │   └── redactor.ts           # Data masking
│   ├── tools/
│   │   ├── stealth.ts            # Stealth Mode
│   │   └── ignore.ts             # Smart Ignore
│   └── diagnostics/
│       ├── health.ts             # Health check
│       └── resources.ts          # Resource viewer
├── types/
│   └── git.ts                    # TypeScript interfaces
├── config/
│   ├── env.ts                    # Configuração
│   ├── i18n.ts                   # Internacionalização
│   └── common_trash.json         # Base de dados Smart Ignore
└── locales/
    ├── en.json                   # English
    └── pt.json                   # Português
```

---

## Testes

Suite de testes automatizados com **66 testes** cobrindo todas as funcionalidades:

```bash
# === SCRIPT UNIFICADO (66 testes) ===
node test-automation/test-all-fases.js

# === COM RELATÓRIO JSON ===
node test-automation/test-all-fases.js --report

# === FASE ESPECÍFICA ===
node test-automation/test-all-fases.js --fase=1
node test-automation/test-all-fases.js --fase=5

# === SUITE COMPLETA (legado) ===
node test-automation/test-full-exhaustive.js --report

# === COM STRESS TESTS ===
node test-automation/test-full-exhaustive.js --stress --report

# === SUITES DE REGRESSÃO ===
node test-automation/test-regression.js --smoke
node test-automation/test-regression.js --ci
```

### Cobertura

| Fase | Testes | Descrição | Status |
|------|--------|-----------|--------|
| FASE 1 (MVP) | 10 | Commit, segurança, i18n, provider | ✅ 100% |
| FASE 2 (Automação) | 8 | Menu, flags, healer, UI | ✅ 100% |
| FASE 3 (Branch/Tags) | 12 | Branch, tag, confirmação | ✅ 100% |
| FASE 4 (Smart Features) | 10 | VibeVault, Stealth, Ignore | ✅ 100% |
| FASE 5 (Diagnostics) | 18 | Debug, Health, Resources, Providers | ✅ 100% |
| Edge Cases | 8 | Arquivos especiais, limites | ✅ 100% |
| **TOTAL** | **66** | **Cobertura completa** | **✅ 100%** |

### Estrutura de Testes

```
test-automation/
├── test-full-exhaustive.js  # Suite principal (66 testes)
├── test-fase1.js            # Testes FASE 1
├── test-fase2.js            # Testes FASE 2
├── test-fase3.js            # Testes FASE 3
├── test-fase4.js            # Testes FASE 4
├── test-fase5.js            # Testes FASE 5 (18 testes)
├── test-regression.js       # Suite de regressão
├── scenarios/
│   ├── fase1/               # 10 cenários
│   ├── fase2/               # 8 cenários
│   ├── fase3/               # 12 cenários
│   ├── fase4/               # 10 cenários
│   └── edge-cases/          # 8 cenários
├── stress/                  # Testes de estresse
├── regression/              # Suites de regressão
├── reports/                 # Relatórios JSON
└── utils/                   # Helpers de teste
```

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build
npm run build

# Desenvolvimento
npm run dev

# Executar
node dist/index.js auto
```

---

## Diagnostics (FASE 5)

### Deep Trace Mode

Sistema de logging detalhado para debug:

```bash
# Habilita debug mode
cogit auto --yes --debug

# Arquivo de log criado
cat .vibe-debug.log
```

**Funcionalidades:**
- Log de requests AI (mensagens, tokens)
- Log de responses AI (latência, conteúdo)
- Log de comandos git executados
- Timestamps precisos
- Estimativa de tokens

**Arquivo de Log:** `.vibe-debug.log` (raiz do repositório)

---

### Multi-Provider Fallback

Sistema automático de fallback entre providers:

**Providers Suportados:**
1. OpenRouter (padrão)
2. Groq
3. OpenAI
4. Gemini
5. Ollama (local)

**Ordem de Prioridade:**
```
OpenRouter → Groq → OpenAI → Gemini → Ollama
```

**Como Funciona:**
1. Tenta provider prioritário
2. Se falha, tenta próximo automaticamente
3. Loga tentativas no debug mode
4. Se todos falham, retorna erro

**Configuração:**
```env
# Configure múltiplos providers
OPENROUTER_API_KEY=sk-or-...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
# Ollama não precisa de key (rodar localmente)
```

---

### Ollama Thinking Mode

O Cogit CLI suporta o modo pensamento (thinking) do Ollama, permitindo visualizar o raciocínio do modelo antes da resposta final.

**O que é o Thinking Mode:**

Alguns modelos Ollama (como `qwen3.5:4b`) suportam separação entre raciocínio interno e resposta final. Quando ativado, você pode ver o processo de pensamento do modelo.

**Configuração:**

```env
# .env
OLLAMA_THINK=true  # Habilitar thinking por padrão
```

**Uso via CLI:**

```bash
# Ativar thinking para esta operação
cogit auto --think

# Desativar thinking para esta operação
cogit auto --no-think

# Combinar com outras flags
cogit auto --think --yes --no-push
```

**Prioridade:**
```
--think / --no-think > OLLAMA_THINK (env)
```

**Output com Thinking:**

```
══════════════════════════════════════════════════════
💭 Thinking:
══════════════════════════════════════════════════════
Analyzing the diff, I can see changes to the authentication module...
The main changes are: JWT implementation, middleware addition...
══════════════════════════════════════════════════════

══════════════════════════════════════════════════════
Generated Commit Message:
══════════════════════════════════════════════════════
feat: adiciona sistema de autenticação JWT

- n implementa geração de tokens JWT
- n adiciona middleware de validação
- u refatora estrutura de pastas
══════════════════════════════════════════════════════
```

**Requisitos:**
- Provider Ollama configurado (`AI_PROVIDER=ollama` ou fallback)
- Modelo que suporta thinking (ex: `qwen3.5:4b`)
- Ollama rodando localmente (`ollama serve`)

**Observações:**
- Thinking aumenta o tempo de resposta
- Outros providers ignoram a configuração de thinking
- Útil para debug e entendimento do raciocínio do modelo

---

### Health Check Completo

Verificação de saúde de todos os providers:

```bash
cogit health
```

**Informações:**
- Status de cada provider
- Tempo de resposta (ms)
- Modelo configurado
- Erros de conexão
- API keys faltantes

---

### Resource Viewer

Mapa completo de recursos do projeto:

```bash
cogit resources
```

**Informações:**
- Lista de diretórios
- Lista de arquivos com tamanhos
- Estatísticas por extensão
- Top 10 maiores arquivos
- Total de recursos

---

## Roadmap

### Fase 1: MVP ✅
- [x] Fluxo básico de commit com IA
- [x] Segurança Lead Wall (Sanitizer + Redactor)
- [x] Internacionalização (en/pt)
- [x] Provider OpenRouter

### Fase 2: Automação ✅
- [x] Modo totalmente autônomo
- [x] Menu interativo
- [x] Dry run simulation
- [x] CI Skip flag (`--nobuild`)
- [x] Git Healer (auto-correção)
- [x] UI Components (Renderer + Prompts)
- [x] Scanner untracked files

### Fase 3: Branch & Tags ✅
- [x] Gerenciamento de branches
- [x] Operações com tags
- [x] Confirmação de segurança (4 chars)
- [x] Comando check-ai
- [x] Flag --branch no auto

### Fase 4: Smart Features ✅
- [x] VibeVault (grandes diffs)
- [x] Stealth Mode (arquivos privados)
- [x] Smart Ignore
- [x] Git Types (TypeScript)
- [x] common_trash.json (base de dados)

### Fase 5: Diagnostics ✅
- [x] AI Health Check (todos os providers)
- [x] Deep Trace Mode (--debug)
- [x] Resource Viewer
- [x] Multi-Provider Fallback
- [x] Providers: Groq, OpenAI, Gemini, Ollama

### Refatoração: Clean Code Phase 1 ✅
- [x] Sistema de erros customizado (CogitError, GitError, AIError, etc.)
- [x] Handlers extraídos de auto.ts (branch, stealth, review, executor, validator)
- [x] Redução de 255 para ~120 linhas no comando principal
- [x] Eliminação de 8 process.exit() espalhados
- [x] Error handler centralizado no entry point
- [x] Single Responsibility Principle aplicado
- [x] 15 testes unitários novos para handlers
- [x] 95% dos testes de regressão passando

### Refatoração: Clean Architecture Phase 3 ✅
- [x] Domain Layer: Commit, Repository, Diff entities
- [x] Application Layer: 5 use cases (Scan, Generate, Execute, Branch, Security)
- [x] Dependency Rule: dependências apontam para dentro
- [x] Entity Encapsulation: validação interna, getters imutáveis
- [x] Use Case SRP: cada use case com uma responsabilidade
- [x] 50 testes unitários para domain/application/plugins
- [x] 5 stress tests automatizados (500 arquivos, 1MB diff, 50 commits)
- [x] **95.4% validado** - 305 testes passando

### Fase 6: Auto Push ✅
- [x] Sistema de conectividade inteligente
- [x] Auto push automático para branches e tags
- [x] Sistema de retry com backoff exponencial
- [x] Verificação de conectividade GitHub
- [x] Configurações de segurança (desabilitado por padrão)
- [x] Comando check-connectivity
- [x] Flags --auto-push e --no-auto-push
- [x] Integração total com operações Git existentes
- [x] Zero breaking changes

---

## Arquitetura Refatorada (Clean Code Phase 1)

### Antes da Refatoração
```
auto.ts (255 linhas)
├── 8 responsabilidades misturadas
├── 8 process.exit() espalhados
└── Difícil de testar e manter
```

### Depois da Refatoração
```
auto/
├── index.ts (~120 linhas)         # Orquestração
├── branch-handler.ts              # Branch operations
├── stealth-handler.ts             # Stealth mode
├── commit-review.ts               # Review loop
├── commit-executor.ts             # Execution + healing
├── validator.ts                   # Config validation
└── types.ts                       # TypeScript interfaces

core/errors.ts                     # Custom error system
```

### Benefícios Alcançados
- **Legibilidade**: Cada arquivo com responsabilidade única
- **Testabilidade**: Handlers isolados e testáveis
- **Manutenibilidade**: Mudanças localizadas
- **Tratamento de Erros**: Sistema centralizado com exit codes
- **SOLID**: Single Responsibility Principle aplicado

---

## Licença

MIT

---

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

**Feito com ❤️ para automatizar workflows Git**
