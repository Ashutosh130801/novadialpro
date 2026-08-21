import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { Call, CallRecording, Transcription, CallStatus, CallDirection } from '../models/call.model';
import { recordingStorage } from '../services/recording.storage';
import { transcriptionService } from '../services/transcription.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const calls: Map<string, Call> = new Map();
const upload = multer({ storage: multer.memoryStorage() });

function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function findCall(callId: string): Call | undefined {
  return calls.get(callId);
}

function saveCall(call: Call): void {
  calls.set(call.id, call);
}

router.get('/history', (req: Request, res: Response) => {
  const { agentId, campaignId, status, limit = '50', offset = '0' } = req.query;
  
  let filtered = Array.from(calls.values());
  
  if (agentId) filtered = filtered.filter(c => c.agentId === agentId);
  if (campaignId) filtered = filtered.filter(c => c.campaignId === campaignId);
  if (status) filtered = filtered.filter(c => c.status === status);
  
  filtered.sort((a, b) => b.startTime - a.startTime);
  
  const start = parseInt(offset as string);
  const end = start + parseInt(limit as string);
  
  res.json({
    calls: filtered.slice(start, end),
    total: filtered.length,
    limit: parseInt(limit as string),
    offset: start,
  });
});

router.post('/outbound', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, agentId, campaignId, leadId } = req.body;
    
    if (!phoneNumber || !agentId) {
      return res.status(400).json({ error: 'phoneNumber and agentId required' });
    }

    const call: Call = {
      id: generateCallId(),
      campaignId,
      agentId,
      leadId,
      phoneNumber,
      direction: 'outbound',
      status: 'initiated',
      startTime: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveCall(call);
    
    res.status(201).json({ success: true, call });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

router.post('/:callId/answer', (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call) return res.status(404).json({ error: 'Call not found' });

  call.status = 'answered';
  call.answerTime = Date.now();
  call.updatedAt = Date.now();
  saveCall(call);

  res.json({ success: true, call });
});

router.post('/:callId/end', (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call) return res.status(404).json({ error: 'Call not found' });

  const { disposition, notes } = req.body;

  call.status = 'completed';
  call.endTime = Date.now();
  call.duration = call.answerTime 
    ? Math.floor((call.endTime - call.answerTime) / 1000)
    : Math.floor((call.endTime - call.startTime) / 1000);
  call.disposition = disposition;
  call.notes = notes;
  call.updatedAt = Date.now();
  saveCall(call);

  if (call.recording) {
    transcriptionService.transcribe(call.recording).then(transcription => {
      call.recording!.transcription = transcription;
      saveCall(call);
    }).catch(err => {
      console.error('Transcription failed:', err);
    });
  }

  res.json({ success: true, call });
});

router.post('/:callId/recording', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const call = findCall(req.params.callId);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    const format = (req.body.format as 'wav' | 'mp3') || 'wav';
    const audioStream = new Readable();
    audioStream.push(req.file.buffer);
    audioStream.push(null);

    const recording = await recordingStorage.saveRecording(call.id, audioStream, format);
    
    call.recording = recording;
    call.updatedAt = Date.now();
    saveCall(call);

    transcriptionService.transcribe(recording).then(transcription => {
      recording.transcription = transcription;
      saveCall(call);
    }).catch(err => console.error('Transcription failed:', err));

    res.json({ success: true, recording });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save recording' });
  }
});

router.get('/:callId/recording', async (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call || !call.recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  try {
    const url = await recordingStorage.getRecordingUrl(call.recording.id, call.recording);
    res.json({ 
      url,
      recording: call.recording,
      transcription: call.recording.transcription,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recording URL' });
  }
});

router.get('/:callId/recording/stream', async (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call || !call.recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  try {
    const stream = await recordingStorage.streamRecording(call.recording);
    
    res.setHeader('Content-Type', call.recording.format === 'wav' ? 'audio/wav' : 'audio/mpeg');
    res.setHeader('Content-Length', call.recording.size);
    res.setHeader('Accept-Ranges', 'bytes');
    
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to stream recording' });
  }
});

router.get('/:callId/transcription', (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call || !call.recording?.transcription) {
    return res.status(404).json({ error: 'Transcription not found' });
  }

  res.json(call.recording.transcription);
});

router.post('/:callId/transcription/reprocess', async (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call || !call.recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  try {
    const transcription = await transcriptionService.transcribe(call.recording);
    call.recording.transcription = transcription;
    call.updatedAt = Date.now();
    saveCall(call);

    res.json({ success: true, transcription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reprocess transcription' });
  }
});

router.delete('/:callId/recording', async (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call || !call.recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  try {
    await recordingStorage.deleteRecording(call.recording);
    call.recording = undefined;
    call.updatedAt = Date.now();
    saveCall(call);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

router.get('/:callId', (req: Request, res: Response) => {
  const call = findCall(req.params.callId);
  if (!call) return res.status(404).json({ error: 'Call not found' });

  res.json(call);
});

export default router;