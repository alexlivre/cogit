# Plano de Correção de Bugs - Cogit CLI

Plano estruturado em 4 fases para corrigir os 15 bugs identificados no code review, priorizando vulnerabilidades de segurança.

---

## Visão Geral

| Fase | Foco | Bugs | Prazo Sugerido |
|------|------|------|----------------|
| 1 | Segurança Crítica | 3 | Imediato |
| 2 | Estabilidade | 5 | 1 semana |
| 3 | Qualidade | 4 | 2 semanas |
| 4 | Refatoração | 3 | 3 semanas |

---

## FASE 1: Segurança Crítica

**Objetivo:** Eliminar vulnerabilidades de segurança que permitem execução arbitrária de comandos.

### 1.1 Corrigir Injeção de Comando no gitCommit

**Arquivo:** `src/services/git/executor.ts`

**Mudanças:**
- [ ] Modificar `gitCommit()` para usar stdin em vez de string interpolada
- [ ] Atualizar interface `ExecOptions` para aceitar `input?: string`
- [ ] Modificar `execGit()` para passar input via stdin quando disponível
- [ ] Adicionar teste unitário para mensagens com caracteres especiais
- [ ] Testar manualmente: `cogit auto -m "fix: bug \`whoami\`"`

**Critério de Aceitação:**
- Mensagens com `$()`, backticks, `;`, `|`, `&` são seguras
- Todos os testes passam
- Commit funciona normalmente com mensagens comuns

---

### 1.2 Reforçar Segurança no Healer

**Arquivo:** `src/services/git/healer.ts`

**Mudanças:**
- [ ] Criar lista abrangente de `BLOCKED_COMMANDS`
- [ ] Criar lista de `DANGEROUS_GIT_FLAGS`
- [ ] Implementar função `isCommandSafe()` com whitelist
- [ ] Restringir execução apenas a comandos `git`
- [ ] Adicionar log de comandos bloqueados
- [ ] Adicionar testes para tentativas de injeção

**Comandos a Bloquear:**
```typescript
const BLOCKED_COMMANDS = [
  'rm', 'rmdir', 'del', 'erase',
  'chmod', 'chown', 'chgrp',
  'curl', 'wget', 'nc', 'netcat',
  'eval', 'exec', 'source',
  'sudo', 'su', 'doas',
  'dd', 'shred', 'wipe',
  'mkfs', 'format',
];
```

**Critério de Aceitação:**
- Apenas comandos git são executados
- Flags perigosas são bloqueadas
- Log registra tentativas de comando bloqueado

---

### 1.3 Corrigir Memory Leak no VibeVault

**Arquivo:** `src/core/vault.ts` e `src/services/ai/brain/index.ts`

**Mudanças:**
- [ ] Adicionar TTL (Time To Live) no metadata
- [ ] Implementar `scheduleCleanup()` para limpeza automática
- [ ] Usar `withAutoCleanup()` no fluxo principal do brain
- [ ] Adicionar método `cleanupExpired()` para limpeza de referências antigas
- [ ] Adicionar teste de memory leak

**Critério de Aceitação:**
- Diffs são limpos após uso
- Memória não cresce indefinidamente
- Teste de stress com múltiplos commits passa

---

### Checklist Fase 1

```markdown
## ✅ FASE 1 - Segurança Crítica

### 1.1 Injeção de Comando
- [ ] Implementar stdin em gitCommit
- [ ] Atualizar ExecOptions
- [ ] Testes unitários
- [ ] Teste manual

### 1.2 Healer Security
- [ ] BLOCKED_COMMANDS
- [ ] DANGEROUS_GIT_FLAGS
- [ ] isCommandSafe()
- [ ] Whitelist git only
- [ ] Logging
- [ ] Testes

### 1.3 Memory Leak
- [ ] TTL no metadata
- [ ] scheduleCleanup()
- [ ] withAutoCleanup() no brain
- [ ] cleanupExpired()
- [ ] Teste de stress

### Validação Final
- [ ] Todos os testes passam
- [ ] Code review das mudanças
- [ ] Teste de penetração básico
```

---

## FASE 2: Estabilidade

**Objetivo:** Corrigir bugs que causam comportamento inesperado e race conditions.

### 2.1 Race Condition no Stealth Mode

**Arquivo:** `src/services/tools/stealth.ts`

**Mudanças:**
- [ ] Criar interface `StealthOperation` para log de operações
- [ ] Implementar `saveOperationLog()` para persistir estado
- [ ] Implementar `rollbackFromLog()` para recuperação
- [ ] Adicionar handler de sinais (SIGINT, SIGTERM)
- [ ] Criar arquivo `.operation-log` no diretório temp
- [ ] Testar interrupção durante operação

**Critério de Aceitação:**
- Ctrl+C restaura arquivos automaticamente
- Crash não deixa estado inconsistente
- Log permite recuperação manual

---

### 2.2 Tratamento de Erro no Scanner

**Arquivo:** `src/services/git/scanner.ts`

**Mudanças:**
- [ ] Criar array `unreadableFiles` para registrar falhas
- [ ] Adicionar campo `warnings` no `ScanResult`
- [ ] Exibir avisos ao usuário
- [ ] Tratar erros específicos (EACCES, ENOENT, etc.)

**Critério de Aceitação:**
- Usuário é informado de arquivos ignorados
- Motivo da falha é claro
- Commit prossegue se possível

---

### 2.3 Validação de Branch Name

**Arquivo:** `src/services/git/branch.ts`

**Mudanças:**
- [ ] Implementar validação completa conforme `git check-ref-format`
- [ ] Bloquear `..`, `@{`, `--`, `.` no início/fim
- [ ] Bloquear caracteres de controle
- [ ] Bloquear `//`, espaços, `~`, `^`, `:`, `?`, `*`, `[`
- [ ] Adicionar testes para casos edge

**Critério de Aceitação:**
- Nomes problemáticos são rejeitados
- Mensagem de erro clara
- Nomes válidos funcionam

---

### 2.4 Timeout no Ollama

**Arquivo:** `src/services/ai/providers/ollama.ts`

**Mudanças:**
- [ ] Mover `clearTimeout` para bloco `finally`
- [ ] Garantir limpeza em todos os caminhos de erro

**Critério de Aceitação:**
- Timer sempre limpo
- Processo pode terminar graciosamente

---

### 2.5 Regex no Sanitizer

**Arquivo:** `src/services/security/sanitizer.ts`

**Mudanças:**
- [ ] Criar função `escapeRegex()` para escapar caracteres especiais
- [ ] Aplicar escape antes de substituir `*` por `.*`
- [ ] Adicionar testes para padrões com caracteres especiais

**Critério de Aceitação:**
- Padrões como `file.+` funcionam corretamente
- Não há crash por regex inválido

---

### Checklist Fase 2

```markdown
## ✅ FASE 2 - Estabilidade

### 2.1 Stealth Race Condition
- [ ] StealthOperation interface
- [ ] saveOperationLog()
- [ ] rollbackFromLog()
- [ ] Signal handlers
- [ ] .operation-log file
- [ ] Testes de interrupção

### 2.2 Scanner Errors
- [ ] unreadableFiles array
- [ ] warnings field
- [ ] User notification
- [ ] Specific error handling

### 2.3 Branch Validation
- [ ] Complete validation
- [ ] Block problematic patterns
- [ ] Clear error messages
- [ ] Edge case tests

### 2.4 Ollama Timeout
- [ ] finally block
- [ ] Always cleanup

### 2.5 Sanitizer Regex
- [ ] escapeRegex()
- [ ] Apply escape
- [ ] Tests

### Validação Final
- [ ] Todos os testes passam
- [ ] Teste de interrupção manual
- [ ] Code review
```

---

## FASE 3: Qualidade

**Objetivo:** Melhorar tratamento de erros e completude de funcionalidades.

### 3.1 Fallback no OpenRouter

**Arquivo:** `src/services/ai/providers/openrouter.ts`

**Mudanças:**
- [ ] Verificar se `choices` existe e não está vazio
- [ ] Lançar erro explícito se resposta vazia
- [ ] Adicionar log de resposta vazia

**Critério de Aceitação:**
- Respostas vazias geram erro claro
- Usuário sabe que houve falha

---

### 3.2 Redação de Segurança Completa

**Arquivo:** `src/services/security/redactor.ts`

**Mudanças:**
- [ ] Adicionar padrão para AWS Secret Access Keys
- [ ] Adicionar padrão para JWTs
- [ ] Adicionar padrão para URLs com credenciais
- [ ] Adicionar padrão para Private Keys PEM
- [ ] Adicionar padrão para GitHub Tokens
- [ ] Adicionar padrão para Slack Tokens
- [ ] Adicionar padrão para Stripe Keys
- [ ] Adicionar padrão para Connection Strings
- [ ] Criar testes para cada tipo de credencial

**Critério de Aceitação:**
- Todos os tipos de credencial são redacionados
- Diff seguro para envio à IA

---

### 3.3 Exit sem Restaurar Stealth

**Arquivo:** `src/cli/commands/auto.ts`

**Mudanças:**
- [ ] Criar função `exitHandler()` que restaura stealth
- [ ] Substituir `process.exit()` por `exitHandler()`
- [ ] Registrar handlers para SIGINT, SIGTERM
- [ ] Garantir restauração em todos os caminhos

**Critério de Aceitação:**
- Arquivos sempre restaurados
- Funciona com Ctrl+C

---

### 3.4 Regex Ineficiente

**Arquivo:** `src/core/error-handler/error-classifier.ts`

**Mudanças:**
- [ ] Usar `pattern.test()` quando não há `contextExtractor`
- [ ] Usar `pattern.match()` apenas quando necessário extrair contexto

**Critério de Aceitação:**
- Performance melhorada
- Comportamento idêntico

---

### Checklist Fase 3

```markdown
## ✅ FASE 3 - Qualidade

### 3.1 OpenRouter Fallback
- [ ] Check choices array
- [ ] Explicit error
- [ ] Logging

### 3.2 Redação Completa
- [ ] AWS Secret Keys
- [ ] JWTs
- [ ] URLs with credentials
- [ ] Private Keys PEM
- [ ] GitHub Tokens
- [ ] Slack Tokens
- [ ] Stripe Keys
- [ ] Connection Strings
- [ ] Tests for each

### 3.3 Exit Handler
- [ ] exitHandler function
- [ ] Replace process.exit
- [ ] Signal handlers
- [ ] All paths covered

### 3.4 Regex Optimization
- [ ] Use test() when possible
- [ ] Match only when needed

### Validação Final
- [ ] Todos os testes passam
- [ ] Coverage de redação
- [ ] Teste manual de exit
```

---

## FASE 4: Refatoração

**Objetivo:** Eliminar duplicação e melhorar arquitetura.

### 4.1 Duplicação em Auto-Push

**Arquivo:** `src/services/network/auto-push.ts`

**Mudanças:**
- [ ] Criar interface `AutoPushParams`
- [ ] Implementar função genérica `autoPushGeneric()`
- [ ] Refatorar `autoPushBranch()` para usar função genérica
- [ ] Refatorar `autoPushTag()` para usar função genérica
- [ ] Refatorar `autoPushAllTags()` para usar função genérica
- [ ] Garantir comportamento idêntico

**Critério de Aceitação:**
- Código duplicado eliminado
- Testes existentes passam
- Funcionalidade preservada

---

### 4.2 Configuração Hardcoded

**Arquivo:** `src/config/env.ts` e `src/services/ai/brain/index.ts`

**Mudanças:**
- [ ] Adicionar `DIFF_MAX_SIZE` no CONFIG
- [ ] Adicionar `DIFF_TRUNCATE_WARNING_THRESHOLD` no CONFIG
- [ ] Substituir hardcoded 8000 por CONFIG.DIFF_MAX_SIZE
- [ ] Adicionar aviso de truncamento
- [ ] Documentar novas variáveis de ambiente

**Critério de Aceitação:**
- Limite configurável via .env
- Usuário avisado de truncamento

---

### 4.3 Validação de Tag Name

**Arquivo:** `src/services/git/tag.ts`

**Mudanças:**
- [ ] Implementar validação completa similar ao branch
- [ ] Bloquear `..`, `@{`, `--`, `-` no início
- [ ] Bloquear caracteres de controle
- [ ] Bloquear espaços e caracteres especiais
- [ ] Adicionar testes

**Critério de Aceitação:**
- Tags problemáticas rejeitadas
- Mensagem de erro clara

---

### Checklist Fase 4

```markdown
## ✅ FASE 4 - Refatoração

### 4.1 Auto-Push Deduplication
- [ ] AutoPushParams interface
- [ ] autoPushGeneric()
- [ ] Refactor autoPushBranch
- [ ] Refactor autoPushTag
- [ ] Refactor autoPushAllTags
- [ ] Tests pass

### 4.2 Config Flexibility
- [ ] DIFF_MAX_SIZE in CONFIG
- [ ] DIFF_TRUNCATE_WARNING_THRESHOLD
- [ ] Replace hardcoded values
- [ ] Truncation warning
- [ ] Documentation

### 4.3 Tag Validation
- [ ] Complete validation
- [ ] Block problematic patterns
- [ ] Clear error messages
- [ ] Tests

### Validação Final
- [ ] Todos os testes passam
- [ ] Code review
- [ ] Documentação atualizada
- [ ] README atualizado
```

---

## Checklist Geral Final

```markdown
## ✅ VALIDAÇÃO FINAL DO PROJETO

### Testes
- [ ] Todos os testes unitários passam
- [ ] Testes de integração passam
- [ ] Testes de stress passam
- [ ] Coverage mínimo 70%

### Segurança
- [ ] Sem injeção de comando
- [ ] Healer bloqueia comandos perigosos
- [ ] Redação completa de credenciais
- [ ] Validação de input robusta

### Estabilidade
- [ ] Sem memory leaks
- [ ] Race conditions tratadas
- [ ] Timeouts limpos
- [ ] Exit handlers funcionam

### Documentação
- [ ] README atualizado
- [ ] .env.example atualizado
- [ ] Comentários em código crítico
- [ ] CHANGELOG atualizado

### Code Review
- [ ] Code review final realizado
- [ ] Sem regressões
- [ ] Padrões de código seguidos
```

---

## Ordem de Execução Recomendada

```
SEMANA 1
├── FASE 1 (Segurança Crítica)
│   ├── Dia 1-2: Injeção de Comando
│   ├── Dia 3-4: Healer Security
│   └── Dia 5: Memory Leak

SEMANA 2
├── FASE 2 (Estabilidade)
│   ├── Dia 1-2: Stealth Race Condition
│   ├── Dia 3: Scanner Errors + Branch Validation
│   └── Dia 4-5: Ollama Timeout + Sanitizer Regex

SEMANA 3
├── FASE 3 (Qualidade)
│   ├── Dia 1: OpenRouter Fallback
│   ├── Dia 2-3: Redação Completa
│   └── Dia 4-5: Exit Handler + Regex Optimization

SEMANA 4
├── FASE 4 (Refatoração)
│   ├── Dia 1-2: Auto-Push Deduplication
│   ├── Dia 3: Config Flexibility
│   └── Dia 4-5: Tag Validation + Validação Final
```

---

## Dependências entre Tarefas

```
1.1 (Injeção) ─────────────────────────────────────────┐
                                                        │
1.2 (Healer) ──────────────────────────────────────────┤
                                                        │
1.3 (Memory Leak) ─────────────────────────────────────┤
                                                        │
2.1 (Stealth) ──┐                                      │
                 │                                      │
2.2 (Scanner) ───┼──────────────────────────────────────┼──> 3.3 (Exit Handler)
                 │                                      │
2.3 (Branch) ────┤                                      │
                 │                                      │
2.4 (Ollama) ────┤                                      │
                 │                                      │
2.5 (Sanitizer) ─┘                                      │
                                                        │
3.1 (OpenRouter) ──────────────────────────────────────┤
                                                        │
3.2 (Redação) ─────────────────────────────────────────┤
                                                        │
3.4 (Regex) ───────────────────────────────────────────┤
                                                        │
4.1 (Auto-Push) ───────────────────────────────────────┤
                                                        │
4.2 (Config) ──────────────────────────────────────────┤
                                                        │
4.3 (Tag Validation) ──────────────────────────────────┴──> VALIDAÇÃO FINAL
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebrar funcionalidade existente | Média | Alto | Testes extensivos antes de cada mudança |
| Regressão em edge cases | Média | Médio | Aumentar cobertura de testes |
| Performance degradada | Baixa | Médio | Benchmarking antes/depois |
| Incompatibilidade com .env existente | Baixa | Baixo | Manter defaults atuais |

---

## Métricas de Sucesso

- **Segurança:** 0 vulnerabilidades críticas
- **Estabilidade:** 0 race conditions conhecidas
- **Memória:** Uso estável em execuções longas
- **Cobertura:** >70% de código testado
- **Duplicação:** <5% de código duplicado
- **Performance:** Sem degradação mensurável
