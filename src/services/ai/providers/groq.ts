import OpenAI from 'openai';
import { AIProvider, AIProviderConfig, ChatMessage, GenerateOptions } from './base';

export class GroqProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.groq.com/openai/v1',
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

    const content = completion.choices?.[0]?.message?.content;
    if (content === undefined || content === null || content === '') {
      throw new Error('Groq returned empty response');
    }
    return content;
  }

  getName(): string {
    return 'groq';
  }

  isAvailable(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }
}
