import { AiProvider, AiTextRequest, AiStructuredRequest, AiCompletionResult, AiStructuredResult } from './types';
import { logger } from '../logger';
import crypto from 'crypto';

export class DeepSeekProvider implements AiProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;
  private maxAttempts: number;
  private retryBaseMs: number;
  private retryMaxMs: number;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    this.timeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS || '120000');
    this.maxAttempts = Number(process.env.DEEPSEEK_MAX_ATTEMPTS || '3');
    this.retryBaseMs = Number(process.env.DEEPSEEK_RETRY_BASE_MS || '1000');
    this.retryMaxMs = Number(process.env.DEEPSEEK_RETRY_MAX_MS || '5000');

    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }
  }

  private isTransientError(status: number): boolean {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  private async callRaw(
    systemPrompt: string,
    prompt: string,
    temperature = 0.2,
    responseFormat?: any
  ): Promise<{ content: string; usage: any; requestId: string }> {
    const requestId = crypto.randomUUID();
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'X-Request-ID': requestId,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature,
            response_format: responseFormat || undefined,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const errText = await response.text();
          logger.warn(`DeepSeek request ${requestId} attempt ${attempt} failed with status ${status}: ${errText}`);

          if (this.isTransientError(status) && attempt < this.maxAttempts) {
            const backoff = Math.min(this.retryMaxMs, this.retryBaseMs * Math.pow(2, attempt));
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
          throw new Error(`DeepSeek API responded with ${status}: ${errText}`);
        }

        const data: any = await response.json();
        const content = data.choices[0].message.content || '';
        const usage = data.usage || {};

        return { content, usage, requestId };
      } catch (err: any) {
        clearTimeout(timeoutId);
        logger.error(`Error on DeepSeek call ${requestId} (attempt ${attempt}/${this.maxAttempts}): ${err.message}`);
        
        if (attempt >= this.maxAttempts) {
          throw err;
        }
        const backoff = Math.min(this.retryMaxMs, this.retryBaseMs * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
    throw new Error('DeepSeek call failed after all retries');
  }

  async generateText(request: AiTextRequest): Promise<AiCompletionResult> {
    const { content, usage, requestId } = await this.callRaw(
      request.systemPrompt,
      request.prompt,
      request.temperature
    );

    return {
      provider: 'deepseek',
      model: this.model,
      content,
      finishReason: 'stop',
      promptTokens: usage.prompt_tokens || null,
      completionTokens: usage.completion_tokens || null,
      totalTokens: usage.total_tokens || null,
      requestId,
    };
  }

  async generateStructured<T>(request: AiStructuredRequest<T>): Promise<AiStructuredResult<T>> {
    const { content, usage, requestId } = await this.callRaw(
      request.systemPrompt,
      request.prompt,
      request.temperature,
      { type: 'json_object' }
    );

    let parsed: any;
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      throw new Error(`DeepSeek returned invalid JSON: ${cleanContent}`);
    }

    // Validate using Zod schema if available
    if (request.schema) {
      const result = request.schema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`DeepSeek response failed schema validation: ${result.error.message}`);
      }
      parsed = result.data;
    }

    return {
      provider: 'deepseek',
      model: this.model,
      data: parsed,
      finishReason: 'stop',
      promptTokens: usage.prompt_tokens || null,
      completionTokens: usage.completion_tokens || null,
      totalTokens: usage.total_tokens || null,
      requestId,
    };
  }
}
