import OpenAI from 'openai';
import { AIProvider, AIProviderConfig, ChatMessage } from './base';

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/cogit-cli',
        'X-Title': 'Cogit CLI',
      },
    });
    this.model = config.model;
  }

  async generate(messages: ChatMessage[]): Promise<string> {
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
    return 'openrouter';
  }

  isAvailable(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY);
  }
}
