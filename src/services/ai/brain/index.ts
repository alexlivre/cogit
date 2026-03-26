import { OpenRouterProvider } from '../providers/openrouter';
import { normalizeCommitMessage } from './normalizer';
import { redactDiff } from '../../security/redactor';
import { loadPromptTemplate } from '../../../config/i18n';

export interface BrainInput {
  diff: string;
  hint?: string;
  language: string;
}

export interface BrainOutput {
  success: boolean;
  message?: string;
  error?: string;
}

export async function generateCommitMessage(input: BrainInput): Promise<BrainOutput> {
  const { diff, hint, language } = input;
  
  if (!diff && !hint) {
    return {
      success: false,
      error: language === 'pt' ? 'Sem diff ou dica para trabalhar.' : 'No diff or hint to work with.',
    };
  }
  
  const safeDiff = redactDiff(diff);
  const template = loadPromptTemplate(language);
  
  const messages = [
    { role: 'system' as const, content: template.system_prompt },
    { role: 'user' as const, content: buildUserPrompt(safeDiff, hint, template) },
  ];
  
  try {
    const provider = new OpenRouterProvider({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout',
    });
    
    const rawResponse = await provider.generate(messages);
    const normalizedMessage = normalizeCommitMessage(rawResponse, language);
    
    return {
      success: true,
      message: normalizedMessage,
    };
  } catch (error) {
    return {
      success: false,
      error: `AI generation failed: ${error}`,
    };
  }
}

function buildUserPrompt(diff: string, hint: string | undefined, template: any): string {
  let prompt = template.user_prompt_template.replace('{diff}', diff.slice(0, 8000));
  
  if (hint) {
    prompt += template.hint_template.replace('{hint}', hint);
  }
  
  if (diff.length > 8000) {
    prompt += template.truncated_hint;
  }
  
  return prompt;
}
