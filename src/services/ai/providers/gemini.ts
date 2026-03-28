import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIProviderConfig, ChatMessage } from './base';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey || '');
    this.model = config.model;
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    const model = this.client.getGenerativeModel({ model: this.model });
    
    // Convert messages to Gemini format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  }

  getName(): string {
    return 'gemini';
  }

  isAvailable(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }
}
