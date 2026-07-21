import { getTtsProvider } from '../src/server/tts/provider';
import fs from 'fs';

async function verify() {
  try {
    const provider = getTtsProvider();
    console.log('Provider instance:', provider.constructor.name);
    
    const audioRes = await provider.generateAudio('This is a verification test from the codebase.');
    console.log('Result MIME Type:', audioRes.mimeType);
    console.log('Buffer length:', audioRes.audioBuffer.length);
    
    fs.writeFileSync('scripts/verification-test.mp3', audioRes.audioBuffer);
    console.log('Successfully wrote verification audio.');
  } catch(e) {
    console.error('Verification failed:', e);
  }
}

verify();
