import { AIProvider, AIProviderConfig, ChatMessage } from './base';

export class OllamaProvider implements AIProvider {
  private baseURL: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.baseURL = config.baseURL || 'http://localhost:11434';
    this.model = config.model;
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json() as { message?: { content?: string } };
    return data.message?.content || '';
  }

  getName(): string {
    return 'ollama';
  }

  isAvailable(): boolean {
    // Ollama is local, no API key needed
    return true;
  }
}
