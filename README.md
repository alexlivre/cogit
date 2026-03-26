# Cogit CLI

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

### Flags Disponíveis

| Flag | Shortcut | Descrição |
|------|----------|-----------|
| `--yes` | `-y` | Pula confirmações interativas |
| `--no-push` | - | Commita sem enviar para remote |
| `--message <hint>` | `-m` | Dica de contexto para IA |
| `--path <dir>` | `-p` | Diretório alvo |

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

### Fase 2: Automação
- [ ] Modo totalmente autônomo
- [ ] Menu interativo
- [ ] Dry run simulation

### Fase 3: Branch & Tags
- [ ] Gerenciamento de branches
- [ ] Operações com tags
- [ ] Confirmação de segurança (4 chars)

### Fase 4: Smart Features
- [ ] VibeVault (grandes diffs)
- [ ] Stealth Mode (arquivos privados)
- [ ] Smart Ignore

### Fase 5: Diagnostics
- [ ] AI Health Check
- [ ] Git Healer (auto-correção)
- [ ] Deep Trace Mode

---

## Licença

MIT

---

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

**Feito com ❤️ para automatizar workflows Git**
