import { AIProvider, AIProviderConfig, ChatMessage, GenerateOptions, GenerateResult } from './base';

export class OllamaProvider implements AIProvider {
  private baseURL: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.baseURL = config.baseURL || process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = config.model;
  }

  async generate(messages: ChatMessage[], options?: GenerateOptions): Promise<string | GenerateResult> {
    const { think = false } = options || {};
    
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
        think: think,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 404 && errorText.includes('model')) {
        throw new Error(
          `Ollama model '${this.model}' not found. ` +
          `Run 'ollama pull ${this.model}' to download it.`
        );
      }
      
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { 
      message?: { 
        content?: string;
        thinking?: string;
      } 
    };
    
    const result: GenerateResult = {
      content: data.message?.content || '',
    };
    
    // Only include thinking if it exists and think was enabled
    if (think && data.message?.thinking) {
      result.thinking = data.message.thinking;
    }
    
    return result;
  }

  getName(): string {
    return 'ollama';
  }

  isAvailable(): boolean {
    return true;
  }

  async checkConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.baseURL}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        return { 
          available: false, 
          error: `Ollama server returned ${response.status}` 
        };
      }
      
      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];
      const modelInstalled = models.some(m => m.name === this.model || m.name.startsWith(this.model));
      
      if (!modelInstalled) {
        return { 
          available: true, 
          error: `Model '${this.model}' not installed. Run 'ollama pull ${this.model}'` 
        };
      }
      
      return { available: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { 
          available: false, 
          error: 'Connection timeout - Ollama not responding' 
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        return { 
          available: false, 
          error: 'Ollama not running - start it with `ollama serve`' 
        };
      }
      
      return { 
        available: false, 
        error: `Connection error: ${errorMessage}` 
      };
    }
  }
}
