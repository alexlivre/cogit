# Cogit CLI

![Status](https://img.shields.io/badge/Status-FASE_4_Complete-brightgreen) ![Version](https://img.shields.io/badge/Version-0.1.0-blue) ![Node](https://img.shields.io/badge/Node-18%2B-green)

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
AI_PROVIDER=openrouter

# === LANGUAGE SETTINGS ===
LANGUAGE=en           # Idioma da interface (en, pt)
COMMIT_LANGUAGE=en    # Idioma das mensagens de commit (en, pt)

# === API KEYS ===
OPENROUTER_API_KEY=sua_chave_aqui
OPENROUTER_MODEL=meta-llama/llama-4-scout
```

### 2. Obter API Key

Acesse [OpenRouter](https://openrouter.ai/) para obter sua API key gratuita.

---

## Uso

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
╔══════════════════════════════════════╗
║         COGIT CLI - MENU             ║
╚══════════════════════════════════════╝

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

---

## Estrutura do Projeto

```
src/
├── index.ts                      # Entry point
├── cli/
│   ├── commands/
│   │   ├── auto.ts               # Comando auto (7 flags)
│   │   └── menu.ts               # Menu interativo (9 opções)
│   └── ui/
│       ├── renderer.ts           # Output formatting
│       └── prompts.ts            # User prompts
├── core/                          # FASE 4
│   ├── container.ts              # Dependency injection
│   └── vault.ts                  # VibeVault (large diffs)
├── services/
│   ├── ai/
│   │   ├── brain/
│   │   │   ├── index.ts          # Geração de commit
│   │   │   └── normalizer.ts     # Conventional Commits
│   │   └── providers/
│   │       └── openrouter.ts     # Provider OpenRouter
│   ├── git/
│   │   ├── scanner.ts            # Scanner + diffData
│   │   ├── executor.ts           # git add/commit/push
│   │   ├── healer.ts             # Auto-correção
│   │   ├── branch.ts             # Branch management
│   │   └── tag.ts                 # Tag management
│   ├── security/
│   │   ├── sanitizer.ts          # Blocklist
│   │   └── redactor.ts           # Data masking
│   └── tools/                     # FASE 4
│       ├── stealth.ts            # Stealth Mode
│       └── ignore.ts             # Smart Ignore
├── types/                         # FASE 4
│   └── git.ts                     # TypeScript interfaces
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

Suite de testes automatizados com **48 testes** cobrindo todas as funcionalidades:

```bash
# === SUITE COMPLETA (48 testes) ===
node test-automation/test-full-exhaustive.js --report

# === FASE ESPECÍFICA ===
node test-automation/test-full-exhaustive.js --fase=1
node test-automation/test-full-exhaustive.js --fase=4

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
| Edge Cases | 8 | Arquivos especiais, limites | ✅ 100% |
| **TOTAL** | **48** | **Cobertura completa** | **✅ 100%** |

### Estrutura de Testes

```
test-automation/
├── test-full-exhaustive.js  # Suite principal (48 testes)
├── test-fase1.js            # Testes FASE 1
├── test-fase2.js            # Testes FASE 2
├── test-fase3.js            # Testes FASE 3
├── test-fase4.js            # Testes FASE 4
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

### Fase 5: Diagnostics
- [ ] AI Health Check
- [ ] Deep Trace Mode

---

## Licença

MIT

---

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

**Feito com ❤️ para automatizar workflows Git**
