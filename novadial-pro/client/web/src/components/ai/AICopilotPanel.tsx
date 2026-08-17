import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { Button, Input, Card, Badge } from '../common/Button';
import { setCurrentLead, updateLeadStatus } from '../../store/slices/campaignSlice';
import { callStart } from '../../store/slices/callSlice';

interface ScriptStep {
  id: string;
  text: string;
  type: 'intro' | 'qualification' | 'pitch' | 'objection' | 'closing';
  nextSteps?: string[];
}

export const AICopilotPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { currentLead } = useSelector((state: RootState) => state.campaign);
  const { currentCall, status } = useSelector((state: RootState) => state.call);
  
  const [transcript, setTranscript] = useState<Array<{speaker: 'agent' | 'customer', text: string, timestamp: number}>>([]);
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [suggestedAction, setSuggestedAction] = useState<string>('');
  const [showScript, setShowScript] = useState(true);
  
  // Mock script for demo
  const scriptSteps: ScriptStep[] = [
    { id: '1', text: "Hello, this is [Agent Name] calling from [Company]. How are you today?", type: 'intro' },
    { id: '2', text: "I'm reaching out because we have a special offer that could benefit your business.", type: 'pitch' },
    { id: '3', text: "Would you be interested in learning more about how we can help reduce your costs by 30%?", type: 'qualification' },
    { id: '4', text: "I understand your concern. Many of our clients felt the same way initially, but they saw results within the first month.", type: 'objection' },
    { id: '5', text: "Great! Let me walk you through the next steps to get you started.", type: 'closing' },
  ];
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Simulate AI transcription and sentiment analysis
  React.useEffect(() => {
    if (status !== 'active') return;
    
    const interval = setInterval(() => {
      // Simulate incoming transcript
      const mockTranscripts = [
        { speaker: 'customer' as const, text: "Hi, I'm doing well, thanks.", timestamp: Date.now() },
        { speaker: 'customer' as const, text: "That sounds interesting, tell me more.", timestamp: Date.now() + 5000 },
        { speaker: 'customer' as const, text: "I'm concerned about the cost though.", timestamp: Date.now() + 10000 },
        { speaker: 'customer' as const, text: "Okay, that makes sense.", timestamp: Date.now() + 15000 },
      ];
      
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscript(prev => [...prev.slice(-10), randomTranscript]);
      
      // Update sentiment based on keywords
      const positiveWords = ['great', 'good', 'yes', 'interested', 'okay'];
      const negativeWords = ['no', 'not interested', 'expensive', 'busy'];
      
      const lastText = randomTranscript.text.toLowerCase();
      if (positiveWords.some(w => lastText.includes(w))) {
        setSentiment('positive');
        setSuggestedAction("Customer showing interest - move to closing!");
      } else if (negativeWords.some(w => lastText.includes(w))) {
        setSentiment('negative');
        setSuggestedAction("Address objection: Highlight ROI and offer trial period");
      } else {
        setSentiment('neutral');
        setSuggestedAction("Continue with qualification questions");
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  const handleSummarize = () => {
    // In real app, this would call AI API
    alert('Call summary: Customer showed initial interest but had cost concerns. Objection handled successfully. Recommended next step: Schedule demo.');
  };
  
  const handleLogNextSteps = () => {
    if (currentLead) {
      dispatch(updateLeadStatus({
        id: currentLead.id,
        status: 'qualified',
        notes: `Next steps: ${suggestedAction}`,
        nextCallback: Date.now() + 86400000, // 24 hours
      }));
    }
  };
  
  const getSentimentColor = () => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 bg-green-500/20';
      case 'negative': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };
  
  if (status !== 'active') {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* Sentiment & Suggestion */}
      <Card title="AI Copilot" subtitle="Real-time assistance">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={sentiment === 'positive' ? 'success' : sentiment === 'negative' ? 'danger' : 'default'}>
            {sentiment === 'positive' ? '😊 Positive' : sentiment === 'negative' ? '😟 Negative' : '😐 Neutral'}
          </Badge>
          <span className={`px-3 py-1 rounded-full text-sm ${getSentimentColor()}`}>
            Live Sentiment
          </span>
        </div>
        
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-violet-300 mb-1">💡 Suggested Action:</p>
          <p className="text-white">{suggestedAction || "Listening..."}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSummarize} className="flex-1">
            📝 Summarize
          </Button>
          <Button variant="secondary" size="sm" onClick={handleLogNextSteps} className="flex-1">
            ✅ Log Next Steps
          </Button>
        </div>
      </Card>
      
      {/* Live Transcript */}
      <Card title="Live Transcript" subtitle="Auto-generated">
        <div className="h-48 overflow-y-auto space-y-2 text-sm">
          {transcript.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Waiting for conversation...</p>
          ) : (
            transcript.map((t, i) => (
              <div key={i} className={`p-2 rounded-lg ${t.speaker === 'agent' ? 'bg-violet-500/10 ml-4' : 'bg-cyan-500/10 mr-4'}`}>
                <p className="font-medium text-xs text-gray-400">
                  {t.speaker === 'agent' ? '👤 You' : '👥 Customer'} • {new Date(t.timestamp).toLocaleTimeString()}
                </p>
                <p className="text-white mt-1">{t.text}</p>
              </div>
            ))
          )}
        </div>
      </Card>
      
      {/* Dynamic Script */}
      {showScript && (
        <Card 
          title="Call Script" 
          subtitle={`Step ${currentStepIndex + 1} of ${scriptSteps.length}`}
          action={
            <button onClick={() => setShowScript(false)} className="text-gray-400 hover:text-white">✕</button>
          }
        >
          <div className="space-y-3">
            {scriptSteps.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  index === currentStepIndex
                    ? 'bg-violet-500/20 border-violet-500'
                    : index < currentStepIndex
                    ? 'bg-green-500/10 border-green-500/30 opacity-60'
                    : 'bg-white/5 border-white/10'
                }`}
                onClick={() => setCurrentStepIndex(index)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={index === currentStepIndex ? 'info' : 'default'} size="sm">
                    {step.type}
                  </Badge>
                  {index < currentStepIndex && <span className="text-green-400 text-xs">✓ Completed</span>}
                </div>
                <p className={`text-sm ${index === currentStepIndex ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
            >
              ← Previous
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentStepIndex(Math.min(scriptSteps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === scriptSteps.length - 1}
              className="flex-1"
            >
              Next →
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
