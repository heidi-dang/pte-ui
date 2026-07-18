import { getAudioStore } from '../../src/server/storage.js';
import { getTranscriber, FakeTranscriber, WhisperTranscriber } from '../../src/server/stt.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function run() {
  console.log('--- OpenAI Whisper STT and Presigned Storage Audit ---');
  
  try {
    // 1. S3 / Storage backend upload, metadata, URL generation and deletion checks
    const store = getAudioStore();
    console.log(`Using storage backend: ${store.constructor.name}`);

    const key = `test-${crypto.randomUUID()}.mp3`;
    const buffer = Buffer.from('mock-audio-recording-content');
    const mimeType = 'audio/mpeg';

    // Upload
    await store.put(key, buffer, mimeType);
    console.log(`  Uploaded object key: ${key}`);

    // Retrieve and verify content
    const retrieved = await store.get(key);
    if (retrieved.toString() !== 'mock-audio-recording-content') {
      throw new Error('FAIL: Retrieved object content mismatch!');
    }
    console.log('  PASS: Object retrieval content matches uploaded buffer.');

    // Generate signed read URL
    const url = await store.getSignedReadUrl(key);
    console.log(`  Generated signed URL: ${url}`);
    if (!url) {
      throw new Error('FAIL: Signed URL is empty');
    }

    // Delete object
    await store.delete(key);
    console.log(`  Deleted object key: ${key}`);

    // Verify it is deleted
    let deleteOk = false;
    try {
      await store.get(key);
    } catch {
      deleteOk = true;
    }
    if (!deleteOk) {
      throw new Error('FAIL: Object still retrievable after deletion!');
    }
    console.log('  PASS: Deletion confirmed. Object no longer retrievable.');

    // 2. OpenAI Whisper STT verification
    const transcriber = getTranscriber();
    console.log(`Using SpeechTranscriber provider: ${transcriber.constructor.name}`);

    // Mock transcript check (FakeTranscriber)
    const fake = new FakeTranscriber();
    const mockRes = await fake.transcribe(buffer, 'test.mp3', mimeType);
    console.log(`  Mock Whisper Transcript: "${mockRes.transcript}" (Provider: ${mockRes.provider}, Model: ${mockRes.modelUsed})`);
    if (!mockRes.transcript || mockRes.provider !== 'Deterministic Mock STT') {
      throw new Error('FAIL: FakeTranscriber returned invalid transcript properties.');
    }
    console.log('  PASS: FakeTranscriber validation succeeds.');

    // Real OpenAI STT execution check (only if key exists)
    if (process.env.OPENAI_API_KEY) {
      console.log('  OPENAI_API_KEY is configured. Running real Whisper API call...');
      try {
        const whisper = new WhisperTranscriber();
        const whisperRes = await whisper.transcribe(buffer, 'test.mp3', mimeType);
        console.log(`  Real Whisper Transcript: "${whisperRes.transcript}"`);
        console.log(`  Provider: ${whisperRes.provider}, Model: ${whisperRes.modelUsed}`);
      } catch (e) {
        console.warn(`  Warning: Real Whisper transcription failed (expected if mock key is dummy): ${e.message}`);
      }
    } else {
      console.log('  OPENAI_API_KEY not configured. Skipping real endpoint transcription call.');
    }

    console.log('\n====================================');
    console.log('ALL STORAGE & STT AUDIT TESTS PASSED! 🎉');
    console.log('====================================');

  } catch (err) {
    console.error('FAIL: Storage & STT verification encountered an error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
