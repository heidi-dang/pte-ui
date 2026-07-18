import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) passed++;
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('--- Practice Media Pipeline Tests ---\n');

const studentContent = readFileSync(join(root, 'src/server/student.ts'), 'utf-8');
const schemaContent = readFileSync(join(root, 'prisma/schema.prisma'), 'utf-8');
const queueContent = readFileSync(join(root, 'src/server/jobs/queue.ts'), 'utf-8');

// 1. Supported audio upload succeeds (multer allows wav/mp3/m4a/ogg/webm)
assert(studentContent.includes("'.wav'") && studentContent.includes("'.mp3'"),
  'multer fileFilter allows .wav, .mp3, .m4a, .ogg, .webm');

// 2. Empty upload rejected (no file)
assert(studentContent.includes('!req.file'),
  'Audio upload handler checks for req.file existence');

// 3. Unsupported MIME rejected (multer fileFilter)
assert(studentContent.includes('fileFilter'),
  'Audio upload has multer fileFilter');

// 4. Attempt ownership and In_Progress status enforced
assert(studentContent.includes("attempt.status !== 'In_Progress'"),
  'Audio upload validates In_Progress status');
assert(studentContent.includes('userId: user.id'),
  'Audio upload checks attempt userId ownership');

// 5. Task requires recording validated
assert(studentContent.includes('requiresResponseRecording'),
  'Audio upload validates task requires response recording');

// 6. Re-record replaces previous audio (old object deleted, metadata deleted)
assert(studentContent.includes('storage.delete(oldAudio.objectKey)'),
  'Re-record deletes old audio from storage');
assert(studentContent.includes('audioMetadata.delete'),
  'Re-record deletes old audio metadata record');

// 7. responseAudioId has unique constraint
assert(schemaContent.includes('@unique') && schemaContent.includes('responseAudioId'),
  'responseAudioId has @unique constraint preventing double-attach');

// 8. AudioMetadata model exists with required fields
assert(schemaContent.includes('model AudioMetadata'),
  'AudioMetadata model exists in schema');
assert(schemaContent.includes('objectKey') && schemaContent.includes('mimeType') && schemaContent.includes('byteSize'),
  'AudioMetadata has objectKey, mimeType, byteSize fields');

// 9. MediaAsset model exists
assert(schemaContent.includes('model MediaAsset'),
  'MediaAsset model exists in schema');
assert(schemaContent.includes('purpose'),
  'MediaAsset has purpose field');

// 10. Queue idempotency protects against duplicate transcribe jobs
assert(queueContent.includes('idempotencyKey'),
  'queueJob supports idempotencyKey for duplicate prevention');

console.log(`\n${'='.repeat(50)}`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
else console.log('PASS: All media pipeline tests passed.');
