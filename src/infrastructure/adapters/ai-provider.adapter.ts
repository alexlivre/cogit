/**
 * AI Provider Adapter
 * Implements AIProviderPort interface
 * Adapts existing AI services to port contract
 */

import { AIProviderPort, BrainInput, BrainOutput, ChatMessage } from '../../core/ports/index';
import { generateCommitMessage } from '../../services/ai/brain';
import { getAvailableProvider, tryWithFallback } from '../../services/ai/providers/index';

export class AIProviderAdapter implements AIProviderPort {
  private providerName: string = 'unknown';

  async generateCommitMessage(input: BrainInput): Promise<BrainOutput> {
    const result = await generateCommitMessage({
      diff: input.diff,
      diffData: input.diffData,
      hint: input.hint,
      language: input.language,
      debug: input.debug,
    });

    if (result.success) {
      this.providerName = result.provider || 'unknown';
    }

    return result;
  }

  getName(): string {
    return this.providerName;
  }

  isAvailable(): boolean {
    // Check if at least one provider has API key
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    
    return hasOpenRouter || hasGroq || hasOpenAI || hasGemini;
  }
}

/**
 * Multi-Provider AI Adapter with Fallback
 * Uses the fallback system to try multiple providers
 */
export class MultiProviderAIAdapter implements AIProviderPort {
  async generateCommitMessage(input: BrainInput): Promise<BrainOutput> {
    return await generateCommitMessage({
      diff: input.diff,
      diffData: input.diffData,
      hint: input.hint,
      language: input.language,
      debug: input.debug,
    });
  }

  getName(): string {
    return 'multi-provider-fallback';
  }

  isAvailable(): boolean {
    return this.hasAnyProvider();
  }

  private hasAnyProvider(): boolean {
    return !!(
      process.env.OPENROUTER_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY
    );
  }
}
