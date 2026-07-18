export interface TtsGenerateOptions {
  voice?: string;
  speed?: number;
}

export interface TtsResult {
  audioBuffer: Buffer;
  mimeType: string;
  durationMs: number;
}

export interface TtsProvider {
  generateAudio(text: string, options?: TtsGenerateOptions): Promise<TtsResult>;
}
