export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no-answer';

export interface CallRecording {
  id: string;
  callId: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  duration: number;
  format: 'wav' | 'mp3';
  status: 'recording' | 'completed' | 'processing' | 'failed';
  transcription?: Transcription;
  createdAt: number;
  updatedAt: number;
}

export interface Transcription {
  id: string;
  recordingId: string;
  text: string;
  language: string;
  confidence: number;
  segments: TranscriptionSegment[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'whisper' | 'whisper-local' | 'assemblyai' | 'deepgram' | 'openai';
  createdAt: number;
  updatedAt: number;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence: number;
}

export interface Call {
  id: string;
  campaignId?: string;
  agentId: string;
  leadId?: string;
  phoneNumber: string;
  direction: CallDirection;
  status: CallStatus;
  startTime: number;
  answerTime?: number;
  endTime?: number;
  duration?: number;
  disposition?: string;
  notes?: string;
  recording?: CallRecording;
  sipCallId?: string;
  gatewayId?: string;
  createdAt: number;
  updatedAt: number;
}