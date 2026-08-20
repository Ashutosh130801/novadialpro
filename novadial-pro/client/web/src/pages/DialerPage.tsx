import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { callStart, callEnded, callMute, callHold, setDialMode } from '../store/slices/callSlice';

export const DialerPage: React.FC = () => {
  const dispatch = useDispatch();
  const { currentCall, status, isMuted, isOnHold, dialMode } = useSelector((state: RootState) => state.call);
  const { currentLead } = useSelector((state: RootState) => state.campaign);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'active' && currentCall?.startTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - (currentCall.startTime || 0)) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, currentCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = () => {
    if (status === 'idle' && phoneNumber) {
      dispatch(callStart({
        id: Date.now().toString(),
        participant: { id: '1', name: phoneNumber, number: phoneNumber },
        direction: 'outbound',
      }));
    } else if (status !== 'idle') {
      dispatch(callEnded());
      setCallDuration(0);
    }
  };

  const dialModes: Array<{ value: string; label: string }> = [
    { value: 'manual', label: 'Manual' },
    { value: 'preview', label: 'Preview' },
    { value: 'power', label: 'Power' },
    { value: 'progressive', label: 'Progressive' },
    { value: 'predictive', label: 'Predictive' },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Hero Dialer</h2>
          <p className="text-sm text-gray-400">Make calls with style</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={dialMode}
            onChange={(e) => dispatch(setDialMode(e.target.value as any))}
            className="input w-40"
          >
            {dialModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
          
          <div className={`px-3 py-1 rounded-full text-sm ${
            status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {status === 'active' ? '🟢 On Call' : '⚪ Available'}
          </div>
        </div>
      </div>

      {/* Main Dialer Area */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        {/* Left - Contact Info */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
          {currentLead ? (
            <div className="flex-1">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 mx-auto mb-4" />
              <p className="text-xl font-bold text-center">{currentLead.firstName} {currentLead.lastName}</p>
              <p className="text-gray-400 text-center">{currentLead.phone}</p>
              {currentLead.company && (
                <p className="text-sm text-gray-500 text-center mt-2">{currentLead.company}</p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No lead selected
            </div>
          )}
        </div>

        {/* Center - Call Controls */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          {status === 'idle' ? (
            <>
              <div className="text-6xl mb-8">📞</div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="input text-2xl text-center mb-6 w-full max-w-xs"
              />
              
              {/* Dial Pad */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <button
                    key={key}
                    onClick={() => setPhoneNumber(prev => prev + key)}
                    className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-2xl font-semibold transition-all"
                  >
                    {key}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleCall}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white text-3xl shadow-lg transition-all transform hover:scale-105"
              >
                📞
              </button>
            </>
          ) : (
            <>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-6 animate-pulse">
                <span className="text-5xl">📞</span>
              </div>
              
              <p className="text-3xl font-bold mb-2">{formatDuration(callDuration)}</p>
              <p className="text-gray-400 mb-8">
                {currentCall?.participant?.name || phoneNumber}
              </p>
              
              {/* Call Controls */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => dispatch(callMute())}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
                    isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {isMuted ? '🔇' : '🎤'}
                </button>
                
                <button
                  onClick={() => dispatch(callHold())}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
                    isOnHold ? 'bg-yellow-500 text-white' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  ⏸️
                </button>
                
                <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-xl transition-all">
                  ⌨️
                </button>
                
                <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-xl transition-all">
                  👥
                </button>
              </div>
              
              <button
                onClick={() => {
                  dispatch(callEnded());
                  setCallDuration(0);
                }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white text-3xl shadow-lg transition-all transform hover:scale-105"
              >
                📴
              </button>
            </>
          )}
        </div>

        {/* Right - Quick Actions */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            <button className="btn btn-secondary w-full justify-start">
              📝 Add Note
            </button>
            <button className="btn btn-secondary w-full justify-start">
              📅 Schedule Callback
            </button>
            <button className="btn btn-secondary w-full justify-start">
              📧 Send SMS
            </button>
            <button className="btn btn-secondary w-full justify-start">
              📊 View History
            </button>
          </div>
          
          <div className="mt-auto pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium mb-3 text-gray-400">Disposition</h4>
            <div className="space-y-2">
              <button className="btn btn-success w-full">✅ Interested</button>
              <button className="btn btn-secondary w-full">📅 Callback</button>
              <button className="btn btn-secondary w-full">❌ Not Interested</button>
              <button className="btn btn-danger w-full">🚫 DNC</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
