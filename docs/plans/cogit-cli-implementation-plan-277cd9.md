# Plano de Implementação: Cogit CLI

Sistema de CLI para automação inteligente de Git com IA, dividido em 5 fases de implementação progressiva.

---

## Visão Geral das Fases

| Fase | Nome | Foco Principal | Complexidade |
|------|------|----------------|--------------|
| 1 | MVP | Fluxo core de commit com IA | Baixa |
| 2 | Automação | Modo autônomo e menu interativo | Média |
| 3 | Branch & Tags | Gerenciamento de branches e tags | Média |
| 4 | Smart Features | VibeVault, Stealth Mode, Smart Ignore | Alta |
| 5 | Diagnostics | Debug, Health Check, Healer | Alta |

---

## FASE 1: MVP (Mínimo Produto Viável)

**Objetivo:** Fluxo básico de commit com IA via OpenRouter, segurança Lead Wall e i18n.

### Estrutura de Arquivos

```
cogit-cli/
├── src/
│   ├── index.ts                    # Entry point
│   ├── cli/
│   │   └── index.ts                # CLI definition (Commander.js)
│   ├── core/
│   │   └── container.ts            # Service container
│   ├── services/
│   │   ├── ai/
│   │   │   ├── brain/
│   │   │   │   ├── index.ts        # Main logic
│   │   │   │   └── normalizer.ts   # Message normalization
│   │   │   └── providers/
│   │   │       ├── base.ts         # Interface base
│   │   │       └── openrouter.ts   # Provider OpenRouter
│   │   ├── git/
│   │   │   ├── scanner.ts          # Detecta mudanças
│   │   │   └── executor.ts          # git add/commit/push
│   │   └── security/
│   │       ├── sanitizer.ts        # Blocklist checker
│   │       └── redactor.ts         # Data masking
│   ├── config/
│   │   ├── env.ts                  # Environment config
│   │   └── i18n.ts                 # Internationalization
│   └── locales/
│       ├── en.json
│       └── pt.json
├── package.json
├── tsconfig.json
└── .env.example
```

### Funcionalidades

- **Comando `auto`**: Gera commit com IA e executa push
- **Flags**: `--yes`, `--no-push`, `--message "hint"`
- **OpenRouter**: Integração via SDK ou fetch
- **Lead Wall**: Sanitizer (blocklist) + Redactor (secrets)
- **i18n**: Interface pt/en, commits pt/en configuráveis
- **Conventional Commits**: Normalização automática

### Dependências

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "inquirer": "^9.2.0",
    "dotenv": "^16.4.0",
    "openai": "^4.0.0"  // Compatível com OpenRouter
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### Tarefas

- [ ] Setup projeto (package.json, tsconfig.json)
- [ ] Implementar ServiceContainer (core/container.ts)
- [ ] Implementar Scanner (services/git/scanner.ts)
- [ ] Implementar Sanitizer + Redactor (services/security/)
- [ ] Implementar Provider OpenRouter (services/ai/providers/)
- [ ] Implementar AI Brain + Normalizer (services/ai/brain/)
- [ ] Implementar Executor (services/git/executor.ts)
- [ ] Implementar i18n (config/i18n.ts + locales/)
- [ ] Implementar CLI (cli/index.ts) com comando `auto`
- [ ] Criar .env.example e documentação básica

---

## FASE 2: Automação e Menu Interativo

**Objetivo:** Modo autônomo completo e interface guiada.

### Novos Arquivos

```
src/
├── cli/
│   ├── commands/
│   │   ├── auto.ts                 # Refatorado
│   │   └── menu.ts                 # NOVO
│   └── ui/
│       ├── renderer.ts             # NOVO
│       └── prompts.ts              # NOVO
└── services/
    └── git/
        └── healer.ts               # NOVO
```

### Funcionalidades

- **Comando `menu`**: Interface interativa guiada
- **Flag `--dry-run`**: Simulação sem execução
- **Flag `--nobuild`**: Adiciona `[CI Skip]`
- **Git Healer**: Auto-correção de erros de push
- **Review Loop**: Regeneração interativa de mensagens
- **UI Components**: Spinners, progress bars, prompts

### Tarefas

- [ ] Implementar comando `menu` com Inquirer.js
- [ ] Implementar flag `--dry-run`
- [ ] Implementar flag `--nobuild`
- [ ] Implementar Git Healer (consulta IA para erros)
- [ ] Implementar Review Loop (regeneração)
- [ ] Refatorar `auto` para usar componentes

---

## FASE 3: Branch e Tag Management

**Objetivo:** Gerenciamento completo de branches e tags.

### Novos Arquivos

```
src/
├── cli/
│   └── commands/
│       └── check-ai.ts             # NOVO
├── services/
│   └── git/
│       ├── branch.ts               # NOVO
│       └── tag.ts                  # NOVO
└── utils/
    └── confirmation.ts             # NOVO (código 4 chars)
```

### Funcionalidades

- **Flag `--branch <name>`**: Criar/usar branch específica
- **Tag Operations**: Create, List, Delete, Reset, Push
- **Confirmation Code**: 4 caracteres para operações destrutivas
- **Comando `check-ai`**: Testa conectividade com provedores
- **Branch Center**: Menu de operações de branch

### Tarefas

- [ ] Implementar serviço de branches
- [ ] Implementar serviço de tags
- [ ] Implementar sistema de confirmação 4 chars
- [ ] Implementar flag `--branch`
- [ ] Implementar comando `check-ai`
- [ ] Adicionar Branch Center ao menu

---

## FASE 4: Smart Features

**Objetivo:** Features avançadas de gerenciamento de arquivos e diffs grandes.

### Novos Arquivos

```
src/
├── core/
│   └── vault.ts                    # NOVO (VibeVault)
├── services/
│   └── tools/
│       ├── stealth.ts              # NOVO
│       └── ignore.ts               # NOVO
├── config/
│   └── common_trash.json           # NOVO
└── types/
    └── git.ts                      # NOVO
```

### Funcionalidades

- **VibeVault**: Gerenciamento de diffs > 100KB
- **Stealth Mode**: Ocultar arquivos privados (.gitpy-private)
- **Smart Ignore**: Sugestões proativas de .gitignore
- **Smart Whitelist**: Exceções via comentários
- **Modular Config**: Padrões editáveis

### Tarefas

- [ ] Implementar VibeVault (memory store)
- [ ] Implementar Stealth Mode (.gitpy-private)
- [ ] Implementar Smart Ignore
- [ ] Implementar Smart Whitelist
- [ ] Criar common_trash.json com padrões

---

## FASE 5: Diagnostics e Debug

**Objetivo:** Ferramentas de diagnóstico e debug avançado.

### Novos Arquivos

```
src/
├── cli/
│   └── ui/
│       └── debug-logger.ts         # NOVO
└── services/
    └── diagnostics/
        ├── health.ts               # NOVO
        └── resources.ts            # NOVO
```

### Funcionalidades

- **Flag `--debug`**: Deep Trace Mode
- **Debug Log**: Captura payloads em `.vibe-debug.log`
- **Health Check**: Testa todos os provedores de IA
- **Resource Viewer**: Mapa completo de recursos
- **Multi-Provider Fallback**: Troca automática entre provedores

### Tarefas

- [ ] Implementar Deep Trace Mode
- [ ] Implementar Debug Logger
- [ ] Implementar Health Check completo
- [ ] Implementar Resource Viewer
- [ ] Implementar Auto-Fallback entre provedores
- [ ] Adicionar providers: Groq, Gemini, Ollama, OpenAI nativo

---

## Stack Tecnológica Final

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 18+ |
| Linguagem | TypeScript 5.x |
| CLI Framework | Commander.js |
| UI/Output | Chalk + Ora + Inquirer.js |
| HTTP Client | OpenAI SDK (compatível com OpenRouter) |
| Config | dotenv |

---

## Variáveis de Ambiente (.env.example)

```env
# === AI PROVIDER ===
AI_PROVIDER=openrouter

# === LANGUAGE SETTINGS ===
LANGUAGE=en
COMMIT_LANGUAGE=en

# === API KEYS ===
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=meta-llama/llama-4-scout

# === FUTURE PROVIDERS (Fase 5) ===
# GROQ_API_KEY=
# OPENAI_API_KEY=
# GEMINI_API_KEY=
```

---

## Ordem de Implementação Recomendada

1. **Fase 1** → Produto mínimo funcional
2. **Fase 2** → Melhor UX e automação
3. **Fase 3** → Features de DevOps
4. **Fase 4** → Features avançadas
5. **Fase 5** → Multi-provider e diagnostics

Cada fase deve ser **testável e funcional** antes de iniciar a próxima.
