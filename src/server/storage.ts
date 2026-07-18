import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface AudioObjectStore {
  put(key: string, fileBuffer: Buffer, mimeType: string): Promise<void>;
  getSignedReadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<Buffer>;
}

// Config variables for object storage
const s3Bucket = process.env.S3_BUCKET || '';
const s3Endpoint = process.env.S3_ENDPOINT || '';
const s3Region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
const s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
const s3Ttl = Number(process.env.S3_SIGNED_URL_TTL_SECONDS || '900'); // 15 mins
const s3Prefix = process.env.S3_AUDIO_PREFIX || 'audio/';

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

export class LocalDiskStore implements AudioObjectStore {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async put(key: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, key);
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, fileBuffer);
  }

  async getSignedReadUrl(key: string): Promise<string> {
    // Return relative URL for local serving
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async get(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadsDir, key);
    return await fs.promises.readFile(filePath);
  }
}

export class S3ObjectStore implements AudioObjectStore {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = s3Bucket;
    const clientConfig: any = {
      region: s3Region,
    };

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    if (s3Endpoint) {
      clientConfig.endpoint = s3Endpoint;
    }

    if (s3ForcePathStyle) {
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);
  }

  async put(key: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    const fullKey = `${s3Prefix}${key}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    await this.client.send(command);
  }

  async getSignedReadUrl(key: string): Promise<string> {
    const fullKey = `${s3Prefix}${key}`;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
    });
    return await getSignedUrl(this.client, command, { expiresIn: s3Ttl });
  }

  async delete(key: string): Promise<void> {
    const fullKey = `${s3Prefix}${key}`;
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
    });
    await this.client.send(command);
  }

  async get(key: string): Promise<Buffer> {
    const fullKey = `${s3Prefix}${key}`;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
    });
    const result = await this.client.send(command);
    if (!result.Body) {
      throw new Error(`S3 Object has no Body: ${fullKey}`);
    }
    const byteArrays = await result.Body.transformToByteArray();
    return Buffer.from(byteArrays);
  }
}

export function getAudioStore(): AudioObjectStore {
  if (process.env.NODE_ENV === 'production' && s3Bucket) {
    return new S3ObjectStore();
  }
  return new LocalDiskStore();
}
