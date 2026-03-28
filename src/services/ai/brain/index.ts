import { normalizeCommitMessage } from './normalizer';
import { redactDiff } from '../../security/redactor';
import { loadPromptTemplate } from '../../../config/i18n';
import { smartUnpack, formatSize, DiffData } from '../../../core/vault';
import { getAvailableProvider, tryWithFallback } from '../providers/index';
import { debugLogger } from '../../../cli/ui/debug-logger';
import { GenerateResult } from '../providers/base';
import { CONFIG } from '../../../config/env';

export interface BrainInput {
  diff: string;
  diffData?: DiffData;
  hint?: string;
  language: string;
  debug?: boolean;
  think?: boolean;
}

export interface BrainOutput {
  success: boolean;
  message?: string;
  error?: string;
  provider?: string;
  thinking?: string;
}

export async function generateCommitMessage(input: BrainInput): Promise<BrainOutput> {
  const { diff, diffData, hint, language, debug, think: thinkFlag } = input;
  
  // Use diffData if available (for large diffs)
  let actualDiff = diff;
  if (diffData) {
    actualDiff = smartUnpack(diffData);
  }
  
  if (!actualDiff && !hint) {
    return {
      success: false,
      error: language === 'pt' ? 'Sem diff ou dica para trabalhar.' : 'No diff or hint to work with.',
    };
  }
  
  // Check if diff was truncated
  const originalSize = diffData?.originalSize || Buffer.byteLength(actualDiff, 'utf-8');
  if (originalSize > 100 * 1024) {
    console.log(`Note: Processing large diff (${formatSize(originalSize)})`);
  }
  
  const safeDiff = redactDiff(actualDiff);
  const template = loadPromptTemplate(language);
  
  const messages = [
    { role: 'system' as const, content: template.system_prompt },
    { role: 'user' as const, content: buildUserPrompt(safeDiff, hint, template) },
  ];
  
  // Determine if thinking should be used
  // Priority: flag > env config
  // Only Ollama supports thinking, but we pass it to all providers (they ignore it)
  const shouldThink = thinkFlag !== undefined ? thinkFlag : CONFIG.OLLAMA_THINK;
  
  try {
    // Use fallback system for provider selection
    const { result: rawResponse, provider } = await tryWithFallback(async (p) => {
      const startTime = Date.now();
      
      if (debug) {
        debugLogger.logRequest(p.getName(), messages);
      }
      
      const response = await p.generate(messages, { think: shouldThink });
      
      if (debug) {
        debugLogger.logResponse(p.getName(), typeof response === 'string' ? response : response.content, Date.now() - startTime);
      }
      
      return response;
    });
    
    if (debug) {
      debugLogger.logInfo('Provider used', { provider, think: shouldThink });
    }
    
    // Extract content and thinking from response
    let content: string;
    let thinking: string | undefined;
    
    if (typeof rawResponse === 'string') {
      content = rawResponse;
    } else {
      content = rawResponse.content;
      thinking = rawResponse.thinking;
    }
    
    const normalizedMessage = normalizeCommitMessage(content, language);
    
    const result: BrainOutput = {
      success: true,
      message: normalizedMessage,
      provider,
    };
    
    // Include thinking in output if available
    if (thinking) {
      result.thinking = thinking;
      
      if (debug) {
        debugLogger.logInfo('Thinking output', { thinking: thinking.substring(0, 200) + '...' });
      }
    }
    
    return result;
  } catch (error) {
    if (debug) {
      debugLogger.logError('brain', error);
    }
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
