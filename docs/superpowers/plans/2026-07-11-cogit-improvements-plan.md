# Cogit CLI — Plano de Correções e Melhorias

> **Para workers:** Sub-skill obrigatória: `superpowers:executing-plans` ou `superpowers:subagent-driven-development`. Steps com checkboxes (`- [ ]`) para tracking.

**Goal:** Eliminar os 47 achados da auditoria, estabilizar o projeto, e estabelecer base de testes rastreável com Vitest + cobertura real.

**Architecture:** 6 fases com entregas independentes. Cada fase produz software funcional + testes passando. Decisão: deletar código morto (não finalizar migração Hexagonal).

**Tech Stack:** Node 18+, TypeScript 5.4+, Vitest 1+, c8, git CLI.

**Spec de referência:** `docs/superpowers/specs/2026-07-11-cogit-audit-design.md`

**Decisões travadas (D1, D2, D3):**
- D1: **Deletar** código morto (não finalizar migração Hexagonal)
- D2: **Vitest** como framework de testes
- D3: **Remover badge 95.4%** até cobertura real

---

## 🗺️ Roadmap (Mapa de Execução)

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 5
  2 dias     3 dias    3-4 dias    3 dias     2 dias    2-3 dias
  Fundação    Crítico   Moderado    Vitest    Higiene    Melhorias
  (executors) (security) (stability) (testes)  (.gitignore (i18n, tipos)
                                     (coverage)  docs)
```

**Dependências:**
- **Fase 0 → todas**: fornece API `safeExec()` que torna Fase 1 viável
- **Fase 1 → Fase 2**: correções críticas devem vir antes para evitar re-trabalho
- **Fase 3 → tudo**: testes automatizados precisam existir antes de qualquer merge
- **Fase 4 independente** mas desejável após Fase 1 (README precisa ser coerente)
- **Fase 5 independente**, executável em qualquer momento após Fase 3

---

## 📋 Índice de Tarefas

### **Fase 0 — Fundação (2 dias)**
- [ ] F0.1: Reescrever executor com `spawn` + array args (4h)
- [ ] F0.2: Módulo central `git-ref.ts` de validação Git ref (2h)
- [ ] F3.1: Setup Vitest + c8 (parte do F0 para destravar TDD) (4h)

### **Fase 1 — Segurança Crítica (3 dias)**
- [ ] F1.1: gitCommit seguro via stdin (2h) — **detalhado abaixo**
- [ ] F1.2: Healer com whitelist completa (4h)
- [ ] F1.3: Validação em todas funções públicas de `branch.ts` (3h)
- [ ] F1.4: Validação em todas funções públicas de `tag.ts` (3h)
- [ ] F1.5: Validar pattern de `.gitpy-private` em stealth (2h)
- [ ] F1.6: Vault com TTL + `withAutoCleanup` no fluxo de brain (3h)
- [ ] F1.7: Deletar código morto (auto.ts, *-refactored.ts, application/, infrastructure/, container.ts, plugins/) (4h)
- [ ] F1.8: Substituir `process.exit` por `throw` em todos commands (4h)

### **Fase 2 — Estabilidade / Moderados (3-4 dias)**
- [ ] F2.1: Stealth com operation log + rollback (3h)
- [ ] F2.2: Scanner retorna `warnings[]` para arquivos ignorados (2h)
- [ ] F2.3: Ollama timeout com `finally` cleanup (1h)
- [ ] F2.4: `escapeRegex()` no Sanitizer (1h)
- [ ] F2.5: Dedup `autoPushBranch/Tag/AllTags` via `executeAutoPush` (4h)
- [ ] F2.6: Resources scan: limite profundidade + symlink check (2h)
- [ ] F2.7: Debug logger redact ANTES de log (1h)
- [ ] F2.8: `getRetrySummaryFromCount(count: number)` correto (1h)
- [ ] F2.9: `.gitignore` appendFileSync com backup antes (1h)

### **Fase 3 — Vitest + cobertura (3 dias)**
- [ ] F3.2: Migrar `test-automation/unit/*.test.js` → `tests/unit/**/*.test.ts` (4h)
- [ ] F3.3: Testes para F1.* e F2.* — cobertura ≥ 80% em security/ (6h)
- [ ] F3.4: CI: push/PR trigger, jobs, gate de cobertura — badge real (4h)

### **Fase 4 — Higiene do repositório (2 dias)**
- [ ] F4.1: `.gitignore` completo (1h)
- [ ] F4.2: `git rm` placeholders `test-feature.ts`, `test-fix.ts` (5min)
- [ ] F4.3: Mover fixtures canônicos de `teste/` → `test-automation/fixtures/` (2h)
- [ ] F4.4: `git rm` relatórios em `test-automation/reports/*.json|.md` (1h)
- [ ] F4.5: Reorganizar docs → `docs/{phases,specs,plans,providers,archive}/` (2h)
- [ ] F4.6: Versão única: `package.json` é fonte, `src/index.ts` lê dela (1h)
- [ ] F4.7: README: remover `95.4%`, "305 testes", claim 7 fases (2h)

### **Fase 5 — Melhorias menores (2-3 dias)**
- [ ] F5.1: Providers AI throw em `choices[0]?.message?.content` vazio (2h)
- [ ] F5.2: Redactor expansivo (JWT, AWS, GitHub, Slack, Stripe, PEM, connstrings) (3h)
- [ ] F5.3: Tipo `GitOperationResult` em `src/types/git.ts` (1h)
- [ ] F5.4: env vars: tratar `NaN` em `parseInt` (1h)
- [ ] F5.5: i18n fallback em JSON malformed (1h)
- [ ] F5.6: Constantes centralizadas `src/config/constants.ts` (2h)
- [ ] F5.7: Limpar JSDoc redundante + comentários boilerplate (2h)

**Total: 31 sub-planos, ~88h estimadas (≈11 dias úteis focados).**

---

## 🏁 Marcos de Release

- **v0.2.0** após Fase 1 — versão "segura" (sem injeção de comando)
- **v0.3.0** após Fase 2+3 — versão "estável + testada"
- **v0.4.0** após Fase 4+5 — versão "higiene + cobertura real"

---

## ⚠️ Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebrar CLI existente em produção | Média | Alto | Cada fase termina com `tsc --noEmit && npm run build && npm test` antes do commit |
| F1.7 (delete) quebrar imports escondidos | Média | Médio | `tsc --noEmit` antes de deletar; rodar testes |
| Migração Vitest quebrar suítes custom | Baixa | Médio | Manter scripts antigos rodando paralelos até F3.3 confirmar equivalência |
| TDD devagar | Média | Alto | Cada commit é pequeno (~3 dias para 8 correções críticas) |
| CI workflow falhar em Windows/macOS | Baixa | Médio | Manter `test-multi-os.yml` smoke, adicionar Vitest job ubuntu |

---

## 📐 Sub-plano Detalhado — F1.1 (exemplo representativo)

> Os demais sub-planos seguem o mesmo padrão TDD, com variações nos arquivos e códigos. Detalhe sob pedido.

### Task F1.1: gitCommit seguro via stdin

**Files:**
- Modify: `src/services/git/executor.ts:18-26`
- Modify: `src/utils/executor.ts` (adicionar `input` em `ExecOptions`)
- Test: `tests/unit/services/git/executor.test.ts` (novo)

**Objetivo:** Eliminar injeção de shell em `gitCommit()` usando `git commit -F -` com mensagem via stdin.

- [ ] **Step 1: Escrever teste falho**

```typescript
// tests/unit/services/git/executor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitCommit } from '../../../src/services/git/executor';
import * as execUtil from '../../../src/utils/executor';

vi.mock('../../../src/utils/executor');

describe('gitCommit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes commit message via stdin to avoid shell injection', async () => {
    vi.mocked(execUtil.execGit).mockResolvedValue({ stdout: '', stderr: '' });

    const malicious = 'feat: $(whoami) `id` "rm -rf"';
    await gitCommit('/tmp/repo', malicious);

    expect(execUtil.execGit).toHaveBeenCalledWith(
      expect.stringContaining('commit'),
      expect.objectContaining({
        cwd: '/tmp/repo',
        input: malicious,
      })
    );

    const call = vi.mocked(execUtil.execGit).mock.calls[0];
    const args = call[0];
    expect(args).not.toContain('$(whoami)');
    expect(args).not.toContain('`id`');
  });

  it('returns success when git commit succeeds', async () => {
    vi.mocked(execUtil.execGit).mockResolvedValue({ stdout: 'committed', stderr: '' });
    const result = await gitCommit('/tmp/repo', 'fix: bug');
    expect(result.success).toBe(true);
    expect(result.output).toBe('committed');
  });

  it('returns failure with error message when git fails', async () => {
    vi.mocked(execUtil.execGit).mockRejectedValue(new Error('nothing to commit'));
    const result = await gitCommit('/tmp/repo', 'fix: bug');
    expect(result.success).toBe(false);
    expect(result.error).toContain('nothing to commit');
  });
});
```

- [ ] **Step 2: Rodar para verificar falha**

```bash
npm run test -- tests/unit/services/git/executor.test.ts
```

Expected: FAIL com "gitCommit does not pass input"

- [ ] **Step 3: Atualizar `executor.ts` para usar `input`/stdin**

```typescript
// src/utils/executor.ts - adicionar em ExecOptions
export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  input?: string;          // <-- novo
  shell?: boolean | string;
}
```

```typescript
// src/services/git/executor.ts:18-26 - substituir
export async function gitCommit(repoPath: string, message: string): Promise<ExecutorResult> {
  try {
    const { stdout } = await execGit('commit -F -', {
      cwd: repoPath,
      input: message,        // <-- safe: stdin
    });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

- [ ] **Step 4: Rodar para verificar passagem**

```bash
npm run test -- tests/unit/services/git/executor.test.ts
```

Expected: PASS (3/3)

- [ ] **Step 5: Teste manual de exploit**

```bash
mkdir /tmp/exploit-test && cd /tmp/exploit-test && git init
echo a > a && git add a && git commit -m "init" --allow-empty
node -e "
  import('./dist/services/git/executor.js').then(m => {
    m.gitCommit('/tmp/exploit-test', 'feat: \$(touch /tmp/PWNED)').then(r => console.log(r));
  });
"
ls /tmp/PWNED 2>&1   # deve reportar 'No such file or directory'
```

- [ ] **Step 6: Commit**

```bash
git add src/services/git/executor.ts src/utils/executor.ts tests/unit/services/git/executor.test.ts
git commit -m "fix(security): eliminate command injection in gitCommit via stdin"
```

---

## 🧭 Sequência de Execução Recomendada

```
Dia 1-2:   F0.1, F0.2, F3.1 (base segura + Vitest)
Dia 3-5:   F1.1 → F1.6 (segurança crítica, TDD)
Dia 6:     F1.7 (limpa código morto em massa)
Dia 7:     F1.8 (exit → throw)
Dia 8-11:  F2.1 → F2.9 (moderados, TDD)
Dia 12-13: F3.2, F3.3, F4.7 (testes adicionais + README)
Dia 14:    F4.1, F4.2, F4.6 (gitignore + versão)
Dia 15:    F4.3, F4.4, F4.5 (reorganização de pastas)
Dia 16-18: F3.4 (CI completo), F4 (resto)
Dia 19-21: F5.1 → F5.7 (menores)
```

---

## 🔄 Status das Tarefas (a ser atualizado pelo executor)

_Nenhuma tarefa iniciada ainda._
