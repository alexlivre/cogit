export interface AIProviderConfig {
  apiKey?: string;
  model: string;
  baseURL?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  generate(messages: ChatMessage[]): Promise<string>;
  getName(): string;
  isAvailable(): boolean;
}
