import * as googleTTS from 'google-tts-api';
import fs from 'fs';

async function test() {
  try {
    const results = await googleTTS.getAllAudioBase64('Hello, this is a test of the Google Text to Speech API.', {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?',
    });
    
    const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
    const finalBuffer = Buffer.concat(buffers);
    
    fs.writeFileSync('test-tts.mp3', finalBuffer);
    console.log('Success, wrote to test-tts.mp3. Length:', finalBuffer.length);
  } catch (e) {
    console.error('Failed:', e);
  }
}

test();
