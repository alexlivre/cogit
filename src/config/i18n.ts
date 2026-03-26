import * as fs from 'fs';
import * as path from 'path';

type TranslationKeys = Record<string, string>;
type PromptTemplate = {
  system_prompt: string;
  user_prompt_template: string;
  hint_template: string;
  truncated_hint: string;
  fallback_title: string;
  fallback_detail: string;
};

class I18nManager {
  private translations: Map<string, TranslationKeys> = new Map();
  private prompts: Map<string, PromptTemplate> = new Map();
  private currentLang: string;

  constructor(lang: string = 'en') {
    this.currentLang = lang;
    this.loadTranslations();
    this.loadPrompts();
  }

  private loadTranslations(): void {
    const localesDir = path.join(__dirname, '../locales');
    
    for (const lang of ['en', 'pt']) {
      const filePath = path.join(localesDir, `${lang}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.translations.set(lang, JSON.parse(content));
      }
    }
  }

  private loadPrompts(): void {
    this.prompts.set('en', {
      system_prompt: `You are a Senior DevOps Assistant. Generate Git commit messages following Conventional Commits format.

Rules:
- Title format: <type>: <description> (max 50 chars)
- Types: feat, fix, update, chore, refactor, docs, style, test, build, ci
- Body: bullet points with category markers:
  - Use "- n" for features/enhancements
  - Use "- f" for bug fixes
  - Use "- u" for updates/refactors
- Example body format:
  - n add new authentication system
  - f resolve login timeout issue
  - u refactor database connection logic
- Be concise and descriptive
- No markdown code blocks in response`,
      user_prompt_template: `Generate a commit message for the following changes:

{diff}`,
      hint_template: `\nHint: '{hint}'`,
      truncated_hint: '\nNote: The diff was truncated due to size.',
      fallback_title: 'update: general changes',
      fallback_detail: 'details unavailable',
    });
    
    this.prompts.set('pt', {
      system_prompt: `Você é um Assistente DevOps Sênior. Gere mensagens de commit Git seguindo o formato Conventional Commits.

Regras:
- Formato do título: <tipo>: <descrição> (máx 50 caracteres)
- Tipos: feat, fix, update, chore, refactor, docs, style, test, build, ci
- Corpo: bullet points com marcadores de categoria:
  - Use "- n" para features/melhorias
  - Use "- f" para correções de bugs
  - Use "- u" para atualizações/refatorações
- Exemplo de formato do corpo:
  - n adiciona novo sistema de autenticação
  - f resolve problema de timeout no login
  - u refatora lógica de conexão com banco
- Seja conciso e descritivo
- Sem blocos de código markdown na resposta`,
      user_prompt_template: `Gere uma mensagem de commit para as seguintes mudanças:

{diff}`,
      hint_template: `\nDica: '{hint}'`,
      truncated_hint: '\nNota: O diff foi truncado devido ao tamanho.',
      fallback_title: 'atualização: mudanças gerais',
      fallback_detail: 'detalhes indisponíveis',
    });
  }

  t(key: string, vars?: Record<string, string>): string {
    let text: string = this.translations.get(this.currentLang)?.[key] || '';
    
    if (!text) {
      text = this.translations.get('en')?.[key] || key;
    }
    
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    
    return text;
  }

  getPromptTemplate(lang?: string): PromptTemplate {
    const targetLang = lang || this.currentLang;
    return this.prompts.get(targetLang) || this.prompts.get('en')!;
  }
}

let i18nInstance: I18nManager | null = null;

export function getI18n(lang?: string): I18nManager {
  if (!i18nInstance) {
    i18nInstance = new I18nManager(lang || process.env.LANGUAGE || 'en');
  }
  return i18nInstance;
}

export function loadPromptTemplate(lang: string): PromptTemplate {
  return getI18n(lang).getPromptTemplate(lang);
}

export function t(key: string, vars?: Record<string, string>): string {
  return getI18n().t(key, vars);
}
