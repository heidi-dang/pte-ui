#!/usr/bin/env node
// Generates a minimal valid WAV file for test audio uploads
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal WAV: 44-byte header, 1 second of silence (mono, 8000Hz, 8-bit)
const sampleRate = 8000;
const bitsPerSample = 8;
const numChannels = 1;
const dataSize = sampleRate * numChannels * (bitsPerSample / 8);
const fileSize = 44 + dataSize;

const buf = Buffer.alloc(44 + dataSize);
let offset = 0;

const writeStr = (s) => { buf.write(s, offset); offset += s.length; };
const writeU32 = (v) => { buf.writeUInt32LE(v, offset); offset += 4; };
const writeU16 = (v) => { buf.writeUInt16LE(v, offset); offset += 2; };

// RIFF header
writeStr('RIFF');
writeU32(fileSize - 8);
writeStr('WAVE');

// fmt chunk
writeStr('fmt ');
writeU32(16);        // chunk size
writeU16(1);         // PCM
writeU16(numChannels);
writeU32(sampleRate);
writeU32(sampleRate * numChannels * (bitsPerSample / 8)); // byte rate
writeU16(numChannels * (bitsPerSample / 8)); // block align
writeU16(bitsPerSample);

// data chunk
writeStr('data');
writeU32(dataSize);
// Fill with silence (128 for 8-bit unsigned)
for (let i = 0; i < dataSize; i++) {
  buf[offset++] = 128;
}

const outPath = join(__dirname, 'sample.wav');
writeFileSync(outPath, buf);
console.log(`Generated ${outPath} (${buf.length} bytes)`);
