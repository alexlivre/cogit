# Plano: Criar ESPECIFICACOES_COGIT_CLI.md

## Resumo
Analisar o repositório `gitpy` para extrair sua inteligência de negócio, fluxos de automação e regras de segurança, criando um documento de especificações para guiar a reconstrução do sistema em TypeScript/Node.js.

## Análise Realizada

### Arquivos Analisados
- `README.md` - Visão mestre, matriz de funcionalidades, fluxos de trabalho
- `VIBE_ENGINEERING_GUIDE.md` - Arquitetura de cartuchos, restrições globais
- `vibe_core.py` - Kernel de execução, VibeVault, sistema de logs
- `launcher.py`, `launcher_auto.py` - Fluxos de automação
- `cartridges/` - Todos os manifestos e implementações
- `env_config.py`, `i18n.py` - Configuração e internacionalização

### Estrutura de Caruchos Mapeada
```
cartridges/
├── ai/           → ai-brain, ai-groq, ai-openai, ai-gemini, ai-ollama, ai-openrouter, ai-style
├── core/         → git-scanner, git-executor, git-healer, git-branch, git-tag
├── security/     → sec-sanitizer, sec-redactor, sec-keyring
├── tool/         → tool-stealth, tool-ignore
└── cli/          → cli-renderer
```

## Conteúdo do Documento de Especificações

O documento `ESPECIFICACOES_COGIT_CLI.md` conterá:

### 1. Matriz de Funcionalidades Completa
- AI Core: Semantic Commits, Message Regeneration, Multi-Provider Support, Context Hints
- Automation: Full Autonomous Mode, Interactive Menu, Dry Run, Local Commits, Skip Deploy
- Branch Management: Test Branch Creation, Navigation, Branch Center
- Tag Management: Tag Operations, Strong Confirmation (4-char code)
- Security: Stealth Mode, Lead Wall (3-layer), Blocklist, Redaction, Panic Lock
- Smart Features: Smart Ignore, Smart Whitelist, Vibe Vault
- Internationalization: Multi-Language Interface, Multi-Language Commits
- Diagnostics: AI Health Check, Deep Trace Mode, Resource Viewer

### 2. Fluxo de Automação (Diagrama Mermaid)
```
Stealth Stash → Scanner → AI Brain → Review → Executor → Healer → Restore
```

### 3. Comandos e Flags Detalhados
- Comandos: `auto`, `menu`, `check-ai`
- Flags: `--yes`, `--dry-run`, `--no-push`, `--nobuild`, `--branch`, `--message`, `--model`, `--debug`, `--path`

### 4. Sistema de Segurança (Lead Wall)
- **Sanitizer**: Blocklist imutável com padrões hardcoded
- **Redactor**: Mascaramento de secrets em diffs
- **Panic Lock**: Proteção inquebrável do .env
- **Stealth Mode**: Uso de `.gitpy-private` e `.gitpy-temp`

### 5. Gerenciamento de Erros (Git Healer)
- Detecção de falhas de push
- Consulta à IA para correções
- Loop de tentativas com histórico

### 6. Internacionalização (i18n)
- `LANGUAGE`: Idioma da interface
- `COMMIT_LANGUAGE`: Idioma das mensagens de commit
- Sistema de fallback para inglês

### 7. Vibe Vault & Grandes Diffs
- Limite de 100KB para payloads
- Sistema de referências em memória
- Smart Pack (Base64 vs Reference ID)

### 8. Tradução de Arquitetura
- De "Cartridges" (Python) para "Services/Modules" (TypeScript)
- Manifestos → Interfaces/Contratos
- VibeKernel → ServiceContainer
- VibeVault → MemoryStore

### 9. Confirmação de Segurança
- Código de 4 caracteres aleatórios (ex: B2CR)
- Operações destrutivas: delete tag, delete branch, reset

## Próximos Passos
1. Criar arquivo `ESPECIFICACOES_COGIT_CLI.md` na raiz do projeto
2. Documentar todas as especificações em formato Markdown estruturado
