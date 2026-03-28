export interface AIProviderConfig {
  apiKey?: string;
  model: string;
  baseURL?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  think?: boolean;
}

export interface GenerateResult {
  content: string;
  thinking?: string;
}

export interface AIProvider {
  generate(messages: ChatMessage[], options?: GenerateOptions): Promise<string | GenerateResult>;
  getName(): string;
  isAvailable(): boolean;
}
