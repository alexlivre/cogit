# Cogit CLI

![Status](https://img.shields.io/badge/Status-FASE_3_Complete-brightgreen) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![Node](https://img.shields.io/badge/Node-18%2B-green)

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

## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SCANNER                                                  │
│    • Detecta mudanças no repositório                        │
│    • Gera diff completo                                      │
├─────────────────────────────────────────────────────────────┤
│ 2. SANITIZER (Lead Wall - Layer 1)                          │
│    • Valida arquivos contra Blocklist Imutável              │
│    • Bloqueia: .env, .ssh/, *.pem, secrets, etc.            │
├─────────────────────────────────────────────────────────────┤
│ 3. REDACTOR (Lead Wall - Layer 2)                           │
│    • Mascara secrets no diff                                │
│    • Padrões: API keys, tokens, passwords                   │
├─────────────────────────────────────────────────────────────┤
│ 4. AI BRAIN                                                 │
│    • Envia diff seguro para OpenRouter                      │
│    • Gera mensagem no formato Conventional Commits          │
├─────────────────────────────────────────────────────────────┤
│ 5. REVIEW                                                   │
│    • Exibe mensagem gerada                                  │
│    • Opções: Execute / Regenerate / Cancel                  │
├─────────────────────────────────────────────────────────────┤
│ 6. EXECUTOR                                                 │
│    • git add -A                                             │
│    • git commit -m "<mensagem>"                             │
│    • git push (se não --no-push)                            │
├─────────────────────────────────────────────────────────────┤
│ 7. GIT HEALER (se push falhar)                              │
│    • Analisa erro com IA                                    │
│    • Sugere comandos de correção                            │
│    • Até 3 tentativas automáticas                           │
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
3. 🌿 Branch Center (Phase 3)
4. 🏷️  Tag Operations (Phase 3)
5. 🔍 View Repository Status
6. ⚙️  Settings
7. ❌ Exit
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
├── index.ts                      # Entry point (2 comandos)
├── cli/
│   ├── commands/
│   │   ├── auto.ts               # Comando auto (6 flags)
│   │   └── menu.ts               # Menu interativo (7 opções)
│   └── ui/
│       ├── renderer.ts           # Output formatting (10 funções)
│       └── prompts.ts            # User prompts (11 funções)
├── services/
│   ├── ai/
│   │   ├── brain/
│   │   │   ├── index.ts          # Geração de commit
│   │   │   └── normalizer.ts     # Conventional Commits
│   │   └── providers/
│   │       └── openrouter.ts     # Provider OpenRouter
│   ├── git/
│   │   ├── scanner.ts            # Scanner + untracked files
│   │   ├── executor.ts           # git add/commit/push
│   │   └── healer.ts             # Auto-correção de erros
│   └── security/
│       ├── sanitizer.ts          # Blocklist imutável
│       └── redactor.ts           # Data masking (5 padrões)
├── config/
│   ├── env.ts                    # Configuração de ambiente
│   └── i18n.ts                   # Internacionalização
└── locales/
    ├── en.json                   # Tradução English
    └── pt.json                   # Tradução Português
```

---

## Testes

Suite de testes automatizados com **17 testes**:

```bash
# Suite completa (FASE 1 + FASE 2)
node test-automation/test-comprehensive.js

# FASE 1 apenas
node test-automation/test-final.js

# FASE 2 apenas
node test-automation/test-fase2.js
```

### Cobertura

| Fase | Testes | Status |
|------|--------|--------|
| FASE 1 (MVP) | 10 | ✅ 100% |
| FASE 2 (Automação) | 7 | ✅ 100% |
| **TOTAL** | **17** | **✅ 100%** |

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

### Fase 4: Smart Features
- [ ] VibeVault (grandes diffs)
- [ ] Stealth Mode (arquivos privados)
- [ ] Smart Ignore

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
