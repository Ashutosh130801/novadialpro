import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { Transcription, TranscriptionSegment, CallRecording } from '../models/call.model';
import { v4 as uuidv4 } from 'uuid';

export interface TranscriptionConfig {
  provider: 'whisper-local' | 'assemblyai' | 'deepgram' | 'openai';
  whisperPath?: string;
  modelSize?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language?: string;
  apiKey?: string;
  apiUrl?: string;
}

export class TranscriptionService {
  private config: TranscriptionConfig;

  constructor(config: TranscriptionConfig) {
    this.config = {
      provider: config.provider || 'whisper-local',
      whisperPath: config.whisperPath || process.env.WHISPER_PATH || 'whisper',
      modelSize: config.modelSize || 'base',
      language: config.language || 'en',
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
    };
  }

  async transcribe(recording: CallRecording): Promise<Transcription> {
    const transcriptionId = uuidv4();
    
    const baseTranscription: Omit<Transcription, 'id' | 'createdAt' | 'updatedAt'> = {
      recordingId: recording.id,
      text: '',
      language: this.config.language || 'en',
      confidence: 0,
      segments: [],
      status: 'processing',
      provider: this.config.provider,
    };

    try {
      let result: { text: string; segments: TranscriptionSegment[]; confidence: number };

      switch (this.config.provider) {
        case 'whisper-local':
          result = await this.transcribeWithWhisperLocal(recording);
          break;
        case 'assemblyai':
          result = await this.transcribeWithAssemblyAI(recording);
          break;
        case 'deepgram':
          result = await this.transcribeWithDeepgram(recording);
          break;
        case 'openai':
          result = await this.transcribeWithOpenAI(recording);
          break;
        default:
          throw new Error(`Unknown transcription provider: ${this.config.provider}`);
      }

      return {
        ...baseTranscription,
        id: transcriptionId,
        text: result.text,
        segments: result.segments,
        confidence: result.confidence,
        status: 'completed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } catch (error) {
      return {
        ...baseTranscription,
        id: transcriptionId,
        status: 'failed',
        text: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
  }

  private async transcribeWithWhisperLocal(recording: CallRecording): Promise<{
    text: string;
    segments: TranscriptionSegment[];
    confidence: number;
  }> {
    const tempDir = join(process.cwd(), 'tmp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const inputPath = join(tempDir, `input_${recording.id}.${recording.format}`);
    const outputPath = join(tempDir, `output_${recording.id}`);

    return new Promise((resolve, reject) => {
      const whisperArgs = [
        '-m', join(this.config.whisperPath || '', `models/ggml-${this.config.modelSize}.bin`),
        '-f', inputPath,
        '-otxt',
        '-of', outputPath,
        '-l', this.config.language || 'auto',
      ];

      const proc = spawn(this.config.whisperPath || 'whisper', whisperArgs);

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Whisper exited with code ${code}`));
          return;
        }

        try {
          const outputFile = `${outputPath}.txt`;
          if (existsSync(outputFile)) {
            const text = readFileSync(outputFile, 'utf-8').trim();
            unlinkSync(inputPath);
            unlinkSync(outputFile);
            
            const segments = this.parseWhisperOutput(text);
            resolve({
              text,
              segments,
              confidence: 0.9,
            });
          } else {
            reject(new Error('Whisper output file not found'));
          }
        } catch (err) {
          reject(err);
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  private async transcribeWithAssemblyAI(recording: CallRecording): Promise<{
    text: string;
    segments: TranscriptionSegment[];
    confidence: number;
  }> {
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiKey || process.env.ASSEMBLYAI_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: recording.url,
        language_code: this.config.language || 'en',
        speaker_labels: true,
        punctuate: true,
        format_text: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI error: ${response.statusText}`);
    }

    const { id: transcriptId } = await response.json() as { id: string };
    
    let status = 'queued';
    let transcript: any = null;
    
    while (status !== 'completed' && status !== 'error') {
      await new Promise(r => setTimeout(r, 3000));
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'Authorization': this.config.apiKey || process.env.ASSEMBLYAI_API_KEY || '' },
      });
      transcript = await pollResponse.json() as any;
      status = transcript.status;
    }

    if (status === 'error') {
      throw new Error(transcript.error || 'AssemblyAI transcription failed');
    }

    return {
      text: transcript.text,
      segments: transcript.words?.map((w: any) => ({
        id: uuidv4(),
        start: w.start / 1000,
        end: w.end / 1000,
        text: w.text,
        speaker: w.speaker,
        confidence: w.confidence,
      })) || [],
      confidence: transcript.confidence || 0.95,
    };
  }

  private async transcribeWithDeepgram(recording: CallRecording): Promise<{
    text: string;
    segments: TranscriptionSegment[];
    confidence: number;
  }> {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&utterances=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.config.apiKey || process.env.DEEPGRAM_API_KEY || ''}`,
        'Content-Type': 'audio/*',
      },
      body: recording.url.startsWith('http') 
        ? await (await fetch(recording.url)).arrayBuffer()
        : null,
    });

    if (!response.ok) {
      throw new Error(`Deepgram error: ${response.statusText}`);
    }

    const result = await response.json() as any;
    const utterances = result.results?.utterances || [];
    
    return {
      text: result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '',
      segments: utterances.map((u: any) => ({
        id: uuidv4(),
        start: u.start,
        end: u.end,
        text: u.transcript,
        speaker: u.speaker,
        confidence: u.confidence,
      })),
      confidence: result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.95,
    };
  }

  private async transcribeWithOpenAI(recording: CallRecording): Promise<{
    text: string;
    segments: TranscriptionSegment[];
    confidence: number;
  }> {
    const formData = new FormData();
    formData.append('file', await fetch(recording.url).then(r => r.blob()), `recording.${recording.format}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('language', this.config.language || 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || process.env.OPENAI_API_KEY || ''}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.statusText}`);
    }

    const result = await response.json() as any;
    
    return {
      text: result.text,
      segments: result.segments?.map((s: any) => ({
        id: uuidv4(),
        start: s.start,
        end: s.end,
        text: s.text,
        confidence: s.avg_logprob ? Math.exp(s.avg_logprob) : 0.9,
      })) || [],
      confidence: 0.95,
    };
  }

  private parseWhisperOutput(text: string): TranscriptionSegment[] {
    const segments: TranscriptionSegment[] = [];
    const lines = text.split('\n').filter(l => l.trim());
    
    let segmentId = 0;
    for (const line of lines) {
      const match = line.match(/\[(\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}\.\d{3})\]\s*(.+)/);
      if (match) {
        const start = this.timeToSeconds(match[1]);
        const end = this.timeToSeconds(match[2]);
        segments.push({
          id: uuidv4(),
          start,
          end,
          text: match[3].trim(),
          confidence: 0.9,
        });
        segmentId++;
      }
    }
    
    return segments.length > 0 ? segments : [{
      id: uuidv4(),
      start: 0,
      end: 0,
      text,
      confidence: 0.9,
    }];
  }

  private timeToSeconds(time: string): number {
    const [minutes, seconds] = time.split(':');
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }
}

export const transcriptionService = new TranscriptionService({
  provider: (process.env.TRANSCRIPTION_PROVIDER as any) || 'whisper-local',
  whisperPath: process.env.WHISPER_PATH,
  modelSize: (process.env.WHISPER_MODEL as any) || 'base',
  language: process.env.TRANSCRIPTION_LANGUAGE || 'en',
  apiKey: process.env.TRANSCRIPTION_API_KEY,
  apiUrl: process.env.TRANSCRIPTION_API_URL,
});