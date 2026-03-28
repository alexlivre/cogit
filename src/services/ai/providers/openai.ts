import OpenAI from 'openai';
import { AIProvider, AIProviderConfig, ChatMessage, GenerateOptions } from './base';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
    });
    this.model = config.model;
  }

  async generate(messages: ChatMessage[], _options?: GenerateOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    return completion.choices[0]?.message?.content || '';
  }

  getName(): string {
    return 'openai';
  }

  isAvailable(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }
}
