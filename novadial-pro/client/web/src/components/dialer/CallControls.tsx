import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { callStart, callEnded, callMute, callHold, callTransfer, callConference } from '../../store/slices/callSlice';
import { Button, Avatar, Badge } from '../common/Button';
import { updateLeadStatus } from '../../store/slices/campaignSlice';

interface WaveformProps {
  isSpeaking: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ isSpeaking }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full bg-gradient-to-t from-violet-500 to-cyan-500 transition-all duration-75 ${
            isSpeaking ? 'animate-pulse' : ''
          }`}
          style={{
            height: isSpeaking ? `${Math.random() * 100}%` : '20%',
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};

export const CallControls: React.FC = () => {
  const dispatch = useDispatch();
  const { currentCall, status, isMuted, isOnHold, callQuality } = useSelector((state: RootState) => state.call);
  const { currentLead } = useSelector((state: RootState) => state.campaign);
  
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'active' && currentCall?.startTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - (currentCall.startTime || 0)) / 1000));
      }, 1000);
      
      // Simulate speaking detection
      const speakInterval = setInterval(() => {
        setIsSpeaking(prev => !prev);
      }, 500);
      
      return () => {
        clearInterval(interval);
        clearInterval(speakInterval);
      };
    }
    return () => clearInterval(interval);
  }, [status, currentCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    dispatch(callEnded());
    setCallDuration(0);
  };

  const dispositionCodes = ['Interested', 'Callback', 'Not Interested', 'DNC', 'Voicemail', 'Wrong Number'];

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="glass-card p-6">
      {/* Call Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar 
            name={currentLead ? `${currentLead.firstName} ${currentLead.lastName}` : 'Unknown'} 
            size="lg"
          />
          <div>
            <h3 className="text-xl font-bold">
              {currentLead ? `${currentLead.firstName} ${currentLead.lastName}` : currentCall?.participant?.name || 'Unknown'}
            </h3>
            <p className="text-gray-400">{currentLead?.phone || currentCall?.participant?.number}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">{formatDuration(callDuration)}</p>
          <Badge variant={callQuality === 'excellent' ? 'success' : callQuality === 'good' ? 'info' : 'warning'}>
            MOS: {callQuality === 'excellent' ? '4.5+' : callQuality === 'good' ? '4.0-4.4' : '3.5-3.9'}
          </Badge>
        </div>
      </div>

      {/* Waveform */}
      <Waveform isSpeaking={isSpeaking} />

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 my-8">
        <Button
          variant={isMuted ? 'danger' : 'secondary'}
          size="lg"
          onClick={() => dispatch(callMute())}
          className="w-16 h-16 rounded-full"
        >
          {isMuted ? '🔇' : '🎤'}
        </Button>
        
        <Button
          variant={isOnHold ? 'warning' : 'secondary'}
          size="lg"
          onClick={() => dispatch(callHold())}
          className="w-16 h-16 rounded-full"
        >
          ⏸️
        </Button>
        
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setShowKeypad(!showKeypad)}
          className="w-16 h-16 rounded-full"
        >
          ⌨️
        </Button>
        
        <Button
          variant="secondary"
          size="lg"
          onClick={() => dispatch(callTransfer())}
          className="w-16 h-16 rounded-full"
        >
          ➡️
        </Button>
        
        <Button
          variant="secondary"
          size="lg"
          onClick={() => dispatch(callConference())}
          className="w-16 h-16 rounded-full"
        >
          👥
        </Button>
        
        <Button variant="danger" size="lg" onClick={handleEndCall} className="w-16 h-16 rounded-full">
          📴
        </Button>
      </div>

      {/* Keypad */}
      {showKeypad && (
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
            <Button
              key={key}
              variant="secondary"
              size="lg"
              onClick={() => {
                // Send DTMF
              }}
              className="w-16 h-16 rounded-full text-2xl"
            >
              {key}
            </Button>
          ))}
        </div>
      )}

      {/* Quick Dispositions */}
      <div className="border-t border-white/10 pt-4 mt-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Disposition</h4>
        <div className="flex flex-wrap gap-2">
          {dispositionCodes.map((code) => (
            <Button
              key={code}
              variant="secondary"
              size="sm"
              onClick={() => {
                if (currentLead) {
                  dispatch(updateLeadStatus({
                    id: currentLead.id,
                    status: code === 'DNC' ? 'dnc' : 'contacted',
                    disposition: code,
                  }));
                }
              }}
            >
              {code}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
