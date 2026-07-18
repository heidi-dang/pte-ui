export interface AiTextRequest {
  systemPrompt: string;
  prompt: string;
  temperature?: number;
}

export interface AiStructuredRequest<T> extends AiTextRequest {
  schema: any;
}

export interface AiCompletionResult {
  provider: 'deepseek' | 'fake';
  model: string;
  content: string;
  finishReason: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  requestId: string | null;
}

export interface AiStructuredResult<T> {
  provider: 'deepseek' | 'fake';
  model: string;
  data: T;
  finishReason: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  requestId: string | null;
}

export interface AiProvider {
  generateText(request: AiTextRequest): Promise<AiCompletionResult>;
  generateStructured<T>(request: AiStructuredRequest<T>): Promise<AiStructuredResult<T>>;
}
