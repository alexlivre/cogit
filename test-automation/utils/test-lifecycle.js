#!/usr/bin/env node

/**
 * Cogit CLI - Test Lifecycle Manager
 * Gerencia setup e teardown automático para cada teste
 * 
 * Responsabilidades:
 * - beforeEach: Garante estado limpo ANTES de cada teste
 * - afterEach: Limpa bagunça DEPOIS de cada teste
 * 
 * Uso:
 *   const lifecycle = new TestLifecycle(gitHelper, fileHelper);
 *   lifecycle.beforeEach(); // Antes do teste
 *   lifecycle.afterEach();  // Depois do teste
 */

class TestLifecycle {
  constructor(gitHelper, fileHelper, options = {}) {
    this.git = gitHelper;
    this.file = fileHelper;
    this.options = {
      noCleanup: options.noCleanup || false,
      verbose: options.verbose || false
    };
  }

  /**
   * ANTES de cada teste
   * Garante estado limpo mesmo se teste anterior falhou
   * 
   * Executa:
   * 1. git reset --hard HEAD (descarta mudanças)
   * 2. git clean -fd (remove untracked)
   * 3. git reset HEAD (remove do staging)
   * 4. Limpa arquivos do filesystem
   * 5. Garante branch main/master
   */
  beforeEach() {
    if (this.options.verbose) {
      console.log('  🧹 [Lifecycle] Executando beforeEach...');
    }

    try {
      // 1. Reset working directory (discard changes to tracked files)
      this.git.resetHard();
      
      // 2. Remove from staging area (unstage all)
      this.git.resetIndex();
      
      // 3. Ensure on main branch
      this.git.ensureMainBranch();
      
      // NOTA: Não removemos arquivos untracked aqui porque
      // os testes podem precisar criar arquivos para testar
      // A limpeza de untracked acontece no afterEach
      
      if (this.options.verbose) {
        console.log('  ✅ [Lifecycle] beforeEach concluído');
      }
    } catch (error) {
      console.error('  ⚠️ [Lifecycle] Erro no beforeEach:', error.message);
      // Continua mesmo com erro - teste pode ainda funcionar
    }
  }

  /**
   * DEPOIS de cada teste
   * Teste limpa sua própria bagunça
   * 
   * Executa:
   * 1. git reset --hard HEAD (descarta mudanças)
   * 2. git clean -fd (remove untracked)
   * 3. Limpa arquivos do filesystem
   * 
   * Respeita flag --no-cleanup (pula limpeza se true)
   */
  afterEach() {
    // Respeitar flag --no-cleanup
    if (this.options.noCleanup) {
      if (this.options.verbose) {
        console.log('  ⏭️ [Lifecycle] afterEach pulado (--no-cleanup)');
      }
      return;
    }

    if (this.options.verbose) {
      console.log('  🧹 [Lifecycle] Executando afterEach...');
    }

    try {
      // 1. Reset working directory
      this.git.resetHard();
      
      // 2. Remove untracked files (cleanFd ou clean)
      if (typeof this.git.cleanFd === 'function') {
        this.git.cleanFd();
      } else if (typeof this.git.clean === 'function') {
        this.git.clean();
      }
      
      // 3. Clean file system
      if (this.file && typeof this.file.cleanup === 'function') {
        this.file.cleanup();
      }
      
      if (this.options.verbose) {
        console.log('  ✅ [Lifecycle] afterEach concluído');
      }
    } catch (error) {
      console.error('  ⚠️ [Lifecycle] Erro no afterEach:', error.message);
      // Erro no cleanup não deve afetar resultado do teste
    }
  }

  /**
   * Setup inicial ANTES de todos os testes
   * Executa uma vez antes da suite começar
   */
  beforeAll() {
    if (this.options.verbose) {
      console.log('\n🧹 [Lifecycle] Setup inicial (beforeAll)...');
    }

    this.beforeEach();

    if (this.options.verbose) {
      console.log('✅ [Lifecycle] Setup inicial concluído\n');
    }
  }

  /**
   * Cleanup final DEPOIS de todos os testes
   * Executa uma vez após a suite terminar
   */
  afterAll() {
    if (this.options.verbose) {
      console.log('\n🧹 [Lifecycle] Cleanup final (afterAll)...');
    }

    this.afterEach();

    if (this.options.verbose) {
      console.log('✅ [Lifecycle] Cleanup final concluído\n');
    }
  }
}

module.exports = { TestLifecycle };
