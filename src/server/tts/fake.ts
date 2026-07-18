import { TtsProvider, TtsResult, TtsGenerateOptions } from './types';

export class FakeTtsProvider implements TtsProvider {
  async generateAudio(text: string, options?: TtsGenerateOptions): Promise<TtsResult> {
    // Generate 1 second of silence as a fake wave file
    const numSamples = 44100;
    const blockAlign = 2; // 1 channel * 16 bits
    const byteRate = 44100 * blockAlign;
    const dataSize = numSamples * blockAlign;
    const buffer = Buffer.alloc(44 + dataSize);
    
    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    
    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels
    buffer.writeUInt32LE(44100, 24); // SampleRate
    buffer.writeUInt32LE(byteRate, 28); // ByteRate
    buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    
    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    return {
      audioBuffer: buffer,
      mimeType: 'audio/wav',
      durationMs: 1000
    };
  }
}
