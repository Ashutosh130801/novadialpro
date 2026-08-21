import { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { pipeline } from 'stream/promises';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CallRecording, Transcription } from '../models/call.model';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  provider: 'local' | 's3';
  localPath?: string;
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}

export class RecordingStorage {
  private config: StorageConfig;
  private s3Client?: S3Client;

  constructor(config: StorageConfig) {
    this.config = config;
    
    if (config.provider === 's3' && config.s3) {
      this.s3Client = new S3Client({
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
        endpoint: config.s3.endpoint,
      });
    } else {
      const basePath = config.localPath || join(process.cwd(), 'recordings');
      this.config.localPath = basePath;
      if (!existsSync(basePath)) {
        mkdirSync(basePath, { recursive: true });
      }
    }
  }

  async saveRecording(
    callId: string,
    audioStream: NodeJS.ReadableStream,
    format: 'wav' | 'mp3' = 'wav'
  ): Promise<CallRecording> {
    const recordingId = uuidv4();
    const filename = `${callId}_${recordingId}.${format}`;
    
    if (this.config.provider === 's3') {
      return this.saveToS3(recordingId, callId, filename, audioStream, format);
    }
    return this.saveLocal(recordingId, callId, filename, audioStream, format);
  }

  private async saveLocal(
    recordingId: string,
    callId: string,
    filename: string,
    audioStream: NodeJS.ReadableStream,
    format: 'wav' | 'mp3'
  ): Promise<CallRecording> {
    const filepath = join(this.config.localPath!, filename);
    const writeStream = createWriteStream(filepath);
    
    await pipeline(audioStream, writeStream);
    
    const stats = statSync(filepath);
    
    return {
      id: recordingId,
      callId,
      filename,
      path: filepath,
      url: `/api/recordings/${filename}`,
      size: stats.size,
      duration: 0,
      format,
      status: 'completed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  private async saveToS3(
    recordingId: string,
    callId: string,
    filename: string,
    audioStream: NodeJS.ReadableStream,
    format: 'wav' | 'mp3'
  ): Promise<CallRecording> {
    const key = `recordings/${callId}/${filename}`;
    
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    
    await (this.s3Client as any).send(new PutObjectCommand({
      Bucket: this.config.s3!.bucket,
      Key: key,
      Body: buffer,
      ContentType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
    }));

    const url = await getSignedUrl(this.s3Client as any, new GetObjectCommand({
      Bucket: this.config.s3!.bucket,
      Key: key,
    }), { expiresIn: 3600 });

    return {
      id: recordingId,
      callId,
      filename,
      path: key,
      url,
      size: buffer.length,
      duration: 0,
      format,
      status: 'completed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async getRecordingUrl(recordingId: string, recording: CallRecording): Promise<string> {
    if (this.config.provider === 's3') {
      return getSignedUrl(this.s3Client!, new GetObjectCommand({
        Bucket: this.config.s3!.bucket,
        Key: recording.path,
      }), { expiresIn: 3600 });
    }
    return `/api/recordings/${recording.filename}`;
  }

  async streamRecording(recording: CallRecording): Promise<NodeJS.ReadableStream> {
    if (this.config.provider === 's3') {
      const response = await (this.s3Client as any).send(new GetObjectCommand({
        Bucket: this.config.s3!.bucket,
        Key: recording.path,
      }));
      return response.Body as NodeJS.ReadableStream;
    }
    return createReadStream(recording.path);
  }

  async deleteRecording(recording: CallRecording): Promise<void> {
    if (this.config.provider === 's3') {
      await (this.s3Client as any).send(new DeleteObjectCommand({
        Bucket: this.config.s3!.bucket,
        Key: recording.path,
      }));
    } else {
      if (existsSync(recording.path)) {
        unlinkSync(recording.path);
      }
    }
  }

  async updateRecording(recording: Partial<CallRecording> & { id: string }): Promise<void> {
    // In production, persist to database
    // This is a placeholder for DB update
  }
}

export const recordingStorage = new RecordingStorage({
  provider: (process.env.RECORDING_STORAGE as 'local' | 's3') || 'local',
  localPath: process.env.RECORDING_LOCAL_PATH,
  s3: process.env.RECORDING_S3_BUCKET ? {
    bucket: process.env.RECORDING_S3_BUCKET,
    region: process.env.RECORDING_S3_REGION || 'us-east-1',
    accessKeyId: process.env.RECORDING_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.RECORDING_S3_SECRET_KEY || '',
    endpoint: process.env.RECORDING_S3_ENDPOINT,
  } : undefined,
});